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
export * from './Raycaster.js';
export * from './InstancedMesh.js';
export * from './RenderTarget.js';
export { Engine } from './engine.js';

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
import { Engine } from './engine.js';
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
import { Raycaster, Ray } from './Raycaster.js';
import { InstancedMesh, BufferAttribute } from './InstancedMesh.js';
import { RenderTarget, RenderTargetTexture } from './RenderTarget.js';

export const Core = {
    Object3D,
    Scene,
    Camera,
    Engine,
    Shader,
    Material,
    BasicMaterial,
    PhongMaterial,
    LambertMaterial,
    BufferGeometry,
    VertexAttribute,
    AttributeUtils,
    Buffer,
    VertexBuffer,
    IndexBuffer,
    Mesh,
    MeshConfig,
    LODLevel,
    GeometryCache,
    MeshOptimizer,
    DrawCallBatcher,
    MeshBuilder,
    InstancedMesh,
    BufferAttribute,
    RenderTarget,
    RenderTargetTexture,
    Raycaster,
    Ray,
    WebGLRenderer,
    Renderer: WebGLRenderer,
    createWebGLContext,
    compileShader,
    createProgram,
    WebGLPerformanceProfiler,
    WebGLResourceTracker,
    EventEmitter,
    DOMEventManager,
    EventPool,
    EventBus,
    PerformanceTimer,
    PerformanceProfiler,
    MemoryMonitor,
    debounce,
    throttle,
    memoize
};

export { Mesh, MeshConfig, LODLevel, GeometryCache, MeshOptimizer, DrawCallBatcher, MeshBuilder };
export { WebGLRenderer, Scene, Camera };
export { Raycaster, Ray };
export { InstancedMesh, BufferAttribute };
export { RenderTarget, RenderTargetTexture };
export { WebGLRenderer as Renderer };
export { BufferGeometry, VertexAttribute, AttributeUtils };
export { Material, BasicMaterial, PhongMaterial, LambertMaterial, Shader };
export { Object3D, EventEmitter, DOMEventManager, EventPool, EventBus };