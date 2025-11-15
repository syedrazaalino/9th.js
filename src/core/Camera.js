/**
 * Camera - Base camera class with view and projection matrices
 * Provides camera functionality including frustum culling, different projection types
 */
import { Object3D } from './Object3D.js';

export class Camera extends Object3D {
    constructor() {
        super();

        // Camera properties
        this.type = 'Camera';
        this.isCamera = true;

        // View and projection matrices
        this.viewMatrix = this.createIdentityMatrix();
        this.projectionMatrix = this.createIdentityMatrix();
        this.viewProjectionMatrix = this.createIdentityMatrix();
        this.inverseViewMatrix = this.createIdentityMatrix();

        // Matrix update flags
        this.viewMatrixDirty = true;
        this.projectionMatrixDirty = true;
        this.viewProjectionMatrixDirty = true;
        this.inverseViewMatrixDirty = true;

        // Camera settings
        this.fov = 75 * Math.PI / 180; // Field of view in radians
        this.aspect = 1.0; // Aspect ratio (width/height)
        this.near = 0.1; // Near clipping plane
        this.far = 1000; // Far clipping plane

        // Projection type
        this.projectionType = 'perspective'; // 'perspective' or 'orthographic'

        // Orthographic settings (used when projectionType is 'orthographic')
        this.orthographicSize = 10;

        // Camera control
        this.controls = null; // Camera controller
        this.lookAtTarget = null;

        // Rendering settings
        this.layers = [0]; // Render layers (for layer-based rendering)
        this.clearColor = true;
        this.clearDepth = true;
        this.clearStencil = false;

        // Post-processing
        this.postProcessingEnabled = false;
        this.renderTarget = null;

        // Stereo rendering (for VR)
        this.stereo = {
            enabled: false,
            eyeSeparation: 0.064, // meters
            focalLength: 0.1
        };
    }

    /**
     * Set perspective projection
     */
    setPerspective(fov, aspect, near, far) {
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.projectionType = 'perspective';
        this.markProjectionDirty();
        return this;
    }

    /**
     * Set orthographic projection
     */
    setOrthographic(size, aspect, near, far) {
        this.orthographicSize = size;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
        this.projectionType = 'orthographic';
        this.markProjectionDirty();
        return this;
    }

    /**
     * Set aspect ratio
     */
    setAspectRatio(aspect) {
        this.aspect = aspect;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Set clipping planes
     */
    setClippingPlanes(near, far) {
        this.near = near;
        this.far = far;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Set FOV (field of view)
     */
    setFov(fov) {
        this.fov = fov;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Mark projection matrix as needing update
     */
    markProjectionDirty() {
        this.projectionMatrixDirty = true;
        this.viewProjectionMatrixDirty = true;
    }

    /**
     * Mark view matrix as needing update
     */
    markViewDirty() {
        this.viewMatrixDirty = true;
        this.inverseViewMatrixDirty = true;
        this.viewProjectionMatrixDirty = true;
    }

    /**
     * Update camera matrices
     */
    updateMatrix() {
        super.updateMatrix();
        
        // Update view matrix if needed
        if (this.viewMatrixDirty) {
            this.updateViewMatrix();
            this.viewMatrixDirty = false;
        }

        // Update projection matrix if needed
        if (this.projectionMatrixDirty) {
            this.updateProjectionMatrix();
            this.projectionMatrixDirty = false;
        }

        // Update view-projection matrix if needed
        if (this.viewProjectionMatrixDirty) {
            this.updateViewProjectionMatrix();
            this.viewProjectionMatrixDirty = false;
        }

        // Update inverse view matrix if needed
        if (this.inverseViewMatrixDirty) {
            this.updateInverseViewMatrix();
            this.inverseViewMatrixDirty = false;
        }
    }

    /**
     * Update view matrix (camera's view of the world)
     */
    updateViewMatrix() {
        // View matrix is the inverse of the camera's world matrix
        this.viewMatrix = this.invertMatrix(this.worldMatrix);
    }

    /**
     * Update projection matrix
     */
    updateProjectionMatrix() {
        if (this.projectionType === 'perspective') {
            this.updatePerspectiveMatrix();
        } else {
            this.updateOrthographicMatrix();
        }
    }

    /**
     * Update perspective projection matrix
     */
    updatePerspectiveMatrix() {
        const f = 1.0 / Math.tan(this.fov / 2);
        const nf = 1 / (this.near - this.far);

        this.projectionMatrix[0] = f / this.aspect;
        this.projectionMatrix[5] = f;
        this.projectionMatrix[10] = (this.far + this.near) * nf;
        this.projectionMatrix[11] = -1;
        this.projectionMatrix[14] = (2 * this.far * this.near) * nf;
        this.projectionMatrix[15] = 0;

        // Clear other elements
        for (let i = 0; i < 16; i++) {
            if (i !== 0 && i !== 5 && i !== 10 && i !== 11 && i !== 14 && i !== 15) {
                this.projectionMatrix[i] = 0;
            }
        }
    }

    /**
     * Update orthographic projection matrix
     */
    updateOrthographicMatrix() {
        const halfHeight = this.orthographicSize / 2;
        const halfWidth = halfHeight * this.aspect;
        const nf = 1 / (this.near - this.far);

        this.projectionMatrix[0] = 1 / halfWidth;
        this.projectionMatrix[5] = 1 / halfHeight;
        this.projectionMatrix[10] = 2 * nf;
        this.projectionMatrix[14] = (this.far + this.near) * nf;
        this.projectionMatrix[15] = 1;

        // Clear other elements
        for (let i = 0; i < 16; i++) {
            if (i !== 0 && i !== 5 && i !== 10 && i !== 14 && i !== 15) {
                this.projectionMatrix[i] = 0;
            }
        }
    }

    /**
     * Update view-projection matrix
     */
    updateViewProjectionMatrix() {
        this.viewProjectionMatrix = this.multiplyMatrices(this.projectionMatrix, this.viewMatrix);
    }

    /**
     * Update inverse view matrix
     */
    updateInverseViewMatrix() {
        this.inverseViewMatrix = this.invertMatrix(this.viewMatrix);
    }

    /**
     * Matrix inversion (4x4)
     */
    invertMatrix(matrix) {
        const result = new Float32Array(16);

        const a00 = matrix[0], a01 = matrix[1], a02 = matrix[2], a03 = matrix[3];
        const a10 = matrix[4], a11 = matrix[5], a12 = matrix[6], a13 = matrix[7];
        const a20 = matrix[8], a21 = matrix[9], a22 = matrix[10], a23 = matrix[11];
        const a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15];

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            return this.createIdentityMatrix();
        }

        det = 1.0 / det;

        result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

        return result;
    }

    /**
     * Get camera frustum for culling
     */
    getFrustum() {
        this.updateMatrix();

        const planes = [];
        const vp = this.viewProjectionMatrix;

        // Extract frustum planes
        const combinations = [
            [vp[3] - vp[0], vp[7] - vp[4], vp[11] - vp[8], vp[15] - vp[12]], // Left
            [vp[3] + vp[0], vp[7] + vp[4], vp[11] + vp[8], vp[15] + vp[12]], // Right
            [vp[3] + vp[1], vp[7] + vp[5], vp[11] + vp[9], vp[15] + vp[13]], // Bottom
            [vp[3] - vp[1], vp[7] - vp[5], vp[11] - vp[9], vp[15] - vp[13]], // Top
            [vp[3] - vp[2], vp[7] - vp[6], vp[11] - vp[10], vp[15] - vp[14]], // Near
            [vp[3] + vp[2], vp[7] + vp[6], vp[11] + vp[10], vp[15] + vp[14]]  // Far
        ];

        for (let i = 0; i < 6; i++) {
            const c = combinations[i];
            const length = Math.sqrt(c[0] * c[0] + c[1] * c[1] + c[2] * c[2]);
            
            planes.push({
                a: c[0] / length,
                b: c[1] / length,
                c: c[2] / length,
                d: c[3] / length
            });
        }

        return { planes };
    }

    /**
     * Get distance from camera to object
     */
    getDistanceTo(object) {
        const cameraPos = this.getWorldPosition();
        const objectPos = object.getWorldPosition();
        
        const dx = objectPos.x - cameraPos.x;
        const dy = objectPos.y - cameraPos.y;
        const dz = objectPos.z - cameraPos.z;
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Get ray from camera through screen point
     */
    getRay(screenX, screenY, width, height) {
        this.updateMatrix();

        // Convert screen coordinates to normalized device coordinates
        const x = (2 * screenX) / width - 1;
        const y = 1 - (2 * screenY) / height;

        // Transform to world coordinates
        const invVP = this.invertMatrix(this.viewProjectionMatrix);
        
        const nearPoint = this.unproject(x, y, -1, invVP);
        const farPoint = this.unproject(x, y, 1, invVP);

        const direction = {
            x: farPoint.x - nearPoint.x,
            y: farPoint.y - nearPoint.y,
            z: farPoint.z - nearPoint.z
        };

        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        direction.x /= length;
        direction.y /= length;
        direction.z /= length;

        return {
            origin: nearPoint,
            direction: direction
        };
    }

    /**
     * Unproject screen coordinates to world coordinates
     */
    unproject(x, y, z, inverseMatrix) {
        const vector = new Float32Array([x, y, z, 1]);
        const result = new Float32Array(4);

        // Multiply by inverse matrix
        for (let i = 0; i < 4; i++) {
            result[i] = 
                inverseMatrix[i * 4 + 0] * vector[0] +
                inverseMatrix[i * 4 + 1] * vector[1] +
                inverseMatrix[i * 4 + 2] * vector[2] +
                inverseMatrix[i * 4 + 3] * vector[3];
        }

        // Perspective divide
        result[0] /= result[3];
        result[1] /= result[3];
        result[2] /= result[3];

        return {
            x: result[0],
            y: result[1],
            z: result[2]
        };
    }

    /**
     * Project world coordinates to screen coordinates
     */
    project(worldX, worldY, worldZ, width, height) {
        this.updateMatrix();

        const vector = new Float32Array([worldX, worldY, worldZ, 1]);
        const result = new Float32Array(4);

        // Multiply by view-projection matrix
        for (let i = 0; i < 4; i++) {
            result[i] = 
                this.viewProjectionMatrix[i * 4 + 0] * vector[0] +
                this.viewProjectionMatrix[i * 4 + 1] * vector[1] +
                this.viewProjectionMatrix[i * 4 + 2] * vector[2] +
                this.viewProjectionMatrix[i * 4 + 3] * vector[3];
        }

        // Perspective divide
        result[0] /= result[3];
        result[1] /= result[3];
        result[2] /= result[3];

        return {
            x: (result[0] + 1) * width / 2,
            y: (1 - result[1]) * height / 2,
            z: result[2]
        };
    }

    /**
     * Check if object is visible in camera
     */
    isObjectVisible(object) {
        const frustum = this.getFrustum();
        const worldPos = object.getWorldPosition();
        const worldScale = object.getWorldScale();
        const radius = Math.max(worldScale.x, worldScale.y, worldScale.z);

        for (let plane of frustum.planes) {
            const distance = this.distanceToPlane(worldPos, plane);
            if (distance < -radius) {
                return false;
            }
        }

        return true;
    }

    /**
     * Distance to plane calculation
     */
    distanceToPlane(point, plane) {
        return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d;
    }

    /**
     * Mark all matrices as needing update (override parent)
     */
    markMatrixDirty() {
        super.markMatrixDirty();
        this.markViewDirty();
    }

    /**
     * Update method
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update camera controls
        if (this.controls && this.controls.update) {
            this.controls.update(deltaTime);
        }

        // Update look-at target if set
        if (this.lookAtTarget) {
            this.lookAt(this.lookAtTarget);
        }
    }

    /**
     * Render method
     */
    render(scene) {
        // Camera-specific rendering logic
        // This might handle camera-specific effects, post-processing, etc.
    }

    /**
     * Set camera controls
     */
    setControls(controls) {
        this.controls = controls;
        if (controls && controls.setCamera) {
            controls.setCamera(this);
        }
    }

    /**
     * Set look-at target
     */
    setLookAtTarget(target) {
        this.lookAtTarget = target;
        return this;
    }

    /**
     * Clear look-at target
     */
    clearLookAtTarget() {
        this.lookAtTarget = null;
        return this;
    }

    /**
     * Get camera world position (override parent)
     */
    getWorldPosition() {
        this.updateMatrix();
        return {
            x: this.worldMatrix[12],
            y: this.worldMatrix[13],
            z: this.worldMatrix[14]
        };
    }

    /**
     * Get camera forward direction (-Z)
     */
    getWorldDirection() {
        return this.getWorldForward();
    }

    /**
     * Enable stereo rendering (for VR)
     */
    enableStereo(enabled, eyeSeparation = 0.064) {
        this.stereo.enabled = enabled;
        this.stereo.eyeSeparation = eyeSeparation;
    }

    /**
     * Get left eye camera for stereo rendering
     */
    getLeftEye() {
        if (!this.stereo.enabled) return this;

        const leftEye = new Camera();
        leftEye.setFrom(this);
        
        const right = this.getWorldRight();
        const offset = -this.stereo.eyeSeparation * 0.5;
        
        const pos = this.getWorldPosition();
        leftEye.setPosition(
            pos.x + right.x * offset,
            pos.y + right.y * offset,
            pos.z + right.z * offset
        );

        return leftEye;
    }

    /**
     * Get right eye camera for stereo rendering
     */
    getRightEye() {
        if (!this.stereo.enabled) return this;

        const rightEye = new Camera();
        rightEye.setFrom(this);
        
        const right = this.getWorldRight();
        const offset = this.stereo.eyeSeparation * 0.5;
        
        const pos = this.getWorldPosition();
        rightEye.setPosition(
            pos.x + right.x * offset,
            pos.y + right.y * offset,
            pos.z + right.z * offset
        );

        return rightEye;
    }

    /**
     * Copy camera settings from another camera
     */
    setFrom(camera) {
        this.fov = camera.fov;
        this.aspect = camera.aspect;
        this.near = camera.near;
        this.far = camera.far;
        this.projectionType = camera.projectionType;
        this.orthographicSize = camera.orthographicSize;
        
        this.setPosition(
            camera.position.x,
            camera.position.y,
            camera.position.z
        );
        
        this.setRotation(
            camera.rotation.x,
            camera.rotation.y,
            camera.rotation.z
        );

        return this;
    }

    /**
     * Clone camera
     */
    clone() {
        const camera = new Camera();
        camera.setFrom(this);
        return camera;
    }

    /**
     * Dispose camera and clean up resources
     */
    dispose() {
        this.controls = null;
        this.lookAtTarget = null;
        this.renderTarget = null;
        
        super.destroy();
    }
}
