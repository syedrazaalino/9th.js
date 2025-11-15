/**
 * OrbitControls Type Definitions
 * Camera orbit control system
 */

import { Camera } from '../core/camera';
import { Vector3 } from '../core/math/vector3';

export interface OrbitControlsOptions {
    enabled?: boolean;
    target?: Vector3;
    minDistance?: number;
    maxDistance?: number;
    minZoom?: number;
    maxZoom?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
    enableDamping?: boolean;
    dampingFactor?: number;
    enableZoom?: boolean;
    zoomSpeed?: number;
    enableRotate?: boolean;
    rotateSpeed?: number;
    enablePan?: boolean;
    panSpeed?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    keys?: {
        LEFT: string;
        UP: string;
        RIGHT: string;
        BOTTOM: string;
    };
    mouseButtons?: {
        LEFT: number;
        MIDDLE: number;
        RIGHT: number;
    };
}

/**
 * OrbitControls - Camera orbit control system
 */
export declare class OrbitControls {
    public camera: Camera;
    public domElement: HTMLElement;
    public enabled: boolean;
    public target: Vector3;
    public minDistance: number;
    public maxDistance: number;
    public minZoom: number;
    public maxZoom: number;
    public minPolarAngle: number;
    public maxPolarAngle: number;
    public minAzimuthAngle: number;
    public maxAzimuthAngle: number;
    public enableDamping: boolean;
    public dampingFactor: number;
    public enableZoom: boolean;
    public zoomSpeed: number;
    public enableRotate: boolean;
    public rotateSpeed: number;
    public enablePan: boolean;
    public panSpeed: number;
    public autoRotate: boolean;
    public autoRotateSpeed: number;
    public keys: {
        LEFT: string;
        UP: string;
        RIGHT: string;
        BOTTOM: string;
    };
    public mouseButtons: {
        LEFT: number;
        MIDDLE: number;
        RIGHT: number;
    };
    public touches: {
        ONE: number;
        TWO: number;
    };

    constructor(camera: Camera, domElement?: HTMLElement);

    /**
     * Set target
     */
    setTarget(target: Vector3): void;

    /**
     * Get target
     */
    getTarget(): Vector3;

    /**
     * Get spherical coordinates
     */
    getPolarAngle(): number;

    /**
     * Get azimuthal angle
     */
    getAzimuthalAngle(): number;

    /**
     * Save state
     */
    saveState(): void;

    /**
     * Reset to saved state
     */
    reset(): void;

    /**
     * Update controls
     */
    update(): boolean;

    /**
     * Enable controls
     */
    enable(): void;

    /**
     * Disable controls
     */
    disable(): void;

    /**
     * Dispose controls
     */
    dispose(): void;

    /**
     * Get mouse buttons
     */
    getMouseButtons(): {
        LEFT: number;
        MIDDLE: number;
        RIGHT: number;
    };

    /**
     * Set mouse buttons
     */
    setMouseButtons(mouseButtons: {
        LEFT?: number;
        MIDDLE?: number;
        RIGHT?: number;
    }): void;

    /**
     * Get touches
     */
    getTouches(): {
        ONE: number;
        TWO: number;
    };

    /**
     * Set touches
     */
    setTouches(touches: {
        ONE?: number;
        TWO?: number;
    }): void;
}

export default OrbitControls;