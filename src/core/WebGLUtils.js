/**
 * WebGL Utilities and Extensions
 * Comprehensive WebGL helper functions, extension management, texture utilities,
 * framebuffer management, and performance monitoring for WebGL operations
 */

// ============================================================================
// Constants and Defaults
// ============================================================================

const DEFAULT_WEBGL_ATTRIBUTES = {
    alpha: true,
    antialias: true,
    depth: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: false
};

const DEFAULT_TEXTURE_OPTIONS = {
    wrapS: WebGLRenderingContext.REPEAT,
    wrapT: WebGLRenderingContext.REPEAT,
    minFilter: WebGLRenderingContext.LINEAR_MIPMAP_LINEAR,
    magFilter: WebGLRenderingContext.LINEAR,
    format: WebGLRenderingContext.RGBA,
    type: WebGLRenderingContext.UNSIGNED_BYTE,
    generateMipmaps: true,
    flipY: true
};

const DEFAULT_FRAMEBUFFER_OPTIONS = {
    depth: true,
    stencil: false,
    depthFormat: WebGLRenderingContext.DEPTH_COMPONENT16,
    stencilFormat: WebGLRenderingContext.STENCIL_INDEX8
};

// ============================================================================
// WebGL Context Management
// ============================================================================

/**
 * Create a WebGL context with error checking and fallbacks
 * @param {HTMLCanvasElement} canvas - Canvas element to get context from
 * @param {Object} attributes - WebGL context attributes
 * @param {Array<string>} requiredExtensions - List of required extensions
 * @returns {Object} Object containing context and available extensions
 */
function createWebGLContext(canvas, attributes = {}, requiredExtensions = []) {
    const options = { ...DEFAULT_WEBGL_ATTRIBUTES, ...attributes };
    let context = null;
    let error = null;

    // Try WebGL2 first
    try {
        context = canvas.getContext('webgl2', options);
        if (!context && options.failIfMajorPerformanceCaveat) {
            error = 'Major performance caveat detected';
        }
    } catch (e) {
        error = e.message;
    }

    // Fallback to WebGL1 if WebGL2 not available
    if (!context) {
        try {
            context = canvas.getContext('webgl', options) || canvas.getContext('experimental-webgl', options);
        } catch (e) {
            error = e.message;
        }
    }

    if (!context) {
        throw new Error(`WebGL not supported: ${error || 'No context available'}`);
    }

    // Check required extensions
    const extensions = getContextExtensions(context);
    const missingExtensions = requiredExtensions.filter(ext => !extensions[ext]);

    if (missingExtensions.length > 0) {
        console.warn(`Missing required extensions: ${missingExtensions.join(', ')}`);
    }

    return {
        context,
        version: context instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl',
        extensions,
        isWebGL2: context instanceof WebGL2RenderingContext
    };
}

/**
 * Get all available extensions for a WebGL context
 * @param {WebGLRenderingContext|WebGL2RenderingContext} context - WebGL context
 * @returns {Object} Object mapping extension names to extension objects
 */
function getContextExtensions(context) {
    const extensions = {};
    const extList = context.getSupportedExtensions() || [];

    extList.forEach(extName => {
        extensions[extName] = context.getExtension(extName);
    });

    return extensions;
}

// ============================================================================
// Shader Utilities
// ============================================================================

/**
 * Compile a shader from source
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 * @param {string} source - Shader source code
 * @returns {WebGLShader} Compiled shader
 */
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        const typeStr = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
        throw new Error(`${typeStr} shader compilation failed:\n${info}\nSource:\n${source}`);
    }

    return shader;
}

/**
 * Link shaders into a program
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLShader} vertexShader - Compiled vertex shader
 * @param {WebGLShader} fragmentShader - Compiled fragment shader
 * @returns {WebGLProgram} Linked shader program
 */
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`Shader program linking failed:\n${info}`);
    }

    return program;
}

/**
 * Create a shader program from source strings
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {string} vertexSource - Vertex shader source
 * @param {string} fragmentSource - Fragment shader source
 * @returns {Object} Object containing program and shaders
 */
function createShaderProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = createProgram(gl, vertexShader, fragmentShader);

    return {
        program,
        vertexShader,
        fragmentShader
    };
}

/**
 * Delete shader resources
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {Object} shaderObject - Object containing shaders and program
 */
function deleteShaderProgram(gl, shaderObject) {
    if (shaderObject.program) gl.deleteProgram(shaderObject.program);
    if (shaderObject.vertexShader) gl.deleteShader(shaderObject.vertexShader);
    if (shaderObject.fragmentShader) gl.deleteShader(shaderObject.fragmentShader);
}

// ============================================================================
// Buffer Management
// ============================================================================

/**
 * Create and configure a buffer
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {ArrayBuffer|ArrayBufferView} data - Buffer data
 * @param {number} target - Buffer target (gl.ARRAY_BUFFER, gl.ELEMENT_ARRAY_BUFFER)
 * @param {number} usage - Buffer usage hint (gl.STATIC_DRAW, gl.DYNAMIC_DRAW, etc.)
 * @returns {WebGLBuffer} Created buffer
 */
function createBuffer(gl, data, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);
    return buffer;
}

/**
 * Update buffer data
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLBuffer} buffer - Buffer to update
 * @param {ArrayBuffer|ArrayBufferView} data - New data
 * @param {number} target - Buffer target
 * @param {number} usage - Buffer usage hint
 */
function updateBuffer(gl, buffer, data, target = gl.ARRAY_BUFFER, usage = gl.DYNAMIC_DRAW) {
    gl.bindBuffer(target, buffer);
    gl.bufferSubData(target, 0, data);
}

/**
 * Create a vertex array object (VAO) for WebGL2
 * @param {WebGLRenderingContext} gl - WebGL context (must be WebGL2)
 * @param {Array} attributes - Array of attribute configurations
 * @returns {WebGLVertexArrayObject} Created VAO
 */
function createVertexArray(gl, attributes) {
    if (!gl.createVertexArray) {
        throw new Error('Vertex Array Objects require WebGL2');
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    attributes.forEach(attr => {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.enableVertexAttribArray(attr.location);
        gl.vertexAttribPointer(
            attr.location,
            attr.size,
            attr.type || gl.FLOAT,
            attr.normalized || false,
            attr.stride || 0,
            attr.offset || 0
        );
        
        if (attr.divisor !== undefined) {
            gl.vertexAttribDivisor(attr.location, attr.divisor);
        }
    });

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return vao;
}

// ============================================================================
// Texture Utilities
// ============================================================================

/**
 * Create and configure a 2D texture
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {HTMLImageElement|ImageData|ArrayBufferView} source - Texture source
 * @param {Object} options - Texture options
 * @returns {WebGLTexture} Created texture
 */
function createTexture2D(gl, source, options = {}) {
    const texture = gl.createTexture();
    const opts = { ...DEFAULT_TEXTURE_OPTIONS, ...options };

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Handle different source types
    if (source instanceof HTMLImageElement) {
        if (opts.flipY !== false) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, opts.format, opts.format, opts.type, source);
    } else if (source instanceof ImageData) {
        if (opts.flipY !== false) {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, opts.format, opts.format, opts.type, source);
    } else if (source instanceof ArrayBufferView) {
        gl.texImage2D(gl.TEXTURE_2D, 0, opts.format, opts.width, opts.height, 0, opts.format, opts.type, source);
    } else {
        // Create empty texture
        gl.texImage2D(gl.TEXTURE_2D, 0, opts.format, opts.width, opts.height, 0, opts.format, opts.type, null);
    }

    // Set wrapping parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opts.wrapS);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opts.wrapT);

    // Set filtering parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opts.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, opts.magFilter);

    // Generate mipmaps if requested
    if (opts.generateMipmaps) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}

/**
 * Create and configure a cube map texture
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {Object} faces - Object mapping face constants to sources
 * @param {Object} options - Texture options
 * @returns {WebGLTexture} Created cube map texture
 */
function createTextureCube(gl, faces, options = {}) {
    const texture = gl.createTexture();
    const opts = { ...DEFAULT_TEXTURE_OPTIONS, ...options };

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

    // Set wrapping parameters
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, opts.wrapS);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, opts.wrapT);

    // Set filtering parameters
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, opts.minFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, opts.magFilter);

    // Upload faces
    Object.keys(faces).forEach(face => {
        gl.texImage2D(
            parseInt(face),
            0,
            opts.format,
            opts.format,
            opts.type,
            faces[face]
        );
    });

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    return texture;
}

/**
 * Update texture from image source
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLTexture} texture - Texture to update
 * @param {HTMLImageElement|ImageData} source - Image source
 * @param {Object} options - Update options
 */
function updateTextureFromImage(gl, texture, source, options = {}) {
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (options.flipY !== false) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, options.format || WebGLRenderingContext.RGBA, 
                  options.format || WebGLRenderingContext.RGBA, 
                  options.type || WebGLRenderingContext.UNSIGNED_BYTE, 
                  source);

    if (options.generateMipmaps) {
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * Set texture parameters
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLTexture} texture - Texture to configure
 * @param {number} target - Texture target
 * @param {Object} parameters - Texture parameters
 */
function setTextureParameters(gl, texture, target, parameters) {
    gl.bindTexture(target, texture);

    Object.keys(parameters).forEach(param => {
        gl.texParameteri(target, param, parameters[param]);
    });

    gl.bindTexture(target, null);
}

// ============================================================================
// Framebuffer Management
// ============================================================================

/**
 * Create a framebuffer with optional color and depth attachments
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} width - Framebuffer width
 * @param {number} height - Framebuffer height
 * @param {Object} options - Framebuffer options
 * @returns {Object} Object containing framebuffer and attachments
 */
function createFramebuffer(gl, width, height, options = {}) {
    const opts = { ...DEFAULT_FRAMEBUFFER_OPTIONS, ...options };
    const framebuffer = gl.createFramebuffer();
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    const attachments = {};

    // Create color texture attachment if requested
    if (opts.color !== false) {
        attachments.color = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, attachments.color);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, attachments.color, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // Create depth attachment if requested
    if (opts.depth) {
        attachments.depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, attachments.depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, opts.depthFormat, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, attachments.depth);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    // Create stencil attachment if requested
    if (opts.stencil) {
        attachments.stencil = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, attachments.stencil);
        gl.renderbufferStorage(gl.RENDERBUFFER, opts.stencilFormat, width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, attachments.stencil);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    // Check framebuffer completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        const error = getFramebufferErrorMessage(status);
        throw new Error(`Framebuffer creation failed: ${error}`);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        framebuffer,
        width,
        height,
        attachments,
        isComplete: true
    };
}

/**
 * Get human-readable framebuffer error message
 * @param {number} status - Framebuffer status code
 * @returns {string} Error message
 */
function getFramebufferErrorMessage(status) {
    switch (status) {
        case WebGLRenderingContext.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
            return 'Incomplete attachment';
        case WebGLRenderingContext.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
            return 'Incomplete dimensions';
        case WebGLRenderingContext.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
            return 'Missing attachment';
        case WebGLRenderingContext.FRAMEBUFFER_UNSUPPORTED:
            return 'Unsupported framebuffer configuration';
        default:
            return `Unknown error (status: ${status})`;
    }
}

/**
 * Bind framebuffer for rendering
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {Object} framebufferObject - Framebuffer object from createFramebuffer
 */
function bindFramebuffer(gl, framebufferObject) {
    if (framebufferObject) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferObject.framebuffer);
        gl.viewport(0, 0, framebufferObject.width, framebufferObject.height);
    } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

/**
 * Delete framebuffer and all attachments
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {Object} framebufferObject - Framebuffer object to delete
 */
function deleteFramebuffer(gl, framebufferObject) {
    if (!framebufferObject) return;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (framebufferObject.attachments.color) {
        gl.deleteTexture(framebufferObject.attachments.color);
    }
    if (framebufferObject.attachments.depth) {
        gl.deleteRenderbuffer(framebufferObject.attachments.depth);
    }
    if (framebufferObject.attachments.stencil) {
        gl.deleteRenderbuffer(framebufferObject.attachments.stencil);
    }

    gl.deleteFramebuffer(framebufferObject.framebuffer);
}

// ============================================================================
// Extension Management
// ============================================================================

/**
 * Extension manager class for handling WebGL extensions
 */
class ExtensionManager {
    constructor(gl, extensions) {
        this.gl = gl;
        this.extensions = extensions || {};
        this.requiredExtensions = new Set();
        this.optionalExtensions = new Set();
    }

    /**
     * Check if an extension is available
     * @param {string} name - Extension name
     * @returns {boolean} True if extension is available
     */
    has(name) {
        return !!this.extensions[name];
    }

    /**
     * Get an extension object
     * @param {string} name - Extension name
     * @returns {Object|null} Extension object or null if not available
     */
    get(name) {
        return this.extensions[name] || null;
    }

    /**
     * Require an extension (will throw if not available)
     * @param {string} name - Extension name
     * @returns {Object} Extension object
     */
    require(name) {
        this.requiredExtensions.add(name);
        
        if (!this.has(name)) {
            throw new Error(`Required extension '${name}' is not available`);
        }
        
        return this.get(name);
    }

    /**
     * Optionally use an extension (won't throw if not available)
     * @param {string} name - Extension name
     * @param {Function} callback - Callback to execute with extension
     * @returns {any} Callback result or null
     */
    optional(name, callback) {
        this.optionalExtensions.add(name);
        
        if (this.has(name)) {
            return callback(this.get(name));
        }
        
        return null;
    }

    /**
     * Get all available extensions
     * @returns {Array<string>} List of available extension names
     */
    getAvailableExtensions() {
        return Object.keys(this.extensions);
    }

    /**
     * Get information about required extensions
     * @returns {Object} Extension information
     */
    getExtensionInfo() {
        const missing = [];
        const available = [];

        this.requiredExtensions.forEach(name => {
            if (this.has(name)) {
                available.push(name);
            } else {
                missing.push(name);
            }
        });

        this.optionalExtensions.forEach(name => {
            if (this.has(name)) {
                available.push(name);
            }
        });

        return {
            required: Array.from(this.requiredExtensions),
            optional: Array.from(this.optionalExtensions),
            available,
            missing,
            allAvailable: missing.length === 0
        };
    }
}

// ============================================================================
// Performance Monitoring for WebGL
// ============================================================================

/**
 * WebGL performance profiler for tracking operations
 */
class WebGLPerformanceProfiler {
    constructor(gl) {
        this.gl = gl;
        this.profiles = new Map();
        this.frameCount = 0;
        this.fps = 0;
        this.lastFrameTime = performance.now();
        this.frameTimeHistory = [];
        this.maxFrameHistory = 60;
    }

    /**
     * Start timing a WebGL operation
     * @param {string} name - Operation name
     */
    startOperation(name) {
        const timer = this.profiles.get(name) || {
            calls: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
            avgTime: 0,
            lastStartTime: 0
        };
        
        timer.lastStartTime = performance.now();
        this.profiles.set(name, timer);
    }

    /**
     * End timing a WebGL operation
     * @param {string} name - Operation name
     * @returns {number} Operation duration in milliseconds
     */
    endOperation(name) {
        const timer = this.profiles.get(name);
        if (!timer || !timer.lastStartTime) return 0;

        const duration = performance.now() - timer.lastStartTime;
        timer.lastStartTime = 0;
        timer.calls++;
        timer.totalTime += duration;
        timer.minTime = Math.min(timer.minTime, duration);
        timer.maxTime = Math.max(timer.maxTime, duration);
        timer.avgTime = timer.totalTime / timer.calls;

        this.profiles.set(name, timer);
        return duration;
    }

    /**
     * Profile a WebGL operation
     * @param {string} name - Operation name
     * @param {Function} operation - Operation function
     * @returns {any} Operation result
     */
    profileOperation(name, operation) {
        this.startOperation(name);
        try {
            const result = operation();
            this.endOperation(name);
            return result;
        } catch (error) {
            this.endOperation(name);
            throw error;
        }
    }

    /**
     * Mark the start of a frame
     */
    startFrame() {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update FPS calculation
        this.frameTimeHistory.push(deltaTime);
        if (this.frameTimeHistory.length > this.maxFrameHistory) {
            this.frameTimeHistory.shift();
        }

        const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
        this.fps = 1000 / avgFrameTime;
    }

    /**
     * Mark the end of a frame
     */
    endFrame() {
        // Frame ended, ready for next frame
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Get all operation profiles
     * @returns {Object} All operation profiles
     */
    getOperationProfiles() {
        const result = {};
        this.profiles.forEach((profile, name) => {
            result[name] = { ...profile };
            delete result[name].lastStartTime; // Remove internal field
        });
        return result;
    }

    /**
     * Get a specific operation profile
     * @param {string} name - Operation name
     * @returns {Object|undefined} Operation profile
     */
    getOperationProfile(name) {
        const profile = this.profiles.get(name);
        if (!profile) return undefined;
        
        const result = { ...profile };
        delete result.lastStartTime;
        return result;
    }

    /**
     * Get frame statistics
     * @returns {Object} Frame statistics
     */
    getFrameStats() {
        return {
            frameCount: this.frameCount,
            fps: this.fps,
            avgFrameTime: this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length,
            minFrameTime: Math.min(...this.frameTimeHistory),
            maxFrameTime: Math.max(...this.frameTimeHistory)
        };
    }

    /**
     * Clear all profiles
     */
    clearProfiles() {
        this.profiles.clear();
        this.frameTimeHistory = [];
        this.frameCount = 0;
        this.fps = 0;
    }

    /**
     * Get comprehensive performance report
     * @returns {Object} Performance report
     */
    getReport() {
        return {
            operations: this.getOperationProfiles(),
            frame: this.getFrameStats(),
            timestamp: Date.now()
        };
    }
}

/**
 * WebGL resource tracker for monitoring memory usage
 */
class WebGLResourceTracker {
    constructor(gl) {
        this.gl = gl;
        this.resources = {
            buffers: new Map(),
            textures: new Map(),
            framebuffers: new Map(),
            renderbuffers: new Map(),
            shaders: new Map(),
            programs: new Map()
        };
        this.totalBytes = 0;
    }

    /**
     * Track a buffer resource
     * @param {string} id - Resource identifier
     * @param {WebGLBuffer} buffer - Buffer object
     * @param {number} byteLength - Buffer size in bytes
     */
    trackBuffer(id, buffer, byteLength) {
        this.resources.buffers.set(id, { object: buffer, size: byteLength });
        this.totalBytes += byteLength;
    }

    /**
     * Track a texture resource
     * @param {string} id - Resource identifier
     * @param {WebGLTexture} texture - Texture object
     * @param {number} byteLength - Estimated texture size in bytes
     */
    trackTexture(id, texture, byteLength) {
        this.resources.textures.set(id, { object: texture, size: byteLength });
        this.totalBytes += byteLength;
    }

    /**
     * Track a framebuffer resource
     * @param {string} id - Resource identifier
     * @param {Object} framebufferObject - Framebuffer object with attachments
     */
    trackFramebuffer(id, framebufferObject) {
        this.resources.framebuffers.set(id, { object: framebufferObject });
    }

    /**
     * Untrack a resource
     * @param {string} type - Resource type
     * @param {string} id - Resource identifier
     */
    untrackResource(type, id) {
        const resourceMap = this.resources[type];
        if (!resourceMap) return;

        const resource = resourceMap.get(id);
        if (resource && resource.size) {
            this.totalBytes -= resource.size;
        }
        resourceMap.delete(id);
    }

    /**
     * Get total GPU memory usage (estimated)
     * @returns {number} Total bytes allocated
     */
    getTotalMemoryUsage() {
        return this.totalBytes;
    }

    /**
     * Get resource statistics
     * @returns {Object} Resource statistics
     */
    getResourceStats() {
        return {
            buffers: this.resources.buffers.size,
            textures: this.resources.textures.size,
            framebuffers: this.resources.framebuffers.size,
            renderbuffers: this.resources.renderbuffers.size,
            shaders: this.resources.shaders.size,
            programs: this.resources.programs.size,
            totalBytes: this.totalBytes
        };
    }

    /**
     * Get all tracked resources
     * @returns {Object} All tracked resources
     */
    getTrackedResources() {
        const result = {};
        Object.keys(this.resources).forEach(type => {
            result[type] = Array.from(this.resources[type].keys());
        });
        return result;
    }

    /**
     * Clear all tracked resources
     */
    clear() {
        Object.keys(this.resources).forEach(type => {
            this.resources[type].clear();
        });
        this.totalBytes = 0;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a WebGL context is valid
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {boolean} True if context is valid
 */
function isValidContext(gl) {
    return gl && typeof gl.getParameter === 'function';
}

/**
 * Get WebGL context information
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {Object} Context information
 */
function getContextInfo(gl) {
    if (!isValidContext(gl)) {
        throw new Error('Invalid WebGL context');
    }

    return {
        version: gl instanceof WebGL2RenderingContext ? 'WebGL2' : 'WebGL1',
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxFragmentTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        antialias: gl.getContextAttributes().antialias,
        extensions: getContextExtensions(gl)
    };
}

/**
 * Log WebGL information for debugging
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {boolean} verbose - Include extension list
 */
function logContextInfo(gl, verbose = false) {
    const info = getContextInfo(gl);
    
    console.group('WebGL Context Information');
    console.log('Version:', info.version);
    console.log('Vendor:', info.vendor);
    console.log('Renderer:', info.renderer);
    console.log('Shading Language:', info.shadingLanguageVersion);
    console.log('Max Texture Size:', info.maxTextureSize);
    console.log('Max Vertex Attributes:', info.maxVertexAttribs);
    console.log('Max Texture Units:', info.maxFragmentTextureUnits);
    console.log('Antialias:', info.antialias);
    
    if (verbose) {
        console.log('Extensions:', Object.keys(info.extensions));
    }
    console.groupEnd();
}

/**
 * Check for common WebGL errors
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {string|null} Error message or null if no errors
 */
function checkGLError(gl) {
    const error = gl.getError();
    
    switch (error) {
        case gl.NO_ERROR:
            return null;
        case gl.INVALID_ENUM:
            return 'Invalid enum';
        case gl.INVALID_VALUE:
            return 'Invalid value';
        case gl.INVALID_OPERATION:
            return 'Invalid operation';
        case gl.INVALID_FRAMEBUFFER_OPERATION:
            return 'Invalid framebuffer operation';
        case gl.OUT_OF_MEMORY:
            return 'Out of memory';
        case gl.CONTEXT_LOST_WEBGL:
            return 'Context lost';
        default:
            return `Unknown error (${error})`;
    }
}

/**
 * Enable or disable depth testing
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {boolean} enabled - Enable depth testing
 * @param {number} function - Depth test function (default gl.LEQUAL)
 */
function setDepthTest(gl, enabled, func = gl.LEQUAL) {
    if (enabled) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(func);
    } else {
        gl.disable(gl.DEPTH_TEST);
    }
}

/**
 * Enable or disable blending
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} srcFactor - Source blending factor (default gl.SRC_ALPHA)
 * @param {number} dstFactor - Destination blending factor (default gl.ONE_MINUS_SRC_ALPHA)
 */
function setBlending(gl, enabled = true, srcFactor = gl.SRC_ALPHA, dstFactor = gl.ONE_MINUS_SRC_ALPHA) {
    if (enabled) {
        gl.enable(gl.BLEND);
        gl.blendFunc(srcFactor, dstFactor);
    } else {
        gl.disable(gl.BLEND);
    }
}

/**
 * Clear color and depth buffers
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number[]} color - Clear color [r, g, b, a]
 * @param {number} depth - Clear depth value
 */
function clearBuffers(gl, color = [0, 0, 0, 0], depth = 1) {
    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clearDepth(depth);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// ============================================================================
// Export all utilities
// ============================================================================

export {
    // Context management
    createWebGLContext,
    getContextExtensions,
    
    // Shader utilities
    compileShader,
    createProgram,
    createShaderProgram,
    deleteShaderProgram,
    
    // Buffer management
    createBuffer,
    updateBuffer,
    createVertexArray,
    
    // Texture utilities
    createTexture2D,
    createTextureCube,
    updateTextureFromImage,
    setTextureParameters,
    
    // Framebuffer management
    createFramebuffer,
    bindFramebuffer,
    deleteFramebuffer,
    getFramebufferErrorMessage,
    
    // Extension management
    ExtensionManager,
    
    // Performance monitoring
    WebGLPerformanceProfiler,
    WebGLResourceTracker,
    
    // Utility functions
    isValidContext,
    getContextInfo,
    logContextInfo,
    checkGLError,
    setDepthTest,
    setBlending,
    clearBuffers,
    
    // Constants
    DEFAULT_WEBGL_ATTRIBUTES,
    DEFAULT_TEXTURE_OPTIONS,
    DEFAULT_FRAMEBUFFER_OPTIONS
};

// Default export removed for UMD compatibility
// Use named exports instead
