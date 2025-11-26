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
    controls: any;

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

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);

        this.enable();
    }

    enable() {
        this.canvas.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);

        this.canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
        window.addEventListener("touchmove", this.onTouchMove, { passive: false });
        window.addEventListener("touchend", this.onTouchEnd);
    }

    disable() {
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);

        this.canvas.removeEventListener("touchstart", this.onTouchStart);
        window.removeEventListener("touchmove", this.onTouchMove);
        window.removeEventListener("touchend", this.onTouchEnd);
    }

    private updateMouseCoords(clientX: number, clientY: number) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    // --- TOUCH HANDLERS ---

    onTouchStart(event: TouchEvent) {
        // NEW: If multi-touch (pinch), ignore selection completely
        if (event.touches.length > 1) {
            // If we were already dragging a node with 1 finger, drop it now
            if (this.draggedNode) {
                this.onMouseUp();
            }
            return;
        }

        const touch = event.touches[0];
        this.updateMouseCoords(touch!.clientX, touch!.clientY);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.meshes, false);

        if (intersects.length > 0) {
            if (event.cancelable) event.preventDefault();
            this.onMouseDown(touch as any);
        } else {
            this.resetSelection();
            this.onNodeSelected(null);
        }
    }

    onTouchMove(event: TouchEvent) {
        // NEW: If multi-touch, abort drag if active
        if (event.touches.length > 1) {
            if (this.draggedNode) this.onMouseUp();
            return;
        }

        if (this.draggedNode) {
            if (event.cancelable) event.preventDefault();
            const touch = event.touches[0];
            this.onMouseMove(touch as any);
        }
    }

    onTouchEnd(event: TouchEvent) {
        this.onMouseUp();
    }

    // --- LOGIC ---

    onMouseDown(event: MouseEvent | Touch) {
        this.updateMouseCoords(event.clientX, event.clientY);
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.meshes, false);

        if (intersects.length > 0) {
            const hit = intersects[0];
            this.draggedNode = hit!.object as THREE.Mesh;

            if (this.controls) this.controls.enabled = false;

            const normal = new THREE.Vector3();
            this.camera.getWorldDirection(normal);
            this.dragPlane.setFromNormalAndCoplanarPoint(normal, this.draggedNode.position);

            if (this.raycaster.ray.intersectPlane(this.dragPlane, this.intersectionPoint)) {
                this.dragOffset.subVectors(this.draggedNode.position, this.intersectionPoint);
            }

            const nodeInstance = this.physics.nodes.find((n) => n.cube === this.draggedNode);
            if (nodeInstance) {
                this.physics.dragNode(nodeInstance, this.draggedNode.position.clone());
            }

            if (this.selectedMesh !== this.draggedNode) {
                this.resetSelection();
                this.highlightNode(this.draggedNode);
                if (this.draggedNode.userData) {
                    this.onNodeSelected(this.draggedNode.userData);
                }
            }
        } else {
            this.resetSelection();
            this.onNodeSelected(null);
        }
    }

    onMouseMove(event: MouseEvent | Touch) {
        if (!this.draggedNode) return;

        this.updateMouseCoords(event.clientX, event.clientY);
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
        if (this.draggedNode) {
            const nodeInstance = this.physics.nodes.find((n) => n.cube === this.draggedNode);
            if (nodeInstance) {
                this.physics.releaseNode(nodeInstance);
            }

            if (this.controls) this.controls.enabled = true;

            this.draggedNode = null;
        }
    }

    private highlightNode(mesh: THREE.Mesh) {
        this.selectedMesh = mesh;
        const material = mesh.material as THREE.MeshPhysicalMaterial;
        if (material.emissive) {
            this.originalEmissive.copy(material.emissive);
            this.originalIntensity = material.emissiveIntensity;
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
