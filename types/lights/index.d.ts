/**
 * Lights Module Type Definitions
 * Lighting system for scenes
 */

// Re-export all light types
export * from '../core/light';
export * from './ambient-light';
export * from './directional-light';
export * from './point-light';
export * from './spot-light';
export * from './light-manager';
export * from './light-group';

// Ambient type declarations
declare global {
    interface Window {
        lights: {
            AmbientLight: typeof import('./ambient-light').AmbientLight;
            DirectionalLight: typeof import('./directional-light').DirectionalLight;
            PointLight: typeof import('./point-light').PointLight;
            SpotLight: typeof import('./spot-light').SpotLight;
            LightManager: typeof import('./light-manager').LightManager;
        };
    }
}

export {};