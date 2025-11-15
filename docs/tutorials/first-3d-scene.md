# Creating Your First 3D Scene

In this tutorial, we'll build a more complex 3D scene with multiple objects, different geometries, lighting, and interactivity. You'll learn how to create engaging 3D environments using Ninth.js.

## What You'll Build

We'll create an interactive 3D scene featuring:
- Multiple geometric shapes (cubes, spheres, planes)
- Different material types
- Dynamic lighting
- Camera controls
- Simple animations
- Interactive mouse controls

## Prerequisites

- Basic understanding of Ninth.js (see [Getting Started](./getting-started.md))
- HTML and JavaScript knowledge
- A web server for testing

## Building the Scene

Let's start with a complete example and then break it down:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ninth.js - Interactive 3D Scene</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #000;
            font-family: Arial, sans-serif;
        }
        
        #controls {
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 8px;
            z-index: 100;
        }
        
        #controls h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        
        #controls label {
            display: block;
            margin: 5px 0;
            font-size: 14px;
        }
        
        #controls input[type="range"] {
            width: 200px;
        }
        
        #fps-counter {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 8px;
            border-radius: 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Scene Controls</h3>
        <label>
            Rotate Speed: <input type="range" id="speed" min="0" max="3" step="0.1" value="1">
        </label>
        <label>
            Light Intensity: <input type="range" id="light" min="0" max="2" step="0.1" value="1">
        </label>
        <button id="addObject">Add Random Object</button>
        <button id="reset">Reset Scene</button>
    </div>
    
    <div id="fps-counter">
        FPS: <span id="fps">0</span>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        class SceneController {
            constructor() {
                this.canvas = document.getElementById('canvas');
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.objects = [];
                this.animationSpeed = 1;
                this.lightIntensity = 1;
                this.frameCount = 0;
                this.lastTime = performance.now();
                
                this.init();
                this.setupEventListeners();
                this.animate();
            }
            
            init() {
                // Setup canvas
                this.setupCanvas();
                
                // Create engine
                this.engine = new NinthJS.Engine(this.canvas, {
                    antialias: true,
                    alpha: false,
                    powerPreference: 'high-performance'
                });
                
                // Create scene
                this.scene = new NinthJS.Scene();
                this.scene.setBackground('linear-gradient(to bottom, #001122, #003366)');
                
                // Create camera
                this.camera = new NinthJS.PerspectiveCamera(
                    75,
                    this.canvas.width / this.canvas.height,
                    0.1,
                    1000
                );
                this.camera.setPosition(0, 5, 15);
                this.camera.lookAt(0, 0, 0);
                
                // Create renderer
                this.renderer = new NinthJS.Renderer(this.canvas);
                
                // Setup lighting
                this.setupLights();
                
                // Create initial objects
                this.createInitialScene();
                
                // Handle window resize
                window.addEventListener('resize', () => this.handleResize());
            }
            
            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
            
            setupLights() {
                // Ambient light for overall illumination
                const ambientLight = new NinthJS.AmbientLight(0.3 * this.lightIntensity, '#4040ff');
                this.scene.add(ambientLight);
                
                // Directional light for main lighting
                const directionalLight = new NinthJS.DirectionalLight(0.8 * this.lightIntensity, '#ffffff');
                directionalLight.setDirection(-1, -2, -1);
                this.scene.add(directionalLight);
                
                // Point lights for accent lighting
                const pointLight1 = new NinthJS.PointLight(0.5 * this.lightIntensity, '#ff4444');
                pointLight1.setPosition(5, 5, 5);
                this.scene.add(pointLight1);
                
                const pointLight2 = new NinthJS.PointLight(0.5 * this.lightIntensity, '#44ff44');
                pointLight2.setPosition(-5, -5, 5);
                this.scene.add(pointLight2);
            }
            
            createInitialScene() {
                // Create a ground plane
                this.createGround();
                
                // Create central object
                this.createCentralObject();
                
                // Create surrounding objects
                this.createSurroundingObjects();
            }
            
            createGround() {
                const groundGeometry = new NinthJS.PlaneGeometry(20, 20);
                const groundMaterial = new NinthJS.BasicMaterial({ 
                    color: '#333333',
                    wireframe: false 
                });
                const ground = new NinthJS.Mesh(groundGeometry);
                ground.material = groundMaterial;
                ground.setRotation(-Math.PI / 2, 0, 0);
                ground.setPosition(0, -2, 0);
                this.scene.add(ground);
            }
            
            createCentralObject() {
                const geometry = new NinthJS.SphereGeometry(2, 32, 16);
                const material = new NinthJS.PhongMaterial({
                    color: '#4488ff',
                    shininess: 100,
                    specular: '#ffffff'
                });
                const sphere = new NinthJS.Mesh(geometry);
                sphere.material = material;
                sphere.setPosition(0, 0, 0);
                this.scene.add(sphere);
                this.objects.push({ mesh: sphere, type: 'sphere' });
            }
            
            createSurroundingObjects() {
                const objectTypes = [
                    () => new NinthJS.BoxGeometry(1, 1, 1),
                    () => new NinthJS.SphereGeometry(0.8, 16, 8),
                    () => new NinthJS.PlaneGeometry(1.5, 1.5)
                ];
                
                const materials = [
                    new NinthJS.BasicMaterial({ color: '#ff6666' }),
                    new NinthJS.PhongMaterial({ color: '#66ff66', shininess: 50 }),
                    new NinthJS.BasicMaterial({ color: '#6666ff' })
                ];
                
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const distance = 6 + Math.random() * 2;
                    const x = Math.cos(angle) * distance;
                    const z = Math.sin(angle) * distance;
                    const y = (Math.random() - 0.5) * 4;
                    
                    const geometryIndex = Math.floor(Math.random() * objectTypes.length);
                    const geometry = objectTypes[geometryIndex]();
                    const material = materials[geometryIndex % materials.length];
                    
                    const mesh = new NinthJS.Mesh(geometry);
                    mesh.material = material;
                    mesh.setPosition(x, y, z);
                    
                    // Random rotation
                    mesh.setRotation(
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                    );
                    
                    this.scene.add(mesh);
                    this.objects.push({ 
                        mesh: mesh, 
                        type: geometryIndex === 0 ? 'box' : geometryIndex === 1 ? 'sphere' : 'plane',
                        orbitAngle: angle,
                        orbitDistance: distance,
                        orbitSpeed: 0.5 + Math.random() * 0.5
                    });
                }
            }
            
            addRandomObject() {
                const objectTypes = [
                    { geometry: () => new NinthJS.BoxGeometry(0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.8, 0.8 + Math.random() * 0.8), type: 'box' },
                    { geometry: () => new NinthJS.SphereGeometry(0.5 + Math.random() * 0.5, 16, 8), type: 'sphere' },
                    { geometry: () => new NinthJS.PlaneGeometry(1 + Math.random(), 1 + Math.random()), type: 'plane' }
                ];
                
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
                
                const objectConfig = objectTypes[Math.floor(Math.random() * objectTypes.length)];
                const geometry = objectConfig.geometry();
                const material = new NinthJS.BasicMaterial({ 
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
                
                const mesh = new NinthJS.Mesh(geometry);
                mesh.material = material;
                
                // Random position
                mesh.setPosition(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 6,
                    (Math.random() - 0.5) * 10
                );
                
                // Random rotation
                mesh.setRotation(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                this.scene.add(mesh);
                this.objects.push({ 
                    mesh: mesh, 
                    type: objectConfig.type,
                    wobbleSpeed: 0.5 + Math.random() * 1,
                    wobbleAmount: 0.5 + Math.random() * 0.5
                });
            }
            
            setupEventListeners() {
                // Control sliders
                document.getElementById('speed').addEventListener('input', (e) => {
                    this.animationSpeed = parseFloat(e.target.value);
                });
                
                document.getElementById('light').addEventListener('input', (e) => {
                    this.lightIntensity = parseFloat(e.target.value);
                    this.updateLighting();
                });
                
                // Buttons
                document.getElementById('addObject').addEventListener('click', () => {
                    this.addRandomObject();
                });
                
                document.getElementById('reset').addEventListener('click', () => {
                    this.resetScene();
                });
                
                // Mouse interaction
                this.canvas.addEventListener('mousemove', (e) => {
                    this.handleMouseMove(e);
                });
            }
            
            updateLighting() {
                const lights = this.scene.lights;
                lights.forEach(light => {
                    if (light instanceof NinthJS.AmbientLight) {
                        light.intensity = 0.3 * this.lightIntensity;
                    } else if (light instanceof NinthJS.DirectionalLight || 
                             light instanceof NinthJS.PointLight) {
                        light.intensity = 0.8 * this.lightIntensity;
                    }
                });
            }
            
            handleMouseMove(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                // Convert to normalized device coordinates
                const ndcX = x * 2 - 1;
                const ndcY = -(y * 2 - 1);
                
                // Subtle camera movement
                this.camera.setPosition(ndcX * 2, 5 + ndcY * 2, 15);
                this.camera.lookAt(0, 0, 0);
            }
            
            handleResize() {
                this.setupCanvas();
                this.camera.aspect = this.canvas.width / this.canvas.height;
                this.camera.updateProjectionMatrix();
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                const currentTime = performance.now();
                const deltaTime = currentTime - this.lastTime;
                
                // Update FPS counter
                this.frameCount++;
                if (currentTime - this.lastTime >= 1000) {
                    document.getElementById('fps').textContent = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
                    this.frameCount = 0;
                    this.lastTime = currentTime;
                }
                
                // Update objects
                this.updateObjects(currentTime * 0.001 * this.animationSpeed);
                
                // Render
                this.renderer.render(this.scene, this.camera);
            }
            
            updateObjects(time) {
                this.objects.forEach((obj, index) => {
                    const mesh = obj.mesh;
                    
                    if (obj.type === 'sphere' && index === 0) {
                        // Central sphere - complex animation
                        mesh.setRotation(time * 0.5, time * 0.8, 0);
                    } else if (obj.orbitAngle !== undefined) {
                        // Orbiting objects
                        obj.orbitAngle += obj.orbitSpeed * 0.01 * this.animationSpeed;
                        const x = Math.cos(obj.orbitAngle) * obj.orbitDistance;
                        const z = Math.sin(obj.orbitAngle) * obj.orbitDistance;
                        mesh.setPosition(x, mesh.getPosition().y, z);
                        
                        mesh.setRotation(
                            time * obj.orbitSpeed * 0.5,
                            time * obj.orbitSpeed * 0.7,
                            time * obj.orbitSpeed * 0.3
                        );
                    } else if (obj.wobbleSpeed !== undefined) {
                        // Random objects - wobble animation
                        const wobble = Math.sin(time * obj.wobbleSpeed) * obj.wobbleAmount;
                        mesh.setRotation(wobble, time * 0.5, wobble * 0.5);
                        
                        // Gentle floating
                        const basePos = mesh.getPosition();
                        mesh.setPosition(basePos.x, basePos.y + Math.sin(time + index) * 0.1, basePos.z);
                    }
                });
            }
            
            resetScene() {
                // Remove all objects except ground
                this.objects.forEach(obj => {
                    if (obj.type !== 'ground') {
                        this.scene.remove(obj.mesh);
                    }
                });
                this.objects = this.objects.filter(obj => obj.type === 'ground');
                
                // Recreate initial objects
                this.createCentralObject();
                this.createSurroundingObjects();
            }
        }
        
        // Initialize the scene
        try {
            const sceneController = new SceneController();
            console.log('🎉 Interactive 3D scene loaded successfully!');
        } catch (error) {
            console.error('Error initializing scene:', error);
        }
    </script>
</body>
</html>
```

## Breaking Down the Scene

### 1. Scene Architecture

We organized our code into a `SceneController` class to manage:
- Scene state and objects
- User interface controls
- Animation and updates
- Event handling

### 2. Object Creation

**Ground Plane:**
```javascript
const groundGeometry = new NinthJS.PlaneGeometry(20, 20);
const groundMaterial = new NinthJS.BasicMaterial({ color: '#333333' });
const ground = new NinthJS.Mesh(groundGeometry);
ground.setRotation(-Math.PI / 2, 0, 0);  // Rotate to be horizontal
ground.setPosition(0, -2, 0);
```

**Geometric Primitives:**
- `BoxGeometry(width, height, depth)` - For cubes and rectangular objects
- `SphereGeometry(radius, widthSegments, heightSegments)` - For spherical objects
- `PlaneGeometry(width, height)` - For flat surfaces

### 3. Lighting System

**Ambient Light:**
```javascript
const ambientLight = new NinthJS.AmbientLight(0.3, '#4040ff');
scene.add(ambientLight);
```
Provides overall illumination with a blue tint.

**Directional Light:**
```javascript
const directionalLight = new NinthJS.DirectionalLight(0.8, '#ffffff');
directionalLight.setDirection(-1, -2, -1);
scene.add(directionalLight);
```
Simulates sunlight coming from a specific direction.

**Point Lights:**
```javascript
const pointLight = new NinthJS.PointLight(0.5, '#ff4444');
pointLight.setPosition(5, 5, 5);
scene.add(pointLight);
```
Creates localized lighting effects from a specific point.

### 4. Material Types

**BasicMaterial:**
```javascript
const basicMaterial = new NinthJS.BasicMaterial({ color: '#4488ff' });
```
Simple unlit material with solid colors.

**PhongMaterial:**
```javascript
const phongMaterial = new NinthJS.PhongMaterial({
    color: '#4488ff',
    shininess: 100,
    specular: '#ffffff'
});
```
Provides realistic lighting with specular highlights.

### 5. Animation System

**Rotation Animation:**
```javascript
mesh.setRotation(time * 0.5, time * 0.8, 0);
```

**Orbital Movement:**
```javascript
obj.orbitAngle += obj.orbitSpeed * 0.01;
const x = Math.cos(obj.orbitAngle) * obj.orbitDistance;
const z = Math.sin(obj.orbitAngle) * obj.orbitDistance;
mesh.setPosition(x, mesh.getPosition().y, z);
```

**Wobble Effect:**
```javascript
const wobble = Math.sin(time * obj.wobbleSpeed) * obj.wobbleAmount;
mesh.setRotation(wobble, time * 0.5, wobble * 0.5);
```

## Interactive Features

### Mouse Controls
```javascript
handleMouseMove(e) {
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    this.camera.setPosition(x * 2, 5 + y * 2, 15);
    this.camera.lookAt(0, 0, 0);
}
```

### Dynamic Controls
- Speed slider: Controls animation speed
- Light intensity: Adjusts all light intensities
- Add objects: Randomly generates new 3D objects
- Reset: Restores the initial scene

## Performance Optimization

### 1. Object Pooling
Instead of creating and destroying objects frequently, maintain an object pool:
```javascript
// Reuse objects instead of creating new ones
function getObjectFromPool() {
    return this.objectPool.find(obj => !obj.active) || createNewObject();
}
```

### 2. LOD (Level of Detail)
Use simpler geometries for distant objects:
```javascript
function createLODObject(distance) {
    let segments = 32; // High detail
    if (distance > 10) segments = 8; // Low detail
    return new NinthJS.SphereGeometry(radius, segments, Math.floor(segments / 2));
}
```

### 3. Culling
Only render objects that are visible:
```javascript
function isObjectVisible(mesh, camera) {
    // Simple frustum culling
    const objectPosition = mesh.getPosition();
    const cameraPosition = camera.getPosition();
    const distance = objectPosition.distanceTo(cameraPosition);
    
    return distance < 50; // Only render objects within 50 units
}
```

## Scene Organization Best Practices

### 1. Group Related Objects
```javascript
const groundObjects = new NinthJS.Group();
const skyObjects = new NinthJS.Group();
const interactiveObjects = new NinthJS.Group();

scene.add(groundObjects);
scene.add(skyObjects);
scene.add(interactiveObjects);
```

### 2. Use Layers
Organize objects into layers for efficient rendering:
```javascript
const backgroundLayer = new NinthJS.Layer();
const mainLayer = new NinthJS.Layer();
const uiLayer = new NinthJS.Layer();
```

### 3. Asset Management
```javascript
class AssetManager {
    constructor() {
        this.materials = new Map();
        this.geometries = new Map();
    }
    
    getMaterial(name) {
        if (!this.materials.has(name)) {
            this.materials.set(name, this.createMaterial(name));
        }
        return this.materials.get(name);
    }
    
    getGeometry(name) {
        if (!this.geometries.has(name)) {
            this.geometries.set(name, this.createGeometry(name));
        }
        return this.geometries.get(name);
    }
}
```

## Common Patterns

### 1. Factory Pattern for Objects
```javascript
class ObjectFactory {
    static createBox(x, y, z, color) {
        const geometry = new NinthJS.BoxGeometry(1, 1, 1);
        const material = new NinthJS.BasicMaterial({ color });
        const mesh = new NinthJS.Mesh(geometry);
        mesh.material = material;
        mesh.setPosition(x, y, z);
        return mesh;
    }
    
    static createSphere(x, y, z, radius, color) {
        const geometry = new NinthJS.SphereGeometry(radius, 16, 8);
        const material = new NinthJS.PhongMaterial({ color });
        const mesh = new NinthJS.Mesh(geometry);
        mesh.material = material;
        mesh.setPosition(x, y, z);
        return mesh;
    }
}
```

### 2. State Management
```javascript
const SceneState = {
    LOADING: 'loading',
    RUNNING: 'running',
    PAUSED: 'paused',
    ERROR: 'error'
};

class ManagedScene {
    constructor() {
        this.state = SceneState.LOADING;
        this.init();
    }
    
    init() {
        try {
            // Scene initialization code
            this.state = SceneState.RUNNING;
        } catch (error) {
            this.state = SceneState.ERROR;
            console.error('Scene initialization failed:', error);
        }
    }
}
```

## Testing and Debugging

### 1. Visual Debugging
```javascript
// Add wireframe helpers
const wireframeMaterial = new NinthJS.WireframeMaterial();
const wireframeHelper = new NinthJS.Mesh(geometry, wireframeMaterial);

// Add bounding box helpers
const boundingBoxHelper = new NinthJS.BoundingBoxHelper(mesh);
scene.add(boundingBoxHelper);
```

### 2. Performance Monitoring
```javascript
class PerformanceMonitor {
    constructor() {
        this.frameTime = 0;
        this.memoryUsage = 0;
    }
    
    update() {
        const start = performance.now();
        // ... render code
        const end = performance.now();
        this.frameTime = end - start;
    }
    
    getStats() {
        return {
            fps: Math.round(1000 / this.frameTime),
            frameTime: this.frameTime,
            triangles: this.getTriangleCount(),
            drawCalls: this.getDrawCallCount()
        };
    }
}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Objects not visible | Check camera position and lighting |
| Poor performance | Reduce geometry complexity, optimize materials |
| Strange colors | Ensure proper lighting setup |
| Objects clipping | Adjust near/far planes of camera |
| Memory leaks | Properly dispose of unused geometries and materials |

### Debug Checklist
- [ ] Canvas is properly sized
- [ ] Camera is positioned correctly
- [ ] Lighting is set up appropriately
- [ ] Materials are assigned correctly
- [ ] Objects are within camera view
- [ ] Performance metrics are monitored

## Next Steps

Now that you've created a complex 3D scene, you're ready to explore:

1. **[Working with Materials](./working-with-materials.md)** - Dive deeper into material systems and textures
2. **[Animation Basics](./animation-basics.md)** - Learn advanced animation techniques
3. **[Loading 3D Models](./loading-3d-models.md)** - Import external 3D assets
4. **[Physics Integration](./physics-integration.md)** - Add realistic physics to your scenes

---

**Congratulations! You've created your first interactive 3D scene with Ninth.js! 🎉**