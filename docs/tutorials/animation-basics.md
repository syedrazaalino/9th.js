# Animation Basics in Ninth.js

Animation brings your 3D scenes to life! This tutorial covers all the essential animation techniques in Ninth.js, from simple rotations to complex character animations and procedural motion.

## Animation Fundamentals

Animation in 3D graphics involves:
- **Transformations** - Position, rotation, scale changes over time
- **Morphing** - Changing geometry vertices
- **Material animation** - Colors, textures, and properties
- **Skeleton animation** - Joint-based character animation
- **Procedural animation** - Physics-driven motion

## Basic Animation: The Animation Loop

The foundation of all animations:

```javascript
// Basic animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update animation time
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update your objects here
    updateAnimations(deltaTime, currentTime);
    
    // Render the scene
    renderer.render(scene, camera);
}

animate();
```

## Core Animation Techniques

### 1. Rotation Animation

**Continuous Rotation:**
```javascript
function createRotatingObject() {
    const cube = new NinthJS.Mesh(
        new NinthJS.BoxGeometry(1, 1, 1),
        new NinthJS.PhongMaterial({ color: '#4488ff' })
    );
    
    const startTime = performance.now();
    
    function animateRotation() {
        const elapsed = (performance.now() - startTime) / 1000; // seconds
        const speed = 1; // rotations per second
        
        // Rotate around multiple axes for interesting motion
        cube.setRotation(
            elapsed * speed,                           // X-axis
            elapsed * speed * 1.5,                     // Y-axis (faster)
            elapsed * speed * 0.5                      // Z-axis (slower)
        );
        
        requestAnimationFrame(animateRotation);
    }
    
    scene.add(cube);
    animateRotation();
}
```

**Easing Rotation:**
```javascript
function createEasedRotation(object, duration = 2000) {
    const startRotation = object.getRotation();
    const startTime = performance.now();
    
    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    function animateEased() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOut(progress);
        
        // Interpolate rotation
        const targetRotation = { x: Math.PI, y: Math.PI, z: 0 };
        const newRotation = {
            x: startRotation.x + (targetRotation.x - startRotation.x) * easedProgress,
            y: startRotation.y + (targetRotation.y - startRotation.y) * easedProgress,
            z: startRotation.z + (targetRotation.z - startRotation.z) * easedProgress
        };
        
        object.setRotation(newRotation.x, newRotation.y, newRotation.z);
        
        if (progress < 1) {
            requestAnimationFrame(animateEased);
        }
    }
    
    animateEased();
}
```

### 2. Position Animation

**Orbital Movement:**
```javascript
function createOrbitalAnimation(object, center = { x: 0, y: 0, z: 0 }, radius = 5) {
    const startTime = performance.now();
    
    function animateOrbit() {
        const elapsed = (performance.now() - startTime) / 1000;
        const speed = 0.5; // orbits per second
        
        // Calculate orbital position
        const angle = elapsed * speed * Math.PI * 2;
        const x = center.x + Math.cos(angle) * radius;
        const z = center.z + Math.sin(angle) * radius;
        const y = center.y + Math.sin(angle * 2) * 2; // Vertical bobbing
        
        object.setPosition(x, y, z);
        
        // Make object face the direction of travel
        const tangent = {
            x: -Math.sin(angle),
            z: Math.cos(angle)
        };
        
        requestAnimationFrame(animateOrbit);
    }
    
    animateOrbit();
}
```

**Path Following:**
```javascript
class PathFollower {
    constructor(object, pathPoints) {
        this.object = object;
        this.pathPoints = pathPoints;
        this.currentSegment = 0;
        this.t = 0;
        this.speed = 1; // units per second
    }
    
    update(deltaTime) {
        const currentPoint = this.pathPoints[this.currentSegment];
        const nextPoint = this.pathPoints[(this.currentSegment + 1) % this.pathPoints.length];
        
        // Calculate distance to next point
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const dz = nextPoint.z - currentPoint.z;
        const segmentLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Update progress
        const deltaT = (this.speed * deltaTime) / segmentLength;
        this.t += deltaT;
        
        if (this.t >= 1) {
            this.t = 0;
            this.currentSegment = (this.currentSegment + 1) % this.pathPoints.length;
        }
        
        // Interpolate position
        const x = currentPoint.x + (nextPoint.x - currentPoint.x) * this.t;
        const y = currentPoint.y + (nextPoint.y - currentPoint.y) * this.t;
        const z = currentPoint.z + (nextPoint.z - currentPoint.z) * this.t;
        
        this.object.setPosition(x, y, z);
        
        // Calculate forward direction for orientation
        const forwardX = nextPoint.x - currentPoint.x;
        const forwardZ = nextPoint.z - currentPoint.z;
        const angle = Math.atan2(forwardX, forwardZ);
        
        this.object.setRotation(0, angle, 0);
    }
}

// Usage
const path = [
    { x: 0, y: 0, z: 0 },
    { x: 5, y: 0, z: 5 },
    { x: -5, y: 0, z: 5 },
    { x: -5, y: 0, z: -5 },
    { x: 5, y: 0, z: -5 }
];

const follower = new PathFollower(cube, path);
```

### 3. Scale Animation

**Pulsing Effect:**
```javascript
function createPulsingObject(object, pulseSpeed = 2, minScale = 0.5, maxScale = 1.5) {
    const startTime = performance.now();
    
    function animatePulse() {
        const elapsed = (performance.now() - startTime) / 1000;
        const normalizedTime = (Math.sin(elapsed * pulseSpeed) + 1) / 2; // 0 to 1
        const scale = minScale + (maxScale - minScale) * normalizedTime;
        
        object.setScale(scale, scale, scale);
        
        requestAnimationFrame(animatePulse);
    }
    
    animatePulse();
}
```

**Breathing Effect:**
```javascript
function createBreathingEffect(object, breathSpeed = 0.5, intensity = 0.2) {
    const baseScale = { x: 1, y: 1, z: 1 };
    
    function animateBreathing() {
        const time = performance.now() * 0.001;
        const breathValue = Math.sin(time * breathSpeed * Math.PI * 2) * intensity;
        
        object.setScale(
            baseScale.x * (1 + breathValue * 0.1), // X grows slightly
            baseScale.y * (1 + breathValue),       // Y breathes normally
            baseScale.z * (1 + breathValue * 0.1)  // Z grows slightly
        );
        
        requestAnimationFrame(animateBreathing);
    }
    
    animateBreathing();
}
```

## Advanced Animation Systems

### 1. Keyframe Animation System

```javascript
class KeyframeAnimation {
    constructor(object) {
        this.object = object;
        this.keyframes = [];
        this.currentTime = 0;
        this.duration = 0;
        this.playing = false;
        this.loop = false;
        this.onComplete = null;
    }
    
    addKeyframe(time, properties) {
        this.keyframes.push({ time, properties });
        this.keyframes.sort((a, b) => a.time - b.time);
        this.duration = Math.max(this.duration, time);
    }
    
    play(loop = false, onComplete = null) {
        this.loop = loop;
        this.onComplete = onComplete;
        this.playing = true;
        this.startTime = performance.now();
    }
    
    pause() {
        this.playing = false;
    }
    
    update() {
        if (!this.playing) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        let currentTime = elapsed % this.duration;
        
        // Handle looping
        if (elapsed >= this.duration && !this.loop) {
            this.playing = false;
            if (this.onComplete) this.onComplete();
            return;
        }
        
        // Find surrounding keyframes
        let prevKeyframe = this.keyframes[0];
        let nextKeyframe = this.keyframes[this.keyframes.length - 1];
        
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (currentTime >= this.keyframes[i].time && currentTime <= this.keyframes[i + 1].time) {
                prevKeyframe = this.keyframes[i];
                nextKeyframe = this.keyframes[i + 1];
                break;
            }
        }
        
        // Interpolate between keyframes
        if (prevKeyframe === nextKeyframe) {
            this.applyProperties(prevKeyframe.properties);
        } else {
            const segmentDuration = nextKeyframe.time - prevKeyframe.time;
            const localTime = currentTime - prevKeyframe.time;
            const t = localTime / segmentDuration;
            
            this.interpolateProperties(prevKeyframe.properties, nextKeyframe.properties, t);
        }
    }
    
    applyProperties(properties) {
        if (properties.position) {
            this.object.setPosition(properties.position.x, properties.position.y, properties.position.z);
        }
        if (properties.rotation) {
            this.object.setRotation(properties.rotation.x, properties.rotation.y, properties.rotation.z);
        }
        if (properties.scale) {
            this.object.setScale(properties.scale.x, properties.scale.y, properties.scale.z);
        }
        if (properties.color) {
            this.object.material.color = properties.color;
        }
    }
    
    interpolateProperties(startProps, endProps, t) {
        const interpolated = {};
        
        // Interpolate position
        if (startProps.position && endProps.position) {
            interpolated.position = {
                x: this.lerp(startProps.position.x, endProps.position.x, t),
                y: this.lerp(startProps.position.y, endProps.position.y, t),
                z: this.lerp(startProps.position.z, endProps.position.z, t)
            };
        }
        
        // Interpolate rotation
        if (startProps.rotation && endProps.rotation) {
            interpolated.rotation = {
                x: this.lerp(startProps.rotation.x, endProps.rotation.x, t),
                y: this.lerp(startProps.rotation.y, endProps.rotation.y, t),
                z: this.lerp(startProps.rotation.z, endProps.rotation.z, t)
            };
        }
        
        // Interpolate scale
        if (startProps.scale && endProps.scale) {
            interpolated.scale = {
                x: this.lerp(startProps.scale.x, endProps.scale.x, t),
                y: this.lerp(startProps.scale.y, endProps.scale.y, t),
                z: this.lerp(startProps.scale.z, endProps.scale.z, t)
            };
        }
        
        // Interpolate color
        if (startProps.color && endProps.color) {
            interpolated.color = this.lerpColor(startProps.color, endProps.color, t);
        }
        
        this.applyProperties(interpolated);
    }
    
    lerp(start, end, t) {
        return start + (end - start) * this.easeInOutCubic(t);
    }
    
    lerpColor(color1, color2, t) {
        // Convert hex to RGB, interpolate, convert back
        const c1 = new NinthJS.Color(color1);
        const c2 = new NinthJS.Color(color2);
        const result = c1.clone().lerp(c2, t);
        return result.getStyle();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
}

// Usage example
function createKeyframeAnimation() {
    const cube = new NinthJS.Mesh(
        new NinthJS.BoxGeometry(1, 1, 1),
        new NinthJS.PhongMaterial({ color: '#4488ff' })
    );
    
    const animation = new KeyframeAnimation(cube);
    
    // Add keyframes
    animation.addKeyframe(0, {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#4488ff'
    });
    
    animation.addKeyframe(1, {
        position: { x: 3, y: 2, z: 0 },
        scale: { x: 1.5, y: 1.5, z: 1.5 },
        color: '#ff8844'
    });
    
    animation.addKeyframe(2, {
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#4488ff'
    });
    
    scene.add(cube);
    animation.play(true); // Loop animation
    return animation;
}
```

### 2. Particle Animation System

```javascript
class ParticleSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.particles = [];
        this.options = {
            count: options.count || 1000,
            position: options.position || { x: 0, y: 0, z: 0 },
            velocity: options.velocity || { x: 0, y: 1, z: 0 },
            color: options.color || '#ffffff',
            size: options.size || 0.1,
            lifetime: options.lifetime || 2,
            gravity: options.gravity || -9.8
        };
        
        this.init();
    }
    
    init() {
        for (let i = 0; i < this.options.count; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        const geometry = new NinthJS.SphereGeometry(this.options.size, 8, 4);
        const material = new NinthJS.BasicMaterial({
            color: this.options.color,
            transparent: true,
            opacity: 1
        });
        
        const particle = new NinthJS.Mesh(geometry, material);
        
        // Random starting position
        particle.setPosition(
            this.options.position.x + (Math.random() - 0.5) * 2,
            this.options.position.y + (Math.random() - 0.5) * 2,
            this.options.position.z + (Math.random() - 0.5) * 2
        );
        
        particle.velocity = {
            x: this.options.velocity.x + (Math.random() - 0.5) * 0.5,
            y: this.options.velocity.y + (Math.random() - 0.5) * 0.5,
            z: this.options.velocity.z + (Math.random() - 0.5) * 0.5
        };
        
        particle.life = this.options.lifetime;
        particle.maxLife = this.options.lifetime;
        
        this.scene.add(particle);
        return particle;
    }
    
    update(deltaTime) {
        this.particles.forEach(particle => {
            // Update position based on velocity
            const pos = particle.getPosition();
            particle.setPosition(
                pos.x + particle.velocity.x * deltaTime,
                pos.y + particle.velocity.y * deltaTime,
                pos.z + particle.velocity.z * deltaTime
            );
            
            // Apply gravity
            particle.velocity.y += this.options.gravity * deltaTime;
            
            // Update life and opacity
            particle.life -= deltaTime;
            const opacity = Math.max(particle.life / particle.maxLife, 0);
            particle.material.opacity = opacity;
            
            // Respawn dead particles
            if (particle.life <= 0) {
                this.respawnParticle(particle);
            }
        });
    }
    
    respawnParticle(particle) {
        particle.life = this.options.lifetime;
        particle.maxLife = this.options.lifetime;
        particle.material.opacity = 1;
        
        // Random starting position
        particle.setPosition(
            this.options.position.x + (Math.random() - 0.5) * 2,
            this.options.position.y + (Math.random() - 0.5) * 2,
            this.options.position.z + (Math.random() - 0.5) * 2
        );
        
        // Reset velocity
        particle.velocity = {
            x: this.options.velocity.x + (Math.random() - 0.5) * 0.5,
            y: this.options.velocity.y + (Math.random() - 0.5) * 0.5,
            z: this.options.velocity.z + (Math.random() - 0.5) * 0.5
        };
    }
}
```

### 3. Morph Target Animation

```javascript
class MorphTargetAnimation {
    constructor(object) {
        this.object = object;
        this.morphTargets = [];
        this.currentInfluence = 0;
        this.targetInfluence = 0;
        this.interpolationSpeed = 1;
    }
    
    addMorphTarget(name, targetGeometry, influence = 0) {
        const morphTarget = {
            name,
            geometry: targetGeometry,
            influence: influence,
            position: targetGeometry.attributes.position.array,
            originalPosition: object.geometry.attributes.position.array
        };
        
        this.morphTargets.push(morphTarget);
        this.updateMorphTarget(morphTarget);
    }
    
    setMorphTarget(name, influence, duration = 1000) {
        const morphTarget = this.morphTargets.find(target => target.name === name);
        if (!morphTarget) return;
        
        const startInfluence = morphTarget.influence;
        const startTime = performance.now();
        
        const animate = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeInOut(progress);
            
            morphTarget.influence = startInfluence + (influence - startInfluence) * easedProgress;
            this.updateMorphTarget(morphTarget);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    updateMorphTarget(morphTarget) {
        const positionAttribute = this.object.geometry.attributes.position;
        const positions = positionAttribute.array;
        
        for (let i = 0; i < positions.length; i++) {
            positions[i] = morphTarget.originalPosition[i] + 
                          (morphTarget.position[i] - morphTarget.originalPosition[i]) * 
                          morphTarget.influence;
        }
        
        positionAttribute.needsUpdate = true;
        this.object.geometry.computeVertexNormals();
    }
    
    easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}

// Usage
function createMorphingObject() {
    const baseGeometry = new NinthJS.SphereGeometry(1, 16, 8);
    const morphGeometry = new NinthJS.BoxGeometry(2, 0.1, 2);
    
    const morphMaterial = new NinthJS.PhongMaterial({
        color: '#4488ff',
        morphTargets: true
    });
    
    const morphObject = new NinthJS.Mesh(baseGeometry, morphMaterial);
    
    const morphAnimation = new MorphTargetAnimation(morphObject);
    morphAnimation.addMorphTarget('toBox', morphGeometry);
    
    // Animate morphing
    setInterval(() => {
        morphAnimation.setMorphTarget('toBox', Math.random());
    }, 3000);
    
    return morphAnimation;
}
```

## Animation Controllers

### 1. State Machine Animation Controller

```javascript
class AnimationStateMachine {
    constructor(object) {
        this.object = object;
        this.states = {};
        this.currentState = null;
        this.previousState = null;
        this.stateData = {};
    }
    
    addState(name, animationFunction, onEnter = null, onExit = null) {
        this.states[name] = {
            animation: animationFunction,
            onEnter,
            onExit
        };
    }
    
    changeState(newState, data = {}) {
        if (!this.states[newState] || this.currentState === newState) return;
        
        // Exit current state
        if (this.currentState && this.states[this.currentState].onExit) {
            this.states[this.currentState].onExit(this.object, this.stateData);
        }
        
        this.previousState = this.currentState;
        this.currentState = newState;
        this.stateData = data;
        
        // Enter new state
        if (this.states[newState].onEnter) {
            this.states[newState].onEnter(this.object, data);
        }
    }
    
    update(deltaTime) {
        if (this.currentState && this.states[this.currentState].animation) {
            this.states[this.currentState].animation(this.object, deltaTime, this.stateData);
        }
    }
}

// Example usage
function createCharacterAnimation() {
    const character = new NinthJS.Mesh(
        new NinthJS.BoxGeometry(0.5, 1, 0.5),
        new NinthJS.PhongMaterial({ color: '#4488ff' })
    );
    
    const animator = new AnimationStateMachine(character);
    
    // Idle state
    animator.addState('idle', (obj, deltaTime, data) => {
        const time = performance.now() * 0.001;
        const gentleBob = Math.sin(time * 2) * 0.05;
        obj.setPosition(0, gentleBob, 0);
    });
    
    // Walking state
    animator.addState('walk', (obj, deltaTime, data) => {
        const time = performance.now() * 0.005;
        const walkCycle = Math.sin(time * 10);
        const bobHeight = Math.abs(walkCycle) * 0.1;
        
        obj.setPosition(data.x || 0, bobHeight, data.z || 0);
        obj.setRotation(0, time * 2, walkCycle * 0.1);
    });
    
    // Jump state
    animator.addState('jump', 
        // Animation function
        (obj, deltaTime, data) => {
            data.velocityY = (data.velocityY || 0) + data.gravity * deltaTime;
            const pos = obj.getPosition();
            obj.setPosition(pos.x, pos.y + data.velocityY * deltaTime, pos.z);
            
            if (pos.y <= 0) {
                animator.changeState('idle');
            }
        },
        // On enter
        (obj, data) => {
            data.velocityY = 5;
            data.gravity = -10;
        },
        // On exit
        (obj, data) => {
            const pos = obj.getPosition();
            obj.setPosition(pos.x, 0, pos.z);
        }
    );
    
    // Initial state
    animator.changeState('idle');
    
    return animator;
}
```

### 2. Timeline Animation System

```javascript
class TimelineAnimation {
    constructor(scene) {
        this.scene = scene;
        this.timeline = [];
        this.currentTime = 0;
        this.duration = 0;
        this.playing = false;
        this.loop = false;
    }
    
    addTrack(name, keyframes) {
        this.timeline.push({
            name,
            keyframes: keyframes.sort((a, b) => a.time - b.time),
            object: null
        });
        
        this.duration = Math.max(this.duration, keyframes[keyframes.length - 1].time);
    }
    
    bindObject(name, object) {
        const track = this.timeline.find(track => track.name === name);
        if (track) {
            track.object = object;
        }
    }
    
    play(loop = false, startTime = 0) {
        this.playing = true;
        this.loop = loop;
        this.startTime = performance.now() - startTime * 1000;
    }
    
    pause() {
        this.playing = false;
    }
    
    update() {
        if (!this.playing) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        let currentTime = elapsed % this.duration;
        
        if (elapsed >= this.duration && !this.loop) {
            this.playing = false;
            return;
        }
        
        this.timeline.forEach(track => {
            if (!track.object) return;
            
            // Find keyframes
            let prevKeyframe = track.keyframes[0];
            let nextKeyframe = track.keyframes[track.keyframes.length - 1];
            
            for (let i = 0; i < track.keyframes.length - 1; i++) {
                if (currentTime >= track.keyframes[i].time && 
                    currentTime <= track.keyframes[i + 1].time) {
                    prevKeyframe = track.keyframes[i];
                    nextKeyframe = track.keyframes[i + 1];
                    break;
                }
            }
            
            // Interpolate between keyframes
            if (prevKeyframe === nextKeyframe) {
                this.applyKeyframe(track.object, prevKeyframe);
            } else {
                const segmentDuration = nextKeyframe.time - prevKeyframe.time;
                const localTime = currentTime - prevKeyframe.time;
                const t = localTime / segmentDuration;
                
                this.interpolateKeyframe(track.object, prevKeyframe, nextKeyframe, t);
            }
        });
    }
    
    applyKeyframe(object, keyframe) {
        if (keyframe.position) {
            object.setPosition(keyframe.position.x, keyframe.position.y, keyframe.position.z);
        }
        if (keyframe.rotation) {
            object.setRotation(keyframe.rotation.x, keyframe.rotation.y, keyframe.rotation.z);
        }
        if (keyframe.scale) {
            object.setScale(keyframe.scale.x, keyframe.scale.y, keyframe.scale.z);
        }
    }
    
    interpolateKeyframe(object, startKeyframe, endKeyframe, t) {
        const interpolated = {};
        
        // Position interpolation
        if (startKeyframe.position && endKeyframe.position) {
            interpolated.position = {
                x: this.lerp(startKeyframe.position.x, endKeyframe.position.x, t),
                y: this.lerp(startKeyframe.position.y, endKeyframe.position.y, t),
                z: this.lerp(startKeyframe.position.z, endKeyframe.position.z, t)
            };
        }
        
        // Scale interpolation
        if (startKeyframe.scale && endKeyframe.scale) {
            interpolated.scale = {
                x: this.lerp(startKeyframe.scale.x, endKeyframe.scale.x, t),
                y: this.lerp(startKeyframe.scale.y, endKeyframe.scale.y, t),
                z: this.lerp(startKeyframe.scale.z, endKeyframe.scale.z, t)
            };
        }
        
        this.applyKeyframe(object, interpolated);
    }
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
}
```

## Performance Optimization for Animation

### 1. Object Pooling for Animations
```javascript
class AnimationObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    
    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.active.push(obj);
        return obj;
    }
    
    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    updateAll(deltaTime) {
        this.active.forEach(obj => {
            // Update animation for each active object
        });
    }
}
```

### 2. LOD for Animation
```javascript
function createLODAnimation(distance) {
    if (distance < 5) {
        return createDetailedAnimation(); // High detail
    } else if (distance < 15) {
        return createMediumAnimation();   // Medium detail
    } else {
        return createSimpleAnimation();   // Low detail
    }
}

function createDetailedAnimation() {
    // Complex animation with many keyframes
    return new KeyframeAnimation(object);
}

function createSimpleAnimation() {
    // Simple sine wave rotation
    return function animate() {
        const time = performance.now() * 0.001;
        object.setRotation(0, time, 0);
    };
}
```

## Complete Animation Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Animation Demo - Ninth.js</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; }
        #controls {
            position: absolute; top: 10px; left: 10px; z-index: 100;
            background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px;
        }
        button { margin: 2px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Animation Demo</h3>
        <button onclick="startRotation()">Rotation</button>
        <button onclick="startOrbit()">Orbit</button>
        <button onclick="startMorph()">Morph</button>
        <button onclick="startParticles()">Particles</button>
        <button onclick="stopAll()">Stop All</button>
    </div>
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        const canvas = document.getElementById('canvas');
        const scene = new NinthJS.Scene();
        const camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new NinthJS.Renderer(canvas);
        
        camera.setPosition(0, 0, 10);
        
        // Create objects
        const objects = {
            rotation: null,
            orbit: null,
            morph: null,
            particles: null
        };
        
        let activeAnimations = [];
        
        function createRotationDemo() {
            const geometry = new NinthJS.BoxGeometry(1, 1, 1);
            const material = new NinthJS.PhongMaterial({ color: '#4488ff' });
            const cube = new NinthJS.Mesh(geometry, material);
            cube.setPosition(-3, 0, 0);
            scene.add(cube);
            objects.rotation = cube;
            
            const animate = () => {
                const time = performance.now() * 0.001;
                cube.setRotation(time, time * 1.5, time * 0.5);
                requestAnimationFrame(animate);
            };
            animate();
        }
        
        function createOrbitDemo() {
            const geometry = new NinthJS.SphereGeometry(0.5, 16, 8);
            const material = new NinthJS.BasicMaterial({ color: '#ff6b6b' });
            const sphere = new NinthJS.Mesh(geometry, material);
            sphere.setPosition(0, 0, 0);
            scene.add(sphere);
            objects.orbit = sphere;
            
            const center = { x: 0, y: 0, z: 0 };
            const radius = 3;
            const startTime = performance.now();
            
            const animate = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                const angle = elapsed * 0.5; // Speed
                const x = center.x + Math.cos(angle) * radius;
                const z = center.z + Math.sin(angle) * radius;
                const y = center.y + Math.sin(angle * 2) * 1;
                
                sphere.setPosition(x, y, z);
                requestAnimationFrame(animate);
            };
            animate();
        }
        
        function createMorphDemo() {
            const geometry = new NinthJS.SphereGeometry(1, 16, 8);
            const material = new NinthJS.PhongMaterial({ color: '#4ecdc4', morphTargets: true });
            const sphere = new NinthJS.Mesh(geometry, material);
            sphere.setPosition(0, 0, 0);
            scene.add(sphere);
            objects.morph = sphere;
            
            // Create cube target
            const cubeGeometry = new NinthJS.BoxGeometry(1, 1, 1);
            const morphAnimation = new MorphTargetAnimation(sphere);
            morphAnimation.addMorphTarget('toCube', cubeGeometry);
            
            const animate = () => {
                const time = performance.now() * 0.001;
                const influence = (Math.sin(time) + 1) / 2; // 0 to 1
                morphAnimation.setMorphTarget('toCube', influence, 100);
                requestAnimationFrame(animate);
            };
            animate();
        }
        
        function createParticleDemo() {
            const particleSystem = new ParticleSystem(scene, {
                count: 100,
                position: { x: 0, y: 0, z: 0 },
                color: '#ffff00',
                size: 0.05,
                lifetime: 2
            });
            objects.particles = particleSystem;
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            if (objects.particles) {
                objects.particles.update(1/60); // Assuming 60 FPS
            }
            
            renderer.render(scene, camera);
        }
        
        // Control functions
        function startRotation() {
            if (!objects.rotation) createRotationDemo();
        }
        
        function startOrbit() {
            if (!objects.orbit) createOrbitDemo();
        }
        
        function startMorph() {
            if (!objects.morph) createMorphDemo();
        }
        
        function startParticles() {
            if (!objects.particles) createParticleDemo();
        }
        
        function stopAll() {
            // Remove all animated objects
            Object.values(objects).forEach(obj => {
                if (obj) {
                    if (obj instanceof ParticleSystem) {
                        // Handle particle system cleanup
                        obj.particles.forEach(particle => scene.remove(particle));
                    } else {
                        scene.remove(obj);
                    }
                }
            });
            
            // Reset objects
            objects = { rotation: null, orbit: null, morph: null, particles: null };
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        animate();
    </script>
</body>
</html>
```

## Animation Best Practices

### 1. Performance Guidelines
- Use object pooling for frequent create/destroy operations
- Implement LOD for distant objects
- Batch similar animations together
- Use deltaTime for frame-rate independent animations

### 2. Animation Quality
- Use easing functions for natural motion
- Maintain consistent frame rates
- Test animations at different speeds
- Consider accessibility (motion sensitivity)

### 3. Code Organization
- Separate animation logic from rendering
- Use classes for complex animation systems
- Implement proper cleanup for memory management
- Document animation sequences and timings

## Common Animation Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Tweening | Smooth transitions | `animatePosition(from, to, duration)` |
| Oscillation | Repeated motion | `sin(time * frequency) * amplitude` |
| Physics-based | Realistic motion | `position += velocity * deltaTime` |
| State machine | Character behavior | `character.changeState('jump')` |
| Timeline | Complex sequences | `timeline.play()` |

## Troubleshooting Animation Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Janky animation | Frame rate drops | Use deltaTime and reduce complexity |
| Objects teleport | Large time jumps | Clamp deltaTime values |
| Memory leaks | Animations not cleaned up | Implement proper disposal |
| Inconsistent speed | Frame rate dependent | Always use deltaTime |

## Next Steps

Now that you've mastered animation basics, explore:

1. **[Loading 3D Models](./loading-3d-models.md)** - Animate external 3D models
2. **[Physics Integration](./physics-integration.md)** - Physics-driven animations
3. **[Advanced Rendering](./advanced-rendering.md)** - Animation effects in shaders
4. **[Performance Optimization](./performance-optimization.md)** - Optimize complex animations

---

**Your scenes are now alive with motion! The art of animation awaits your creativity! 🎭**