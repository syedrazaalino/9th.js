# Ninth.js API Documentation

## Overview

This documentation provides a comprehensive guide to the Ninth.js API, covering all major classes, methods, and utilities.

## Core Classes

### Engine

The main engine class that initializes and manages the 3D rendering environment.

```typescript
const engine = new Engine(canvas: HTMLCanvasElement, config?: EngineConfig)
```

**EngineConfig interface:**
```typescript
interface EngineConfig {
  antialias?: boolean;      // Enable anti-aliasing (default: true)
  alpha?: boolean;          // Enable alpha blending (default: false)
  depth?: boolean;          // Enable depth buffer (default: true)
  stencil?: boolean;        // Enable stencil buffer (default: false)
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
}
```

**Methods:**
- `dispose()` - Clean up engine resources

### Scene

Container for all 3D objects and manages the object hierarchy.

```typescript
const scene = new Scene()
```

**Methods:**
- `add(object: Mesh)` - Add an object to the scene
- `remove(object: Mesh)` - Remove an object from the scene
- `clear()` - Remove all objects from the scene
- `setBackground(color: string)` - Set scene background color
- `getBackground(): string | null` - Get current background color
- `getObjects(): Mesh[]` - Get all objects in the scene

### Renderer

Handles WebGL rendering operations.

```typescript
const renderer = new Renderer(canvas: HTMLCanvasElement)
```

**Methods:**
- `render(scene: Scene, camera: Camera)` - Render a scene with a camera
- `resize(width: number, height: number)` - Resize the renderer
- `getContext(): WebGLRenderingContext | null` - Get WebGL context
- `dispose()` - Clean up renderer resources

### Mesh

Base class for all 3D objects in the scene.

```typescript
const mesh = new Mesh(geometry: MeshGeometry)
```

**Properties:**
- `position: Vector3` - Object position
- `rotation: Vector3` - Object rotation (in radians)
- `scale: Vector3` - Object scale
- `visible: boolean` - Whether the object should be rendered

**Methods:**
- `setPosition(x: number, y: number, z: number)` - Set object position
- `setRotation(x: number, y: number, z: number)` - Set object rotation
- `setScale(x: number, y: number, z: number)` - Set object scale
- `getGeometry(): MeshGeometry` - Get the object's geometry
- `dispose()` - Clean up mesh resources

## Camera Classes

### PerspectiveCamera

Camera with perspective projection.

```typescript
const camera = new PerspectiveCamera(
  fov: number = 75,           // Field of view in degrees
  aspect: number = 1,         // Aspect ratio
  near: number = 0.1,         // Near clipping plane
  far: number = 1000,         // Far clipping plane
  config?: CameraConfig
)
```

**Methods:**
- `updateProjectionMatrix()` - Update the projection matrix
- `getProjectionMatrix(): Float32Array` - Get projection matrix

### OrthographicCamera

Camera with orthographic projection.

```typescript
const camera = new OrthographicCamera(
  left: number = -1,          // Left clipping plane
  right: number = 1,          // Right clipping plane
  top: number = 1,            // Top clipping plane
  bottom: number = -1,        // Bottom clipping plane
  near: number = 0.1,         // Near clipping plane
  far: number = 1000,         // Far clipping plane
  config?: CameraConfig
)
```

**Methods:**
- `updateProjectionMatrix()` - Update the projection matrix
- `getProjectionMatrix(): Float32Array` - Get projection matrix

## Geometry Classes

### BoxGeometry

Creates a box-shaped geometry.

```typescript
const geometry = new BoxGeometry(
  width: number = 1,
  height: number = 1,
  depth: number = 1
)
```

### SphereGeometry

Creates a sphere-shaped geometry.

```typescript
const geometry = new SphereGeometry(
  radius: number = 1,
  widthSegments: number = 8,
  heightSegments: number = 6
)
```

### PlaneGeometry

Creates a flat plane geometry.

```typescript
const geometry = new PlaneGeometry(
  width: number = 1,
  height: number = 1
)
```

## Material Classes

### BasicMaterial

Simple unlit material.

```typescript
const material = new BasicMaterial(options: {
  color?: string;         // Material color
  opacity?: number;       // Opacity (0-1)
  transparent?: boolean;  // Enable transparency
})
```

### PhongMaterial

Material with Phong shading.

```typescript
const material = new PhongMaterial(options: {
  color?: string;         // Diffuse color
  opacity?: number;       // Opacity (0-1)
  transparent?: boolean;  // Enable transparency
  shininess?: number;     // Specular shininess
  specular?: string;      // Specular color
})
```

## Light Classes

### AmbientLight

Uniform ambient lighting.

```typescript
const light = new AmbientLight(
  intensity: number = 0.5,
  color: string = '#ffffff'
)
```

### DirectionalLight

Directional light source.

```typescript
const light = new DirectionalLight(
  intensity: number = 1,
  color: string = '#ffffff',
  direction: Vector3 = { x: -1, y: -1, z: -1 }
)

light.setDirection(x: number, y: number, z: number)
```

### PointLight

Point light source.

```typescript
const light = new PointLight(
  intensity: number = 1,
  color: string = '#ffffff',
  position: Vector3 = { x: 0, y: 0, z: 0 },
  distance: number = 0,
  decay: number = 1
)

light.setPosition(x: number, y: number, z: number)
```

### SpotLight

Spotlight with angle control.

```typescript
const light = new SpotLight(
  intensity: number = 1,
  color: string = '#ffffff',
  position: Vector3 = { x: 0, y: 0, z: 0 },
  target: Vector3 = { x: 0, y: 0, z: 0 },
  angle: number = Math.PI / 6,
  penumbra: number = 0.3
)

light.setTarget(x: number, y: number, z: number)
```

## Utility Classes

### Vec3

3D vector utility class.

```typescript
const vector = new Vec3(x: number = 0, y: number = 0, z: number = 0)
```

**Methods:**
- `set(x: number, y: number, z: number)` - Set vector components
- `copy(v: Vector3)` - Copy another vector
- `add(v: Vector3)` - Add another vector
- `subtract(v: Vector3)` - Subtract another vector
- `multiplyScalar(scalar: number)` - Multiply by scalar
- `length(): number` - Get vector length
- `normalize()` - Normalize the vector
- `clone(): Vec3` - Create a copy
- `toVector3(): Vector3` - Convert to plain object

### Color

Color utility class.

```typescript
const color = new Color(r: number = 1, g: number = 1, b: number = 1)
```

**Methods:**
- `set(r: number, g: number, b: number)` - Set RGB values (0-1)
- `setHex(hex: number)` - Set color from hex number
- `multiplyScalar(scalar: number)` - Multiply color by scalar
- `clone(): Color` - Create a copy

### MathUtils

Mathematical utility functions.

```typescript
// Static methods
MathUtils.clamp(x: number, min: number, max: number)
MathUtils.lerp(a: number, b: number, t: number)
MathUtils.random(min: number = 0, max: number = 1)
MathUtils.degToRad(degrees: number)
MathUtils.radToDeg(radians: number)
MathUtils.normalizeAngle(angle: number)
```

### PerformanceMonitor

Performance monitoring utility.

```typescript
const monitor = new PerformanceMonitor()
monitor.update(currentTime: number)  // Call every frame
// monitor.fps - Current FPS
```

## Loading Classes

### Loader

Base loader class.

```typescript
const loader = new Loader(manager?: LoadingManager)
```

**Methods:**
- `load(url: string, onLoad?, onProgress?, onError?)` - Load a resource
- `setCrossOrigin(crossOrigin: string)` - Set CORS
- `setWithCredentials(value: boolean)` - Set credentials
- `setPath(path: string)` - Set base path

### TextureLoader

Texture loading utility.

```typescript
const loader = new TextureLoader(manager?: LoadingManager)
```

### JSONLoader

JSON data loading utility.

```typescript
const loader = new JSONLoader(manager?: LoadingManager)
```

### LoadingManager

Asset loading manager.

```typescript
const manager = new LoadingManager()
```

**Events:**
- `onLoad: () => void` - Called when all items are loaded
- `onProgress: (url: string, loaded: number, total: number) => void` - Progress callback
- `onError: (url: string) => void` - Error callback

## Types

### Vector3

```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}
```

### MeshGeometry

```typescript
interface MeshGeometry {
  vertices: Float32Array;
  indices?: Uint16Array | Uint32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
}
```

### CameraConfig

```typescript
interface CameraConfig {
  position?: Vector3;
  target?: Vector3;
  up?: Vector3;
}
```

### Material

```typescript
interface Material {
  render(): void;
  dispose(): void;
}
```

### Light

```typescript
interface Light {
  intensity: number;
  color: string;
  castShadow: boolean;
  render(): void;
  dispose(): void;
}
```

### LoadProgress

```typescript
interface LoadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
```