/**
 * Core Module Type Definitions
 * Fundamental classes and interfaces for Ninth.js 3D engine
 */

// Re-export all core types
export * from './engine';
export * from './scene';
export * from './renderer';
export * from './mesh';
export * from './material';
export * from './camera';
export * from './object3d';
export * from './buffer';
export * from './buffer-geometry';
export * from './shader';
export * from './events';
export * from './utils';
export * from './skeletal-animation';
export * from './morph-target';

// Math types
export * from './math/vector2';
export * from './math/vector3';
export * from './math/vector4';
export * from './math/matrix3';
export * from './math/matrix4';
export * from './math/quaternion';
export * from './math/color';

// Ambient type declarations for global scope
declare global {
    interface Window {
        ninth: {
            version: string;
            engine: typeof import('./engine').Engine;
            scene: typeof import('./scene').Scene;
            renderer: typeof import('./renderer').WebGLRenderer;
        };
    }
}

export {};