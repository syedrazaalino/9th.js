import { Vector3, Color } from '../core/math/index.js';
import { Object3D } from '../core/Object3D.js';

/**
 * GPU-Accelerated Particle System using WebGL compute shaders
 * Capable of handling millions of particles with GPU-side physics simulation
 */
export class GPUParticleSystem extends Object3D {
    constructor(options = {}) {
        super();
        
        // Core properties
        this.maxParticles = options.maxParticles || 1000000;
        this.activeParticles = 0;
        this.particleCount = options.particleCount || 10000;
        
        // WebGL context and shader programs
        this.gl = null;
        this.computeProgram = null;
        this.renderProgram = null;
        
        // GPU buffers
        this.positionBuffer = null;
        this.velocityBuffer = null;
        this.colorBuffer = null;
        this.lifeBuffer = null;
        this.emitBuffer = null;
        
        // Shader uniforms
        this.uniforms = {
            deltaTime: 0,
            time: 0,
            gravity: new Vector3(0, -9.81, 0),
            drag: options.drag || 0.98,
            emitterPosition: new Vector3(),
            emitterVelocity: new Vector3(0, 0, 0),
            emitRate: options.emitRate || 1000,
            maxLife: options.maxLife || 5.0,
            particleSize: options.particleSize || 1.0
        };
        
        // Emitter properties
        this.emissionPosition = options.emissionPosition || new Vector3(0, 0, 0);
        this.emissionRate = options.emitRate || 1000;
        this.particleLifetime = options.maxLife || 5.0;
        this.emissionVelocity = new Vector3(0, 0, 0);
        
        // Rendering
        this.pointSize = options.particleSize || 1.0;
        this.blending = options.blending || 'additive';
        this.color = options.color || new Color(1, 1, 1);
        this.alpha = options.alpha || 1.0;
        
        // Performance
        this.enableCollisions = options.enableCollisions || false;
        this.collisionRadius = options.collisionRadius || 0.1;
        this.worldBounds = options.worldBounds || {
            min: new Vector3(-50, -50, -50),
            max: new Vector3(50, 50, 50)
        };
        
        // Wind and forces
        this.wind = new Vector3(0, 0, 0);
        this.customForces = [];
        
        this._initWebGL();
        this._createShaders();
        this._createBuffers();
        this._initializeParticles();
    }
    
    _initWebGL() {
        const canvas = document.createElement('canvas');
        this.gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: true,
            preserveDrawingBuffer: false
        });
        
        if (!this.gl) {
            throw new Error('WebGL2 not supported');
        }
        
        // Enable required extensions for compute shaders
        const ext = this.gl.getExtension('EXT_color_buffer_float');
        if (!ext) {
            console.warn('EXT_color_buffer_float not supported, falling back to half float');
        }
    }
    
    _createShaders() {
        // Compute shader for particle physics simulation
        const computeShaderSource = `#version 300 es
            layout(local_size_x = 256, local_size_y = 1, local_size_z = 1) in;
            
            // Storage buffers
            layout(std430, binding = 0) buffer PositionBuffer {
                vec4 positions[];
            };
            
            layout(std430, binding = 1) buffer VelocityBuffer {
                vec4 velocities[];
            };
            
            layout(std430, binding = 2) buffer ColorBuffer {
                vec4 colors[];
            };
            
            layout(std430, binding = 3) buffer LifeBuffer {
                float lifetimes[];
            };
            
            layout(std430, binding = 4) buffer EmitBuffer {
                int emitFlags[];
            };
            
            // Uniforms
            uniform float deltaTime;
            uniform float time;
            uniform vec3 gravity;
            uniform float drag;
            uniform vec3 emitterPosition;
            uniform vec3 emitterVelocity;
            uniform int emitRate;
            uniform float maxLife;
            uniform vec3 wind;
            uniform float particleSize;
            
            // Hash function for noise
            uint hash(uint x) {
                x += (x << 10u);
                x ^= (x >> 6u);
                x += (x << 3u);
                x ^= (x >> 11u);
                x += (x << 15u);
                return x;
            }
            
            float random(float seed) {
                return float(hash(uint(seed))) / 4294967295.0;
            }
            
            void main() {
                uint index = gl_GlobalInvocationID.x;
                int i = int(index);
                
                if (i >= positions.length()) {
                    return;
                }
                
                vec4 pos = positions[i];
                vec4 vel = velocities[i];
                float life = lifetimes[i];
                int emitFlag = emitFlags[i];
                
                // Emit new particles
                if (emitFlag == 1) {
                    float seed = float(i) * 0.1234 + time * 0.1;
                    pos.xyz = emitterPosition;
                    
                    // Randomized emission velocity
                    vel.xyz = emitterVelocity;
                    vel.xyz += vec3(
                        random(seed + 1.0) - 0.5,
                        abs(random(seed + 2.0)) * 5.0 + 2.0,
                        random(seed + 3.0) - 0.5
                    ) * 10.0;
                    
                    vel.w = maxLife;
                    life = maxLife;
                    emitFlag = 0;
                }
                
                // Update existing particles
                if (life > 0.0) {
                    // Apply gravity
                    vel.xyz += gravity * deltaTime;
                    
                    // Apply wind
                    vel.xyz += wind * deltaTime;
                    
                    // Apply drag
                    vel.xyz *= drag;
                    
                    // Integrate position
                    pos.xyz += vel.xyz * deltaTime;
                    
                    // Update lifetime
                    life -= deltaTime;
                    
                    // Boundary collision
                    vec3 minBounds = vec3(-50.0, -50.0, -50.0);
                    vec3 maxBounds = vec3(50.0, 50.0, 50.0);
                    
                    if (pos.x < minBounds.x || pos.x > maxBounds.x) {
                        vel.x = -vel.x * 0.8;
                        pos.x = clamp(pos.x, minBounds.x, maxBounds.x);
                    }
                    if (pos.y < minBounds.y || pos.y > maxBounds.y) {
                        vel.y = -vel.y * 0.8;
                        pos.y = clamp(pos.y, minBounds.y, maxBounds.y);
                    }
                    if (pos.z < minBounds.z || pos.z > maxBounds.z) {
                        vel.z = -vel.z * 0.8;
                        pos.z = clamp(pos.z, minBounds.z, maxBounds.z);
                    }
                    
                    // Update color based on age and velocity
                    float speed = length(vel.xyz);
                    vec3 baseColor = vec3(1.0, 0.8, 0.4);
                    vec3 speedColor = vec3(0.2, 0.6, 1.0);
                    float colorMix = clamp(speed / 20.0, 0.0, 1.0);
                    
                    vec3 color = mix(baseColor, speedColor, colorMix);
                    float alpha = life / maxLife;
                    
                    colors[i] = vec4(color, alpha);
                    
                    // Emit particle based on lifetime
                    if (life <= 0.0) {
                        emitFlag = 1;
                    }
                }
                
                // Write back to buffers
                positions[i] = pos;
                velocities[i] = vel;
                lifetimes[i] = life;
                emitFlags[i] = emitFlag;
            }
        `;
        
        // Render shader for particle visualization
        const vertexShaderSource = `#version 300 es
            in vec3 aPosition;
            in vec4 aColor;
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            uniform float pointSize;
            out vec4 vColor;
            
            void main() {
                vec4 viewPosition = viewMatrix * vec4(aPosition, 1.0);
                gl_Position = projectionMatrix * viewPosition;
                gl_PointSize = pointSize * (1.0 / -viewPosition.z);
                vColor = aColor;
            }
        `;
        
        const fragmentShaderSource = `#version 300 es
            precision mediump float;
            in vec4 vColor;
            uniform sampler2D particleTexture;
            out vec4 fragColor;
            
            void main() {
                // Create circular particle using gl_PointCoord
                vec2 uv = gl_PointCoord * 2.0 - 1.0;
                float dist = length(uv);
                
                if (dist > 1.0) {
                    discard;
                }
                
                // Soft particle edge
                float alpha = 1.0 - smoothstep(0.7, 1.0, dist);
                vec4 color = vec4(vColor.rgb, vColor.a * alpha);
                
                fragColor = color;
            }
        `;
        
        this.computeProgram = this._createComputeProgram(computeShaderSource);
        this.renderProgram = this._createRenderProgram(vertexShaderSource, fragmentShaderSource);
    }
    
    _createComputeProgram(computeSource) {
        const gl = this.gl;
        const computeShader = gl.createShader(gl.COMPUTE_SHADER);
        
        gl.shaderSource(computeShader, computeSource);
        gl.compileShader(computeShader);
        
        if (!gl.getShaderParameter(computeShader, gl.COMPILE_STATUS)) {
            console.error('Compute shader compile error:', gl.getShaderInfoLog(computeShader));
            throw new Error('Compute shader compilation failed');
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, computeShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            throw new Error('Compute program linking failed');
        }
        
        gl.deleteShader(computeShader);
        return program;
    }
    
    _createRenderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader compile error:', gl.getShaderInfoLog(vertexShader));
            throw new Error('Vertex shader compilation failed');
        }
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader compile error:', gl.getShaderInfoLog(fragmentShader));
            throw new Error('Fragment shader compilation failed');
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            throw new Error('Render program linking failed');
        }
        
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }
    
    _createBuffers() {
        const gl = this.gl;
        
        // Position buffer
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.positionBuffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, this.maxParticles * 4 * 4, gl.DYNAMIC_COPY);
        
        // Velocity buffer
        this.velocityBuffer = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.velocityBuffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, this.maxParticles * 4 * 4, gl.DYNAMIC_COPY);
        
        // Color buffer
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.colorBuffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, this.maxParticles * 4 * 4, gl.DYNAMIC_COPY);
        
        // Life buffer
        this.lifeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.lifeBuffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, this.maxParticles * 4, gl.DYNAMIC_COPY);
        
        // Emit flag buffer
        this.emitBuffer = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.emitBuffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, this.maxParticles * 4, gl.DYNAMIC_COPY);
        
        // Vertex buffer for rendering (stores particle indices)
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const indices = new Float32Array(this.maxParticles);
        for (let i = 0; i < this.maxParticles; i++) {
            indices[i] = i;
        }
        gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
    }
    
    _initializeParticles() {
        const gl = this.gl;
        
        // Initialize position buffer
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.positionBuffer);
        const positions = new Float32Array(this.maxParticles * 4);
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 4] = this.emissionPosition.x + (Math.random() - 0.5) * 2;
            positions[i * 4 + 1] = this.emissionPosition.y + Math.random() * 5;
            positions[i * 4 + 2] = this.emissionPosition.z + (Math.random() - 0.5) * 2;
            positions[i * 4 + 3] = 1.0;
        }
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, positions);
        
        // Initialize velocity buffer
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.velocityBuffer);
        const velocities = new Float32Array(this.maxParticles * 4);
        for (let i = 0; i < this.particleCount; i++) {
            velocities[i * 4] = this.emissionVelocity.x + (Math.random() - 0.5) * 10;
            velocities[i * 4 + 1] = this.emissionVelocity.y + Math.random() * 10 + 5;
            velocities[i * 4 + 2] = this.emissionVelocity.z + (Math.random() - 0.5) * 10;
            velocities[i * 4 + 3] = this.particleLifetime;
        }
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, velocities);
        
        // Initialize color buffer
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.colorBuffer);
        const colors = new Float32Array(this.maxParticles * 4);
        for (let i = 0; i < this.particleCount; i++) {
            colors[i * 4] = this.color.r;
            colors[i * 4 + 1] = this.color.g;
            colors[i * 4 + 2] = this.color.b;
            colors[i * 4 + 3] = 1.0;
        }
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, colors);
        
        // Initialize life buffer
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.lifeBuffer);
        const lifetimes = new Float32Array(this.maxParticles);
        for (let i = 0; i < this.particleCount; i++) {
            lifetimes[i] = Math.random() * this.particleLifetime;
        }
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, lifetimes);
        
        // Initialize emit buffer
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.emitBuffer);
        const emitFlags = new Int32Array(this.maxParticles);
        for (let i = 0; i < this.particleCount; i++) {
            emitFlags[i] = 0; // Not emitting initially
        }
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, emitFlags);
        
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
        this.activeParticles = this.particleCount;
    }
    
    /**
     * Execute compute shader for physics simulation
     */
    _runComputeShader(deltaTime) {
        const gl = this.gl;
        
        gl.useProgram(this.computeProgram);
        
        // Bind SSBO bindings
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.positionBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, this.velocityBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 2, this.colorBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 3, this.lifeBuffer);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 4, this.emitBuffer);
        
        // Set uniforms
        gl.uniform1f(gl.getUniformLocation(this.computeProgram, 'deltaTime'), deltaTime);
        gl.uniform1f(gl.getUniformLocation(this.computeProgram, 'time'), performance.now() * 0.001);
        gl.uniform3f(gl.getUniformLocation(this.computeProgram, 'gravity'), 
            this.uniforms.gravity.x, this.uniforms.gravity.y, this.uniforms.gravity.z);
        gl.uniform1f(gl.getUniformLocation(this.computeProgram, 'drag'), this.uniforms.drag);
        gl.uniform3f(gl.getUniformLocation(this.computeProgram, 'emitterPosition'),
            this.emissionPosition.x, this.emissionPosition.y, this.emissionPosition.z);
        gl.uniform3f(gl.getUniformLocation(this.computeProgram, 'emitterVelocity'),
            this.emissionVelocity.x, this.emissionVelocity.y, this.emissionVelocity.z);
        gl.uniform1i(gl.getUniformLocation(this.computeProgram, 'emitRate'), this.emissionRate);
        gl.uniform1f(gl.getUniformLocation(this.computeProgram, 'maxLife'), this.particleLifetime);
        gl.uniform3f(gl.getUniformLocation(this.computeProgram, 'wind'),
            this.wind.x, this.wind.y, this.wind.z);
        gl.uniform1f(gl.getUniformLocation(this.computeProgram, 'pointSize'), this.pointSize);
        
        // Dispatch compute shader
        const workGroupSize = 256;
        const numGroups = Math.ceil(this.maxParticles / workGroupSize);
        gl.dispatchCompute(numGroups, 1, 1);
        
        // Wait for compute to finish
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
    }
    
    /**
     * Render particles using OpenGL
     */
    _renderParticles(camera) {
        const gl = this.gl;
        
        gl.useProgram(this.renderProgram);
        
        // Bind vertex buffer and set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLoc = gl.getAttribLocation(this.renderProgram, 'aPosition');
        const colorLoc = gl.getAttribLocation(this.renderProgram, 'aColor');
        
        // Set up position attribute (from SSBO)
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this.positionBuffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(positionLoc, 1);
        
        // Set up color attribute (from SSBO)
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, this.colorBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(colorLoc, 1);
        
        // Set uniforms
        const projectionLoc = gl.getUniformLocation(this.renderProgram, 'projectionMatrix');
        const viewLoc = gl.getUniformLocation(this.renderProgram, 'viewMatrix');
        const pointSizeLoc = gl.getUniformLocation(this.renderProgram, 'pointSize');
        
        gl.uniformMatrix4fv(projectionLoc, false, camera.projectionMatrix.elements);
        gl.uniformMatrix4fv(viewLoc, false, camera.matrixWorldInverse.elements);
        gl.uniform1f(pointSizeLoc, this.pointSize);
        
        // Enable blending for particles
        gl.enable(gl.BLEND);
        if (this.blending === 'additive') {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        } else {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        
        // Draw particles
        gl.drawArraysInstanced(gl.POINTS, 0, 1, this.activeParticles);
        
        // Cleanup
        gl.disableVertexAttribArray(positionLoc);
        gl.disableVertexAttribArray(colorLoc);
        gl.disable(gl.BLEND);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);
    }
    
    /**
     * Update particle system
     */
    update(deltaTime) {
        this.uniforms.deltaTime = deltaTime;
        this.uniforms.time = performance.now() * 0.001;
        
        // Run GPU compute shader
        this._runComputeShader(deltaTime);
        
        // Get updated data from GPU for CPU access (if needed)
        this._updateCPUData();
    }
    
    /**
     * Update CPU-side data from GPU buffers
     */
    _updateCPUData() {
        const gl = this.gl;
        
        // Only update if someone is listening (performance optimization)
        if (this.onDataUpdate) {
            gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.positionBuffer);
            this.positionData = new Float32Array(gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0));
            
            gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.velocityBuffer);
            this.velocityData = new Float32Array(gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0));
            
            gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.colorBuffer);
            this.colorData = new Float32Array(gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0));
            
            if (this.onDataUpdate) {
                this.onDataUpdate(this.positionData, this.velocityData, this.colorData);
            }
        }
    }
    
    /**
     * Render particles
     */
    render(camera) {
        this._renderParticles(camera);
    }
    
    /**
     * Set emission properties
     */
    setEmission(position, velocity, rate) {
        if (position) this.emissionPosition.copy(position);
        if (velocity) this.emissionVelocity.copy(velocity);
        if (rate !== undefined) this.emissionRate = rate;
    }
    
    /**
     * Add custom force
     */
    addForce(force, type = 'global') {
        if (type === 'global') {
            // Apply to all particles
            const gl = this.gl;
            gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.velocityBuffer);
            const velocities = new Float32Array(this.maxParticles * 4);
            gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, velocities);
            
            for (let i = 0; i < this.maxParticles; i++) {
                velocities[i * 4] += force.x;
                velocities[i * 4 + 1] += force.y;
                velocities[i * 4 + 2] += force.z;
            }
            
            gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, velocities);
        } else {
            this.customForces.push({ force, type });
        }
    }
    
    /**
     * Set particle color
     */
    setColor(color) {
        this.color.copy(color);
    }
    
    /**
     * Set world bounds for collision
     */
    setWorldBounds(min, max) {
        this.worldBounds.min.copy(min);
        this.worldBounds.max.copy(max);
    }
    
    /**
     * Set wind force
     */
    setWind(wind) {
        this.wind.copy(wind);
    }
    
    /**
     * Get particle count
     */
    getParticleCount() {
        return this.activeParticles;
    }
    
    /**
     * Set callback for CPU data access
     */
    onCPUDataUpdate(callback) {
        this.onDataUpdate = callback;
    }
    
    /**
     * Burst emission - emit many particles at once
     */
    burst(count = 1000) {
        const gl = this.gl;
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.emitBuffer);
        
        const emitFlags = new Int32Array(this.maxParticles);
        for (let i = 0; i < count && i < this.maxParticles; i++) {
            emitFlags[i] = 1; // Mark for emission
        }
        
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, emitFlags);
        this.activeParticles = Math.min(this.activeParticles + count, this.maxParticles);
    }
    
    /**
     * Clear all particles
     */
    clear() {
        const gl = this.gl;
        
        // Clear all buffers
        const zeros = new Float32Array(this.maxParticles * 4);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.positionBuffer);
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, zeros);
        
        const velZeros = new Float32Array(this.maxParticles * 4);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.velocityBuffer);
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, velZeros);
        
        const lifeZeros = new Float32Array(this.maxParticles);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.lifeBuffer);
        gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, lifeZeros);
        
        this.activeParticles = 0;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        const gl = this.gl;
        
        if (this.computeProgram) gl.deleteProgram(this.computeProgram);
        if (this.renderProgram) gl.deleteProgram(this.renderProgram);
        
        if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
        if (this.velocityBuffer) gl.deleteBuffer(this.velocityBuffer);
        if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
        if (this.lifeBuffer) gl.deleteBuffer(this.lifeBuffer);
        if (this.emitBuffer) gl.deleteBuffer(this.emitBuffer);
        if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
        
        this.positionBuffer = null;
        this.velocityBuffer = null;
        this.colorBuffer = null;
        this.lifeBuffer = null;
        this.emitBuffer = null;
        this.vertexBuffer = null;
    }
}

/**
 * GPU Firework System
 */
export class GPUFireworkSystem extends GPUParticleSystem {
    constructor(options = {}) {
        super({
            ...options,
            maxParticles: options.maxParticles || 100000,
            particleCount: 0,
            emitRate: options.emitRate || 50000,
            maxLife: options.maxLife || 3.0,
            blending: 'additive'
        });
        
        this.frequency = options.frequency || 2000; // milliseconds
        this.lastFireworkTime = 0;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Auto-launch fireworks
        const currentTime = performance.now();
        if (currentTime - this.lastFireworkTime > this.frequency) {
            this.launchFirework();
            this.lastFireworkTime = currentTime;
        }
    }
    
    launchFirework() {
        // Random position for firework
        const x = (Math.random() - 0.5) * 100;
        const y = Math.random() * 50 + 20;
        const z = (Math.random() - 0.5) * 100;
        
        this.setEmission(new Vector3(x, y, z), new Vector3(0, 0, 0), 50000);
        this.burst(50000);
    }
}

/**
 * GPU Explosion System
 */
export class GPUExplosionSystem extends GPUParticleSystem {
    constructor(options = {}) {
        super({
            ...options,
            maxParticles: options.maxParticles || 500000,
            particleCount: 0,
            emitRate: options.emitRate || 100000,
            maxLife: options.maxLife || 5.0,
            blending: 'additive'
        });
    }
    
    explode(position, intensity = 1.0) {
        this.setEmission(position, new Vector3(0, 0, 0), 100000);
        this.burst(Math.floor(50000 * intensity));
    }
}
