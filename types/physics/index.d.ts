/**
 * Physics Module Type Definitions
 * Physics simulation system
 */

// Re-export all physics types
export * from './physics-system';

// Ambient type declarations
declare global {
    interface Window {
        physics: {
            PhysicsSystem: typeof import('./physics-system').PhysicsSystem;
        };
    }
}

export {};