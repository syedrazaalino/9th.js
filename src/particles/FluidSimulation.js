import { Vector3, Color } from '../core/math/index.js';
import { Object3D } from '../core/Object3D.js';

/**
 * Smoothed Particle Hydrodynamics (SPH) Fluid Simulation
 * Implements realistic fluid dynamics with pressure, viscosity, and cohesion forces
 */
export class FluidParticle {
    constructor() {
        this.position = new Vector3();
        this.velocity = new Vector3();
        this.acceleration = new Vector3();
        this.density = 0;
        this.pressure = 0;
        this.mass = 1.0;
        this.restDensity = 1000;
        this.pressureStiffness = 200;
        this.viscosity = 0.1;
        this.gravity = new Vector3(0, -9.81, 0);
        this.neighbors = [];
        this.isBoundary = false;
    }
}

export class FluidSimulation extends Object3D {
    constructor(options = {}) {
        super();
        
        // SPH Parameters
        this.particleRadius = options.particleRadius || 0.1;
        this.smoothingRadius = options.smoothingRadius || 0.2;
        this.restDensity = options.restDensity || 1000;
        this.pressureStiffness = options.pressureStiffness || 200;
        this.viscosity = options.viscosity || 0.1;
        this.gravity = new Vector3(0, -9.81, 0);
        this.gasConstant = options.gasConstant || 2000;
        this.surfaceTension = options.surfaceTension || 0.1;
        this.boundaryDamping = options.boundaryDamping || 0.5;
        
        // Simulation bounds
        this.bounds = options.bounds || {
            min: new Vector3(-5, 0, -5),
            max: new Vector3(5, 10, 5)
        };
        
        // Particle system
        this.maxParticles = options.maxParticles || 5000;
        this.particles = [];
        this.activeCount = 0;
        this.particlePool = [];
        
        // Spatial grid for neighbor search
        this.grid = new Map();
        this.gridCellSize = this.smoothingRadius;
        
        // Rendering
        this.pointSize = options.pointSize || 0.05;
        this.color = options.color || new Color(0.3, 0.6, 1.0);
        this.material = null;
        this.geometry = null;
        
        // Performance
        this.substeps = options.substeps || 2;
        this.dt = 0;
        this.enableCollisions = true;
        
        this._initializeParticles();
        this._setupGeometry();
    }
    
    _initializeParticles() {
        // Create particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(new FluidParticle());
        }
        
        // Initialize with initial particle distribution
        if (options.initialParticles) {
            this.addParticles(options.initialParticles);
        }
    }
    
    _setupGeometry() {
        // Setup WebGL buffers for particle rendering
        this.geometry = {
            positions: new Float32Array(this.maxParticles * 3),
            colors: new Float32Array(this.maxParticles * 4),
            drawCount: 0
        };
    }
    
    /**
     * Add particles to the simulation
     */
    addParticles(positions) {
        for (let i = 0; i < positions.length; i++) {
            if (this.activeCount < this.maxParticles) {
                const particle = this.particlePool[this.activeCount];
                particle.position.copy(positions[i]);
                particle.velocity.set(0, 0, 0);
                particle.acceleration.set(0, 0, 0);
                particle.isBoundary = false;
                this.particles[this.activeCount] = particle;
                this.activeCount++;
            }
        }
    }
    
    /**
     * Setup boundary particles for collision
     */
    setupBoundaries() {
        const { min, max } = this.bounds;
        const r = this.particleRadius;
        
        // Create boundary particles around the simulation volume
        const boundaries = [
            // Bottom plane
            { x: min.x, y: min.y, z: min.z },
            { x: max.x, y: min.y, z: min.z },
            { x: max.x, y: min.y, z: max.z },
            { x: min.x, y: min.y, z: max.z },
            // Top plane
            { x: min.x, y: max.y, z: min.z },
            { x: max.x, y: max.y, z: min.z },
            { x: max.x, y: max.y, z: max.z },
            { x: min.x, y: max.y, z: max.z }
        ];
        
        for (const pos of boundaries) {
            if (this.activeCount < this.maxParticles) {
                const particle = this.particlePool[this.activeCount];
                particle.position.set(pos.x, pos.y, pos.z);
                particle.velocity.set(0, 0, 0);
                particle.acceleration.set(0, 0, 0);
                particle.isBoundary = true;
                this.particles[this.activeCount] = particle;
                this.activeCount++;
            }
        }
    }
    
    /**
     * Build spatial grid for neighbor search
     */
    _buildSpatialGrid() {
        this.grid.clear();
        const cellSize = this.gridCellSize;
        
        for (let i = 0; i < this.activeCount; i++) {
            const particle = this.particles[i];
            const x = Math.floor(particle.position.x / cellSize);
            const y = Math.floor(particle.position.y / cellSize);
            const z = Math.floor(particle.position.z / cellSize);
            
            const key = `${x},${y},${z}`;
            if (!this.grid.has(key)) {
                this.grid.set(key, []);
            }
            this.grid.get(key).push(i);
        }
    }
    
    /**
     * Get neighboring particles within smoothing radius
     */
    _getNeighbors(particle) {
        const neighbors = [];
        const cellSize = this.gridCellSize;
        
        const x = Math.floor(particle.position.x / cellSize);
        const y = Math.floor(particle.position.y / cellSize);
        const z = Math.floor(particle.position.z / cellSize);
        
        // Check 27 neighboring cells (3x3x3 grid)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const key = `${x + dx},${y + dy},${z + dz}`;
                    const cell = this.grid.get(key);
                    
                    if (cell) {
                        for (const idx of cell) {
                            const neighbor = this.particles[idx];
                            const dist = particle.position.distanceTo(neighbor.position);
                            if (dist < this.smoothingRadius) {
                                neighbors.push(neighbor);
                            }
                        }
                    }
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * SPH kernel functions
     */
    _sphKernel(r, h) {
        if (r >= h) return 0;
        const volume = (315.0 / (64.0 * Math.PI * Math.pow(h, 9)));
        const term = h * h - r * r;
        return volume * term * term * term;
    }
    
    _sphKernelDerivative(r, h) {
        if (r >= h) return 0;
        const grad = (945.0 / (32.0 * Math.PI * Math.pow(h, 9)));
        const term = h * h - r * r;
        return -grad * r * term * term;
    }
    
    _viscosityKernel(r, h) {
        if (r >= h) return 0;
        const volume = (45.0 / (Math.PI * Math.pow(h, 6)));
        return volume * (h - r);
    }
    
    /**
     * Calculate density and pressure for all particles
     */
    _computeDensitiesAndPressure() {
        for (let i = 0; i < this.activeCount; i++) {
            const particle = this.particles[i];
            if (particle.isBoundary) {
                particle.density = this.restDensity;
                particle.pressure = 0;
                continue;
            }
            
            let density = 0;
            const neighbors = this._getNeighbors(particle);
            
            for (const neighbor of neighbors) {
                const r = particle.position.distanceTo(neighbor.position);
                density += neighbor.mass * this._sphKernel(r, this.smoothingRadius);
            }
            
            particle.density = Math.max(density, this.restDensity * 0.1);
            particle.pressure = this.gasConstant * (particle.density - this.restDensity);
        }
    }
    
    /**
     * Compute forces for all particles
     */
    _computeForces() {
        for (let i = 0; i < this.activeCount; i++) {
            const particle = this.particles[i];
            if (particle.isBoundary) continue;
            
            const pressureForce = new Vector3();
            const viscosityForce = new Vector3();
            const surfaceForce = new Vector3();
            
            const neighbors = this._getNeighbors(particle);
            
            for (const neighbor of neighbors) {
                if (neighbor === particle || neighbor.isBoundary) continue;
                
                const r = particle.position.distanceTo(neighbor.position);
                if (r >= this.smoothingRadius || r < 1e-6) continue;
                
                const direction = new Vector3()
                    .subVectors(neighbor.position, particle.position)
                    .divideScalar(r);
                
                // Pressure force
                const pressureTerm = (particle.pressure + neighbor.pressure) / (2 * neighbor.density);
                const kernel = this._sphKernelDerivative(r, this.smoothingRadius);
                pressureForce.addScaledVector(direction, -neighbor.mass * pressureTerm * kernel);
                
                // Viscosity force
                const relativeVelocity = new Vector3()
                    .subVectors(neighbor.velocity, particle.velocity);
                const viscosityKernel = this._viscosityKernel(r, this.smoothingRadius);
                viscosityForce.addScaledVector(
                    relativeVelocity,
                    this.viscosity * neighbor.mass * viscosityKernel / neighbor.density
                );
                
                // Surface tension
                const colorField = neighbor.density - this.restDensity;
                if (colorField < 0) {
                    const tensionKernel = this._sphKernelDerivative(r, this.smoothingRadius);
                    surfaceForce.addScaledVector(direction, -this.surfaceTension * neighbor.mass * tensionField / neighbor.density);
                }
            }
            
            // Gravity force
            const gravityForce = new Vector3()
                .copy(this.gravity)
                .multiplyScalar(particle.density);
            
            // Total acceleration
            particle.acceleration
                .copy(pressureForce)
                .add(viscosityForce)
                .add(surfaceForce)
                .add(gravityForce)
                .multiplyScalar(1 / particle.density);
        }
    }
    
    /**
     * Integrate particle positions and velocities
     */
    _integrate(dt) {
        for (let i = 0; i < this.activeCount; i++) {
            const particle = this.particles[i];
            if (particle.isBoundary) continue;
            
            // Semi-implicit Euler integration
            particle.velocity.addScaledVector(particle.acceleration, dt);
            particle.position.addScaledVector(particle.velocity, dt);
            
            // Boundary collision
            this._handleBoundaryCollision(particle);
            
            // Reset acceleration
            particle.acceleration.set(0, 0, 0);
        }
    }
    
    /**
     * Handle boundary collision
     */
    _handleBoundaryCollision(particle) {
        const { min, max } = this.bounds;
        const damping = this.boundaryDamping;
        
        // X-axis collision
        if (particle.position.x < min.x) {
            particle.position.x = min.x;
            particle.velocity.x = Math.abs(particle.velocity.x) * damping;
        } else if (particle.position.x > max.x) {
            particle.position.x = max.x;
            particle.velocity.x = -Math.abs(particle.velocity.x) * damping;
        }
        
        // Y-axis collision
        if (particle.position.y < min.y) {
            particle.position.y = min.y;
            particle.velocity.y = Math.abs(particle.velocity.y) * damping;
        } else if (particle.position.y > max.y) {
            particle.position.y = max.y;
            particle.velocity.y = -Math.abs(particle.velocity.y) * damping;
        }
        
        // Z-axis collision
        if (particle.position.z < min.z) {
            particle.position.z = min.z;
            particle.velocity.z = Math.abs(particle.velocity.z) * damping;
        } else if (particle.position.z > max.z) {
            particle.position.z = max.z;
            particle.velocity.z = -Math.abs(particle.velocity.z) * damping;
        }
    }
    
    /**
     * Update simulation
     */
    update(deltaTime) {
        this.dt = Math.min(deltaTime / this.substeps, 1/120); // Cap dt for stability
        
        for (let step = 0; step < this.substeps; step++) {
            this._buildSpatialGrid();
            this._computeDensitiesAndPressure();
            this._computeForces();
            this._integrate(this.dt);
        }
        
        this._updateGeometry();
    }
    
    /**
     * Update rendering geometry
     */
    _updateGeometry() {
        // Update position buffer
        for (let i = 0; i < this.activeCount; i++) {
            const particle = this.particles[i];
            const posIndex = i * 3;
            
            this.geometry.positions[posIndex] = particle.position.x;
            this.geometry.positions[posIndex + 1] = particle.position.y;
            this.geometry.positions[posIndex + 2] = particle.position.z;
            
            // Update color based on velocity and density
            const speed = particle.velocity.length();
            const densityFactor = Math.min(particle.density / this.restDensity, 2.0);
            
            const colorIndex = i * 4;
            this.geometry.colors[colorIndex] = this.color.r * densityFactor;
            this.geometry.colors[colorIndex + 1] = this.color.g * densityFactor;
            this.geometry.colors[colorIndex + 2] = this.color.b * densityFactor;
            this.geometry.colors[colorIndex + 3] = Math.min(speed * 0.1, 1.0);
        }
        
        this.geometry.drawCount = this.activeCount;
    }
    
    /**
     * Add particle emitter
     */
    addEmitter(position, rate = 100) {
        // Implementation for continuous particle emission
        const emitInterval = 1.0 / rate;
        this.emitTimer = (this.emitTimer || 0) + this.dt;
        
        while (this.emitTimer >= emitInterval && this.activeCount < this.maxParticles) {
            this.emitTimer -= emitInterval;
            
            const particle = this.particlePool[this.activeCount];
            particle.position.copy(position);
            particle.position.x += (Math.random() - 0.5) * 0.5;
            particle.position.z += (Math.random() - 0.5) * 0.5;
            particle.velocity.set(0, 0, 0);
            particle.acceleration.set(0, 0, 0);
            particle.isBoundary = false;
            
            this.particles[this.activeCount] = particle;
            this.activeCount++;
        }
    }
    
    /**
     * Apply force to particles in a region
     */
    applyForce(center, radius, force) {
        const radiusSq = radius * radius;
        
        for (let i = 0; i < this.activeCount; i++) {
            const particle = this.particles[i];
            if (particle.isBoundary) continue;
            
            const distSq = particle.position.distanceToSquared(center);
            if (distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                const strength = 1.0 - (dist / radius);
                particle.acceleration.addScaledVector(force, strength);
            }
        }
    }
    
    /**
     * Get simulation statistics
     */
    getStats() {
        return {
            activeParticles: this.activeCount,
            averageDensity: this.particles.slice(0, this.activeCount)
                .reduce((sum, p) => sum + p.density, 0) / this.activeCount || 0,
            averagePressure: this.particles.slice(0, this.activeCount)
                .reduce((sum, p) => sum + p.pressure, 0) / this.activeCount || 0,
            kineticEnergy: this.particles.slice(0, this.activeCount)
                .reduce((sum, p) => sum + 0.5 * p.density * p.velocity.lengthSq(), 0) / 2
        };
    }
    
    /**
     * Clear all particles
     */
    clear() {
        this.activeCount = 0;
        this.particles.length = 0;
        this.geometry.drawCount = 0;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        this.clear();
        this.particlePool = [];
        if (this.geometry && this.geometry.positions) {
            this.geometry.positions = null;
            this.geometry.colors = null;
        }
    }
}

/**
 * Create a dam break simulation
 */
export function createDamBreakSimulation(options = {}) {
    const simulation = new FluidSimulation({
        ...options,
        particleRadius: options.particleRadius || 0.05,
        smoothingRadius: options.smoothingRadius || 0.15,
        restDensity: options.restDensity || 1000
    });
    
    // Create initial fluid column
    const particles = [];
    const columnWidth = options.columnWidth || 2;
    const columnHeight = options.columnHeight || 8;
    const columnDepth = options.columnDepth || 2;
    const spacing = simulation.particleRadius * 2;
    
    for (let x = -columnWidth / 2; x < columnWidth / 2; x += spacing) {
        for (let y = 0; y < columnHeight; y += spacing) {
            for (let z = -columnDepth / 2; z < columnDepth / 2; z += spacing) {
                particles.push(new Vector3(x, y, z));
            }
        }
    }
    
    simulation.addParticles(particles);
    simulation.setupBoundaries();
    
    return simulation;
}

/**
 * Create a water splash simulation
 */
export function createWaterSplashSimulation(options = {}) {
    const simulation = new FluidSimulation({
        ...options,
        particleRadius: options.particleRadius || 0.03,
        smoothingRadius: options.smoothingRadius || 0.12,
        restDensity: options.restDensity || 1000,
        viscosity: options.viscosity || 0.05
    });
    
    simulation.setupBoundaries();
    
    return simulation;
}
