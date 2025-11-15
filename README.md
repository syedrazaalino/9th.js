# 9th.js - Modern 3D Graphics Library

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/syedrazaalino/9th.js)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)]()

A modern, high-performance 3D JavaScript library for creating interactive graphics, visualizations, and games. Built from the ground up with WebGL, TypeScript, and modern web standards.

## ✨ Key Features

### 🎯 **Core Engine**
- **High-performance WebGL rendering** - Optimized for 60+ FPS with advanced culling and batching
- **Modern TypeScript architecture** - Full type safety with comprehensive TypeScript definitions
- **Modular design** - Import only what you need, tree-shake for minimal bundle sizes
- **Cross-platform compatibility** - Works seamlessly across browsers and devices

### 📷 **Advanced Camera System**
- **PerspectiveCamera** - Realistic perspective projection with FOV control
- **OrthographicCamera** - Perfect for 2D games and UI overlays
- **Camera controls** - OrbitControls, fly controls, and first-person controls
- **Multi-camera rendering** - Render scenes from multiple viewpoints simultaneously

### 💡 **Sophisticated Lighting**
- **AmbientLight** - Uniform global illumination
- **DirectionalLight** - Sun-like directional light with shadow support
- **PointLight** - Omnidirectional point lights
- **SpotLight** - Cone-shaped spotlight with angle and penumbra control
- **HDR Environment Mapping** - Physically-based environment lighting
- **Shadow Mapping** - High-quality real-time shadow rendering

### 🎨 **Material & Rendering System**
- **PBR (Physically Based Rendering)** - Industry-standard materials
  - MeshStandardMaterial, MeshPhysicalMaterial
  - IridescenceMaterial, ClearcoatMaterial, AnisotropicMaterial
  - SubsurfaceScatteringMaterial for realistic skin/organic materials
- **Shader customization** - Custom vertex and fragment shaders
- **Post-processing pipeline** - Bloom, tone mapping, anti-aliasing
- **Environment mapping** - Skyboxes and reflection probes

### 📦 **Geometry & Meshes**
- **Primitive geometries** - Box, Sphere, Cylinder, Cone, Plane, Circle
- **Advanced geometry** - NURBS surfaces, parametric curves
- **Geometry utilities** - Merging, simplification, compression
- **Instanced rendering** - Render thousands of objects efficiently
- **Morph targets** - Smooth transitions between different shapes
- **Skeletal animation** - Bone-based character animation

### 📁 **Asset Loaders**
- **3D Models** - GLTF/GLB, OBJ/MTL, PLY, STL support
- **Compressed assets** - Draco compression for efficient network delivery
- **Texture support** - JPEG, PNG, WebP, HDR, Cube maps
- **Audio integration** - Spatial audio for immersive experiences

### ✨ **Particle & Effects Systems**
- **GPU-accelerated particles** - Thousands of particles with custom behaviors
- **Fluid simulation** - Realistic fluid dynamics
- **Soft body physics** - Cloth and organic material simulation
- **Audio-reactive visuals** - Generate visuals from audio analysis

### ⚡ **Animation System**
- **Timeline animation** - Keyframe-based animations
- **Morph target animation** - Blend between different shapes
- **Skeletal animation** - Bone hierarchies with constraints
- **Procedural animation** - Physics-based and custom algorithms

### 🔬 **Physics Engine**
- **Rigid body dynamics** - Collision detection and response
- **Soft body simulation** - Cloth, ropes, and deformable materials
- **Joint constraints** - Hinges, springs, and mechanical connections
- **Performance optimization** - Broad-phase collision detection

### 🛠 **Development Tools**
- **Performance profiler** - Real-time FPS, memory, and GPU metrics
- **Bundle analyzer** - Visualize package sizes and dependencies
- **Scene editor** - Visual scene editing and debugging tools
- **Shader playground** - Interactive shader development

## 🚀 Quick Start

### Installation

```bash
npm install 9th.js
# or
yarn add 9th.js
# or
pnpm add 9th.js
```

### Basic 3D Scene

```javascript
import { 
  Engine, 
  Scene, 
  Renderer, 
  PerspectiveCamera, 
  BoxGeometry, 
  MeshStandardMaterial, 
  Mesh,
  DirectionalLight,
  AmbientLight
} from '9th.js';

// Initialize engine
const canvas = document.getElementById('canvas');
const engine = new Engine(canvas, { antialias: true });
const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new Renderer();

// Setup camera
camera.setPosition(0, 2, 5);
camera.lookAt(0, 0, 0);

// Add lighting
const ambientLight = new AmbientLight(0x404040, 0.4);
const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.setPosition(5, 5, 5);
scene.add(ambientLight, directionalLight);

// Create a 3D object
const geometry = new BoxGeometry(2, 2, 2);
const material = new MeshStandardMaterial({ 
  color: '#ff6b6b',
  metalness: 0.5,
  roughness: 0.2
});
const cube = new Mesh(geometry, material);
scene.add(cube);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate cube
  cube.rotation.y += 0.01;
  cube.rotation.x += 0.005;
  
  renderer.render(scene, camera);
}

animate();
```

## 📚 Documentation

### Core Guides
- [**Getting Started**](docs/guides/getting-started.md) - Learn the basics
- [**Core Concepts**](docs/guides/core-concepts.md) - Understand the architecture
- [**Rendering Pipeline**](docs/guides/rendering.md) - Deep dive into rendering
- [**Lighting Guide**](docs/guides/lighting.md) - Master lighting techniques
- [**Material System**](docs/guides/materials.md) - Work with materials
- [**Animation Guide**](docs/guides/animation.md) - Create dynamic scenes

### API Reference
- [**Complete API Reference**](docs/api/README.md) - Full API documentation
- [**Method Reference**](docs/api/method-reference.md) - Detailed method signatures
- [**Property Reference**](docs/api/property-reference.md) - Property documentation
- [**Event Reference**](docs/api/events-reference.md) - Event system
- [**Utility Functions**](docs/api/utility-functions.md) - Helper functions

### Tutorials
- [**First 3D Scene**](docs/tutorials/first-3d-scene.md) - Your first 3D scene
- [**Loading 3D Models**](docs/tutorials/loading-3d-models.md) - Import external assets
- [**Animation Basics**](docs/tutorials/animation-basics.md) - Bring objects to life
- [**Camera Controls**](docs/tutorials/camera-controls.md) - Interactive cameras
- [**Performance Optimization**](docs/tutorials/performance-optimization.md) - Optimize performance

### Examples

#### 🌱 Beginner Examples
- [Hello World](examples/tutorials/01-hello-world.html) - Basic setup
- [Basic Shapes](examples/tutorials/02-basic-shapes.html) - Primitive objects
- [Scene & Camera](examples/tutorials/03-scene-camera-renderer.html) - Core components
- [Materials](examples/tutorials/04-basic-materials.html) - Material basics
- [Lighting](examples/tutorials/05-lighting-basics.html) - Light your scene

#### 🚀 Intermediate Examples
- [Advanced Lighting](examples/intermediate/01-advanced-lighting.html) - Complex lighting
- [Custom Shaders](examples/intermediate/02-custom-shaders.html) - Shader programming
- [Skeletal Animation](examples/intermediate/03-skeletal-animation.html) - Character animation
- [Particle Systems](examples/intermediate/04-particles-advanced.html) - Particle effects
- [Post-Processing](examples/intermediate/08-post-processing.html) - Visual effects

#### 💎 Advanced Examples
- [Game Engine](examples/advanced/01-game-engine.html) - Complete game framework
- [Molecular Visualization](examples/advanced/02-molecular-visualization.html) - Scientific visualization
- [VR Experience](examples/advanced/07-vr-experience.html) - Virtual reality
- [Weather System](examples/advanced/06-weather-system.html) - Complex particle systems

#### 🎮 Specialized Examples
- [Games](examples/games/) - 2D/3D game examples
- [Scientific Visualization](examples/scientific/) - Research applications
- [Educational Tools](examples/education/) - Interactive learning
- [Architecture & CAD](examples/architecture/) - Architectural visualization
- [Showcase & Product Configurators](examples/showcase/) - Commercial applications

## 🏗 Architecture

### Core Modules

```typescript
// Import specific modules for tree-shaking
import { Engine } from '9th.js/core';
import { PerspectiveCamera } from '9th.js/cameras';
import { BoxGeometry } from '9th.js/geometry';
import { MeshStandardMaterial } from '9th.js/materials';
import { DirectionalLight } from '9th.js/lights';
import { GLTFLoader } from '9th.js/loaders';
```

### Module Structure

- **[@9thjs/core](src/core/)** - Engine, Scene, Renderer, Events
- **[@9thjs/cameras](src/cameras/)** - Camera types and controls
- **[@9thjs/geometry](src/geometry/)** - Geometric primitives and utilities
- **[@9thjs/materials](src/materials/)** - PBR, custom, and utility materials
- **[@9thjs/lights](src/lights/)** - All light types and lighting utilities
- **[@9thjs/loaders](src/loaders/)** - Asset loading (models, textures, audio)
- **[@9thjs/animation](src/animation/)** - Animation systems and keyframes
- **[@9thjs/particles](src/particles/)** - Particle systems and effects
- **[@9thjs/physics](src/physics/)** - Physics simulation and collision detection
- **[@9thjs/rendering](src/rendering/)** - Post-processing and advanced rendering

## 🛠 Development

### Building the Library

```bash
# Install dependencies
npm install

# Build all formats
npm run build

# Build specific formats
npm run build:esm     # ES modules
npm run build:umd     # UMD bundle
npm run build:iife    # IIFE bundle

# Development build with watching
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI testing
npm run test:ci
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Documentation

```bash
# Generate documentation
npm run docs

# Development server for docs
npm run docs:dev

# Build all documentation
npm run docs:build-all
```

## 🎯 Use Cases

### 🎮 Game Development
- 2D/3D games with physics and animation
- VR/AR experiences with WebXR support
- Real-time strategy and simulation games

### 🔬 Scientific Visualization
- Molecular modeling and visualization
- Data visualization and exploration
- Mathematical function plotting
- Educational tools and simulations

### 🏢 Business Applications
- Product configurators and 3D catalogs
- Architectural visualization and walkthroughs
- Training simulators and virtual environments
- E-commerce 3D product displays

### 🎨 Creative Applications
- Interactive art installations
- Music visualization and audio-reactive content
- Generative art and procedural content
- Digital art galleries and exhibitions

## 📊 Performance

9th.js is optimized for performance with several key features:

- **Efficient rendering pipeline** - Minimizes draw calls and GPU state changes
- **Automatic culling** - Frustum culling and occlusion culling
- **Level-of-detail (LOD)** - Automatic geometry simplification based on distance
- **Texture atlasing** - Combines textures to reduce binding calls
- **Geometry instancing** - Renders thousands of similar objects efficiently
- **Worker-based physics** - Offloads physics calculations to Web Workers

### Performance Benchmarks

- **Scene size**: 10,000+ objects at 60 FPS
- **Particle count**: 100,000+ particles on modern hardware
- **Model complexity**: 1M+ vertices with proper LOD
- **Bundle size**: <100KB minified + gzipped (core)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a feature branch
5. Make your changes
6. Run tests and linting
7. Submit a pull request

### Code Style
- TypeScript with strict mode enabled
- ESLint and Prettier for code formatting
- Comprehensive JSDoc documentation
- Unit tests for all new features
- Performance considerations for all changes

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Three.js and other great 3D libraries
- Built with modern web standards and best practices
- Community feedback and contributions
- Open source dependencies and tools

---

<div align="center">

Made with ❤️ by digitalcloud

</div>
