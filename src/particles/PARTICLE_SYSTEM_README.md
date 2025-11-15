# Particle System Framework

A high-performance, GPU-accelerated particle system framework designed for rendering thousands of particles efficiently using instanced rendering and custom shaders.

## Features

- **GPU-Accelerated Rendering**: Uses WebGL instancing to render thousands of particles in a single draw call
- **Multiple Emitter Types**: Point, sphere, box, and cone emitters with customizable parameters
- **Custom Particle Shaders**: Built-in shaders for fire, water, sparks, and magic effects
- **Advanced Physics**: Gravity, drag, collisions, forces, and custom physics simulation
- **Performance Optimization**: Particle pooling, spatial partitioning, and performance monitoring
- **Flexible Configuration**: Extensive customization options for all aspects of particle behavior
- **Lifecycle Management**: Complete particle lifecycle from spawn to death with interpolation

## Architecture

### Core Components

1. **ParticleSystem.js** - Main system that manages GPU buffers, instancing, and particle updates
2. **ParticleEmitter.js** - Handles particle spawning with various emission patterns
3. **Particle.js** - Individual particle with physics, lifecycle, and state management
4. **ParticleMaterial.js** - Custom shader material for particle rendering with multiple effects

### Performance Features

- **Instanced Rendering**: Single draw call for thousands of particles
- **Particle Pooling**: Reuse particle objects to avoid garbage collection
- **Spatial Grid**: Optional collision detection using spatial partitioning
- **Performance Monitoring**: Built-in FPS tracking and statistics
- **Memory Management**: Efficient GPU buffer updates and resource cleanup

## Quick Start

### Basic Setup

```javascript
import { ParticleSystem, PointEmitter } from '../src/particles/index.js';

// Create a particle system
const particleSystem = new ParticleSystem({
    maxParticles: 1000,
    particleSize: 1.0,
    blending: 'additive'
});

// Create an emitter
const emitter = new PointEmitter({
    rate: 100,              // particles per second
    particleLifetime: [1, 2], // min, max lifetime
    initialSpeed: [1, 5],
    colorStart: { r: 1, g: 1, b: 0 },
    colorEnd: { r: 1, g: 0, b: 0 },
    autoplay: true
});

// Add emitter to system and scene
particleSystem.addEmitter(emitter);
scene.add(particleSystem);

// In your render loop
function animate() {
    const deltaTime = 0.016; // 60 FPS
    particleSystem.update(deltaTime, camera);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

### Using Presets

```javascript
import { createFireworkSystem, createSmokeSystem, createFromPreset } from '../src/particles/index.js';

// Use built-in presets
const firework = createFireworkSystem({
    maxParticles: 800,
    position: { x: 0, y: 5, z: 0 }
});

scene.add(firework.particleSystem);

// Use preset configurations
const rain = createFromPreset('rain', {
    position: { x: 0, y: 10, z: 0 }
});

scene.add(rain.particleSystem);
```

## Particle System Configuration

### Constructor Options

```javascript
const particleSystem = new ParticleSystem({
    maxParticles: 10000,           // Maximum number of particles
    particleSize: 1.0,             // Default particle size
    blending: 'additive',          // Blending mode
    sizeAttenuation: true,         // Size changes with distance
    alphaMap: texture,             // Alpha texture for particles
    colorMap: texture,             // Color texture for particles
    vertexShader: customVS,        // Custom vertex shader
    fragmentShader: customFS,      // Custom fragment shader
    enableCollisions: false,       // Enable particle collision
    performanceMode: false         // Enable performance monitoring
});
```

### Physics Configuration

```javascript
particleSystem.setProperties({
    gravity: { x: 0, y: -9.81, z: 0 },     // Global gravity
    drag: 0.98,                             // Global drag (0-1)
    globalVelocity: { x: 0, y: 0, z: 0 },    // Constant velocity
    wind: { x: 0, y: 0, z: 0 }              // Constant wind force
});
```

## Emitter Types

### Point Emitter
```javascript
const emitter = new PointEmitter({
    rate: 100,                    // particles per second
    particleLifetime: [1, 3],     // lifetime range
    initialSpeed: [2, 8],         // speed range
    initialDirection: { x: 0, y: 1, z: 0 },
    colorStart: { r: 1, g: 0, b: 0 },
    colorEnd: { r: 1, g: 1, b: 0 },
    acceleration: { x: 0, y: 5, z: 0 }
});
```

### Sphere Emitter
```javascript
const emitter = new SphereEmitter({
    rate: 50,
    particleLifetime: [2, 4],
    initialSpeed: [1, 3],
    emissionRadius: 2.0,          // Sphere radius
    colorStart: { r: 0, g: 0, b: 1 },
    colorEnd: { r: 1, g: 0, b: 1 }
});
```

### Cone Emitter
```javascript
const emitter = new ConeEmitter({
    rate: 200,
    particleLifetime: [0.5, 2],
    initialSpeed: [5, 15],
    emissionAngle: 45,            // degrees
    emissionRadius: 1.0,
    colorStart: { r: 1, g: 1, b: 0 },
    colorEnd: { r: 1, g: 0, b: 0 }
});
```

### Box Emitter
```javascript
const emitter = new BoxEmitter({
    rate: 150,
    emissionRadius: 3.0,          // Box size
    colorStart: { r: 0, g: 1, b: 0 },
    colorEnd: { r: 0, g: 0, b: 1 }
});
```

## Custom Shaders

### Applying Built-in Shaders

```javascript
// Fire/explosion effect
particleSystem.material.applyShader('fire');

// Water/smoke effect
particleSystem.material.applyShader('water');

// Spark effect
particleSystem.material.applyShader('spark');

// Magic particle effect
particleSystem.material.applyShader('magic');
```

### Custom Shader Example

```javascript
const customMaterial = new ParticleMaterial({
    vertexShader: `
        attribute vec3 instancePosition;
        attribute vec4 instanceColor;
        uniform float time;
        varying vec4 vColor;
        
        void main() {
            vColor = instanceColor;
            gl_Position = projectionMatrix * modelViewMatrix * 
                         vec4(instancePosition + position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying vec4 vColor;
        
        void main() {
            gl_FragColor = vec4(vColor.rgb * sin(time), vColor.a);
        }
    `
});

particleSystem.material = customMaterial;
```

## Advanced Features

### Burst Emission

```javascript
const emitter = new PointEmitter({
    rate: 10,              // Continuous rate
    burstRate: 0.1,        // Burst probability (0-1)
    burstSize: [5, 15]     // Particles per burst (min, max)
});
```

### Particle Forces

```javascript
// Add custom forces to individual particles
particle.addForce(new Vector3(0, 10, 0));    // Upward force
particle.addForce(new Vector3(Math.sin(time), 0, Math.cos(time))); // Swirling force
```

### Collision Detection

```javascript
const particleSystem = new ParticleSystem({
    maxParticles: 1000,
    enableCollisions: true
});

// Particles will collide with each other using spatial grid
```

### Performance Monitoring

```javascript
// Enable performance mode
const particleSystem = new ParticleSystem({
    maxParticles: 1000,
    performanceMode: true
});

// Get performance statistics
const stats = particleSystem.getPerformanceStats();
console.log(`FPS: ${stats.fps}, Active: ${stats.activeParticles}`);
```

## Built-in Presets

### Available Presets

1. **firework** - Explosive particle effect
2. **smoke** - Realistic smoke simulation
3. **sparks** - Electric spark effect
4. **magic** - Magical particle effect
5. **rain** - Rain particle system
6. **snow** - Snow particle system

```javascript
import { Presets } from '../src/particles/index.js';

const config = Presets.firework;
const system = createFromPreset('firework', {
    position: { x: 0, y: 5, z: 0 }
});
```

## Particle Properties

### Individual Particle Control

```javascript
// Access particles for advanced control
for (const particle of particleSystem.activeParticles) {
    // Apply custom forces
    particle.addForce(customForce);
    
    // Modify properties
    particle.setSize(particleSize);
    particle.setColor(newColor);
    
    // Kill particle manually
    particle.die();
    
    // Check particle state
    if (particle.isDead()) {
        // Handle dead particle
    }
}
```

### Custom Particle Lifecycle

```javascript
// Override particle update behavior
particle.update = function(deltaTime) {
    // Custom update logic
    this.age += deltaTime;
    
    // Custom death condition
    if (this.position.y < -10) {
        this.die();
        return;
    }
    
    // Call parent update
    super.update(deltaTime);
};
```

## Optimization Tips

1. **Pool Usage**: Keep particlePool size reasonable for your use case
2. **Update Frequency**: Use appropriate deltaTime values
3. **Shader Complexity**: Simple shaders perform better
4. **Texture Usage**: Large textures impact performance
5. **Collision Detection**: Enable only when needed

## Memory Management

```javascript
// Clean up when done
particleSystem.dispose();

// Clear all particles
particleSystem.clearParticles();

// Remove emitter
particleSystem.removeEmitter(emitter);
```

## Performance Benchmarks

Typical performance on modern hardware:
- **1,000 particles**: 60+ FPS
- **5,000 particles**: 60+ FPS  
- **10,000 particles**: 30+ FPS
- **20,000+ particles**: 20+ FPS (depends on shaders)

## Examples

See the following files for complete examples:
- `examples/particle-system-demo.html` - Interactive demo
- `examples/particle-system-demo.js` - Full demo implementation

## Browser Compatibility

- WebGL 2.0 required
- Modern browsers (Chrome 56+, Firefox 51+, Safari 11+)
- Mobile browsers with WebGL 2.0 support

## License

This particle system framework is part of the main project and follows the same license terms.