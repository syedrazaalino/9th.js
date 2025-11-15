/**
 * Simple Color class for texture operations
 */
class Color {
    constructor(r = 1, g = 1, b = 1, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    
    set(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }
    
    copy(color) {
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        this.a = color.a;
        return this;
    }
    
    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
}

/**
 * Simple EventDispatcher for texture events
 */
class EventDispatcher {
    constructor() {
        this._listeners = {};
    }
    
    addEventListener(type, listener) {
        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }
        this._listeners[type].push(listener);
    }
    
    removeEventListener(type, listener) {
        if (this._listeners[type]) {
            const index = this._listeners[type].indexOf(listener);
            if (index > -1) {
                this._listeners[type].splice(index, 1);
            }
        }
    }
    
    removeAllListeners() {
        this._listeners = {};
    }
    
    dispatchEvent(event) {
        event.target = this;
        
        if (this._listeners[event.type]) {
            this._listeners[event.type].forEach(listener => {
                listener.call(this, event);
            });
        }
    }
    
    hasEventListener(type) {
        return this._listeners[type] && this._listeners[type].length > 0;
    }
}

/**
 * Comprehensive Texture System with support for multiple formats
 * Supports: PNG, JPEG, WebP, HDR, DDS, KTX2 formats
 * Features: Texture properties, updates, streaming for large textures
 */

export class Texture extends EventDispatcher {
    constructor(options = {}) {
        super();
        
        // Core properties
        this.id = Texture._nextId++;
        this.uuid = Math.random().toString(36).substr(2, 9);
        this.name = options.name || `Texture_${this.id}`;
        this.type = 'texture';
        
        // Image data and format
        this.image = null;
        this.mipmaps = [];
        this.format = options.format || Texture.FORMATS.RGBA;
        this.internalFormat = options.internalFormat || null;
        this.type = options.type || Texture.TYPES.UNSIGNED_BYTE;
        this.channels = options.channels || 4;
        
        // Dimensions
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.depth = options.depth || 0;
        this.layers = options.layers || 1; // For 2D array textures
        this.samples = options.samples || 1; // For multisampled textures
        
        // Texture parameters
        this.wrapS = options.wrapS || Texture.WRAP_MODES.CLAMP_TO_EDGE;
        this.wrapT = options.wrapT || Texture.WRAP_MODES.CLAMP_TO_EDGE;
        this.wrapR = options.wrapR || Texture.WRAP_MODES.CLAMP_TO_EDGE; // 3D textures
        
        this.magFilter = options.magFilter || Texture.FILTERS.LINEAR;
        this.minFilter = options.minFilter || Texture.FILTERS.LINEAR_MIPMAP_LINEAR;
        
        this.generateMipmaps = options.generateMipmaps !== false;
        this.minLevel = options.minLevel || 0;
        this.maxLevel = options.maxLevel || 1000;
        this.maxAnisotropy = options.maxAnisotropy || 1;
        
        // Texture coordinate transformation
        this.offset = options.offset || { x: 0, y: 0 };
        this.repeat = options.repeat || { x: 1, y: 1 };
        this.rotation = options.rotation || 0;
        this.center = options.center || { x: 0.5, y: 0.5 };
        
        // Streaming properties
        this.isStreaming = options.isStreaming || false;
        this.streamSources = options.streamSources || [];
        this.currentStreamLevel = 0;
        this.streamingLevel = -1;
        
        // Loading state
        this.isLoading = false;
        this.isLoaded = false;
        this.hasError = false;
        this.error = null;
        
        // WebGL context and texture object
        this._gl = null;
        this._glTexture = null;
        this._glTarget = options.target || Texture.TARGETS.TEXTURE_2D;
        
        // Animation properties
        this.flipY = options.flipY !== false;
        this.premultiplyAlpha = options.premultiplyAlpha !== false;
        this.unpackAlignment = options.unpackAlignment || 1;
        this.unpackColorspaceConversion = options.unpackColorspaceConversion || Texture.COLORSPACE_CONVERSION.DEFAULT;
        
        // Caching and metadata
        this.isRenderTarget = options.isRenderTarget || false;
        this.encoding = options.encoding || Texture.ENCODINGS.SRGB;
        this.version = 0;
        this.needsUpdate = true;
        this.cacheKey = options.cacheKey || null;
        
        // Event listeners
        this.addEventListener('update', this._onTextureUpdate.bind(this));
        this.addEventListener('load', this._onTextureLoad.bind(this));
        this.addEventListener('error', this._onTextureError.bind(this));
        
        // Performance monitoring
        this.accessCount = 0;
        this.lastAccessTime = 0;
        this.memorySize = 0;
        this.compressionRatio = 1.0;
        
        // Cube map specific properties
        if (this._glTarget === Texture.TARGETS.TEXTURE_CUBE_MAP) {
            this.cubeMapImages = options.cubeMapImages || [];
            this.width = options.width || 512;
            this.height = options.height || 512;
        }
        
        // Array texture specific properties
        if (this._glTarget === Texture.TARGETS.TEXTURE_2D_ARRAY) {
            this.layers = options.layers || 1;
        }
        
        // 3D texture specific properties
        if (this._glTarget === Texture.TARGETS.TEXTURE_3D) {
            this.depth = options.depth || 1;
        }
        
        // Initialize memory size calculation
        this._calculateMemorySize();
    }
    
    // Static constants and enums
    static _nextId = 1;
    
    static FORMATS = {
        RED: 0,
        RG: 1,
        RGB: 2,
        RGBA: 3,
        LUMINANCE: 4,
        LUMINANCE_ALPHA: 5,
        DEPTH_COMPONENT: 6,
        DEPTH_STENCIL: 7,
        RED_INTEGER: 8,
        RG_INTEGER: 9,
        RGB_INTEGER: 10,
        RGBA_INTEGER: 11,
        STENCIL_INDEX: 12,
        BGRA: 13,
        RGB_S3TC_DXT1: 14,
        RGBA_S3TC_DXT3: 15,
        RGBA_S3TC_DXT5: 16,
        RGB_PVRTC_2BPPV1: 17,
        RGB_PVRTC_4BPPV1: 18,
        RGBA_PVRTC_2BPPV1: 19,
        RGBA_PVRTC_4BPPV1: 20,
        RGB_ETC1: 21,
        RGB8_ETC2: 22,
        RGBA8_ETC2_EAC: 23,
        R11F_G11F_B10F: 24,
        RGB9_E5: 25,
        RGB16F: 26,
        RGB32F: 27,
        RGBA16F: 28,
        RGBA32F: 29,
        DEPTH24_STENCIL8: 30,
        DEPTH32F_STENCIL8: 31,
        RGB_BGGR: 32,
        RGBA_BGGR: 33
    };
    
    static TYPES = {
        UNSIGNED_BYTE: 0,
        BYTE: 1,
        UNSIGNED_SHORT: 2,
        SHORT: 3,
        UNSIGNED_INT: 4,
        INT: 5,
        FLOAT: 6,
        UNSIGNED_BYTE_3_3_2: 7,
        UNSIGNED_BYTE_2_3_3_REV: 8,
        UNSIGNED_SHORT_5_6_5: 9,
        UNSIGNED_SHORT_5_6_5_REV: 10,
        UNSIGNED_SHORT_4_4_4_4: 11,
        UNSIGNED_SHORT_4_4_4_4_REV: 12,
        UNSIGNED_SHORT_5_5_5_1: 13,
        UNSIGNED_SHORT_1_5_5_5_REV: 14,
        UNSIGNED_INT_8_8_8_8: 15,
        UNSIGNED_INT_8_8_8_8_REV: 16,
        UNSIGNED_INT_10_10_10_2: 17,
        UNSIGNED_INT_2_10_10_10_REV: 18,
        UNSIGNED_INT_24_8: 19,
        UNSIGNED_INT_10F_11F_REV: 20,
        UNSIGNED_INT_5_9_9_9_REV: 21,
        FLOAT_32_UNSIGNED_INT_24_8_REV: 22
    };
    
    static WRAP_MODES = {
        REPEAT: 0,
        CLAMP_TO_EDGE: 1,
        MIRRORED_REPEAT: 2
    };
    
    static FILTERS = {
        NEAREST: 0,
        LINEAR: 1,
        NEAREST_MIPMAP_NEAREST: 2,
        NEAREST_MIPMAP_LINEAR: 3,
        LINEAR_MIPMAP_NEAREST: 4,
        LINEAR_MIPMAP_LINEAR: 5
    };
    
    static TARGETS = {
        TEXTURE_2D: 0,
        TEXTURE_CUBE_MAP: 1,
        TEXTURE_3D: 2,
        TEXTURE_2D_ARRAY: 3
    };
    
    static COMPRESSION_FORMATS = {
        'dds': 'DDS',
        'ktx2': 'KTX2',
        'pvr': 'PVR',
        'astc': 'ASTC'
    };
    
    static ENCODINGS = {
        LINEAR: 0,
        SRGB: 1,
        SRGB_COLORSPACE: 2
    };
    
    static COLORSPACE_CONVERSION = {
        NONE: -1,
        DEFAULT: 0,
        BROWSER_DEFAULT: 1
    };
    
    static IMAGE_FORMATS = {
        PNG: { extensions: ['.png'], type: 'image/png', supported: true },
        JPEG: { extensions: ['.jpg', '.jpeg'], type: 'image/jpeg', supported: true },
        WEBP: { extensions: ['.webp'], type: 'image/webp', supported: true },
        GIF: { extensions: ['.gif'], type: 'image/gif', supported: true },
        TIFF: { extensions: ['.tiff', '.tif'], type: 'image/tiff', supported: false },
        BMP: { extensions: ['.bmp'], type: 'image/bmp', supported: false },
        ICO: { extensions: ['.ico'], type: 'image/x-icon', supported: false },
        HDR: { extensions: ['.hdr', '.rgbe'], type: 'application/x-hdr', supported: true },
        EXR: { extensions: ['.exr'], type: 'image/exr', supported: false },
        DDS: { extensions: ['.dds'], type: 'application/octet-stream', supported: true },
        KTX2: { extensions: ['.ktx2'], type: 'application/octet-stream', supported: true }
    };
    
    /**
     * Load texture from various sources
     */
    static async load(url, options = {}) {
        const texture = new Texture({ ...options, url });
        
        try {
            texture.isLoading = true;
            texture.dispatchEvent({ type: 'loadstart', url });
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load texture: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type') || '';
            const extension = url.split('.').pop().toLowerCase();
            
            let imageData;
            
            if (this._isCompressedFormat(extension, contentType)) {
                imageData = await response.arrayBuffer();
                await texture._loadCompressedTexture(imageData, extension);
            } else {
                const blob = await response.blob();
                imageData = await texture._loadImageTexture(blob);
            }
            
            texture.image = imageData;
            texture.isLoaded = true;
            texture.isLoading = false;
            texture.needsUpdate = true;
            
            texture.dispatchEvent({ type: 'load', url, texture });
            texture.dispatchEvent({ type: 'update', texture });
            
            return texture;
            
        } catch (error) {
            texture.isLoading = false;
            texture.hasError = true;
            texture.error = error;
            texture.dispatchEvent({ type: 'error', error, url });
            throw error;
        }
    }
    
    /**
     * Create texture from image data/canvas/video
     */
    static fromData(data, options = {}) {
        const texture = new Texture(options);
        texture.image = data;
        texture.isLoaded = true;
        texture.needsUpdate = true;
        
        if (data instanceof HTMLImageElement || data instanceof HTMLCanvasElement) {
            texture.width = data.width;
            texture.height = data.height;
        } else if (data instanceof HTMLVideoElement) {
            texture.width = data.videoWidth;
            texture.height = data.videoHeight;
            texture.isVideo = true;
            texture._startVideoLoop(data);
        }
        
        texture.dispatchEvent({ type: 'update', texture });
        return texture;
    }
    
    /**
     * Create cube map texture from multiple face images
     */
    static fromCubeMap(faces, options = {}) {
        const texture = new Texture({ ...options, target: Texture.TARGETS.TEXTURE_CUBE_MAP });
        texture.cubeMapImages = faces;
        texture.isLoaded = true;
        texture.needsUpdate = true;
        
        if (faces.length === 6 && faces[0] instanceof HTMLImageElement) {
            texture.width = faces[0].width;
            texture.height = faces[0].height;
        }
        
        texture.dispatchEvent({ type: 'update', texture });
        return texture;
    }
    
    /**
     * Create empty texture for render targets
     */
    static createEmpty(width, height, options = {}) {
        const texture = new Texture({ ...options, width, height });
        texture.isRenderTarget = true;
        texture.isLoaded = true;
        return texture;
    }
    
    /**
     * Main texture update method
     */
    update(gl) {
        if (!this._gl) {
            this._gl = gl;
        }
        
        if (!this.needsUpdate && !this._hasPendingUpdates()) {
            return;
        }
        
        this.accessCount++;
        this.lastAccessTime = Date.now();
        
        if (!this._glTexture) {
            this._createGLTexture();
        }
        
        this._uploadTextureData();
        this.needsUpdate = false;
        
        this.dispatchEvent({ type: 'updated', texture: this });
    }
    
    /**
     * Update texture parameters without re-uploading data
     */
    updateParameters(gl, params = {}) {
        if (!this._gl) {
            this._gl = gl;
        }
        
        Object.assign(this, params);
        this.needsUpdate = true;
        this.update(gl);
    }
    
    /**
     * Start streaming texture from multiple sources
     */
    startStreaming(sources, levels = null) {
        if (!this._isStreamable()) {
            throw new Error('Texture is not streamable');
        }
        
        this.isStreaming = true;
        this.streamSources = sources;
        this.streamingLevel = levels || Math.floor(Math.log2(Math.max(this.width, this.height)));
        this.currentStreamLevel = 0;
        
        return this._loadStreamLevel(0);
    }
    
    /**
     * Load next streaming level
     */
    async loadNextStreamLevel() {
        if (!this.isStreaming || this.currentStreamLevel >= this.streamingLevel) {
            return false;
        }
        
        const nextLevel = this.currentStreamLevel + 1;
        return this._loadStreamLevel(nextLevel);
    }
    
    /**
     * Dispose texture and free resources
     */
    dispose() {
        // Stop streaming
        this.isStreaming = false;
        this.streamSources = [];
        
        // Stop video loop if applicable
        if (this.isVideo && this.image) {
            this._stopVideoLoop();
        }
        
        // Delete WebGL texture
        if (this._gl && this._glTexture) {
            this._gl.deleteTexture(this._glTexture);
            this._glTexture = null;
        }
        
        // Clear mipmaps
        this.mipmaps = [];
        
        // Reset image data
        this.image = null;
        this.cubeMapImages = null;
        
        // Dispatch dispose event
        this.dispatchEvent({ type: 'dispose', texture: this });
        
        // Remove all event listeners
        this.removeAllListeners();
    }
    
    /**
     * Clone texture
     */
    clone() {
        const cloned = new Texture({
            ...this,
            id: Texture._nextId++,
            uuid: Math.random().toString(36).substr(2, 9)
        });
        
        cloned.image = this.image;
        cloned.mipmaps = [...this.mipmaps];
        cloned.isLoaded = this.isLoaded;
        cloned.needsUpdate = true;
        
        return cloned;
    }
    
    // Private helper methods
    
    async _loadImageTexture(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Create canvas for pixel data access
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                resolve(canvas);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = URL.createObjectURL(blob);
        });
    }
    
    async _loadCompressedTexture(arrayBuffer, extension) {
        switch (extension.toLowerCase()) {
            case 'dds':
                return this._parseDDS(arrayBuffer);
            case 'ktx2':
                return this._parseKTX2(arrayBuffer);
            case 'hdr':
                return this._parseHDR(arrayBuffer);
            default:
                throw new Error(`Unsupported compressed format: ${extension}`);
        }
    }
    
    _parseDDS(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        const magic = dataView.getUint32(0, true);
        
        if (magic !== 0x20534444) { // 'DDS '
            throw new Error('Invalid DDS file');
        }
        
        const header = {};
        header.size = dataView.getUint32(4, true);
        header.flags = dataView.getUint32(8, true);
        header.height = dataView.getUint32(12, true);
        header.width = dataView.getUint32(16, true);
        header.pitch = dataView.getUint32(20, true);
        header.depth = dataView.getUint32(24, true);
        header.mipmapCount = dataView.getUint32(28, true);
        header.formatSize = dataView.getUint32(32, true);
        
        // Parse format information
        const format = {};
        format.size = dataView.getUint32(36, true);
        format.flags = dataView.getUint32(40, true);
        format.fourCC = dataView.getUint32(44, true);
        format.bitsPerPixel = dataView.getUint32(48, true);
        format.redMask = dataView.getUint32(52, true);
        format.greenMask = dataView.getUint32(56, true);
        format.blueMask = dataView.getUint32(60, true);
        format.alphaMask = dataView.getUint32(64, true);
        
        // Determine format
        let textureFormat;
        let internalFormat;
        
        if (format.fourCC) {
            switch (format.fourCC) {
                case 0x31545844: // 'DXT1'
                    textureFormat = Texture.FORMATS.RGB_S3TC_DXT1;
                    internalFormat = 'COMPRESSED_RGB_S3TC_DXT1_EXT';
                    break;
                case 0x33545844: // 'DXT3'
                    textureFormat = Texture.FORMATS.RGBA_S3TC_DXT3;
                    internalFormat = 'COMPRESSED_RGBA_S3TC_DXT3_EXT';
                    break;
                case 0x35545844: // 'DXT5'
                    textureFormat = Texture.FORMATS.RGBA_S3TC_DXT5;
                    internalFormat = 'COMPRESSED_RGBA_S3TC_DXT5_EXT';
                    break;
                default:
                    throw new Error(`Unsupported DDS format: ${format.fourCC.toString(16)}`);
            }
        }
        
        this.width = header.width;
        this.height = header.height;
        this.depth = header.depth;
        this.format = textureFormat;
        this.internalFormat = internalFormat;
        this.compressionRatio = this._calculateCompressionRatio(format);
        
        // Return compressed data
        return {
            compressed: true,
            data: arrayBuffer,
            offset: 128, // Header size
            mipmaps: this._extractMipmapsDDS(arrayBuffer, header.mipmapCount)
        };
    }
    
    async _parseKTX2(arrayBuffer) {
        // KTX2 parsing would go here
        // This is a simplified version - full implementation would parse
        // the KTX2 format properly including supercompression schemes
        
        const dataView = new DataView(arrayBuffer);
        const magic = new TextDecoder().decode(arrayBuffer.slice(0, 12));
        
        if (magic !== '«KTXfoo»') {
            throw new Error('Invalid KTX2 file');
        }
        
        // Simplified parsing - would need full KTX2 implementation
        this.width = dataView.getUint32(52, true);
        this.height = dataView.getUint32(56, true);
        this.format = Texture.FORMATS.RGBA;
        
        return {
            compressed: true,
            data: arrayBuffer,
            compressedFormat: 'ASTC' // Would be determined from KTX2 header
        };
    }
    
    _parseHDR(arrayBuffer) {
        // Basic HDR/Radiance RGBE format parser
        const text = new TextDecoder().decode(arrayBuffer);
        
        if (!text.startsWith('#?RADIANCE\n')) {
            throw new Error('Invalid HDR file');
        }
        
        // Parse header to get dimensions
        const lines = text.split('\n');
        let width = 0, height = 0;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-Y ')) {
                height = parseInt(line.split(' ')[1]);
                width = parseInt(line.split(' ')[2].split('+')[0]);
                break;
            }
        }
        
        this.width = width;
        this.height = height;
        this.format = Texture.FORMATS.RGBF;
        this.type = Texture.TYPES.FLOAT;
        this.encoding = Texture.ENCODINGS.LINEAR;
        
        // Convert RGBE to float RGB
        return this._convertRGBEToFloat(arrayBuffer, width, height);
    }
    
    _convertRGBEToFloat(arrayBuffer, width, height) {
        const dataView = new DataView(arrayBuffer);
        const pixelCount = width * height;
        const floatData = new Float32Array(pixelCount * 3);
        
        let offset = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const exponent = dataView.getUint8(offset++);
                const r = dataView.getUint8(offset++);
                const g = dataView.getUint8(offset++);
                const b = dataView.getUint8(offset++);
                
                if (exponent !== 0) {
                    const scale = Math.pow(2, exponent - 128) / 255;
                    floatData[(y * width + x) * 3] = r * scale;
                    floatData[(y * width + x) * 3 + 1] = g * scale;
                    floatData[(y * width + x) * 3 + 2] = b * scale;
                } else {
                    floatData[(y * width + x) * 3] = 0;
                    floatData[(y * width + x) * 3 + 1] = 0;
                    floatData[(y * width + x) * 3 + 2] = 0;
                }
            }
        }
        
        return {
            data: floatData,
            width,
            height,
            format: Texture.FORMATS.RGB,
            type: Texture.TYPES.FLOAT
        };
    }
    
    _createGLTexture() {
        if (!this._gl) return;
        
        this._glTexture = this._gl.createTexture();
        this._gl.bindTexture(this._glTarget, this._glTexture);
        
        // Set default parameters
        this._gl.texParameteri(this._glTarget, this._gl.TEXTURE_WRAP_S, this.wrapS);
        this._gl.texParameteri(this._glTarget, this._gl.TEXTURE_WRAP_T, this.wrapT);
        this._gl.texParameteri(this._glTarget, this._gl.TEXTURE_MIN_FILTER, this.minFilter);
        this._gl.texParameteri(this._glTarget, this._gl.TEXTURE_MAG_FILTER, this.magFilter);
        
        // Set anisotropy if supported
        if (this._gl.getExtension('EXT_texture_filter_anisotropic')) {
            this._gl.texParameteri(
                this._glTarget, 
                this._gl.TEXTURE_MAX_ANISOTROPY_EXT, 
                Math.min(this.maxAnisotropy, 16)
            );
        }
    }
    
    _uploadTextureData() {
        if (!this._gl || !this._glTexture || !this.image) return;
        
        this._gl.bindTexture(this._glTarget, this._glTexture);
        
        if (this._glTarget === Texture.TARGETS.TEXTURE_CUBE_MAP) {
            this._uploadCubeMapData();
        } else if (this._glTarget === Texture.TARGETS.TEXTURE_3D) {
            this._upload3DTextureData();
        } else if (this._glTarget === Texture.TARGETS.TEXTURE_2D_ARRAY) {
            this._uploadArrayTextureData();
        } else {
            this._upload2DTextureData();
        }
        
        if (this.generateMipmaps && this._gl.getExtension('OES_texture_float')) {
            this._gl.generateMipmap(this._glTarget);
        }
    }
    
    _upload2DTextureData() {
        const gl = this._gl;
        
        if (this.image.compressed && this.image.data) {
            // Compressed texture
            gl.compressedTexImage2D(
                gl.TEXTURE_2D,
                0,
                this._getCompressedInternalFormat(),
                this.width,
                this.height,
                0,
                this.image.data
            );
        } else {
            // Uncompressed texture
            const format = this._getTextureFormat();
            const type = this._getTextureType();
            
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                format,
                this.width,
                this.height,
                0,
                format,
                type,
                this.image.data || this.image
            );
        }
    }
    
    _uploadCubeMapData() {
        const gl = this._gl;
        const faceOrder = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        
        for (let i = 0; i < 6; i++) {
            const face = this.cubeMapImages[i];
            if (!face) continue;
            
            const format = this._getTextureFormat();
            const type = this._getTextureType();
            
            gl.texImage2D(
                faceOrder[i],
                0,
                format,
                this.width,
                this.height,
                0,
                format,
                type,
                face.data || face
            );
        }
    }
    
    _upload3DTextureData() {
        const gl = this._gl;
        const format = this._getTextureFormat();
        const type = this._getTextureType();
        
        gl.texImage3D(
            gl.TEXTURE_3D,
            0,
            format,
            this.width,
            this.height,
            this.depth,
            0,
            format,
            type,
            this.image.data || this.image
        );
    }
    
    _uploadArrayTextureData() {
        const gl = this._gl;
        const format = this._getTextureFormat();
        const type = this._getTextureType();
        
        gl.texImage3D(
            gl.TEXTURE_2D_ARRAY,
            0,
            format,
            this.width,
            this.height,
            this.layers,
            0,
            format,
            type,
            this.image.data || this.image
        );
    }
    
    async _loadStreamLevel(level) {
        const url = this.streamSources[level];
        if (!url) return false;
        
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const imageData = await this._loadImageTexture(blob);
            
            this.mipmaps[level] = imageData;
            this.currentStreamLevel = level;
            
            this.dispatchEvent({ 
                type: 'streamlevel', 
                level, 
                texture: this 
            });
            
            return true;
        } catch (error) {
            this.dispatchEvent({ type: 'streamerror', error, level });
            return false;
        }
    }
    
    _startVideoLoop(video) {
        const updateVideoTexture = () => {
            if (video.readyState >= video.HAVE_CURRENT_DATA) {
                this.needsUpdate = true;
                this.dispatchEvent({ type: 'update', texture: this });
            }
            
            if (!video.paused && !video.ended) {
                requestAnimationFrame(updateVideoTexture);
            }
        };
        
        video.addEventListener('play', updateVideoTexture);
        video.addEventListener('seeked', updateVideoTexture);
        updateVideoTexture();
    }
    
    _stopVideoLoop() {
        if (this.image && this.image.pause) {
            this.image.pause();
        }
    }
    
    _calculateMemorySize() {
        let bytesPerPixel = 1;
        
        switch (this.type) {
            case Texture.TYPES.UNSIGNED_BYTE:
                bytesPerPixel = 1;
                break;
            case Texture.TYPES.UNSIGNED_SHORT:
            case Texture.TYPES.SHORT:
                bytesPerPixel = 2;
                break;
            case Texture.TYPES.UNSIGNED_INT:
            case Texture.TYPES.INT:
            case Texture.TYPES.FLOAT:
                bytesPerPixel = 4;
                break;
            default:
                bytesPerPixel = 1;
        }
        
        const pixelCount = this.width * this.height * this.depth;
        this.memorySize = pixelCount * bytesPerPixel * this.channels;
        
        // Add compression ratio
        if (this.image && this.image.compressed) {
            this.memorySize *= this.compressionRatio;
        }
    }
    
    _calculateCompressionRatio(format) {
        // Estimate compression ratios for different formats
        switch (format.fourCC) {
            case 0x31545844: // 'DXT1'
                return 6.0; // 6:1 compression
            case 0x33545844: // 'DXT3'
            case 0x35545844: // 'DXT5'
                return 4.0; // 4:1 compression
            default:
                return 1.0;
        }
    }
    
    _extractMipmapsDDS(arrayBuffer, mipmapCount) {
        const mipmaps = [];
        let offset = 128; // After header
        
        for (let i = 0; i < mipmapCount; i++) {
            const size = new DataView(arrayBuffer, offset, 4).getUint32(0, true);
            offset += 4;
            
            mipmaps.push({
                data: arrayBuffer.slice(offset, offset + size),
                size
            });
            
            offset += size;
            offset = (offset + 3) & ~3; // Align to 4 bytes
        }
        
        return mipmaps;
    }
    
    _isCompressedFormat(extension, contentType) {
        return extension.toLowerCase() in Texture.COMPRESSION_FORMATS ||
               contentType.includes('application/octet-stream');
    }
    
    _isStreamable() {
        return this.width > 512 || this.height > 512;
    }
    
    _hasPendingUpdates() {
        return this.isVideo && this.image && 
               (this.image.readyState >= this.image.HAVE_CURRENT_DATA);
    }
    
    _getTextureFormat() {
        const gl = this._gl;
        
        switch (this.format) {
            case Texture.FORMATS.RGBA:
                return gl.RGBA;
            case Texture.FORMATS.RGB:
                return gl.RGB;
            case Texture.FORMATS.LUMINANCE_ALPHA:
                return gl.LUMINANCE_ALPHA;
            case Texture.FORMATS.LUMINANCE:
                return gl.LUMINANCE;
            case Texture.FORMATS.DEPTH_COMPONENT:
                return gl.DEPTH_COMPONENT;
            case Texture.FORMATS.DEPTH_STENCIL:
                return gl.DEPTH_STENCIL;
            default:
                return gl.RGBA;
        }
    }
    
    _getTextureType() {
        const gl = this._gl;
        
        switch (this.type) {
            case Texture.TYPES.UNSIGNED_BYTE:
                return gl.UNSIGNED_BYTE;
            case Texture.TYPES.UNSIGNED_SHORT:
                return gl.UNSIGNED_SHORT;
            case Texture.TYPES.UNSIGNED_INT:
                return gl.UNSIGNED_INT;
            case Texture.TYPES.FLOAT:
                return gl.FLOAT;
            case Texture.TYPES.SHORT:
                return gl.SHORT;
            case Texture.TYPES.INT:
                return gl.INT;
            default:
                return gl.UNSIGNED_BYTE;
        }
    }
    
    _getCompressedInternalFormat() {
        const gl = this._gl;
        
        switch (this.internalFormat) {
            case 'COMPRESSED_RGB_S3TC_DXT1_EXT':
                return gl.COMPRESSED_RGB_S3TC_DXT1_EXT;
            case 'COMPRESSED_RGBA_S3TC_DXT3_EXT':
                return gl.COMPRESSED_RGBA_S3TC_DXT3_EXT;
            case 'COMPRESSED_RGBA_S3TC_DXT5_EXT':
                return gl.COMPRESSED_RGBA_S3TC_DXT5_EXT;
            default:
                return gl.COMPRESSED_RGBA_S3TC_DXT5_EXT;
        }
    }
    
    // Event handlers
    _onTextureUpdate(event) {
        this.needsUpdate = true;
    }
    
    _onTextureLoad(event) {
        this._calculateMemorySize();
    }
    
    _onTextureError(event) {
        this.hasError = true;
        console.error('Texture load error:', event.error);
    }
    
    // Utility methods
    static getMaxTextureSize(gl) {
        return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
    
    static isFormatSupported(gl, format, type) {
        const texture = new Texture();
        const testTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, testTexture);
        
        try {
            gl.texImage2D(gl.TEXTURE_2D, 0, format, 2, 2, 0, format, type, null);
            return true;
        } catch (e) {
            return false;
        } finally {
            gl.deleteTexture(testTexture);
        }
    }
    
    static getOptimalMinFilter(width, height) {
        const maxDim = Math.max(width, height);
        if (maxDim <= 1) return Texture.FILTERS.NEAREST;
        if (maxDim <= 2) return Texture.FILTERS.LINEAR;
        if (maxDim <= 4) return Texture.FILTERS.NEAREST_MIPMAP_NEAREST;
        return Texture.FILTERS.LINEAR_MIPMAP_LINEAR;
    }
    
    static detectImageFormat(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        for (const [formatName, formatInfo] of Object.entries(Texture.IMAGE_FORMATS)) {
            if (formatInfo.extensions.some(ext => ext.slice(1) === extension)) {
                return formatName;
            }
        }
        
        return null;
    }
    
    // Getters
    get aspectRatio() {
        return this.width / this.height;
    }
    
    get isPowerOf2() {
        return this.width > 0 && (this.width & (this.width - 1)) === 0 &&
               this.height > 0 && (this.height & (this.height - 1)) === 0;
    }
    
    get hasAlpha() {
        return this.format === Texture.FORMATS.RGBA || 
               this.format === Texture.FORMATS.LUMINANCE_ALPHA ||
               this.format === Texture.FORMATS.RGBA_INTEGER;
    }
    
    get isCompressed() {
        return this.image && this.image.compressed;
    }
    
    get estimatedMemoryMB() {
        return this.memorySize / (1024 * 1024);
    }
    
    get maxMipLevel() {
        if (!this.isPowerOf2) return 0;
        return Math.floor(Math.log2(Math.max(this.width, this.height)));
    }
}

// Texture is already exported at the top of the file
