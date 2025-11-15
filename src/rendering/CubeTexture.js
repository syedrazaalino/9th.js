/**
 * CubeTexture.js - Cubemap texture handling for skyboxes and reflections
 * Supports cubemap texture creation, loading, and WebGL integration
 */

import { WebGLRenderer } from '../core/WebGLRenderer.js';

export class CubeTexture {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.id = this.generateId();
        
        // Cube face configuration
        this.size = options.size || 512;
        this.format = options.format || gl.RGBA;
        this.internalFormat = options.internalFormat || gl.RGBA;
        this.type = options.type || gl.UNSIGNED_BYTE;
        
        // Texture settings
        this.wrapS = options.wrapS || gl.CLAMP_TO_EDGE;
        this.wrapT = options.wrapT || gl.CLAMP_TO_EDGE;
        this.minFilter = options.minFilter || gl.LINEAR_MIPMAP_LINEAR;
        this.magFilter = options.magFilter || gl.LINEAR;
        this.generateMipmaps = options.generateMipmaps !== false;
        
        // Cube face data
        this.faces = {
            [gl.TEXTURE_CUBE_MAP_POSITIVE_X]: null,
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_X]: null,
            [gl.TEXTURE_CUBE_MAP_POSITIVE_Y]: null,
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y]: null,
            [gl.TEXTURE_CUBE_MAP_POSITIVE_Z]: null,
            [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]: null
        };
        
        // WebGL texture object
        this.texture = null;
        this.isLoaded = false;
        this.isDirty = false;
        
        // Metadata
        this.flipY = options.flipY !== false;
        this.encoding = options.encoding || 'linear';
        this.mapping = options.mapping || 'default';
        this.magFilter = options.magFilter || gl.LINEAR;
        this.minFilter = options.minFilter || gl.LINEAR_MIPMAP_LINEAR;
        
        this.init();
    }
    
    /**
     * Initialize the cube texture
     */
    init() {
        this.texture = this.gl.createTexture();
        if (!this.texture) {
            throw new Error('Failed to create cube texture');
        }
        
        this.bind();
        this.updateParameters();
        
        // Allocate storage for all faces
        this.allocateStorage();
    }
    
    /**
     * Bind the texture to the current texture unit
     */
    bind(textureUnit = 0) {
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
    }
    
    /**
     * Update texture parameters
     */
    updateParameters() {
        const gl = this.gl;
        
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, this.wrapS);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, this.wrapT);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, this.minFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, this.magFilter);
        
        // Set texture encoding if supported
        if (this.encoding === 'sRGB' && gl.sRGBEncoding) {
            gl.texImage2D = gl.texImage2D || function() {};
        }
    }
    
    /**
     * Allocate storage for all cube faces
     */
    allocateStorage() {
        const gl = this.gl;
        
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        
        // Allocate storage for each face
        for (let face in this.faces) {
            const target = parseInt(face);
            gl.texImage2D(target, 0, this.internalFormat, 
                         this.size, this.size, 0, this.format, this.type, null);
        }
        
        if (this.generateMipmaps) {
            gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        }
    }
    
    /**
     * Set data for a specific cube face
     */
    setFaceData(face, data, width = null, height = null) {
        const gl = this.gl;
        const target = typeof face === 'number' ? face : this.getFaceTarget(face);
        
        if (!data) {
            throw new Error('No data provided for cube face');
        }
        
        this.bind();
        
        // If data is ImageData, HTMLImageElement, or canvas
        if (data instanceof ImageData || data instanceof HTMLImageElement || 
            data instanceof HTMLCanvasElement || data instanceof HTMLVideoElement) {
            gl.texImage2D(target, 0, this.internalFormat, 
                         this.format, this.type, data);
        } else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
            const w = width || this.size;
            const h = height || this.size;
            gl.texImage2D(target, 0, this.internalFormat, 
                         w, h, 0, this.format, this.type, data);
        } else {
            throw new Error('Unsupported data type for cube texture face');
        }
        
        this.faces[target] = data;
        this.isDirty = true;
        
        if (this.generateMipmaps) {
            this.generateMipmap();
        }
    }
    
    /**
     * Get the WebGL target for a cube face identifier
     */
    getFaceTarget(faceName) {
        const faceMap = {
            'posx': this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            'negx': this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            'posy': this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            'negy': this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            'posz': this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            'negz': this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        };
        
        return faceMap[faceName.toLowerCase()];
    }
    
    /**
     * Set all faces at once from an object with face data
     */
    setFaces(facesData) {
        for (const [faceName, data] of Object.entries(facesData)) {
            this.setFaceData(faceName, data);
        }
        this.isLoaded = true;
    }
    
    /**
     * Generate mipmaps for all cube faces
     */
    generateMipmap() {
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.texture);
        this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
    }
    
    /**
     * Upload texture data to GPU if needed
     */
    upload() {
        if (!this.isDirty) return;
        
        this.updateParameters();
        
        // Re-upload all face data that has changed
        for (const [target, data] of Object.entries(this.faces)) {
            if (data) {
                this.setFaceData(parseInt(target), data);
            }
        }
        
        this.isDirty = false;
    }
    
    /**
     * Sample texture at given direction
     */
    sample(direction) {
        // This would typically be done in a shader
        // This is a placeholder for CPU-side sampling if needed
        return [0, 0, 0, 1];
    }
    
    /**
     * Convert equirectangular texture to cubemap
     */
    static fromEquirectangular(gl, equirectangularTexture, resolution = 512) {
        const cubeTexture = new CubeTexture(gl, { size: resolution });
        
        // Create equirectangular to cubemap conversion shader
        const vertexShader = `
            attribute vec3 position;
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            varying vec3 direction;
            
            void main() {
                direction = position;
                gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            uniform sampler2D equirectangularMap;
            varying vec3 direction;
            
            const vec2 invAtan = vec2(0.1591, 0.3183);
            
            vec2 sampleSphericalMap(vec3 v) {
                vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
                uv *= invAtan;
                uv += 0.5;
                return uv;
            }
            
            void main() {
                vec2 uv = sampleSphericalMap(normalize(direction));
                vec3 color = texture2D(equirectangularMap, uv).rgb;
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        // Create framebuffer for each cube face
        const faces = [
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, eye: [1, 0, 0], up: [0, -1, 0] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, eye: [-1, 0, 0], up: [0, -1, 0] },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, eye: [0, 1, 0], up: [0, 0, 1] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, eye: [0, -1, 0], up: [0, 0, -1] },
            { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, eye: [0, 0, 1], up: [0, -1, 0] },
            { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, eye: [0, 0, -1], up: [0, -1, 0] }
        ];
        
        // Implementation would involve creating a temporary framebuffer and rendering
        // each face with the conversion shader
        // This is a simplified version - full implementation would require:
        // 1. Creating temporary framebuffers for each face
        // 2. Setting up proper camera matrices for each face
        // 3. Rendering with the equirectangular conversion shader
        
        console.warn('Equirectangular to cubemap conversion requires full shader implementation');
        return cubeTexture;
    }
    
    /**
     * Create a cube texture from 6 separate images
     */
    static fromImages(gl, images, options = {}) {
        const size = options.size || images[0].width;
        const cubeTexture = new CubeTexture(gl, { size, ...options });
        
        const faceNames = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz'];
        
        faceNames.forEach((faceName, index) => {
            if (images[index]) {
                cubeTexture.setFaceData(faceName, images[index]);
            }
        });
        
        cubeTexture.isLoaded = true;
        return cubeTexture;
    }
    
    /**
     * Create a cube texture from a single image (using a subdivision)
     */
    static fromSingleImage(gl, image, options = {}) {
        // This would split a single image into 6 cube faces
        // Implementation would depend on the image layout
        console.warn('Single image cube texture loading not fully implemented');
        return new CubeTexture(gl, options);
    }
    
    /**
     * Dispose of the texture and free GPU resources
     */
    dispose() {
        if (this.texture) {
            this.gl.deleteTexture(this.texture);
            this.texture = null;
        }
        
        this.faces = {};
        this.isLoaded = false;
    }
    
    /**
     * Generate unique ID for this texture
     */
    generateId() {
        return 'cube_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get texture info for debugging
     */
    getInfo() {
        return {
            id: this.id,
            size: this.size,
            format: this.format,
            type: this.type,
            facesLoaded: Object.keys(this.faces).filter(key => this.faces[key]).length,
            totalFaces: 6,
            isLoaded: this.isLoaded,
            generateMipmaps: this.generateMipmaps
        };
    }
    
    /**
     * Clone this texture
     */
    clone() {
        const clone = new CubeTexture(this.gl, {
            size: this.size,
            format: this.format,
            internalFormat: this.internalFormat,
            type: this.type,
            wrapS: this.wrapS,
            wrapT: this.wrapT,
            minFilter: this.minFilter,
            magFilter: this.magFilter,
            generateMipmaps: this.generateMipmaps
        });
        
        // Copy face data
        for (const [target, data] of Object.entries(this.faces)) {
            if (data) {
                clone.faces[target] = data;
            }
        }
        
        clone.isLoaded = this.isLoaded;
        return clone;
    }
}
