/**
 * OrthographicCamera Type Definitions
 * Orthographic projection camera
 */

import { Camera } from '../core/camera';

export interface OrthographicCameraOptions {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    near?: number;
    far?: number;
    zoom?: number;
}

/**
 * OrthographicCamera - Orthographic projection camera
 */
export declare class OrthographicCamera extends Camera {
    public left: number;
    public right: number;
    public top: number;
    public bottom: number;
    public zoom: number;

    constructor(
        left?: number,
        right?: number,
        top?: number,
        bottom?: number,
        near?: number,
        far?: number
    );

    /**
     * Set orthographic camera parameters
     */
    setOrthographic(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number
    ): void;

    /**
     * Set camera left boundary
     */
    setLeft(left: number): void;

    /**
     * Set camera right boundary
     */
    setRight(right: number): void;

    /**
     * Set camera top boundary
     */
    setTop(top: number): void;

    /**
     * Set camera bottom boundary
     */
    setBottom(bottom: number): void;

    /**
     * Set camera zoom
     */
    setZoom(zoom: number): void;

    /**
     * Get camera zoom
     */
    getZoom(): number;

    /**
     * Get camera width
     */
    getWidth(): number;

    /**
     * Get camera height
     */
    getHeight(): number;

    /**
     * Set camera bounds to viewport
     */
    setViewport(left: number, right: number, top: number, bottom: number): void;

    /**
     * Update projection matrix
     */
    updateProjectionMatrix(): void;

    /**
     * Fit to viewport
     */
    fitToViewport(width: number, height: number): void;

    /**
     * Set orthographic projection with zoom
     */
    setProjection(
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number,
        zoom?: number
    ): void;
}

export default OrthographicCamera;