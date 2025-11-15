/**
 * Cameras Module Type Definitions
 * Camera system for viewing scenes
 */

// Re-export all camera types
export * from '../core/camera';
export * from './perspective-camera';
export * from './orthographic-camera';

// Ambient type declarations
declare global {
    interface Window {
        cameras: {
            Camera: typeof import('../core/camera').Camera;
            PerspectiveCamera: typeof import('./perspective-camera').PerspectiveCamera;
            OrthographicCamera: typeof import('./orthographic-camera').OrthographicCamera;
        };
    }
}

export {};