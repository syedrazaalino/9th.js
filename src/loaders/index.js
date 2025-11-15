/**
 * Loaders module exports
 * Centralized exports for all loader classes
 */

export { Loader, LoadingManager, TextureLoader, JSONLoader } from './loader.ts';
export { 
  TextureLoader as AdvancedTextureLoader,
  TextureCache,
  TextureFormatDetector,
  TextureLoaderProgress
} from './TextureLoader.js';

// TextureLoaderExample is not exported

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
export { JSONLoader as EnhancedJSONLoader } from './JSONLoader.js';

// Example and demo classes
export { default as CompressedGeometryDemo } from './CompressedGeometryLoaderExample.js';
