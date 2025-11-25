import * as THREE from "three";
import { PhysicsEngine } from "./PhysicsEngine";
import type { HorizontalControls } from "./HorizontalControls";

export class InteractionManager {
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    camera: THREE.Camera;
    canvas: HTMLCanvasElement;
    meshes: THREE.Mesh[];
    onNodeSelected: (data: any) => void;

    physics: PhysicsEngine;
    controls: any; // HorizontalControls or OrbitControls

    // Drag State
    private draggedNode: THREE.Mesh | null = null;
    private dragPlane: THREE.Plane = new THREE.Plane();
    private dragOffset: THREE.Vector3 = new THREE.Vector3();
    private intersectionPoint: THREE.Vector3 = new THREE.Vector3();

    // Selection/Emissive State
    private selectedMesh: THREE.Mesh | null = null;
    private originalEmissive: THREE.Color = new THREE.Color();
    private originalIntensity: number = 1;

    constructor(
        camera: THREE.Camera,
        canvas: HTMLCanvasElement,
        meshes: THREE.Mesh[],
        physics: PhysicsEngine,
        controls: HorizontalControls,
        onNodeSelected: (data: any) => void
    ) {
        this.camera = camera;
        this.canvas = canvas;
        this.meshes = meshes;
        this.physics = physics;
        this.controls = controls;
        this.onNodeSelected = onNodeSelected;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.enable();
    }

    enable() {
        this.canvas.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
    }

    disable() {
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    }

    private updateMouse(event: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onMouseDown(event: MouseEvent) {
        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.meshes, false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            this.draggedNode = hit!.object as THREE.Mesh;

            // 1. Disable Camera Controls (Stop rotation/zoom)
            if (this.controls) this.controls.dispose();

            // 2. Setup Drag Plane
            const normal = new THREE.Vector3();
            this.camera.getWorldDirection(normal);
            this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.draggedNode.position);

            // 3. Calculate Offset
            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
                this.dragOffset.subVectors(this.draggedNode.position, this.intersectionPoint);
            }

            // 4. Physics Drag
            const nodeInstance = this.physics.nodes.find((n) => n.cube === this.draggedNode);
            if (nodeInstance) {
                this.physics.dragNode(nodeInstance, this.draggedNode.position.clone());
            }

            // 5. Highlight & Select (Emissive Effect)
            if (this.selectedMesh !== this.draggedNode) {
                this.resetSelection();
                this.highlightNode(this.draggedNode);

                if (this.draggedNode.userData) {
                    this.onNodeSelected(this.draggedNode.userData);
                }
            }
        } else {
            // Clicked Empty Space
            this.resetSelection();
            this.onNodeSelected(null);
        }
    }

    onMouseMove(event: MouseEvent) {
        if (!this.draggedNode) return;

        this.updateMouse(event);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
            const targetPos = new THREE.Vector3().addVectors(this.intersectionPoint, this.dragOffset);

            const nodeInstance = this.physics.nodes.find((n) => n.cube === this.draggedNode);
            if (nodeInstance) {
                this.physics.dragNode(nodeInstance, targetPos);
            }
        }
    }

    onMouseUp() {
        // We release drag, but we KEEP the selection highlight active
        if (this.draggedNode) {
            const nodeInstance = this.physics.nodes.find((n) => n.cube === this.draggedNode);
            if (nodeInstance) {
                this.physics.releaseNode(nodeInstance);
            }

            // Re-enable controls so the user can rotate again
            if (this.controls) this.controls.addEventListeners();

            this.draggedNode = null;
        }
    }

    // --- Emissive Highlight Logic ---

    private highlightNode(mesh: THREE.Mesh) {
        this.selectedMesh = mesh;

        const material = mesh.material as THREE.MeshPhysicalMaterial;

        // Check if material has emissive properties
        if (material.emissive) {
            this.originalEmissive.copy(material.emissive);
            this.originalIntensity = material.emissiveIntensity;

            // Set to Gold/Orange glow
            material.emissive.setHSL(0, 0.5, 1);
            material.emissiveIntensity = 2.5;
        }
    }

    private resetSelection() {
        if (this.selectedMesh) {
            const material = this.selectedMesh.material as THREE.MeshPhysicalMaterial;

            if (material.emissive) {
                material.emissive.copy(this.originalEmissive);
                material.emissiveIntensity = this.originalIntensity;
            }

            this.selectedMesh = null;
        }
    }
}
