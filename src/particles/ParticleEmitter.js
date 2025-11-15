import { Vector3 } from '../core/math/Vector3.js';
import { Color } from '../core/math/Color.js';
import { Object3D } from '../core/Object3D.js';

// MathUtils for random values
const MathUtils = {
    randFloat: (min, max) => Math.random() * (max - min) + min,
    randFloatSpread: (range) => (Math.random() - 0.5) * range,
    degToRad: (degrees) => degrees * (Math.PI / 180),
    radToDeg: (radians) => radians * (180 / Math.PI)
};

/**
 * Base class for particle emitters
 * Handles spawning particles with various emission patterns
 */
export class ParticleEmitter extends Object3D {
    constructor(options = {}) {
        super();
        
        // Emission properties
        this.rate = options.rate || 100; // particles per second
        this.burstRate = options.burstRate || 0;
        this.duration = options.duration || Infinity;
        this.loop = options.loop !== false;
        this.prewarm = options.prewarm || false;
        
        // Particle properties
        this.particleLifetime = options.particleLifetime || [1, 2]; // min, max
        this.initialSize = options.initialSize || [0.1, 0.5];
        this.initialSpeed = options.initialSpeed || [1, 5];
        this.initialDirection = options.initialDirection || new Vector3(0, 1, 0);
        
        // Color properties
        this.colorStart = options.colorStart || new Color(1, 1, 1);
        this.colorEnd = options.colorEnd || new Color(0, 0, 0);
        this.alphaStart = options.alphaStart || 1.0;
        this.alphaEnd = options.alphaEnd || 0.0;
        
        // Physics properties
        this.acceleration = options.acceleration || new Vector3();
        this.initialVelocity = options.initialVelocity || new Vector3();
        this.gravity = options.gravity || new Vector3();
        this.drag = options.drag || 1.0;
        
        // Spawn shape and distribution
        this.shape = options.shape || 'point';
        this.emissionAngle = options.emissionAngle || 0; // degrees, for cone emission
        this.emissionRadius = options.emissionRadius || 0;
        
        // Internal state
        this.elapsedTime = 0;
        this.emissionAccumulator = 0;
        this.isPlaying = options.autoplay !== false;
        this.isEmitting = true;
        
        // References
        this.particleSystem = null;
        
        // Emission flags for GPU optimization
        this.emitsVelocity = true;
        this.emitsAcceleration = true;
        
        // Prewarm particles
        if (this.prewarm) {
            this.prewarmParticles();
        }
    }
    
    /**
     * Update emitter (called every frame)
     */
    update(deltaTime) {
        if (!this.isPlaying || !this.isEmitting) return;
        
        this.elapsedTime += deltaTime;
        
        // Stop emission after duration
        if (this.elapsedTime >= this.duration) {
            if (this.loop) {
                this.elapsedTime = 0;
            } else {
                this.isEmitting = false;
                return;
            }
        }
        
        // Handle continuous emission
        this.emitContinuous(deltaTime);
        
        // Handle burst emission
        if (this.burstRate > 0) {
            this.emitBursts(deltaTime);
        }
    }
    
    /**
     * Emit particles continuously based on rate
     */
    emitContinuous(deltaTime) {
        this.emissionAccumulator += this.rate * deltaTime;
        
        while (this.emissionAccumulator >= 1.0) {
            this.spawnParticle();
            this.emissionAccumulator -= 1.0;
        }
    }
    
    /**
     * Emit particles in bursts
     */
    emitBursts(deltaTime) {
        if (Math.random() < this.burstRate * deltaTime) {
            const burstSize = Math.floor(Math.random() * 10) + 5; // 5-15 particles per burst
            for (let i = 0; i < burstSize; i++) {
                this.spawnParticle();
            }
        }
    }
    
    /**
     * Spawn a single particle
     */
    spawnParticle() {
        if (!this.particleSystem) return null;
        
        // Get spawn position
        const position = this.getSpawnPosition();
        
        // Get spawn velocity
        const velocity = this.getSpawnVelocity(position);
        
        // Get particle properties
        const lifetime = this.getRandomLifetime();
        const size = this.getRandomSize();
        const color = this.getColor();
        
        return this.particleSystem.spawnParticle(position, velocity, color, size, lifetime, this);
    }
    
    /**
     * Get spawn position based on emitter shape
     */
    getSpawnPosition() {
        const worldPos = this.getWorldPosition(new Vector3());
        
        switch (this.shape) {
            case 'point':
                return worldPos;
                
            case 'sphere':
                return this.getRandomPointOnSphere(worldPos, this.emissionRadius);
                
            case 'circle':
                return this.getRandomPointOnCircle(worldPos, this.emissionRadius);
                
            case 'box':
                return this.getRandomPointInBox(worldPos, this.emissionRadius);
                
            case 'cone':
                return this.getRandomPointInCone(worldPos);
                
            default:
                return worldPos;
        }
    }
    
    /**
     * Get spawn velocity based on emitter settings
     */
    getSpawnVelocity(position) {
        const velocity = new Vector3();
        
        // Base direction
        const direction = this.initialDirection.clone().normalize();
        
        // Apply cone emission
        if (this.shape === 'cone' || this.emissionAngle > 0) {
            this.applyConeDistribution(direction);
        }
        
        // Apply random spread
        this.applyRandomSpread(direction);
        
        // Set speed
        const speed = MathUtils.lerp(this.initialSpeed[0], this.initialSpeed[1], Math.random());
        velocity.copy(direction).multiplyScalar(speed);
        
        // Add initial velocity
        velocity.add(this.initialVelocity);
        
        return velocity;
    }
    
    /**
     * Get random particle lifetime
     */
    getRandomLifetime() {
        return MathUtils.lerp(this.particleLifetime[0], this.particleLifetime[1], Math.random());
    }
    
    /**
     * Get random particle size
     */
    getRandomSize() {
        return MathUtils.lerp(this.initialSize[0], this.initialSize[1], Math.random());
    }
    
    /**
     * Get particle color (interpolated from start to end)
     */
    getColor() {
        const factor = Math.random();
        const color = this.colorStart.clone();
        color.lerp(this.colorEnd, factor);
        
        // Handle alpha separately
        color.alpha = MathUtils.lerp(this.alphaStart, this.alphaEnd, factor);
        
        return color;
    }
    
    /**
     * Get random point on a sphere
     */
    getRandomPointOnSphere(center, radius) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        return new Vector3(center.x + x, center.y + y, center.z + z);
    }
    
    /**
     * Get random point on a circle
     */
    getRandomPointOnCircle(center, radius) {
        const angle = Math.random() * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        
        return new Vector3(center.x + x, center.y, center.z + z);
    }
    
    /**
     * Get random point in a box
     */
    getRandomPointInBox(center, size) {
        const halfSize = size * 0.5;
        const x = center.x + (Math.random() - 0.5) * size;
        const y = center.y + (Math.random() - 0.5) * size;
        const z = center.z + (Math.random() - 0.5) * size;
        
        return new Vector3(x, y, z);
    }
    
    /**
     * Get random point in cone emission
     */
    getRandomPointInCone(center) {
        const direction = this.initialDirection.clone().normalize();
        const angle = this.emissionAngle * Math.PI / 180;
        
        // Generate random direction within cone
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(1 - v * (1 - Math.cos(angle)));
        
        // Create orthonormal basis
        const w = direction;
        const temp = new Vector3(1, 0, 0);
        if (Math.abs(w.dot(temp)) > 0.9) {
            temp.set(0, 0, 1);
        }
        
        const uVec = temp.clone().cross(w).normalize();
        const vVec = w.clone().cross(uVec).normalize();
        
        // Calculate direction
        const sinPhi = Math.sin(phi);
        const randomDir = uVec.clone()
            .multiplyScalar(sinPhi * Math.cos(theta))
            .add(vVec.clone().multiplyScalar(sinPhi * Math.sin(theta)))
            .add(w.clone().multiplyScalar(Math.cos(phi)));
        
        const offset = randomDir.multiplyScalar(this.emissionRadius * Math.random());
        return center.clone().add(offset);
    }
    
    /**
     * Apply cone distribution to direction
     */
    applyConeDistribution(direction) {
        const angle = this.emissionAngle * Math.PI / 180;
        const maxOffset = Math.tan(angle * 0.5);
        
        // Add random offset within cone
        direction.x += (Math.random() - 0.5) * 2 * maxOffset;
        direction.y += (Math.random() - 0.5) * 2 * maxOffset;
        direction.z += (Math.random() - 0.5) * 2 * maxOffset;
        
        direction.normalize();
    }
    
    /**
     * Apply random spread to direction
     */
    applyRandomSpread(direction) {
        direction.x += (Math.random() - 0.5) * 0.5;
        direction.y += (Math.random() - 0.5) * 0.5;
        direction.z += (Math.random() - 0.5) * 0.5;
    }
    
    /**
     * Prewarm particles for immediate full effect
     */
    prewarmParticles() {
        const prewarmTime = Math.min(2.0, this.duration);
        const steps = Math.floor(prewarmTime * 60); // 60 steps per second
        
        for (let i = 0; i < steps; i++) {
            const deltaTime = 1.0 / 60.0;
            this.update(deltaTime);
        }
    }
    
    /**
     * Start emitting particles
     */
    play() {
        this.isPlaying = true;
        this.isEmitting = true;
        this.elapsedTime = 0;
        this.emissionAccumulator = 0;
    }
    
    /**
     * Stop emitting particles
     */
    stop() {
        this.isPlaying = false;
        this.isEmitting = false;
    }
    
    /**
     * Pause emission
     */
    pause() {
        this.isEmitting = false;
    }
    
    /**
     * Resume emission
     */
    resume() {
        this.isEmitting = true;
    }
    
    /**
     * Get emitter statistics
     */
    getStats() {
        return {
            isPlaying: this.isPlaying,
            isEmitting: this.isEmitting,
            elapsedTime: this.elapsedTime,
            emissionAccumulator: this.emissionAccumulator,
            rate: this.rate,
            duration: this.duration
        };
    }
    
    /**
     * Set emitter properties
     */
    setProperties(properties) {
        for (const [key, value] of Object.entries(properties)) {
            switch (key) {
                case 'rate':
                    this.rate = value;
                    break;
                case 'initialSpeed':
                    this.initialSpeed = value;
                    break;
                case 'initialDirection':
                    this.initialDirection.set(value.x, value.y, value.z);
                    break;
                case 'colorStart':
                    this.colorStart.set(value.r, value.g, value.b);
                    break;
                case 'colorEnd':
                    this.colorEnd.set(value.r, value.g, value.b);
                    break;
                case 'alphaStart':
                    this.alphaStart = value;
                    break;
                case 'alphaEnd':
                    this.alphaEnd = value;
                    break;
            }
        }
    }
    
    /**
     * Dispose emitter resources
     */
    dispose() {
        this.particleSystem = null;
    }
}

/**
 * Point emitter - emits from a single point
 */
export class PointEmitter extends ParticleEmitter {
    constructor(options = {}) {
        super({
            ...options,
            shape: 'point'
        });
    }
}

/**
 * Sphere emitter - emits from surface of a sphere
 */
export class SphereEmitter extends ParticleEmitter {
    constructor(options = {}) {
        super({
            ...options,
            shape: 'sphere'
        });
        
        this.emissionRadius = options.emissionRadius || 1.0;
    }
}

/**
 * Box emitter - emits from within a box volume
 */
export class BoxEmitter extends ParticleEmitter {
    constructor(options = {}) {
        super({
            ...options,
            shape: 'box'
        });
        
        this.emissionRadius = options.emissionRadius || 1.0; // Using radius as box size
    }
}

/**
 * Cone emitter - emits from a cone shape
 */
export class ConeEmitter extends ParticleEmitter {
    constructor(options = {}) {
        super({
            ...options,
            shape: 'cone'
        });
        
        this.emissionAngle = options.emissionAngle || 45; // degrees
        this.emissionRadius = options.emissionRadius || 1.0;
    }
}
