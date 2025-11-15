# Texture Compression System

A comprehensive WebGL texture optimization and compression system featuring hardware-accelerated compression, texture atlases, mipmap generation, streaming, and GPU memory optimization.

## 🚀 Features

### Core Functionality
- **Hardware-Accelerated Texture Compression** - Uses WebGL extensions for optimal compression
- **Texture Atlas Management** - Automatic packing of multiple textures into atlases
- **Mipmap Generation** - Automatic mipmap creation with optimal filtering
- **Texture Streaming** - Progressive loading with quality levels
- **GPU Memory Optimization** - Intelligent memory management and cleanup
- **Automatic Format Selection** - Device-aware format selection

### Supported Compression Formats
- **Mobile Formats**: ETC1, ASTC, PVRTC
- **Desktop Formats**: S3TC/DXT, BC (WebGL2)
- **Universal**: ETC2 (WebGL2), RGTC (WebGL2)
- **Lossless**: Support for lossless compression where available

### Advanced Features
- **Anisotropic Filtering** - Improved texture quality for oblique angles
- **Progressive Loading** - Multiple quality levels during streaming
- **Memory Budget Management** - Automatic memory pressure handling
- **Texture Caching** - Intelligent caching with automatic cleanup
- **Worker Thread Processing** - Background compression processing

## 📋 Requirements

- WebGL 1.0 or WebGL 2.0 support
- Modern browser with JavaScript ES6+ support
- Optional: WebGL extensions for compression formats

## 🔧 Installation

1. Copy `TextureCompression.js` to your project
2. Include the script in your HTML or import as module:

```html
<script src="src/TextureCompression.js"></script>
```

Or as ES6 module:

```javascript
import { TextureCompression } from './TextureCompression.js';
```

## 🎯 Basic Usage

### Initialize the System

```javascript
const canvas = document.getElementById('myCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
const textureCompression = new TextureCompression(gl);
```

### Compress a Texture

```javascript
// Load an image
const img = new Image();
img.src = 'texture.jpg';

img.onload = async () => {
    try {
        const compressedTexture = await textureCompression.compressTexture(img, {
            textureType: 'diffuse',      // 'diffuse', 'normal', 'specular'
            alpha: false,                // Whether texture has alpha channel
            quality: 'high',             // 'low', 'medium', 'high'
            generateMipmaps: true,       // Generate mipmap levels
            anisotropicFiltering: true,  // Use anisotropic filtering
            maxAnisotropy: 8             // Maximum anisotropy level
        });
        
        console.log('Texture compressed:', compressedTexture);
        // Use compressedTexture.texture in your WebGL application
    } catch (error) {
        console.error('Compression failed:', error);
    }
};
```

### Create Texture Atlas

```javascript
// Create multiple small textures
const textures = [
    createTexture('icon1.png'),
    createTexture('icon2.png'),
    createTexture('icon3.png')
];

// Create atlas
const atlas = await textureCompression.createAtlas(textures, {
    maxWidth: 1024,        // Maximum atlas width
    maxHeight: 1024,       // Maximum atlas height
    padding: 2,            // Padding between textures
    method: 'shelf'        // 'shelf' or 'bin' packing method
});

// Get UV coordinates for each texture
for (const [id, mapping] of Object.entries(atlas.mappings)) {
    console.log(`Texture ${id} UV:`, mapping);
}
```

### Stream Textures

```javascript
const streamedTexture = await textureCompression.streamTexture(
    'https://example.com/large-texture.jpg',
    {
        qualityLevels: ['low', 'medium', 'high'],
        progressive: true,
        onProgress: (progress, level) => {
            console.log(`Loading ${level}: ${progress * 100}%`);
        },
        timeout: 30000
    }
);
```

### Memory Management

```javascript
// Get memory statistics
const stats = textureCompression.getMemoryStats();
console.log('Memory usage:', {
    totalTextures: stats.totalTextures,
    compressedTextures: stats.compressedTextures,
    currentUsage: `${stats.usagePercentage.toFixed(1)}%`
});

// Optimize memory usage
const optimization = textureCompression.optimizeMemory(false);
// aggressive: false = conservative cleanup
// aggressive: true = aggressive cleanup
```

## 🔍 Advanced Features

### Automatic Format Selection

The system automatically selects the best format based on device capabilities:

```javascript
// Test format selection for different scenarios
const formats = [
    textureCompression.selectOptimalFormat('diffuse', false, 'high'),
    textureCompression.selectOptimalFormat('normal', false, 'high'),
    textureCompression.selectOptimalFormat('diffuse', true, 'medium')
];

formats.forEach(format => {
    console.log(`${format.name}: ${format.internalFormat || 'Uncompressed'}`);
});
```

### Custom Texture Parameters

```javascript
const compressedTexture = await textureCompression.compressTexture(image, {
    // Custom compression options
    compressionType: 'automatic',  // or specific format
    quality: 'high',
    
    // Texture filtering
    generateMipmaps: true,
    anisotropicFiltering: true,
    maxAnisotropy: 16,
    
    // Wrapping modes
    wrapS: gl.REPEAT,
    wrapT: gl.REPEAT,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR
});
```

### Atlas with Custom Layout

```javascript
// Advanced atlas options
const atlas = await textureCompression.createAtlas(textures, {
    maxWidth: 2048,
    maxHeight: 2048,
    padding: 4,              // Extra padding between textures
    method: 'bin',           // More efficient packing algorithm
    
    // Optional callbacks
    onProgress: (progress) => console.log(`Atlas progress: ${progress * 100}%`),
    onComplete: (atlas) => console.log('Atlas created!')
});
```

## 📊 Memory Optimization Strategies

### Conservative Optimization
```javascript
// Removes least recently used textures when memory usage > 70%
const result = textureCompression.optimizeMemory(false);
```

### Aggressive Optimization
```javascript
// More aggressive cleanup when memory usage > 50%
const result = textureCompression.optimizeMemory(true);
```

### Memory Budget Management
```javascript
// System automatically manages memory budget
// Default: 512MB for desktop, 256MB for mobile
const stats = textureCompression.getMemoryStats();
console.log('Memory Budget:', `${(stats.memoryBudget / 1024 / 1024).toFixed(0)}MB`);
```

## 🎮 Performance Tips

### 1. Use Compression for Large Textures
```javascript
// Best for textures > 512x512
const largeTexture = await textureCompression.compressTexture(image, {
    textureType: 'diffuse',
    quality: 'high'
});
```

### 2. Create Atlases for Small Textures
```javascript
// Best for UI elements, icons, and small textures
const atlas = await textureCompression.createAtlas(smallTextures, {
    maxWidth: 1024,
    maxHeight: 1024,
    padding: 2
});
```

### 3. Enable Streaming for Remote Assets
```javascript
// Progressive loading with quality levels
const streamed = await textureCompression.streamTexture(url, {
    qualityLevels: ['low', 'medium', 'high'],
    progressive: true
});
```

### 4. Monitor Memory Usage
```javascript
// Regular memory checks
setInterval(() => {
    const stats = textureCompression.getMemoryStats();
    if (stats.usagePercentage > 80) {
        console.warn('High memory usage detected!');
        textureCompression.optimizeMemory(true);
    }
}, 5000);
```

## 🛠️ WebGL Integration

### Shader Considerations
```glsl
// GLSL shader for compressed textures
uniform sampler2D uTexture;
uniform vec2 uTextureOffset;
uniform vec2 uTextureScale;

void main() {
    vec2 uv = vUv * uTextureScale + uTextureOffset;
    gl_FragColor = texture2D(uTexture, uv);
}
```

### Texture Binding
```javascript
// Atlas texture binding with UV mapping
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, atlas.texture);

// Set atlas uniforms
gl.uniform2f(atlasLocation.uTextureOffset, mapping.x, mapping.y);
gl.uniform2f(atlasLocation.uTextureScale, mapping.width, mapping.height);
```

## 📈 Browser Compatibility

### WebGL Extensions Support

| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| S3TC/DXT | ✅ | ✅ | ✅ | ✅ |
| ETC1 | ✅ | ✅ | ❌ | ✅ |
| ASTC | ✅ | ✅ | ✅ | ✅ |
| PVRTC | ✅ | ✅ | ❌ | ✅ |
| ETC2 | ✅* | ✅* | ✅* | ✅* |

*Requires WebGL2

### Fallback Strategy
The system automatically falls back to uncompressed formats when compressed formats are not available:

1. **First Choice**: Compressed format (ASTC, ETC1, S3TC, etc.)
2. **Fallback**: RGBA8 → RGB8 → LUMINANCE_ALPHA → LUMINANCE

## 🧪 Testing & Examples

Run the included demo:

```bash
# Serve the example files
python -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000/examples/texture-compression-demo.html`

The demo includes:
- Interactive controls for all features
- Real-time performance metrics
- Format support detection
- Memory usage visualization
- Texture streaming simulation

## 🔧 API Reference

### TextureCompression Class

#### Constructor
```javascript
new TextureCompression(gl)
```

#### Methods

##### compressTexture(imageData, options)
- `imageData`: HTMLImageElement, Canvas, or ImageData
- `options`: Configuration object
- Returns: Promise with compression result

##### createAtlas(textures, options)
- `textures`: Array of texture sources
- `options`: Atlas configuration
- Returns: Promise with atlas result

##### streamTexture(url, options)
- `url`: Texture URL
- `options`: Streaming configuration
- Returns: Promise with streamed texture

##### selectOptimalFormat(textureType, alpha, quality)
- `textureType`: 'diffuse', 'normal', 'specular'
- `alpha`: boolean
- `quality`: 'low', 'medium', 'high'
- Returns: Format information object

##### getMemoryStats()
- Returns: Memory usage statistics

##### optimizeMemory(aggressive)
- `aggressive`: boolean for aggressive cleanup
- Returns: Optimization results

##### dispose()
- Cleans up all resources

### TextureAtlasManager Class

#### Methods
- `createAtlas(textures, options)`: Create texture atlas
- `getAtlas(atlasId)`: Get atlas by ID
- `dispose()`: Clean up atlases

### TextureStreamingManager Class

#### Methods
- `streamTexture(url, options)`: Stream texture with progression
- `dispose()`: Clean up streaming resources

### GPUMemoryManager Class

#### Methods
- `registerTexture(id, texture, info)`: Register texture for tracking
- `accessTexture(id)`: Mark texture as accessed
- `getStats()`: Get memory statistics
- `optimize(aggressive)`: Optimize memory usage
- `dispose()`: Clean up all tracked textures

## 🐛 Troubleshooting

### Common Issues

#### "WebGL not supported"
- Check browser WebGL support
- Enable hardware acceleration in browser settings
- Update graphics drivers

#### "Compression failed"
- Texture format not supported on device
- Insufficient GPU memory
- Try smaller texture size or lower quality

#### "Atlas creation failed"
- Textures too large for atlas dimensions
- Increase maxWidth/maxHeight or reduce padding
- Split textures into multiple atlases

#### High memory usage
- Call `optimizeMemory(true)` to free resources
- Check for texture leaks (missing dispose calls)
- Consider using more aggressive compression

### Debug Mode
```javascript
// Enable debug logging
window.DEBUG_TEXTURE_COMPRESSION = true;
```

## 📝 License

This texture compression system is part of the 3D WebGL engine project. See the main project license for details.

## 🤝 Contributing

1. Test on various devices and browsers
2. Report compatibility issues
3. Suggest improvements for compression algorithms
4. Add support for new texture formats

## 🔮 Future Enhancements

- [ ] WebAssembly-based compression for offline processing
- [ ] Support for KTX2 container format
- [ ] Advanced mipmap generation algorithms
- [ ] Texture streaming with network optimization
- [ ] Real-time texture compression for video
- [ ] GPU-based texture processing
- [ ] Automatic texture quality adaptation based on viewing distance
- [ ] Integration with popular 3D engines (Three.js, Babylon.js)

---

*Built for optimal WebGL texture performance across all devices* 🚀