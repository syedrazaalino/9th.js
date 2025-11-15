/**
 * Ninth.js Type Definitions
 * Comprehensive TypeScript definitions for Ninth.js 3D library
 * 
 * @version 1.0.0
 * @description Complete type definitions for all Ninth.js modules
 */

// Main library entry point
export * from './core/index';
export * from './cameras/index';
export * from './controls/index';
export * from './lights/index';
export * from './geometry/index';
export * from './materials/index';
export * from './loaders/index';
export * from './textures/index';
export * from './particles/index';
export * from './physics/index';
export * from './animation/index';
export * from './rendering/index';
export * from './extras/index';

// Library information
export const LIBRARY_NAME = 'Ninth.js';
export const LIBRARY_VERSION = '1.0.0';
export const LIBRARY_DESCRIPTION = 'A modern 3D JavaScript library for creating interactive graphics and visualizations';

// Type definitions for commonly used patterns
export interface CallbackFunction {
    (): void;
}

export interface EventCallback<T = any> {
    (event: T): void;
}

export interface AsyncCallbackFunction {
    (): Promise<void>;
}

// Ambient global declarations
declare global {
    interface Window {
        // Ninth.js global access
        Ninth: {
            version: string;
            Engine: typeof import('./core/engine').Engine;
            Scene: typeof import('./core/scene').Scene;
            WebGLRenderer: typeof import('./core/renderer').WebGLRenderer;
            Camera: typeof import('./core/camera').Camera;
            PerspectiveCamera: typeof import('./cameras/perspective-camera').PerspectiveCamera;
            OrthographicCamera: typeof import('./cameras/orthographic-camera').OrthographicCamera;
            Mesh: typeof import('./core/mesh').Mesh;
            Material: typeof import('./core/material').Material;
            BoxGeometry: typeof import('./geometry/primitives').BoxGeometry;
            SphereGeometry: typeof import('./geometry/primitives').SphereGeometry;
            TextureLoader: typeof import('./core/loader').FileLoader;
            OrbitControls: typeof import('./controls/orbit-controls').OrbitControls;
        };

        // Individual module globals
        ninth: typeof Window.Ninth;
    }
}

// Module augmentation for enhanced type safety
declare module '@ninth/core' {
    export * from './core/index';
}

declare module '@ninth/cameras' {
    export * from './cameras/index';
}

declare module '@ninth/controls' {
    export * from './controls/index';
}

declare module '@ninth/lights' {
    export * from './lights/index';
}

declare module '@ninth/geometry' {
    export * from './geometry/index';
}

declare module '@ninth/materials' {
    export * from './materials/index';
}

declare module '@ninth/loaders' {
    export * from './loaders/index';
}

declare module '@ninth/textures' {
    export * from './textures/index';
}

declare module '@ninth/particles' {
    export * from './particles/index';
}

declare module '@ninth/physics' {
    export * from './physics/index';
}

declare module '@ninth/animation' {
    export * from './animation/index';
}

declare module '@ninth/rendering' {
    export * from './rendering/index';
}

declare module '@ninth/extras' {
    export * from './extras/index';
}

// Re-export commonly used types for convenience
export type { Vector2 } from './core/math/vector2';
export type { Vector3 } from './core/math/vector3';
export type { Vector4 } from './core/math/vector4';
export type { Matrix3 } from './core/math/matrix3';
export type { Matrix4 } from './core/math/matrix4';
export type { Quaternion } from './core/math/quaternion';
export type { Color } from './core/math/color';

// Utility types for enhanced developer experience
export type GeometryType = 'box' | 'sphere' | 'circle' | 'cone' | 'cylinder' | 'plane';
export type MaterialType = 'basic' | 'lambert' | 'phong' | 'standard' | 'physical';
export type CameraType = 'perspective' | 'orthographic';
export type LightType = 'ambient' | 'directional' | 'point' | 'spot';
export type ControlType = 'orbit' | 'fly' | 'firstperson';

export interface SceneObject {
    id: string;
    name: string;
    visible: boolean;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
}

export interface RenderSettings {
    antialias: boolean;
    alpha: boolean;
    depth: boolean;
    stencil: boolean;
    powerPreference: 'default' | 'high-performance' | 'low-power';
    preserveDrawingBuffer: boolean;
}

export interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    vertices: number;
    memoryUsage: number;
}

export interface AnimationClip {
    name: string;
    duration: number;
    tracks: any[];
}

export interface TextureData {
    width: number;
    height: number;
    data: Uint8Array | Float32Array;
    format: string;
    type: string;
}

export interface MeshData {
    geometry: any;
    material: any;
    position: Vector3;
    rotation: Vector3;
    scale: Vector3;
}

// Version information
export const VERSION = '1.0.0';

export const LIBRARY_INFO = {
    name: 'Ninth.js',
    version: VERSION,
    description: 'A modern 3D JavaScript library for creating interactive graphics and visualizations',
    modules: [
        'core', 'cameras', 'controls', 'lights', 'geometry', 
        'materials', 'loaders', 'textures', 'particles', 
        'physics', 'animation', 'rendering', 'extras'
    ]
};

// Export configuration for different environments
export const CONFIG = {
    debug: false,
    throwErrors: false,
    autoDispose: true,
    enableStats: false,
    enableProfiling: false
};

// Global type declarations for external libraries
declare global {
    interface HTMLCanvasElement {
        width: number;
        height: number;
        getContext(contextId: 'webgl' | 'webgl2', options?: any): WebGLRenderingContext | WebGL2RenderingContext | null;
    }
}

export {};