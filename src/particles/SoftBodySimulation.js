import { Vector3, Color } from '../core/math/index.js';
import { Object3D } from '../core/Object3D.js';

/**
 * Soft Body Particle with Verlet integration for realistic cloth and soft body simulation
 */
export class SoftBodyParticle {
    constructor() {
        this.position = new Vector3();
        this.previousPosition = new Vector3();
        this.acceleration = new Vector3();
        this.mass = 1.0;
        this.invMass = 1.0;
        this.pinned = false;
        this.uv = new Vector2(0, 0);
    }
}

/**
 * Constraint between two particles
 */
export class Constraint {
    constructor(particle1, particle2, restLength, stiffness = 0.9) {
        this.p1 = particle1;
        this.p2 = particle2;
        this.restLength = restLength;
        this.stiffness = stiffness;
        this.type = 'distance'; // distance, bend, shear
    }
    
    /**
     * Solve constraint using position-based dynamics
     */
    solve() {
        if (this.p1.pinned && this.p2.pinned) return;
        
        const diff = new Vector3().subVectors(this.p2.position, this.p1.position);
        const currentLength = diff.length();
        
        if (currentLength === 0) return;
        
        const correction = diff.multiplyScalar((currentLength - this.restLength) / currentLength * this.stiffness);
        
        if (!this.p1.pinned) {
            this.p1.position.addScaledVector(correction, 0.5);
        }
        if (!this.p2.pinned) {
            this.p2.position.addScaledVector(correction, -0.5);
        }
    }
}

/**
 * Soft Body Simulation supporting cloth and soft body dynamics
 */
export class SoftBodySimulation extends Object3D {
    constructor(options = {}) {
        super();
        
        // Core properties
        this.particles = [];
        this.constraints = [];
        this.iterations = options.iterations || 5;
        this.gravity = new Vector3(0, -9.81, 0);
        this.damping = options.damping || 0.99;
        this.wind = new Vector3(0, 0, 0);
        
        // Cloth properties
        this.width = options.width || 10;
        this.height = options.height || 10;
        this.segmentsX = options.segmentsX || 20;
        this.segmentsY = options.segmentsY || 20;
        this.pinCorners = options.pinCorners !== false;
        
        // Material properties
        this.stiffness = options.stiffness || 0.9;
        this.bendStiffness = options.bendStiffness || 0.3;
        this.shearStiffness = options.shearStiffness || 0.9;
        
        // Rendering
        this.pointSize = options.pointSize || 0.1;
        this.color = options.color || new Color(1.0, 0.8, 0.6);
        this.geometry = null;
        this.material = null;
        
        // Performance
        this.maxSubsteps = options.maxSubsteps || 3;
        this.enableWind = options.enableWind || false;
        
        // Collision detection
        this.colliders = [];
        this.enableCollisions = options.enableCollisions || false;
        
        this._createCloth();
        this._setupGeometry();
    }
    
    /**
     * Create cloth mesh with particles and constraints
     */
    _createCloth() {
        const particlesPerRow = this.segmentsX + 1;
        const particlesPerCol = this.segmentsY + 1;
        const totalParticles = particlesPerRow * particlesPerCol;
        
        // Create particles
        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const particle = new SoftBodyParticle();
                
                // Position particles in a grid
                const u = x / this.segmentsX;
                const v = y / this.segmentsY;
                
                particle.position.set(
                    (u - 0.5) * this.width,
                    this.height * (1 - v), // Flip Y for cloth hanging down
                    0
                );
                
                particle.previousPosition.copy(particle.position);
                particle.uv.set(u, v);
                
                // Pin top corners
                if (this.pinCorners && (y === 0) && (x === 0 || x === this.segmentsX)) {
                    particle.pinned = true;
                }
                
                this.particles.push(particle);
            }
        }
        
        // Create constraints
        this._createConstraints();
    }
    
    /**
     * Create distance, bend, and shear constraints
     */
    _createConstraints() {
        const particlesPerRow = this.segmentsX + 1;
        
        // Distance constraints (structural)
        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const current = this.particles[y * particlesPerRow + x];
                
                // Horizontal constraint
                if (x < this.segmentsX) {
                    const right = this.particles[y * particlesPerRow + x + 1];
                    const restLength = current.position.distanceTo(right.position);
                    this.constraints.push(new Constraint(current, right, restLength, this.stiffness));
                }
                
                // Vertical constraint
                if (y < this.segmentsY) {
                    const bottom = this.particles[(y + 1) * particlesPerRow + x];
                    const restLength = current.position.distanceTo(bottom.position);
                    this.constraints.push(new Constraint(current, bottom, restLength, this.stiffness));
                }
            }
        }
        
        // Bend constraints (second-order neighbors)
        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const current = this.particles[y * particlesPerRow + x];
                
                // Horizontal bend
                if (x < this.segmentsX - 1) {
                    const farRight = this.particles[y * particlesPerRow + x + 2];
                    const restLength = current.position.distanceTo(farRight.position);
                    this.constraints.push(new Constraint(current, farRight, restLength, this.bendStiffness));
                }
                
                // Vertical bend
                if (y < this.segmentsY - 1) {
                    const farBottom = this.particles[(y + 2) * particlesPerRow + x];
                    const restLength = current.position.distanceTo(farBottom.position);
                    this.constraints.push(new Constraint(current, farBottom, restLength, this.bendStiffness));
                }
            }
        }
        
        // Shear constraints (diagonal)
        for (let y = 0; y < this.segmentsY; y++) {
            for (let x = 0; x < this.segmentsX; x++) {
                const current = this.particles[y * particlesPerRow + x];
                const right = this.particles[y * particlesPerRow + x + 1];
                const bottom = this.particles[(y + 1) * particlesPerRow + x];
                const diagonal = this.particles[(y + 1) * particlesPerRow + x + 1];
                
                // Shear constraints
                const restLength1 = current.position.distanceTo(diagonal.position);
                const restLength2 = right.position.distanceTo(bottom.position);
                
                this.constraints.push(new Constraint(current, diagonal, restLength1, this.shearStiffness));
                this.constraints.push(new Constraint(right, bottom, restLength2, this.shearStiffness));
            }
        }
    }
    
    _setupGeometry() {
        // Setup rendering buffers
        this.geometry = {
            positions: new Float32Array(this.particles.length * 3),
            colors: new Float32Array(this.particles.length * 4),
            uvs: new Float32Array(this.particles.length * 2),
            indices: [],
            drawCount: 0
        };
        
        // Create UVs for all particles
        for (let i = 0; i < this.particles.length; i++) {
            const uvIndex = i * 2;
            this.geometry.uvs[uvIndex] = this.particles[i].uv.x;
            this.geometry.uvs[uvIndex + 1] = this.particles[i].uv.y;
        }
        
        // Create triangle indices for cloth surface
        for (let y = 0; y < this.segmentsY; y++) {
            for (let x = 0; x < this.segmentsX; x++) {
                const topLeft = y * (this.segmentsX + 1) + x;
                const topRight = topLeft + 1;
                const bottomLeft = (y + 1) * (this.segmentsX + 1) + x;
                const bottomRight = bottomLeft + 1;
                
                // First triangle
                this.geometry.indices.push(topLeft, topRight, bottomLeft);
                // Second triangle
                this.geometry.indices.push(topRight, bottomRight, bottomLeft);
            }
        }
    }
    
    /**
     * Verlet integration step
     */
    _integrate(deltaTime) {
        const dtSq = deltaTime * deltaTime;
        const dt = deltaTime;
        
        for (const particle of this.particles) {
            if (particle.pinned) {
                particle.acceleration.set(0, 0, 0);
                continue;
            }
            
            // Verlet integration
            const temp = particle.position.clone();
            const velocity = particle.position.clone().sub(particle.previousPosition).multiplyScalar(this.damping);
            
            particle.position.add(velocity);
            particle.position.addScaledVector(particle.acceleration, dtSq);
            
            particle.previousPosition.copy(temp);
            
            // Apply gravity
            particle.acceleration.addScaledVector(this.gravity, dtSq);
            
            // Apply wind force
            if (this.enableWind) {
                particle.acceleration.addScaledVector(this.wind, dtSq);
            }
            
            // Reset acceleration
            particle.acceleration.set(0, 0, 0);
        }
    }
    
    /**
     * Solve all constraints
     */
    _satisfyConstraints() {
        for (let i = 0; i < this.iterations; i++) {
            for (const constraint of this.constraints) {
                constraint.solve();
            }
            
            // Handle collisions each iteration for better stability
            if (this.enableCollisions) {
                this._handleCollisions();
            }
        }
    }
    
    /**
     * Handle sphere and plane collisions
     */
    _handleCollisions() {
        for (const particle of this.particles) {
            if (particle.pinned) continue;
            
            // Sphere collisions
            for (const collider of this.colliders) {
                if (collider.type === 'sphere') {
                    const toParticle = new Vector3().subVectors(particle.position, collider.center);
                    const distance = toParticle.length();
                    
                    if (distance < collider.radius) {
                        toParticle.normalize().multiplyScalar(collider.radius);
                        particle.position.copy(collider.center).add(toParticle);
                    }
                }
                // Plane collision
                else if (collider.type === 'plane') {
                    const distance = particle.position.dot(collider.normal) + collider.distance;
                    
                    if (distance < 0) {
                        particle.position.addScaledVector(collider.normal, -distance);
                    }
                }
            }
        }
    }
    
    /**
     * Update wind forces based on cloth normal
     */
    _updateWind(deltaTime) {
        if (!this.enableWind) return;
        
        const windStrength = 10;
        const time = performance.now() * 0.001;
        
        for (let y = 1; y < this.segmentsY; y++) {
            for (let x = 1; x < this.segmentsX; x++) {
                const current = this.particles[y * (this.segmentsX + 1) + x];
                const left = this.particles[y * (this.segmentsX + 1) + x - 1];
                const above = this.particles[(y - 1) * (this.segmentsX + 1) + x];
                
                // Calculate face normal
                const v1 = new Vector3().subVectors(left.position, current.position);
                const v2 = new Vector3().subVectors(above.position, current.position);
                const normal = new Vector3().crossVectors(v1, v2).normalize();
                
                // Apply wind force based on normal and time
                const windFactor = Math.sin(time + x * 0.1 + y * 0.1) * 0.5 + 0.5;
                const windForce = new Vector3()
                    .copy(this.wind)
                    .multiplyScalar(windStrength * windFactor)
                    .multiplyScalar(Math.abs(normal.dot(this.wind)));
                
                current.acceleration.add(windForce);
            }
        }
    }
    
    /**
     * Main simulation update
     */
    update(deltaTime) {
        // Substepping for stability
        const substeps = Math.min(Math.ceil(deltaTime / 0.016), this.maxSubsteps);
        const dt = deltaTime / substeps;
        
        for (let i = 0; i < substeps; i++) {
            this._updateWind(dt);
            this._integrate(dt);
            this._satisfyConstraints();
        }
        
        this._updateGeometry();
    }
    
    /**
     * Update rendering geometry
     */
    _updateGeometry() {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const posIndex = i * 3;
            
            this.geometry.positions[posIndex] = particle.position.x;
            this.geometry.positions[posIndex + 1] = particle.position.y;
            this.geometry.positions[posIndex + 2] = particle.position.z;
            
            // Color based on velocity and position
            const velocity = particle.position.clone().sub(particle.previousPosition);
            const speed = velocity.length();
            const strain = Math.min(speed * 10, 1.0);
            
            const colorIndex = i * 4;
            this.geometry.colors[colorIndex] = this.color.r * (1 - strain) + 1.0 * strain;
            this.geometry.colors[colorIndex + 1] = this.color.g * (1 - strain) + 0.2 * strain;
            this.geometry.colors[colorIndex + 2] = this.color.b * (1 - strain) + 0.2 * strain;
            this.geometry.colors[colorIndex + 3] = 1.0;
        }
        
        this.geometry.drawCount = this.particles.length;
    }
    
    /**
     * Add sphere collider
     */
    addSphereCollider(center, radius) {
        this.colliders.push({
            type: 'sphere',
            center: center.clone(),
            radius: radius
        });
    }
    
    /**
     * Add plane collider
     */
    addPlaneCollider(normal, distance) {
        this.colliders.push({
            type: 'plane',
            normal: normal.clone().normalize(),
            distance: distance
        });
    }
    
    /**
     * Pin specific particles
     */
    pinParticle(index) {
        if (index >= 0 && index < this.particles.length) {
            this.particles[index].pinned = true;
        }
    }
    
    /**
     * Unpin particles
     */
    unpinParticle(index) {
        if (index >= 0 && index < this.particles.length) {
            this.particles[index].pinned = false;
        }
    }
    
    /**
     * Apply impulse to a particle
     */
    applyImpulse(index, impulse) {
        if (index >= 0 && index < this.particles.length) {
            const particle = this.particles[index];
            const velocity = particle.position.clone().sub(particle.previousPosition);
            velocity.add(impulse);
            particle.previousPosition.copy(particle.position).sub(velocity);
        }
    }
    
    /**
     * Set wind force
     */
    setWind(windVector) {
        this.wind.copy(windVector);
    }
    
    /**
     * Enable/disable wind
     */
    setWindEnabled(enabled) {
        this.enableWind = enabled;
    }
    
    /**
     * Get cloth statistics
     */
    getStats() {
        const totalMass = this.particles.reduce((sum, p) => sum + p.mass, 0);
        const averageVelocity = this.particles.reduce((sum, p) => {
            const velocity = p.position.clone().sub(p.previousPosition);
            return sum + velocity.length();
        }, 0) / this.particles.length;
        
        return {
            particles: this.particles.length,
            constraints: this.constraints.length,
            iterations: this.iterations,
            totalMass: totalMass,
            averageVelocity: averageVelocity,
            pinnedParticles: this.particles.filter(p => p.pinned).length
        };
    }
    
    /**
     * Create hanging cloth
     */
    static createHangingCloth(width = 8, height = 8, segments = 20) {
        return new SoftBodySimulation({
            width: width,
            height: height,
            segmentsX: segments,
            segmentsY: segments,
            pinCorners: true,
            damping: 0.98,
            stiffness: 0.9
        });
    }
    
    /**
     * Create suspended sheet
     */
    static createSuspendedSheet(width = 10, height = 10, segments = 15) {
        return new SoftBodySimulation({
            width: width,
            height: height,
            segmentsX: segments,
            segmentsY: segments,
            pinCorners: false,
            damping: 0.99,
            stiffness: 0.8,
            enableWind: true
        });
    }
    
    /**
     * Create cloth flag
     */
    static createFlag(width = 12, height = 8, segments = 24) {
        const cloth = new SoftBodySimulation({
            width: width,
            height: height,
            segmentsX: segments,
            segmentsY: segments,
            pinCorners: false,
            damping: 0.97,
            stiffness: 0.85,
            enableWind: true,
            wind: new Vector3(5, 0, 0)
        });
        
        // Pin left edge
        for (let y = 0; y <= segments; y++) {
            const index = y * (segments + 1);
            cloth.particles[index].pinned = true;
        }
        
        return cloth;
    }
    
    /**
     * Dispose resources
     */
    dispose() {
        this.particles = [];
        this.constraints = [];
        this.colliders = [];
        
        if (this.geometry) {
            this.geometry.positions = null;
            this.geometry.colors = null;
            this.geometry.uvs = null;
            this.geometry.indices = null;
        }
    }
}

/**
 * Soft body rope simulation
 */
export class SoftBodyRope extends Object3D {
    constructor(options = {}) {
        super();
        
        this.points = options.points || 20;
        this.length = options.length || 5;
        this.gravity = new Vector3(0, -9.81, 0);
        this.damping = options.damping || 0.98;
        this.pinStart = options.pinStart !== false;
        this.pinEnd = options.pinEnd || false;
        
        this.particles = [];
        this.constraints = [];
        this._createRope();
    }
    
    _createRope() {
        // Create particles
        for (let i = 0; i < this.points; i++) {
            const particle = new SoftBodyParticle();
            particle.position.set(0, this.length - (i / this.points) * this.length, 0);
            particle.previousPosition.copy(particle.position);
            
            if (i === 0 && this.pinStart) {
                particle.pinned = true;
            }
            if (i === this.points - 1 && this.pinEnd) {
                particle.pinned = true;
            }
            
            this.particles.push(particle);
        }
        
        // Create constraints between adjacent particles
        for (let i = 0; i < this.points - 1; i++) {
            const p1 = this.particles[i];
            const p2 = this.particles[i + 1];
            const restLength = this.length / this.points;
            this.constraints.push(new Constraint(p1, p2, restLength, 0.9));
        }
    }
    
    update(deltaTime) {
        const dtSq = deltaTime * deltaTime;
        const dt = deltaTime;
        
        // Verlet integration
        for (const particle of this.particles) {
            if (particle.pinned) continue;
            
            const temp = particle.position.clone();
            const velocity = particle.position.clone().sub(particle.previousPosition).multiplyScalar(this.damping);
            
            particle.position.add(velocity);
            particle.position.addScaledVector(this.gravity, dtSq);
            particle.previousPosition.copy(temp);
        }
        
        // Solve constraints
        for (let i = 0; i < 5; i++) {
            for (const constraint of this.constraints) {
                constraint.solve();
            }
        }
        
        this._updateGeometry();
    }
    
    _updateGeometry() {
        // Update rope geometry for rendering
        this.geometry = {
            positions: new Float32Array(this.points * 3),
            drawCount: this.points
        };
        
        for (let i = 0; i < this.points; i++) {
            const particle = this.particles[i];
            const posIndex = i * 3;
            this.geometry.positions[posIndex] = particle.position.x;
            this.geometry.positions[posIndex + 1] = particle.position.y;
            this.geometry.positions[posIndex + 2] = particle.position.z;
        }
    }
    
    /**
     * Apply force to rope segment
     */
    applyForce(force) {
        for (const particle of this.particles) {
            if (!particle.pinned) {
                particle.acceleration.add(force);
            }
        }
    }
    
    dispose() {
        this.particles = [];
        this.constraints = [];
    }
}
