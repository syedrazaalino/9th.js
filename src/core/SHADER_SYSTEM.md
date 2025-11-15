# Shader and Material System

This document describes the WebGL shader system and material management implementation.

## Overview

The shader system provides a comprehensive solution for managing WebGL shaders and materials in 3D rendering applications. It includes shader compilation, uniform management, attribute handling, and material state management.

## Core Components

### 1. Shader Class (`src/core/Shader.js`)

The `Shader` class handles all WebGL shader operations:

#### Features:
- **Shader Compilation**: Compiles individual vertex and fragment shaders
- **Program Linking**: Links shaders into executable programs
- **Uniform Management**: Cache and set uniform values
- **Attribute Handling**: Manage vertex attributes and pointer configuration
- **Location Caching**: Automatically caches uniform and attribute locations

#### Key Methods:

```javascript
// Create a new shader instance
const shader = new Shader(gl);

// Compile and link shaders
shader.createProgram(vertexSource, fragmentSource);

// Set uniform values
shader.setUniform('uColor', [1.0, 0.0, 0.0]);
shader.setUniform('uOpacity', 0.5);
shader.setUniform('uMatrix', matrix4x4);

// Get uniform value
const color = shader.getUniform('uColor');

// Set vertex attribute pointer
shader.setAttributePointer('aPosition', 3, gl.FLOAT, false, 0, 0);

// Enable shader program
shader.use();

// Clean up resources
shader.dispose();
```

#### Supported Uniform Types:
- **Numbers**: `shader.setUniform('value', 1.5)`
- **Vectors**: `[x, y]`, `[x, y, z]`, `[x, y, z, w]`
- **Matrices**: 3x3 or 4x4 matrices (Float32Array or regular arrays)
- **Booleans**: `true` or `false`
- **Textures**: `{ type: 'texture', texture: webglTexture, unit: 0 }`

### 2. Material Class (`src/core/Material.js`)

The `Material` class manages shader programs and material properties:

#### Features:
- **Property Management**: Store and manage material properties
- **Uniform Integration**: Automatically sync properties to shader uniforms
- **Texture Management**: Handle multiple textures with units
- **Rendering State**: Configure blending, depth testing, face culling
- **Material Cloning**: Create copies of materials efficiently

#### Key Methods:

```javascript
// Create material from shader
const material = new Material(shader);

// Set material properties
material.setProperty('uColor', [1.0, 0.0, 0.0]);
material.setUniform('uOpacity', 0.8);

// Set textures
material.setTexture('uDiffuseMap', texture, 0);

// Configure rendering state
material.setBlending(true, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
material.setDepthTest(true);
material.setCullFace(true, 'back');
material.setTransparent(true);
material.setOpacity(0.5);

// Apply material to WebGL context
material.apply(gl);

// Clone material
const clonedMaterial = material.clone();
```

#### Rendering State Configuration:

**Blending:**
```javascript
material.setBlending(
    true,                    // Enable blending
    gl.SRC_ALPHA,           // Source factor
    gl.ONE_MINUS_SRC_ALPHA, // Destination factor
    gl.FUNC_ADD             // Blend equation
);
```

**Depth Testing:**
```javascript
material.setDepthTest(true);  // Enable depth testing
material.setDepthWrite(false); // Disable depth writing
```

**Face Culling:**
```javascript
material.setCullFace(true, 'back'); // Cull back faces
// Other options: 'front', 'frontAndBack'
```

### 3. Predefined Material Types

#### BasicMaterial
Simple unlit material with color and opacity:
```javascript
const material = new BasicMaterial(shader, {
    color: [1.0, 0.0, 0.0],  // Red
    opacity: 1.0,
    transparent: false
});
```

#### PhongMaterial
Phong shading model with diffuse, specular, and ambient components:
```javascript
const material = new PhongMaterial(shader, {
    diffuse: [0.8, 0.2, 0.2],
    specular: [1.0, 1.0, 1.0],
    ambient: [0.2, 0.2, 0.2],
    shininess: 32,
    opacity: 1.0,
    transparent: false
});
```

#### LambertMaterial
Lambertian shading model:
```javascript
const material = new LambertMaterial(shader, {
    diffuse: [0.8, 0.2, 0.2],
    ambient: [0.2, 0.2, 0.2],
    opacity: 1.0,
    transparent: false
});
```

## Usage Example

```javascript
import { Shader, Material, PhongMaterial } from './src/core/Material.js';
import { Shader } from './src/core/Shader.js';

// Vertex shader
const vertexShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec3 vNormal;

void main() {
    vNormal = aNormal;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

// Fragment shader
const fragmentShader = `
precision mediump float;

uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vNormal;

void main() {
    gl_FragColor = vec4(uColor, uOpacity);
}
`;

// Initialize WebGL
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Create and compile shader
const shader = new Shader(gl);
shader.createProgram(vertexShader, fragmentShader);

// Create material
const material = new PhongMaterial(shader, {
    diffuse: [1.0, 0.0, 0.0],
    specular: [1.0, 1.0, 1.0],
    shininess: 32
});

// During rendering
function render() {
    // Apply material state
    material.apply(gl);
    
    // Set camera uniforms
    material.setUniform('uModelViewMatrix', modelViewMatrix);
    material.setUniform('uProjectionMatrix', projectionMatrix);
    
    // Render geometry...
}
```

## Integration with Mesh System

Materials work seamlessly with the mesh system:

```javascript
// Geometry from primitives
import { BoxGeometry } from './src/geometry/primitives.js';
import { Mesh } from './src/core/mesh.js';

const geometry = new BoxGeometry(1, 1, 1);
const mesh = new Mesh(geometry);
mesh.material = material;

// During rendering
mesh.render(gl);
```

## Error Handling

The shader system includes comprehensive error handling:

```javascript
try {
    shader.createProgram(vertexSource, fragmentSource);
} catch (error) {
    console.error('Shader compilation failed:', error.message);
    // Handle error appropriately
}
```

## Best Practices

1. **Shader Compilation**: Compile shaders once and reuse them
2. **Material Reuse**: Clone materials when creating variations
3. **Uniform Updates**: Only update uniforms when values change
4. **Resource Cleanup**: Always dispose of shaders and materials when done
5. **State Management**: Group materials by state to minimize WebGL state changes

## Performance Considerations

- Shader compilation is expensive - compile at initialization
- Cache uniform locations to avoid repeated lookups
- Use material clones for similar materials
- Minimize uniform updates between renders
- Batch rendering by material to reduce state changes

## API Reference

See the JSDoc comments in the source files for complete API documentation.
