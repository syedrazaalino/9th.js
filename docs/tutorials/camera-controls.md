# Camera Controls in Ninth.js

Learn to create interactive and smooth camera systems for your Ninth.js applications. This tutorial covers different camera types, control schemes, and advanced camera features.

## Camera Types Overview

Ninth.js provides several camera types for different use cases:

| Camera Type | Use Case | Key Features |
|-------------|----------|--------------|
| **PerspectiveCamera** | General 3D scenes | Natural perspective projection |
| **OrthographicCamera** | 2D games, UI | Parallel projection, no perspective |
| **CubeCamera** | Environment mapping | Renders 6 faces of a cube |
| **ArrayCamera** | VR/AR applications | Multiple camera views |

## Basic Camera Controls

### 1. Simple Orbit Controls

```javascript
class OrbitControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Control parameters
        this.target = new NinthJS.Vector3(0, 0, 0);
        this.distance = 10;
        this.minDistance = 2;
        this.maxDistance = 50;
        this.minPolarAngle = 0;
        this.maxPolarAngle = Math.PI;
        
        // Control state
        this.state = 'none';
        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.0;
        this.panSpeed = 1.0;
        
        // Internal variables
        this spherical = new NinthJS.Spherical();
        this.sphericalDelta = new NinthJS.Spherical();
        this.panOffset = new NinthJS.Vector3();
        this.scale = 1;
        
        // Event handling
        this.setupEventListeners();
        this.update();
    }
    
    setupEventListeners() {
        this.domElement.addEventListener('contextmenu', this.onContextMenu.bind(this));
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this));
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
        
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
    
    onContextMenu(event) {
        if (this.enabled === false) return;
        event.preventDefault();
    }
    
    onMouseDown(event) {
        if (this.enabled === false) return;
        event.preventDefault();
        
        switch (event.button) {
            case 0: // left
                this.state = 'rotate';
                break;
            case 2: // right
                this.state = 'pan';
                break;
        }
    }
    
    onMouseMove(event) {
        if (this.enabled === false) return;
        
        if (this.state === 'rotate') {
            this.rotateLeft(getMouseMovementX(event) * this.rotateSpeed);
            this.rotateUp(getMouseMovementY(event) * this.rotateSpeed);
        } else if (this.state === 'pan') {
            this.pan(getMouseMovementX(event) * this.panSpeed, getMouseMovementY(event) * this.panSpeed);
        }
    }
    
    onMouseUp(event) {
        this.state = 'none';
    }
    
    onMouseWheel(event) {
        if (this.enabled === false) return;
        
        if (event.deltaY < 0) {
            this.dollyIn(this.zoomSpeed);
        } else if (event.deltaY > 0) {
            this.dollyOut(this.zoomSpeed);
        }
    }
    
    onTouchStart(event) {
        if (this.enabled === false) return;
        
        if (event.touches.length === 1) {
            this.state = 'touch-rotate';
        } else if (event.touches.length === 2) {
            this.state = 'touch-zoom-pan';
            this.distance = this.getObjectDistance();
        }
    }
    
    onTouchMove(event) {
        if (this.enabled === false) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        switch (event.touches.length) {
            case 1: // one-fingered touch: rotate
                this.rotateLeft(event.touches[0].movementX * this.rotateSpeed);
                this.rotateUp(event.touches[0].movementY * this.rotateSpeed);
                break;
            
            case 2: // two-fingered touch: dolly in, zoom out, and pan
                if (this.state === 'touch-zoom-pan') {
                    this.dollyIn(event.touches[0].movementY * this.zoomSpeed);
                    this.pan(event.touches[1].movementX * this.panSpeed, event.touches[1].movementY * this.panSpeed);
                }
                break;
        }
    }
    
    rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
    }
    
    rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
    }
    
    pan(deltaX, deltaY) {
        const v = new NinthJS.Vector3();
        v.copy(this.camera.position).sub(this.target);
        const targetDistance = v.length();
        v.multiplyScalar(this.panSpeed * targetDistance / this.domElement.clientHeight);
        
        // panX is right vector, panY is up vector
        const pan = new NinthJS.Vector3();
        pan.setFromMatrixColumn(this.camera.matrix, 0);
        pan.multiplyScalar(-deltaX);
        
        this.panOffset.add(pan);
    }
    
    dollyIn(scale) {
        this.scale /= scale;
    }
    
    dollyOut(scale) {
        this.scale *= scale;
    }
    
    handleResize() {
        this.camera.aspect = this.domElement.clientWidth / this.domElement.clientHeight;
        this.camera.updateProjectionMatrix();
    }
    
    update() {
        const offset = new NinthJS.Vector3();
        offset.copy(this.camera.position).sub(this.target);
        
        // rotate offset to spherical coordinates
        this.spherical.setFromVector3(offset);
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        // restrict theta to be between desired limits
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        this.spherical.makeSafe();
        
        this.spherical.radius *= this.scale;
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        
        offset.setFromSpherical(this.spherical);
        
        // translate target to panned location
        this.target.add(this.panOffset);
        
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        
        this.sphericalDelta.set(0, 0, 0);
        this.scale = 1;
        this.panOffset.set(0, 0, 0);
        
        return this.checkCollision();
    }
    
    checkCollision() {
        // Check if camera position has changed (for collision detection)
        return true;
    }
    
    dispose() {
        this.domElement.removeEventListener('contextmenu', this.onContextMenu);
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        this.domElement.removeEventListener('wheel', this.onMouseWheel);
        this.domElement.removeEventListener('touchstart', this.onTouchStart);
        this.domElement.removeEventListener('touchend', this.onTouchEnd);
        this.domElement.removeEventListener('touchmove', this.onTouchMove);
        
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
    }
}

// Helper function for mouse movement
function getMouseMovementX(event) {
    return event.movementX || event.mozMovementX || event.webkitMovementX || event.clientX;
}

function getMouseMovementY(event) {
    return event.movementY || event.mozMovementY || event.webkitMovementY || event.clientY;
}
```

### 2. First-Person Controls

```javascript
class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Movement parameters
        this.movementSpeed = 10.0;
        this.lookSpeed = 0.1;
        this.lookVertical = true;
        this.constrainVertical = true;
        this.verticalMin = Math.PI / 6;
        this.verticalMax = Math.PI - Math.PI / 6;
        this.autoForward = false;
        this.activeLook = true;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        
        this.velocity = new NinthJS.Vector3();
        this.direction = new NinthJS.Vector3();
        this.euler = new NinthJS.Euler(0, 0, 0, 'YXZ');
        
        this.enabled = true;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.domElement.addEventListener('click', this.onClick.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('pointerdown', this.onPointerDown.bind(this));
        document.addEventListener('pointerup', this.onPointerUp.bind(this));
    }
    
    onClick() {
        this.domElement.requestPointerLock();
    }
    
    onPointerDown() {
        this.domElement.requestPointerLock();
    }
    
    onPointerUp() {
        document.exitPointerLock();
    }
    
    onMouseMove(event) {
        if (this.enabled === false) return;
        
        if (this.activeLook === true) {
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
            
            this.euler.setFromQuaternion(this.camera.quaternion);
            
            this.euler.y -= movementX * this.lookSpeed;
            this.euler.x -= movementY * this.lookSpeed;
            
            if (this.constrainVertical === true) {
                this.euler.x = Math.max(this.verticalMin, Math.min(this.verticalMax, this.euler.x));
            } else {
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            }
            
            this.euler.y = Math.max(-Math.PI, Math.min(Math.PI, this.euler.y));
            
            this.camera.quaternion.setFromEuler(this.euler);
        }
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            
            case 'Space':
                if (this.canJump === true) this.velocity.y += 350;
                this.canJump = false;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }
    
    update(delta) {
        if (this.enabled === false) return;
        
        const actualMoveSpeed = this.movementSpeed * delta;
        
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.y -= this.velocity.y * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
        
        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * actualMoveSpeed * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * actualMoveSpeed * delta;
        
        // Apply gravity
        this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        
        // Update camera position
        this.camera.translateX(this.velocity.x * delta);
        this.camera.translateY(this.velocity.y * delta);
        this.camera.translateZ(this.velocity.z * delta);
        
        if (this.camera.position.y < 10) {
            this.velocity.y = 0;
            this.camera.position.y = 10;
            this.canJump = true;
        }
    }
    
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('pointerdown', this.onPointerDown);
        document.removeEventListener('pointerup', this.onPointerUp);
        this.domElement.removeEventListener('click', this.onClick);
    }
}
```

## Advanced Camera Features

### 1. Camera Path Animation

```javascript
class CameraPath {
    constructor(camera) {
        this.camera = camera;
        this.path = [];
        this.currentSegment = 0;
        this.t = 0;
        this.duration = 5.0;
        this.playing = false;
        this.loop = false;
        this.onComplete = null;
    }
    
    addWaypoint(position, target, duration = 1.0) {
        const waypoint = {
            position: position.clone(),
            target: target.clone(),
            duration: duration
        };
        
        this.path.push(waypoint);
        this.updateTotalDuration();
    }
    
    updateTotalDuration() {
        this.duration = this.path.reduce((total, waypoint) => total + waypoint.duration, 0);
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
        if (!this.playing || this.path.length === 0) return;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        const pathTime = elapsed % this.duration;
        
        // Find current segment
        let currentTime = 0;
        let segmentIndex = 0;
        
        for (let i = 0; i < this.path.length; i++) {
            const segmentEnd = currentTime + this.path[i].duration;
            if (pathTime <= segmentEnd) {
                segmentIndex = i;
                this.t = (pathTime - currentTime) / this.path[i].duration;
                break;
            }
            currentTime = segmentEnd;
        }
        
        const segment = this.path[segmentIndex];
        const nextSegment = this.path[(segmentIndex + 1) % this.path.length];
        
        // Interpolate position
        const position = new NinthJS.Vector3();
        position.lerpVectors(segment.position, nextSegment.position, this.easeInOutCubic(this.t));
        
        // Interpolate target
        const target = new NinthJS.Vector3();
        target.lerpVectors(segment.target, nextSegment.target, this.easeInOutCubic(this.t));
        
        // Apply to camera
        this.camera.position.copy(position);
        this.camera.lookAt(target);
        
        // Check if path is complete
        if (pathTime >= this.duration && !this.loop) {
            this.playing = false;
            if (this.onComplete) this.onComplete();
        }
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    clear() {
        this.path = [];
        this.currentSegment = 0;
        this.t = 0;
    }
}
```

### 2. Camera Shake Effect

```javascript
class CameraShake {
    constructor(camera) {
        this.camera = camera;
        this.intensity = 0;
        this.duration = 0;
        this.decay = 2.0;
        this.originalPosition = camera.position.clone();
        this.offset = new NinthJS.Vector3();
        this.time = 0;
        this.active = false;
    }
    
    shake(intensity = 0.1, duration = 0.5) {
        this.intensity = intensity;
        this.duration = duration;
        this.time = 0;
        this.active = true;
    }
    
    update(delta) {
        if (!this.active) return;
        
        this.time += delta;
        
        if (this.time >= this.duration) {
            this.stop();
            return;
        }
        
        // Calculate shake offset
        const shakeAmount = this.intensity * Math.exp(-this.decay * this.time);
        this.offset.set(
            (Math.random() - 0.5) * shakeAmount,
            (Math.random() - 0.5) * shakeAmount,
            (Math.random() - 0.5) * shakeAmount
        );
        
        // Apply shake to camera
        this.camera.position.copy(this.originalPosition).add(this.offset);
    }
    
    stop() {
        this.active = false;
        this.camera.position.copy(this.originalPosition);
    }
}
```

### 3. Camera Smooth Follow

```javascript
class SmoothFollowCamera {
    constructor(camera, targetObject) {
        this.camera = camera;
        this.target = targetObject;
        
        // Follow parameters
        this.offset = new NinthJS.Vector3(0, 5, 10);
        this.smoothness = 0.1;
        this.lookAhead = new NinthJS.Vector3(0, 0, -10);
        
        // Smooth position tracking
        this.currentPosition = camera.position.clone();
        this.targetPosition = new NinthJS.Vector3();
        
        // Look direction smoothing
        this.currentLookAt = new NinthJS.Vector3();
        this.targetLookAt = new NinthJS.Vector3();
        
        this.active = true;
    }
    
    setTarget(targetObject) {
        this.target = targetObject;
    }
    
    setOffset(offset) {
        this.offset.copy(offset);
    }
    
    setSmoothness(smoothness) {
        this.smoothness = smoothness;
    }
    
    update(delta) {
        if (!this.active || !this.target) return;
        
        // Calculate desired position
        this.targetPosition.copy(this.target.position).add(this.offset);
        
        // Calculate desired look-at position
        this.targetLookAt.copy(this.target.position).add(this.lookAhead);
        
        // Smooth position interpolation
        const lerpFactor = 1 - Math.pow(1 - this.smoothness, delta * 60);
        this.currentPosition.lerp(this.targetPosition, lerpFactor);
        this.currentLookAt.lerp(this.targetLookAt, lerpFactor);
        
        // Apply smoothed camera position and orientation
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
    
    dispose() {
        this.active = false;
    }
}
```

## Complete Camera System Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>Camera Controls Demo - Ninth.js</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: Arial, sans-serif; }
        #controls {
            position: absolute; top: 10px; left: 10px; z-index: 100;
            background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px;
        }
        button { margin: 5px; padding: 8px 12px; background: #4488ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #3366cc; }
        button.active { background: #ff6b6b; }
        .control-group { margin: 10px 0; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Camera Controls</h3>
        
        <div class="control-group">
            <button id="orbitBtn" onclick="setControlMode('orbit')">Orbit</button>
            <button id="fpsBtn" onclick="setControlMode('fps')">First Person</button>
            <button id="followBtn" onclick="setControlMode('follow')">Follow</button>
            <button id="pathBtn" onclick="setControlMode('path')">Path</button>
        </div>
        
        <div class="control-group">
            <button onclick="triggerShake()">Shake Camera</button>
            <button onclick="resetView()">Reset View</button>
            <button onclick="toggleTargetLock()">Toggle Target Lock</button>
        </div>
        
        <div class="control-group">
            <label>Speed:</label>
            <input type="range" id="speed" min="1" max="20" value="10">
            <span id="speedValue">10</span>
        </div>
        
        <div class="control-group">
            <div>Current Mode: <span id="currentMode">orbit</span></div>
        </div>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        class CameraControlsDemo {
            constructor() {
                this.canvas = document.getElementById('canvas');
                this.scene = new NinthJS.Scene();
                this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new NinthJS.WebGLRenderer(this.canvas);
                
                // Camera control systems
                this.controls = {
                    orbit: null,
                    fps: null,
                    follow: null,
                    path: null
                };
                
                this.currentMode = 'orbit';
                this.targetLocked = false;
                this.targetObject = null;
                
                this.init();
                this.createScene();
                this.setupCameraSystems();
                this.setupControls();
                this.animate();
            }
            
            init() {
                this.scene.setBackground('#001122');
                this.camera.setPosition(0, 5, 10);
                
                // Setup renderer
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = NinthJS.PCFSoftShadowMap;
                
                // Setup lighting
                this.setupLighting();
                
                // Handle window resize
                window.addEventListener('resize', () => this.handleResize());
            }
            
            setupLighting() {
                // Ambient light
                const ambientLight = new NinthJS.AmbientLight(0.3, '#404040');
                this.scene.add(ambientLight);
                
                // Main directional light
                const directionalLight = new NinthJS.DirectionalLight(1, '#ffffff');
                directionalLight.setPosition(10, 10, 5);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                this.scene.add(directionalLight);
            }
            
            createScene() {
                // Create ground
                const groundGeometry = new NinthJS.PlaneGeometry(50, 50);
                const groundMaterial = new NinthJS.PhongMaterial({ color: '#333333' });
                const ground = new NinthJS.Mesh(groundGeometry, groundMaterial);
                ground.setRotation(-Math.PI / 2, 0, 0);
                ground.receiveShadow = true;
                this.scene.add(ground);
                
                // Create some objects to look at
                this.createTargetObjects();
            }
            
            createTargetObjects() {
                const objects = [];
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
                
                for (let i = 0; i < 10; i++) {
                    const geometry = new NinthJS.SphereGeometry(0.5, 16, 8);
                    const material = new NinthJS.PhongMaterial({ color: colors[i % colors.length] });
                    const sphere = new NinthJS.Mesh(geometry, material);
                    
                    sphere.setPosition(
                        Math.sin(i * 0.7) * 8,
                        2 + Math.sin(i) * 2,
                        Math.cos(i * 0.7) * 8
                    );
                    
                    sphere.castShadow = true;
                    this.scene.add(sphere);
                    objects.push(sphere);
                }
                
                // Use first object as primary target
                this.targetObject = objects[0];
                
                // Store all objects for animation
                this.animatedObjects = objects;
            }
            
            setupCameraSystems() {
                // Orbit controls
                this.controls.orbit = new OrbitControls(this.camera, this.canvas);
                
                // First person controls
                this.controls.fps = new FirstPersonControls(this.camera, this.canvas);
                this.controls.fps.activeLook = true;
                
                // Follow camera
                this.controls.follow = new SmoothFollowCamera(this.camera, this.targetObject);
                this.controls.follow.setOffset(new NinthJS.Vector3(0, 5, 10));
                
                // Camera path
                this.controls.path = new CameraPath(this.camera);
                this.controls.path.addWaypoint(
                    new NinthJS.Vector3(15, 10, 15),
                    new NinthJS.Vector3(0, 0, 0),
                    3.0
                );
                this.controls.path.addWaypoint(
                    new NinthJS.Vector3(-15, 10, 15),
                    new NinthJS.Vector3(0, 0, 0),
                    3.0
                );
                this.controls.path.addWaypoint(
                    new NinthJS.Vector3(-15, 10, -15),
                    new NinthJS.Vector3(0, 0, 0),
                    3.0
                );
                this.controls.path.addWaypoint(
                    new NinthJS.Vector3(15, 10, -15),
                    new NinthJS.Vector3(0, 0, 0),
                    3.0
                );
                
                // Camera shake
                this.cameraShake = new CameraShake(this.camera);
                
                // Activate initial mode
                this.setControlMode('orbit');
            }
            
            setupControls() {
                // Speed control
                const speedSlider = document.getElementById('speed');
                const speedValue = document.getElementById('speedValue');
                speedSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    speedValue.textContent = value;
                    
                    // Update all control speeds
                    this.controls.orbit.rotateSpeed = value * 0.1;
                    this.controls.fps.movementSpeed = value;
                    this.controls.follow.smoothness = value * 0.01;
                });
            }
            
            setControlMode(mode) {
                // Deactivate all controls
                Object.values(this.controls).forEach(control => {
                    if (control && control.enabled !== undefined) {
                        control.enabled = false;
                    }
                });
                
                // Update button states
                document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                document.getElementById(mode + 'Btn').classList.add('active');
                
                // Activate selected mode
                this.currentMode = mode;
                
                switch (mode) {
                    case 'orbit':
                        this.controls.orbit.enabled = true;
                        break;
                    case 'fps':
                        this.controls.fps.enabled = true;
                        this.controls.fps.activeLook = true;
                        break;
                    case 'follow':
                        this.controls.follow.active = true;
                        break;
                    case 'path':
                        this.controls.path.play(true);
                        break;
                }
                
                document.getElementById('currentMode').textContent = mode;
            }
            
            triggerShake() {
                this.cameraShake.shake(0.2, 0.5);
            }
            
            resetView() {
                this.camera.setPosition(0, 5, 10);
                this.camera.lookAt(0, 0, 0);
                
                if (this.controls.orbit) {
                    this.controls.orbit.target.set(0, 0, 0);
                }
            }
            
            toggleTargetLock() {
                this.targetLocked = !this.targetLocked;
                
                if (this.controls.follow) {
                    if (this.targetLocked && this.animatedObjects.length > 0) {
                        // Follow a specific object
                        this.controls.follow.setTarget(this.targetObject);
                    } else {
                        // Follow the scene center
                        const centerTarget = new NinthJS.Vector3(0, 0, 0);
                        this.controls.follow.setTarget({ position: centerTarget });
                    }
                }
            }
            
            updateCameraControls(delta) {
                switch (this.currentMode) {
                    case 'orbit':
                        if (this.controls.orbit.enabled) {
                            this.controls.orbit.update();
                        }
                        break;
                        
                    case 'fps':
                        if (this.controls.fps.enabled) {
                            this.controls.fps.update(delta);
                        }
                        break;
                        
                    case 'follow':
                        if (this.controls.follow.active) {
                            this.controls.follow.update(delta);
                        }
                        break;
                        
                    case 'path':
                        if (this.controls.path.playing) {
                            this.controls.path.update();
                        }
                        break;
                }
                
                // Update camera shake
                this.cameraShake.update(delta);
            }
            
            animateObjects(delta) {
                this.animatedObjects.forEach((obj, index) => {
                    const time = performance.now() * 0.001;
                    obj.setPosition(
                        Math.sin(time + index * 0.7) * 8,
                        2 + Math.sin(time * 2 + index) * 2,
                        Math.cos(time + index * 0.7) * 8
                    );
                    
                    obj.setRotation(time * 0.5, time * 0.3, 0);
                });
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                const delta = 1 / 60;
                const startTime = performance.now();
                
                // Update animated objects
                this.animateObjects(delta);
                
                // Update camera controls
                this.updateCameraControls(delta);
                
                // Render
                this.renderer.render(this.scene, this.camera);
            }
            
            handleResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }
        
        // Initialize demo
        const cameraDemo = new CameraControlsDemo();
        
        // Global functions for UI
        function setControlMode(mode) {
            cameraDemo.setControlMode(mode);
        }
        
        function triggerShake() {
            cameraDemo.triggerShake();
        }
        
        function resetView() {
            cameraDemo.resetView();
        }
        
        function toggleTargetLock() {
            cameraDemo.toggleTargetLock();
        }
    </script>
</body>
</html>
```

## Best Practices for Camera Controls

### 1. Performance Tips
- **Minimize update frequency** - Only update controls when needed
- **Use requestAnimationFrame** - Sync with browser repaints
- **Optimize event handlers** - Debounce mouse/touch events
- **Cache calculations** - Reuse vector calculations when possible

### 2. User Experience
- **Provide visual feedback** - Show control hints to users
- **Support multiple input methods** - Mouse, keyboard, touch
- **Set appropriate limits** - Constrain camera movement to reasonable ranges
- **Offer customization** - Allow users to adjust control sensitivity

### 3. Code Organization
- **Separate control logic** - Keep camera controls modular
- **Handle cleanup** - Dispose of event listeners properly
- **Test edge cases** - Handle extreme input values gracefully
- **Document APIs** - Make controls easy to understand and use

## Common Camera Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Orbit** | Product viewers, 3D model inspection | `new OrbitControls(camera, canvas)` |
| **First Person** | Games, virtual tours | `new FirstPersonControls(camera, canvas)` |
| **Follow** | Cinematic shots, character tracking | `new SmoothFollowCamera(camera, target)` |
| **Path** | Cutscenes, guided tours | `new CameraPath(camera)` |
| **Hybrid** | Multiple control modes | Combination of above patterns |

## Troubleshooting Camera Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Camera not responding | Event listeners not attached | Check `setupEventListeners()` calls |
| Jerky movement | Missing delta time | Use proper timing in updates |
| Wrong perspective | Camera parameters incorrect | Check FOV, aspect ratio, near/far planes |
| Controls conflict | Multiple active controls | Disable inactive control systems |
| Performance issues | Too frequent updates | Throttle control updates |

## Next Steps

With camera controls mastered, explore:

1. **[Advanced Rendering](./advanced-rendering.md)** - Camera effects and post-processing
2. **[Physics Integration](./physics-integration.md)** - Camera collision with physics
3. **[Animation Basics](./animation-basics.md)** - Animated camera movements
4. **[Performance Optimization](./performance-optimization.md)** - Optimize camera systems

---

**Your cameras now move with precision and style! Create immersive 3D experiences! 📹**