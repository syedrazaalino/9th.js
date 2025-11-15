/**
 * Camera Type Definitions
 * Camera system for viewing scenes
 */

import { Vector3 } from './math/vector3';
import { Matrix4 } from './math/matrix4';

export interface CameraProjection {
    type: 'perspective' | 'orthographic';
    fov?: number;
    aspect: number;
    near: number;
    far: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

/**
 * Camera - Base camera class
 */
export declare class Camera {
    public id: string;
    public name: string;
    public type: string;
    public position: Vector3;
    public rotation: Vector3;
    public scale: Vector3;
    public up: Vector3;
    public lookAt: Vector3;
    public matrix: Matrix4;
    public matrixWorld: Matrix4;
    public matrixWorldInverse: Matrix4;
    public projectionMatrix: Matrix4;
    public projectionMatrixInverse: Matrix4;
    public frustum: any;
    public near: number;
    public far: number;
    public zoom: number;
    public view: {
        enabled: boolean;
        fullWidth: number;
        fullHeight: number;
        offsetX: number;
        offsetY: number;
        width: number;
        height: number;
    };
    public layers: number;

    constructor();

    /**
     * Get world position
     */
    getWorldPosition(): Vector3;

    /**
     * Get world direction
     */
    getWorldDirection(): Vector3;

    /**
     * Look at target
     */
    lookAt(target: Vector3 | { x: number; y: number; z: number }): void;

    /**
     * Update camera matrix
     */
    updateMatrix(): void;

    /**
     * Update camera world matrix
     */
    updateMatrixWorld(): void;

    /**
     * Update camera world inverse matrix
     */
    updateMatrixWorldInverse(): void;

    /**
     * Update projection matrix
     */
    updateProjectionMatrix(): void;

    /**
     * Update camera frustum
     */
    updateFrustum(): void;

    /**
     * Set camera position
     */
    setPosition(x: number, y: number, z: number): void;

    /**
     * Set camera rotation
     */
    setRotation(x: number, y: number, z: number): void;

    /**
     * Set camera scale
     */
    setScale(x: number, y: number, z: number): void;

    /**
     * Get camera position
     */
    getPosition(): Vector3;

    /**
     * Get camera rotation
     */
    getRotation(): Vector3;

    /**
     * Get camera scale
     */
    getScale(): Vector3;

    /**
     * Get camera aspect ratio
     */
    getAspect(): number;

    /**
     * Set camera near plane
     */
    setNear(near: number): void;

    /**
     * Set camera far plane
     */
    setFar(far: number): void;

    /**
     * Set camera zoom
     */
    setZoom(zoom: number): void;

    /**
     * Get camera zoom
     */
    getZoom(): number;

    /**
     * Test if point is in camera frustum
     */
    isPointInFrustum(point: Vector3): boolean;

    /**
     * Get camera planes (for frustum culling)
     */
    getCameraPlanes(): any[];

    /**
     * Clone camera
     */
    clone(): Camera;

    /**
     * Copy camera properties
     */
    copy(source: Camera): Camera;

    /**
     * Dispose camera and cleanup resources
     */
    dispose(): void;
}

/**
 * PerspectiveCamera - Perspective projection camera
 */
export declare class PerspectiveCamera extends Camera {
    public fov: number;
    public aspect: number;
    public filmGauge: number;
    public filmOffset: number;

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
    fitToObject(object: any, cameraOffset?: Vector3): void;

    /**
     * Set film gauge (for cinema cameras)
     */
    setFilmGauge(gauge: number): void;

    /**
     * Set film offset (for cinema cameras)
     */
    setFilmOffset(offset: number): void;
}

/**
 * OrthographicCamera - Orthographic projection camera
 */
export declare class OrthographicCamera {
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
     * Get camera width
     */
    getWidth(): number;

    /**
     * Get camera height
     */
    getHeight(): number;

    /**
     * Update projection matrix
     */
    updateProjectionMatrix(): void;
}