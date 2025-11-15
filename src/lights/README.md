# Lighting System Infrastructure

A comprehensive lighting system for 3D graphics rendering with efficient light management, shader integration, and performance optimization.

## Table of Contents

1. [Overview](#overview)
2. [Core Infrastructure](#core-infrastructure)
3. [Light Types](#light-types)
4. [Usage Examples](#usage-examples)
5. [Advanced Features](#advanced-features)
6. [Mathematical Models](#mathematical-models)
7. [Integration](#integration)
8. [Best Practices](#best-practices)

## Overview

This document describes the comprehensive lighting system implementation with:
- **Core Infrastructure**: Base classes, managers, and uniform systems
- **Light Types**: Four main light types with proper attenuation and shadow casting
- **Performance Optimization**: Frustum culling, light management, and optimization
- **Shader Integration**: Automatic uniform generation and shader templates

## Core Infrastructure

### 1. Light Class (`Light.js`)

Base class for all light types with common properties and methods:

```javascript
import { Light } from './Light.js';

const light = new Light({
  color: '#ffffff',
  intensity: 1.0,
  castShadow: true,
  shadowBias: 0.0005
});

light.setPosition(10, 10, 10);
light.setColor('#ff0000');
light.setIntensity(1.5);
```

**Features:**
- Automatic ID generation
- Transform management (position, rotation, scale)
- Shadow mapping support
- Shader uniforms generation
- Performance tracking
- Cloning and copying capabilities

### 2. Light Types (`LightTypes.js`)

Comprehensive enumeration and utilities:

```javascript
import { LightType, requiresShadows, getDefaultLightProperties } from './LightTypes.js';

// Check if light type supports shadows
if (requiresShadows(LightType.DIRECTIONAL)) {
  // Enable shadows for directional lights
}

// Get default properties for a light type
const defaults = getDefaultLightProperties(LightType.SPOT);
```

**Supported Light Types:**
- `AMBIENT`: Ambient lighting
- `DIRECTIONAL`: Sun-like directional light
- `POINT`: Omnidirectional point light
- `SPOT`: Cone-shaped spotlight
- `HEMISPHERE`: Sky/ground lighting
- `RECT_AREA`: Rectangular area light
- `VOLUME`: Volumetric lighting

### 3. Light Group (`LightGroup.js`)

Organize lights into hierarchical groups:

```javascript
import { LightGroup } from './LightGroup.js';

const group = new LightGroup('Indoor Lights');
group.add(ambientLight);
group.add(directionalLight);
group.add(pointLight);

// Get lights by type
const spotLights = group.getSpotLights();
const shadowCasters = group.getShadowCasters();
```

**Features:**
- Hierarchical grouping
- Type-based categorization
- Performance optimization with caching
- Frustum culling support
- Recursive light finding

### 4. Light Uniforms (`LightUniforms.js`)

Manage shader uniforms for lighting calculations:

```javascript
import { LightUniforms } from './LightUniforms.js';

const uniforms = new LightUniforms(8); // Max 8 lights
uniforms.addLight(light, 0); // Add light at index 0

// Get shader template
const shaderTemplate = uniforms.getShaderTemplate();
```

**Features:**
- Automatic uniform structure generation
- Shader template generation
- Type-specific uniform management
- Shadow map integration
- Performance optimization

### 5. Light Manager (`LightManager.js`)

Central management for all lights:

```javascript
import { LightManager } from './LightManager.js';
import { LightType } from './LightTypes.js';

const manager = new LightManager({
  maxLights: 8,
  maxShadowMaps: 4,
  shadowEnabled: true,
  frustumCulling: true
});

// Add lights
manager.createLight(LightType.DIRECTIONAL, {
  intensity: 1.0,
  color: '#ffffff',
  castShadow: true
});

manager.createLight(LightType.AMBIENT, {
  intensity: 0.3,
  color: '#404040'
});

// Update and render
manager.update(deltaTime, camera);
```

**Features:**
- Centralized light management
- Performance optimization
- Frustum culling
- Automatic shadow management
- Event system
- Performance monitoring

## Usage Examples

### Basic Setup

```javascript
import { createLightingSystem } from './index.js';

// Create a lighting system with defaults
const lighting = createLightingSystem({
  maxLights: 8,
  mainDirectional: true
});

// Add additional lights
const pointLight = lighting.createLight(LightType.POINT, {
  intensity: 1.0,
  color: '#ffffaa',
  position: { x: 5, y: 3, z: 5 },
  distance: 20,
  castShadow: true
});

// Update lights each frame
function update(deltaTime) {
  lighting.manager.update(deltaTime, camera);
}
```

### Using Lighting Presets

```javascript
import { applyLightingPreset } from './index.js';

// Apply preset lighting
applyLightingPreset(manager, 'outdoor');

// Available presets:
applyLightingPreset(manager, 'indoor');
applyLightingPreset(manager, 'studio');
applyLightingPreset(manager, 'night');
applyLightingPreset(manager, 'performance');
applyLightingPreset(manager, 'highQuality');
```

### Advanced Management

```javascript
// Performance optimization
manager.optimizeLights('medium'); // 'low', 'medium', 'high', 'ultra'

// Frustum culling setup
manager.setFrustum(camera.frustum);
manager.setCullingDistance(50);

// Event handling
manager.addEventListener('lightAdded', ({ light }) => {
  console.log('Light added:', light.type);
});

manager.addEventListener('updated', ({ performance }) => {
  console.log('Update time:', performance.updateTime);
});

// Get performance stats
const stats = manager.getStats();
console.log('Active lights:', stats.activeLights);
console.log('Shadow casters:', stats.shadowCasters);
```

### Shader Integration

```javascript
import { LightUniforms } from './LightUniforms.js';

const uniforms = new LightUniforms(8);
const shaderTemplate = uniforms.getShaderTemplate();

// Use vertex shader
const vertexShader = `
  attribute vec3 position;
  attribute vec3 normal;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Use fragment shader template from uniforms
const fragmentShader = shaderTemplate.fragment;
```

### Performance Optimization

```javascript
// Enable frustum culling
manager.setFrustumCulling(true);
manager.setCullingDistance(100);

// Set camera frustum
manager.setFrustum(camera.frustum);

// Automatically optimize lights
manager.optimizeLights('medium');

// Get performance stats
const stats = manager.getStats();
console.log('Performance:', {
  totalLights: stats.totalLights,
  activeLights: stats.activeLights,
  updateTime: stats.updateTime,
  cullTime: stats.cullTime
});
```

## Light Types Overview

### 1. AmbientLight
Uniform lighting that illuminates all objects equally throughout the scene.

**Features:**
- **Uniform Illumination**: Same intensity from all directions
- **No Shadows**: Ambient light doesn't cast shadows
- **Base Lighting**: Provides minimum visibility for all objects
- **Color/Intensity Control**: Full color and intensity customization

**Usage:**
```javascript
import { AmbientLight } from './index.js';

// Basic usage
const ambientLight = new AmbientLight(0.5, '#ffffff');

// Custom color
const warmAmbient = new AmbientLight(0.3, '#fff8dc');

// Using hex color
const blueAmbient = new AmbientLight(0.4, '#4a90e2');

// Add to manager
manager.addLight(ambientLight);

// Or create through manager
const ambient = manager.createLight(LightType.AMBIENT, {
  intensity: 0.4,
  color: '#87ceeb'
});
```

**Shader Integration:**
```glsl
vec3 ambientContribution = calculateAmbientLight(
    surfaceColor,
    ambientLight.intensity,
    ambientLight.color
);
```

---

### 2. DirectionalLight
Sun-like directional light with parallel rays and comprehensive shadow mapping.

**Features:**
- **Directional Lighting**: Parallel rays like sunlight
- **Shadow Mapping**: Full shadow casting with configurable shadow maps
- **Distance Attenuation**: Realistic falloff with distance
- **Sun Simulation**: Supports sun position and target settings

**Usage:**
```javascript
import { DirectionalLight } from './index.js';
import { LightManager } from './LightManager.js';

// Basic sun-like light
const sunLight = new DirectionalLight(1.0, '#ffffff', { x: -1, y: -1, z: -1 });

// Custom sun position
const sun = new DirectionalLight(1.2, '#fff8dc', { x: 10, y: 10, z: 10 });
sun.setRotation(-Math.PI / 4, -Math.PI / 4, 0);

// Configure shadows
sun.castShadow = true;
sun.shadowBias = 0.0001;
sun.shadowMapSize = 2048;

// Add to manager
manager.addLight(sun);

// Or create through manager
const directional = manager.createLight(LightType.DIRECTIONAL, {
  intensity: 1.2,
  color: '#fff8dc',
  castShadow: true,
  shadowBias: 0.0005,
  shadowMapSize: 2048
});
directional.setPosition(10, 10, 10);
directional.setRotation(-Math.PI / 4, -Math.PI / 4, 0);
```
```

**Attenuation:**
```javascript
// Calculate attenuation for a fragment
const attenuation = light.calculateAttenuation(worldPosition);
```

**Shadow Integration:**
```glsl
// Directional light shadow calculation
float shadow = calculateDirectionalShadow(
    directionalLight,
    normal,
    surfacePos,
    shadowMap,
    lightSpaceMatrix
);
```

---

### 3. PointLight
Omnidirectional point light with distance-based attenuation and cubemap shadows.

**Features:**
- **Omnidirectional**: Light radiates equally in all directions
- **Inverse Square Law**: Realistic distance-based attenuation
- **Cubemap Shadows**: 6-directional shadow mapping
- **Flexible Attenuation**: Customizable falloff curves

**Usage:**
```javascript
import { PointLight } from './lights/PointLight.js';
import { Vec3 } from '../extras/helpers.js';

// Basic point light
const bulb = new PointLight(1.0, '#ffffff', new Vec3(5, 5, 5));

// Limited range with custom decay
const torch = new PointLight(2.0, '#ffdfa0', new Vec3(0, 2, 0), 10, 1.5);

// High intensity light
const explosion = new PointLight(5.0, '#ff4000', position, 20, 2.0);
```

**Attenuation Options:**
```javascript
// Infinite distance
const infiniteLight = new PointLight(1.0, color, position, 0, 2);

// Limited range
const limitedLight = new PointLight(1.0, color, position, 15, 2);

// Custom attenuation curve
const customLight = new PointLight(1.0, color, position, 20, 2);
customLight.constant = 1.0;
customLight.linear = 0.1;
customLight.quadratic = 0.5;
```

**Shadow Cubemap:**
```javascript
// Get shadow cameras for all 6 directions
const shadowCameras = pointLight.getShadowCameras();

// Sample cubemap shadow
float shadow = calculatePointLightShadow(
    pointLight,
    normal,
    surfacePos,
    shadowCubeMap
);
```

---

### 4. SpotLight
Conical spotlight with angle-based attenuation and focused beam.

**Features:**
- **Conical Light**: Focused beam with controlled angle
- **Penumbra**: Soft edge falloff for natural transitions
- **Angle Attenuation**: Smooth falloff within the cone
- **Target System**: Configurable aim direction

**Usage:**
```javascript
import { SpotLight } from './lights/SpotLight.js';
import { Vec3 } from '../extras/helpers.js';

// Basic spotlight
const spotlight = new SpotLight(1.0, '#ffffff', new Vec3(5, 5, 5), new Vec3(0, 0, 0));

// Narrow beam
const laser = new SpotLight(2.0, '#ff0000', position, target, Math.PI / 12); // 15 degrees

// Wide beam with soft edges
const stageLight = new SpotLight(1.5, '#fff8dc', position, target, Math.PI / 3, 0.5); // 60 degrees, 50% penumbra
```

**Cone Configuration:**
```javascript
const spot = new SpotLight();
spot.setAngle(Math.PI / 4); // 45 degrees
spot.setPenumbra(0.3); // 30% soft edge
spot.setTarget(0, 0, -1); // Aim direction
```

**Attenuation Methods:**
```javascript
// Check if point is in cone
const inCone = spotlight.isInCone(worldPosition);

// Calculate angle attenuation
const angleAtt = spotlight.calculateAngleAttenuation(worldPosition);

// Complete attenuation (distance + angle)
const totalAtt = spotlight.calculateTotalAttenuation(worldPosition);
```

**Visualization:**
```javascript
// Get cone geometry for rendering
const coneData = spotlight.getSpotVolume();
console.log(`Cone radius: ${coneData.radius}, Height: ${coneData.height}`);
```

## Advanced Features

### Shader Integration

Each light provides comprehensive shader integration:

```javascript
// Get shader uniforms
const uniforms = light.getShaderUniforms();

// Get GLSL shader code
const shaderCode = light.getShaderCode();

// Shader uniform structure
const uniforms = {
    pointLight_color: { value: [r, g, b], type: 'vec3' },
    pointLight_intensity: { value: intensity, type: 'float' },
    pointLight_position: { value: [x, y, z], type: 'vec3' },
    // ... additional uniforms
};
```

### Shadow Mapping

All lights support advanced shadow mapping:

**DirectionalLight:**
- Orthographic projection shadow maps
- Large area coverage
- Configurable shadow camera frustum

**PointLight:**
- Omnidirectional cubemap shadows
- 6 render passes per frame
- Distance-based shadow sampling

**SpotLight:**
- Perspective projection shadows
- Single directional shadow
- Optimized for focused lighting

### Performance Optimization

```javascript
// Add affected objects for optimization
light.addAffectedObject(meshObject);
const affectedObjects = light.getAffectedObjects();

// Check if light affects object
const affects = light.affectsObject(meshObject);

// Update performance monitoring
light.update(deltaTime);
```

### Animation Support

```javascript
// Override animation methods
class AnimatedSpotLight extends SpotLight {
    _updateLightAnimation(deltaTime) {
        // Custom animation logic
        const angle = this.angle + Math.sin(Date.now() * 0.001) * 0.1;
        this.setAngle(angle);
    }
}
```

## Mathematical Models

### Attenuation Functions

**Distance Attenuation (Point/Spot):**
```
attenuation = 1.0 / (constant + linear * distance + quadratic * distance² * decay)
```

**Angle Attenuation (SpotLight):**
```
if (angle <= innerAngle): return 1.0
if (angle > outerAngle): return 0.0
return (outerAngle - angle) / (outerAngle - innerAngle)
```

**Inverse Square Law:**
```
I = I₀ / (distance²)
```

### Shadow Mapping

**Directional Light:**
- Light space: [lightView × lightProjection]
- Shadow map: 2D texture with depth values
- Bias application: `currentDepth - bias > shadowDepth`

**Point Light:**
- Light space: Cubemap (6 faces)
- Shadow map: Cube texture with depth values
- Direction-based sampling: `shadowDirection = normalize(surfacePos - lightPos)`

**Spot Light:**
- Light space: [lightView × lightProjection]
- Perspective projection with aspect ratio
- Cone-based shadow calculation

## Integration with Materials

```javascript
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial.js';

const material = new MeshPhongMaterial({
    color: 0x4488ff,
    shininess: 32
});

// Material will automatically use light uniforms
material.addLight(ambientLight);
material.addLight(directionalLight);
material.addLight(pointLight);
material.addLight(spotlight);
```

## Best Practices

1. **Light Combination**: Use ambient + directional for basic lighting
2. **Performance**: Limit shadow-casting lights to 3-4 per scene
3. **Range Limits**: Always set appropriate `distance` for performance
4. **Shadow Quality**: Balance shadow `mapSize` with performance needs
5. **Light Colors**: Use realistic color temperatures for different light types

## Testing and Debugging

```javascript
// Visual debugging
const coneViz = spotlight.getSpotVolume();
console.log('Spotlight visualization:', coneViz);

// Shadow camera debug
const shadowCams = pointLight.getShadowCameras();
console.log('Shadow cameras:', shadowCams);

// JSON serialization
const lightData = light.toJSON();
console.log('Light config:', lightData);
```

This lighting system provides comprehensive, production-ready lighting capabilities with proper physical modeling, shadow casting, and shader integration for advanced 3D rendering applications.