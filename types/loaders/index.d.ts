/**
 * Loaders Module Type Definitions
 * File loading and asset management
 */

// Re-export all loader types
export * from '../core/loader';
export * from './texture-loader';
export * from './obj-loader';
export * from './gltf-loader';
export * from './json-loader';
export * from './draco-loader';
export * from './meshopt-loader';
export * from './ply-loader';
export * from './stl-loader';

// Ambient type declarations
declare global {
    interface Window {
        loaders: {
            TextureLoader: typeof import('./texture-loader').TextureLoader;
            OBJLoader: typeof import('./obj-loader').OBJLoader;
            GLTFLoader: typeof import('./gltf-loader').GLTFLoader;
            DracoLoader: typeof import('./draco-loader').DracoLoader;
        };
    }
}

export {};