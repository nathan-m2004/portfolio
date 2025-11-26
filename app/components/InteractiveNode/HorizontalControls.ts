import * as THREE from "three";

export class HorizontalControls {
    camera: THREE.OrthographicCamera;
    canvas: HTMLCanvasElement;

    // State
    isDragging: boolean = false;
    previousMouseX: number = 0;
    previousMouseY: number = 0;

    // Touch State for Directional Locking
    private touchStartX: number = 0;
    private touchStartY: number = 0;
    private isScrollGesture: boolean = false; // True if user is scrolling vertically

    // Pinch State
    private previousPinchDist: number = 0;

    public enabled: boolean = true;

    // Physics parameters
    velocity: number = 0;
    friction: number = 0.95;
    sensitivity: number = 0.002;

    // Zoom parameters
    zoomSensitivity: number = 0.01;
    minZoom: number = 0.6;
    maxZoom: number = 1.5;

    target: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

    constructor(camera: THREE.OrthographicCamera, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.canvas = canvas;

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);

        this.addEventListeners();
    }

    addEventListeners() {
        this.canvas.addEventListener("mousedown", this.onMouseDown);
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);

        // Passive: false is crucial to allow preventDefault() when we decide to rotate
        this.canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
        window.addEventListener("touchmove", this.onTouchMove, { passive: false });
        window.addEventListener("touchend", this.onTouchEnd);
    }

    // --- TOUCH HANDLERS ---

    getPinchDistance(touch1: Touch, touch2: Touch) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    onTouchStart(event: TouchEvent) {
        if (!this.enabled) return;

        // RESET directional flags
        this.isScrollGesture = false;
        this.isDragging = false; // Don't start dragging immediately

        // We do NOT call preventDefault() here.
        // We must wait for the first move to decide if it's a scroll or a rotate.

        if (event.touches.length === 2) {
            // Pinch is always a canvas interaction
            event.preventDefault();
            this.previousPinchDist = this.getPinchDistance(event.touches[0]!, event.touches[1]!);
        } else if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.touchStartX = touch!.clientX;
            this.touchStartY = touch!.clientY;

            // Prime the mouse coordinates so if we DO start rotating, it doesn't jump
            this.previousMouseX = touch!.clientX;
            this.previousMouseY = touch!.clientY;
        }
    }

    onTouchMove(event: TouchEvent) {
        if (!this.enabled) return;

        // 1. Handle Pinch (Always blocks scroll)
        if (event.touches.length === 2) {
            event.preventDefault();
            const currentDist = this.getPinchDistance(event.touches[0]!, event.touches[1]!);
            const delta = currentDist - this.previousPinchDist;

            const zoomChange = delta * this.zoomSensitivity * 0.5;
            const newZoom = this.camera.zoom + zoomChange;

            this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
            this.camera.updateProjectionMatrix();

            this.previousPinchDist = currentDist;
            return;
        }

        // 2. Handle Single Finger
        if (event.touches.length === 1) {
            // If we already decided this is a vertical scroll, ignore everything and let browser scroll
            if (this.isScrollGesture) return;

            const touch = event.touches[0];
            const dx = touch!.clientX - this.touchStartX;
            const dy = touch!.clientY - this.touchStartY;

            // If we haven't decided yet (neither dragging nor scrolling)...
            if (!this.isDragging) {
                // Check if user has moved enough to make a decision
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    if (Math.abs(dy) > Math.abs(dx)) {
                        // Vertical movement detected -> It's a Scroll!
                        this.isScrollGesture = true;
                        return; // Exit and let browser scroll
                    } else {
                        // Horizontal movement detected -> It's a Rotate!
                        this.isDragging = true;
                        // Now we block scrolling for the rest of this touch
                        if (event.cancelable) event.preventDefault();
                    }
                }
            } else {
                // We are in Drag Mode -> Rotate
                if (event.cancelable) event.preventDefault();
                this.onMouseMove(touch!);
            }
        }
    }

    onTouchEnd(event: TouchEvent) {
        this.onMouseUp();
        this.isScrollGesture = false;
    }

    // --- MOUSE HANDLERS ---

    onMouseDown(event: MouseEvent | Touch) {
        if (!this.enabled) return;

        this.isDragging = true;
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
        this.velocity = 0;
        this.canvas.style.cursor = "grabbing";
    }

    onMouseMove(event: MouseEvent | Touch) {
        if (!this.enabled) {
            this.isDragging = false;
            return;
        }

        if (!this.isDragging) return;

        const currentMouseX = event.clientX;
        const currentMouseY = event.clientY;

        const deltaX = currentMouseX - this.previousMouseX;
        const deltaY = currentMouseY - this.previousMouseY;

        // Rotation (X-axis move)
        const deltaAngle = -deltaX * this.sensitivity;
        this.rotateCamera(deltaAngle);
        this.velocity = deltaAngle;

        if (Math.abs(deltaY) > 1 && event instanceof MouseEvent) {
            const zoomChange = -deltaY * this.zoomSensitivity;
            const newZoom = this.camera.zoom + zoomChange;
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

    rotateCamera(angle: number) {
        const offset = this.camera.position.clone().sub(this.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
    }

    update(delta: number) {
        if (!this.isDragging) {
            this.rotateCamera(this.velocity);
            const timeScale = delta * 60;
            this.velocity *= Math.pow(this.friction, timeScale);

            if (Math.abs(this.velocity) < 0.0001) this.velocity = 0;
        }
    }

    dispose() {
        this.canvas.removeEventListener("mousedown", this.onMouseDown);
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);

        this.canvas.removeEventListener("touchstart", this.onTouchStart);
        window.removeEventListener("touchmove", this.onTouchMove);
        window.removeEventListener("touchend", this.onTouchEnd);
    }
}
