# Physics System Documentation

A comprehensive real-time physics engine built for JavaScript applications, featuring rigid body dynamics, collision detection, constraints, and performance optimizations.

## Features

### Core Physics
- **Rigid Body Dynamics**: Full 3D rigid body simulation with mass, velocity, and forces
- **Gravity System**: Configurable gravity vector affecting all dynamic bodies
- **Linear & Angular Motion**: Realistic rotation and movement physics
- **Sleep/Wake System**: Performance optimization through body sleeping

### Collision Detection
- **Multiple Shape Types**:
  - AABB (Axis-Aligned Bounding Box)
  - Sphere collisions
  - OBB (Oriented Bounding Box) with SAT support
- **Two-Phase Detection**:
  - Broad phase with spatial hashing for performance
  - Narrow phase with precise collision testing
- **Contact Resolution**: Proper collision response with restitution and friction

### Constraints
- **Point Constraints**: Connect bodies at specific points
- **Distance Constraints**: Maintain fixed distance between bodies
- **Fixed Constraints**: Lock bodies together completely
- **Constraint Solver**: Iterative solver for stable constraint satisfaction

### Performance Optimizations
- **Spatial Hashing**: Efficient broad phase collision detection
- **Fixed Timestep**: Deterministic physics simulation
- **Body Sleeping**: Disable physics for stationary objects
- **Contact Caching**: Reduce redundant collision calculations

## Usage

### Basic Setup

```javascript
import PhysicsSystem from './src/physics/PhysicsSystem.js';

// Create physics world
const physics = new PhysicsSystem();

// Start the physics simulation
physics.start();

// In your animation loop
function animate(currentTime) {
    physics.update(currentTime);
    requestAnimationFrame(animate);
}
```

### Creating Bodies

```javascript
// Dynamic sphere
const sphere = physics.addBody({
    position: { x: 0, y: 10, z: 0 },
    mass: 1.0,
    collider: { type: 'sphere', radius: 0.5 },
    restitution: 0.6,
    friction: 0.4
});

// Static ground plane (infinite mass)
const ground = physics.addBody({
    position: { x: 0, y: 0, z: 0 },
    isStatic: true,
    collider: { type: 'aabb', halfExtents: { x: 50, y: 0.1, z: 50 } }
});

// Kinematic box
const box = physics.addBody({
    position: { x: 5, y: 5, z: 0 },
    isKinematic: true,
    mass: 0,
    collider: { type: 'box', halfExtents: { x: 1, y: 1, z: 1 } }
});
```

### Forces and Impulses

```javascript
// Apply continuous force
sphere.addForce({ x: 10, y: 0, z: 0 });

// Apply impulse (instant velocity change)
sphere.applyImpulse({ x: 5, y: 0, z: 0 });

// Apply torque for rotation
sphere.addTorque({ x: 0, y: 5, z: 0 });
```

### Collision Handling

```javascript
// Set up collision callback
physics.onCollision = (contact) => {
    console.log('Collision between bodies:', contact.bodyA.id, 'and', contact.bodyB.id);
    console.log('Normal:', contact.normal);
    console.log('Penetration:', contact.penetration);
};

// Listen for specific contacts
physics.onContact = (contact) => {
    // More detailed contact information
};
```

### Constraints

```javascript
// Create a spring constraint between two bodies
const spring = new Constraint(bodyA, bodyB, {
    type: 'distance',
    anchorA: { x: 0, y: 0, z: 0 },
    anchorB: { x: 0, y: 0, z: 0 },
    distance: 5.0,
    stiffness: 0.8,
    damping: 0.1
});

physics.addConstraint(spring);

// Point constraint (ball joint)
const ballJoint = new Constraint(bodyA, bodyB, {
    type: 'point',
    anchorA: { x: 1, y: 0, z: 0 },
    anchorB: { x: -1, y: 0, z: 0 }
});

physics.addConstraint(ballJoint);
```

### Queries and Raycasting

```javascript
// Raycast for picking
const raycastResult = physics.raycast(
    { x: 0, y: 10, z: 0 },     // origin
    { x: 0, y: -1, z: 0 },     // direction
    20                         // max distance
);

raycastResult.forEach(hit => {
    console.log('Hit body:', hit.body.id);
    console.log('Distance:', hit.distance);
    console.log('Hit point:', hit.point);
});

// Query objects in a sphere
const nearby = physics.querySphere({ x: 0, y: 0, z: 0 }, 10.0);

// Query objects in an AABB
const inBox = physics.queryAABB(
    { x: -5, y: -5, z: -5 },
    { x: 5, y: 5, z: 5 }
);
```

### Gravity and Environment

```javascript
// Set custom gravity
physics.setGravity({ x: 0, y: -20, z: 0 });

// Moon gravity
physics.setGravity({ x: 0, y: -1.62, z: 0 });

// Zero gravity (space)
physics.setGravity({ x: 0, y: 0, z: 0 });
```

## Body Types

### Dynamic Bodies
- Affected by forces, gravity, and collisions
- Can collide with other bodies
- Have mass and can transfer momentum

### Static Bodies
- Immovable (infinite mass)
- Can collide but don't move
- Used for ground, walls, terrain

### Kinematic Bodies
- Controlled manually by the user
- Can push dynamic bodies
- Not affected by forces or gravity
- Useful for moving platforms, doors

## Collision Shapes

### Sphere
```javascript
{ type: 'sphere', radius: 0.5 }
```
- Fastest collision detection
- Good for balls, particles, rounded objects
- Center at body's position (plus offset)

### AABB (Axis-Aligned Bounding Box)
```javascript
{ type: 'aabb', halfExtents: { x: 1, y: 1, z: 1 } }
```
- Aligned with world axes
- Fast collision detection
- Good for buildings, boxes without rotation

### OBB (Oriented Bounding Box)
```javascript
{ type: 'obb', halfExtents: { x: 1, y: 1, z: 1 } }
```
- Rotates with the body
- More expensive but accurate
- Good for rotated objects

## Performance Tips

### 1. Use Appropriate Collision Shapes
- Use spheres for circular objects (fastest)
- Use AABB when rotation doesn't matter
- Use OBB only when necessary

### 2. Static vs Dynamic Bodies
- Make stable objects static to save computation
- Use kinematic bodies for controlled movement

### 3. Sleep Bodies
- Bodies automatically sleep when stationary
- Call `wake()` on bodies that need to move

### 4. Spatial Limits
- Physics only handles physics - manage object visibility separately
- Remove distant objects from the physics world

### 5. Fixed Timestep
```javascript
// Adjust for your needs
physics.fixedTimeStep = 1 / 120; // 120 Hz for high precision
physics.iterations = 5;           // Fewer iterations for performance
```

## Advanced Usage

### Custom Collision Handling

```javascript
physics.onCollision = (contact) => {
    const { bodyA, bodyB, normal, penetration } = contact;
    
    // Example: Breakable objects
    if (bodyA.userData.breakable && penetration > 2.0) {
        breakObject(bodyA);
    }
    
    // Example: Sound effects
    if (bodyA.userData.sound && bodyB.userData.sound) {
        playCollisionSound(contact);
    }
};
```

### Custom Forces

```javascript
// Add custom force field
function applyCustomForces() {
    for (const body of physics.bodies.values()) {
        // Magnetic force
        if (body.userData.magnetic) {
            const magneticForce = calculateMagneticForce(body);
            body.addForce(magneticForce);
        }
        
        // Drag force
        if (body.userData.aerodynamic) {
            const drag = body.velocity.clone().multiplyScalar(-0.5);
            body.addForce(drag);
        }
    }
}
```

### Debug Visualization

```javascript
// Get debug data for visualization
function renderPhysicsDebug(renderer) {
    const debugData = physics.getDebugData();
    
    // Draw bodies
    debugData.bodies.forEach(body => {
        if (body.isSleeping) {
            renderer.drawSphere(body.position, body.collider.radius, 0x00ff00);
        } else {
            renderer.drawSphere(body.position, body.collider.radius, 0xff0000);
        }
    });
    
    // Draw contacts
    debugData.contacts.forEach(contact => {
        renderer.drawLine(
            contact.contactPoint.clone().sub(contact.normal),
            contact.contactPoint.clone().add(contact.normal),
            0xffff00
        );
    });
}
```

## Integration with Three.js

```javascript
// Example integration with Three.js mesh
const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 16),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);

// Create physics body
const sphereBody = physics.addBody({
    position: { x: 0, y: 10, z: 0 },
    mass: 1.0,
    collider: { type: 'sphere', radius: 0.5 },
    userData: { mesh: sphereMesh }
});

// Sync mesh position with physics
function syncMeshes() {
    for (const body of physics.bodies.values()) {
        if (body.userData.mesh) {
            body.userData.mesh.position.copy(body.position);
            body.userData.mesh.quaternion.copy(body.rotation);
        }
    }
}

// In animation loop
function animate(currentTime) {
    physics.update(currentTime);
    syncMeshes();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

## API Reference

### PhysicsSystem

#### Constructor
```javascript
const physics = new PhysicsSystem();
```

#### Methods
- `addBody(options)` - Add a new rigid body
- `removeBody(body)` - Remove a body from the simulation
- `addConstraint(constraint)` - Add a constraint between bodies
- `removeConstraint(constraint)` - Remove a constraint
- `setGravity(gravity)` - Set gravity vector
- `step(deltaTime)` - Step simulation forward
- `start()` - Start simulation
- `stop()` - Stop simulation
- `raycast(origin, direction, maxDistance)` - Raycast for picking
- `querySphere(center, radius)` - Find bodies in sphere
- `queryAABB(min, max)` - Find bodies in AABB
- `getDebugData()` - Get debug visualization data

#### Properties
- `onCollision` - Callback for collision events
- `onContact` - Callback for contact events
- `gravity` - Gravity vector
- `bodies` - Map of all bodies in the system
- `constraints` - Array of all constraints

### RigidBody

#### Methods
- `addForce(force)` - Apply continuous force
- `addTorque(torque)` - Apply torque
- `applyImpulse(impulse)` - Apply instant impulse
- `applyAngularImpulse(impulse)` - Apply angular impulse
- `setPosition(position)` - Set position
- `setRotation(rotation)` - Set rotation
- `integrate(dt)` - Integrate motion (internal)

#### Properties
- `position` - Current position
- `velocity` - Current velocity
- `rotation` - Current rotation
- `mass` - Body mass
- `isStatic` - Whether body is static
- `isKinematic` - Whether body is kinematic
- `isSleeping` - Whether body is sleeping
- `userData` - Custom user data

### Constraint

#### Constructor
```javascript
const constraint = new Constraint(bodyA, bodyB, options);
```

#### Options
- `type` - 'point', 'distance', 'fixed'
- `anchorA` - Local anchor on body A
- `anchorB` - Local anchor on body B
- `distance` - Target distance for distance constraints
- `stiffness` - Constraint stiffness (0-1)
- `damping` - Constraint damping

## Troubleshooting

### Objects Falling Through
- Increase physics iterations: `physics.iterations = 15`
- Use smaller fixed timestep: `physics.fixedTimeStep = 1 / 120`
- Increase solver iterations for constraints

### Unstable Physics
- Use fixed timestep instead of variable
- Adjust damping values
- Ensure proper mass ratios

### Performance Issues
- Use spatial partitioning effectively
- Put distant objects to sleep
- Use simpler collision shapes
- Reduce constraint iterations

### Jittery Movement
- Increase constraint solver iterations
- Adjust damping values
- Use proper time step

## Examples

See the `examples/` directory for complete working examples:
- Basic physics demo
- Constraint examples
- Collision handling demo
- Performance optimization examples

This physics system provides a solid foundation for 3D physics simulation in JavaScript applications, with the flexibility to handle everything from simple particle systems to complex rigid body simulations.