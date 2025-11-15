/**
 * Scene Type Definitions
 * Manages 3D scene objects and hierarchy
 */

import { Mesh } from './mesh';

export interface SceneBackground {
    color?: string;
    texture?: any;
    cubeTexture?: any;
    environment?: any;
}

/**
 * Scene - Manages all objects in a 3D scene
 */
export declare class Scene {
    private objects: Set<Mesh>;
    private background: string | null;
    public cameras: any[];
    public lights: any[];
    public activeCamera: any;

    constructor();

    /**
     * Add an object to the scene
     */
    add(object: Mesh): void;

    /**
     * Remove an object from the scene
     */
    remove(object: Mesh): void;

    /**
     * Clear all objects from the scene
     */
    clear(): void;

    /**
     * Set the scene background
     */
    setBackground(color: string): void;

    /**
     * Get the scene background
     */
    getBackground(): string | null;

    /**
     * Get all objects in the scene
     */
    getObjects(): Mesh[];

    /**
     * Get all objects in the scene (alias for getObjects)
     */
    getAllObjects(): Mesh[];

    /**
     * Update the scene
     */
    update(deltaTime: number): void;

    /**
     * Set the active camera
     */
    setActiveCamera(camera: any): void;

    /**
     * Pause the scene
     */
    pause(): void;

    /**
     * Resume the scene
     */
    resume(): void;

    /**
     * Dispose scene and cleanup resources
     */
    dispose(): void;
}