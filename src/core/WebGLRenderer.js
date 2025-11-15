/**
 * WebGLRenderer - Comprehensive WebGL renderer with context management
 * Handles WebGL context creation, shader compilation, rendering pipeline,
 * error handling, context loss recovery, and optimization features
 */

import { Scene } from './Scene.js';
import { Object3D } from './Object3D.js';

export class WebGLRenderer {
    constructor(canvas, options = {}) {
        // Handle Three.js-style constructor: new WebGLRenderer({ canvas, ...options })
        if (canvas && typeof canvas === 'object' && canvas.canvas && !canvas.getContext) {
            options = { ...canvas, ...options };
            canvas = canvas.canvas;
        }
        
        this.canvas = canvas;
        this.options = {
            antialias: true,
            alpha: false,
            depth: true,
            stencil: false,
            powerPreference: 'high-performance',
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
            ...options
        };

        // WebGL context
        this.context = null;
        this.gl = null;
        this.isContextLost = false;

        // Context info
        this.capabilities = {};
        this.maxTextureSize = 0;
        this.maxVertexAttribs = 0;
        this.version = '';
        this.vendor = '';
        this.renderer = '';

        // Render settings
        this.setPixelRatio = true;
        this.autoClear = true;
        this.autoClearColor = true;
        this.autoClearDepth = true;
        this.autoClearStencil = true;
        this.clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
        this.clearDepth = 1.0;
        this.clearStencil = 0;

        // Optimization flags
        this.enableDistanceCulling = true;
        this.enableFrustumCulling = true;
        this.enableOcclusionCulling = false;
        this.maxDistance = 1000;
        this.lodBias = 0;
        this.shadowMapEnabled = false;

        // Performance monitoring
        this.performance = {
            frameTime: 0,
            renderTime: 0,
            drawCalls: 0,
            triangles: 0,
            vertices: 0,
            lastFrameTime: 0,
            fps: 60,
            memoryUsage: 0
        };

        // Resources
        this.shaders = new Map();
        this.programs = new Map();
        this.buffers = new Map();
        this.textures = new Map();
        this.framebuffers = new Map();

        // Error handling
        this.errors = [];
        this.warnings = [];
        this.debugMode = false;

        // Initialize
        this.init();
    }

    /**
     * Initialize WebGL context and renderer
     */
    init() {
        try {
            this.createContext();
            this.setupCapabilities();
            this.setupEventListeners();
            this.setupDefaultState();
            this.initShaderSystem();
            
            console.log('WebGLRenderer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize WebGLRenderer:', error);
            throw error;
        }
    }

    /**
     * Create WebGL context with fallback support
     */
    createContext() {
        const contextOptions = {
            antialias: this.options.antialias,
            alpha: this.options.alpha,
            depth: this.options.depth,
            stencil: this.options.stencil,
            powerPreference: this.options.powerPreference,
            failIfMajorPerformanceCaveat: this.options.failIfMajorPerformanceCaveat,
            preserveDrawingBuffer: this.options.preserveDrawingBuffer
        };

        // Try WebGL2 first, then fallback to WebGL1
        let gl = null;
        let contextType = '';

        try {
            gl = this.canvas.getContext('webgl2', contextOptions);
            if (gl) {
                contextType = 'webgl2';
            }
        } catch (e) {
            console.warn('WebGL2 not available, trying WebGL1');
        }

        if (!gl) {
            try {
                gl = this.canvas.getContext('webgl', contextOptions);
                if (gl) {
                    contextType = 'webgl';
                }
            } catch (e) {
                console.warn('WebGL not available, trying experimental');
            }
        }

        if (!gl) {
            try {
                gl = this.canvas.getContext('experimental-webgl', contextOptions);
                if (gl) {
                    contextType = 'experimental-webgl';
                }
            } catch (e) {
                // Provide helpful error message
                const errorMessage = 'WebGL is not supported in this browser. ' +
                    'Please use a modern browser with WebGL support, or enable hardware acceleration.';
                console.error(errorMessage);
                throw new Error(errorMessage);
            }
        }

        this.context = gl;
        this.gl = gl;
        this.contextType = contextType;

        if (!this.gl) {
            throw new Error('Failed to create WebGL context');
        }

        console.log(`Created ${contextType} context successfully`);
    }

    /**
     * Setup WebGL capabilities and limitations
     */
    setupCapabilities() {
        const gl = this.gl;

        // Basic info
        this.version = gl.getParameter(gl.VERSION);
        this.vendor = gl.getParameter(gl.VENDOR);
        this.renderer = gl.getParameter(gl.RENDERER);

        // Extensions
        this.capabilities = {
            depthTexture: !!gl.getExtension('WEBGL_depth_texture'),
            floatTextures: !!gl.getExtension('OES_texture_float'),
            halfFloatTextures: !!gl.getExtension('OES_texture_half_float'),
            vertexArrayObjects: !!gl.getExtension('OES_vertex_array_object'),
            instancedArrays: !!gl.getExtension('ANGLE_instanced_arrays'),
            occlusionQueries: !!gl.getExtension('OES_occlusion_query'),
            transformFeedback: !!gl.getExtension('EXT_transform_feedback'),
            shaderDerivatives: !!gl.getExtension('OES_standard_derivatives'),
            textureFloatLinear: !!gl.getExtension('OES_texture_float_linear'),
            textureHalfFloatLinear: !!gl.getExtension('OES_texture_half_float_linear'),
            s3tc: !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
            etc1: !!gl.getExtension('WEBGL_compressed_texture_etc1'),
            pvrtc: !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
            astc: !!gl.getExtension('WEBGL_compressed_texture_astc')
        };

        // Limits
        this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        this.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        this.maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
        this.maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
        this.maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
        this.maxCombinedTextureImageUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

        // Features
        this.features = {
            instancing: this.capabilities.instancedArrays && this.capabilities.vertexArrayObjects,
            occlusionQuery: this.capabilities.occlusionQueries,
            transformFeedback: this.capabilities.transformFeedback,
            depthTexture: this.capabilities.depthTexture,
            floatTextures: this.capabilities.floatTextures,
            halfFloatTextures: this.capabilities.halfFloatTextures
        };

        console.log('WebGL Capabilities:', {
            version: this.version,
            vendor: this.vendor,
            renderer: this.renderer,
            maxTextureSize: this.maxTextureSize,
            maxVertexAttribs: this.maxVertexAttribs,
            features: this.features
        });
    }

    /**
     * Setup WebGL default state
     */
    setupDefaultState() {
        const gl = this.gl;

        // Clear color and depth
        gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, this.clearColor.a);
        gl.clearDepth(this.clearDepth);
        gl.clearStencil(this.clearStencil);

        // Enable depth testing
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Disable culling by default (enable per-material as needed)
        gl.disable(gl.CULL_FACE);

        // Enable blend mode
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Set viewport
        this.setSize(this.canvas.width, this.canvas.height);
    }

    /**
     * Initialize shader system
     */
    initShaderSystem() {
        // Default shader templates
        this.defaultShaders = {
            basic: {
                vertex: `
                    attribute vec3 position;
                    attribute vec3 normal;
                    attribute vec2 uv;
                    
                    uniform mat4 modelMatrix;
                    uniform mat4 viewMatrix;
                    uniform mat4 projectionMatrix;
                    uniform mat3 normalMatrix;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    varying vec2 vUV;
                    
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vPosition = worldPosition.xyz;
                        vNormal = normalize(normalMatrix * normal);
                        vUV = uv;
                        gl_Position = projectionMatrix * viewMatrix * worldPosition;
                    }
                `,
                fragment: `
                    precision mediump float;
                    
                    varying vec3 vNormal;
                    varying vec3 vPosition;
                    varying vec2 vUV;
                    
                    uniform vec3 baseColor;
                    uniform float opacity;
                    uniform vec3 lightDirection;
                    uniform vec3 ambientColor;
                    
                    void main() {
                        vec3 normal = normalize(vNormal);
                        vec3 lightDir = normalize(-lightDirection);
                        
                        float diffuse = max(dot(normal, lightDir), 0.0);
                        vec3 color = baseColor * (ambientColor + diffuse);
                        
                        gl_FragColor = vec4(color, opacity);
                    }
                `
            },
            unlit: {
                vertex: `
                    attribute vec3 position;
                    attribute vec2 uv;
                    
                    uniform mat4 modelMatrix;
                    uniform mat4 viewMatrix;
                    uniform mat4 projectionMatrix;
                    
                    varying vec2 vUV;
                    
                    void main() {
                        vUV = uv;
                        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
                    }
                `,
                fragment: `
                    precision mediump float;
                    
                    varying vec2 vUV;
                    uniform sampler2D texture;
                    uniform vec3 baseColor;
                    uniform float opacity;
                    
                    void main() {
                        vec4 texColor = texture2D(texture, vUV);
                        vec4 color = texColor * vec4(baseColor, opacity);
                        gl_FragColor = color;
                    }
                `
            }
        };
    }

    /**
     * Setup event listeners for context loss/restoration
     */
    setupEventListeners() {
        this.canvas.addEventListener('webglcontextlost', this.onContextLost.bind(this), false);
        this.canvas.addEventListener('webglcontextrestored', this.onContextRestored.bind(this), false);

        // Handle device pixel ratio changes
        if (this.setPixelRatio) {
            this.updatePixelRatio();
        }
    }

    /**
     * Handle WebGL context loss
     */
    onContextLost(event) {
        event.preventDefault();
        console.warn('WebGL context lost');
        this.isContextLost = true;
        
        // Cleanup resources
        this.disposeResources();
        
        // Emit context lost event
        this.emit('contextlost', { context: this.context });
    }

    /**
     * Handle WebGL context restoration
     */
    onContextRestored() {
        console.log('WebGL context restored');
        this.isContextLost = false;
        
        try {
            // Recreate context and resources
            this.init();
            
            // Emit context restored event
            this.emit('contextrestored', { context: this.context });
        } catch (error) {
            console.error('Failed to restore WebGL context:', error);
            this.emit('error', { error });
        }
    }

    /**
     * Update device pixel ratio
     */
    updatePixelRatio() {
        if (this.setPixelRatio) {
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Limit to 2x for performance
            if (pixelRatio !== this.pixelRatio) {
                this.pixelRatio = pixelRatio;
                this.setSize(this.canvas.width, this.canvas.height);
            }
        }
    }

    /**
     * Set canvas size and viewport
     */
    setSize(width, height) {
        // Handle device pixel ratio
        const displayWidth = Math.floor(width * (this.pixelRatio || 1));
        const displayHeight = Math.floor(height * (this.pixelRatio || 1));

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';

            if (this.gl && !this.isContextLost) {
                this.gl.viewport(0, 0, displayWidth, displayHeight);
            }
        }
    }

    /**
     * Compile shader from source code
     */
    compileShader(vertexSource, fragmentSource, attributes = {}, uniforms = {}) {
        const gl = this.gl;
        
        if (this.isContextLost) {
            this.handleContextLostError();
            return null;
        }

        try {
            // Create shader program
            const program = gl.createProgram();
            if (!program) {
                throw new Error('Failed to create shader program');
            }

            // Create vertex shader
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            if (!vertexShader) {
                throw new Error('Failed to create vertex shader');
            }

            gl.shaderSource(vertexShader, vertexSource);
            gl.compileShader(vertexShader);

            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                const error = gl.getShaderInfoLog(vertexShader);
                gl.deleteShader(vertexShader);
                gl.deleteProgram(program);
                throw new Error('Vertex shader compilation failed: ' + error);
            }

            // Create fragment shader
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            if (!fragmentShader) {
                gl.deleteShader(vertexShader);
                gl.deleteProgram(program);
                throw new Error('Failed to create fragment shader');
            }

            gl.shaderSource(fragmentShader, fragmentSource);
            gl.compileShader(fragmentShader);

            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                const error = gl.getShaderInfoLog(fragmentShader);
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                gl.deleteProgram(program);
                throw new Error('Fragment shader compilation failed: ' + error);
            }

            // Link program
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);

            // Bind attributes
            Object.entries(attributes).forEach(([name, location]) => {
                gl.bindAttribLocation(program, location, name);
            });

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                const error = gl.getProgramInfoLog(program);
                gl.deleteShader(vertexShader);
                gl.deleteShader(fragmentShader);
                gl.deleteProgram(program);
                throw new Error('Shader program linking failed: ' + error);
            }

            // Get uniform locations
            const uniformLocations = {};
            const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                const uniformInfo = gl.getActiveUniform(program, i);
                const location = gl.getUniformLocation(program, uniformInfo.name);
                uniformLocations[uniformInfo.name] = location;
            }

            // Store program
            const programId = this.generateId();
            this.programs.set(programId, {
                program,
                vertexShader,
                fragmentShader,
                uniforms: uniformLocations,
                attributes
            });

            // Cleanup shaders (program keeps references)
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);

            console.log('Shader compiled successfully');
            return programId;

        } catch (error) {
            console.error('Shader compilation failed:', error);
            this.handleError(error);
            return null;
        }
    }

    /**
     * Create vertex buffer
     */
    createBuffer(data, target = null, usage = 'STATIC_DRAW') {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create buffer');
        }

        const targetType = target || gl.ARRAY_BUFFER;
        const usageType = gl[usage.toUpperCase()] || gl.STATIC_DRAW;

        gl.bindBuffer(targetType, buffer);
        gl.bufferData(targetType, data, usageType);

        // Store buffer info
        const bufferId = this.generateId();
        this.buffers.set(bufferId, {
            buffer,
            target: targetType,
            usage: usageType,
            size: data.length
        });

        return bufferId;
    }

    /**
     * Create texture
     */
    createTexture(data = null, width = 0, height = 0, options = {}) {
        const gl = this.gl;
        const texture = gl.createTexture();
        if (!texture) {
            throw new Error('Failed to create texture');
        }

        const textureOptions = {
            format: gl.RGBA,
            internalFormat: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            minFilter: gl.LINEAR,
            magFilter: gl.LINEAR,
            mipmaps: false,
            ...options
        };

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, textureOptions.wrapS);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, textureOptions.wrapT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, textureOptions.minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, textureOptions.magFilter);

        if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, textureOptions.internalFormat, 
                         textureOptions.format, textureOptions.type, data);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, textureOptions.internalFormat, 
                         width, height, 0, textureOptions.format, textureOptions.type, null);
        }

        if (textureOptions.mipmaps) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        const textureId = this.generateId();
        this.textures.set(textureId, {
            texture,
            width,
            height,
            options: textureOptions
        });

        return textureId;
    }

    /**
     * Render scene
     */
    render(scene, camera) {
        if (this.isContextLost || !this.gl || !scene || !camera) {
            return;
        }

        const startTime = performance.now();
        const gl = this.gl;

        // Update performance metrics
        this.performance.drawCalls = 0;
        this.performance.triangles = 0;
        this.performance.vertices = 0;

        // Auto clear
        if (this.autoClear) {
            this.clear();
        }

        // Set viewport and clear color
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, this.clearColor.a);

        // Update matrices
        camera.updateMatrix();
        scene.traverse(obj => {
            if (obj.active && obj.visible) {
                obj.updateMatrix();
            }
        });

        // Apply frustum culling
        const renderableObjects = this.getRenderableObjects(scene, camera);

        // Sort objects by render order
        const sortedObjects = Array.from(renderableObjects)
            .sort((a, b) => a.renderOrder - b.renderOrder);

        // Render each object
        for (let obj of sortedObjects) {
            this.renderObject(obj, camera, scene);
        }

        // Update performance metrics
        const endTime = performance.now();
        this.performance.renderTime = endTime - startTime;
        this.performance.fps = 1000 / this.performance.renderTime;

        // Emit render event
        this.emit('rendered', { 
            performance: this.performance,
            scene,
            camera
        });
    }

    /**
     * Get renderable objects with culling
     */
    getRenderableObjects(scene, camera) {
        const renderable = [];

        scene.traverse(obj => {
            if (!obj.visible || !obj.active || obj === scene.root) {
                return;
            }

            // Calculate distance for culling and LOD
            let distance = null;
            if (this.enableDistanceCulling || obj.updateLOD) {
                distance = camera.getDistanceTo ? camera.getDistanceTo(obj) : 0;
            }

            // Distance culling
            if (this.enableDistanceCulling && distance !== null) {
                if (distance > this.maxDistance) {
                    return;
                }
            }

            // Frustum culling
            if (this.enableFrustumCulling && !this.isObjectInFrustum(obj, camera)) {
                return;
            }

            // LOD selection
            if (obj.updateLOD && distance !== null) {
                obj.updateLOD(distance, camera);
            }

            renderable.push(obj);
        });

        return renderable;
    }

    /**
     * Check if object is in camera frustum
     */
    isObjectInFrustum(object, camera) {
        const frustum = camera.getFrustum();
        const worldPos = object.getWorldPosition();
        const worldScale = object.getWorldScale();
        const radius = Math.max(worldScale.x, worldScale.y, worldScale.z);

        for (let plane of frustum.planes) {
            const distance = this.distanceToPlane(worldPos, plane);
            if (distance < -radius) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate distance from point to plane
     */
    distanceToPlane(point, plane) {
        return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d;
    }

    /**
     * Render individual object
     */
    renderObject(object, camera, scene) {
        if (!object.render) {
            return;
        }

        try {
            // Mesh.render expects (gl, overrideMaterial)
            // Other objects might have different render signatures
            if (object.render.length === 2) {
                // Store camera and renderer on object temporarily for matrix setup
                object._renderer = this;
                object._camera = camera;
                
                // Mesh-style render: render(gl, overrideMaterial)
                object.render(this.gl, null);
                
                // Clean up
                delete object._renderer;
                delete object._camera;
            } else {
                // Generic render: render(renderer, camera, scene)
                object.render(this, camera, scene);
            }
            this.performance.drawCalls++;
            
            // Update geometry metrics
            if (object.geometry) {
                if (object.geometry.getVertexCount) {
                    this.performance.vertices += object.geometry.getVertexCount() || 0;
                } else if (object.geometry.vertices) {
                    // Fallback: calculate from vertices array
                    this.performance.vertices += (object.geometry.vertices.length / 3) || 0;
                }
                if (object.geometry.getTriangleCount) {
                    this.performance.triangles += object.geometry.getTriangleCount() || 0;
                } else if (object.geometry.indices) {
                    // Fallback: calculate from indices array
                    this.performance.triangles += (object.geometry.indices.length / 3) || 0;
                }
            }
        } catch (error) {
            console.error(`Failed to render object ${object.name || object.id}:`, error);
            this.handleError(error);
        }
    }

    /**
     * Clear rendering buffers
     */
    clear(color = true, depth = true, stencil = true) {
        const gl = this.gl;
        if (!gl || this.isContextLost) {
            return;
        }

        let clearMask = 0;
        if (color && this.autoClearColor) clearMask |= gl.COLOR_BUFFER_BIT;
        if (depth && this.autoClearDepth) clearMask |= gl.DEPTH_BUFFER_BIT;
        if (stencil && this.autoClearStencil) clearMask |= gl.STENCIL_BUFFER_BIT;

        if (clearMask !== 0) {
            gl.clear(clearMask);
        }
    }

    /**
     * Set clear color
     */
    setClearColor(color, alpha = 1.0) {
        this.clearColor = {
            r: color.r || color[0] || 0,
            g: color.g || color[1] || 0,
            b: color.b || color[2] || 0,
            a: alpha
        };

        if (this.gl && !this.isContextLost) {
            this.gl.clearColor(this.clearColor.r, this.clearColor.g, this.clearColor.b, this.clearColor.a);
        }
    }

    /**
     * Get performance metrics
     */
    getPerformance() {
        return { ...this.performance };
    }

    /**
     * Check for WebGL errors
     */
    checkGLError(operation = '') {
        const gl = this.gl;
        if (!gl || this.isContextLost) {
            return;
        }

        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            const errorMsg = this.getGLErrorMessage(error);
            console.error(`WebGL error after ${operation}: ${errorMsg}`);
            this.errors.push({
                operation,
                error,
                message: errorMsg,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get WebGL error message
     */
    getGLErrorMessage(error) {
        const gl = this.gl;
        const errors = {
            [gl.NO_ERROR]: 'No error',
            [gl.INVALID_ENUM]: 'Invalid enum',
            [gl.INVALID_VALUE]: 'Invalid value',
            [gl.INVALID_OPERATION]: 'Invalid operation',
            [gl.INVALID_FRAMEBUFFER_OPERATION]: 'Invalid framebuffer operation',
            [gl.OUT_OF_MEMORY]: 'Out of memory',
            [gl.CONTEXT_LOST_WEBGL]: 'Context lost'
        };
        return errors[error] || 'Unknown error';
    }

    /**
     * Handle WebGL errors
     */
    handleError(error) {
        this.errors.push({
            error: error.message || error,
            stack: error.stack,
            timestamp: Date.now()
        });

        if (this.debugMode) {
            console.error('WebGL Renderer Error:', error);
        }

        this.emit('error', { error });
    }

    /**
     * Handle context lost error
     */
    handleContextLostError() {
        const error = new Error('WebGL context is lost');
        this.handleError(error);
    }

    /**
     * Dispose resources
     */
    disposeResources() {
        // Delete all WebGL resources
        this.programs.forEach((data, id) => {
            if (data.program) this.gl.deleteProgram(data.program);
        });

        this.buffers.forEach((data, id) => {
            if (data.buffer) this.gl.deleteBuffer(data.buffer);
        });

        this.textures.forEach((data, id) => {
            if (data.texture) this.gl.deleteTexture(data.texture);
        });

        this.framebuffers.forEach((data, id) => {
            if (data.framebuffer) this.gl.deleteFramebuffer(data.framebuffer);
        });

        // Clear resource maps
        this.programs.clear();
        this.buffers.clear();
        this.textures.clear();
        this.framebuffers.clear();
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'r_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Enable/disable features
     */
    enable(name, value = true) {
        switch (name) {
            case 'distance_culling':
                this.enableDistanceCulling = value;
                break;
            case 'frustum_culling':
                this.enableFrustumCulling = value;
                break;
            case 'occlusion_culling':
                this.enableOcclusionCulling = value;
                break;
            case 'pixel_ratio':
                this.setPixelRatio = value;
                if (value) this.updatePixelRatio();
                break;
        }
    }

    /**
     * Get WebGL context
     */
    getContext() {
        return this.gl;
    }

    /**
     * Get capabilities
     */
    getCapabilities() {
        return { ...this.capabilities };
    }

    /**
     * Get features
     */
    getFeatures() {
        return { ...this.features };
    }

    /**
     * Get errors
     */
    getErrors() {
        return [...this.errors];
    }

    /**
     * Clear errors
     */
    clearErrors() {
        this.errors = [];
    }

    /**
     * Enable/disable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (enabled) {
            console.log('WebGL debug mode enabled');
        }
    }

    /**
     * Event system
     */
    emit(event, data = {}) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    on(event, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners && this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Resize renderer
     */
    resize(width, height) {
        this.setSize(width, height);
        this.updatePixelRatio();
    }

    /**
     * Dispose renderer and cleanup resources
     */
    dispose() {
        // Remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
            this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
        }

        // Dispose resources
        this.disposeResources();

        // Clear references
        this.canvas = null;
        this.context = null;
        this.gl = null;
        this.eventListeners = null;

        console.log('WebGLRenderer disposed');
    }
}
