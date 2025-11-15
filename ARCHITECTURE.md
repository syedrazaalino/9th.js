# Ninth.js Architecture

This document provides a comprehensive overview of Ninth.js's technical architecture, design patterns, and implementation details for developers who want to understand the library's internals or contribute to its development.

## 🏗️ Architecture Overview

### High-Level Design

Ninth.js follows a modular, layered architecture designed for performance, maintainability, and extensibility:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  (User Code, Examples, Tools, Editor Integration)          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Ninth.js API Layer                     │
│        (Public API, TypeScript Definitions, Examples)      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Core Library Layer                       │
│  (Engine, Scene Graph, Rendering, Animation, Physics)      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Abstraction Layer                         │
│     (WebGL2 API, Browser APIs, Platform Agnostic)         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Platform Layer                            │
│    (WebGL2, Web Workers, WebAssembly, WebXR APIs)         │
└─────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Modularity**: Each system is independently developed and tested
2. **Performance First**: Every decision considers performance implications
3. **Type Safety**: Full TypeScript support with comprehensive type definitions
4. **Backward Compatibility**: Careful consideration of API evolution
5. **Extensibility**: Plugin and extension systems for custom functionality
6. **Platform Agnostic**: Abstracts platform-specific details

---

## 🔧 Core Systems

### 1. Engine System

The Engine is the central coordinator of all systems in Ninth.js:

```typescript
class Engine {
  private renderer: Renderer;
  private scene: Scene;
  private camera: Camera;
  private clock: Clock;
  private renderLoop: RenderLoop;
  private frameId: number | null = null;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, options?: EngineOptions) {
    this.renderer = new Renderer(canvas, options);
    this.scene = new Scene();
    this.clock = new Clock();
    this.renderLoop = new RenderLoop(this.update.bind(this), this.render.bind(this));
  }

  public start(): void {
    this.isRunning = true;
    this.renderLoop.start();
  }

  private update(deltaTime: number): void {
    // Update all systems
    this.scene.update(deltaTime);
    this.updateAnimations(deltaTime);
    this.updatePhysics(deltaTime);
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

**Responsibilities:**
- Lifecycle management of the application
- Coordination between different subsystems
- Frame timing and performance monitoring
- Resource management and cleanup
- Event handling and propagation

### 2. Scene Graph Architecture

The Scene Graph is a hierarchical data structure organizing 3D objects:

```
Scene (root)
├── Camera (viewpoint)
├── Lights (illumination)
├── Meshes (visible objects)
│   ├── Geometry (shape)
│   ├── Material (appearance)
│   └── Transforms (position/orientation)
├── Audio Sources (3D audio)
├── Physics Bodies (collision detection)
└── Custom Components (user data)
```

**Node Hierarchy:**
```typescript
abstract class Object3D extends EventDispatcher {
  protected parent: Object3D | null = null;
  protected children: Object3D[] = [];
  protected transform: Matrix4;
  protected visible: boolean = true;
  protected renderOrder: number = 0;

  public abstract update(deltaTime: number): void;
  public abstract render(renderer: Renderer, camera: Camera): void;
  
  // Scene graph operations
  public add(child: Object3D): void
  public remove(child: Object3D): void
  public traverse(callback: (node: Object3D) => void): void
  public raycast(ray: Ray, intersects: Intersection[]): void
}
```

**Performance Optimizations:**
- **Culling**: Frustum and occlusion culling
- **Batching**: Automatic geometry and material batching
- **Level of Detail**: Automatic LOD switching
- **Spatial Partitioning**: Octree and quadtree acceleration

### 3. Rendering Pipeline

Ninth.js uses a modern, WebGL2-based rendering pipeline:

#### Render Passes
```
1. Geometry Pass
   ├── Depth writing
   ├── Stencil operations
   └── G-buffer generation

2. Lighting Pass
   ├── Directional lighting
   ├── Point/spot lights
   ├── Image-based lighting
   └── Shadow mapping

3. Post-Processing Pass
   ├── HDR tone mapping
   ├── Anti-aliasing
   ├── Bloom effects
   └── Color grading

4. Composite Pass
   ├── UI overlay
   ├── Debug information
   └── Final output
```

#### Shader Pipeline
```glsl
// Vertex Shader Pipeline
vertexInput -> vertexTransform -> vertexShader -> 
varyings -> fragmentInput

// Fragment Shader Pipeline
fragmentInput -> fragmentShader -> outputColor -> 
postProcess -> finalColor

// Compute Shader Pipeline (WebGPU future)
computeInput -> computeShader -> outputBuffer
```

#### Material System
```typescript
abstract class Material {
  protected uniforms: UniformMap;
  protected attributes: AttributeMap;
  protected textures: TextureMap;
  protected shaders: ShaderProgram;

  public abstract getShaderDefines(): ShaderDefines;
  public abstract createShaderProgram(): ShaderProgram;
  public abstract updateUniforms(renderer: Renderer): void;
}
```

### 4. Memory Management

Efficient memory management is crucial for 3D applications:

#### Object Pooling
```typescript
class ObjectPool<T extends Disposable> {
  private pool: T[] = [];
  private factory: () => T;

  public acquire(): T {
    return this.pool.pop() || this.factory();
  }

  public release(object: T): void {
    object.reset();
    this.pool.push(object);
  }
}
```

#### Resource Lifecycle
```
Creation -> Usage -> Pooling -> Disposal
    ↓         ↓        ↓         ↓
  Allocate  Render   Return    Cleanup
```

#### Garbage Collection Strategy
- **Manual Reference Counting**: For WebGL resources
- **Automatic GC**: For JavaScript objects
- **Leak Detection**: Development-time monitoring
- **Profiling Integration**: Memory usage tracking

---

## 🎨 Subsystem Architecture

### Animation System

The animation system supports multiple animation types:

```typescript
// Animation Clip System
class AnimationClip {
  public tracks: KeyframeTrack[];
  public duration: number;
  public loop: boolean;
  public easing: EasingFunction;

  public evaluate(time: number): AnimationResult {
    // Interpolate keyframes across tracks
    // Blend multiple animation layers
    // Apply to target objects
  }
}

// Skeletal Animation System
class SkeletalAnimation {
  public bones: Bone[];
  public inverseBindMatrices: Matrix4[];
  public animationClips: AnimationClip[];

  public updateBoneMatrices(): void {
    // Forward kinematics
    // Inverse kinematics
    // Constraint solving
  }
}
```

### Physics Engine

Modular physics architecture supporting multiple physics backends:

```typescript
// Physics World Interface
interface IPhysicsWorld {
  public step(deltaTime: number): void;
  public addRigidBody(body: RigidBody): void;
  public addConstraint(constraint: Constraint): void;
  public raycast(ray: Ray): RaycastHit[];
}

// Collision Detection Pipeline
class CollisionSystem {
  private broadPhase: BroadPhaseInterface;
  private narrowPhase: NarrowPhaseInterface;

  public detectCollisions(): ContactManifold[] {
    const possiblePairs = this.broadPhase.findPairs();
    const contacts = this.narrowPhase.resolvePairs(possiblePairs);
    return contacts;
  }
}
```

### Particle System

GPU-accelerated particle system with flexible emitters:

```typescript
// Particle System Architecture
class GPUParticleSystem {
  private vertexBuffer: Buffer;
  private computeShader: ComputeShader;
  private particlePool: ParticlePool;

  public simulate(deltaTime: number): void {
    // Update particles on GPU
    // Handle particle lifecycle
    // Apply forces and constraints
  }
}

// Particle Emitter System
abstract class ParticleEmitter {
  public spawnParticles(count: number): void;
  public updateEmissionRate(rate: number): void;
  public configureParticleProperties(properties: ParticleProperties): void;
}
```

---

## 📦 Module System

### Import Architecture

Ninth.js uses a modular import system:

```typescript
// Core imports (tree-shakeable)
import { Engine } from '9th.js/core';
import { PerspectiveCamera } from '9th.js/cameras';
import { BoxGeometry } from '9th.js/geometry';
import { MeshStandardMaterial } from '9th.js/materials';
import { DirectionalLight } from '9th.js/lights';

// Aggregated imports
import * as Ninth from '9th.js';
```

### Module Dependencies

```
Core
├── Cameras (depends on Core)
├── Geometry (depends on Core, Math)
├── Materials (depends on Core, Textures)
├── Lights (depends on Core)
├── Loaders (depends on Core, Geometry)
├── Animation (depends on Core)
├── Particles (depends on Core, Geometry)
├── Physics (depends on Core)
└── Rendering (depends on all modules)
```

---

## ⚡ Performance Architecture

### Rendering Optimizations

#### Geometry Instancing
```typescript
class InstancedMesh extends Mesh {
  private instanceMatrixBuffer: Buffer;
  private instanceCount: number;

  public setMatrixAt(index: number, matrix: Matrix4): void {
    this.instanceMatrixBuffer.update(matrix, index * 16);
  }

  public render(renderer: Renderer, camera: Camera): void {
    // Single draw call for thousands of instances
    renderer.drawInstanced(this.geometry, this.material, this.instanceCount);
  }
}
```

#### Level of Detail (LOD)
```typescript
class LODMesh extends Mesh {
  private levels: {
    distance: number;
    geometry: Geometry;
    material: Material;
  }[];

  public updateLOD(cameraPosition: Vector3): void {
    const distance = this.calculateDistanceToCamera(cameraPosition);
    const level = this.findAppropriateLevel(distance);
    this.switchGeometry(level.geometry, level.material);
  }
}
```

#### Culling System
```typescript
class CullingSystem {
  public frustumCull(objects: Object3D[], frustum: Frustum): Object3D[] {
    return objects.filter(obj => this.isInFrustum(obj, frustum));
  }

  public occlusionCull(objects: Object3D[], camera: Camera): Object3D[] {
    // Advanced occlusion culling implementation
  }
}
```

### Memory Optimizations

#### Texture Atlasing
```typescript
class TextureAtlas {
  private atlasTexture: Texture;
  private regions: Map<string, TextureRegion>;

  public addTexture(key: string, texture: Texture): void {
    const region = this.findAvailableSpace(texture);
    this.copyTextureToAtlas(texture, region);
    this.regions.set(key, region);
  }
}
```

#### Geometry Compression
```typescript
class CompressedGeometry {
  private compressedData: ArrayBuffer;
  private decompressors: Map<string, Decompressor>;

  public decompress(): Geometry {
    const decompressor = this.decompressors.get(this.compressionType);
    return decompressor.decompress(this.compressedData);
  }
}
```

---

## 🔌 Plugin System

### Extension Architecture

Ninth.js supports a flexible plugin system:

```typescript
interface IPlugin {
  name: string;
  version: string;
  dependencies: string[];
  
  initialize(engine: Engine): void;
  update(deltaTime: number): void;
  cleanup(): void;
}

// Plugin Registration
class PluginManager {
  private plugins: Map<string, IPlugin>;

  public registerPlugin(plugin: IPlugin): void {
    this.validateDependencies(plugin);
    plugin.initialize(this.engine);
    this.plugins.set(plugin.name, plugin);
  }

  public loadPluginFromUrl(url: string): Promise<IPlugin> {
    // Dynamic plugin loading
  }
}
```

### Custom Shader Support

```typescript
class CustomMaterial extends Material {
  public getShaderDefines(): ShaderDefines {
    return {
      VERTEX_SHADER: customVertexShader,
      FRAGMENT_SHADER: customFragmentShader,
      UNIFORMS: customUniforms,
      VARYINGS: customVaryings
    };
  }
}
```

---

## 🧪 Testing Architecture

### Testing Strategy

Ninth.js uses a multi-layered testing approach:

#### Unit Tests
```typescript
describe('Mesh', () => {
  let mesh: Mesh;

  beforeEach(() => {
    mesh = new Mesh(new BoxGeometry(), new BasicMaterial());
  });

  it('should update transform correctly', () => {
    mesh.setPosition(1, 2, 3);
    expect(mesh.position).toEqual(new Vector3(1, 2, 3));
  });
});
```

#### Integration Tests
```typescript
describe('Engine Integration', () => {
  it('should render scene correctly', () => {
    const canvas = createTestCanvas();
    const engine = new Engine(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera();
    
    engine.add(scene);
    engine.add(camera);
    
    // Test complete rendering pipeline
    engine.render();
    expect(canvas.width).toBeGreaterThan(0);
  });
```

#### Performance Tests
```typescript
describe('Performance Tests', () => {
  it('should maintain 60 FPS with 1000 objects', () => {
    const startTime = performance.now();
    
    // Render scene with 1000 objects
    for (let i = 0; i < 1000; i++) {
      // Create and render objects
    }
    
    const endTime = performance.now();
    const fps = 1000 / (endTime - startTime);
    
    expect(fps).toBeGreaterThan(60);
  });
});
```

---

## 🏗️ Build System Architecture

### Build Pipeline

```
Source Files (TypeScript)
        ↓
   TypeScript Compiler
        ↓
   ESLint + Prettier
        ↓
   Rollup Bundler
        ↓
┌─────────────┬─────────────┬─────────────┐
│   ESM       │    UMD      │   IIFE      │
│  Modules    │   Bundle    │   Scripts   │
└─────────────┴─────────────┴─────────────┘
        ↓
   Terser Minifier
        ↓
   Type Declaration Generator
        ↓
   Final Distribution
```

### Build Configuration

```typescript
// rollup.config.js
export default {
  input: 'src/index.ts',
  output: [
    {
      format: 'esm',
      file: 'dist/9th.esm.js',
      sourcemap: true
    },
    {
      format: 'umd',
      file: 'dist/9th.umd.js',
      name: 'Ninth',
      sourcemap: true
    }
  ],
  plugins: [
    typescript(),
    replace({
      preventAssignment: true,
      values: {
        __VERSION__: JSON.stringify(process.env.npm_package_version)
      }
    }),
    terser()
  ]
};
```

---

## 🔍 Performance Monitoring

### Metrics Collection

```typescript
class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  
  public startFrame(): void {
    this.metrics.frameStart = performance.now();
  }
  
  public endFrame(): void {
    const now = performance.now();
    this.metrics.frameTime = now - this.metrics.frameStart;
    this.updateFPS();
  }
  
  public getMemoryUsage(): MemoryInfo {
    return (performance as any).memory;
  }
  
  public getGPUStats(): GPUStats {
    return this.renderer.getGpuStatistics();
  }
}
```

### Debug Overlay

```typescript
class DebugOverlay {
  private statsPanel: StatsPanel;
  private profilerOverlay: ProfilerOverlay;
  
  public render(): void {
    this.statsPanel.update({
      fps: this.performanceMonitor.getFPS(),
      frameTime: this.performanceMonitor.getFrameTime(),
      memoryUsage: this.performanceMonitor.getMemoryUsage(),
      drawCalls: this.renderer.getDrawCallCount()
    });
  }
}
```

---

## 🌐 Platform Abstractions

### WebGL Abstraction

```typescript
interface IRendererBackend {
  createBuffer(target: BufferTarget): WebGLBuffer;
  createShader(type: ShaderType): WebGLShader;
  createProgram(vertex: WebGLShader, fragment: WebGLShader): WebGLProgram;
  drawArrays(mode: DrawMode, first: number, count: number): void;
  setViewport(width: number, height: number): void;
}

class WebGL2Backend implements IRendererBackend {
  // Implementation for WebGL2
}

class WebGPUBackend implements IRendererBackend {
  // Future WebGPU implementation
}
```

### Browser Compatibility

```typescript
class FeatureDetector {
  public static hasWebGL2(): boolean {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') as WebGL2RenderingContext);
  }
  
  public static hasWebXR(): boolean {
    return 'xr' in navigator;
  }
  
  public static hasWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
  }
}
```

---

## 🔒 Security Architecture

### Shader Sandboxing

```typescript
class ShaderSandbox {
  private allowedFunctions = [
    'sin', 'cos', 'tan', 'abs', 'min', 'max', 'pow', 'log'
  ];
  
  public validateShader(source: string): ValidationResult {
    // Check for disallowed functions
    // Validate uniform usage
    // Ensure safe mathematical operations
  }
}
```

### Asset Security

```typescript
class SecureAssetLoader {
  public load(url: string, options: LoadOptions): Promise<Asset> {
    // Validate URL and CORS settings
    this.validateSecurityHeaders(url);
    
    // Load with integrity checking
    return this.loadWithIntegrity(url, options);
  }
  
  private validateSecurityHeaders(url: string): void {
    // Enforce security policies
  }
}
```

---

## 📊 Architecture Decisions

### Design Patterns Used

1. **Factory Pattern**: For creating complex objects
2. **Observer Pattern**: For event handling
3. **Component Pattern**: For extensible object behavior
4. **Pool Pattern**: For memory-efficient object reuse
5. **Strategy Pattern**: For algorithm flexibility
6. **Builder Pattern**: For complex configuration

### Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Rendering | WebGL2 | Broad support, good performance |
| Language | TypeScript | Type safety, excellent tooling |
| Build | Rollup | Tree-shaking, multiple outputs |
| Testing | Jest | Comprehensive testing framework |
| Documentation | TypeDoc | Automatic API documentation |

### Performance vs Flexibility Trade-offs

- **Performance**: Fixed pipeline optimizations for common cases
- **Flexibility**: Plugin system for advanced customization
- **Memory**: Automatic cleanup vs manual control options
- **Safety**: Runtime checks in development, optimized in production

---

## 🚀 Future Architecture Evolution

### WebGPU Migration Path

```typescript
// Future WebGPU Backend
class WebGPURenderer implements IRendererBackend {
  private device: GPUDevice;
  private commandEncoder: GPUCommandEncoder;
  
  public initialize(): Promise<void> {
    // WebGPU device initialization
  }
  
  public createComputePipeline(): GPUComputePipeline {
    // Advanced compute shader pipeline
  }
}
```

### Distributed Rendering

```typescript
// Multi-GPU Architecture
class DistributedRenderer {
  private renderers: Map<string, IRendererBackend>;
  
  public distributeRender(scene: Scene, cameras: Camera[]): void {
    // Distribute rendering across multiple GPUs
  }
  
  public mergeResults(results: RenderResult[]): CompositeResult {
    // Merge distributed render results
  }
}
```

---

## 📚 Architecture Documentation

### API Documentation

Generated documentation available at: https://9thjs.com/docs/architecture

### Source Code Structure

```
src/
├── core/               # Core engine functionality
│   ├── Engine.ts
│   ├── Scene.ts
│   ├── Renderer.ts
│   └── Events.ts
├── cameras/            # Camera implementations
├── geometry/           # Geometric primitives
├── materials/          # Material system
├── lights/            # Lighting system
├── loaders/           # Asset loading
├── animation/         # Animation system
├── particles/         # Particle systems
├── physics/           # Physics engine
├── rendering/         # Advanced rendering
└── utils/             # Utility functions
```

---

## 🤝 Contributing to Architecture

### Architecture Guidelines

1. **Performance First**: Consider performance implications of all changes
2. **Modular Design**: Keep systems loosely coupled and highly cohesive
3. **Type Safety**: Maintain comprehensive TypeScript coverage
4. **Documentation**: Update architecture docs with significant changes
5. **Testing**: Include architecture-specific tests for new systems

### Architecture Review Process

1. **Design Proposal**: Document the proposed architecture
2. **Performance Impact**: Analyze performance implications
3. **Compatibility Review**: Ensure backward compatibility
4. **Security Review**: Consider security implications
5. **Community Feedback**: Gather community input
6. **Implementation**: Implement with careful testing

---

**Last Updated**: 2025-11-05  
**Document Version**: 1.0  
**Architecture Version**: 0.1.0

For questions about the architecture, please join our [developer discussions](https://github.com/username/9th.js/discussions) or contact our architecture team.
