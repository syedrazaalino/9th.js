/**
 * Physics System Example
 * Demonstrates basic physics simulation with collision detection and constraints
 */

import PhysicsSystem, { RigidBody, Constraint, CollisionShapes } from './src/physics/PhysicsSystem.js';

class PhysicsExample {
    constructor() {
        this.physics = new PhysicsSystem();
        this.objects = [];
        this.setupCollisionCallback();
        this.setupScene();
    }
    
    setupCollisionCallback() {
        this.physics.onCollision = (contact) => {
            const { bodyA, bodyB, normal, penetration } = contact;
            
            // Visual feedback for collisions
            console.log(`Collision: Body ${bodyA.id} <-> Body ${bodyB.id}`);
            console.log(`Normal: (${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)})`);
            console.log(`Penetration: ${penetration.toFixed(3)}`);
            
            // Wake sleeping bodies
            bodyA.wake();
            bodyB.wake();
        };
    }
    
    setupScene() {
        // Create ground plane (static)
        const ground = this.physics.addBody({
            position: { x: 0, y: 0, z: 0 },
            isStatic: true,
            collider: { type: 'aabb', halfExtents: { x: 50, y: 0.5, z: 50 } },
            userData: { type: 'ground' }
        });
        
        // Create bouncing ball
        const ball = this.physics.addBody({
            position: { x: 0, y: 15, z: 0 },
            mass: 1.0,
            collider: { type: 'sphere', radius: 1.0 },
            restitution: 0.8,
            friction: 0.3,
            userData: { type: 'ball', color: '#ff6b6b' }
        });
        
        // Create a box that can rotate
        const box = this.physics.addBody({
            position: { x: 5, y: 8, z: 0 },
            mass: 2.0,
            collider: { type: 'aabb', halfExtents: { x: 1, y: 1, z: 1 } },
            restitution: 0.4,
            friction: 0.6,
            userData: { type: 'box', color: '#4ecdc4' }
        });
        
        // Create a heavy object
        const heavyBox = this.physics.addBody({
            position: { x: -5, y: 12, z: 0 },
            mass: 5.0,
            collider: { type: 'aabb', halfExtents: { x: 1.5, y: 1.5, z: 1.5 } },
            restitution: 0.2,
            friction: 0.8,
            userData: { type: 'heavyBox', color: '#45b7d1' }
        });
        
        // Create a pendulum with constraint
        this.createPendulum({ x: 10, y: 10, z: 0 }, { x: 0, y: 0, z: 0 });
        
        // Create a spring system
        this.createSpringSystem();
        
        // Store references
        this.objects = [ground, ball, box, heavyBox];
    }
    
    createPendulum(anchorPos, bobPos) {
        // Static anchor point
        const anchor = this.physics.addBody({
            position: anchorPos,
            isStatic: true,
            collider: { type: 'sphere', radius: 0.2 },
            userData: { type: 'anchor' }
        });
        
        // Dynamic pendulum bob
        const bob = this.physics.addBody({
            position: bobPos,
            mass: 1.0,
            collider: { type: 'sphere', radius: 0.5 },
            restitution: 0.3,
            userData: { type: 'pendulum', color: '#f9ca24' }
        });
        
        // Distance constraint (pendulum string)
        const pendulumConstraint = new Constraint(anchor, bob, {
            type: 'distance',
            anchorA: { x: 0, y: 0, z: 0 },
            anchorB: { x: 0, y: 0, z: 0 },
            distance: 5.0,
            stiffness: 0.9,
            damping: 0.1
        });
        
        this.physics.addConstraint(pendulumConstraint);
        
        // Give pendulum initial velocity
        bob.applyImpulse({ x: 3, y: 0, z: 0 });
        
        return { anchor, bob, constraint: pendulumConstraint };
    }
    
    createSpringSystem() {
        // Create chain of connected bodies
        const numBodies = 5;
        const startPos = { x: -15, y: 15, z: 0 };
        const spacing = 2.0;
        
        const springs = [];
        
        for (let i = 0; i < numBodies; i++) {
            const body = this.physics.addBody({
                position: {
                    x: startPos.x + i * spacing,
                    y: startPos.y,
                    z: startPos.z
                },
                mass: 0.8,
                collider: { type: 'sphere', radius: 0.3 },
                restitution: 0.5,
                userData: { type: 'spring', color: '#a29bfe' }
            });
            
            springs.push(body);
        }
        
        // Connect bodies with springs
        for (let i = 0; i < springs.length - 1; i++) {
            const spring = new Constraint(springs[i], springs[i + 1], {
                type: 'distance',
                distance: spacing,
                stiffness: 0.7,
                damping: 0.2
            });
            
            this.physics.addConstraint(spring);
        }
        
        // Pin first and last bodies
        const firstPin = new Constraint(springs[0], springs[0], {
            type: 'point',
            anchorA: { x: 0, y: 0, z: 0 },
            anchorB: { x: 0, y: 0, z: 0 }
        });
        firstPin.solve = () => false; // Don't actually constrain to itself
        this.physics.addConstraint(firstPin);
        
        return springs;
    }
    
    // Example of raycasting for picking
    demonstrateRaycasting() {
        console.log('\n=== Raycasting Demo ===');
        
        // Raycast straight down
        const rayResult = this.physics.raycast(
            { x: 0, y: 20, z: 0 },
            { x: 0, y: -1, z: 0 },
            25
        );
        
        console.log('Objects hit by ray:', rayResult.length);
        rayResult.forEach((hit, index) => {
            console.log(`Hit ${index + 1}: Body ${hit.body.id} at distance ${hit.distance.toFixed(2)}`);
        });
        
        // Query objects in a sphere
        const nearby = this.physics.querySphere({ x: 0, y: 5, z: 0 }, 8.0);
        console.log(`Objects within 8 units of origin: ${nearby.length}`);
        
        // Query objects in an AABB
        const inBox = this.physics.queryAABB(
            { x: -3, y: -3, z: -3 },
            { x: 3, y: 8, z: 3 }
        );
        console.log(`Objects in AABB: ${inBox.length}`);
    }
    
    // Add forces and test interactions
    addRandomForces() {
        const dynamicBodies = this.objects.filter(obj => !obj.isStatic);
        
        if (dynamicBodies.length > 0) {
            const randomBody = dynamicBodies[Math.floor(Math.random() * dynamicBodies.length)];
            const randomForce = {
                x: (Math.random() - 0.5) * 20,
                y: Math.random() * 15,
                z: (Math.random() - 0.5) * 20
            };
            
            randomBody.addForce(randomForce);
            console.log(`Applied force to body ${randomBody.id}:`, randomForce);
        }
    }
    
    // Demonstrate different collision shapes
    demonstrateCollisionShapes() {
        console.log('\n=== Collision Shape Demo ===');
        
        for (const body of this.physics.bodies.values()) {
            if (body.isStatic) continue;
            
            const shape = body.collider;
            console.log(`Body ${body.id}: ${shape.type}`);
            
            switch (shape.type) {
                case 'sphere':
                    console.log(`  Radius: ${shape.radius}`);
                    break;
                case 'aabb':
                    console.log(`  Half extents: (${shape.halfExtents.x}, ${shape.halfExtents.y}, ${shape.halfExtents.z})`);
                    break;
                case 'obb':
                    console.log(`  Half extents: (${shape.halfExtents.x}, ${shape.halfExtents.y}, ${shape.halfExtents.z})`);
                    console.log(`  Oriented: Yes`);
                    break;
            }
            
            console.log(`  Position: (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}, ${body.position.z.toFixed(2)})`);
            console.log(`  Velocity: (${body.velocity.x.toFixed(2)}, ${body.velocity.y.toFixed(2)}, ${body.velocity.z.toFixed(2)})`);
            console.log(`  Mass: ${body.mass}`);
            console.log(`  Sleeping: ${body.isSleeping}`);
            console.log('---');
        }
    }
    
    // Performance statistics
    getStats() {
        const bodies = Array.from(this.physics.bodies.values());
        const dynamicBodies = bodies.filter(b => !b.isStatic);
        const sleepingBodies = bodies.filter(b => b.isSleeping);
        const contacts = this.physics.contacts;
        
        return {
            totalBodies: bodies.length,
            dynamicBodies: dynamicBodies.length,
            sleepingBodies: sleepingBodies.length,
            activeConstraints: this.physics.constraints.length,
            currentContacts: contacts.length,
            gravity: this.physics.gravity
        };
    }
    
    logStats() {
        const stats = this.getStats();
        console.log('\n=== Physics Stats ===');
        console.log(`Bodies: ${stats.totalBodies} total, ${stats.dynamicBodies} dynamic, ${stats.sleepingBodies} sleeping`);
        console.log(`Constraints: ${stats.activeConstraints}`);
        console.log(`Contacts: ${stats.currentContacts}`);
        console.log(`Gravity: (${stats.gravity.x}, ${stats.gravity.y}, ${stats.gravity.z})`);
    }
    
    // Main simulation loop
    start() {
        this.physics.start();
        
        console.log('=== Physics System Started ===');
        console.log('This example demonstrates:');
        console.log('- Rigid body dynamics with different masses');
        console.log('- Collision detection between various shapes');
        console.log('- Constraints (pendulum, springs)');
        console.log('- Raycasting and queries');
        console.log('- Performance optimization (sleeping bodies)');
        
        // Set up periodic demonstrations
        let frameCount = 0;
        const animate = (currentTime) => {
            this.physics.update(currentTime);
            
            frameCount++;
            
            // Log stats every 2 seconds
            if (frameCount % 120 === 0) {
                this.logStats();
            }
            
            // Add random forces every 5 seconds
            if (frameCount % 300 === 0) {
                this.addRandomForces();
            }
            
            // Demonstrate raycasting every 10 seconds
            if (frameCount % 600 === 0) {
                this.demonstrateRaycasting();
            }
            
            // Show collision shapes every 15 seconds
            if (frameCount % 900 === 0) {
                this.demonstrateCollisionShapes();
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
        
        // Demonstrate features after a short delay
        setTimeout(() => {
            this.demonstrateRaycasting();
        }, 2000);
        
        setTimeout(() => {
            this.demonstrateCollisionShapes();
        }, 5000);
    }
}

// Example usage
if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('DOMContentLoaded', () => {
        const example = new PhysicsExample();
        example.start();
        
        // Add some UI controls
        const controls = document.createElement('div');
        controls.innerHTML = `
            <div style="position: fixed; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-family: monospace;">
                <h3>Physics Controls</h3>
                <button onclick="window.physicsExample.addRandomForces()">Add Random Force</button><br><br>
                <button onclick="window.physicsExample.demonstrateRaycasting()">Raycast Demo</button><br><br>
                <button onclick="window.physicsExample.demonstrateCollisionShapes()">Show Shapes</button><br><br>
                <button onclick="window.physicsExample.logStats()">Show Stats</button>
            </div>
        `;
        document.body.appendChild(controls);
        
        window.physicsExample = example;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    const example = new PhysicsExample();
    
    // Run simulation for 10 seconds
    example.start();
    
    setTimeout(() => {
        example.logStats();
        console.log('\nSimulation complete!');
        process.exit(0);
    }, 10000);
}

export default PhysicsExample;
