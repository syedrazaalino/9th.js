/**
 * Controls Module Type Definitions
 * Camera controls and interaction systems
 */

// Re-export all control types
export * from './orbit-controls';

// Ambient type declarations
declare global {
    interface Window {
        controls: {
            OrbitControls: typeof import('./orbit-controls').OrbitControls;
        };
    }
}

export {};