# Loading 3D Models in Ninth.js

Learn how to import and work with external 3D models in your Ninth.js applications. This tutorial covers various model formats, loading techniques, and optimization strategies.

## Supported 3D Formats

Ninth.js supports multiple 3D model formats:

| Format | Extension | Description | Best For |
|--------|-----------|-------------|----------|
| **GLTF/GLB** | `.gltf`, `.glb` | Modern, efficient format with materials and animations | Production use |
| **OBJ** | `.obj` | Simple geometry format | Basic models |
| **FBX** | `.fbx` | Complex format with animations | Professional workflows |
| **3DS** | `.3ds` | Legacy format | Older projects |
| **PLY** | `.ply` | Point cloud format | Scientific data |

## Basic Model Loading

### Using the GLTF Loader (Recommended)

GLTF (GL Transmission Format) is the preferred format for web 3D:

```javascript
// Import the GLTF loader
import { GLTFLoader } from 'ninth.js';

// Create loader instance
const loader = new GLTFLoader();

// Load a GLTF model
loader.load(
    'model.gltf',
    // Success callback
    (gltf) => {
        // Get the loaded scene
        const model = gltf.scene;
        
        // Configure model
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        
        // Add to scene
        scene.add(model);
        
        console.log('Model loaded successfully!');
        console.log('Animations:', gltf.animations);
        console.log('Materials:', gltf.materials);
    },
    // Progress callback
    (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    // Error callback
    (error) => {
        console.error('Error loading model:', error);
    }
);
```

### Complete Example: Model Viewer

```html
<!DOCTYPE html>
<html>
<head>
    <title>3D Model Viewer - Ninth.js</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; font-family: Arial, sans-serif; }
        #info {
            position: absolute; top: 10px; left: 10px; z-index: 100;
            background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px;
            max-width: 300px;
        }
        #progress {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px;
            text-align: center; z-index: 200;
        }
        .hidden { display: none; }
        button { margin: 5px; padding: 8px 12px; background: #4488ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #3366cc; }
        input[type="file"] { margin: 10px 0; }
    </style>
</head>
<body>
    <div id="info">
        <h3>3D Model Viewer</h3>
        <div>
            <input type="file" id="fileInput" accept=".gltf,.glb,.obj" />
            <button onclick="loadDemoModel()">Load Demo</button>
        </div>
        <div>
            <button onclick="toggleWireframe()">Wireframe</button>
            <button onclick="toggleAnimations()">Animations</button>
            <button onclick="resetView()">Reset View</button>
        </div>
        <div id="modelInfo"></div>
    </div>
    
    <div id="progress" class="hidden">
        <h3>Loading Model...</h3>
        <div id="progressBar" style="width: 200px; height: 20px; background: #333; border-radius: 10px; margin: 10px 0;">
            <div id="progressFill" style="height: 100%; background: #4488ff; border-radius: 10px; width: 0%;"></div>
        </div>
        <div id="progressText">0%</div>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        class ModelViewer {
            constructor() {
                this.canvas = document.getElementById('canvas');
                this.scene = new NinthJS.Scene();
                this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new NinthJS.Renderer(this.canvas);
                this.controls = null;
                this.currentModel = null;
                this.animations = [];
                this.currentAnimation = 0;
                this.isPlaying = false;
                this.wireframe = false;
                
                this.init();
                this.setupEventListeners();
                this.animate();
            }
            
            init() {
                // Setup scene
                this.scene.setBackground('#111111');
                
                // Setup camera
                this.camera.setPosition(0, 0, 5);
                
                // Setup lighting
                this.setupLighting();
                
                // Setup renderer
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = NinthJS.PCFSoftShadowMap;
                
                // Handle window resize
                window.addEventListener('resize', () => this.handleResize());
            }
            
            setupLighting() {
                // Ambient light
                const ambientLight = new NinthJS.AmbientLight(0.4, '#404040');
                this.scene.add(ambientLight);
                
                // Directional light
                const directionalLight = new NinthJS.DirectionalLight(0.8, '#ffffff');
                directionalLight.setPosition(5, 5, 5);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                this.scene.add(directionalLight);
                
                // Point lights for better illumination
                const pointLight1 = new NinthJS.PointLight(0.5, '#ff4444');
                pointLight1.setPosition(-5, 5, 5);
                this.scene.add(pointLight1);
                
                const pointLight2 = new NinthJS.PointLight(0.5, '#4444ff');
                pointLight2.setPosition(5, -5, -5);
                this.scene.add(pointLight2);
            }
            
            setupEventListeners() {
                // File input for loading local models
                document.getElementById('fileInput').addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        this.loadLocalFile(file);
                    }
                });
                
                // Basic mouse controls
                let mouseDown = false;
                let mouseX = 0;
                let mouseY = 0;
                let rotationX = 0;
                let rotationY = 0;
                
                this.canvas.addEventListener('mousedown', (event) => {
                    mouseDown = true;
                    mouseX = event.clientX;
                    mouseY = event.clientY;
                });
                
                this.canvas.addEventListener('mousemove', (event) => {
                    if (!mouseDown || !this.currentModel) return;
                    
                    const deltaX = event.clientX - mouseX;
                    const deltaY = event.clientY - mouseY;
                    
                    rotationY += deltaX * 0.01;
                    rotationX += deltaY * 0.01;
                    
                    this.currentModel.setRotation(rotationX, rotationY, 0);
                    
                    mouseX = event.clientX;
                    mouseY = event.clientY;
                });
                
                this.canvas.addEventListener('mouseup', () => {
                    mouseDown = false;
                });
                
                this.canvas.addEventListener('wheel', (event) => {
                    event.preventDefault();
                    const zoom = event.deltaY > 0 ? 1.1 : 0.9;
                    const currentPos = this.camera.getPosition();
                    this.camera.setPosition(
                        currentPos.x * zoom,
                        currentPos.y * zoom,
                        currentPos.z * zoom
                    );
                });
            }
            
            showProgress(show) {
                const progressElement = document.getElementById('progress');
                if (show) {
                    progressElement.classList.remove('hidden');
                } else {
                    progressElement.classList.add('hidden');
                }
            }
            
            updateProgress(loaded, total) {
                const percentage = total > 0 ? (loaded / total) * 100 : 0;
                document.getElementById('progressFill').style.width = percentage + '%';
                document.getElementById('progressText').textContent = Math.round(percentage) + '%';
            }
            
            loadLocalFile(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const data = event.target.result;
                    this.loadModelFromData(data, file.name);
                };
                
                if (file.name.endsWith('.gltf') || file.name.endsWith('.glb')) {
                    reader.readAsArrayBuffer(file);
                } else if (file.name.endsWith('.obj')) {
                    reader.readAsText(file);
                }
            }
            
            loadModelFromData(data, filename) {
                this.clearCurrentModel();
                
                if (filename.endsWith('.gltf') || filename.endsWith('.glb')) {
                    this.loadGLTF(data);
                } else if (filename.endsWith('.obj')) {
                    this.loadOBJ(data);
                }
            }
            
            loadGLTF(data) {
                const loader = new NinthJS.GLTFLoader();
                
                this.showProgress(true);
                
                loader.parse(data, '', (gltf) => {
                    this.onModelLoaded(gltf.scene, gltf);
                    this.showProgress(false);
                }, (error) => {
                    console.error('Error parsing GLTF:', error);
                    this.showProgress(false);
                });
            }
            
            loadOBJ(data) {
                const loader = new NinthJS.OBJLoader();
                
                try {
                    const object = loader.parse(data);
                    this.onModelLoaded(object, null);
                } catch (error) {
                    console.error('Error parsing OBJ:', error);
                }
            }
            
            loadDemoModel() {
                this.clearCurrentModel();
                
                // Create a demo model procedurally
                const geometry = new NinthJS.SphereGeometry(1, 32, 16);
                const material = new NinthJS.PhongMaterial({
                    color: '#4488ff',
                    shininess: 100,
                    specular: '#ffffff'
                });
                
                const model = new NinthJS.Mesh(geometry, material);
                model.userData = { name: 'Demo Sphere', format: 'Procedural' };
                
                this.onModelLoaded(model, null);
            }
            
            onModelLoaded(model, gltfData) {
                this.currentModel = model;
                
                // Center and scale the model
                this.fitModel(model);
                
                // Add to scene
                this.scene.add(model);
                
                // Store animations if available
                if (gltfData && gltfData.animations) {
                    this.animations = gltfData.animations;
                }
                
                // Update UI
                this.updateModelInfo(model, gltfData);
            }
            
            fitModel(model) {
                // Calculate bounding box
                const box = new NinthJS.Box3().setFromObject(model);
                const center = box.getCenter(new NinthJS.Vector3());
                const size = box.getSize(new NinthJS.Vector3());
                
                // Center the model
                model.position.sub(center);
                
                // Scale to fit
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2 / maxDim;
                model.scale.setScalar(scale);
                
                // Position camera
                this.camera.setPosition(0, 0, 5);
            }
            
            updateModelInfo(model, gltfData) {
                const info = document.getElementById('modelInfo');
                let infoText = `<strong>${model.userData?.name || 'Model'}</strong><br>`;
                infoText += `Format: ${model.userData?.format || 'Unknown'}<br>`;
                infoText += `Geometries: ${model.children?.length || 1}<br>`;
                
                if (gltfData && gltfData.animations) {
                    infoText += `Animations: ${gltfData.animations.length}<br>`;
                }
                
                info.innerHTML = infoText;
            }
            
            clearCurrentModel() {
                if (this.currentModel) {
                    this.scene.remove(this.currentModel);
                    this.currentModel = null;
                }
                this.animations = [];
                this.currentAnimation = 0;
                this.isPlaying = false;
            }
            
            toggleWireframe() {
                if (!this.currentModel) return;
                
                this.wireframe = !this.wireframe;
                this.currentModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.wireframe = this.wireframe;
                    }
                });
            }
            
            toggleAnimations() {
                if (!this.currentModel || this.animations.length === 0) return;
                
                this.isPlaying = !this.isPlaying;
                // Animation playing logic would go here
            }
            
            resetView() {
                if (this.currentModel) {
                    this.currentModel.setRotation(0, 0, 0);
                    this.currentModel.scale.setScalar(1);
                    
                    const box = new NinthJS.Box3().setFromObject(this.currentModel);
                    const center = box.getCenter(new NinthJS.Vector3());
                    this.currentModel.position.sub(center);
                    
                    this.camera.setPosition(0, 0, 5);
                }
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                // Update camera position (simple orbit)
                const time = performance.now() * 0.001;
                const radius = 5;
                this.camera.position.x = Math.cos(time) * radius;
                this.camera.position.z = Math.sin(time) * radius;
                this.camera.lookAt(0, 0, 0);
                
                // Animate current model
                if (this.currentModel) {
                    const time = performance.now() * 0.001;
                    if (!this.isMouseDown) { // Only auto-rotate if not manually controlling
                        this.currentModel.setRotation(0, time * 0.5, 0);
                    }
                }
                
                this.renderer.render(this.scene, this.camera);
            }
            
            handleResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }
        
        // Initialize the viewer
        const viewer = new ModelViewer();
        
        // Global functions for buttons
        function loadDemoModel() {
            viewer.loadDemoModel();
        }
        
        function toggleWireframe() {
            viewer.toggleWireframe();
        }
        
        function toggleAnimations() {
            viewer.toggleAnimations();
        }
        
        function resetView() {
            viewer.resetView();
        }
    </script>
</body>
</html>
```

## OBJ Model Loading

While GLTF is preferred, OBJ format is still widely used:

```javascript
import { OBJLoader } from 'ninth.js';

function loadOBJModel(url) {
    const loader = new OBJLoader();
    
    loader.load(
        url,
        // Success callback
        (object) => {
            // Configure the loaded object
            object.traverse((child) => {
                if (child instanceof NinthJS.Mesh) {
                    // Add material if none exists
                    if (!child.material) {
                        child.material = new NinthJS.PhongMaterial({
                            color: '#888888',
                            shininess: 30
                        });
                    }
                    
                    // Enable shadows
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Center and scale
            centerAndScaleObject(object);
            
            scene.add(object);
            console.log('OBJ model loaded:', object);
        },
        // Progress callback
        (progress) => {
            console.log('OBJ loading:', (progress.loaded / progress.total * 100) + '%');
        },
        // Error callback
        (error) => {
            console.error('Error loading OBJ:', error);
        }
    );
}

function centerAndScaleObject(object) {
    // Calculate bounding box
    const box = new NinthJS.Box3().setFromObject(object);
    const center = box.getCenter(new NinthJS.Vector3());
    const size = box.getSize(new NinthJS.Vector3());
    
    // Center at origin
    object.position.sub(center);
    
    // Scale to reasonable size (fit in 2x2x2 cube)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2 / maxDim;
    object.scale.setScalar(scale);
}
```

## Working with Materials from Models

### Preserving Original Materials
```javascript
function loadModelWithMaterials(url) {
    const loader = new NinthJS.GLTFLoader();
    
    loader.load(url, (gltf) => {
        const model = gltf.scene;
        
        // Materials are already loaded with the model
        console.log('Loaded materials:', model.materials);
        
        // You can modify them if needed
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Example: Make all materials slightly more metallic
                if (child.material.metalness !== undefined) {
                    child.material.metalness = Math.min(child.material.metalness + 0.1, 1);
                }
                
                // Example: Increase roughness for better lighting
                if (child.material.roughness !== undefined) {
                    child.material.roughness = Math.min(child.material.roughness + 0.1, 1);
                }
            }
        });
        
        scene.add(model);
    });
}
```

### Replacing Materials
```javascript
function loadModelWithCustomMaterial(url, materialConfig) {
    const loader = new NinthJS.GLTFLoader();
    
    loader.load(url, (gltf) => {
        const model = gltf.scene;
        
        // Create custom material
        const customMaterial = new NinthJS.PhongMaterial(materialConfig);
        
        // Apply to all meshes
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = customMaterial.clone();
                
                // Preserve specific properties if needed
                if (child.material.map) {
                    // Keep original texture
                    child.material.map = child.material.map;
                }
            }
        });
        
        scene.add(model);
    });
}
```

## Animation Support

### Loading Animated Models
```javascript
function loadAnimatedModel(url) {
    const loader = new NinthJS.GLTFLoader();
    
    loader.load(url, (gltf) => {
        const model = gltf.scene;
        const animations = gltf.animations;
        
        console.log('Available animations:', animations.map(anim => anim.name));
        
        // Setup animation mixer
        const mixer = new NinthJS.AnimationMixer(model);
        
        // Play first animation
        if (animations.length > 0) {
            const action = mixer.clipAction(animations[0]);
            action.play();
        }
        
        // Update animation in render loop
        const clock = new NinthJS.Clock();
        
        function animate() {
            requestAnimationFrame(animate);
            
            const delta = clock.getDelta();
            mixer.update(delta);
            
            renderer.render(scene, camera);
        }
        animate();
        
        scene.add(model);
    });
}
```

### Animation Controls
```javascript
class AnimationController {
    constructor(model) {
        this.model = model;
        this.mixer = new NinthJS.AnimationMixer(model);
        this.actions = {};
        this.currentAction = null;
        this.clock = new NinthJS.Clock();
        
        this.setupAnimations();
    }
    
    setupAnimations() {
        // This would be set up when loading the model
    }
    
    addAnimation(name, clip) {
        const action = this.mixer.clipAction(clip);
        action.name = name;
        this.actions[name] = action;
    }
    
    playAnimation(name, fadeIn = 0.3) {
        const nextAction = this.actions[name];
        if (!nextAction) return;
        
        if (this.currentAction && this.currentAction !== nextAction) {
            // Fade out current animation
            this.currentAction.fadeOut(fadeIn);
            nextAction.reset().fadeIn(fadeIn).play();
        } else {
            nextAction.play();
        }
        
        this.currentAction = nextAction;
    }
    
    stopAnimation(name) {
        const action = this.actions[name];
        if (action) {
            action.stop();
            if (this.currentAction === action) {
                this.currentAction = null;
            }
        }
    }
    
    update() {
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }
}
```

## Model Optimization

### LOD (Level of Detail) System
```javascript
class ModelLOD {
    constructor(model) {
        this.model = model;
        this.lodLevels = [];
        this.currentLevel = 0;
        this.camera = camera; // Assume camera is available
    }
    
    createLODLevels(highDetail, mediumDetail, lowDetail) {
        this.lodLevels = [
            { object: highDetail, distance: 0 },
            { object: mediumDetail, distance: 10 },
            { object: lowDetail, distance: 20 }
        ];
    }
    
    update() {
        const cameraPosition = this.camera.getPosition();
        const modelPosition = this.model.getPosition();
        const distance = cameraPosition.distanceTo(modelPosition);
        
        let bestLevel = 0;
        for (let i = 0; i < this.lodLevels.length; i++) {
            if (distance >= this.lodLevels[i].distance) {
                bestLevel = i;
            }
        }
        
        if (bestLevel !== this.currentLevel) {
            this.switchLOD(bestLevel);
        }
    }
    
    switchLOD(level) {
        // Remove current level
        if (this.lodLevels[this.currentLevel]) {
            this.scene.remove(this.lodLevels[this.currentLevel].object);
        }
        
        // Add new level
        this.scene.add(this.lodLevels[level].object);
        this.currentLevel = level;
    }
}
```

### Geometry Optimization
```javascript
function optimizeModelGeometry(model) {
    model.traverse((child) => {
        if (child.isMesh && child.geometry) {
            // Merge vertices (remove duplicates)
            child.geometry.mergeVertices();
            
            // Compute normals if needed
            if (!child.geometry.attributes.normal) {
                child.geometry.computeVertexNormals();
            }
            
            // Optimize index buffer
            child.geometry.setIndex([0, 1, 2, 2, 3, 0]); // Simplify if needed
            
            // Enable frustum culling
            child.frustumCulled = true;
        }
    });
}
```

### Texture Optimization
```javascript
class TextureManager {
    constructor(renderer) {
        this.textures = new Map();
        this.renderer = renderer;
    }
    
    loadTexture(url, options = {}) {
        return new Promise((resolve, reject) => {
            const loader = new NinthJS.TextureLoader();
            
            loader.load(url, (texture) => {
                // Apply optimization options
                this.optimizeTexture(texture, options);
                
                this.textures.set(url, texture);
                resolve(texture);
            }, undefined, reject);
        });
    }
    
    optimizeTexture(texture, options) {
        // Set compression
        if (options.compressed) {
            texture.format = NinthJS.RGBAFormat;
        }
        
        // Generate mipmaps
        if (options.mipmaps !== false) {
            texture.generateMipmaps = true;
            texture.minFilter = NinthJS.LinearMipmapLinearFilter;
        }
        
        // Set anisotropy
        texture.anisotropy = Math.min(
            options.anisotropy || 4,
            this.renderer.capabilities.getMaxAnisotropy()
        );
        
        // Enable texture compression if supported
        if (this.renderer.capabilities.isWebGL2) {
            texture.internalFormat = 'RGBA8';
        }
    }
    
    getTexture(url) {
        return this.textures.get(url);
    }
    
    disposeUnused() {
        for (const [url, texture] of this.textures) {
            if (texture.userData.usageCount === 0) {
                texture.dispose();
                this.textures.delete(url);
            }
        }
    }
}
```

## Model Caching and Loading Management

### Loading Manager
```javascript
class ModelManager {
    constructor() {
        this.loadingManager = new NinthJS.LoadingManager();
        this.models = new Map();
        this.loadingPromises = new Map();
        this.progressCallbacks = new Map();
        
        this.setupLoadingManager();
    }
    
    setupLoadingManager() {
        this.loadingManager.onStart = (url, loaded, total) => {
            console.log(`Started loading: ${url}`);
            this.updateProgress(url, loaded, total);
        };
        
        this.loadingManager.onProgress = (url, loaded, total) => {
            this.updateProgress(url, loaded, total);
        };
        
        this.loadingManager.onLoad = (url) => {
            console.log(`Loaded: ${url}`);
            this.clearProgress(url);
        };
        
        this.loadingManager.onError = (url) => {
            console.error(`Error loading: ${url}`);
            this.clearProgress(url);
        };
    }
    
    loadModel(url, options = {}) {
        // Return cached model if available
        if (this.models.has(url)) {
            return Promise.resolve(this.models.get(url));
        }
        
        // Return existing promise if already loading
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }
        
        const loader = options.loader || new NinthJS.GLTFLoader(this.loadingManager);
        const promise = new Promise((resolve, reject) => {
            loader.load(
                url,
                (result) => {
                    this.models.set(url, result);
                    this.loadingPromises.delete(url);
                    resolve(result);
                },
                undefined,
                (error) => {
                    this.loadingPromises.delete(url);
                    reject(error);
                }
            );
        });
        
        this.loadingPromises.set(url, promise);
        return promise;
    }
    
    preloadModel(url) {
        this.loadModel(url).catch(error => {
            console.warn(`Preload failed for ${url}:`, error);
        });
    }
    
    setProgressCallback(url, callback) {
        this.progressCallbacks.set(url, callback);
    }
    
    updateProgress(url, loaded, total) {
        const callback = this.progressCallbacks.get(url);
        if (callback) {
            callback(loaded, total);
        }
    }
    
    clearProgress(url) {
        this.progressCallbacks.delete(url);
    }
    
    dispose() {
        // Clean up loaded models
        for (const model of this.models.values()) {
            if (model.scene) {
                model.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
        }
        
        this.models.clear();
        this.loadingPromises.clear();
    }
}
```

## Error Handling and Fallbacks

### Robust Loading with Fallbacks
```javascript
async function loadModelWithFallbacks(urls, options = {}) {
    const errors = [];
    
    for (const url of urls) {
        try {
            console.log(`Attempting to load: ${url}`);
            const model = await loadModel(url, options);
            console.log(`Successfully loaded: ${url}`);
            return model;
        } catch (error) {
            console.warn(`Failed to load ${url}:`, error);
            errors.push({ url, error });
        }
    }
    
    // All URLs failed, create fallback
    console.warn('All model URLs failed, creating fallback');
    return createFallbackModel(errors);
}

function createFallbackModel(errors) {
    // Create a simple placeholder model
    const geometry = new NinthJS.BoxGeometry(1, 1, 1);
    const material = new NinthJS.PhongMaterial({ 
        color: '#888888',
        emissive: '#440000'
    });
    
    const fallbackModel = new NinthJS.Mesh(geometry, material);
    fallbackModel.userData = { 
        isFallback: true, 
        errors: errors 
    };
    
    return fallbackModel;
}
```

### Loading Validation
```javascript
function validateLoadedModel(model) {
    const validation = {
        valid: true,
        warnings: [],
        errors: []
    };
    
    if (!model) {
        validation.valid = false;
        validation.errors.push('Model is null or undefined');
        return validation;
    }
    
    // Check for geometry
    let geometryCount = 0;
    model.traverse((child) => {
        if (child.isMesh) {
            geometryCount++;
            
            if (!child.geometry) {
                validation.warnings.push('Mesh missing geometry');
            }
            
            if (!child.material) {
                validation.warnings.push('Mesh missing material');
            }
            
            if (child.geometry && !child.geometry.attributes.position) {
                validation.errors.push('Geometry missing position attribute');
            }
        }
    });
    
    if (geometryCount === 0) {
        validation.valid = false;
        validation.errors.push('No geometries found in model');
    }
    
    return validation;
}
```

## Best Practices

### 1. File Size Optimization
- Use Draco compression for GLTF files
- Optimize textures (resize, compress, appropriate format)
- Remove unnecessary materials and shaders
- Use LOD for complex models

### 2. Loading Performance
- Implement progressive loading
- Use loading managers for multiple assets
- Cache models when appropriate
- Show loading progress to users

### 3. Memory Management
- Dispose of unused geometries and materials
- Use object pooling for repeated models
- Implement proper cleanup when models are removed
- Monitor memory usage during development

### 4. User Experience
- Provide loading indicators
- Show error messages with helpful information
- Offer fallback content for failed loads
- Allow users to retry failed downloads

## Troubleshooting Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Model doesn't appear | Wrong path or CORS issues | Check file paths, enable CORS |
| Materials missing | Material files not loaded | Ensure material/texture files are accessible |
| Poor performance | High polygon count | Implement LOD, optimize geometry |
| Loading timeout | Large file size | Use progressive loading, compress assets |
| Animation not working | Wrong animation format | Use supported animation formats |

## Next Steps

With 3D model loading mastered, explore:

1. **[Physics Integration](./physics-integration.md)** - Add physics to loaded models
2. **[Advanced Rendering](./advanced-rendering.md)** - Advanced materials and lighting
3. **[Performance Optimization](./performance-optimization.md)** - Optimize model loading and rendering
4. **[Camera Controls](./camera-controls.md)** - Interactive camera systems

---

**You can now bring any 3D model to life in your Ninth.js applications! 🚀**