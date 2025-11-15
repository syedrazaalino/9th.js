import { Vector3 } from '../core/math/Vector3.js';
import { Color } from '../core/math/Color.js';

/**
 * Individual particle class
 * Manages particle state, physics, and lifecycle
 */
export class Particle {
    constructor(index, particleSystem) {
        this.index = index;
        this.particleSystem = particleSystem;
        
        // Particle properties
        this.position = new Vector3();
        this.velocity = new Vector3();
        this.acceleration = new Vector3();
        this.size = new Vector3(1, 1, 1);
        this.color = new Color();
        
        // Lifecycle
        this.age = 0;
        this.lifetime = 1;
        this.isAlive = false;
        
        // Physics
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.mass = 1;
        this.drag = 1;
        this.bounce = 0;
        
        // Forces applied to this particle
        this.forces = [];
        
        // Custom user data
        this.userData = {};
        
        // Reference to emitter that spawned this particle
        this.emitter = null;
        
        // Performance tracking
        this.updateCount = 0;
    }
    
    /**
     * Reset particle to initial state
     */
    reset(position, velocity, color, size, lifetime, emitter) {
        this.position.copy(position);
        this.velocity.copy(velocity);
        this.acceleration.set(0, 0, 0);
        
        if (size instanceof Vector3) {
            this.size.copy(size);
        } else {
            this.size.set(size, size, size);
        }
        
        this.color.copy(color);
        
        this.age = 0;
        this.lifetime = lifetime;
        this.isAlive = true;
        
        this.rotation = 0;
        this.rotationSpeed = 0;
        
        this.mass = emitter ? emitter.mass || 1 : 1;
        this.drag = emitter ? emitter.drag || 1 : 1;
        this.bounce = emitter ? emitter.bounce || 0 : 0;
        
        this.forces = [];
        this.userData = {};
        this.emitter = emitter;
        
        this.updateCount = 0;
    }
    
    /**
     * Reset particle to inactive state
     */
    reset() {
        this.isAlive = false;
        this.age = 0;
        this.lifetime = 0;
        this.forces = [];
        this.userData = {};
        this.emitter = null;
    }
    
    /**
     * Update particle physics and state
     */
    update(deltaTime) {
        if (!this.isAlive) return;
        
        this.updateCount++;
        this.age += deltaTime;
        
        // Check if particle should die
        if (this.age >= this.lifetime) {
            this.die();
            return;
        }
        
        // Apply forces
        this.applyForces(deltaTime);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update rotation
        this.updateRotation(deltaTime);
        
        // Update GPU buffer data
        this.updateGPUData();
    }
    
    /**
     * Apply all forces to the particle
     */
    applyForces(deltaTime) {
        // Clear acceleration
        this.acceleration.set(0, 0, 0);
        
        // Apply custom forces
        for (const force of this.forces) {
            this.acceleration.add(force.clone().multiplyScalar(this.mass));
        }
        
        // Apply emitter acceleration
        if (this.emitter && this.emitter.acceleration) {
            this.acceleration.add(this.emitter.acceleration);
        }
        
        // Apply particle system gravity
        if (this.particleSystem.gravity) {
            this.acceleration.add(this.particleSystem.gravity);
        }
        
        // Apply wind
        if (this.particleSystem.wind) {
            this.acceleration.add(this.particleSystem.wind);
        }
        
        // Apply global velocity as acceleration
        if (this.particleSystem.globalVelocity) {
            const globalVel = this.particleSystem.globalVelocity.clone();
            this.acceleration.add(globalVel.multiplyScalar(0.1)); // Mild acceleration
        }
    }
    
    /**
     * Update particle physics (position, velocity)
     */
    updatePhysics(deltaTime) {
        // Update velocity with acceleration
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Apply drag
        const dragFactor = Math.pow(this.drag, deltaTime * 60); // Frame-rate independent drag
        this.velocity.multiplyScalar(dragFactor);
        
        // Apply particle system global drag
        if (this.particleSystem.drag) {
            const systemDrag = Math.pow(this.particleSystem.drag, deltaTime * 60);
            this.velocity.multiplyScalar(systemDrag);
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Handle collisions if enabled
        if (this.particleSystem.enableCollisions) {
            this.handleCollisions();
        }
    }
    
    /**
     * Update particle rotation
     */
    updateRotation(deltaTime) {
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Keep rotation in reasonable range
        if (this.rotation > Math.PI * 2) {
            this.rotation -= Math.PI * 2;
        } else if (this.rotation < 0) {
            this.rotation += Math.PI * 2;
        }
    }
    
    /**
     * Handle collisions with other particles or environment
     */
    handleCollisions() {
        // Get nearby particles using spatial grid
        const nearbyParticles = this.particleSystem.getParticlesInRegion(this.position, 5);
        
        for (const other of nearbyParticles) {
            if (other === this || !other.isAlive) continue;
            
            const distance = this.position.distanceTo(other.position);
            const collisionDistance = this.getCollisionRadius() + other.getCollisionRadius();
            
            if (distance < collisionDistance) {
                this.resolveCollision(other, distance);
            }
        }
    }
    
    /**
     * Resolve collision with another particle
     */
    resolveCollision(other, distance) {
        // Simple elastic collision
        const normal = this.position.clone().sub(other.position).normalize();
        const relativeVelocity = this.velocity.clone().sub(other.velocity);
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        if (velocityAlongNormal > 0) return; // Already separating
        
        const restitution = 0.5; // Bounciness
        const impulse = -(1 + restitution) * velocityAlongNormal;
        
        const impulseVector = normal.clone().multiplyScalar(impulse / this.mass);
        this.velocity.add(impulseVector);
        other.velocity.sub(impulseVector.clone().multiplyScalar(other.mass / this.mass));
        
        // Separate particles
        const separation = (this.getCollisionRadius() + other.getCollisionRadius() - distance) * 0.5;
        this.position.add(normal.clone().multiplyScalar(separation));
        other.position.sub(normal.clone().multiplyScalar(separation));
    }
    
    /**
     * Get collision radius based on particle size
     */
    getCollisionRadius() {
        return Math.max(this.size.x, this.size.y, this.size.z) * 0.5;
    }
    
    /**
     * Update GPU buffer data for this particle
     */
    updateGPUData() {
        const index = this.index;
        const posOffset = index * 3;
        const colOffset = index * 4;
        
        // Update position and scale in GPU buffers
        this.particleSystem.positions[posOffset] = this.position.x;
        this.particleSystem.positions[posOffset + 1] = this.position.y;
        this.particleSystem.positions[posOffset + 2] = this.position.z;
        
        this.particleSystem.scales[posOffset] = this.size.x;
        this.particleSystem.scales[posOffset + 1] = this.size.y;
        this.particleSystem.scales[posOffset + 2] = this.size.z;
        
        // Update color with life-based interpolation
        this.updateColor();
        
        this.particleSystem.colors[colOffset] = this.color.r;
        this.particleSystem.colors[colOffset + 1] = this.color.g;
        this.particleSystem.colors[colOffset + 2] = this.color.b;
        this.particleSystem.colors[colOffset + 3] = this.color.a || 1.0;
        
        // Update rotation and age
        this.particleSystem.rotationAngles[index] = this.rotation;
        this.particleSystem.ages[index] = this.age;
    }
    
    /**
     * Update particle color based on life progress
     */
    updateColor() {
        if (!this.emitter) return;
        
        const lifeProgress = this.age / this.lifetime;
        
        // Interpolate color
        const startColor = this.emitter.colorStart;
        const endColor = this.emitter.colorEnd;
        this.color.copy(startColor).lerp(endColor, lifeProgress);
        
        // Interpolate alpha
        const alpha = this.emitter.alphaStart + (this.emitter.alphaEnd - this.emitter.alphaStart) * lifeProgress;
        this.color.alpha = Math.max(0, Math.min(1, alpha));
    }
    
    /**
     * Add a force to this particle
     */
    addForce(force) {
        if (force instanceof Vector3) {
            this.forces.push(force.clone());
        }
    }
    
    /**
     * Remove a force from this particle
     */
    removeForce(force) {
        const index = this.forces.indexOf(force);
        if (index !== -1) {
            this.forces.splice(index, 1);
        }
    }
    
    /**
     * Clear all forces
     */
    clearForces() {
        this.forces = [];
    }
    
    /**
     * Apply velocity change
     */
    addVelocity(velocity) {
        this.velocity.add(velocity);
    }
    
    /**
     * Apply impulse (instantaneous velocity change)
     */
    applyImpulse(impulse) {
        this.velocity.add(impulse.clone().multiplyScalar(this.mass));
    }
    
    /**
     * Set particle size
     */
    setSize(size) {
        if (size instanceof Vector3) {
            this.size.copy(size);
        } else {
            this.size.set(size, size, size);
        }
    }
    
    /**
     * Set particle color
     */
    setColor(color) {
        this.color.copy(color);
    }
    
    /**
     * Kill this particle
     */
    die() {
        this.isAlive = false;
        this.particleSystem.killParticle(this);
    }
    
    /**
     * Respawn this particle (reset with new values)
     */
    respawn(position, velocity, color, size, lifetime, emitter) {
        this.reset(position, velocity, color, size, lifetime, emitter);
    }
    
    /**
     * Get particle life progress (0-1)
     */
    getLifeProgress() {
        return Math.min(1, this.age / this.lifetime);
    }
    
    /**
     * Get remaining life time
     */
    getRemainingLife() {
        return Math.max(0, this.lifetime - this.age);
    }
    
    /**
     * Check if particle is still alive
     */
    isDead() {
        return !this.isAlive || this.age >= this.lifetime;
    }
    
    /**
     * Clone this particle (for advanced effects)
     */
    clone() {
        const cloned = new Particle(this.index, this.particleSystem);
        cloned.position.copy(this.position);
        cloned.velocity.copy(this.velocity);
        cloned.acceleration.copy(this.acceleration);
        cloned.size.copy(this.size);
        cloned.color.copy(this.color);
        cloned.rotation = this.rotation;
        cloned.rotationSpeed = this.rotationSpeed;
        cloned.lifetime = this.lifetime;
        cloned.emitter = this.emitter;
        
        return cloned;
    }
    
    /**
     * Get particle statistics
     */
    getStats() {
        return {
            index: this.index,
            age: this.age,
            lifetime: this.lifetime,
            lifeProgress: this.getLifeProgress(),
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            size: this.size.clone(),
            color: this.color.clone(),
            rotation: this.rotation,
            rotationSpeed: this.rotationSpeed,
            isAlive: this.isAlive,
            forces: this.forces.length,
            updateCount: this.updateCount
        };
    }
}
