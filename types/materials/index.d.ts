/**
 * Materials Module Type Definitions
 * Material system for rendering
 */

// Re-export all material types
export * from '../core/material';
export * from './basic-material';
export * from './lambert-material';
export * from './phong-material';
export * from './standard-material';
export * from './physical-material';

// Ambient type declarations
declare global {
    interface Window {
        materials: {
            BasicMaterial: typeof import('../core/material').BasicMaterial;
            LambertMaterial: typeof import('../core/material').LambertMaterial;
            PhongMaterial: typeof import('../core/material').PhongMaterial;
            StandardMaterial: typeof import('../core/material').StandardMaterial;
        };
    }
}

export {};