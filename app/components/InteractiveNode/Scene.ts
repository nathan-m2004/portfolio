import * as THREE from "three";
import { INode } from "./Node";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { InteractionManager } from "./InteractionManager";
import { PhysicsEngine } from "./PhysicsEngine";
import { HorizontalControls } from "./HorizontalControls";

export type NodesType = NodeType[];
export type NodeType = { name: string; description: string; size: number; color: string; attach: string[] };

export class InfrastructureScene {
    canvas!: HTMLCanvasElement;
    scene!: THREE.Scene<THREE.Object3DEventMap>;
    camera!: THREE.OrthographicCamera;
    renderer!: THREE.WebGLRenderer;
    cube!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial, THREE.Object3DEventMap>;
    nodes!: INode[];
    interaction!: InteractionManager;
    physics!: PhysicsEngine;
    controls!: HorizontalControls;
    clock!: THREE.Clock;

    // Track the animation frame ID so we can stop it
    private animationId: number = 0;

    constructor(canvasElement: HTMLCanvasElement, nodes: NodesType, callbackFn: (data: any) => void) {
        if (!canvasElement) {
            console.error("Canvas element not found");
            return;
        }

        this.canvas = canvasElement;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x111111, 10, 50); // Depth cues
        this.clock = new THREE.Clock();

        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = aspect < 1 ? 15 : 9;
        this.camera = new THREE.OrthographicCamera(
            (frustumSize * aspect) / -2, // left
            (frustumSize * aspect) / 2, // right
            frustumSize / 2, // top
            frustumSize / -2, // bottom
            0.1, // near
            1000 // far
        );
        this.camera.position.set(5, 5, 5); // Isometric-style angle
        this.camera.lookAt(0, 0, 0);

        this.controls = new HorizontalControls(this.camera, this.canvas);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        this.setupLights();

        const nodeMap = new Map<string, INode>();
        this.nodes = [];
        nodes.forEach((data) => {
            const instance = new INode(data, this.scene);
            this.nodes.push(instance);

            // Store in map for easy retrieval later
            if (data.name) {
                nodeMap.set(data.name, instance);
            }
        });

        this.physics = new PhysicsEngine(this.nodes);

        this.nodes.forEach((nodeInstance) => {
            nodeInstance.parameters.attach.forEach((attach) => {
                const targetNode = nodeMap.get(attach);
                if (targetNode) {
                    nodeInstance.attachedNodes.push(targetNode);
                    const connectorMesh = this.createConnection(nodeInstance, targetNode);

                    this.physics.addConnection(connectorMesh, nodeInstance, targetNode);
                } else {
                    console.warn(`Node ${nodeInstance.parameters.name} tries to attach to missing node: ${attach}`);
                }
            });
        });

        const nodeMeshes = this.nodes.map((node) => node.cube);
        this.interaction = new InteractionManager(
            this.camera,
            this.canvas,
            nodeMeshes,
            this.physics,
            this.controls,
            callbackFn
        );

        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        window.addEventListener("resize", this.onWindowResize);

        this.animate();
    }
    createConnection(nodeA: INode, nodeB: INode) {
        const start = nodeA.cube.position.clone();
        const end = nodeB.cube.position.clone();
        const distance = start.distanceTo(end);

        // 1. Create Cylinder
        // segmentsHeight = 1 (Last parameter) ensures a smooth gradient across the single segment
        const geometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 8, 1);

        // 2. Prepare Colors
        // Ensure we create THREE.Color instances from your parameter data
        const colorA = new THREE.Color(nodeA.parameters.color);
        const colorB = new THREE.Color(nodeB.parameters.color);

        const count = geometry.attributes.position!.count;
        const colors: number[] = [];
        const posAttribute = geometry.attributes.position;

        // 3. Assign Vertex Colors
        for (let i = 0; i < count; i++) {
            // The cylinder is created along the Y axis centered at 0.
            // Y > 0 is the top half, Y < 0 is the bottom half.
            const y = posAttribute!.getY(i);

            if (y > 0) {
                // Top of cylinder (Node B side)
                colors.push(colorB.r, colorB.g, colorB.b);
            } else {
                // Bottom of cylinder (Node A side)
                colors.push(colorA.r, colorA.g, colorA.b);
            }
        }

        // Add the color attribute to the geometry
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

        // 4. Rotate Geometry
        // We rotate the GEOMETRY 90 deg so it lays flat on Z-axis for lookAt to work
        // Important: Do this AFTER setting colors, or the Y-check above will be wrong
        geometry.rotateX(Math.PI / 2);

        // 5. Material with Vertex Colors enabled
        const material = new THREE.MeshBasicMaterial({
            vertexColors: true, // <--- This is the magic switch
            transparent: true,
            opacity: 0.6,
        });

        const connector = new THREE.Mesh(geometry, material);

        // 6. Position & Orientation
        const midpoint = start.add(end).multiplyScalar(0.5);
        connector.position.copy(midpoint);
        connector.lookAt(nodeB.cube.position);

        this.scene.add(connector);

        return connector;
    }
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 15);
        ambientLight.color.setHSL(0.5, 0.7, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x00ccff, 2);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);
    }

    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 5;

        this.camera.left = (-frustumSize * aspect) / 2;
        this.camera.right = (frustumSize * aspect) / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        // Save ID to cancel later
        this.animationId = requestAnimationFrame(this.animate);

        const delta = this.clock.getDelta();

        this.controls.update(delta);

        this.physics.update(delta);

        this.nodes.forEach((node) => {
            if (node.cube) {
                node.cube.rotation.x += 0.5 * delta;
                node.cube.rotation.y += 0.1 * delta;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        // 1. Stop the animation loop
        cancelAnimationFrame(this.animationId);

        // 2. Remove DOM event listeners
        window.removeEventListener("resize", this.onWindowResize);

        // 3. Clean up custom control systems
        if (this.controls && typeof this.controls.dispose === "function") {
            this.controls.dispose();
        }

        if (this.interaction) {
            this.interaction.disable(); // Stop listening to mouse events
        }

        // 4. Dispose of Three.js Scene Resources (Memory Cleanup)
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();

                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach((mat) => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });

        // 5. Dispose of the Renderer
        this.renderer.dispose();

        // Optional: Remove canvas from DOM if you appended it manually,
        // but since we passed a ref, we leave that to Vue/React.
    }
}
