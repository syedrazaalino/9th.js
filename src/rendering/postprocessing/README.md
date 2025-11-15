# Post-Processing Effects Pipeline

A comprehensive collection of post-processing effects for WebGL rendering, featuring full-screen quad shaders with proper buffer management and temporal effects for smooth visual quality.

## Effects Included

### 1. BloomEffect.js
Creates realistic glow/bloom effects around bright areas using Gaussian blur.

**Features:**
- Configurable intensity and threshold
- Multi-pass Gaussian blur with ping-pong buffering
- Quality settings (low, medium, high)
- Temporal filtering for flicker reduction
- Adjustable blur radius

**Key Parameters:**
- `intensity` (1.5) - Bloom strength
- `threshold` (0.8) - Brightness threshold for bloom extraction
- `radius` (4.0) - Blur radius
- `quality` ('high') - Processing quality level

### 2. DepthOfFieldEffect.js
Simulates camera depth of field with realistic bokeh using circle of confusion calculations.

**Features:**
- Physical camera parameters (focal length, aperture)
- Hexagonal sampling pattern for better quality
- Smooth CoC transitions
- Focus distance control
- Automatic depth of field calculations

**Key Parameters:**
- `focusDistance` (10.0) - Distance at which objects are in focus
- `focalLength` (50.0) - Camera focal length in mm
- `aperture` (4.0) - Camera aperture value
- `maxBlur` (10.0) - Maximum blur amount

### 3. SSAOEffect.js
Screen Space Ambient Occlusion for realistic contact shadows and depth enhancement.

**Features:**
- Configurable sample kernel size
- Noise texture for variation
- Multi-pass blur for smooth results
- Performance-optimized sampling
- View space calculations

**Key Parameters:**
- `radius` (0.5) - Sample radius
- `intensity` (1.0) - Shadow intensity
- `sampleCount` (32) - Number of depth samples
- `quality` ('high') - Sample count and resolution quality

### 4. ChromaticAberration.js
Creates lens color separation effects with configurable channel offsets.

**Features:**
- Individual color channel control
- Radial falloff effects
- Animated chromatic aberration presets
- Lens distortion simulation
- Prism effects

**Key Parameters:**
- `intensity` (0.002) - Aberration strength
- `angle` (0.0) - Direction of aberration
- `animate` (false) - Enable animated effects
- `redOffset`, `greenOffset`, `blueOffset` - Individual channel offsets

## Usage

### Basic Setup

```javascript
import { 
    BloomEffect, 
    DepthOfFieldEffect, 
    SSAOEffect, 
    ChromaticAberration,
    PostProcessingPipeline 
} from './src/rendering/postprocessing/index.js';

// Create individual effects
const bloom = new BloomEffect(renderer, {
    intensity: 1.5,
    threshold: 0.8,
    quality: 'high'
});

const dof = new DepthOfFieldEffect(renderer, {
    focusDistance: 10.0,
    focalLength: 50.0,
    aperture: 4.0
});

const ssao = new SSAOEffect(renderer, {
    radius: 0.5,
    intensity: 1.0,
    sampleCount: 32
});

const chromatic = new ChromaticAberration(renderer, {
    intensity: 0.002,
    animate: false
});
```

### Using the Pipeline

```javascript
// Create post-processing pipeline
const pipeline = new PostProcessingPipeline(renderer, {
    autoQuality: true,
    targetFrameTime: 16.67, // 60 FPS target
    qualityAdjustmentEnabled: true
});

// Add effects to pipeline
pipeline.addEffect(bloom);
pipeline.addEffect(dof);
pipeline.addEffect(ssao);
pipeline.addEffect(chromatic);

// Render in your main loop
function render() {
    // Render 3D scene
    renderer.render(scene, camera);
    
    // Apply post-processing
    pipeline.render(scene, camera, null, time);
    
    requestAnimationFrame(render);
}
```

### Default Pipeline

```javascript
// Quick setup with recommended settings
const pipeline = PostProcessingPipeline.createDefault(renderer);
pipeline.render(scene, camera);
```

## Quality Settings

### Performance Presets

```javascript
// Apply performance presets
pipeline.applyPreset('performance'); // Optimized for speed
pipeline.applyPreset('balanced');    // Balanced quality/performance
pipeline.applyPreset('quality');     // Maximum quality

// Manual quality adjustment
pipeline.updateQuality('low');       // Fastest
pipeline.updateQuality('medium');    // Balanced
pipeline.updateQuality('high');      // Best quality
```

### Effect-Specific Quality

```javascript
// Set individual effect quality
bloom.updateQuality('low');
dof.updateQuality('medium');
ssao.updateQuality('high');
```

## Performance Optimization

### Automatic Quality Adjustment

```javascript
const pipeline = new PostProcessingPipeline(renderer, {
    autoQuality: true,
    targetFrameTime: 16.67, // Target 60 FPS
    qualityAdjustmentEnabled: true
});

// Enable/disable automatic adjustment
pipeline.setAutoQuality(true);
```

### Manual Performance Control

```javascript
// Monitor performance
const stats = pipeline.getStats();
console.log(`FPS: ${stats.averageFPS.toFixed(1)}`);
console.log(`Frame time: ${stats.frameTime.toFixed(2)}ms`);

// Disable effects based on performance
if (stats.averageFPS < 30) {
    ssao.setEnabled(false); // Disable heavy effects
}
```

## Advanced Usage

### Dynamic Focus for DOF

```javascript
// Focus on specific object
dof.focusOnObject(targetObject, camera);

// Manual focus control
dof.setFocusDistance(15.0);

// Get calculated depth of field range
const dofRange = dof.calculateDoF();
console.log(`Near: ${dofRange.near}, Far: ${dofRange.far}`);
```

### Animated Chromatic Aberration

```javascript
// Enable animation
chromatic.setAnimation(true);
chromatic.setAnimationSpeed(1.0);

// Apply presets
chromatic.applyPreset('cinematic'); // Subtle animated effect
chromatic.applyPreset('prism');      // Rainbow dispersion effect

// Custom animation
function updateChromatic(time) {
    chromatic.setAngle(Math.sin(time * 0.5) * Math.PI);
}
```

### Bloom Animation

```javascript
// Animate bloom based on scene brightness
function updateBloom(scene, time) {
    const avgBrightness = calculateSceneBrightness(scene);
    bloom.setIntensity(1.0 + Math.sin(time * 2.0) * avgBrightness * 0.5);
}
```

## Buffer Management

All effects use efficient ping-pong buffering for blur operations and temporal filtering to reduce flicker:

- **Half-resolution buffers** for performance
- **Ping-pong rendering** for multi-pass effects
- **Temporal buffers** for smooth transitions
- **Automatic cleanup** on dispose

## Integration with WebGL

### Required Extensions

```javascript
// Check for required WebGL extensions
if (!ssao.isSupported()) {
    console.warn('SSAO requires OES_texture_float extension');
    ssao.setEnabled(false);
}
```

### Custom Render Targets

```javascript
// Effects automatically create render targets
// But you can integrate with custom framebuffer systems
const customTarget = createCustomRenderTarget();
pipeline.render(scene, camera, customTarget);
```

## Memory Management

```javascript
// Always dispose effects when no longer needed
pipeline.dispose(); // Disposes all effects and buffers

// Or dispose individual effects
bloom.dispose();
dof.dispose();
ssao.dispose();
chromatic.dispose();
```

## API Reference

### Common Methods

All effects implement these methods:

- `setEnabled(boolean)` - Enable/disable effect
- `updateQuality(quality)` - Change quality level
- `updateSize(width, height)` - Handle viewport changes
- `getParameters()` - Get current parameters
- `dispose()` - Clean up resources

### Pipeline Methods

- `addEffect(effect)` - Add effect to pipeline
- `removeEffect(effect)` - Remove effect from pipeline
- `getEffect(type)` - Find effect by type
- `setEnabled(boolean)` - Enable/disable all effects
- `render(scene, camera, target, time)` - Render pipeline
- `getStats()` - Get performance statistics

## Examples

See the individual effect files for detailed shader implementations and advanced configuration options. Each effect includes comprehensive parameter documentation and example usage patterns.

## Performance Notes

- Effects automatically downsample for performance
- Temporal filtering reduces flicker without extra passes
- Quality levels automatically balance quality vs performance
- Pipeline can monitor and adjust quality based on frame time

## Browser Compatibility

- Requires WebGL 2.0 for optimal performance
- Falls back to WebGL 1.0 with reduced functionality
- SSAO requires OES_texture_float extension
- All effects degrade gracefully on older hardware