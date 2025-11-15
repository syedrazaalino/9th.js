/**
 * @class PerspectiveCamera
 * @description Perspective camera with proper projection matrices, frustum management, and viewport handling
 * @author 9th.js Team
 * @version 1.0.0
 */

import { Camera } from '../core/Camera.js';

export class PerspectiveCamera extends Camera {
    constructor(fov = 75, aspect = 1, near = 0.1, far = 1000) {
        super();
        
        this.type = 'PerspectiveCamera';
        this.isPerspectiveCamera = true;

        // Perspective camera specific properties
        this.fov = fov * Math.PI / 180; // Convert to radians
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        // Set projection type
        this.projectionType = 'perspective';

        // Set initial perspective
        this.setPerspective(this.fov, this.aspect, this.near, this.far);
    }

    /**
     * Set field of view in degrees
     */
    setFov(fov) {
        this.fov = fov * Math.PI / 180; // Convert to radians
        this.markProjectionDirty();
        return this;
    }

    /**
     * Get field of view in degrees
     */
    getFov() {
        return this.fov * 180 / Math.PI; // Convert to degrees
    }

    /**
     * Set aspect ratio
     */
    setAspect(aspect) {
        this.aspect = aspect;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Get aspect ratio
     */
    getAspect() {
        return this.aspect;
    }

    /**
     * Set near and far clipping planes
     */
    setNearFar(near, far) {
        if (near >= far) {
            console.warn('PerspectiveCamera: near must be less than far.');
            return this;
        }
        
        this.near = near;
        this.far = far;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Get near clipping plane distance
     */
    getNear() {
        return this.near;
    }

    /**
     * Get far clipping plane distance
     */
    getFar() {
        return this.far;
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
     * Get frustum corners in world space
     */
    getFrustumCorners() {
        this.updateMatrix();

        const corners = [];
        const z = -1; // Near plane in NDC
        const cornersNDC = [
            [-1, -1, z], [1, -1, z], [1, 1, z], [-1, 1, z],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];

        const invVP = this.invertMatrix(this.viewProjectionMatrix);

        for (let i = 0; i < 8; i++) {
            const corner = this.unproject(cornersNDC[i][0], cornersNDC[i][1], cornersNDC[i][2], invVP);
            corners.push(corner);
        }

        return corners;
    }

    /**
     * Get frustum plane in world space
     */
    getFrustumPlane(planeIndex) {
        const frustum = this.getFrustum();
        return frustum.planes[planeIndex];
    }

    /**
     * Check if a sphere is visible in the frustum
     */
    isSphereVisible(center, radius) {
        const frustum = this.getFrustum();
        
        for (let i = 0; i < 6; i++) {
            const distance = this.distanceToSphere(center, radius, frustum.planes[i]);
            if (distance < 0) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Calculate distance from sphere to frustum plane
     */
    distanceToSphere(center, radius, plane) {
        return plane.a * center.x + plane.b * center.y + plane.c * center.z + plane.d + radius;
    }

    /**
     * Get optimal distance to fit object in view
     */
    getOptimalDistance(objectSize, fitMode = 'fit') {
        const vFOV = this.getFov() * Math.PI / 180;
        const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * this.aspect);
        
        if (fitMode === 'vertical') {
            return (objectSize / 2) / Math.tan(vFOV / 2);
        } else if (fitMode === 'horizontal') {
            return (objectSize / 2) / Math.tan(hFOV / 2);
        } else {
            // Fit both dimensions
            const distV = (objectSize / 2) / Math.tan(vFOV / 2);
            const distH = (objectSize / 2) / Math.tan(hFOV / 2);
            return Math.max(distV, distH);
        }
    }

    /**
     * Fit object in view
     */
    fitToObject(object, margin = 1.2) {
        const size = object.getBoundingSphere ? object.getBoundingSphere().radius : 1;
        const distance = this.getOptimalDistance(size * 2) * margin;
        
        // Position camera to look at object center
        const objectPos = object.getWorldPosition();
        const cameraPos = this.getWorldPosition();
        const direction = this.getWorldDirection();
        
        const newPos = {
            x: objectPos.x - direction.x * distance,
            y: objectPos.y - direction.y * distance,
            z: objectPos.z - direction.z * distance
        };
        
        this.setPosition(newPos.x, newPos.y, newPos.z);
        this.lookAt(objectPos.x, objectPos.y, objectPos.z);
        
        return this;
    }

    /**
     * Convert world position to screen position
     */
    worldToScreen(worldPos, width, height) {
        return this.project(worldPos.x, worldPos.y, worldPos.z, width, height);
    }

    /**
     * Convert screen position to world ray
     */
    screenToRay(screenX, screenY, width, height) {
        return this.getRay(screenX, screenY, width, height);
    }

    /**
     * Convert world position to normalized device coordinates
     */
    worldToNDC(worldPos) {
        const vector = new Float32Array([worldPos.x, worldPos.y, worldPos.z, 1]);
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
            x: result[0],
            y: result[1],
            z: result[2]
        };
    }

    /**
     * Convert normalized device coordinates to world position
     */
    ndcToWorld(ndcPos) {
        return this.unproject(ndcPos.x, ndcPos.y, ndcPos.z, this.inverseViewMatrix);
    }

    /**
     * Get camera depth range for specific world distance
     */
    getDepthAtDistance(distance) {
        const z = -distance;
        const near = -this.near;
        const far = -this.far;
        
        return (z - near) / (far - near);
    }

    /**
     * Get world distance for specific depth value
     */
    getDistanceAtDepth(depth) {
        const near = -this.near;
        const far = -this.far;
        
        return -(near + depth * (far - near));
    }

    /**
     * Set zoom level (convenience method)
     */
    setZoom(zoom) {
        this.setFov(this.getFov() / zoom);
        return this;
    }

    /**
     * Get current zoom level
     */
    getZoom() {
        return this.getFov() / 75; // Relative to default FOV
    }

    /**
     * Clone camera
     */
    clone() {
        const camera = new PerspectiveCamera(this.getFov(), this.aspect, this.near, this.far);
        camera.setFrom(this);
        return camera;
    }

    /**
     * Copy settings from another camera
     */
    setFrom(camera) {
        super.setFrom(camera);
        
        if (camera.isPerspectiveCamera) {
            this.fov = camera.fov;
            this.aspect = camera.aspect;
            this.near = camera.near;
            this.far = camera.far;
        }
        
        return this;
    }

    /**
     * Get camera parameters for serialization
     */
    toJSON() {
        return {
            type: this.type,
            position: this.getWorldPosition(),
            rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
            },
            fov: this.getFov(),
            aspect: this.aspect,
            near: this.near,
            far: this.far
        };
    }

    /**
     * Load camera parameters from JSON
     */
    fromJSON(data) {
        this.setPosition(data.position.x, data.position.y, data.position.z);
        this.setRotation(data.rotation.x, data.rotation.y, data.rotation.z);
        this.setFov(data.fov);
        this.setAspect(data.aspect);
        this.setNearFar(data.near, data.far);
        return this;
    }

    /**
     * Dispose camera and clean up resources
     */
    dispose() {
        super.dispose();
        // PerspectiveCamera specific cleanup if needed
    }
}
