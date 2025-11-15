# Physics Integration in Ninth.js

Integrate realistic physics simulation into your Ninth.js applications. This tutorial covers physics engines, collision detection, rigid body dynamics, and creating interactive physics-based experiences.

## Physics Overview

Physics simulation adds realism to 3D scenes through:
- **Gravity and forces** - Realistic object movement
- **Collision detection** - Objects colliding and responding
- **Rigid body dynamics** - Rotation, momentum, and inertia
- **Constraints** - Joints, springs, and mechanical connections
- **Soft body physics** - Deformable objects and cloth

## Supported Physics Engines

| Engine | Pros | Cons | Best For |
|--------|------|------|----------|
| **Cannon.js** | Simple, lightweight | Limited features | Casual games, basic physics |
| **Ammo.js** | Feature-rich, fast | Larger file size | Complex simulations |
| **Oimo.js** | Very lightweight | Basic features | Mobile apps, simple scenes |
| **Box2D** | 2D physics specialist | 2D only | 2D games and simulations |

## Setting Up Physics with Cannon.js

### Installation and Basic Setup

```html
<!-- Include Cannon.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>

<script>
    // Basic physics setup
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Earth gravity
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    // Create physics materials
    const groundMaterial = new CANNON.Material('ground');
    const objectMaterial = new CANNON.Material('object');
    
    const contactMaterial = new CANNON.ContactMaterial(
        groundMaterial,
        objectMaterial,
        {
            friction: 0.4,
            restitution: 0.3
        }
    );
    
    world.addContactMaterial(contactMaterial);
</script>
```

### Complete Physics Integration Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Physics Demo - Ninth.js</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; }
        #controls {
            position: absolute; top: 10px; left: 10px; z-index: 100;
            background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px;
        }
        button { margin: 5px; padding: 8px 12px; background: #4488ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #3366cc; }
        input[type="range"] { width: 100px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Physics Controls</h3>
        <button onclick="spawnBall()">Spawn Ball</button>
        <button onclick="spawnBox()">Spawn Box</button>
        <button onclick="clearObjects()">Clear All</button>
        <div>
            Gravity: <input type="range" id="gravity" min="-20" max="0" step="0.1" value="-9.8">
            <span id="gravityValue">-9.8</span>
        </div>
        <div>
            Wind: <input type="range" id="wind" min="0" max="10" step="0.1" value="0">
            <span id="windValue">0</span>
        </div>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
    
    <script>
        class PhysicsSimulation {
            constructor() {
                this.canvas = document.getElementById('canvas');
                this.scene = new NinthJS.Scene();
                this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new NinthJS.Renderer(this.canvas);
                
                // Physics world
                this.world = new CANNON.World();
                this.objects = [];
                
                this.init();
                this.setupPhysics();
                this.setupControls();
                this.animate();
            }
            
            init() {
                // Setup scene
                this.scene.setBackground('#112233');
                this.camera.setPosition(0, 5, 10);
                
                // Setup lighting
                const ambientLight = new NinthJS.AmbientLight(0.3, '#404040');
                this.scene.add(ambientLight);
                
                const directionalLight = new NinthJS.DirectionalLight(0.8, '#ffffff');
                directionalLight.setPosition(5, 10, 5);
                this.scene.add(directionalLight);
                
                // Setup renderer
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                
                // Handle window resize
                window.addEventListener('resize', () => this.handleResize());
            }
            
            setupPhysics() {
                // Configure physics world
                this.world.gravity.set(0, -9.82, 0);
                this.world.broadphase = new CANNON.NaiveBroadphase();
                this.world.solver.iterations = 10;
                
                // Create ground
                this.createGround();
                
                // Setup physics materials
                const groundMaterial = new CANNON.Material('ground');
                const objectMaterial = new CANNON.Material('object');
                
                const contactMaterial = new CANNON.ContactMaterial(
                    groundMaterial,
                    objectMaterial,
                    {
                        friction: 0.4,
                        restitution: 0.3
                    }
                );
                
                this.world.addContactMaterial(contactMaterial);
            }
            
            createGround() {
                // Visual ground
                const groundGeometry = new NinthJS.PlaneGeometry(20, 20);
                const groundMaterial = new NinthJS.PhongMaterial({ 
                    color: '#333333',
                    side: NinthJS.DoubleSide
                });
                const ground = new NinthJS.Mesh(groundGeometry, groundMaterial);
                ground.setRotation(-Math.PI / 2, 0, 0);
                ground.receiveShadow = true;
                this.scene.add(ground);
                
                // Physics ground
                const groundShape = new CANNON.Plane();
                const groundBody = new CANNON.Body({ mass: 0 });
                groundBody.addShape(groundShape);
                groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
                this.world.addBody(groundBody);
                
                this.groundBody = groundBody;
            }
            
            setupControls() {
                // Gravity control
                const gravitySlider = document.getElementById('gravity');
                gravitySlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.world.gravity.set(0, value, 0);
                    document.getElementById('gravityValue').textContent = value;
                });
                
                // Wind control
                const windSlider = document.getElementById('wind');
                windSlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    this.windForce = value;
                    document.getElementById('windValue').textContent = value;
                });
            }
            
            spawnBall() {
                const radius = 0.5;
                
                // Visual ball
                const ballGeometry = new NinthJS.SphereGeometry(radius, 16, 8);
                const ballMaterial = new NinthJS.PhongMaterial({ 
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`
                });
                const ball = new NinthJS.Mesh(ballGeometry, ballMaterial);
                ball.castShadow = true;
                
                // Random starting position
                ball.setPosition(
                    (Math.random() - 0.5) * 8,
                    8 + Math.random() * 4,
                    (Math.random() - 0.5) * 8
                );
                
                this.scene.add(ball);
                
                // Physics ball
                const ballShape = new CANNON.Sphere(radius);
                const ballBody = new CANNON.Body({ mass: 1 });
                ballBody.addShape(ballShape);
                ballBody.position.set(ball.position.x, ball.position.y, ball.position.z);
                
                // Add random velocity
                ballBody.velocity.set(
                    (Math.random() - 0.5) * 5,
                    0,
                    (Math.random() - 0.5) * 5
                );
                
                // Add random angular velocity
                ballBody.angularVelocity.set(
                    Math.random() * 5,
                    Math.random() * 5,
                    Math.random() * 5
                );
                
                this.world.addBody(ballBody);
                
                this.objects.push({ mesh: ball, body: ballBody });
            }
            
            spawnBox() {
                const width = 0.5 + Math.random() * 0.5;
                const height = 0.5 + Math.random() * 0.5;
                const depth = 0.5 + Math.random() * 0.5;
                
                // Visual box
                const boxGeometry = new NinthJS.BoxGeometry(width, height, depth);
                const boxMaterial = new NinthJS.PhongMaterial({ 
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`
                });
                const box = new NinthJS.Mesh(boxGeometry, boxMaterial);
                box.castShadow = true;
                
                // Random starting position
                box.setPosition(
                    (Math.random() - 0.5) * 8,
                    8 + Math.random() * 4,
                    (Math.random() - 0.5) * 8
                );
                
                this.scene.add(box);
                
                // Physics box
                const boxShape = new CANNON.Box(new CANNON.Vec3(width/2, height/2, depth/2));
                const boxBody = new CANNON.Body({ mass: 1 });
                boxBody.addShape(boxShape);
                boxBody.position.set(box.position.x, box.position.y, box.position.z);
                
                // Add random velocity
                boxBody.velocity.set(
                    (Math.random() - 0.5) * 5,
                    0,
                    (Math.random() - 0.5) * 5
                );
                
                this.world.addBody(boxBody);
                
                this.objects.push({ mesh: box, body: boxBody });
            }
            
            clearObjects() {
                this.objects.forEach(obj => {
                    this.scene.remove(obj.mesh);
                    this.world.removeBody(obj.body);
                });
                this.objects = [];
            }
            
            updatePhysics(deltaTime) {
                // Step physics simulation
                this.world.step(1/60, deltaTime, 3);
                
                // Apply wind force
                if (this.windForce > 0) {
                    this.objects.forEach(obj => {
                        const windForce = new CANNON.Vec3(
                            this.windForce,
                            0,
                            0
                        );
                        obj.body.applyForce(windForce);
                    });
                }
                
                // Sync visual objects with physics bodies
                this.objects.forEach(obj => {
                    const position = obj.body.position;
                    const quaternion = obj.body.quaternion;
                    
                    obj.mesh.setPosition(position.x, position.y, position.z);
                    obj.mesh.setRotation(
                        quaternion.x,
                        quaternion.y,
                        quaternion.z,
                        quaternion.w
                    );
                });
                
                // Remove objects that fall too far
                this.objects = this.objects.filter(obj => {
                    if (obj.body.position.y < -20) {
                        this.scene.remove(obj.mesh);
                        this.world.removeBody(obj.body);
                        return false;
                    }
                    return true;
                });
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                const startTime = performance.now();
                
                // Update physics
                this.updatePhysics(1/60);
                
                // Render
                this.renderer.render(this.scene, this.camera);
            }
            
            handleResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }
        
        // Initialize simulation
        const simulation = new PhysicsSimulation();
        
        // Global functions for controls
        function spawnBall() {
            simulation.spawnBall();
        }
        
        function spawnBox() {
            simulation.spawnBox();
        }
        
        function clearObjects() {
            simulation.clearObjects();
        }
    </script>
</body>
</html>
```

## Advanced Physics Concepts

### 1. Joints and Constraints

```javascript
class PhysicsJoints {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.joints = [];
    }
    
    createHingeJoint(bodyA, bodyB, pivotA, pivotB, axis) {
        const hingeConstraint = new CANNON.HingeConstraint(bodyA, bodyB, {
            pivotA: new CANNON.Vec3(pivotA.x, pivotA.y, pivotA.z),
            pivotB: new CANNON.Vec3(pivotB.x, pivotB.y, pivotB.z),
            axisA: new CANNON.Vec3(axis.x, axis.y, axis.z),
            axisB: new CANNON.Vec3(axis.x, axis.y, axis.z)
        });
        
        this.world.addConstraint(hingeConstraint);
        this.joints.push(hingeConstraint);
        
        return hingeConstraint;
    }
    
    createDistanceJoint(bodyA, bodyB, distance) {
        const distanceConstraint = new CANNON.DistanceConstraint(bodyA, bodyB, distance);
        this.world.addConstraint(distanceConstraint);
        this.joints.push(distanceConstraint);
        
        return distanceConstraint;
    }
    
    createSpring(bodyA, bodyB, restLength, stiffness, damping) {
        const spring = new CANNON.Spring(bodyA, bodyB, {
            restLength: restLength,
            stiffness: stiffness,
            damping: damping
        });
        
        // Apply spring force each step
        this.world.addEventListener('postStep', () => {
            spring.applyForce();
        });
        
        return spring;
    }
}

// Example: Create a pendulum
function createPendulum(world, scene, pivotPosition) {
    const pivotBody = new CANNON.Body({ mass: 0 });
    pivotBody.position.set(pivotPosition.x, pivotPosition.y, pivotPosition.z);
    world.addBody(pivotBody);
    
    // Create bob
    const bobGeometry = new NinthJS.SphereGeometry(0.3, 16, 8);
    const bobMaterial = new NinthJS.PhongMaterial({ color: '#ff6b6b' });
    const bob = new NinthJS.Mesh(bobGeometry, bobMaterial);
    
    const bobBody = new CANNON.Body({ mass: 1 });
    const bobShape = new CANNON.Sphere(0.3);
    bobBody.addShape(bobShape);
    bobBody.position.set(pivotPosition.x, pivotPosition.y - 2, pivotPosition.z);
    world.addBody(bobBody);
    
    scene.add(bob);
    
    // Create joint
    const jointManager = new PhysicsJoints(world, scene);
    const joint = jointManager.createHingeJoint(
        pivotBody, 
        bobBody, 
        { x: 0, y: 0, z: 0 }, 
        { x: 0, y: 1, z: 0 }, 
        { x: 0, y: 0, z: 1 }
    );
    
    return { bob, bobBody, joint };
}
```

### 2. Collision Detection and Events

```javascript
class CollisionDetector {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.collisionCallbacks = new Map();
        
        this.setupCollisionEvents();
    }
    
    setupCollisionEvents() {
        this.world.addEventListener('beginContact', (event) => {
            this.handleCollision(event.bodyA, event.bodyB);
        });
        
        this.world.addEventListener('endContact', (event) => {
            this.handleCollisionEnd(event.bodyA, event.bodyB);
        });
    }
    
    registerCollisionCallback(bodyA, bodyB, callback) {
        const key = this.getBodyKey(bodyA, bodyB);
        this.collisionCallbacks.set(key, callback);
    }
    
    handleCollision(bodyA, bodyB) {
        const key = this.getBodyKey(bodyA, bodyB);
        const callback = this.collisionCallbacks.get(key);
        
        if (callback) {
            callback(bodyA, bodyB);
        }
        
        // Visual feedback for collisions
        this.createCollisionEffect(bodyA.position, bodyB.position);
    }
    
    handleCollisionEnd(bodyA, bodyB) {
        // Handle collision end events
    }
    
    getBodyKey(bodyA, bodyB) {
        const a = bodyA.id < bodyB.id ? bodyA.id : bodyB.id;
        const b = bodyA.id < bodyB.id ? bodyB.id : bodyA.id;
        return `${a}_${b}`;
    }
    
    createCollisionEffect(posA, posB) {
        const midPoint = {
            x: (posA.x + posB.x) / 2,
            y: (posA.y + posB.y) / 2,
            z: (posA.z + posB.z) / 2
        };
        
        // Create temporary visual effect
        const effectGeometry = new NinthJS.SphereGeometry(0.1, 8, 4);
        const effectMaterial = new NinthJS.BasicMaterial({ 
            color: '#ffff00',
            transparent: true,
            opacity: 0.8
        });
        const effect = new NinthJS.Mesh(effectGeometry, effectMaterial);
        effect.setPosition(midPoint.x, midPoint.y, midPoint.z);
        
        this.scene.add(effect);
        
        // Fade out effect
        let opacity = 0.8;
        const fadeOut = () => {
            opacity -= 0.05;
            effectMaterial.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(effect);
                effectGeometry.dispose();
                effectMaterial.dispose();
            }
        };
        fadeOut();
    }
}

// Usage example
function setupCollisionSystem() {
    const detector = new CollisionDetector(world, scene);
    
    // Register collision callback
    detector.registerCollisionCallback(ballBody, groundBody, (bodyA, bodyB) => {
        console.log('Ball hit ground!');
        
        // Create bounce effect
        bodyB.velocity.y *= 0.8; // Reduce velocity on bounce
    });
}
```

### 3. Triggers and Sensors

```javascript
class TriggerSystem {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.triggers = [];
        this.activeTriggers = new Set();
    }
    
    createTriggerArea(position, size, onEnter, onExit) {
        // Visual trigger area (invisible)
        const triggerBody = new CANNON.Body({ mass: 0 });
        const triggerShape = new CANNON.Box(new CANNON.Vec3(size.x/2, size.y/2, size.z/2));
        triggerBody.addShape(triggerShape);
        triggerBody.position.set(position.x, position.y, position.z);
        triggerBody.type = CANNON.Body.KINEMATIC;
        triggerBody.collisionResponse = false; // No physical response
        
        this.world.addBody(triggerBody);
        
        const trigger = {
            body: triggerBody,
            size: size,
            onEnter: onEnter,
            onExit: onExit,
            objectsInside: new Set()
        };
        
        this.triggers.push(trigger);
        return trigger;
    }
    
    checkTriggers(movingObjects) {
        this.triggers.forEach(trigger => {
            const triggerPos = trigger.body.position;
            
            movingObjects.forEach(obj => {
                const objPos = obj.body.position;
                const isInside = this.isInsideTrigger(objPos, triggerPos, trigger.size);
                const wasInside = trigger.objectsInside.has(obj);
                
                if (isInside && !wasInside) {
                    trigger.objectsInside.add(obj);
                    if (trigger.onEnter) {
                        trigger.onEnter(obj);
                    }
                } else if (!isInside && wasInside) {
                    trigger.objectsInside.delete(obj);
                    if (trigger.onExit) {
                        trigger.onExit(obj);
                    }
                }
            });
        });
    }
    
    isInsideTrigger(objPos, triggerPos, size) {
        return Math.abs(objPos.x - triggerPos.x) <= size.x / 2 &&
               Math.abs(objPos.y - triggerPos.y) <= size.y / 2 &&
               Math.abs(objPos.z - triggerPos.z) <= size.z / 2;
    }
}

// Example usage
function createGameMechanics() {
    const triggerSystem = new TriggerSystem(world, scene);
    
    // Create a goal area
    const goal = triggerSystem.createTriggerArea(
        { x: 0, y: 1, z: 0 },
        { x: 2, y: 2, z: 2 },
        (obj) => {
            console.log('Object entered goal!');
            obj.body.velocity.scale(0, obj.body.velocity); // Stop object
            createGoalEffect();
        },
        (obj) => {
            console.log('Object left goal');
        }
    );
    
    // Create a danger zone
    const dangerZone = triggerSystem.createTriggerArea(
        { x: 0, y: -5, z: 0 },
        { x: 10, y: 1, z: 10 },
        (obj) => {
            console.log('Object in danger zone!');
            obj.body.applyForce(new CANNON.Vec3(0, 50, 0)); // Push up
            createWarningEffect();
        },
        (obj) => {
            console.log('Object left danger zone');
        }
    );
}
```

## Physics-Based Game Mechanics

### 1. Vehicle Physics

```javascript
class Vehicle {
    constructor(world, scene, position) {
        this.world = world;
        this.scene = scene;
        this.body = null;
        this.mesh = null;
        this.controls = {
            acceleration: 0,
            steering: 0,
            braking: false
        };
        
        this.createVehicle(position);
    }
    
    createVehicle(position) {
        // Create chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
        this.body = new CANNON.Body({ mass: 150 });
        this.body.addShape(chassisShape);
        this.body.position.set(position.x, position.y, position.z);
        this.body.angularDamping = 0.4;
        
        this.world.addBody(this.body);
        
        // Create wheels (visual only, using physics constraints)
        this.createWheels();
        
        // Create visual representation
        this.createVisual();
    }
    
    createWheels() {
        const wheelPositions = [
            { x: -1, y: -0.5, z: 1.5 },  // Front left
            { x: 1, y: -0.5, z: 1.5 },   // Front right
            { x: -1, y: -0.5, z: -1.5 }, // Back left
            { x: 1, y: -0.5, z: -1.5 }   // Back right
        ];
        
        this.wheels = wheelPositions.map(pos => {
            const wheelGeometry = new NinthJS.CylinderGeometry(0.4, 0.4, 0.3, 8);
            const wheelMaterial = new NinthJS.PhongMaterial({ color: '#333333' });
            const wheel = new NinthJS.Mesh(wheelGeometry, wheelMaterial);
            
            wheel.setPosition(pos.x, pos.y, pos.z);
            wheel.setRotation(0, 0, Math.PI / 2); // Rotate to face forward
            
            this.scene.add(wheel);
            return wheel;
        });
    }
    
    createVisual() {
        const chassisGeometry = new NinthJS.BoxGeometry(2, 1, 4);
        const chassisMaterial = new NinthJS.PhongMaterial({ color: '#4488ff' });
        this.mesh = new NinthJS.Mesh(chassisGeometry, chassisMaterial);
        this.mesh.castShadow = true;
        
        this.scene.add(this.mesh);
    }
    
    updateControls() {
        // Apply forces based on controls
        const force = this.controls.acceleration * 200;
        const brakeForce = this.controls.braking ? -100 : 0;
        
        // Apply force in forward direction
        const forward = new CANNON.Vec3(0, 0, -1);
        const forceVec = forward.scale(force + brakeForce);
        this.body.applyForce(forceVec);
        
        // Apply steering
        if (this.controls.steering !== 0) {
            const torque = this.controls.steering * 50;
            this.body.applyLocalTorque(new CANNON.Vec3(0, torque, 0));
        }
        
        // Add friction and drag
        const velocity = this.body.velocity;
        const speed = velocity.length();
        if (speed > 0) {
            const drag = velocity.scale(-0.5 * speed);
            this.body.applyForce(drag);
        }
    }
    
    update() {
        // Sync visual with physics
        this.mesh.setPosition(this.body.position.x, this.body.position.y, this.body.position.z);
        this.mesh.setRotation(
            this.body.quaternion.x,
            this.body.quaternion.y,
            this.body.quaternion.z,
            this.body.quaternion.w
        );
        
        // Rotate wheels based on speed
        const speed = this.body.velocity.length();
        const wheelRotation = speed * 0.1;
        this.wheels.forEach(wheel => {
            wheel.setRotation(wheelRotation, 0, Math.PI / 2);
        });
    }
    
    setAcceleration(value) {
        this.controls.acceleration = Math.max(-1, Math.min(1, value));
    }
    
    setSteering(value) {
        this.controls.steering = Math.max(-1, Math.min(1, value));
    }
    
    setBraking(braking) {
        this.controls.braking = braking;
    }
}
```

### 2. Ragdoll Physics

```javascript
class Ragdoll {
    constructor(world, scene, position) {
        this.world = world;
        this.scene = scene;
        this.parts = [];
        this.constraints = [];
        
        this.createRagdoll(position);
    }
    
    createRagdoll(position) {
        // Create body parts
        const head = this.createBodyPart('head', 0.2, position.x, position.y + 1.5, position.z);
        const chest = this.createBodyPart('chest', 0.3, position.x, position.y + 1, position.z);
        const pelvis = this.createBodyPart('pelvis', 0.3, position.x, position.y + 0.5, position.z);
        
        // Arms
        const leftUpperArm = this.createBodyPart('leftUpperArm', 0.15, position.x - 0.4, position.y + 1, position.z);
        const leftLowerArm = this.createBodyPart('leftLowerArm', 0.12, position.x - 0.8, position.y + 0.8, position.z);
        const rightUpperArm = this.createBodyPart('rightUpperArm', 0.15, position.x + 0.4, position.y + 1, position.z);
        const rightLowerArm = this.createBodyPart('rightLowerArm', 0.12, position.x + 0.8, position.y + 0.8, position.z);
        
        // Legs
        const leftUpperLeg = this.createBodyPart('leftUpperLeg', 0.18, position.x - 0.2, position.y, position.z);
        const leftLowerLeg = this.createBodyPart('leftLowerLeg', 0.15, position.x - 0.2, position.y - 0.5, position.z);
        const rightUpperLeg = this.createBodyPart('rightUpperLeg', 0.18, position.x + 0.2, position.y, position.z);
        const rightLowerLeg = this.createBodyPart('rightLowerLeg', 0.15, position.x + 0.2, position.y - 0.5, position.z);
        
        // Create constraints (joints)
        this.connectParts(head, chest, { x: 0, y: -0.3, z: 0 });
        this.connectParts(chest, pelvis, { x: 0, y: -0.4, z: 0 });
        
        // Arms to chest
        this.connectParts(chest, leftUpperArm, { x: -0.3, y: 0, z: 0 });
        this.connectParts(chest, rightUpperArm, { x: 0.3, y: 0, z: 0 });
        
        // Arm joints
        this.connectParts(leftUpperArm, leftLowerArm, { x: -0.3, y: -0.2, z: 0 });
        this.connectParts(rightUpperArm, rightLowerArm, { x: 0.3, y: -0.2, z: 0 });
        
        // Legs to pelvis
        this.connectParts(pelvis, leftUpperLeg, { x: -0.15, y: -0.4, z: 0 });
        this.connectParts(pelvis, rightUpperLeg, { x: 0.15, y: -0.4, z: 0 });
        
        // Leg joints
        this.connectParts(leftUpperLeg, leftLowerLeg, { x: 0, y: -0.4, z: 0 });
        this.connectParts(rightUpperLeg, rightLowerLeg, { x: 0, y: -0.4, z: 0 });
        
        this.parts = [head, chest, pelvis, leftUpperArm, leftLowerArm, rightUpperArm, rightLowerLeg, leftUpperLeg, leftLowerLeg, rightUpperLeg, rightLowerLeg];
    }
    
    createBodyPart(name, radius, x, y, z) {
        const color = this.getBodyPartColor(name);
        const geometry = new NinthJS.SphereGeometry(radius, 8, 6);
        const material = new NinthJS.PhongMaterial({ color });
        const mesh = new NinthJS.Mesh(geometry, material);
        mesh.setPosition(x, y, z);
        this.scene.add(mesh);
        
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({ mass: 1 });
        body.addShape(shape);
        body.position.set(x, y, z);
        body.linearDamping = 0.3;
        body.angularDamping = 0.3;
        this.world.addBody(body);
        
        const part = { name, mesh, body };
        return part;
    }
    
    getBodyPartColor(name) {
        const colors = {
            head: '#ffdbac',
            chest: '#ff6b6b',
            pelvis: '#4ecdc4',
            leftUpperArm: '#45b7d1',
            leftLowerArm: '#96ceb4',
            rightUpperArm: '#45b7d1',
            rightLowerArm: '#96ceb4',
            leftUpperLeg: '#feca57',
            leftLowerLeg: '#ff9ff3',
            rightUpperLeg: '#feca57',
            rightLowerLeg: '#ff9ff3'
        };
        return colors[name] || '#888888';
    }
    
    connectParts(partA, partB, offset) {
        const constraint = new CANNON.PointToPointConstraint(
            partA.body, new CANNON.Vec3(offset.x, offset.y, offset.z),
            partB.body, new CANNON.Vec3(0, 0, 0)
        );
        
        this.world.addConstraint(constraint);
        this.constraints.push(constraint);
    }
    
    update() {
        this.parts.forEach(part => {
            part.mesh.setPosition(part.body.position.x, part.body.position.y, part.body.position.z);
            part.mesh.setRotation(
                part.body.quaternion.x,
                part.body.quaternion.y,
                part.body.quaternion.z,
                part.body.quaternion.w
            );
        });
    }
}
```

## Performance Optimization

### 1. Physics LOD System

```javascript
class PhysicsLOD {
    constructor(world) {
        this.world = world;
        this.objects = new Map();
        this.camera = null;
        this.lodDistances = [0, 5, 15, 30]; // High, medium, low, very low detail
    }
    
    setCamera(camera) {
        this.camera = camera;
    }
    
    addObject(object, physicsBody, visualMesh) {
        const lodObject = {
            physicsBody: physicsBody,
            visualMesh: visualMesh,
            currentLevel: 0,
            physicsEnabled: true
        };
        
        this.objects.set(object, lodObject);
    }
    
    update() {
        if (!this.camera) return;
        
        const cameraPos = this.camera.getPosition();
        
        this.objects.forEach((lodObject, object) => {
            const objectPos = lodObject.physicsBody.position;
            const distance = cameraPos.distanceTo(objectPos);
            
            const newLevel = this.getLODLevel(distance);
            
            if (newLevel !== lodObject.currentLevel) {
                this.switchLOD(lodObject, newLevel);
                lodObject.currentLevel = newLevel;
            }
        });
    }
    
    getLODLevel(distance) {
        if (distance < this.lodDistances[1]) return 0; // High detail
        if (distance < this.lodDistances[2]) return 1; // Medium detail
        if (distance < this.lodDistances[3]) return 2; // Low detail
        return 3; // Very low detail
    }
    
    switchLOD(lodObject, level) {
        const body = lodObject.physicsBody;
        
        switch (level) {
            case 0: // High detail
                body.type = CANNON.Body.DYNAMIC;
                body.mass = 1;
                body.updateMassProperties();
                lodObject.physicsEnabled = true;
                break;
                
            case 1: // Medium detail
                body.type = CANNON.Body.DYNAMIC;
                body.mass = 1;
                body.updateMassProperties();
                lodObject.physicsEnabled = true;
                break;
                
            case 2: // Low detail
                body.type = CANNON.Body.KINEMATIC;
                lodObject.physicsEnabled = false;
                break;
                
            case 3: // Very low detail
                body.type = CANNON.Body.STATIC;
                lodObject.physicsEnabled = false;
                break;
        }
    }
}
```

### 2. Spatial Partitioning

```javascript
class PhysicsSpatialPartition {
    constructor(world, scene, gridSize = 10) {
        this.world = world;
        this.scene = scene;
        this.gridSize = gridSize;
        this.grid = new Map();
        this.objects = [];
    }
    
    addObject(object, position) {
        this.objects.push({ object, position });
        this.updateGrid(object, position);
    }
    
    updateGrid(object, position) {
        const cell = this.getCell(position);
        const key = this.getCellKey(cell);
        
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        
        this.grid.get(key).push(object);
    }
    
    getCell(position) {
        return {
            x: Math.floor(position.x / this.gridSize),
            y: Math.floor(position.y / this.gridSize),
            z: Math.floor(position.z / this.gridSize)
        };
    }
    
    getCellKey(cell) {
        return `${cell.x},${cell.y},${cell.z}`;
    }
    
    getNearbyObjects(position, radius) {
        const nearbyCells = this.getNearbyCells(position, radius);
        const nearbyObjects = [];
        
        nearbyCells.forEach(cell => {
            const key = this.getCellKey(cell);
            const cellObjects = this.grid.get(key);
            if (cellObjects) {
                nearbyObjects.push(...cellObjects);
            }
        });
        
        return nearbyObjects;
    }
    
    getNearbyCells(position, radius) {
        const centerCell = this.getCell(position);
        const cellRadius = Math.ceil(radius / this.gridSize);
        const cells = [];
        
        for (let x = centerCell.x - cellRadius; x <= centerCell.x + cellRadius; x++) {
            for (let y = centerCell.y - cellRadius; y <= centerCell.y + cellRadius; y++) {
                for (let z = centerCell.z - cellRadius; z <= centerCell.z + cellRadius; z++) {
                    cells.push({ x, y, z });
                }
            }
        }
        
        return cells;
    }
}
```

## Troubleshooting Physics Issues

### Common Problems and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Objects passing through walls | High velocity | Increase physics timestep or use continuous collision detection |
| Performance issues | Too many objects | Implement LOD, use spatial partitioning |
| Janky movement | Frame rate dependent | Use fixed timestep for physics |
| Objects floating | Incorrect mass/density | Set proper mass values and gravity |
| Explosions on collision | High restitution | Reduce material restitution values |

### Debug Tools

```javascript
class PhysicsDebugger {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        this.enabled = false;
    }
    
    enable() {
        this.enabled = true;
        this.world.addEventListener('postStep', () => this.renderDebugInfo());
    }
    
    disable() {
        this.enabled = false;
    }
    
    renderDebugInfo() {
        if (!this.enabled) return;
        
        // Clear previous debug objects
        this.clearDebugObjects();
        
        // Render physics bodies
        this.world.bodies.forEach(body => {
            if (body.type === CANNON.Body.DYNAMIC) {
                this.renderBody(body);
            }
        });
    }
    
    renderBody(body) {
        body.shapes.forEach(shape => {
            if (shape instanceof CANNON.Box) {
                this.renderBox(body, shape);
            } else if (shape instanceof CANNON.Sphere) {
                this.renderSphere(body, shape);
            }
        });
    }
    
    renderBox(body, shape) {
        const geometry = new NinthJS.BoxGeometry(
            shape.halfExtents.x * 2,
            shape.halfExtents.y * 2,
            shape.halfExtents.z * 2
        );
        const material = new NinthJS.WireframeMaterial({ 
            color: '#00ff00',
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new NinthJS.Mesh(geometry, material);
        
        wireframe.setPosition(body.position.x, body.position.y, body.position.z);
        wireframe.setRotation(
            body.quaternion.x,
            body.quaternion.y,
            body.quaternion.z,
            body.quaternion.w
        );
        
        this.scene.add(wireframe);
        this.debugObjects.push(wireframe);
    }
    
    renderSphere(body, shape) {
        const geometry = new NinthJS.SphereGeometry(shape.radius, 8, 6);
        const material = new NinthJS.WireframeMaterial({ 
            color: '#ff0000',
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new NinthJS.Mesh(geometry, material);
        
        wireframe.setPosition(body.position.x, body.position.y, body.position.z);
        
        this.scene.add(wireframe);
        this.debugObjects.push(wireframe);
    }
    
    clearDebugObjects() {
        this.debugObjects = this.debugObjects || [];
        this.debugObjects.forEach(obj => {
            this.scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        this.debugObjects = [];
    }
}
```

## Best Practices

### 1. Performance Guidelines
- Use fixed timestep for physics calculations
- Implement LOD for physics complexity
- Use appropriate collision shapes (simple shapes for complex objects)
- Batch physics updates for similar objects

### 2. Stability Tips
- Set realistic mass values (heavier objects should have more mass)
- Use appropriate damping to prevent infinite oscillations
- Limit angular velocities to prevent unrealistic spinning
- Use constraints sparingly, as they add computational complexity

### 3. Memory Management
- Dispose of physics bodies when objects are removed
- Reuse physics materials and shapes when possible
- Clear collision callbacks when objects are destroyed
- Monitor memory usage during development

## Next Steps

With physics integration mastered, explore:

1. **[Advanced Rendering](./advanced-rendering.md)** - Physics-based visual effects
2. **[Performance Optimization](./performance-optimization.md)** - Optimize physics performance
3. **[Animation Basics](./animation-basics.md)** - Combine physics with animations
4. **[Loading 3D Models](./loading-3d-models.md)** - Add physics to imported models

---

**Your 3D world now obeys the laws of physics! Create realistic, interactive experiences! ⚡**