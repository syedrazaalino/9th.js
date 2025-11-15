/**
 * @class OrthographicCamera
 * @description Orthographic camera with proper projection matrices, frustum management, and viewport handling
 * @author 9th.js Team
 * @version 1.0.0
 */

import { Camera } from '../core/Camera.js';

export class OrthographicCamera extends Camera {
    constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 1000) {
        super();
        
        this.type = 'OrthographicCamera';
        this.isOrthographicCamera = true;

        // Orthographic camera specific properties
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;

        // Set projection type
        this.projectionType = 'orthographic';

        // Set initial orthographic projection
        this.setOrthographic(left, right, top, bottom, near, far);
    }

    /**
     * Set orthographic projection bounds
     */
    setOrthographic(left, right, top, bottom, near = this.near, far = this.far) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Set orthographic size and aspect ratio
     */
    setSize(size, aspect = this.aspect) {
        const halfHeight = size / 2;
        const halfWidth = halfHeight * aspect;
        
        this.left = -halfWidth;
        this.right = halfWidth;
        this.top = halfHeight;
        this.bottom = -halfHeight;
        this.markProjectionDirty();
        return this;
    }

    /**
     * Get orthographic size
     */
    getSize() {
        return this.top - this.bottom;
    }

    /**
     * Set near and far clipping planes
     */
    setNearFar(near, far) {
        if (near >= far) {
            console.warn('OrthographicCamera: near must be less than far.');
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
     * Update orthographic projection matrix
     */
    updateOrthographicMatrix() {
        const lr = 1 / (this.left - this.right);
        const bt = 1 / (this.bottom - this.top);
        const nf = 1 / (this.near - this.far);

        this.projectionMatrix[0] = -2 * lr;
        this.projectionMatrix[5] = -2 * bt;
        this.projectionMatrix[10] = 2 * nf;
        this.projectionMatrix[12] = (this.left + this.right) * lr;
        this.projectionMatrix[13] = (this.top + this.bottom) * bt;
        this.projectionMatrix[14] = (this.far + this.near) * nf;
        this.projectionMatrix[15] = 1;

        // Clear other elements
        for (let i = 0; i < 16; i++) {
            if (i !== 0 && i !== 5 && i !== 10 && i !== 12 && i !== 13 && i !== 14 && i !== 15) {
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
        const cornersNDC = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
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
     * Check if an axis-aligned bounding box is visible
     */
    isBoxVisible(min, max) {
        const frustum = this.getFrustum();
        
        // Check all 8 corners of the box
        const corners = [
            [min.x, min.y, min.z], [max.x, min.y, min.z], [min.x, max.y, min.z], [min.x, min.y, max.z],
            [max.x, max.y, min.z], [min.x, max.y, max.z], [max.x, min.y, max.z], [max.x, max.y, max.z]
        ];
        
        for (let i = 0; i < 6; i++) {
            let outside = true;
            for (let j = 0; j < 8; j++) {
                const distance = this.distanceToPoint(corners[j], frustum.planes[i]);
                if (distance >= 0) {
                    outside = false;
                    break;
                }
            }
            if (outside) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Calculate distance from point to frustum plane
     */
    distanceToPoint(point, plane) {
        return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d;
    }

    /**
     * Get optimal size to fit object in view
     */
    getOptimalSize(objectSize, fitMode = 'fit') {
        if (fitMode === 'width') {
            return objectSize;
        } else if (fitMode === 'height') {
            return objectSize;
        } else {
            // Fit both dimensions - use the larger size
            return Math.max(objectSize.width, objectSize.height);
        }
    }

    /**
     * Fit object in view
     */
    fitToObject(object, margin = 1.2) {
        const bounds = object.getBoundingBox ? object.getBoundingBox() : {
            min: { x: -0.5, y: -0.5, z: -0.5 },
            max: { x: 0.5, y: 0.5, z: 0.5 }
        };
        
        const width = (bounds.max.x - bounds.min.x) * margin;
        const height = (bounds.max.y - bounds.min.y) * margin;
        
        // Set orthographic size to fit object
        this.setSize(Math.max(width, height));
        
        // Center camera on object
        const center = {
            x: (bounds.min.x + bounds.max.x) / 2,
            y: (bounds.min.y + bounds.max.y) / 2,
            z: (bounds.min.z + bounds.max.z) / 2
        };
        
        this.lookAt(center.x, center.y, center.z);
        
        return this;
    }

    /**
     * Fit object exactly in view (no margin)
     */
    fitExact(object) {
        return this.fitToObject(object, 1.0);
    }

    /**
     * Fit object with padding
     */
    fitWithPadding(object, padding = 0.1) {
        return this.fitToObject(object, 1.0 + padding);
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
     * Convert screen coordinates to world coordinates at specific depth
     */
    screenToWorldAtDepth(screenX, screenY, width, height, depth) {
        // For orthographic camera, ray is parallel
        const x = (screenX / width) * (this.right - this.left) + this.left;
        const y = (1 - screenY / height) * (this.top - this.bottom) + this.bottom;
        
        return {
            x: x,
            y: y,
            z: -depth
        };
    }

    /**
     * Convert normalized device coordinates to world position
     */
    ndcToWorld(ndcPos) {
        const x = ndcPos.x * (this.right - this.left) / 2 + (this.left + this.right) / 2;
        const y = ndcPos.y * (this.top - this.bottom) / 2 + (this.top + this.bottom) / 2;
        const z = ndcPos.z * (this.far - this.near) / 2 + (this.near + this.far) / 2;
        
        return { x, y, z };
    }

    /**
     * Convert world position to normalized device coordinates
     */
    worldToNDC(worldPos) {
        const x = (worldPos.x - (this.left + this.right) / 2) * 2 / (this.right - this.left);
        const y = (worldPos.y - (this.top + this.bottom) / 2) * 2 / (this.top - this.bottom);
        const z = (worldPos.z - (this.near + this.far) / 2) * 2 / (this.far - this.near);
        
        return { x, y, z };
    }

    /**
     * Get pixel size at specific world distance
     */
    getPixelSize(width, height, distance) {
        const worldWidth = this.right - this.left;
        const worldHeight = this.top - this.bottom;
        
        return {
            x: worldWidth * distance / width,
            y: worldHeight * distance / height
        };
    }

    /**
     * Get world size visible at specific distance
     */
    getVisibleSize(distance) {
        return {
            width: this.right - this.left,
            height: this.top - this.bottom
        };
    }

    /**
     * Pan camera by screen coordinates
     */
    pan(deltaX, deltaY, width, height, distance = this.near) {
        const pixelSize = this.getPixelSize(width, height, distance);
        
        this.translate(
            -deltaX * pixelSize.x,
            deltaY * pixelSize.y,
            0
        );
        
        return this;
    }

    /**
     * Zoom camera by factor
     */
    zoom(factor) {
        const centerX = (this.left + this.right) / 2;
        const centerY = (this.top + this.bottom) / 2;
        
        const halfWidth = (this.right - this.left) / 2 / factor;
        const halfHeight = (this.top - this.bottom) / 2 / factor;
        
        this.left = centerX - halfWidth;
        this.right = centerX + halfWidth;
        this.top = centerY + halfHeight;
        this.bottom = centerY - halfHeight;
        
        this.markProjectionDirty();
        return this;
    }

    /**
     * Set zoom level
     */
    setZoom(zoom) {
        return this.zoom(zoom);
    }

    /**
     * Get current zoom level
     */
    getZoom() {
        const defaultSize = 2; // Default orthographic size
        return defaultSize / this.getSize();
    }

    /**
     * Reset zoom to default
     */
    resetZoom() {
        return this.setZoom(1);
    }

    /**
     * Get frustum bounds as rectangle
     */
    getFrustumBounds() {
        return {
            left: this.left,
            right: this.right,
            top: this.top,
            bottom: this.bottom,
            width: this.right - this.left,
            height: this.top - this.bottom
        };
    }

    /**
     * Check if screen point is inside frustum
     */
    isPointInFrustum(point, width, height) {
        const worldPoint = this.screenToWorldAtDepth(
            point.x, point.y, width, height, 
            (this.near + this.far) / 2
        );
        
        return (
            worldPoint.x >= this.left && worldPoint.x <= this.right &&
            worldPoint.y >= this.bottom && worldPoint.y <= this.top &&
            worldPoint.z >= this.near && worldPoint.z <= this.far
        );
    }

    /**
     * Clone camera
     */
    clone() {
        const camera = new OrthographicCamera(this.left, this.right, this.top, this.bottom, this.near, this.far);
        camera.setFrom(this);
        return camera;
    }

    /**
     * Copy settings from another camera
     */
    setFrom(camera) {
        super.setFrom(camera);
        
        if (camera.isOrthographicCamera) {
            this.left = camera.left;
            this.right = camera.right;
            this.top = camera.top;
            this.bottom = camera.bottom;
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
            left: this.left,
            right: this.right,
            top: this.top,
            bottom: this.bottom,
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
        this.setOrthographic(data.left, data.right, data.top, data.bottom, data.near, data.far);
        return this;
    }

    /**
     * Dispose camera and clean up resources
     */
    dispose() {
        super.dispose();
        // OrthographicCamera specific cleanup if needed
    }
}
