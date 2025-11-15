/**
 * PerspectiveCamera Type Definitions
 * Perspective projection camera
 */

import { Camera } from '../core/camera';

export interface PerspectiveCameraOptions {
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
    filmGauge?: number;
    filmOffset?: number;
}

/**
 * PerspectiveCamera - Perspective projection camera
 */
export declare class PerspectiveCamera extends Camera {
    public fov: number;
    public aspect: number;
    public filmGauge: number;
    public filmOffset: number;
    public zoom: number;

    constructor(
        fov?: number,
        aspect?: number,
        near?: number,
        far?: number
    );

    /**
     * Set perspective camera parameters
     */
    setPerspective(
        fov: number,
        aspect: number,
        near: number,
        far: number
    ): void;

    /**
     * Set camera field of view
     */
    setFov(fov: number): void;

    /**
     * Get camera field of view
     */
    getFov(): number;

    /**
     * Set camera aspect ratio
     */
    setAspect(aspect: number): void;

    /**
     * Get camera aspect ratio
     */
    getAspect(): number;

    /**
     * Fit camera to object
     */
    fitToObject(object: any, cameraOffset?: any): void;

    /**
     * Set film gauge (for cinema cameras)
     */
    setFilmGauge(gauge: number): void;

    /**
     * Set film offset (for cinema cameras)
     */
    setFilmOffset(offset: number): void;

    /**
     * Update projection matrix
     */
    updateProjectionMatrix(): void;

    /**
     * Set zoom
     */
    setZoom(zoom: number): void;

    /**
     * Get zoom
     */
    getZoom(): number;

    /**
     * Get depth of field parameters
     */
    getDepthOfField(): {
        focusDistance: number;
        focalLength: number;
        fNumber: number;
    };

    /**
     * Set depth of field parameters
     */
    setDepthOfField(
        focusDistance: number,
        focalLength: number,
        fNumber: number
    ): void;

    /**
     * Set camera near/far planes
     */
    setNearFar(near: number, far: number): void;

    /**
     * Get frustum size at specific distance
     */
    getFrustumSize(distance: number): { width: number; height: number };

    /**
     * Convert screen coordinates to world space
     */
    screenToWorld(
        screenX: number,
        screenY: number,
        cameraZ?: number
    ): any;

    /**
     * Convert world coordinates to screen space
     */
    worldToScreen(worldPosition: any, canvas?: HTMLCanvasElement): {
        x: number;
        y: number;
        z: number;
    };
}

export default PerspectiveCamera;