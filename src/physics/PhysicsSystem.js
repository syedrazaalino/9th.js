/**
 * Basic Physics System
 * Provides rigid body physics, collision detection, gravity, and constraints
 * with performance optimization for real-time physics simulation
 */

import { Vector3, Matrix4, Quaternion } from '../core/math/index.js';

/**
 * Rigid Body Component
 * Represents a physics body with mass, velocity, and forces
 */
class RigidBody {
    constructor(id, options = {}) {
        this.id = id;
        this.position = new Vector3(
            options.position?.x || 0,
            options.position?.y || 0,
            options.position?.z || 0
        );
        this.velocity = new Vector3(0, 0, 0);
        this.acceleration = new Vector3(0, 0, 0);
        
        // Rotation
        this.rotation = new Quaternion();
        this.angularVelocity = new Vector3(0, 0, 0);
        this.angularAcceleration = new Vector3(0, 0, 0);
        
        // Physical properties
        this.mass = options.mass || 1.0;
        this.inverseMass = this.mass > 0 ? 1.0 / this.mass : 0;
        this.restitution = options.restitution || 0.5;
        this.friction = options.friction || 0.5;
        this.isStatic = options.isStatic || false;
        this.isKinematic = options.isKinematic || false;
        
        // Collider
        this.collider = options.collider || { type: 'sphere', radius: 0.5 };
        this.colliderOffset = options.colliderOffset || new Vector3(0, 0, 0);
        
        // Forces
        this.netForce = new Vector3(0, 0, 0);
        this.netTorque = new Vector3(0, 0, 0);
        this.linearDamping = options.linearDamping || 0.99;
        this.angularDamping = options.angularDamping || 0.99;
        
        // State
        this.isSleeping = false;
        this.sleepTimer = 0;
        
        // User data
        this.userData = options.userData || {};
    }
    
    addForce(force) {
        if (!this.isStatic && !this.isSleeping) {
            this.netForce.add(force);
        }
    }
    
    addTorque(torque) {
        if (!this.isStatic && !this.isSleeping) {
            this.netTorque.add(torque);
        }
    }
    
    applyImpulse(impulse) {
        if (!this.isStatic) {
            this.velocity.add(impulse.clone().multiplyScalar(this.inverseMass));
        }
    }
    
    applyAngularImpulse(impulse) {
        if (!this.isStatic) {
            this.angularVelocity.add(impulse.clone().multiplyScalar(this.inverseMass));
        }
    }
    
    setPosition(position) {
        this.position.copy(position);
    }
    
    setRotation(rotation) {
        this.rotation.copy(rotation);
    }
    
    integrate(dt) {
        if (this.isStatic || this.isSleeping) return;
        
        // Linear motion
        if (!this.isKinematic) {
            // F = ma, so a = F/m
            this.acceleration.copy(this.netForce.clone().multiplyScalar(this.inverseMass));
            this.velocity.add(this.acceleration.clone().multiplyScalar(dt));
            this.velocity.multiplyScalar(this.linearDamping);
            this.position.add(this.velocity.clone().multiplyScalar(dt));
        }
        
        // Angular motion
        if (!this.isKinematic) {
            // τ = Iα, simplified angular acceleration
            this.angularAcceleration.copy(this.netTorque.clone().multiplyScalar(this.inverseMass));
            this.angularVelocity.add(this.angularAcceleration.clone().multiplyScalar(dt));
            this.angularVelocity.multiplyScalar(this.angularDamping);
            
            // Update rotation from angular velocity
            const angularSpeed = this.angularVelocity.length();
            if (angularSpeed > 0) {
                const axis = this.angularVelocity.clone().normalize();
                const angle = angularSpeed * dt;
                const deltaRotation = new Quaternion().setFromAxisAngle(axis, angle);
                this.rotation.multiply(deltaRotation);
                this.rotation.normalize();
            }
        }
        
        // Clear forces
        this.netForce.set(0, 0, 0);
        this.netTorque.set(0, 0, 0);
        
        // Sleep detection
        if (this.velocity.length() < 0.01 && this.angularVelocity.length() < 0.01) {
            this.sleepTimer += dt;
            if (this.sleepTimer > 0.5) { // Sleep after 0.5 seconds of minimal movement
                this.isSleeping = true;
                this.velocity.set(0, 0, 0);
                this.angularVelocity.set(0, 0, 0);
            }
        } else {
            this.sleepTimer = 0;
        }
    }
    
    wake() {
        this.isSleeping = false;
        this.sleepTimer = 0;
    }
}

/**
 * Collision Shapes
 */
class CollisionShapes {
    // Axis-Aligned Bounding Box
    static createAABB(min, max) {
        const center = min.clone().add(max).multiplyScalar(0.5);
        const halfExtents = max.clone().sub(center);
        return {
            type: 'aabb',
            center,
            halfExtents,
            min: min.clone(),
            max: max.clone()
        };
    }
    
    // Sphere
    static createSphere(center, radius) {
        return {
            type: 'sphere',
            center: center.clone(),
            radius
        };
    }
    
    // Oriented Bounding Box
    static createOBB(center, halfExtents, orientation) {
        return {
            type: 'obb',
            center: center.clone(),
            halfExtents: halfExtents.clone(),
            orientation: orientation.clone()
        };
    }
}

/**
 * Collision Detection System
 */
class CollisionDetector {
    static aabbVsAABB(a, b) {
        const minA = a.min;
        const maxA = a.max;
        const minB = b.min;
        const maxB = b.max;
        
        if (minA.x > maxB.x || maxA.x < minB.x ||
            minA.y > maxB.y || maxA.y < minB.y ||
            minA.z > maxB.z || maxA.z < minB.z) {
            return null; // No collision
        }
        
        // Calculate overlap
        const overlap = new Vector3(
            Math.min(maxA.x, maxB.x) - Math.max(minA.x, minB.x),
            Math.min(maxA.y, maxB.y) - Math.max(minA.y, minB.y),
            Math.min(maxA.z, maxB.z) - Math.max(minA.z, minB.z)
        );
        
        // Find minimum penetration axis
        let normal = new Vector3(0, 0, 0);
        let penetration = overlap.x;
        
        if (overlap.y < penetration) {
            penetration = overlap.y;
            normal.set(0, overlap.y > 0 ? 1 : -1, 0);
        }
        if (overlap.z < penetration) {
            penetration = overlap.z;
            normal.set(0, 0, overlap.z > 0 ? 1 : -1);
        }
        if (overlap.x < penetration) {
            penetration = overlap.x;
            normal.set(overlap.x > 0 ? 1 : -1, 0, 0);
        }
        
        const contactPoint = a.center.clone().add(b.center).multiplyScalar(0.5);
        
        return {
            normal,
            penetration: penetration * 0.5,
            contactPoint,
            shapeA: a,
            shapeB: b
        };
    }
    
    static sphereVsSphere(a, b) {
        const delta = b.center.clone().sub(a.center);
        const distance = delta.length();
        const radiusSum = a.radius + b.radius;
        
        if (distance >= radiusSum) return null;
        
        const normal = distance > 0 ? delta.normalize() : new Vector3(1, 0, 0);
        const penetration = radiusSum - distance;
        const contactPoint = a.center.clone().add(normal.clone().multiplyScalar(a.radius));
        
        return {
            normal,
            penetration,
            contactPoint,
            shapeA: a,
            shapeB: b
        };
    }
    
    static aabbVsSphere(aabb, sphere) {
        // Find closest point on AABB to sphere center
        const closestPoint = new Vector3(
            Math.max(aabb.min.x, Math.min(sphere.center.x, aabb.max.x)),
            Math.max(aabb.min.y, Math.min(sphere.center.y, aabb.max.y)),
            Math.max(aabb.min.z, Math.min(sphere.center.z, aabb.max.z))
        );
        
        const delta = sphere.center.clone().sub(closestPoint);
        const distance = delta.length();
        
        if (distance >= sphere.radius) return null;
        
        const normal = distance > 0 ? delta.normalize() : new Vector3(1, 0, 0);
        const penetration = sphere.radius - distance;
        const contactPoint = closestPoint;
        
        return {
            normal,
            penetration,
            contactPoint,
            shapeA: aabb,
            shapeB: sphere
        };
    }
    
    static obbVsObb(a, b) {
        // Simplified OBB collision - in practice, use SAT (Separating Axis Theorem)
        // For now, treat as AABB for performance
        const aabbA = {
            min: a.center.clone().sub(a.halfExtents),
            max: a.center.clone().add(a.halfExtents)
        };
        
        const aabbB = {
            min: b.center.clone().sub(b.halfExtents),
            max: b.center.clone().add(b.halfExtents)
        };
        
        return this.aabbVsAABB(aabbA, aabbB);
    }
    
    static getShapeFromBody(body) {
        const localCenter = body.position.clone().add(body.colliderOffset);
        const worldCenter = localCenter;
        
        switch (body.collider.type) {
            case 'sphere':
                return {
                    type: 'sphere',
                    center: worldCenter,
                    radius: body.collider.radius
                };
            case 'aabb':
                return {
                    type: 'aabb',
                    center: worldCenter,
                    halfExtents: body.collider.halfExtents,
                    min: worldCenter.clone().sub(body.collider.halfExtents),
                    max: worldCenter.clone().add(body.collider.halfExtents)
                };
            case 'obb':
                return {
                    type: 'obb',
                    center: worldCenter,
                    halfExtents: body.collider.halfExtents,
                    orientation: body.rotation
                };
            default:
                // Default to sphere
                return {
                    type: 'sphere',
                    center: worldCenter,
                    radius: body.collider.radius || 0.5
                };
        }
    }
    
    static testCollision(shapeA, shapeB) {
        if (shapeA.type === 'sphere' && shapeB.type === 'sphere') {
            return this.sphereVsSphere(shapeA, shapeB);
        } else if (shapeA.type === 'aabb' && shapeB.type === 'aabb') {
            return this.aabbVsAABB(shapeA, shapeB);
        } else if (shapeA.type === 'aabb' && shapeB.type === 'sphere') {
            return this.aabbVsSphere(shapeA, shapeB);
        } else if (shapeA.type === 'sphere' && shapeB.type === 'aabb') {
            const result = this.aabbVsSphere(shapeB, shapeA);
            if (result) {
                // Flip normal for sphere-AABB order
                result.normal.negate();
                result.shapeA = shapeB;
                result.shapeB = shapeA;
            }
            return result;
        } else if (shapeA.type === 'obb' || shapeB.type === 'obb') {
            return this.obbVsObb(shapeA, shapeB);
        }
        
        return null;
    }
}

/**
 * Broadphase Collision Detection
 * Uses spatial partitioning for performance optimization
 */
class BroadPhase {
    constructor() {
        this.gridSize = 1.0; // Spatial grid cell size
        this.pairs = new Map(); // Body ID pairs that might collide
        this.broadphaseContacts = []; // Cached potential collisions
    }
    
    update(bodies) {
        this.pairs.clear();
        this.broadphaseContacts = [];
        
        // Spatial hashing
        const grid = new Map();
        
        for (const body of bodies) {
            if (body.isStatic) continue;
            
            const shape = CollisionDetector.getShapeFromBody(body);
            const bounds = this.getBounds(shape);
            
            // Insert into grid cells
            const minCell = this.worldToCell(bounds.min);
            const maxCell = this.worldToCell(bounds.max);
            
            for (let x = minCell.x; x <= maxCell.x; x++) {
                for (let y = minCell.y; y <= maxCell.y; y++) {
                    for (let z = minCell.z; z <= maxCell.z; z++) {
                        const key = `${x},${y},${z}`;
                        if (!grid.has(key)) {
                            grid.set(key, []);
                        }
                        grid.get(key).push(body);
                    }
                }
            }
        }
        
        // Find potential collisions
        for (const [key, cellBodies] of grid) {
            for (let i = 0; i < cellBodies.length; i++) {
                for (let j = i + 1; j < cellBodies.length; j++) {
                    const bodyA = cellBodies[i];
                    const bodyB = cellBodies[j];
                    
                    const pairKey = bodyA.id < bodyB.id ? 
                        `${bodyA.id}-${bodyB.id}` : `${bodyB.id}-${bodyA.id}`;
                    
                    if (!this.pairs.has(pairKey)) {
                        this.pairs.set(pairKey, { bodyA, bodyB });
                        this.broadphaseContacts.push({ bodyA, bodyB });
                    }
                }
            }
        }
    }
    
    getBounds(shape) {
        switch (shape.type) {
            case 'sphere':
                return {
                    min: shape.center.clone().sub(new Vector3(shape.radius, shape.radius, shape.radius)),
                    max: shape.center.clone().add(new Vector3(shape.radius, shape.radius, shape.radius))
                };
            case 'aabb':
                return {
                    min: shape.min.clone(),
                    max: shape.max.clone()
                };
            case 'obb':
                return {
                    min: shape.center.clone().sub(shape.halfExtents),
                    max: shape.center.clone().add(shape.halfExtents)
                };
            default:
                return {
                    min: shape.center.clone().sub(new Vector3(0.5, 0.5, 0.5)),
                    max: shape.center.clone().add(new Vector3(0.5, 0.5, 0.5))
                };
        }
    }
    
    worldToCell(worldPos) {
        return {
            x: Math.floor(worldPos.x / this.gridSize),
            y: Math.floor(worldPos.y / this.gridSize),
            z: Math.floor(worldPos.z / this.gridSize)
        };
    }
    
    getPotentialCollisions() {
        return this.broadphaseContacts;
    }
}

/**
 * Physics Constraint System
 */
class Constraint {
    constructor(bodyA, bodyB, options = {}) {
        this.bodyA = bodyA;
        this.bodyB = bodyB;
        this.type = options.type || 'point'; // point, distance, hinge, fixed
        this.anchorA = options.anchorA || new Vector3(0, 0, 0);
        this.anchorB = options.anchorB || new Vector3(0, 0, 0);
        this.distance = options.distance || null;
        this.lowerLimit = options.lowerLimit || null;
        this.upperLimit = options.upperLimit || null;
        this.stiffness = options.stiffness || 1.0;
        this.damping = options.damping || 0.1;
    }
    
    solve() {
        switch (this.type) {
            case 'point':
                return this.solvePointConstraint();
            case 'distance':
                return this.solveDistanceConstraint();
            case 'fixed':
                return this.solveFixedConstraint();
            default:
                return false;
        }
    }
    
    solvePointConstraint() {
        const worldAnchorA = this.bodyA.position.clone().add(this.anchorA);
        const worldAnchorB = this.bodyB.position.clone().add(this.anchorB);
        const delta = worldAnchorB.clone().sub(worldAnchorA);
        const distance = delta.length();
        
        if (distance > 0.001) {
            const correction = delta.multiplyScalar(0.5 * this.stiffness);
            this.bodyA.position.add(correction);
            this.bodyB.position.sub(correction);
            return true;
        }
        return false;
    }
    
    solveDistanceConstraint() {
        if (this.distance === null) return false;
        
        const worldAnchorA = this.bodyA.position.clone().add(this.anchorA);
        const worldAnchorB = this.bodyB.position.clone().add(this.anchorB);
        const delta = worldAnchorB.clone().sub(worldAnchorA);
        const distance = delta.length();
        
        if (Math.abs(distance - this.distance) > 0.001) {
            const direction = delta.normalize();
            const correction = direction.multiplyScalar((distance - this.distance) * 0.5 * this.stiffness);
            
            this.bodyA.position.add(correction);
            this.bodyB.position.sub(correction);
            return true;
        }
        return false;
    }
    
    solveFixedConstraint() {
        // Fixed constraint keeps both bodies at the same position and rotation
        const worldAnchorA = this.bodyA.position.clone().add(this.anchorA);
        const worldAnchorB = this.bodyB.position.clone().add(this.anchorB);
        const delta = worldAnchorB.clone().sub(worldAnchorA);
        
        this.bodyA.position.add(delta.clone().multiplyScalar(0.5));
        this.bodyB.position.sub(delta.clone().multiplyScalar(0.5));
        
        return delta.length() > 0.001;
    }
}

/**
 * Main Physics System
 */
class PhysicsSystem {
    constructor() {
        this.bodies = new Map();
        this.constraints = [];
        this.contacts = [];
        this.gravity = new Vector3(0, -9.81, 0);
        this.broadPhase = new BroadPhase();
        
        // Performance settings
        this.fixedTimeStep = 1 / 60; // 60 FPS
        this.maxSubSteps = 10;
        this.iterations = 10; // Constraint solver iterations
        
        // State
        this.isRunning = false;
        this.accumulator = 0;
        this.lastTime = 0;
        
        // Callbacks
        this.onCollision = null;
        this.onContact = null;
    }
    
    addBody(options) {
        const id = this.bodies.size;
        const body = new RigidBody(id, options);
        this.bodies.set(id, body);
        return body;
    }
    
    removeBody(body) {
        if (this.bodies.has(body.id)) {
            this.bodies.delete(body.id);
        }
    }
    
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }
    
    removeConstraint(constraint) {
        const index = this.constraints.indexOf(constraint);
        if (index > -1) {
            this.constraints.splice(index, 1);
        }
    }
    
    setGravity(gravity) {
        this.gravity.copy(gravity);
    }
    
    step(deltaTime) {
        if (!this.isRunning) return;
        
        // Fixed timestep with accumulator
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.fixedTimeStep && this.stepCount < this.maxSubSteps) {
            this.simulate(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
            this.stepCount++;
        }
        
        if (this.stepCount >= this.maxSubSteps) {
            // Prevent spiral of death
            this.accumulator = 0;
        }
        this.stepCount = 0;
    }
    
    simulate(dt) {
        // Apply gravity and integrate bodies
        for (const body of this.bodies.values()) {
            if (body.isStatic || body.isSleeping) continue;
            
            // Apply gravity
            body.addForce(this.gravity.clone().multiplyScalar(body.mass));
            
            // Integrate motion
            body.integrate(dt);
        }
        
        // Broad phase collision detection
        this.broadPhase.update(Array.from(this.bodies.values()));
        
        // Narrow phase collision detection
        this.contacts = [];
        const potentialCollisions = this.broadPhase.getPotentialCollisions();
        
        for (const { bodyA, bodyB } of potentialCollisions) {
            if (bodyA.isStatic && bodyB.isStatic) continue;
            
            const shapeA = CollisionDetector.getShapeFromBody(bodyA);
            const shapeB = CollisionDetector.getShapeFromBody(bodyB);
            
            const contact = CollisionDetector.testCollision(shapeA, shapeB);
            if (contact) {
                // Add body references to contact
                contact.bodyA = bodyA;
                contact.bodyB = bodyB;
                this.contacts.push(contact);
                
                // Trigger collision callback
                if (this.onCollision) {
                    this.onCollision(contact);
                }
            }
        }
        
        // Resolve collisions
        this.resolveCollisions();
        
        // Solve constraints
        for (let i = 0; i < this.iterations; i++) {
            let anyChanged = false;
            
            // Solve constraints
            for (const constraint of this.constraints) {
                if (constraint.solve()) {
                    anyChanged = true;
                }
            }
            
            // Additional collision resolution in constraint solver
            if (anyChanged) {
                for (const contact of this.contacts) {
                    if (this.resolveContact(contact)) {
                        anyChanged = true;
                    }
                }
            }
            
            if (!anyChanged) break;
        }
        
        // Wake sleeping bodies that were collided with
        for (const contact of this.contacts) {
            if (contact.bodyA.isSleeping) contact.bodyA.wake();
            if (contact.bodyB.isSleeping) contact.bodyB.wake();
        }
    }
    
    resolveCollisions() {
        for (const contact of this.contacts) {
            this.resolveContact(contact);
        }
    }
    
    resolveContact(contact) {
        const { bodyA, bodyB, normal, penetration } = contact;
        
        // Separate bodies
        const totalMass = bodyA.mass + bodyB.mass;
        const correction = normal.clone().multiplyScalar(penetration);
        
        if (bodyA.isStatic && bodyB.isStatic) {
            return false;
        } else if (bodyA.isStatic) {
            bodyB.position.add(correction);
        } else if (bodyB.isStatic) {
            bodyA.position.sub(correction);
        } else {
            bodyA.position.sub(correction.clone().multiplyScalar(bodyB.mass / totalMass));
            bodyB.position.add(correction.clone().multiplyScalar(bodyA.mass / totalMass));
        }
        
        // Calculate relative velocity
        const relativeVelocity = bodyB.velocity.clone().sub(bodyA.velocity);
        const velocityAlongNormal = relativeVelocity.dot(normal);
        
        // Don't resolve if velocities are separating
        if (velocityAlongNormal > 0) {
            return true;
        }
        
        // Calculate restitution (bounciness)
        const e = Math.min(bodyA.restitution, bodyB.restitution);
        
        // Calculate impulse scalar
        const j = -(1 + e) * velocityAlongNormal / 
                 (bodyA.inverseMass + bodyB.inverseMass);
        
        // Apply impulse
        const impulse = normal.clone().multiplyScalar(j);
        bodyA.velocity.sub(impulse.clone().multiplyScalar(bodyA.inverseMass));
        bodyB.velocity.add(impulse.clone().multiplyScalar(bodyB.inverseMass));
        
        // Friction
        const relativeVel = bodyB.velocity.clone().sub(bodyA.velocity);
        const tangent = relativeVel.clone().sub(
            normal.clone().multiplyScalar(relativeVel.dot(normal))
        );
        
        if (tangent.length() > 0.001) {
            tangent.normalize();
            const jt = -relativeVel.dot(tangent) / 
                      (bodyA.inverseMass + bodyB.inverseMass);
            
            const mu = (bodyA.friction + bodyB.friction) * 0.5;
            const frictionImpulse = tangent.clone().multiplyScalar(
                Math.max(-jt, Math.min(jt, j * mu))
            );
            
            bodyA.velocity.sub(frictionImpulse.clone().multiplyScalar(bodyA.inverseMass));
            bodyB.velocity.add(frictionImpulse.clone().multiplyScalar(bodyB.inverseMass));
        }
        
        return true;
    }
    
    // Raycasting for picking and physics queries
    raycast(origin, direction, maxDistance = Infinity) {
        const result = [];
        const normalizedDir = direction.clone().normalize();
        
        for (const body of this.bodies.values()) {
            const shape = CollisionDetector.getShapeFromBody(body);
            const distance = this.rayVsShape(origin, normalizedDir, shape);
            
            if (distance !== null && distance <= maxDistance) {
                result.push({
                    body,
                    distance,
                    point: origin.clone().add(normalizedDir.clone().multiplyScalar(distance))
                });
            }
        }
        
        return result;
    }
    
    rayVsShape(origin, direction, shape) {
        switch (shape.type) {
            case 'sphere':
                return this.rayVsSphere(origin, direction, shape);
            case 'aabb':
                return this.rayVsAABB(origin, direction, shape);
            case 'obb':
                return this.rayVsAABB(origin, direction, shape); // Simplified
            default:
                return null;
        }
    }
    
    rayVsSphere(origin, direction, sphere) {
        const oc = origin.clone().sub(sphere.center);
        const b = oc.dot(direction);
        const c = oc.dot(oc) - sphere.radius * sphere.radius;
        const h = b * b - c;
        
        if (h < 0) return null;
        
        h = Math.sqrt(h);
        const t1 = -b - h;
        const t2 = -b + h;
        
        return t1 >= 0 ? t1 : (t2 >= 0 ? t2 : null);
    }
    
    rayVsAABB(origin, direction, aabb) {
        let tmin = 0;
        let tmax = Infinity;
        
        // X-axis
        if (Math.abs(direction.x) < 1e-8) {
            if (origin.x < aabb.min.x || origin.x > aabb.max.x) return null;
        } else {
            const tx1 = (aabb.min.x - origin.x) / direction.x;
            const tx2 = (aabb.max.x - origin.x) / direction.x;
            tmin = Math.max(tmin, Math.min(tx1, tx2));
            tmax = Math.min(tmax, Math.max(tx1, tx2));
        }
        
        // Y-axis
        if (Math.abs(direction.y) < 1e-8) {
            if (origin.y < aabb.min.y || origin.y > aabb.max.y) return null;
        } else {
            const ty1 = (aabb.min.y - origin.y) / direction.y;
            const ty2 = (aabb.max.y - origin.y) / direction.y;
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
        }
        
        // Z-axis
        if (Math.abs(direction.z) < 1e-8) {
            if (origin.z < aabb.min.z || origin.z > aabb.max.z) return null;
        } else {
            const tz1 = (aabb.min.z - origin.z) / direction.z;
            const tz2 = (aabb.max.z - origin.z) / direction.z;
            tmin = Math.max(tmin, Math.min(tz1, tz2));
            tmax = Math.min(tmax, Math.max(tz1, tz2));
        }
        
        return tmin >= 0 ? tmin : (tmax >= 0 ? tmax : null);
    }
    
    // Query methods
    querySphere(center, radius) {
        const results = [];
        const shape = CollisionShapes.createSphere(center, radius);
        
        for (const body of this.bodies.values()) {
            const bodyShape = CollisionDetector.getShapeFromBody(body);
            const contact = CollisionDetector.testCollision(shape, bodyShape);
            if (contact) {
                results.push(body);
            }
        }
        
        return results;
    }
    
    queryAABB(min, max) {
        const results = [];
        const shape = CollisionShapes.createAABB(min, max);
        
        for (const body of this.bodies.values()) {
            const bodyShape = CollisionDetector.getShapeFromBody(body);
            const contact = CollisionDetector.testCollision(shape, bodyShape);
            if (contact) {
                results.push(body);
            }
        }
        
        return results;
    }
    
    // Debug visualization data
    getDebugData() {
        const bodies = [];
        const contacts = [];
        
        for (const body of this.bodies.values()) {
            bodies.push({
                id: body.id,
                position: body.position.clone(),
                velocity: body.velocity.clone(),
                isSleeping: body.isSleeping,
                collider: body.collider
            });
        }
        
        for (const contact of this.contacts) {
            contacts.push({
                normal: contact.normal.clone(),
                penetration: contact.penetration,
                contactPoint: contact.contactPoint.clone()
            });
        }
        
        return { bodies, contacts };
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    // Animation loop integration
    update(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Clamp delta time to prevent large jumps
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        
        this.step(clampedDeltaTime);
    }
}

export { PhysicsSystem, RigidBody, Constraint, CollisionShapes, CollisionDetector };
export default PhysicsSystem;
