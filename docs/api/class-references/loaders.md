# Loaders Class Reference

Ninth.js provides comprehensive loading capabilities for various 3D assets, textures, audio, and data formats. This document covers all loader classes and their usage.

## Loader Base Class

The base class for all loaders providing common loading functionality.

### Constructor

```javascript
const loader = new Loader();
```

**Parameters:** None - The Loader constructor takes no parameters.

**Example:**
```javascript
import { Loader } from 'ninthjs';

const loader = new Loader();
```

## Properties

### Progress Properties

#### `manager`

Loading manager for tracking multiple loads.

**Type:** `LoadingManager`  
**Default:** Default loading manager

**Example:**
```javascript
import { LoadingManager } from 'ninthjs';

const manager = new LoadingManager();
const textureLoader = new TextureLoader(manager);
const geometryLoader = new GeometryLoader(manager);
```

#### `crossOrigin`

Cross-origin request mode.

**Type:** `string`  
**Default:** `'anonymous'`

**Example:**
```javascript
// Allow cross-origin requests
loader.crossOrigin = 'anonymous';

// Disable cross-origin (same origin only)
loader.crossOrigin = '';
```

#### `path`

Base path for loading resources.

**Type:** `string`  
**Default:** `''`

**Example:**
```javascript
// Set base path for all loads
loader.path = '/assets/';

// Now load will use '/assets/models/model.glb'
loader.load('models/model.glb');
```

### Event Handlers

#### `onLoad`

Callback for successful load completion.

**Type:** `Function`  
**Default:** `null`

**Example:**
```javascript
const loader = new TextureLoader();
loader.onLoad = (texture) => {
    console.log('Texture loaded:', texture);
};
```

#### `onError`

Callback for loading errors.

**Type:** `Function`  
**Default:** `null`

**Example:**
```javascript
loader.onError = (url) => {
    console.error('Failed to load:', url);
};
```

#### `onProgress`

Callback for loading progress.

**Type:** `Function`  
**Default:** `null`

**Example:**
```javascript
loader.onProgress = (url, loaded, total) => {
    const percent = (loaded / total * 100).toFixed(1);
    console.log(`Loading ${url}: ${percent}%`);
};
```

## LoadingManager

Central manager for coordinating multiple loading operations.

### Constructor

```javascript
const manager = new LoadingManager(onLoad, onProgress, onError);
```

**Parameters:**
- `onLoad` (Function, optional): Called when all items finish loading
- `onProgress` (Function, optional): Called for each item progress
- `onError` (Function, optional): Called when an item fails to load

**Example:**
```javascript
const manager = new LoadingManager(
    () => console.log('All assets loaded!'),
    (url, loaded, total) => console.log(`Progress: ${loaded}/${total}`),
    (url) => console.error(`Failed: ${url}`)
);
```

### Methods

#### `addHandler(regex, loader)`

Add a custom handler for specific file types.

**Parameters:**
- `regex` (RegExp): File type pattern
- `loader` (Loader): Loader to handle the file type

**Example:**
```javascript
// Add custom loader for .xyz files
manager.addHandler(/\.xyz$/, new CustomLoader());
```

#### `removeHandler(regex)`

Remove a custom handler.

**Parameters:**
- `regex` (RegExp): File type pattern to remove

**Example:**
```javascript
manager.removeHandler(/\.xyz$/);
```

## TextureLoader

Loads various texture formats including PNG, JPEG, WebP, and more.

### Constructor

```javascript
const textureLoader = new TextureLoader(manager);
```

**Parameters:**
- `manager` (LoadingManager, optional): Loading manager

**Example:**
```javascript
import { TextureLoader } from 'ninthjs';

const textureLoader = new TextureLoader();
```

### Methods

#### `load(url, onLoad, onProgress, onError)`

Load a texture from URL.

**Parameters:**
- `url` (string): Texture URL
- `onLoad` (Function, optional): Called on successful load
- `onProgress` (Function, optional): Called during loading
- `onError` (Function, optional): Called on error

**Returns:** `Texture` - The loaded texture

**Example:**
```javascript
// Basic texture loading
const texture = textureLoader.load(
    '/assets/textures/brick.jpg',
    (texture) => {
        console.log('Texture loaded:', texture);
        
        // Configure texture
        texture.wrapS = TextureLoader.RepeatWrapping;
        texture.wrapT = TextureLoader.RepeatWrapping;
        texture.repeat.set(2, 2);
    },
    (progress) => {
        console.log('Loading progress:', progress.loaded / progress.total * 100, '%');
    },
    (error) => {
        console.error('Texture loading failed:', error);
    }
);
```

#### `loadAsync(url)`

Load texture asynchronously with Promise.

**Parameters:**
- `url` (string): Texture URL

**Returns:** `Promise<Texture>` - Promise resolving to texture

**Example:**
```javascript
// Async/await loading
async function loadTexture() {
    try {
        const texture = await textureLoader.loadAsync('/assets/textures/brick.jpg');
        console.log('Texture loaded:', texture);
        return texture;
    } catch (error) {
        console.error('Failed to load texture:', error);
        throw error;
    }
}

// Usage
const material = new StandardMaterial({
    map: await loadTexture()
});
```

#### `setCrossOrigin(crossOrigin)`

Set cross-origin mode.

**Parameters:**
- `crossOrigin` (string): Cross-origin mode

**Example:**
```javascript
// Enable cross-origin for CDN textures
textureLoader.setCrossOrigin('anonymous');

// Load from CDN
const texture = textureLoader.load('https://cdn.example.com/texture.jpg');
```

#### `setResourcePath(path)`

Set resource path for relative URLs.

**Parameters:**
- `path` (string): Resource path

**Example:**
```javascript
// Set base path for textures
textureLoader.setResourcePath('/assets/textures/');

// Now can load with relative paths
const diffuse = textureLoader.load('diffuse.jpg');
const normal = textureLoader.load('normal.jpg');
const specular = textureLoader.load('specular.jpg');
```

### Texture Types

#### `CubeTextureLoader`

Loads cube map textures for skyboxes and reflections.

**Constructor:**
```javascript
const cubeTextureLoader = new CubeTextureLoader();
```

**Methods:**

##### `load(urls, onLoad, onProgress, onError)`

Load cube texture from array of 6 URLs.

**Parameters:**
- `urls` (Array<string>): Array of 6 URLs (px, nx, py, ny, pz, nz)
- `onLoad` (Function, optional): Called on successful load
- `onProgress` (Function, optional): Called during loading
- `onError` (Function, optional): Called on error

**Returns:** `CubeTexture` - The loaded cube texture

**Example:**
```javascript
import { CubeTextureLoader } from 'ninthjs';

const cubeTextureLoader = new CubeTextureLoader();

const cubeTexture = cubeTextureLoader.load([
    'posx.jpg', // +X face
    'negx.jpg', // -X face
    'posy.jpg', // +Y face
    'negy.jpg', // -Y face
    'posz.jpg', // +Z face
    'negz.jpg'  // -Z face
], (cubeTexture) => {
    console.log('Cube texture loaded:', cubeTexture);
    
    // Use as skybox
    scene.background = cubeTexture;
    
    // Use as environment map
    scene.environment = cubeTexture;
});

// Or load from a single path with naming convention
const skybox = cubeTextureLoader.load('/assets/skybox/');
// Expects: skybox_px.jpg, skybox_nx.jpg, skybox_py.jpg, skybox_ny.jpg, skybox_pz.jpg, skybox_nz.jpg
```

##### `loadAsync(urls)`

Load cube texture asynchronously.

**Parameters:**
- `urls` (Array<string>): Array of 6 URLs

**Returns:** `Promise<CubeTexture>` - Promise resolving to cube texture

**Example:**
```javascript
const cubeTexture = await cubeTextureLoader.loadAsync([
    'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg'
]);
```

#### `DataTextureLoader`

Loads raw data textures from ArrayBuffer or data URLs.

**Example:**
```javascript
import { DataTextureLoader } from 'ninthjs';

const dataLoader = new DataTextureLoader();

// Load from ArrayBuffer
const buffer = await fetch('/assets/texture_data.bin').then(r => r.arrayBuffer());
const dataTexture = dataLoader.parse(buffer, {
    width: 1024,
    height: 1024,
    format: PixelFormat.RGBAFormat,
    type: TextureLoader.UnsignedByteType
});
```

## GeometryLoader

Loads 3D geometry in various formats.

### Constructor

```javascript
const geometryLoader = new GeometryLoader(manager);
```

**Parameters:**
- `manager` (LoadingManager, optional): Loading manager

**Example:**
```javascript
import { GeometryLoader } from 'ninthjs';

const geometryLoader = new GeometryLoader();
```

### Methods

#### `load(url, onLoad, onProgress, onError)`

Load geometry from URL.

**Parameters:**
- `url` (string): Geometry URL
- `onLoad` (Function, optional): Called on successful load
- `onProgress` (Function, optional): Called during loading
- `onError` (Function, optional): Called on error

**Returns:** `Geometry` - The loaded geometry

**Example:**
```javascript
// Load OBJ geometry
geometryLoader.load(
    '/assets/models/building.obj',
    (geometry) => {
        console.log('Geometry loaded:', geometry);
        
        // Create mesh
        const material = new StandardMaterial({ color: 0x00ff00 });
        const mesh = new Mesh(geometry, material);
        scene.add(mesh);
    },
    (progress) => console.log('Loading geometry:', progress.loaded / progress.total * 100, '%'),
    (error) => console.error('Geometry loading failed:', error)
);
```

#### `parse(json)`

Parse geometry from JSON data.

**Parameters:**
- `json` (Object): Geometry JSON data

**Returns:** `Geometry` - Parsed geometry

**Example:**
```javascript
const geometryData = {
    "metadata": {
        "version": 4.5,
        "type": "Geometry",
        "generator": "Collada2GLTF"
    },
    "vertices": [0,0,0, 1,0,0, 0,1,0],
    "faces": [0,1,2]
};

const geometry = geometryLoader.parse(geometryData);
const mesh = new Mesh(geometry, new StandardMaterial({ color: 0x00ff00 }));
scene.add(mesh);
```

## ModelLoader

Loads 3D models with materials and animations.

### Constructor

```javascript
const modelLoader = new ModelLoader(manager);
```

**Parameters:**
- `manager` (LoadingManager, optional): Loading manager

**Example:**
```javascript
import { ModelLoader } from 'ninthjs';

const modelLoader = new ModelLoader();
```

### Properties

#### `dracoLoader`

DRACO compression decoder for compressed models.

**Type:** `DRACOLoader`  
**Default:** `null`

**Example:**
```javascript
import { DRACOLoader } from 'ninthjs';

// Set up DRACO decoder
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // Path to DRACO decoder files
modelLoader.dracoLoader = dracoLoader;
```

#### `meshoptDecoder`

Meshopt compression decoder.

**Type:** `MeshoptDecoder`  
**Default:** `null`

**Example:**
```javascript
import { MeshoptDecoder } from 'ninthjs';

// Enable meshopt compression
modelLoader.meshoptDecoder = MeshoptDecoder;
```

### Methods

#### `load(url, onLoad, onProgress, onError)`

Load a 3D model.

**Parameters:**
- `url` (string): Model URL
- `onLoad` (Function, optional): Called on successful load
- `onProgress` (Function, optional): Called during loading
- `onError` (Function, optional): Called on error

**Example:**
```javascript
// Load GLTF/GLB model
modelLoader.load(
    '/assets/models/character.glb',
    (object) => {
        console.log('Model loaded:', object);
        
        // Position and scale the model
        object.position.set(0, 0, 0);
        object.scale.set(1, 1, 1);
        
        // Play animations if available
        if (object.animations && object.animations.length > 0) {
            const mixer = new AnimationMixer(object);
            const action = mixer.clipAction(object.animations[0]);
            action.play();
            
            // Update animation in render loop
            function animate() {
                requestAnimationFrame(animate);
                mixer.update(deltaTime);
                renderer.render(scene, camera);
            }
        }
        
        scene.add(object);
    },
    (progress) => console.log('Loading model:', progress.loaded / progress.total * 100, '%'),
    (error) => console.error('Model loading failed:', error)
);
```

#### `loadAsync(url)`

Load model asynchronously.

**Parameters:**
- `url` (string): Model URL

**Returns:** `Promise<Object3D>` - Promise resolving to loaded model

**Example:**
```javascript
async function loadCharacter() {
    try {
        const character = await modelLoader.loadAsync('/assets/models/character.glb');
        console.log('Character loaded:', character);
        
        // Configure character
        character.position.set(0, 0, 0);
        character.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(character);
        return character;
    } catch (error) {
        console.error('Failed to load character:', error);
        throw error;
    }
}
```

#### `parse(json)`

Parse model from JSON data.

**Parameters:**
- `json` (Object): Model JSON data

**Returns:** `Object3D` - Parsed model

**Example:**
```javascript
const modelData = await fetch('/assets/models/character.json').then(r => r.json());
const character = modelLoader.parse(modelData);
scene.add(character);
```

### Model Configuration

```javascript
// Advanced model loading with configuration
class ModelManager {
    constructor(scene) {
        this.scene = scene;
        this.models = new Map();
        this.modelLoader = new ModelLoader();
        this.setupLoaders();
    }
    
    setupLoaders() {
        // Enable DRACO compression
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        this.modelLoader.dracoLoader = dracoLoader;
        
        // Enable Meshopt compression
        this.modelLoader.meshoptDecoder = MeshoptDecoder;
        
        // Set resource path
        this.modelLoader.setResourcePath('/assets/models/');
    }
    
    async loadModel(name, url, options = {}) {
        try {
            const model = await this.modelLoader.loadAsync(url);
            
            // Apply default configurations
            this.configureModel(model, options);
            
            this.models.set(name, model);
            console.log(`Model "${name}" loaded successfully`);
            
            return model;
        } catch (error) {
            console.error(`Failed to load model "${name}":`, error);
            throw error;
        }
    }
    
    configureModel(model, options) {
        const {
            castShadow = true,
            receiveShadow = true,
            scale = 1,
            position = { x: 0, y: 0, z: 0 }
        } = options;
        
        // Scale and position
        model.scale.setScalar(scale);
        model.position.set(position.x, position.y, position.z);
        
        // Configure shadows
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = castShadow;
                child.receiveShadow = receiveShadow;
                
                // Optimize materials for shadows
                if (child.material) {
                    child.material.needsUpdate = true;
                }
            }
        });
        
        // Setup animations if available
        if (model.animations && model.animations.length > 0) {
            const mixer = new AnimationMixer(model);
            
            // Store mixer for updates
            if (!this.mixers) this.mixers = [];
            this.mixers.push(mixer);
            
            // Play first animation by default
            const action = mixer.clipAction(model.animations[0]);
            action.play();
        }
    }
    
    updateAnimations(deltaTime) {
        if (this.mixers) {
            this.mixers.forEach(mixer => mixer.update(deltaTime));
        }
    }
    
    getModel(name) {
        return this.models.get(name);
    }
    
    removeModel(name) {
        const model = this.models.get(name);
        if (model) {
            this.scene.remove(model);
            this.models.delete(name);
            console.log(`Model "${name}" removed`);
        }
    }
}

// Usage
const modelManager = new ModelManager(scene);

// Load multiple models
async function loadScene() {
    try {
        const [character, building, vehicle] = await Promise.all([
            modelManager.loadModel('character', 'character.glb', {
                castShadow: true,
                receiveShadow: true,
                scale: 1.2,
                position: { x: 0, y: 0, z: 0 }
            }),
            modelManager.loadModel('building', 'building.glb', {
                castShadow: true,
                receiveShadow: true,
                scale: 1.0,
                position: { x: 10, y: 0, z: 5 }
            }),
            modelManager.loadModel('vehicle', 'vehicle.glb', {
                castShadow: true,
                receiveShadow: true,
                scale: 0.8,
                position: { x: -5, y: 0, z: -3 }
            })
        ]);
        
        console.log('All models loaded successfully');
    } catch (error) {
        console.error('Failed to load some models:', error);
    }
}

// Update animations in render loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    modelManager.updateAnimations(deltaTime);
    
    renderer.render(scene, camera);
}
```

## AudioLoader

Loads audio files for 3D positional audio.

### Constructor

```javascript
const audioLoader = new AudioLoader(manager);
```

**Parameters:**
- `manager` (LoadingManager, optional): Loading manager

**Example:**
```javascript
import { AudioLoader, AudioListener } from 'ninthjs';

const audioLoader = new AudioLoader();
const listener = new AudioListener();
camera.add(listener);

const audio = new Audio(listener);
```

### Methods

#### `load(url, onLoad, onProgress, onError)`

Load audio from URL.

**Parameters:**
- `url` (string): Audio URL
- `onLoad` (Function, optional): Called on successful load
- `onProgress` (Function, optional): Called during loading
- `onError` (Function, optional): Called on error

**Returns:** `AudioBuffer` - The loaded audio buffer

**Example:**
```javascript
// Load background music
audioLoader.load(
    '/assets/audio/background.mp3',
    (buffer) => {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.setVolume(0.5);
        audio.play();
        console.log('Background music loaded and playing');
    },
    (progress) => console.log('Loading audio:', progress.loaded / progress.total * 100, '%'),
    (error) => console.error('Audio loading failed:', error)
);
```

#### `loadAsync(url)`

Load audio asynchronously.

**Parameters:**
- `url` (string): Audio URL

**Returns:** `Promise<AudioBuffer>` - Promise resolving to audio buffer

**Example:**
```javascript
// Load multiple audio files
async function loadAudio() {
    try {
        const [musicBuffer, soundBuffer] = await Promise.all([
            audioLoader.loadAsync('/assets/audio/music.mp3'),
            audioLoader.loadAsync('/assets/audio/button-click.wav')
        ]);
        
        const music = new Audio(listener);
        music.setBuffer(musicBuffer);
        music.setLoop(true);
        music.setVolume(0.3);
        
        const soundEffect = new Audio(listener);
        soundEffect.setBuffer(soundBuffer);
        soundEffect.setVolume(0.7);
        
        return { music, soundEffect };
    } catch (error) {
        console.error('Failed to load audio:', error);
        throw error;
    }
}
```

### Positional Audio Example

```javascript
class PositionalAudioManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.listener = new AudioListener();
        camera.add(this.listener);
        this.audioLoader = new AudioLoader();
        this.sounds = new Map();
    }
    
    async loadPositionalSound(name, url, position) {
        try {
            const buffer = await this.audioLoader.loadAsync(url);
            
            const sound = new Audio(this.listener);
            sound.setBuffer(buffer);
            sound.setRefDistance(10);
            sound.setMaxDistance(50);
            sound.setVolume(0.5);
            
            const soundObject = new Object3D();
            soundObject.position.copy(position);
            soundObject.add(sound);
            
            this.scene.add(soundObject);
            this.sounds.set(name, { sound, object: soundObject });
            
            console.log(`Positional sound "${name}" loaded at`, position);
            return sound;
        } catch (error) {
            console.error(`Failed to load sound "${name}":`, error);
            throw error;
        }
    }
    
    playSound(name, volume = 1.0, loop = false) {
        const soundData = this.sounds.get(name);
        if (soundData) {
            soundData.sound.setVolume(volume);
            soundData.sound.setLoop(loop);
            soundData.sound.play();
        }
    }
    
    stopSound(name) {
        const soundData = this.sounds.get(name);
        if (soundData) {
            soundData.sound.stop();
        }
    }
    
    updateSoundPosition(name, position) {
        const soundData = this.sounds.get(name);
        if (soundData) {
            soundData.object.position.copy(position);
        }
    }
}

// Usage
const audioManager = new PositionalAudioManager(scene, camera);

// Load environmental sounds
async function setupEnvironmentalAudio() {
    await audioManager.loadPositionalSound('bird-chirp', '/assets/audio/bird.wav', new Vector3(5, 3, 2));
    await audioManager.loadPositionalSound('wind', '/assets/audio/wind.wav', new Vector3(0, 10, 0));
    await audioManager.loadPositionalSound('water', '/assets/audio/water.wav', new Vector3(-3, 0, 4));
    
    // Play ambient sounds
    audioManager.playSound('bird-chirp', 0.3, true);
    audioManager.playSound('wind', 0.2, true);
}
```

## FileLoader

Generic file loader for loading any type of file as text or ArrayBuffer.

### Constructor

```javascript
const fileLoader = new FileLoader(manager);
```

**Parameters:**
- `manager` (LoadingManager, optional): Loading manager

**Example:**
```javascript
import { FileLoader } from 'ninthjs';

const fileLoader = new FileLoader();
```

### Methods

#### `load(url, onLoad, onProgress, onError, responseType)`

Load file from URL.

**Parameters:**
- `url` (string): File URL
- `onLoad` (Function, optional): Called on successful load
- `onProgress` (Function, optional): Called during loading
- `onError` (Function, optional): Called on error
- `responseType` (string, optional): Response type ('text', 'arraybuffer', 'blob', 'document')

**Example:**
```javascript
// Load text file
fileLoader.load(
    '/assets/data/config.json',
    (text) => {
        const config = JSON.parse(text);
        console.log('Config loaded:', config);
    }
);

// Load binary file
fileLoader.load(
    '/assets/data/model.bin',
    (arrayBuffer) => {
        console.log('Binary data loaded:', arrayBuffer.byteLength);
    },
    undefined,
    undefined,
    'arraybuffer'
);

// Load CSV data
fileLoader.load(
    '/assets/data/points.csv',
    (text) => {
        const lines = text.split('\n');
        const data = lines.map(line => line.split(',').map(Number));
        console.log('CSV data loaded:', data.length, 'points');
    }
);
```

#### `setResponseType(type)`

Set default response type for subsequent loads.

**Parameters:**
- `type` (string): Response type

**Example:**
```javascript
// Set to load as ArrayBuffer by default
fileLoader.setResponseType('arraybuffer');

// Load multiple binary files
const models = await Promise.all([
    fileLoader.loadAsync('/assets/data/model1.bin'),
    fileLoader.loadAsync('/assets/data/model2.bin'),
    fileLoader.loadAsync('/assets/data/model3.bin')
]);
```

#### `loadAsync(url)`

Load file asynchronously.

**Parameters:**
- `url` (string): File URL

**Returns:** `Promise<string|ArrayBuffer>` - Promise resolving to file content

**Example:**
```javascript
async function loadConfig() {
    try {
        const configText = await fileLoader.loadAsync('/assets/config.json');
        const config = JSON.parse(configText);
        return config;
    } catch (error) {
        console.error('Failed to load config:', error);
        return {};
    }
}

async function loadModelData() {
    try {
        const binaryData = await fileLoader.loadAsync('/assets/data/model.bin');
        console.log('Binary data size:', binaryData.byteLength);
        return binaryData;
    } catch (error) {
        console.error('Failed to load model data:', error);
        return null;
    }
}
```

## Usage Patterns

### Preloader System

```javascript
class AssetPreloader {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.loadingManager = new LoadingManager();
        this.textureLoader = new TextureLoader(this.loadingManager);
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.audioLoader = new AudioLoader(this.loadingManager);
        this.fileLoader = new FileLoader(this.loadingManager);
        
        this.setupPreloading();
    }
    
    setupPreloading() {
        // Show loading progress
        this.loadingManager.onProgress = (url, loaded, total) => {
            const progress = (loaded / total * 100).toFixed(1);
            console.log(`Loading progress: ${progress}%`);
            this.updateLoadingUI(progress);
        };
        
        this.loadingManager.onLoad = () => {
            console.log('All assets loaded!');
            this.hideLoadingUI();
            this.onAllAssetsLoaded();
        };
    }
    
    async preloadAssets() {
        const assets = [
            // Textures
            () => this.textureLoader.loadAsync('/assets/textures/diffuse.jpg'),
            () => this.textureLoader.loadAsync('/assets/textures/normal.jpg'),
            () => this.textureLoader.loadAsync('/assets/textures/roughness.jpg'),
            
            // Models
            () => this.modelLoader.loadAsync('/assets/models/character.glb'),
            () => this.modelLoader.loadAsync('/assets/models/building.glb'),
            
            // Audio
            () => this.audioLoader.loadAsync('/assets/audio/background.mp3'),
            
            // Data
            () => this.fileLoader.loadAsync('/assets/data/config.json', 'text')
        ];
        
        const loadedAssets = [];
        let loaded = 0;
        
        for (const assetLoader of assets) {
            try {
                const asset = await assetLoader();
                loadedAssets.push(asset);
                loaded++;
                console.log(`Loaded asset ${loaded}/${assets.length}`);
            } catch (error) {
                console.error('Failed to load asset:', error);
            }
        }
        
        return loadedAssets;
    }
    
    updateLoadingUI(progress) {
        // Update loading screen UI
        const loadingElement = document.getElementById('loading-progress');
        if (loadingElement) {
            loadingElement.textContent = `${progress}%`;
        }
    }
    
    hideLoadingUI() {
        // Hide loading screen
        const loadingElement = document.getElementById('loading-screen');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }
    
    onAllAssetsLoaded() {
        // Start the application
        this.initializeApp();
    }
    
    initializeApp() {
        console.log('Initializing application with loaded assets...');
        // Your application initialization code here
    }
}

// Usage
const preloader = new AssetPreloader(scene, camera);

// Start preloading when page loads
window.addEventListener('load', async () => {
    try {
        await preloader.preloadAssets();
    } catch (error) {
        console.error('Preloading failed:', error);
    }
});
```

### Lazy Loading System

```javascript
class LazyLoader {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
    }
    
    async loadModelWhenNeeded(name, url, position) {
        // Return cached asset if already loaded
        if (this.loadedAssets.has(name)) {
            return this.loadedAssets.get(name);
        }
        
        // Return existing loading promise if already loading
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        // Start loading
        const modelLoader = new ModelLoader();
        const loadingPromise = modelLoader.loadAsync(url).then(model => {
            // Configure model
            model.position.copy(position);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.scene.add(model);
            this.loadedAssets.set(name, model);
            this.loadingPromises.delete(name);
            
            return model;
        });
        
        this.loadingPromises.set(name, loadingPromise);
        return loadingPromise;
    }
    
    async loadTextureWhenNeeded(name, url, textureOptions = {}) {
        if (this.loadedAssets.has(name)) {
            return this.loadedAssets.get(name);
        }
        
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        const textureLoader = new TextureLoader();
        const loadingPromise = textureLoader.loadAsync(url).then(texture => {
            // Apply texture options
            if (textureOptions.wrapS) texture.wrapS = textureOptions.wrapS;
            if (textureOptions.wrapT) texture.wrapT = textureOptions.wrapT;
            if (textureOptions.repeat) texture.repeat.copy(textureOptions.repeat);
            if (textureOptions.flipY !== undefined) texture.flipY = textureOptions.flipY;
            
            this.loadedAssets.set(name, texture);
            this.loadingPromises.delete(name);
            
            return texture;
        });
        
        this.loadingPromises.set(name, loadingPromise);
        return loadingPromise;
    }
    
    unloadAsset(name) {
        const asset = this.loadedAssets.get(name);
        if (asset) {
            if (asset.isObject3D) {
                this.scene.remove(asset);
            }
            
            // Dispose of resources
            if (asset.dispose) {
                asset.dispose();
            }
            
            this.loadedAssets.delete(name);
            console.log(`Asset "${name}" unloaded`);
        }
    }
    
    clearAll() {
        for (const [name, asset] of this.loadedAssets) {
            this.unloadAsset(name);
        }
    }
}

// Usage
const lazyLoader = new LazyLoader(scene);

// Load character when player approaches
function checkPlayerProximity(player, triggerDistance = 20) {
    const characterPosition = new Vector3(0, 0, 0);
    const distance = player.position.distanceTo(characterPosition);
    
    if (distance < triggerDistance) {
        lazyLoader.loadModelWhenNeeded('character', '/assets/models/character.glb', characterPosition);
    }
}
```

The Ninth.js loading system provides comprehensive asset loading capabilities with progress tracking, error handling, and performance optimizations for various 3D applications.