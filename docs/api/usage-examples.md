# Usage Examples

This document provides practical examples and common patterns for using the Ninth.js WebGL 3D library.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Scene Management](#scene-management)
- [Object Creation](#object-creation)
- [Material Systems](#material-systems)
- [Lighting](#lighting)
- [Camera Controls](#camera-controls)
- [Animation](#animation)
- [Loading Models](#loading-models)
- [Post-Processing](#post-processing)
- [Particle Systems](#particle-systems)
- [Performance Optimization](#performance-optimization)
- [Advanced Patterns](#advanced-patterns)

## Basic Setup

### Minimal Setup
```javascript
import { Scene, PerspectiveCamera, WebGLRenderer, Mesh, BoxGeometry, MeshBasicMaterial } from 'ninth';

// Create scene
const scene = new Scene();

// Create camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create renderer
const renderer = new WebGLRenderer({ canvas: document.getElementById('canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add a cube
const geometry = new BoxGeometry();
const material = new MeshBasicMaterial({ color: '#FF0000' });
const cube = new Mesh(geometry, material);
scene.addObject(cube);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}

animate();
```

### Complete Application Setup
```javascript
class App {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(75, this.getAspect(), 0.1, 1000);
        this.renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        
        this.clock = new Clock();
        this.setupRenderer();
        this.setupScene();
        this.setupEventListeners();
        this.animate();
    }
    
    getAspect() {
        return this.canvas.clientWidth / this.canvas.clientHeight;
    }
    
    setupRenderer() {
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor('#2C3E50');
        this.renderer.shadowMap.enabled = true;
    }
    
    setupScene() {
        // Add ambient light
        const ambientLight = new AmbientLight(0x404040, 0.4);
        this.scene.addLight(ambientLight);
        
        // Add directional light
        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        this.scene.addLight(directionalLight);
        
        // Add ground plane
        const groundGeometry = new PlaneGeometry(20, 20);
        const groundMaterial = new MeshStandardMaterial({ color: '#95A5A6' });
        const ground = new Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.addObject(ground);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    onWindowResize() {
        this.camera.aspect = this.getAspect();
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();
        this.scene.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize app
const app = new App('canvas');
```

## Scene Management

### Object Hierarchy
```javascript
// Create a character with hierarchical structure
function createCharacter() {
    const character = new Object3D();
    character.name = 'character';
    
    // Body
    const body = new Mesh(
        new BoxGeometry(0.8, 1.2, 0.4),
        new MeshStandardMaterial({ color: '#FFB6C1' })
    );
    body.name = 'body';
    character.addChild(body);
    
    // Head
    const head = new Object3D();
    head.name = 'head';
    head.position.y = 0.8;
    character.addChild(head);
    
    const headMesh = new Mesh(
        new SphereGeometry(0.4),
        new MeshStandardMaterial({ color: '#FFDBAC' })
    );
    head.addChild(headMesh);
    
    // Arms
    const leftArm = new Object3D();
    leftArm.name = 'leftArm';
    leftArm.position.set(-0.6, 0.2, 0);
    character.addChild(leftArm);
    
    const rightArm = new Object3D();
    rightArm.name = 'rightArm';
    rightArm.position.set(0.6, 0.2, 0);
    character.addChild(rightArm);
    
    return character;
}

// Usage
const character = createCharacter();
scene.addObject(character);

// Find and manipulate objects
const body = scene.getObjectByName('character').getObjectByName('body');
body.material.color.setHex(0xFF0000);
```

### Scene Graph Traversal
```javascript
// Traverse and update all objects
scene.traverse((object) => {
    if (object.userData.requiresUpdate) {
        object.updateMatrixWorld();
    }
});

// Find all objects of specific type
const meshes = scene.findObjectsByType(Mesh);
const lights = scene.findObjectsByType(Light);
const cameras = scene.findObjectsByType(Camera);

// Find objects by property
const animatedObjects = scene.getObjectsByProperty('userData.animated', true);
const shadowCasters = scene.getObjectsByProperty('castShadow', true);

// Selective traversal
scene.traverseVisible((object) => {
    if (object.visible && object.userData.canReceiveShadows) {
        object.receiveShadow = true;
    }
});
```

### Scene Instancing
```javascript
// Create instanced objects for performance
function createForest(scene, areaSize, treeCount) {
    const treeGeometry = new ConeGeometry(2, 8, 8);
    const trunkGeometry = new CylinderGeometry(0.3, 0.4, 4, 8);
    
    const leafMaterial = new MeshStandardMaterial({ color: '#228B22' });
    const trunkMaterial = new MeshStandardMaterial({ color: '#8B4513' });
    
    // Use instancing for leaves
    if (treeGeometry.instancedMesh) {
        const instancedLeaves = new InstancedMesh(treeGeometry, leafMaterial, treeCount);
        
        const dummy = new Object3D();
        for (let i = 0; i < treeCount; i++) {
            dummy.position.set(
                (Math.random() - 0.5) * areaSize,
                0,
                (Math.random() - 0.5) * areaSize
            );
            dummy.rotation.y = Math.random() * Math.PI * 2;
            dummy.updateMatrix();
            instancedLeaves.setMatrixAt(i, dummy.matrix);
        }
        
        scene.addObject(instancedLeaves);
    } else {
        // Fallback for regular meshes
        for (let i = 0; i < treeCount; i++) {
            const leaves = new Mesh(treeGeometry, leafMaterial);
            leaves.position.set(
                (Math.random() - 0.5) * areaSize,
                4,
                (Math.random() - 0.5) * areaSize
            );
            leaves.rotation.y = Math.random() * Math.PI * 2;
            scene.addObject(leaves);
        }
    }
    
    // Regular meshes for trunks
    for (let i = 0; i < treeCount; i++) {
        const trunk = new Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(
            (Math.random() - 0.5) * areaSize,
            0,
            (Math.random() - 0.5) * areaSize
        );
        scene.addObject(trunk);
    }
}
```

## Object Creation

### Procedural Object Generation
```javascript
// Generate procedural buildings
function createBuilding(x, z, height, width, depth) {
    const building = new Object3D();
    building.name = 'building';
    
    // Main structure
    const structureGeometry = new BoxGeometry(width, height, depth);
    const structureMaterial = new MeshStandardMaterial({ 
        color: '#B0C4DE',
        roughness: 0.8
    });
    const structure = new Mesh(structureGeometry, structureMaterial);
    structure.position.y = height / 2;
    building.addChild(structure);
    
    // Windows
    const windowCount = Math.floor(height / 3);
    for (let floor = 0; floor < windowCount; floor++) {
        const windowRow = new Object3D();
        windowRow.position.y = height * (floor + 1) / (windowCount + 1);
        building.addChild(windowRow);
        
        const windowPerSide = Math.floor(width / 2);
        for (let i = 0; i < windowPerSide; i++) {
            const windowGeometry = new PlaneGeometry(1.5, 2);
            const windowMaterial = new MeshStandardMaterial({
                color: '#87CEEB',
                emissive: '#4169E1',
                emissiveIntensity: 0.1
            });
            
            // Front windows
            const frontWindow = new Mesh(windowGeometry, windowMaterial);
            frontWindow.position.set(
                (i - windowPerSide / 2) * 2,
                0,
                depth / 2 + 0.01
            );
            windowRow.addChild(frontWindow);
            
            // Back windows
            const backWindow = new Mesh(windowGeometry, windowMaterial);
            backWindow.position.set(
                (i - windowPerSide / 2) * 2,
                0,
                -depth / 2 - 0.01
            );
            backWindow.rotation.y = Math.PI;
            windowRow.addChild(backWindow);
        }
    }
    
    building.position.set(x, 0, z);
    return building;
}

// Create city
function createCity(scene, size, buildingCount) {
    for (let i = 0; i < buildingCount; i++) {
        const x = (Math.random() - 0.5) * size;
        const z = (Math.random() - 0.5) * size;
        const height = Math.random() * 20 + 5;
        const width = Math.random() * 4 + 2;
        const depth = Math.random() * 4 + 2;
        
        const building = createBuilding(x, z, height, width, depth);
        scene.addObject(building);
    }
}
```

### Custom Mesh Creation
```javascript
// Create custom geometry from scratch
function createCustomMesh() {
    const geometry = new BufferGeometry();
    
    // Define vertices (triangle)
    const vertices = new Float32Array([
        0, 0, 0,    // Vertex 1
        1, 0, 0,    // Vertex 2
        0, 1, 0     // Vertex 3
    ]);
    
    const positionAttribute = new BufferAttribute(vertices, 3);
    geometry.addAttribute('position', positionAttribute);
    
    // Define normals
    const normals = new Float32Array([
        0, 0, 1,    // Normal for all vertices
        0, 0, 1,
        0, 0, 1
    ]);
    
    const normalAttribute = new BufferAttribute(normals, 3);
    geometry.addAttribute('normal', normalAttribute);
    
    // Define UVs
    const uvs = new Float32Array([
        0, 0,        // UV for vertex 1
        1, 0,        // UV for vertex 2
        0, 1         // UV for vertex 3
    ]);
    
    const uvAttribute = new BufferAttribute(uvs, 2);
    geometry.addAttribute('uv', uvAttribute);
    
    // Define indices
    const indices = new Uint16Array([0, 1, 2]);
    const indexAttribute = new BufferAttribute(indices, 1);
    geometry.setIndex(indexAttribute);
    
    // Create material
    const material = new MeshStandardMaterial({
        color: '#FF6B6B',
        side: 'double'
    });
    
    const mesh = new Mesh(geometry, material);
    return mesh;
}
```

### Dynamic Geometry Updates
```javascript
// Create animated plane
function createAnimatedPlane() {
    const geometry = new PlaneGeometry(10, 10, 50, 50);
    const material = new MeshStandardMaterial({
        color: '#4169E1',
        wireframe: false,
        side: 'double'
    });
    
    const plane = new Mesh(geometry, material);
    
    // Store original positions for animation
    const positionAttribute = geometry.getAttribute('position');
    const originalPositions = new Float32Array(positionAttribute.array);
    
    plane.userData.update = (time) => {
        const positions = positionAttribute.array;
        
        for (let i = 0; i < positionAttribute.count; i++) {
            const ix = i * 3;
            const x = originalPositions[ix];
            const y = originalPositions[ix + 1];
            
            // Apply wave deformation
            positions[ix + 2] = Math.sin(x * 0.5 + time) * Math.cos(y * 0.5 + time) * 0.5;
        }
        
        positionAttribute.needsUpdate = true;
        
        // Recompute normals for proper lighting
        GeometryUtils.computeVertexNormals(geometry);
    };
    
    return plane;
}

// Usage in animation loop
const animatedPlane = createAnimatedPlane();
scene.addObject(animatedPlane);

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    
    // Update animated objects
    animatedPlane.userData.update(time);
    
    renderer.render(scene, camera);
}
```

## Material Systems

### PBR Material Setup
```javascript
// Standard PBR material setup
function createPBRMaterial() {
    const material = new MeshStandardMaterial({
        // Base properties
        color: '#B8B8B8',
        metalness: 0.2,
        roughness: 0.4,
        
        // Environment
        envMapIntensity: 1.0,
        
        // Transparency
        transparent: false,
        opacity: 1.0,
        
        // Render settings
        side: 'front',
        depthWrite: true,
        depthTest: true,
        
        // Animation
        emissive: '#000000',
        emissiveIntensity: 0.0
    });
    
    return material;
}

// Advanced PBR material with textures
function createTexturedPBRMaterial(textureLoader) {
    const material = new MeshStandardMaterial();
    
    // Load and set textures
    const diffuseTexture = textureLoader.load('diffuse.jpg');
    diffuseTexture.wrapS = diffuseTexture.wrapT = 'RepeatWrapping';
    diffuseTexture.repeat.set(2, 2);
    material.map = diffuseTexture;
    
    const normalTexture = textureLoader.load('normal.jpg');
    normalTexture.wrapS = normalTexture.wrapT = 'RepeatWrapping';
    normalTexture.repeat.set(2, 2);
    material.normalMap = normalTexture;
    material.normalScale = new Vector2(1, 1);
    
    const roughnessTexture = textureLoader.load('roughness.jpg');
    roughnessTexture.wrapS = roughnessTexture.wrapT = 'RepeatWrapping';
    material.roughnessMap = roughnessTexture;
    
    const metalnessTexture = textureLoader.load('metalness.jpg');
    metalnessTexture.wrapS = metalnessTexture.wrapT = 'RepeatWrapping';
    material.metalnessMap = metalnessTexture;
    
    const aoTexture = textureLoader.load('ao.jpg');
    material.aoMap = aoTexture;
    material.aoMapIntensity = 1.0;
    
    return material;
}
```

### Material Animation
```javascript
// Animated material for special effects
function createAnimatedMaterial() {
    const material = new ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color1: { value: new Color(0xff0000) },
            color2: { value: new Color(0x0000ff) },
            opacity: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float opacity;
            varying vec2 vUv;
            
            void main() {
                float pattern = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
                vec3 color = mix(color1, color2, pattern * 0.5 + 0.5);
                gl_FragColor = vec4(color, opacity);
            }
        `,
        transparent: true
    });
    
    return material;
}

// Usage
const animatedMaterial = createAnimatedMaterial();
const animatedMesh = new Mesh(new BoxGeometry(), animatedMaterial);
scene.addObject(animatedMesh);

function animateMaterial() {
    animatedMaterial.uniforms.time.value = performance.now() * 0.001;
}
```

### Material Library
```javascript
class MaterialLibrary {
    constructor(textureLoader) {
        this.textureLoader = textureLoader;
        this.materials = new Map();
    }
    
    getMaterial(name, config) {
        if (this.materials.has(name)) {
            return this.materials.get(name);
        }
        
        let material;
        switch (config.type) {
            case 'metal':
                material = this.createMetalMaterial(config);
                break;
            case 'wood':
                material = this.createWoodMaterial(config);
                break;
            case 'glass':
                material = this.createGlassMaterial(config);
                break;
            case 'fabric':
                material = this.createFabricMaterial(config);
                break;
            default:
                material = this.createStandardMaterial(config);
        }
        
        this.materials.set(name, material);
        return material;
    }
    
    createMetalMaterial(config) {
        const material = new MeshStandardMaterial({
            color: config.color || '#C0C0C0',
            metalness: 1.0,
            roughness: config.roughness || 0.2,
            envMapIntensity: config.envMapIntensity || 1.0
        });
        
        if (config.normalMap) {
            material.normalMap = this.textureLoader.load(config.normalMap);
            material.normalScale = new Vector2(1, 1);
        }
        
        return material;
    }
    
    createGlassMaterial(config) {
        const material = new MeshPhysicalMaterial({
            color: config.color || '#FFFFFF',
            transmission: 1.0,
            thickness: config.thickness || 0.1,
            roughness: config.roughness || 0.0,
            metalness: 0.0,
            envMapIntensity: config.envMapIntensity || 1.0,
            ior: config.ior || 1.5
        });
        
        return material;
    }
    
    createWoodMaterial(config) {
        const material = new MeshStandardMaterial({
            color: config.color || '#8B4513',
            metalness: 0.0,
            roughness: config.roughness || 0.8
        });
        
        if (config.diffuseMap) {
            material.map = this.textureLoader.load(config.diffuseMap);
            material.map.wrapS = material.map.wrapT = 'RepeatWrapping';
            material.map.repeat.set(2, 2);
        }
        
        if (config.normalMap) {
            material.normalMap = this.textureLoader.load(config.normalMap);
            material.normalScale = new Vector2(1, 1);
        }
        
        return material;
    }
    
    createFabricMaterial(config) {
        const material = new ClothMaterial({
            color: config.color || '#800080',
            roughness: config.roughness || 0.9,
            sheen: config.sheen || 0.3,
            fiberIntensity: config.fiberIntensity || 0.5
        });
        
        if (config.diffuseMap) {
            material.map = this.textureLoader.load(config.diffuseMap);
        }
        
        return material;
    }
    
    createStandardMaterial(config) {
        return new MeshStandardMaterial({
            color: config.color || '#FFFFFF',
            metalness: config.metalness || 0.0,
            roughness: config.roughness || 0.5
        });
    }
    
    dispose() {
        this.materials.forEach(material => material.dispose());
        this.materials.clear();
    }
}
```

## Lighting

### Three-Point Lighting Setup
```javascript
function setupThreePointLighting(scene) {
    // Key light (main light source)
    const keyLight = new DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
    scene.addLight(keyLight);
    
    // Fill light (reduces shadows)
    const fillLight = new DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.addLight(fillLight);
    
    // Rim light (creates outline effect)
    const rimLight = new DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 0, 10);
    scene.addLight(rimLight);
    
    // Ambient light for base illumination
    const ambientLight = new AmbientLight(0x404040, 0.3);
    scene.addLight(ambientLight);
    
    return { keyLight, fillLight, rimLight, ambientLight };
}
```

### Dynamic Lighting
```javascript
// Animated point light
function createDynamicLight(scene) {
    const light = new PointLight(0xff00ff, 1, 10);
    light.position.set(0, 5, 0);
    scene.addLight(light);
    
    // Add light helper for visualization
    const lightHelper = new PointLightHelper(light);
    scene.addObject(lightHelper);
    
    // Animation function
    light.userData.animate = (time) => {
        light.position.x = Math.sin(time) * 5;
        light.position.z = Math.cos(time) * 5;
        light.intensity = Math.sin(time * 2) * 0.5 + 0.5;
        
        // Change color over time
        const hue = (time * 0.1) % 1;
        light.color.setHSL(hue, 1, 0.5);
        
        lightHelper.update();
    };
    
    return light;
}

// Spotlight with target tracking
function createSpotlight(scene, target) {
    const spotlight = new SpotLight(0xffffff, 1, 20, Math.PI / 6, 0.3);
    spotlight.position.set(10, 10, 10);
    spotlight.target = target;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    
    scene.addLight(spotlight);
    scene.addLight(spotlight.target);
    
    return spotlight;
}
```

### Environment Lighting
```javascript
function setupEnvironmentLighting(scene, textureLoader) {
    // Load environment map
    const envMap = textureLoader.load('env.jpg');
    envMap.mapping = 'EquirectangularReflectionMapping';
    
    // Set scene environment
    scene.environment = envMap;
    
    // Add hemisphere light for realistic sky/ground lighting
    const hemisphereLight = new HemisphereLight(0x87CEEB, 0x8B4513, 0.6);
    scene.addLight(hemisphereLight);
    
    // Add directional light for sun
    const sunLight = new DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(50, 50, 0);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.addLight(sunLight);
    
    return { envMap, hemisphereLight, sunLight };
}
```

## Camera Controls

### Orbit Controls
```javascript
function setupOrbitControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    
    // Basic settings
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    
    // Distance limits
    controls.minDistance = 5;
    controls.maxDistance = 100;
    
    // Angle limits
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
    
    // Disable controls in certain situations
    controls.enableKeys = true;
    controls.keys = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        BOTTOM: 40
    };
    
    // Mouse/touch settings
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI - Math.PI / 4;
    
    return controls;
}
```

### First Person Controls
```javascript
class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.movementSpeed = 10;
        this.lookSpeed = 0.1;
        this.lookVertical = true;
        this.constrainVertical = true;
        this.verticalMin = Math.PI / 3;
        this.verticalMax = Math.PI - Math.PI / 3;
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.lon = 0;
        this.lat = 0;
        this.phi = 0;
        this.theta = 0;
        
        this.bindEvents();
    }
    
    bindEvents() {
        this.domElement.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });
        
        this.domElement.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === this.domElement) {
                this.mouseX += event.movementX * this.lookSpeed;
                this.mouseY += event.movementY * this.lookSpeed;
            }
        });
        
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = false;
                    break;
            }
        });
    }
    
    update(deltaTime) {
        const actualLookSpeed = deltaTime * this.lookSpeed;
        
        this.lon += this.mouseX * actualLookSpeed;
        this.lat -= this.mouseY * actualLookSpeed;
        
        this.lat = Math.max(-85, Math.min(85, this.lat));
        
        this.phi = THREE.MathUtils.degToRad(90 - this.lat);
        this.theta = THREE.MathUtils.degToRad(this.lon);
        
        const target = new Vector3();
        target.x = Math.sin(this.phi) * Math.cos(this.theta);
        target.y = Math.cos(this.phi);
        target.z = Math.sin(this.phi) * Math.sin(this.theta);
        
        this.camera.lookAt(target);
        
        // Handle movement
        const velocity = new Vector3();
        const direction = new Vector3();
        
        if (this.moveForward) velocity.z -= 1;
        if (this.moveBackward) velocity.z += 1;
        if (this.moveLeft) velocity.x -= 1;
        if (this.moveRight) velocity.x += 1;
        
        velocity.normalize();
        direction.setFromMatrixColumn(this.camera.matrix, 0);
        direction.crossVectors(this.camera.up, direction);
        
        this.camera.position.addScaledVector(direction, velocity.z * this.movementSpeed * deltaTime);
        this.camera.position.addScaledVector(new Vector3().setFromMatrixColumn(this.camera.matrix, 0), velocity.x * this.movementSpeed * deltaTime);
        
        this.mouseX = 0;
        this.mouseY = 0;
    }
}
```

## Animation

### Skeletal Animation
```javascript
function setupSkeletalAnimation(model) {
    const mixer = new AnimationMixer(model);
    
    // Get animation clips from model
    const clips = model.animations;
    
    if (clips.length > 0) {
        // Play first animation
        const action = mixer.clipAction(clips[0]);
        action.play();
        
        // Setup animation transitions
        mixer.addEventListener('finished', (event) => {
            if (event.action === action) {
                // Crossfade to next animation
                const nextAction = mixer.clipAction(clips[1]);
                nextAction.crossFadeFrom(action, 0.3, false);
                nextAction.play();
            }
        });
    }
    
    return { mixer, action };
}
```

### Morph Target Animation
```javascript
function setupMorphTargets(geometry) {
    // Add morph targets to geometry
    const morphAttributes = geometry.morphAttributes;
    
    // Create morph targets
    const smileTarget = new Float32Array(geometry.attributes.position.count * 3);
    const frownTarget = new Float32Array(geometry.attributes.position.count * 3);
    
    // Fill morph targets (simplified)
    for (let i = 0; i < geometry.attributes.position.count; i++) {
        const ix = i * 3;
        
        // Smile morph - move mouth corners up
        if (Math.abs(geometry.attributes.position.array[ix + 1]) > 0.1) {
            smileTarget[ix + 1] = 0.1; // Slight upward movement
        }
        
        // Frown morph - move mouth corners down
        if (Math.abs(geometry.attributes.position.array[ix + 1]) > 0.1) {
            frownTarget[ix + 1] = -0.1; // Slight downward movement
        }
    }
    
    geometry.morphAttributes.position = [
        new BufferAttribute(smileTarget, 3),
        new BufferAttribute(frownTarget, 3)
    ];
    
    return geometry;
}

// Animate morph targets
function animateMorphTargets(mesh, time) {
    if (mesh.morphTargetInfluences) {
        mesh.morphTargetInfluences[0] = Math.sin(time) * 0.5 + 0.5; // Smile
        mesh.morphTargetInfluences[1] = Math.cos(time) * 0.5 + 0.5; // Frown
    }
}
```

### Keyframe Animation
```javascript
function createKeyframeAnimation() {
    // Create keyframe tracks
    const positionTrack = new VectorKeyframeTrack(
        '.position',
        [0, 1, 2],
        [0, 0, 0, 10, 0, 0, 0, 0, 0]
    );
    
    const rotationTrack = new QuaternionKeyframeTrack(
        '.quaternion',
        [0, 1, 2],
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
    );
    
    const scaleTrack = new VectorKeyframeTrack(
        '.scale',
        [0, 1, 2],
        [1, 1, 1, 2, 2, 2, 1, 1, 1]
    );
    
    // Create animation clip
    const clip = new AnimationClip('animation', 2, [
        positionTrack,
        rotationTrack,
        scaleTrack
    ]);
    
    return clip;
}
```

## Loading Models

### GLTF Model Loading
```javascript
function loadGLTFModel(url, scene, textureLoader) {
    const loader = new GLTFLoader();
    
    return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            
            // Enable shadows
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Apply materials if needed
                    if (child.material && child.material.map) {
                        child.material.map.colorSpace = 'SRGBColorSpace';
                        child.material.map.needsUpdate = true;
                    }
                }
            });
            
            // Setup animations
            if (gltf.animations.length > 0) {
                const mixer = new AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                
                model.userData.mixer = mixer;
            }
            
            scene.addObject(model);
            resolve(model);
        }, (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        }, (error) => {
            console.error('Error loading model:', error);
            reject(error);
        });
    });
}

// Usage
loadGLTFModel('models/character.glb', scene, textureLoader)
    .then((model) => {
        console.log('Model loaded:', model);
        
        // Position model
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
    })
    .catch((error) => {
        console.error('Failed to load model:', error);
    });
```

### Texture Loading
```javascript
function loadTextureSet(textureLoader, basePath) {
    return {
        diffuse: textureLoader.load(`${basePath}_diffuse.jpg`),
        normal: textureLoader.load(`${basePath}_normal.jpg`),
        roughness: textureLoader.load(`${basePath}_roughness.jpg`),
        metalness: textureLoader.load(`${basePath}_metalness.jpg`),
        ao: textureLoader.load(`${basePath}_ao.jpg`),
        emissive: textureLoader.load(`${basePath}_emissive.jpg`)
    };
}

// Apply texture set to material
function applyTextureSet(material, textureSet) {
    if (textureSet.diffuse) {
        material.map = textureSet.diffuse;
        material.map.colorSpace = 'SRGBColorSpace';
    }
    
    if (textureSet.normal) {
        material.normalMap = textureSet.normal;
        material.normalScale = new Vector2(1, 1);
    }
    
    if (textureSet.roughness) {
        material.roughnessMap = textureSet.roughness;
    }
    
    if (textureSet.metalness) {
        material.metalnessMap = textureSet.metalness;
    }
    
    if (textureSet.ao) {
        material.aoMap = textureSet.ao;
        material.aoMapIntensity = 1.0;
    }
    
    if (textureSet.emissive) {
        material.emissiveMap = textureSet.emissive;
        material.emissiveMap.colorSpace = 'SRGBColorSpace';
        material.emissiveIntensity = 0.2;
    }
    
    material.needsUpdate = true;
}
```

## Post-Processing

### Basic Post-Processing Pipeline
```javascript
function setupPostProcessing(renderer, scene, camera) {
    // Create render target
    const renderTarget = new WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight
    );
    
    // Post-processing scene
    const postScene = new Scene();
    const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Render scene to texture
    function renderToTexture() {
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
    }
    
    // Add post-processing effects
    function addBrightnessContrastEffect() {
        const material = new ShaderMaterial({
            uniforms: {
                tDiffuse: { value: renderTarget.texture },
                brightness: { value: 0 },
                contrast: { value: 1 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position.xy, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float brightness;
                uniform float contrast;
                varying vec2 vUv;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    color.rgb += brightness;
                    color.rgb = (color.rgb - 0.5) * contrast + 0.5;
                    gl_FragColor = color;
                }
            `,
            depthTest: false,
            depthWrite: false
        });
        
        const quad = new Mesh(new PlaneGeometry(2, 2), material);
        postScene.addObject(quad);
        
        return { material, quad };
    }
    
    // Apply effects
    renderToTexture();
    const brightnessContrast = addBrightnessContrastEffect();
    
    // Render post-processing
    function renderPostProcessed() {
        renderer.render(postScene, postCamera);
    }
    
    return {
        renderTarget,
        renderToTexture,
        renderPostProcessed,
        brightnessContrast
    };
}
```

### Effect Composer
```javascript
class EffectComposer {
    constructor(renderer, renderTarget) {
        this.renderer = renderer;
        this.renderTarget = renderTarget;
        this.passes = [];
        this.readBuffer = renderTarget;
        this.writeBuffer = new WebGLRenderTarget(
            renderTarget.width,
            renderTarget.height
        );
    }
    
    addPass(pass) {
        this.passes.push(pass);
    }
    
    render(deltaTime) {
        // Render scene to texture
        this.renderer.setRenderTarget(this.readBuffer);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        
        // Apply passes
        let renderInput = this.readBuffer;
        let renderOutput = this.writeBuffer;
        
        for (const pass of this.passes) {
            pass.setTexture('input', renderInput.texture);
            
            this.renderer.setRenderTarget(renderOutput);
            pass.render(this.renderer, deltaTime);
            
            // Swap buffers
            const temp = renderInput;
            renderInput = renderOutput;
            renderOutput = temp;
        }
        
        // Render final output to screen
        this.renderer.setRenderTarget(null);
        if (this.passes.length > 0) {
            this.renderer.render(this.finalScene, this.finalCamera);
        }
    }
    
    resize(width, height) {
        this.renderTarget.setSize(width, height);
        this.writeBuffer.setSize(width, height);
        
        this.passes.forEach(pass => {
            if (pass.setSize) {
                pass.setSize(width, height);
            }
        });
    }
}
```

## Performance Optimization

### Object Pooling
```javascript
class ObjectPool {
    constructor(createFunction, resetFunction, initialSize = 10) {
        this.createFunction = createFunction;
        this.resetFunction = resetFunction;
        this.pool = [];
        
        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFunction());
        }
    }
    
    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.createFunction();
    }
    
    release(object) {
        this.resetFunction(object);
        this.pool.push(object);
    }
    
    get size() {
        return this.pool.length;
    }
}

// Usage for particle system
const particlePool = new ObjectPool(
    () => new Mesh(new SphereGeometry(0.1), new MeshBasicMaterial({ color: '#FF0000' })),
    (particle) => {
        particle.visible = false;
        particle.position.set(0, 0, 0);
        particle.userData.velocity.set(0, 0, 0);
    },
    100
);

function createParticle() {
    const particle = particlePool.acquire();
    particle.visible = true;
    return particle;
}

function destroyParticle(particle) {
    particlePool.release(particle);
}
```

### Level of Detail (LOD)
```javascript
class LODObject {
    constructor(position) {
        this.position = position;
        this.levels = [];
        this.currentLevel = 0;
        this.distances = []; // Distance thresholds for each level
    }
    
    addLevel(mesh, distance) {
        const lodLevel = {
            mesh: mesh,
            distance: distance
        };
        
        this.levels.push(lodLevel);
        this.distances.push(distance);
        
        // Sort by distance (closest first)
        this.levels.sort((a, b) => b.distance - a.distance);
    }
    
    update(camera) {
        const distance = camera.position.distanceTo(this.position);
        
        // Find appropriate LOD level
        let levelIndex = 0;
        for (let i = 0; i < this.distances.length; i++) {
            if (distance < this.distances[i]) {
                levelIndex = i;
            }
        }
        
        // Update visibility
        this.levels.forEach((level, index) => {
            level.mesh.visible = (index === levelIndex);
        });
        
        this.currentLevel = levelIndex;
    }
}

// Usage
const lodBuilding = new LODObject(new Vector3(10, 0, 10));

// High detail close up
const highDetailMesh = createBuilding(50, 50, 20, 10, 10, 10);
lodBuilding.addLevel(highDetailMesh, 50);

// Medium detail
const mediumDetailMesh = createBuilding(50, 50, 20, 10, 10, 5);
lodBuilding.addLevel(mediumDetailMesh, 100);

// Low detail (very simple)
const lowDetailMesh = createBuilding(50, 50, 20, 10, 10, 2);
lodBuilding.addLevel(lowDetailMesh, 200);
```

### Frustum Culling Optimization
```javascript
function setupFrustumCulling(scene, camera) {
    const frustum = new THREE.Frustum();
    const matrix = new Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
    );
    
    frustum.setFromProjectionMatrix(matrix);
    
    // Custom frustum culling
    scene.traverse((object) => {
        if (object.isMesh && object.geometry.boundingSphere) {
            object.visible = frustum.intersectsSphere(object.geometry.boundingSphere);
        }
    });
}

// Spatial partitioning with octree
class OctreeNode {
    constructor(center, size, maxObjects = 10, maxLevels = 5, level = 0) {
        this.center = center;
        this.size = size;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.objects = [];
        this.nodes = [];
    }
    
    subdivide() {
        const quarterSize = this.size / 4;
        const halfSize = this.size / 2;
        
        // Create 8 child nodes
        this.nodes[0] = new OctreeNode(
            new Vector3(this.center.x - quarterSize, this.center.y - quarterSize, this.center.z - quarterSize),
            halfSize, this.maxObjects, this.maxLevels, this.level + 1
        );
        
        this.nodes[1] = new OctreeNode(
            new Vector3(this.center.x + quarterSize, this.center.y - quarterSize, this.center.z - quarterSize),
            halfSize, this.maxObjects, this.maxLevels, this.level + 1
        );
        
        // ... create remaining 6 nodes ...
        
        // Redistribute objects to child nodes
        this.objects.forEach(object => this.insert(object));
        this.objects = [];
    }
    
    insert(object) {
        if (this.nodes.length > 0) {
            const index = this.getNodeIndex(object);
            if (index !== -1) {
                this.nodes[index].insert(object);
                return;
            }
        }
        
        this.objects.push(object);
        
        if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
            if (this.nodes.length === 0) {
                this.subdivide();
            }
            
            const index = this.getNodeIndex(object);
            if (index !== -1) {
                this.objects.splice(this.objects.indexOf(object), 1);
                this.nodes[index].insert(object);
            }
        }
    }
    
    getNodeIndex(object) {
        // Determine which child node the object belongs to
        const boundingSphere = object.geometry.boundingSphere;
        if (!boundingSphere) return -1;
        
        const center = boundingSphere.center;
        const radius = boundingSphere.radius;
        
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (center.x + radius < node.center.x - node.size / 2) continue;
            if (center.x - radius > node.center.x + node.size / 2) continue;
            // ... check other dimensions ...
            
            return i; // Object fits in this node
        }
        
        return -1; // Object doesn't fit in any specific node
    }
    
    retrieve(object, result = []) {
        const index = this.getNodeIndex(object);
        
        if (index !== -1) {
            this.nodes[index].retrieve(object, result);
        } else {
            result.push(...this.objects);
        }
        
        if (this.nodes.length > 0) {
            for (const node of this.nodes) {
                node.retrieve(object, result);
            }
        }
        
        return result;
    }
}
```

## Advanced Patterns

### Component System
```javascript
class Component {
    constructor(entity) {
        this.entity = entity;
        this.enabled = true;
    }
    
    update(deltaTime) {}
    onAttach() {}
    onDetach() {}
}

class TransformComponent extends Component {
    constructor(entity) {
        super(entity);
        this.position = new Vector3();
        this.rotation = new Euler();
        this.scale = new Vector3(1, 1, 1);
        this.matrix = new Matrix4();
        this.matrixWorld = new Matrix4();
    }
    
    update(deltaTime) {
        this.matrix.compose(this.position, this.rotation, this.scale);
        this.entity.updateMatrix();
        this.entity.updateMatrixWorld();
    }
}

class MeshComponent extends Component {
    constructor(entity, geometry, material) {
        super(entity);
        this.mesh = new Mesh(geometry, material);
        entity.addChild(this.mesh);
    }
    
    setMaterial(material) {
        this.mesh.material = material;
    }
    
    setGeometry(geometry) {
        this.mesh.geometry = geometry;
    }
}

class AnimationComponent extends Component {
    constructor(entity, mixer) {
        super(entity);
        this.mixer = mixer;
        this.actions = new Map();
    }
    
    addAnimation(name, clip) {
        const action = this.mixer.clipAction(clip);
        this.actions.set(name, action);
        return action;
    }
    
    playAnimation(name, loop = true) {
        const action = this.actions.get(name);
        if (action) {
            action.reset();
            if (!loop) action.loop = LoopOnce;
            action.play();
        }
    }
    
    update(deltaTime) {
        this.mixer.update(deltaTime);
    }
}

class Entity {
    constructor(name) {
        this.name = name;
        this.components = new Map();
        this.enabled = true;
    }
    
    addComponent(type, ...args) {
        const component = new type(this, ...args);
        this.components.set(type.name, component);
        component.onAttach();
        return component;
    }
    
    getComponent(type) {
        return this.components.get(type.name);
    }
    
    removeComponent(type) {
        const component = this.components.get(type.name);
        if (component) {
            component.onDetach();
            this.components.delete(type.name);
        }
    }
    
    update(deltaTime) {
        if (!this.enabled) return;
        
        this.components.forEach(component => {
            if (component.enabled) {
                component.update(deltaTime);
            }
        });
    }
}

// Usage
const player = new Entity('player');
player.addComponent(TransformComponent);
const meshComponent = player.addComponent(MeshComponent, new BoxGeometry(), new MeshStandardMaterial());

const mixer = new AnimationMixer(player);
player.addComponent(AnimationComponent, mixer);

const walkAnimation = createWalkAnimation();
player.getComponent('AnimationComponent').addAnimation('walk', walkAnimation);
player.getComponent('AnimationComponent').playAnimation('walk');
```

### State Machine
```javascript
class StateMachine {
    constructor(entity) {
        this.entity = entity;
        this.states = new Map();
        this.currentState = null;
        this.currentStateName = '';
    }
    
    addState(name, state) {
        this.states.set(name, state);
        state.stateMachine = this;
        state.entity = this.entity;
    }
    
    changeState(name, data) {
        if (this.currentState) {
            this.currentState.exit();
        }
        
        this.currentState = this.states.get(name);
        this.currentStateName = name;
        
        if (this.currentState) {
            this.currentState.enter(data);
        }
    }
    
    update(deltaTime) {
        if (this.currentState) {
            this.currentState.update(deltaTime);
        }
    }
}

class State {
    constructor() {
        this.stateMachine = null;
        this.entity = null;
    }
    
    enter(data) {}
    exit() {}
    update(deltaTime) {}
}

class IdleState extends State {
    enter(data) {
        console.log('Entering idle state');
        // Set idle animation
    }
    
    update(deltaTime) {
        // Check for player input
        if (this.entity.userData.input.moveForward) {
            this.stateMachine.changeState('walk');
        }
    }
}

class WalkState extends State {
    enter(data) {
        console.log('Entering walk state');
        // Set walk animation
    }
    
    update(deltaTime) {
        // Handle movement
        const speed = 5;
        const direction = new Vector3();
        
        if (this.entity.userData.input.moveForward) {
            direction.z -= 1;
        }
        if (this.entity.userData.input.moveBackward) {
            direction.z += 1;
        }
        if (this.entity.userData.input.moveLeft) {
            direction.x -= 1;
        }
        if (this.entity.userData.input.moveRight) {
            direction.x += 1;
        }
        
        direction.normalize();
        this.entity.position.addScaledVector(direction, speed * deltaTime);
        
        // Transition conditions
        if (direction.length() === 0) {
            this.stateMachine.changeState('idle');
        }
    }
}

// Usage
const player = new Entity('player');
player.addComponent(TransformComponent);

const stateMachine = new StateMachine(player);
stateMachine.addState('idle', new IdleState());
stateMachine.addState('walk', new WalkState());
stateMachine.changeState('idle');

function updatePlayer(deltaTime) {
    // Handle input
    player.userData.input = {
        moveForward: keyboardState['KeyW'],
        moveBackward: keyboardState['KeyS'],
        moveLeft: keyboardState['KeyA'],
        moveRight: keyboardState['KeyD']
    };
    
    stateMachine.update(deltaTime);
}
```

### Event System
```javascript
class EventManager {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
        }
    }
    
    emit(event, data) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}

// Usage
const eventManager = new EventManager();

// Subscribe to events
const unsubscribe = eventManager.on('playerMoved', (data) => {
    console.log('Player moved to:', data.position);
});

// Emit events
eventManager.emit('playerMoved', {
    position: new Vector3(10, 0, 5)
});

// Unsubscribe
unsubscribe();

// Scene-level events
scene.on('objectAdded', (data) => {
    console.log('Object added:', data.object.name);
});

scene.on('objectRemoved', (data) => {
    console.log('Object removed:', data.object.name);
});

// Custom event system for game logic
const GameEvents = {
    PLAYER_SPAWN: 'playerSpawn',
    PLAYER_DIE: 'playerDie',
    ENEMY_SPAWN: 'enemySpawn',
    SCORE_CHANGE: 'scoreChange',
    GAME_OVER: 'gameOver'
};

// Game event handling
eventManager.on(GameEvents.PLAYER_SPAWN, (data) => {
    // Handle player spawn
    updateUI('Player spawned');
});

eventManager.on(GameEvents.SCORE_CHANGE, (data) => {
    // Update score display
    scoreDisplay.textContent = data.score;
});

eventManager.emit(GameEvents.SCORE_CHANGE, { score: 100 });
```

These usage examples demonstrate the practical application of Ninth.js for creating interactive 3D applications, from basic setup to advanced patterns like component systems and state machines. Each example can be adapted and combined to create complex interactive experiences.