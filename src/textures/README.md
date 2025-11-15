# Texture System Documentation

## Overview

A comprehensive Texture system with support for multiple image formats (PNG, JPEG, WebP, HDR, DDS, KTX2), texture properties, updates, and streaming for large textures.

## Features

### 📷 Supported Image Formats
- **Standard Formats**: PNG, JPEG, WebP, GIF
- **HDR Formats**: RGBE/HDR format support
- **Compressed Formats**: DDS (DirectDraw Surface), KTX2 (Khronos Texture)
- **Video Support**: Real-time video textures
- **Canvas Support**: HTML5 Canvas textures
- **Cube Maps**: Six-face cube map textures
- **3D Textures**: Volume textures with depth
- **2D Array Textures**: Layered 2D textures

### 🎛️ Texture Properties
- **Wrap Modes**: REPEAT, CLAMP_TO_EDGE, MIRRORED_REPEAT
- **Filters**: NEAREST, LINEAR, MIPMAP filters
- **Anisotropy**: Anisotropic filtering support
- **Color Space**: Linear and sRGB color space handling
- **Flip Y**: Vertical flip control
- **Premultiply Alpha**: Alpha blending control
- **Texture Coordinates**: Offset, repeat, rotation, center

### ⚡ Performance Features
- **Streaming**: Progressive loading for large textures
- **Mipmaps**: Automatic mipmap generation
- **Compression**: Hardware-accelerated compressed textures
- **Memory Management**: Automatic memory tracking
- **Caching**: Texture caching with cache keys
- **Access Tracking**: Usage statistics and optimization

### 🎬 Advanced Features
- **Video Textures**: Real-time video playback
- **Render Targets**: Off-screen rendering textures
- **Multi-sampling**: Anti-aliasing support
- **3D Textures**: Volume data visualization
- **Cube Maps**: Environment mapping
- **Texture Arrays**: Material variants

## Usage Examples

### Basic Texture Loading

```javascript
import { Texture } from '../textures/Texture.js';

// Load image texture
const texture = await Texture.load('path/to/image.png');
renderer.updateTexture(texture);

// Load with options
const texture = await Texture.load('path/to/image.jpg', {
    wrapS: Texture.WRAP_MODES.REPEAT,
    wrapT: Texture.WRAP_MODES.REPEAT,
    magFilter: Texture.FILTERS.LINEAR,
    minFilter: Texture.FILTER.LINEAR_MIPMAP_LINEAR
});
```

### Creating Textures from Data

```javascript
import { Texture } from '../textures/Texture.js';

// From HTML Image
const img = new Image();
img.src = 'texture.jpg';
img.onload = () => {
    const texture = Texture.fromData(img);
    renderer.updateTexture(texture);
};

// From Canvas
const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
// ... draw on canvas ...
const texture = Texture.fromData(canvas);

// From Video
const video = document.createElement('video');
video.src = 'movie.mp4';
video.loop = true;
const texture = Texture.fromData(video);
```

### Cube Map Textures

```javascript
// Create cube map from 6 images
const faces = [
    'px.jpg', // +X
    'nx.jpg', // -X
    'py.jpg', // +Y
    'ny.jpg', // -Y
    'pz.jpg', // +Z
    'nz.jpg'  // -Z
];

const cubeMap = Texture.fromCubeMap(faces);
renderer.updateTexture(cubeMap);
```

### Compressed Textures

```javascript
// DDS compressed texture
const ddsTexture = await Texture.load('compressed.dds');

// KTX2 compressed texture
const ktx2Texture = await Texture.load('texture.ktx2');
```

### HDR Textures

```javascript
// Load HDR environment map
const hdrTexture = await Texture.load('environment.hdr');
hdrTexture.encoding = Texture.ENCODINGS.LINEAR;
renderer.updateTexture(hdrTexture);
```

### Texture Streaming

```javascript
// Start streaming for large textures
const texture = new Texture({ width: 4096, height: 4096 });
await texture.startStreaming([
    'texture_lod0.dds',
    'texture_lod1.dds',
    'texture_lod2.dds'
]);

// Load next level
await texture.loadNextStreamLevel();
```

### 3D Textures

```javascript
// Create 3D texture for volume data
const volumeData = new Uint8Array(width * height * depth);
const texture3D = new Texture({
    target: Texture.TARGETS.TEXTURE_3D,
    width: width,
    height: height,
    depth: depth,
    format: Texture.FORMATS.R8,
    type: Texture.TYPES.UNSIGNED_BYTE
});

texture3D.image = { data: volumeData };
renderer.updateTexture(texture3D);
```

### Utility Functions

```javascript
import { TextureUtils } from '../textures/index.js';

// Generate checkerboard texture
const checkerboard = TextureUtils.generateCheckerboard(256, ['#fff', '#000'], 8);

// Generate gradient
const gradient = TextureUtils.generateGradient(512, 256, ['#ff0000', '#0000ff']);

// Generate noise
const noise = TextureUtils.generateNoise(256, 256, 128);

// Solid color
const solid = TextureUtils.generateSolidColor(1, 1, '#ff00ff');

// Preload multiple textures
const textures = await TextureUtils.preloadTextures([
    'tex1.jpg', 'tex2.jpg', 'tex3.jpg'
], (loaded, total, texture, error) => {
    console.log(`Loaded ${loaded}/${total}`, texture);
});
```

## Texture Properties Reference

### Format Enums
```javascript
Texture.FORMATS.RGBA       // 32-bit RGBA
Texture.FORMATS.RGB        // 24-bit RGB
Texture.FORMATS.DEPTH      // Depth buffer
Texture.FORMATS.RGB_S3TC_DXT1   // Compressed RGB
Texture.FORMATS.RGBA_S3TC_DXT3  // Compressed RGBA
// ... and more
```

### Type Enums
```javascript
Texture.TYPES.UNSIGNED_BYTE  // 8-bit unsigned
Texture.TYPES.FLOAT          // 32-bit float
Texture.TYPES.UNSIGNED_SHORT // 16-bit unsigned
// ... and more
```

### Wrap Mode Enums
```javascript
Texture.WRAP_MODES.REPEAT           // Repeat texture
Texture.WRAP_MODES.CLAMP_TO_EDGE    // Clamp to edge
Texture.WRAP_MODES.MIRRORED_REPEAT  // Mirrored repeat
```

### Filter Enums
```javascript
Texture.FILTERS.NEAREST               // Point sampling
Texture.FILTERS.LINEAR                // Bilinear filtering
Texture.FILTERS.LINEAR_MIPMAP_LINEAR  // Trilinear filtering
// ... and more mipmap filters
```

## Advanced Configuration

### Texture Updates
```javascript
// Update texture parameters without re-uploading data
texture.updateParameters(gl, {
    wrapS: Texture.WRAP_MODES.REPEAT,
    magFilter: Texture.FILTERS.LINEAR,
    minFilter: Texture.FILTERS.LINEAR_MIPMAP_LINEAR
});

// Force texture update
texture.needsUpdate = true;
renderer.updateTexture(texture);
```

### Memory Management
```javascript
// Check memory usage
console.log(`Memory: ${texture.estimatedMemoryMB.toFixed(2)} MB`);
console.log(`Compression ratio: ${texture.compressionRatio}`);

// Monitor access patterns
console.log(`Access count: ${texture.accessCount}`);
console.log(`Last access: ${texture.lastAccessTime}`);

// Clone texture
const clonedTexture = texture.clone();
```

### Event System
```javascript
// Listen to texture events
texture.addEventListener('load', (event) => {
    console.log('Texture loaded:', event.texture);
});

texture.addEventListener('update', (event) => {
    console.log('Texture updated:', event.texture);
});

texture.addEventListener('error', (event) => {
    console.error('Texture error:', event.error);
});

// Streaming events
texture.addEventListener('streamlevel', (event) => {
    console.log(`Stream level ${event.level} loaded`);
});
```

### Render Targets
```javascript
// Create render target texture
const renderTexture = Texture.createEmpty(1024, 1024, {
    format: Texture.FORMATS.RGBA,
    type: Texture.TYPES.UNSIGNED_BYTE
});

// Use with framebuffer
framebuffer.texture = renderTexture;
```

## Performance Tips

### 1. Use Compressed Textures
- Compressed textures use less VRAM
- Faster GPU uploads and downloads
- Support varies by GPU/driver

### 2. Optimize Mipmaps
```javascript
// Generate mipmaps only when needed
const texture = new Texture({
    generateMipmaps: true,  // Enable mipmap generation
    minLevel: 0,
    maxLevel: Math.floor(Math.log2(Math.max(width, height)))
});
```

### 3. Streaming for Large Textures
```javascript
// Use streaming for textures > 512x512
const largeTexture = new Texture({ width: 4096, height: 4096 });
await largeTexture.startStreaming([
    'texture_lod0.jpg',
    'texture_lod1.jpg', 
    'texture_lod2.jpg'
]);
```

### 4. Anisotropic Filtering
```javascript
// Improve texture quality at oblique angles
const texture = new Texture({
    maxAnisotropy: 16  // Check device capabilities
});
```

### 5. Power of 2 Textures
```javascript
// Check if texture dimensions are power of 2
if (texture.isPowerOf2) {
    texture.wrapS = Texture.WRAP_MODES.REPEAT;
    texture.wrapT = Texture.WRAP_MODES.REPEAT;
}
```

## Integration with WebGL Renderer

```javascript
class WebGLRenderer {
    updateTexture(texture) {
        if (!texture._gl) {
            texture._gl = this.gl;
        }
        
        texture.update(this.gl);
        
        // Bind texture to texture unit
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(texture._glTarget, texture._glTexture);
    }
}
```

## Browser Compatibility

### Supported Features
- **WebGL 1.0**: Basic texture functionality
- **WebGL 2.0**: 3D textures, 2D arrays, advanced formats
- **Extensions**: Anisotropy, compressed textures, floating point

### Format Support Matrix
| Format | WebGL 1.0 | WebGL 2.0 | Notes |
|--------|-----------|-----------|-------|
| PNG/JPEG | ✅ | ✅ | Universal support |
| WebP | ⚠️ | ⚠️ | Browser dependent |
| DDS | ⚠️ | ⚠️ | Extension required |
| KTX2 | ⚠️ | ⚠️ | Extension required |
| HDR | ✅ | ✅ | Runtime conversion |
| 3D Textures | ❌ | ✅ | WebGL 2.0 only |
| 2D Arrays | ❌ | ✅ | WebGL 2.0 only |

## Error Handling

```javascript
try {
    const texture = await Texture.load('texture.jpg');
} catch (error) {
    if (error.message.includes('Failed to fetch')) {
        console.error('Network error:', error);
    } else if (error.message.includes('Invalid')) {
        console.error('Invalid format:', error);
    } else {
        console.error('Unknown error:', error);
    }
}

// Check texture state
if (texture.hasError) {
    console.error('Texture error:', texture.error);
    // Load fallback texture
}
```

## Best Practices

1. **Always handle loading errors** with try-catch blocks
2. **Use compressed textures** when possible for performance
3. **Implement streaming** for large textures (>512x512)
4. **Dispose unused textures** to free GPU memory
5. **Use power-of-2 dimensions** when repeat wrapping is needed
6. **Monitor memory usage** for VRAM-constrained applications
7. **Cache frequently used textures** with cache keys
8. **Use appropriate filters** for your use case (NEAREST for pixel art, LINEAR for smooth)

## API Reference

### Static Methods
- `Texture.load(url, options)` - Load texture from URL
- `Texture.fromData(data, options)` - Create from image/canvas/video
- `Texture.fromCubeMap(faces, options)` - Create cube map
- `Texture.createEmpty(width, height, options)` - Create empty texture

### Instance Methods
- `update(gl)` - Upload texture to GPU
- `updateParameters(gl, params)` - Update texture parameters
- `startStreaming(sources, levels)` - Begin texture streaming
- `loadNextStreamLevel()` - Load next streaming level
- `dispose()` - Free texture resources
- `clone()` - Create texture copy

### Properties
- `width`, `height`, `depth` - Texture dimensions
- `format`, `type` - Pixel format and type
- `wrapS`, `wrapT`, `wrapR` - Wrap modes
- `magFilter`, `minFilter` - Sampling filters
- `generateMipmaps` - Mipmap generation flag
- `isLoaded`, `isLoading`, `hasError` - Loading state
- `memorySize`, `compressionRatio` - Performance metrics

This comprehensive Texture system provides all the tools needed for modern WebGL texture handling with support for advanced formats and performance optimizations.