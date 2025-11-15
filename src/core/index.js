/**
 * Core Module Index
 * Exports all core functionality from a single entry point
 * 
 * Core Object Hierarchy:
 * 
 * Object3D (Base Class)
 * ├── Transform operations (position, rotation, scale)
 * ├── Matrix calculations (local/world matrices)
 * ├── Hierarchy management (parent/children)
 * ├── Lifecycle management (update/render/destroy)
 * └── Spatial queries (position, scale, directions)
 * 
 * Scene (Container)
 * ├── Scene graph management
 * ├── Object registry and lookup
 * ├── Camera and lighting management
 * ├── Rendering pipeline coordination
 * ├── Frustum culling and optimization
 * └── Event system and lifecycle
 * 
 * Camera (View Controller)
 * ├── View matrix calculation
 * ├── Projection matrix (perspective/orthographic)
 * ├── Frustum management for culling
 * ├── Ray casting and coordinate transformation
 * ├── Stereo rendering support (VR)
 * └── Camera controls integration
 */

export * from './Events.js';
export * from './Utils.js';
export * from './Object3D.js';
export * from './Scene.js';
export * from './Camera.js';
export * from './Shader.js';
export * from './Material.js';
export * from './WebGLRenderer.js';
export * from './WebGLUtils.js';
export * from './BufferGeometry.js';
export * from './Buffer.js';
// Mesh exports handled below

// Re-export with convenience names
import { EventEmitter, DOMEventManager, EventPool, EventBus } from './Events.js';
import { 
    PerformanceTimer, 
    PerformanceProfiler, 
    MemoryMonitor,
    debounce,
    throttle,
    memoize
} from './Utils.js';
import { Object3D } from './Object3D.js';
import { Scene } from './Scene.js';
import { Camera } from './Camera.js';
import { Material, BasicMaterial, PhongMaterial, LambertMaterial } from './Material.js';
import { Shader } from './Shader.js';
import { WebGLRenderer } from './WebGLRenderer.js';
import { 
    createWebGLContext,
    compileShader,
    createProgram,
    WebGLPerformanceProfiler,
    WebGLResourceTracker
} from './WebGLUtils.js';
import { 
    BufferGeometry,
    VertexAttribute,
    AttributeUtils
} from './BufferGeometry.js';
import { 
    Buffer,
    VertexBuffer,
    IndexBuffer,
    BufferType,
    BufferUsage
} from './Buffer.js';
import { 
    Mesh,
    MeshConfig,
    LODLevel,
    GeometryCache,
    MeshOptimizer,
    DrawCallBatcher,
    MeshBuilder
} from './Mesh.js';

export const Core = {
    // Object Hierarchy
    Object3D,
    Scene,
    Camera,
    
    // Shader System
    Shader,
    Material,
    
    // Material Types
    BasicMaterial,
    PhongMaterial,
    LambertMaterial,
    
    // Geometry System
    BufferGeometry,
    VertexAttribute,
    AttributeUtils,
    Buffer,
    VertexBuffer,
    IndexBuffer,
    
    // Mesh System
    Mesh,
    MeshConfig,
    LODLevel,
    GeometryCache,
    MeshOptimizer,
    DrawCallBatcher,
    MeshBuilder,
    
    // WebGL System
    WebGLRenderer,
    
    // WebGL Utilities
    createWebGLContext,
    compileShader,
    createProgram,
    WebGLPerformanceProfiler,
    WebGLResourceTracker,
    
    // Event System
    EventEmitter,
    DOMEventManager,
    EventPool,
    EventBus,
    
    // Performance Monitoring
    PerformanceTimer,
    PerformanceProfiler,
    MemoryMonitor,
    
    // Utility Functions
    debounce,
    throttle,
    memoize
};

// Named exports for convenience
export { Mesh, MeshConfig, LODLevel, GeometryCache, MeshOptimizer, DrawCallBatcher, MeshBuilder };
export { WebGLRenderer, Scene, Camera };
export { BufferGeometry, VertexAttribute, AttributeUtils };
export { Material, BasicMaterial, PhongMaterial, LambertMaterial, Shader };
export { Object3D, EventEmitter, DOMEventManager, EventPool, EventBus };

// Default export removed for UMD compatibility
// Use named exports instead
