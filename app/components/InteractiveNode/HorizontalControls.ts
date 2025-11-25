import * as THREE from "three";

export class HorizontalControls {
    camera: THREE.OrthographicCamera;
    canvas: HTMLCanvasElement;

    // State
    isDragging: boolean = false;
    previousMouseX: number = 0;
    previousMouseY: number = 0; // NEW: Track Y for zoom

    // Physics parameters
    velocity: number = 0; // Current angular velocity
    friction: number = 0.92; // How fast it slows down (0.0 - 1.0)
    sensitivity: number = 0.002; // Radians per pixel

    // NEW: Zoom parameters (No longer using wheel speed)
    zoomSensitivity: number = 0.0005;
    minZoom: number = 0.75;
    maxZoom: number = 1.25;

    // The point the camera orbits around
    target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    constructor(camera: THREE.OrthographicCamera, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.canvas = canvas;

        // Bind events
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.addEventListeners();
    }

    addEventListeners() {
        this.canvas.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);

        // Touch support
        this.canvas.addEventListener("touchstart", (e) => this.onMouseDown(e.touches[0]!));
        window.addEventListener("touchmove", (e) => this.onMouseMove(e.touches[0]!));
        window.addEventListener("touchend", this.onMouseUp);
    }

    onMouseDown(event: MouseEvent | Touch) {
        this.isDragging = true;
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY; // Capture initial Y
        this.velocity = 0;
        this.canvas.style.cursor = "grabbing";
    }

    onMouseMove(event: MouseEvent | Touch) {
        if (!this.isDragging) return;

        const currentMouseX = event.clientX;
        const currentMouseY = event.clientY;

        const deltaX = currentMouseX - this.previousMouseX;
        const deltaY = currentMouseY - this.previousMouseY;

        // --- 1. Rotation (X-Axis Drag) ---
        // Only rotate if moving horizontally
        const deltaAngle = -deltaX * this.sensitivity;
        this.rotateCamera(deltaAngle);
        this.velocity = deltaAngle;

        // --- 2. Zoom (Y-Axis Drag) ---
        // Drag Up (Negative Delta) -> Zoom In
        // Drag Down (Positive Delta) -> Zoom Out
        if (Math.abs(deltaY) > 0) {
            const zoomChange = -deltaY * this.zoomSensitivity;
            const newZoom = this.camera.zoom + zoomChange;

            // Clamp and Apply
            this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
            this.camera.updateProjectionMatrix();
        }

        this.previousMouseX = currentMouseX;
        this.previousMouseY = currentMouseY;
    }

    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = "grab";
    }

    // Rotates the camera around the target on the Y axis
    rotateCamera(angle: number) {
        const offset = this.camera.position.clone().sub(this.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
    }

    update(delta: number) {
        // Inertia only applies to rotation (feels more natural than zooming inertia)
        if (!this.isDragging) {
            this.rotateCamera(this.velocity * delta);
            this.velocity *= this.friction;

            if (Math.abs(this.velocity) < 0.0001) {
                this.velocity = 0;
            }
        }
    }

    dispose() {
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    }
}
