/**
 * Texture System Usage Examples
 * Demonstrates various texture loading and creation techniques
 */

import { Texture, TextureUtils } from './index.js';

// Example 1: Basic Texture Loading
async function basicTextureLoading() {
    try {
        // Load a PNG texture
        const texture = await Texture.load('assets/textures/diffuse.png');
        
        // Configure texture properties
        texture.wrapS = Texture.WRAP_MODES.REPEAT;
        texture.wrapT = Texture.WRAP_MODES.REPEAT;
        texture.minFilter = Texture.FILTERS.LINEAR_MIPMAP_LINEAR;
        texture.magFilter = Texture.FILTERS.LINEAR;
        texture.generateMipmaps = true;
        
        console.log('Loaded texture:', {
            width: texture.width,
            height: texture.height,
            format: texture.format,
            memory: texture.estimatedMemoryMB.toFixed(2) + ' MB'
        });
        
        return texture;
    } catch (error) {
        console.error('Failed to load texture:', error);
        return null;
    }
}

// Example 2: Cube Map Creation
async function createCubeMap() {
    const cubeMapFaces = [
        'assets/cubemap/px.jpg',  // +X
        'assets/cubemap/nx.jpg',  // -X
        'assets/cubemap/py.jpg',  // +Y
        'assets/cubemap/ny.jpg',  // -Y
        'assets/cubemap/pz.jpg',  // +Z
        'assets/cubemap/nz.jpg'   // -Z
    ];
    
    try {
        const cubeMap = Texture.fromCubeMap(cubeMapFaces);
        cubeMap.wrapS = Texture.WRAP_MODES.CLAMP_TO_EDGE;
        cubeMap.wrapT = Texture.WRAP_MODES.CLAMP_TO_EDGE;
        cubeMap.minFilter = Texture.FILTERS.LINEAR_MIPMAP_LINEAR;
        cubeMap.magFilter = Texture.FILTERS.LINEAR;
        
        console.log('Created cube map:', {
            width: cubeMap.width,
            height: cubeMap.height,
            target: cubeMap._glTarget
        });
        
        return cubeMap;
    } catch (error) {
        console.error('Failed to create cube map:', error);
        return null;
    }
}

// Example 3: Compressed Texture Loading
async function loadCompressedTexture() {
    try {
        // Load DDS compressed texture
        const ddsTexture = await Texture.load('assets/textures/compressed.dds');
        ddsTexture.generateMipmaps = false; // Compressed textures already have mipmaps
        
        console.log('Loaded DDS texture:', {
            format: ddsTexture.format,
            compressed: ddsTexture.isCompressed,
            compressionRatio: ddsTexture.compressionRatio
        });
        
        return ddsTexture;
    } catch (error) {
        console.error('Failed to load compressed texture:', error);
        return null;
    }
}

// Example 4: HDR Environment Map
async function loadHDREnvironment() {
    try {
        const hdrTexture = await Texture.load('assets/hdr/studio.hdr');
        
        // HDR textures use linear color space
        hdrTexture.encoding = Texture.ENCODINGS.LINEAR;
        hdrTexture.format = Texture.FORMATS.RGB;
        hdrTexture.type = Texture.TYPES.FLOAT;
        
        console.log('Loaded HDR environment:', {
            width: hdrTexture.width,
            height: hdrTexture.height,
            format: hdrTexture.format,
            type: hdrTexture.type,
            encoding: hdrTexture.encoding
        });
        
        return hdrTexture;
    } catch (error) {
        console.error('Failed to load HDR texture:', error);
        return null;
    }
}

// Example 5: Video Texture
function createVideoTexture() {
    const video = document.createElement('video');
    video.src = 'assets/videos/animation.mp4';
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    
    // Wait for video to be ready
    video.addEventListener('loadeddata', () => {
        const videoTexture = Texture.fromData(video);
        videoTexture.flipY = false; // Videos often don't need flipping
        videoTexture.magFilter = Texture.FILTERS.LINEAR;
        videoTexture.minFilter = Texture.FILTERS.LINEAR;
        
        console.log('Created video texture:', {
            width: videoTexture.width,
            height: videoTexture.height,
            isVideo: videoTexture.isVideo
        });
        
        return videoTexture;
    });
    
    video.addEventListener('error', (error) => {
        console.error('Video load error:', error);
    });
    
    return video;
}

// Example 6: Texture Streaming
async function setupTextureStreaming() {
    const texture = new Texture({
        width: 4096,
        height: 4096,
        format: Texture.FORMATS.RGBA,
        type: Texture.TYPES.UNSIGNED_BYTE
    });
    
    try {
        await texture.startStreaming([
            'assets/textures/highres_lod0.dds',
            'assets/textures/highres_lod1.dds',
            'assets/textures/highres_lod2.dds'
        ]);
        
        // Listen for streaming progress
        texture.addEventListener('streamlevel', (event) => {
            console.log(`Streamed level ${event.level}`);
        });
        
        // Load next levels progressively
        await texture.loadNextStreamLevel(); // Load level 1
        await texture.loadNextStreamLevel(); // Load level 2
        
        console.log('Texture streaming setup complete');
        return texture;
        
    } catch (error) {
        console.error('Streaming setup failed:', error);
        return null;
    }
}

// Example 7: 3D Texture for Volume Data
function create3DTexture() {
    // Simulate 3D volume data (e.g., medical imaging, scientific visualization)
    const width = 256;
    const height = 256;
    const depth = 128;
    
    const volumeData = new Uint8Array(width * height * depth);
    
    // Generate some sample volume data
    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = z * width * height + y * width + x;
                // Create a sphere pattern
                const centerX = width / 2;
                const centerY = height / 2;
                const centerZ = depth / 2;
                
                const dx = x - centerX;
                const dy = y - centerY;
                const dz = z - centerZ;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                const radius = Math.min(width, height, depth) / 4;
                volumeData[index] = distance < radius ? 255 : 0;
            }
        }
    }
    
    const volumeTexture = new Texture({
        target: Texture.TARGETS.TEXTURE_3D,
        width: width,
        height: height,
        depth: depth,
        format: Texture.FORMATS.R8,
        type: Texture.TYPES.UNSIGNED_BYTE
    });
    
    volumeTexture.image = { data: volumeData };
    volumeTexture.wrapS = Texture.WRAP_MODES.CLAMP_TO_EDGE;
    volumeTexture.wrapT = Texture.WRAP_MODES.CLAMP_TO_EDGE;
    volumeTexture.wrapR = Texture.WRAP_MODES.CLAMP_TO_EDGE;
    volumeTexture.minFilter = Texture.FILTERS.LINEAR;
    volumeTexture.magFilter = Texture.FILTERS.LINEAR;
    
    console.log('Created 3D texture:', {
        width: volumeTexture.width,
        height: volumeTexture.height,
        depth: volumeTexture.depth,
        memory: volumeTexture.estimatedMemoryMB.toFixed(2) + ' MB'
    });
    
    return volumeTexture;
}

// Example 8: Procedural Texture Generation
function createProceduralTextures() {
    // Generate checkerboard
    const checkerboard = TextureUtils.generateCheckerboard(512, ['#ffffff', '#000000'], 16);
    checkerboard.wrapS = Texture.WRAP_MODES.REPEAT;
    checkerboard.wrapT = Texture.WRAP_MODES.REPEAT;
    
    // Generate gradient
    const gradient = TextureUtils.generateGradient(512, 256, ['#ff0000', '#0000ff']);
    
    // Generate noise
    const noise = TextureUtils.generateNoise(256, 256, 128);
    
    // Generate solid color
    const solid = TextureUtils.generateSolidColor(1, 1, '#00ff00');
    
    console.log('Generated procedural textures:', {
        checkerboard: `${checkerboard.width}x${checkerboard.height}`,
        gradient: `${gradient.width}x${gradient.height}`,
        noise: `${noise.width}x${noise.height}`,
        solid: `${solid.width}x${solid.height}`
    });
    
    return { checkerboard, gradient, noise, solid };
}

// Example 9: Texture Preloading
async function preloadTextures() {
    const textureUrls = [
        'assets/textures/diffuse.png',
        'assets/textures/normal.jpg',
        'assets/textures/specular.png',
        'assets/textures/emissive.png',
        'assets/textures/ao.png'
    ];
    
    try {
        const textures = await TextureUtils.preloadTextures(
            textureUrls,
            (loaded, total, texture, error) => {
                if (error) {
                    console.error(`Failed to load texture ${loaded}/${total}:`, error);
                } else {
                    console.log(`Loaded texture ${loaded}/${total}:`, texture.name);
                }
            }
        );
        
        console.log('All textures preloaded:', textures.length);
        return textures;
        
    } catch (error) {
        console.error('Preloading failed:', error);
        return [];
    }
}

// Example 10: Texture Memory Management
function manageTextureMemory() {
    const textures = [];
    
    // Create some textures
    for (let i = 0; i < 10; i++) {
        const texture = new Texture({
            width: 1024,
            height: 1024,
            format: Texture.FORMATS.RGBA
        });
        textures.push(texture);
        
        console.log(`Created texture ${i}:`, {
            memory: texture.estimatedMemoryMB.toFixed(2) + ' MB',
            accessCount: texture.accessCount
        });
    }
    
    // Monitor memory usage
    const totalMemory = textures.reduce((sum, tex) => sum + tex.estimatedMemoryMB, 0);
    console.log(`Total memory usage: ${totalMemory.toFixed(2)} MB`);
    
    // Clean up unused textures
    textures.forEach((texture, index) => {
        if (texture.accessCount === 0) {
            console.log(`Disposing unused texture ${index}`);
            texture.dispose();
        }
    });
    
    return textures;
}

// Example 11: Render Target Texture
function createRenderTarget() {
    const renderTexture = Texture.createEmpty(1024, 1024, {
        format: Texture.FORMATS.RGBA,
        type: Texture.TYPES.UNSIGNED_BYTE
    });
    
    // Configure for rendering
    renderTexture.wrapS = Texture.WRAP_MODES.CLAMP_TO_EDGE;
    renderTexture.wrapT = Texture.WRAP_MODES.CLAMP_TO_EDGE;
    renderTexture.minFilter = Texture.FILTERS.NEAREST;
    renderTexture.magFilter = Texture.FILTERS.NEAREST;
    
    console.log('Created render target:', {
        width: renderTexture.width,
        height: renderTexture.height,
        isRenderTarget: renderTexture.isRenderTarget,
        format: renderTexture.format
    });
    
    return renderTexture;
}

// Example 12: Texture Animation/Updates
function animateTexture(texture) {
    let frame = 0;
    
    function updateFrame() {
        frame++;
        
        // Update texture if needed
        if (texture.needsUpdate) {
            console.log('Updating texture frame:', frame);
            texture.dispatchEvent({ type: 'update', texture });
        }
        
        // Check if texture is still valid
        if (frame < 100) {
            requestAnimationFrame(updateFrame);
        }
    }
    
    // Start animation loop
    requestAnimationFrame(updateFrame);
    
    // Set up event listeners
    texture.addEventListener('updated', (event) => {
        console.log('Texture was updated at frame:', frame);
    });
}

// Example 13: WebGL Compatibility Check
function checkWebGLCapabilities(gl) {
    const maxTextureSize = Texture.getMaxTextureSize(gl);
    const supportsFloat = Texture.isFormatSupported(gl, Texture.FORMATS.RGBA, Texture.TYPES.FLOAT);
    const supportsCompressed = Texture.isFormatSupported(
        gl, 
        Texture.FORMATS.RGB_S3TC_DXT1, 
        Texture.TYPES.UNSIGNED_BYTE
    );
    
    console.log('WebGL capabilities:', {
        maxTextureSize: maxTextureSize,
        supportsFloatTextures: supportsFloat,
        supportsCompressedTextures: supportsCompressed
    });
    
    return {
        maxTextureSize,
        supportsFloat,
        supportsCompressed
    };
}

// Main function to run all examples
async function runExamples() {
    console.log('=== Texture System Examples ===\n');
    
    // Example 1: Basic loading
    console.log('1. Basic Texture Loading');
    const basicTexture = await basicTextureLoading();
    
    // Example 2: Cube maps
    console.log('\n2. Cube Map Creation');
    const cubeMap = await createCubeMap();
    
    // Example 3: Compressed textures
    console.log('\n3. Compressed Texture Loading');
    const compressedTexture = await loadCompressedTexture();
    
    // Example 4: HDR environments
    console.log('\n4. HDR Environment Loading');
    const hdrTexture = await loadHDREnvironment();
    
    // Example 5: Video textures
    console.log('\n5. Video Texture Creation');
    const videoTexture = createVideoTexture();
    
    // Example 6: Texture streaming
    console.log('\n6. Texture Streaming Setup');
    const streamingTexture = await setupTextureStreaming();
    
    // Example 7: 3D textures
    console.log('\n7. 3D Texture Creation');
    const volumeTexture = create3DTexture();
    
    // Example 8: Procedural generation
    console.log('\n8. Procedural Texture Generation');
    const proceduralTextures = createProceduralTextures();
    
    // Example 9: Preloading
    console.log('\n9. Texture Preloading');
    const preloadedTextures = await preloadTextures();
    
    // Example 10: Memory management
    console.log('\n10. Memory Management');
    const managedTextures = manageTextureMemory();
    
    // Example 11: Render targets
    console.log('\n11. Render Target Creation');
    const renderTarget = createRenderTarget();
    
    // Example 12: Animation
    if (basicTexture) {
        console.log('\n12. Texture Animation');
        animateTexture(basicTexture);
    }
    
    console.log('\n=== Examples Complete ===');
}

// Export examples for use in other modules
export {
    basicTextureLoading,
    createCubeMap,
    loadCompressedTexture,
    loadHDREnvironment,
    createVideoTexture,
    setupTextureStreaming,
    create3DTexture,
    createProceduralTextures,
    preloadTextures,
    manageTextureMemory,
    createRenderTarget,
    animateTexture,
    checkWebGLCapabilities,
    runExamples
};

// Run examples if this file is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    window.runTextureExamples = runExamples;
    console.log('Texture examples loaded. Call runExamples() to run.');
} else if (typeof module !== 'undefined') {
    // Examples are already exported
    // module.exports removed for UMD compatibility
        loadCompressedTexture,
        loadHDREnvironment,
        createVideoTexture,
        setupTextureStreaming,
        create3DTexture,
        createProceduralTextures,
        preloadTextures,
        manageTextureMemory,
        createRenderTarget,
        animateTexture,
        checkWebGLCapabilities,
        runExamples
    };
}
