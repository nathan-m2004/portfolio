import * as THREE from "three";
import { INode } from "./Node";

interface IConnection {
    mesh: THREE.Mesh;
    source: INode;
    target: INode;
}

export class PhysicsEngine {
    nodes: INode[] = [];
    connections: IConnection[] = [];

    // Internal state
    private velocities: Map<INode, THREE.Vector3> = new Map();

    // NEW: Map node to the 3D position the mouse is holding
    private draggedNodes: Map<INode, THREE.Vector3> = new Map();

    // Configuration
    public repulsion: number = 15;
    public springLength: number = 1.5;
    public springStrength: number = 5;
    public centerGravity: number = 150;

    // Drag Force Strength (How fast it chases the mouse)
    public dragStrength: number = 15;
    public dragCoefficient: number = 5;

    private maxVelocity: number = 20;

    constructor(nodes: INode[]) {
        this.nodes = nodes;
        this.nodes.forEach((node) => {
            this.velocities.set(node, new THREE.Vector3(0, 0, 0));
        });
    }

    addConnection(mesh: THREE.Mesh, source: INode, target: INode) {
        this.connections.push({ mesh, source, target });
    }

    // NEW: API for Elastic Dragging
    dragNode(node: INode, targetPosition: THREE.Vector3) {
        this.draggedNodes.set(node, targetPosition);
        // We do NOT zero out velocity here; we want it to maintain momentum
    }

    releaseNode(node: INode) {
        this.draggedNodes.delete(node);
    }

    update(delta: number) {
        const dt = Math.min(delta, 0.05);

        this.applyRepulsion(dt);
        this.applySprings(dt);
        this.applyCenterGravity(dt);
        this.applyDragForces(dt); // <--- New Force

        // Apply Velocity
        this.nodes.forEach((node) => {
            const velocity = this.velocities.get(node);
            if (!velocity) return;

            const frictionFactor = Math.exp(-this.dragCoefficient * dt);
            velocity.multiplyScalar(frictionFactor);
            velocity.clampLength(0, this.maxVelocity);

            // Move the node
            const move = velocity.clone().multiplyScalar(dt);
            node.cube.position.add(move);
        });

        this.updateConnections();
    }

    private applyDragForces(delta: number) {
        this.draggedNodes.forEach((targetPos, node) => {
            const velocity = this.velocities.get(node);
            if (!velocity) return;

            // Calculate vector from Node to Mouse Target
            const diff = new THREE.Vector3().subVectors(targetPos, node.cube.position);

            // Apply force (Hooks law: farther away = stronger pull)
            const force = diff.multiplyScalar(this.dragStrength * delta);

            velocity.add(force);
        });
    }

    private applyRepulsion(delta: number) {
        for (let i = 0; i < this.nodes.length; i++) {
            const nodeA = this.nodes[i];
            const velA = this.velocities.get(nodeA!)!;

            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeB = this.nodes[j];
                const velB = this.velocities.get(nodeB!)!;

                const diff = new THREE.Vector3().subVectors(nodeA!.cube.position, nodeB!.cube.position);
                const distSq = diff.lengthSq();

                if (distSq < 0.1) {
                    diff.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
                }

                const force = diff.normalize().multiplyScalar((this.repulsion * delta) / (distSq + 0.1));

                velA.add(force);
                velB.sub(force);
            }
        }
    }

    private applySprings(delta: number) {
        this.connections.forEach((conn) => {
            const sourceVel = this.velocities.get(conn.source)!;
            const targetVel = this.velocities.get(conn.target)!;
            const currentPosA = conn.source.cube.position;
            const currentPosB = conn.target.cube.position;

            const diff = new THREE.Vector3().subVectors(currentPosB, currentPosA);
            const dist = diff.length();
            const displacement = dist - this.springLength;
            const force = diff.normalize().multiplyScalar(displacement * (this.springStrength * delta));

            sourceVel.add(force);
            targetVel.sub(force);
        });
    }

    private applyCenterGravity(delta: number) {
        const center = new THREE.Vector3(0, 0, 0);
        this.nodes.forEach((node) => {
            const vel = this.velocities.get(node)!;
            const dir = new THREE.Vector3().subVectors(center, node.cube.position);
            vel.add(dir.multiplyScalar(this.centerGravity * delta * 0.01));
        });
    }

    private updateConnections() {
        this.connections.forEach((conn) => {
            const start = conn.source.cube.position;
            const end = conn.target.cube.position;
            const mesh = conn.mesh;
            const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            mesh.position.copy(midpoint);
            mesh.lookAt(end);
            const distance = start.distanceTo(end);
            mesh.scale.set(1, 1, distance);
        });
    }
}
