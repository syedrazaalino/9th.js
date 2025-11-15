/**
 * Textures Module Type Definitions
 * Texture and image handling
 */

// Re-export all texture types
export * from './texture';

// Ambient type declarations
declare global {
    interface Window {
        textures: {
            Texture: typeof import('./texture').Texture;
        };
    }
}

export {};