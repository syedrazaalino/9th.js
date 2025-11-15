# 9th.js Release Channels

A comprehensive multi-channel release system for the 9th.js 3D graphics library, enabling different distribution strategies for various use cases and audiences.

## Overview

The 9th.js library provides **four distinct release channels**, each optimized for specific use cases and development scenarios:

- **Core** (`9th.js-core`) - Minimal core library for essential 3D graphics
- **Full** (`9th.js-full`) - Complete library with all features and extensions
- **Module** (`9th.js-module`) - ESM-only distribution optimized for modern bundlers
- **Experimental** (`9th.js-experimental`) - Bleeding-edge features and next-gen APIs

## Channel Specifications

### Core Channel (`9th.js-core`)
```json
{
  "name": "9th.js-core",
  "version": "0.1.0",
  "description": "Minimal core 3D graphics library - essential features only"
}
```

**Target Audience**: Developers who need only essential 3D functionality
**Bundle Size**: ~45KB (ESM), ~50KB (CJS)
**Included Modules**:
- Core rendering engine
- Basic geometry system
- Essential cameras

**Excluded Features**:
- Advanced materials
- Physics simulation
- Particle systems
- Experimental features
- AI integration

### Full Channel (`9th.js-full`)
```json
{
  "name": "9th.js-full",
  "version": "0.1.0",
  "description": "Complete 3D graphics library with all features and extensions"
}
```

**Target Audience**: Complete 3D applications requiring full feature set
**Bundle Size**: ~180KB (ESM), ~200KB (CJS), ~250KB (UMD)
**Included Modules**:
- Complete rendering engine
- All geometry types
- Advanced materials and shaders
- Animation system
- Model loaders (GLTF, OBJ, STL, PLY)
- Comprehensive lighting system
- Particle systems
- Physics integration
- Camera controls
- Texture management

### Module Channel (`9th.js-module`)
```json
{
  "name": "9th.js-module",
  "version": "0.1.0",
  "description": "ESM-only 3D graphics library - optimized for modern bundlers"
}
```

**Target Audience**: Modern web applications using ES modules and bundlers
**Bundle Size**: ~90KB (ESM), ~60KB (minified)
**Features**:
- ES2020+ module syntax
- Tree-shaking optimized
- Modern bundler compatible (Webpack 5+, Rollup 3+, Vite 3+)
- Native ES modules only
- No CommonJS/UMD overhead

### Experimental Channel (`9th.js-experimental`)
```json
{
  "name": "9th.js-experimental",
  "version": "0.2.0-experimental.1",
  "description": "Experimental 3D graphics library - bleeding-edge features and APIs"
}
```

**Target Audience**: Early adopters and developers testing next-generation features
**Bundle Size**: ~350KB (ESM), ~380KB (CJS), ~420KB (UMD)
**Experimental Features**:
- AI-driven rendering
- WebGPU backend
- Real-time global illumination
- Hybrid raster/ray tracing pipeline

## Build System Architecture

### Build Scripts
Each channel has a dedicated build script:

```bash
# Core build
npm run channel:build:core           # Minimal features build
node build-core.js                   # Direct script execution

# Full build  
npm run channel:build:full           # Complete features build
node build-full.js                   # Direct script execution

# Module build
npm run channel:build:module         # ESM-only build
node build-module.js                 # Direct script execution

# Experimental build
npm run channel:build:experimental   # Bleeding-edge build
node build-experimental.js           # Direct script execution
```

### Build Configuration Files
```
├── rollup.config.js           # Main build configuration
├── rollup.module.config.js    # ESM-only configuration
├── tsconfig.json              # Base TypeScript configuration
├── tsconfig.core.json         # Core-specific TypeScript config
├── tsconfig.module.json       # Module-specific TypeScript config
└── tsconfig.experimental.json # Experimental TypeScript config
```

## Version Management System

### Semantic Versioning Strategy

Each channel follows a tailored versioning strategy:

| Channel | Versioning Strategy | Update Frequency | Stability |
|---------|-------------------|------------------|-----------|
| **Core** | Conservative (patch/minor) | Low | High |
| **Full** | Standard (minor) | Medium | High |
| **Module** | Frequent (patch) | High | Medium |
| **Experimental** | Rapid (pre-release) | Very High | Low |

### Version Commands

```bash
# List all channel versions
npm run channel:version:list

# Version specific channel
npm run channel:version:core patch
npm run channel:version:full minor
npm run channel:version:experimental alpha

# Advanced versioning with version-manager.js
node version-manager.js core patch              # Core channel
node version-manager.js full minor              # Full channel
node version-manager.js experimental patch alpha # Experimental pre-release

# Information
npm run channel:version:info                    # Channel configuration
```

### Version Synchronization

Sync versions across channels using different strategies:

```bash
# Conservative sync (recommended)
npm run channel:sync:versions --strategy conservative

# Aggressive sync for rapid development
npm run channel:sync:versions --strategy aggressive

# Experimental sync (includes experimental channel)
npm run channel:sync:versions --strategy experimental --update-experimental

# Preview changes without applying
npm run channel:sync:versions --dry-run

# Show version matrix
npm run channel:sync:versions --matrix
```

## Package Distribution

### NPM Tags and Publishing

Each channel uses distinct NPM tags:

```bash
# Core channel
npm publish --tag latest-core

# Full channel  
npm publish --tag latest-full

# Module channel
npm publish --tag latest-module

# Experimental channel
npm publish --tag experimental
```

### Publishing Commands

```bash
# Publish specific channel
npm run channel:publish:core
npm run channel:publish:full
npm run channel:publish:module
npm run channel:publish:experimental

# Publish all channels
npm run channel:publish:all

# Full release pipeline
npm run channel:release                    # Complete release
npm run channel:release:core              # Core only
npm run channel:release:full              # Full only
npm run channel:release:module            # Module only
npm run channel:release:experimental      # Experimental only
```

## Development Workflows

### Development Mode

```bash
# Watch mode for individual channels
npm run channel:dev:core                  # Core development
npm run channel:dev:full                  # Full development
npm run channel:dev:module                # Module development
npm run channel:dev:experimental          # Experimental development

# Watch all channels simultaneously
npm run channel:dev:all
```

### Testing and Validation

```bash
# Test individual channels
npm run channel:test:core
npm run channel:test:full
npm run channel:test:module
npm run channel:test:experimental

# Test all channels
npm run channel:test:all

# Validate all channels
npm run channel:validate:all
npm run channel:validate:core
npm run channel:validate:full
npm run channel:validate:module
npm run channel:validate:experimental
```

### Bundle Analysis

```bash
# Analyze all channel bundle sizes
npm run channel:analyze:sizes

# Individual channel analysis
npm run size:core
npm run size:full
npm run size:module
npm run size:experimental
```

## Complete Release Pipeline

### Automated Release Process

```bash
# Complete release pipeline
npm run channel:release
```

This command executes:
1. **Version synchronization** (`npm run channel:sync:versions`)
2. **Validation** (`npm run channel:validate:all`)
3. **Build all channels** (`npm run channel:build:all`)
4. **Bundle analysis** (`npm run channel:analyze:sizes`)
5. **Publish all channels** (`npm run channel:publish:all`)

### Manual Release Steps

```bash
# 1. Sync versions
npm run channel:sync:versions --strategy conservative

# 2. Validate all channels
npm run channel:validate:all

# 3. Build all channels
npm run channel:build:all

# 4. Analyze bundle sizes
npm run channel:analyze:sizes

# 5. Test all channels
npm run channel:test:all

# 6. Publish
npm run channel:publish:all
```

## Package Installation Guide

### For End Users

Choose the right channel for your use case:

```bash
# Essential 3D functionality only
npm install 9th.js-core

# Complete feature set
npm install 9th.js-full

# Modern ESM projects (recommended)
npm install 9th.js-module

# Experimental features (use with caution)
npm install 9th.js-experimental
```

### Usage Examples

#### Core Package Usage
```javascript
// Import only essential features
import { Scene, PerspectiveCamera, WebGLRenderer } from '9th.js-core/core';

const scene = new Scene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer();
```

#### Full Package Usage
```javascript
// Import everything
import { 
  Scene, 
  WebGLRenderer, 
  GLTFLoader, 
  ParticleSystem,
  PhysicsWorld 
} from '9th.js-full';

const scene = new Scene();
const physics = new PhysicsWorld();
const particles = new ParticleSystem();
```

#### Module Package Usage
```javascript
// ESM-optimized imports
import { Scene, WebGLRenderer } from '9th.js-module';

const scene = new Scene();
const renderer = new WebGLRenderer();

// Tree-shaking works perfectly
// Only imported code is included in bundle
```

#### Experimental Package Usage
```javascript
// Bleeding-edge features
import { 
  WebGPURenderer, 
  AIRenderer, 
  RealtimeGI,
  PhotonMapper 
} from '9th.js-experimental';

const gpuRenderer = new WebGPURenderer(canvas);
const aiRenderer = new AIRenderer();
const gi = new RealtimeGI();
```

## Performance Considerations

### Bundle Size Comparison

| Channel | Uncompressed | Minified | Gzipped |
|---------|-------------|----------|---------|
| **Core** | ~50KB | ~30KB | ~12KB |
| **Full** | ~250KB | ~180KB | ~65KB |
| **Module** | ~90KB | ~60KB | ~22KB |
| **Experimental** | ~420KB | ~350KB | ~120KB |

### Performance Recommendations

- **Core**: Use for simple 3D scenes, maximum bundle size constraints
- **Full**: Use for complete 3D applications, moderate performance requirements
- **Module**: Use for modern web apps, best tree-shaking and bundler integration
- **Experimental**: Use for R&D, next-gen features, accept performance trade-offs

## Migration Between Channels

### Upgrading from Core to Full
```bash
# Change package.json
npm uninstall 9th.js-core
npm install 9th.js-full
```

### Migrating to Module (Recommended for Modern Projects)
```bash
# Update package.json
npm uninstall 9th.js-full
npm install 9th.js-module
```

### Using Experimental Features
```bash
# Install alongside stable version
npm install 9th.js-module 9th.js-experimental

// Use experimental features selectively
import { WebGPURenderer } from '9th.js-experimental';
import { Scene } from '9th.js-module';
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean all builds
npm run clean:all

# Rebuild specific channel
npm run channel:build:core
```

#### Version Conflicts
```bash
# Sync versions
npm run channel:sync:versions --dry-run
npm run channel:sync:versions
```

#### Publishing Issues
```bash
# Check channel configuration
npm run channel:version:list

# Validate packages before publishing
npm run channel:validate:all
```

### Getting Help

- **Documentation**: Check `/docs` directory
- **Examples**: See `/examples` directory  
- **Issues**: Report on GitHub
- **Discussions**: Use GitHub Discussions

## Contributing to Release Channels

### Adding New Features

1. **Core**: Add to `src/core/` - must be essential functionality
2. **Full**: Add to appropriate `src/` directory
3. **Module**: Ensure ESM compatibility
4. **Experimental**: Add to `src/experimental/` - can be unstable

### Channel-Specific Guidelines

- **Core**: Minimal API, maximum stability, conservative changes
- **Full**: Complete API, backward compatibility, comprehensive testing
- **Module**: ESM-first, tree-shaking optimization, modern JavaScript
- **Experimental**: Unstable APIs allowed, rapid iteration, extensive documentation

## Advanced Configuration

### Custom Build Options

Each build script supports additional flags:

```bash
# Watch mode
node build-core.js --watch

# ESM-only build
node build-full.js --esm

# UMD-only build  
node build-full.js --umd

# Development build
node build-experimental.js --dev
```

### Environment Variables

```bash
# Build optimization
NODE_ENV=production npm run channel:build:full

# Debug builds
DEBUG=1 npm run channel:build:experimental

# Custom output directory
OUTPUT_DIR=dist/custom npm run channel:build:core
```

---

**🎯 Choose the right channel for your project and leverage the full power of 9th.js!**