import { BufferGeometry, VertexAttribute } from '../core/BufferGeometry.js';
// Alias for compatibility
const BufferAttribute = VertexAttribute;
import { Matrix4 } from '../core/math/Matrix4.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Material } from '../core/Material.js';
import { Shader } from '../core/Shader.js';
import { Object3D } from '../core/Object3D.js';
import { ParticleEmitter } from './ParticleEmitter.js';
import { Particle } from './Particle.js';
import { ParticleMaterial } from './ParticleMaterial.js';

// Blending constants (if not available in 9th.js, define them)
const AdditiveBlending = 'additive';
const DoubleSide = 'double';

/**
 * GPU-accelerated particle system for rendering thousands of particles efficiently
 * Uses instanced rendering to draw multiple particles in a single draw call
 */
export class ParticleSystem extends Object3D {
    constructor(options = {}) {
        super();
        
        // Core properties
        this.maxParticles = options.maxParticles || 10000;
        this.particleCount = 0;
        this.emitters = [];
        
        // Performance optimization - particle pooling
        this.particlePool = [];
        this.activeParticles = [];
        
        // GPU buffers for instanced rendering
        this.geometry = new BufferGeometry();
        this.setupInstancedBuffers();
        
        // Custom particle material with shader support
        this.material = new ParticleMaterial({
            transparent: true,
            blending: options.blending || AdditiveBlending,
            depthWrite: false,
            vertexColors: true,
            sizeAttenuation: options.sizeAttenuation !== false,
            alphaMap: options.alphaMap,
            colorMap: options.colorMap,
            vertexShader: options.vertexShader,
            fragmentShader: options.fragmentShader
        });
        
        // Particle system uniforms
        this.uniforms = {
            time: { value: 0 },
            particleSize: { value: options.particleSize || 1.0 },
            perspectiveScale: { value: 1.0 }
        };
        
        this.material.uniforms = {
            ...this.material.uniforms,
            ...this.uniforms
        };
        
        // Physics simulation
        this.gravity = new Vector3(0, -9.81, 0);
        this.drag = options.drag || 0.98;
        this.globalVelocity = new Vector3();
        this.wind = new Vector3();
        
        // Spatial partitioning for collision detection (optional)
        this.enableCollisions = options.enableCollisions || false;
        if (this.enableCollisions) {
            this.setupSpatialGrid();
        }
        
        // Performance monitoring
        this.performanceMode = options.performanceMode || false;
        this.frameCount = 0;
        this.lastPerformanceUpdate = 0;
        
        this.updateMatrix();
    }
    
    /**
     * Setup GPU buffers for instanced rendering
     * Uses a single unit quad as base geometry, scaled per-instance
     */
    setupInstancedBuffers() {
        // Base quad geometry for sprite rendering
        const vertices = new Float32Array([
            -0.5, -0.5, 0,
             0.5, -0.5, 0,
             0.5,  0.5, 0,
            -0.5,  0.5, 0
        ]);
        
        const uvs = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ]);
        
        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        
        this.geometry.setAttribute('position', new BufferAttribute(vertices, 3));
        this.geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
        this.geometry.setIndex(new BufferAttribute(indices, 1));
        
        // Instance attributes for GPU instancing
        this.positions = new Float32Array(this.maxParticles * 3);
        this.scales = new Float32Array(this.maxParticles * 3); // Scale per axis
        this.velocities = new Float32Array(this.maxParticles * 3);
        this.accelerations = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 4); // RGBA
        this.lifetimes = new Float32Array(this.maxParticles);
        this.ages = new Float32Array(this.maxParticles);
        this.rotationAngles = new Float32Array(this.maxParticles);
        this.rotationSpeeds = new Float32Array(this.maxParticles);
        this.textureIndices = new Float32Array(this.maxParticles);
        this.activeFlags = new Uint8Array(this.maxParticles);
        
        // Setup GPU buffers
        this.geometry.setAttribute('instancePosition', new BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('instanceScale', new BufferAttribute(this.scales, 3));
        this.geometry.setAttribute('instanceVelocity', new BufferAttribute(this.velocities, 3));
        this.geometry.setAttribute('instanceAcceleration', new BufferAttribute(this.accelerations, 3));
        this.geometry.setAttribute('instanceColor', new BufferAttribute(this.colors, 4));
        this.geometry.setAttribute('instanceLifetime', new BufferAttribute(this.lifetimes, 1));
        this.geometry.setAttribute('instanceAge', new BufferAttribute(this.ages, 1));
        this.geometry.setAttribute('instanceRotation', new BufferAttribute(this.rotationAngles, 1));
        this.geometry.setAttribute('instanceRotationSpeed', new BufferAttribute(this.rotationSpeeds, 1));
        this.geometry.setAttribute('instanceTextureIndex', new BufferAttribute(this.textureIndices, 1));
        
        this.instancedAttribute = new BufferAttribute(this.activeFlags, 1);
        this.geometry.setAttribute('instanceActive', this.instancedAttribute);
        
        // Initialize particle pool
        this.initializeParticlePool();
    }
    
    /**
     * Initialize particle pool for performance
     */
    initializeParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = new Particle(i, this);
            this.particlePool.push(particle);
        }
    }
    
    /**
     * Add a particle emitter to the system
     */
    addEmitter(emitter) {
        if (emitter instanceof ParticleEmitter) {
            this.emitters.push(emitter);
            emitter.particleSystem = this;
        }
    }
    
    /**
     * Remove an emitter from the system
     */
    removeEmitter(emitter) {
        const index = this.emitters.indexOf(emitter);
        if (index !== -1) {
            this.emitters.splice(index, 1);
            emitter.particleSystem = null;
        }
    }
    
    /**
     * Update particle system (called every frame)
     */
    update(deltaTime, camera) {
        // Update time uniform
        this.uniforms.time.value += deltaTime;
        
        // Update perspective scale for size attenuation
        if (camera && camera.projectionMatrix) {
            this.uniforms.perspectiveScale.value = camera.projectionMatrix.elements[5];
        }
        
        // Update all emitters
        for (const emitter of this.emitters) {
            emitter.update(deltaTime);
        }
        
        // Update active particles
        this.updateParticles(deltaTime);
        
        // Update GPU buffers
        this.updateBuffers();
        
        // Performance monitoring
        if (this.performanceMode) {
            this.updatePerformanceMetrics(deltaTime);
        }
    }
    
    /**
     * Update all active particles
     */
    updateParticles(deltaTime) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            // Update particle physics
            particle.update(deltaTime);
            
            // Update lifetime and check if particle should be killed
            particle.age += deltaTime;
            
            if (particle.age >= particle.lifetime) {
                this.killParticle(particle);
                this.activeParticles.splice(i, 1);
            }
        }
    }
    
    /**
     * Update GPU buffers with particle data
     */
    updateBuffers() {
        this.geometry.attributes.instancePosition.needsUpdate = true;
        this.geometry.attributes.instanceScale.needsUpdate = true;
        this.geometry.attributes.instanceColor.needsUpdate = true;
        this.geometry.attributes.instanceRotation.needsUpdate = true;
        
        // Only update physics attributes if needed
        if (this.emitters.some(em => em.emitsVelocity)) {
            this.geometry.attributes.instanceVelocity.needsUpdate = true;
        }
        if (this.emitters.some(em => em.emitsAcceleration)) {
            this.geometry.attributes.instanceAcceleration.needsUpdate = true;
        }
        
        this.geometry.attributes.instanceAge.needsUpdate = true;
        this.geometry.attributes.instanceTextureIndex.needsUpdate = true;
    }
    
    /**
     * Spawn a new particle from the pool
     */
    spawnParticle(position, velocity, color, size, lifetime, emitter) {
        if (this.particlePool.length === 0) {
            // Kill oldest particle if no pool available
            if (this.activeParticles.length > 0) {
                this.killParticle(this.activeParticles[0]);
            } else {
                return null; // Particle system is full
            }
        }
        
        const particle = this.particlePool.pop();
        particle.reset(position, velocity, color, size, lifetime, emitter);
        
        // Set particle data in arrays
        const index = particle.index;
        const posOffset = index * 3;
        const colOffset = index * 4;
        
        this.positions[posOffset] = position.x;
        this.positions[posOffset + 1] = position.y;
        this.positions[posOffset + 2] = position.z;
        
        this.scales[posOffset] = size.x || size;
        this.scales[posOffset + 1] = size.y || size;
        this.scales[posOffset + 2] = size.z || size;
        
        this.velocities[posOffset] = velocity.x;
        this.velocities[posOffset + 1] = velocity.y;
        this.velocities[posOffset + 2] = velocity.z;
        
        this.colors[colOffset] = color.r;
        this.colors[colOffset + 1] = color.g;
        this.colors[colOffset + 2] = color.b;
        this.colors[colOffset + 3] = color.a || 1.0;
        
        this.lifetimes[index] = lifetime;
        this.ages[index] = 0;
        this.rotationAngles[index] = Math.random() * Math.PI * 2;
        this.rotationSpeeds[index] = (Math.random() - 0.5) * 4; // Random rotation speed
        this.textureIndices[index] = Math.random(); // Random texture index for variety
        
        this.activeFlags[index] = 1;
        this.activeParticles.push(particle);
        
        return particle;
    }
    
    /**
     * Kill a particle and return it to the pool
     */
    killParticle(particle) {
        const index = particle.index;
        this.activeFlags[index] = 0;
        this.particlePool.push(particle);
        particle.reset();
    }
    
    /**
     * Clear all particles
     */
    clearParticles() {
        for (const particle of this.activeParticles) {
            this.killParticle(particle);
        }
        this.activeParticles.length = 0;
    }
    
    /**
     * Setup spatial grid for collision detection
     */
    setupSpatialGrid() {
        this.gridSize = 10;
        this.grid = new Map();
        this.maxGridDistance = 5;
    }
    
    /**
     * Get particles in a specific spatial region
     */
    getParticlesInRegion(center, radius) {
        const particles = [];
        const minX = Math.floor((center.x - radius) / this.gridSize);
        const maxX = Math.floor((center.x + radius) / this.gridSize);
        const minY = Math.floor((center.y - radius) / this.gridSize);
        const maxY = Math.floor((center.y + radius) / this.gridSize);
        const minZ = Math.floor((center.z - radius) / this.gridSize);
        const maxZ = Math.floor((center.z + radius) / this.gridSize);
        
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const key = `${x},${y},${z}`;
                    if (this.grid.has(key)) {
                        particles.push(...this.grid.get(key));
                    }
                }
            }
        }
        
        return particles;
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(deltaTime) {
        this.frameCount++;
        this.lastPerformanceUpdate += deltaTime;
        
        if (this.lastPerformanceUpdate >= 1.0) {
            this.fps = this.frameCount / this.lastPerformanceUpdate;
            this.frameCount = 0;
            this.lastPerformanceUpdate = 0;
        }
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            fps: this.fps || 0,
            activeParticles: this.activeParticles.length,
            poolSize: this.particlePool.length,
            maxParticles: this.maxParticles
        };
    }
    
    /**
     * Set particle system properties
     */
    setProperties(properties) {
        for (const [key, value] of Object.entries(properties)) {
            switch (key) {
                case 'gravity':
                    this.gravity.set(value.x, value.y, value.z);
                    break;
                case 'drag':
                    this.drag = value;
                    break;
                case 'globalVelocity':
                    this.globalVelocity.set(value.x, value.y, value.z);
                    break;
                case 'wind':
                    this.wind.set(value.x, value.y, value.z);
                    break;
                case 'blending':
                    this.material.blending = value;
                    break;
                case 'particleSize':
                    this.uniforms.particleSize.value = value;
                    break;
            }
        }
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        // Clear all particles and emitters
        this.clearParticles();
        
        // Dispose geometry and material
        this.geometry.dispose();
        this.material.dispose();
        
        // Clear emitters
        for (const emitter of this.emitters) {
            emitter.dispose();
        }
        this.emitters.length = 0;
    }
}
