/**
 * Loaders module exports
 * Centralized exports for all loader classes
 *
 * `loader.js` now ships a REAL Three.js-compatible LoadingManager + base
 * Loader class (fetch-backed, with Cache support). The REAL TextureLoader /
 * JSONLoader live in their own files; we export them under their canonical
 * names here.
 */

// Base Loader, LoadingManager, and Cache (real implementations)
export { Loader, LoadingManager, Cache } from './loader.js';

// REAL TextureLoader (not the stub)
export {
  TextureLoader,
  TextureCache,
  TextureFormatDetector,
  TextureLoaderProgress
} from './TextureLoader.js';

// GLTF/GLB Loader
export {
  GLTFLoader,
  GLTFLoaderConfig,
  GLTFAsset
} from './GLTFLoader.js';

// OBJ and MTL Loaders
export { OBJLoader, OBJLoaderProgress } from './OBJLoader.js';
export { MTLLoader, MaterialCreator, MTLLoaderProgress } from './MTLLoader.js';

// Compressed geometry loaders
export {
  DracoLoader,
  DracoCompressionLevel,
  DracoAttributeType,
  DracoGeometryCache,
  DracoProgressTracker,
  DracoLODManager
} from './DracoLoader.js';

export {
  MeshOptLoader,
  MeshOptCompressionType,
  MeshOptSimplificationQuality,
  MeshOptVertexCacheSize,
  MeshOptGeometryCache,
  MeshOptProgressTracker,
  MeshOptLODGenerator
} from './MeshOptLoader.js';

// 3D Format Loaders (STL, PLY, JSON)
export { STLLoader } from './STLLoader.js';
export { PLYLoader } from './PLYLoader.js';
export { JSONLoader } from './JSONLoader.js';

// Example and demo classes
export { default as CompressedGeometryDemo } from './CompressedGeometryLoaderExample.js';
