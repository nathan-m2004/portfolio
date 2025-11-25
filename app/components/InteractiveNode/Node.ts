import * as THREE from "three";

import type { NodeType } from "./Scene";

export class INode {
    cube!: THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial, THREE.Object3DEventMap>;
    scene: THREE.Scene<THREE.Object3DEventMap>;
    parameters: NodeType;
    attachedNodes: INode[];
    constructor(node: NodeType, scene: THREE.Scene<THREE.Object3DEventMap>) {
        this.scene = scene;
        this.parameters = node;
        this.attachedNodes = [];

        this.loadIntoScene();
        this.addLabel();
    }
    loadIntoScene() {
        const geometry = new THREE.BoxGeometry(
            0.4 * this.parameters.size,
            0.4 * this.parameters.size,
            0.4 * this.parameters.size
        );

        // CHANGE 1: Create a THREE.Color object explicitly.
        // This allows Three.js to parse HSL strings like "hsl(200, 50%, 50%)" automatically.
        const baseColor = new THREE.Color(this.parameters.color);

        // ALTERNATIVE: If this.parameters.color is just a Hue number (0.0 - 1.0)
        // baseColor.setHSL(this.parameters.color, 1.0, 0.5);

        // 1. Use MeshPhysicalMaterial for advanced lighting
        const material = new THREE.MeshPhysicalMaterial({
            color: baseColor, // Pass the converted color object
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.9,
            thickness: 0.5,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: 0x001133,
            ior: 1.5,
        });

        this.cube = new THREE.Mesh(geometry, material);
        this.cube.userData = this.parameters;
        this.scene.add(this.cube);

        // 2. Use EdgesGeometry
        const edges = new THREE.EdgesGeometry(geometry);

        // CHANGE 2: Fix the reference. Meshes don't have .color, pass the baseColor object.
        const lineMat = new THREE.LineBasicMaterial({
            color: baseColor,
            transparent: true,
            opacity: 0.5,
        });

        // Now this works safely because lineMat.color is definitely a THREE.Color instance
        lineMat.color.offsetHSL(0.2, 0.2, 0.3);

        const line = new THREE.LineSegments(edges, lineMat);
        this.cube.add(line);
    }
    addLabel() {
        const text = this.parameters.name || "N/A";

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        const fontSize = 130;
        const width = 1080;
        const height = 1080;
        canvas.width = width;
        canvas.height = height;

        // 3. Draw text
        context.font = `${fontSize}px Montserrat, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";

        context.fillStyle = "white";
        context.fillText(text, width / 2, height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });

        const sprite = new THREE.Sprite(material);
        sprite.renderOrder = 1;

        const aspectRatio = width / height;
        const scaleFactor = 1.2; // Adjust size relative to cube

        sprite.scale.set(scaleFactor * aspectRatio, scaleFactor, 1);
        sprite.position.set(0, 0, 0);

        this.cube.add(sprite);
    }
}
