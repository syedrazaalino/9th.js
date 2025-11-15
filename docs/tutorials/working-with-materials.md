# Working with Materials in Ninth.js

Materials define how objects look in your 3D scene. This tutorial covers everything you need to know about Ninth.js material system, from basic colors to advanced PBR (Physically Based Rendering) materials.

## Material Overview

Materials control:
- **Color and appearance** - Base colors and surface properties
- **Lighting interaction** - How light reflects off surfaces
- **Transparency** - See-through effects
- **Texture mapping** - Applying images to surfaces
- **Special effects** - Wireframe, emissive, and more

## Available Material Types

### 1. BasicMaterial
The simplest material type with solid colors.

```javascript
const basicMaterial = new NinthJS.BasicMaterial({
    color: '#ff6b6b',           // Hex color string
    opacity: 1.0,               // 0.0 = transparent, 1.0 = opaque
    transparent: false,          // Enable transparency
    wireframe: false,            // Render as wireframe
    visible: true               // Object visibility
});
```

**Use cases:**
- Simple colored objects
- UI elements
- Debugging (wireframe mode)
- Performance-critical applications

**Example:**
```html
<script>
    // Create different colored cubes
    function createColoredCubes() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
        
        colors.forEach((color, index) => {
            const geometry = new NinthJS.BoxGeometry(1, 1, 1);
            const material = new NinthJS.BasicMaterial({ color });
            const cube = new NinthJS.Mesh(geometry);
            cube.material = material;
            cube.setPosition((index - 2) * 1.5, 0, 0);
            scene.add(cube);
        });
    }
</script>
```

### 2. PhongMaterial
Provides realistic lighting with specular highlights.

```javascript
const phongMaterial = new NinthJS.PhongMaterial({
    color: '#4488ff',
    ambient: '#111111',          // Ambient color contribution
    specular: '#ffffff',         // Specular highlight color
    shininess: 100,              // Size of specular highlights (0-1000)
    emissive: '#000000',         // Self-illumination color
    emissiveIntensity: 1.0       // Strength of self-illumination
});
```

**Properties explained:**
- `shininess`: Higher values create smaller, sharper highlights
- `emissive`: Makes object appear to emit light (like a light bulb)

**Example with effects:**
```html
<script>
    function createPhongDemo() {
        // Create a shiny metallic sphere
        const sphereGeom = new NinthJS.SphereGeometry(1, 32, 16);
        const metalMaterial = new NinthJS.PhongMaterial({
            color: '#c0c0c0',
            specular: '#ffffff',
            shininess: 500,        // Very shiny
            emissive: '#001122',   // Subtle blue glow
            emissiveIntensity: 0.1
        });
        const metalSphere = new NinthJS.Mesh(sphereGeom);
        metalSphere.material = metalMaterial;
        metalSphere.setPosition(-3, 0, 0);
        
        // Create a matte sphere
        const matteMaterial = new NinthJS.PhongMaterial({
            color: '#ff6b6b',
            specular: '#333333',
            shininess: 10,         // Not very shiny
            emissive: '#000000'
        });
        const matteSphere = new NinthJS.Mesh(sphereGeom);
        matteSphere.material = matteMaterial;
        matteSphere.setPosition(3, 0, 0);
        
        scene.add(metalSphere);
        scene.add(matteSphere);
    }
</script>
```

## Texture Mapping

Textures allow you to apply images to 3D objects, creating rich visual details.

### Basic Texture Application

```javascript
// Load a texture
const texture = new NinthJS.TextureLoader().load('texture.jpg');

// Apply texture to material
const texturedMaterial = new NinthJS.BasicMaterial({
    map: texture,
    color: '#ffffff'  // White allows texture colors to show through
});

const cube = new NinthJS.Mesh(new NinthJS.BoxGeometry(1, 1, 1));
cube.material = texturedMaterial;
```

### Texture Options

```javascript
const advancedTexture = new NinthJS.TextureLoader().load('advanced-texture.jpg', (texture) => {
    // Texture loading callback
    texture.wrapS = NinthJS.RepeatWrapping;     // Horizontal wrapping
    texture.wrapT = NinthJS.RepeatWrapping;     // Vertical wrapping
    texture.repeat.set(2, 2);                   // Tile texture 2x2
    texture.offset.set(0.5, 0);                 // Offset texture
    texture.rotation = Math.PI / 4;             // Rotate texture
    texture.center.set(0.5, 0.5);               // Rotation center
});

// Use in material
const material = new NinthJS.PhongMaterial({
    map: advancedTexture,
    normalMap: new NinthJS.TextureLoader().load('normal.jpg'),    // Bump mapping
    specularMap: new NinthJS.TextureLoader().load('specular.jpg') // Specular control
});
```

### Texture Coordinates (UV Mapping)

Understanding how textures map to 3D objects:

```javascript
function demonstrateUVMapping() {
    const geometry = new NinthJS.PlaneGeometry(4, 4, 4, 4);
    
    // Get UV coordinates
    const uvs = geometry.uvs;
    console.log('UV coordinates:', uvs);
    
    // Modify UV mapping for creative effects
    for (let i = 0; i < uvs.length; i += 2) {
        // Create a fisheye effect
        const u = uvs[i];
        const v = uvs[i + 1];
        
        // Center and normalize
        const du = u - 0.5;
        const dv = v - 0.5;
        const distance = Math.sqrt(du * du + dv * dv);
        
        if (distance > 0) {
            const angle = Math.atan2(dv, du);
            const newDistance = Math.min(distance * 1.5, 0.5);
            
            uvs[i] = 0.5 + Math.cos(angle) * newDistance;
            uvs[i + 1] = 0.5 + Math.sin(angle) * newDistance;
        }
    }
    
    // Apply texture with modified UVs
    const texture = new NinthJS.TextureLoader().load('checkerboard.jpg');
    texture.repeat.set(2, 2);
    
    const material = new NinthJS.BasicMaterial({ map: texture });
    const plane = new NinthJS.Mesh(geometry);
    plane.material = material;
    
    scene.add(plane);
}
```

## Advanced Material Techniques

### 1. Transparency and Alpha Blending

```javascript
function createTransparentObjects() {
    // Glass-like transparency
    const glassMaterial = new NinthJS.PhongMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.3,              // 30% opacity
        blending: NinthJS.AdditiveBlending,  // Additive blending
        depthWrite: false,         // Don't write to depth buffer
        side: NinthJS.DoubleSide   // Render both sides
    });
    
    // Create a transparent sphere
    const sphere = new NinthJS.Mesh(
        new NinthJS.SphereGeometry(1, 32, 16),
        glassMaterial
    );
    sphere.setPosition(0, 0, 0);
    
    // Fading animation
    let fadeDirection = -1;
    function animateGlass() {
        glassMaterial.opacity += fadeDirection * 0.01;
        
        if (glassMaterial.opacity <= 0.1 || glassMaterial.opacity >= 0.9) {
            fadeDirection *= -1;
        }
        
        requestAnimationFrame(animateGlass);
    }
    animateGlass();
    
    scene.add(sphere);
}
```

### 2. Multi-Material Objects

Apply different materials to different parts of an object:

```javascript
function createMultiMaterialObject() {
    // Box with different materials for each face
    const geometry = new NinthJS.BoxGeometry(2, 2, 2);
    
    // Create materials for each face
    const materials = [
        new NinthJS.BasicMaterial({ color: '#ff0000' }),  // Front
        new NinthJS.BasicMaterial({ color: '#00ff00' }),  // Back
        new NinthJS.BasicMaterial({ color: '#0000ff' }),  // Top
        new NinthJS.BasicMaterial({ color: '#ffff00' }),  // Bottom
        new NinthJS.BasicMaterial({ color: '#ff00ff' }),  // Right
        new NinthJS.BasicMaterial({ color: '#00ffff' })   // Left
    ];
    
    const cube = new NinthJS.Mesh(geometry, materials);
    scene.add(cube);
}
```

### 3. Environment Mapping

Create reflective surfaces using environment maps:

```javascript
function createReflectiveObject() {
    // Load environment texture
    const envTexture = new NinthJS.CubeTextureLoader().load([
        'posx.jpg', 'negx.jpg',
        'posy.jpg', 'negy.jpg',
        'posz.jpg', 'negz.jpg'
    ]);
    
    // Create reflective material
    const reflectiveMaterial = new NinthJS.PhongMaterial({
        envMap: envTexture,
        reflectivity: 0.8,          // Reflection strength
        color: '#ffffff',
        shininess: 1000
    });
    
    const sphere = new NinthJS.Mesh(
        new NinthJS.SphereGeometry(1, 32, 16),
        reflectiveMaterial
    );
    
    scene.add(sphere);
}
```

## Material Animation

Animate material properties over time:

```javascript
class MaterialAnimator {
    constructor(material) {
        this.material = material;
        this.time = 0;
        this.animations = [];
    }
    
    addColorAnimation(property, startColor, endColor, duration) {
        this.animations.push({
            type: 'color',
            property,
            startColor: new NinthJS.Color(startColor),
            endColor: new NinthJS.Color(endColor),
            duration,
            startTime: 0
        });
    }
    
    addNumberAnimation(property, startValue, endValue, duration) {
        this.animations.push({
            type: 'number',
            property,
            startValue,
            endValue,
            duration,
            startTime: 0
        });
    }
    
    update(currentTime) {
        this.animations.forEach(anim => {
            const elapsed = (currentTime - anim.startTime) / anim.duration;
            const progress = Math.min(elapsed, 1);
            
            if (anim.type === 'color') {
                const color = new NinthJS.Color();
                color.copy(anim.startColor).lerp(anim.endColor, progress);
                this.material[anim.property] = color.getStyle();
            } else if (anim.type === 'number') {
                const value = anim.startValue + (anim.endValue - anim.startValue) * progress;
                this.material[anim.property] = value;
            }
        });
    }
}

// Usage example
const animatedMaterial = new NinthJS.PhongMaterial({
    color: '#4488ff',
    shininess: 100
});

const animator = new MaterialAnimator(animatedMaterial);
animator.addColorAnimation('color', '#4488ff', '#ff8844', 2000);
animator.addNumberAnimation('shininess', 100, 1000, 3000);

function animateMaterial() {
    animator.update(performance.now());
    requestAnimationFrame(animateMaterial);
}
animateMaterial();
```

## Performance Optimization

### 1. Material Instancing
Share materials between similar objects:

```javascript
class MaterialManager {
    constructor() {
        this.sharedMaterials = new Map();
    }
    
    getSharedMaterial(config) {
        const key = JSON.stringify(config);
        
        if (!this.sharedMaterials.has(key)) {
            this.sharedMaterials.set(key, new NinthJS.PhongMaterial(config));
        }
        
        return this.sharedMaterials.get(key);
    }
    
    disposeUnused() {
        // Remove materials that are no longer in use
        for (const [key, material] of this.sharedMaterials) {
            if (material.users === 0) {
                material.dispose();
                this.sharedMaterials.delete(key);
            }
        }
    }
}
```

### 2. Texture Optimization
```javascript
// Compress textures for better performance
function loadOptimizedTexture(url) {
    const loader = new NinthJS.TextureLoader();
    
    loader.load(url, (texture) => {
        // Set compression
        texture.compression = NinthJS.RGBACompression;
        texture.format = NinthJS.RGBAFormat;
        
        // Generate mipmaps for better quality at different sizes
        texture.generateMipmaps = true;
        texture.minFilter = NinthJS.LinearMipmapLinearFilter;
        texture.magFilter = NinthJS.LinearFilter;
        
        // Optimize for different screen resolutions
        texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    });
    
    return loader;
}
```

### 3. LOD for Materials
Use simpler materials for distant objects:

```javascript
function createLODMaterials(baseMaterial) {
    return {
        high: baseMaterial,                              // High detail
        medium: new NinthJS.PhongMaterial({             // Medium detail
            color: baseMaterial.color,
            shininess: baseMaterial.shininess * 0.5,
            emissive: '#000000'
        }),
        low: new NinthJS.BasicMaterial({                 // Low detail
            color: baseMaterial.color
        })
    };
}
```

## Common Material Patterns

### 1. Procedural Textures
Generate textures programmatically:

```javascript
function createProceduralTexture(width, height, type) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    if (type === 'checkerboard') {
        const squareSize = width / 8;
        for (let x = 0; x < width; x += squareSize) {
            for (let y = 0; y < height; y += squareSize) {
                context.fillStyle = ((x + y) / squareSize) % 2 === 0 ? '#ffffff' : '#000000';
                context.fillRect(x, y, squareSize, squareSize);
            }
        }
    } else if (type === 'gradient') {
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.5, '#00ff00');
        gradient.addColorStop(1, '#0000ff');
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
    }
    
    const texture = new NinthJS.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}
```

### 2. Material Debug Helper
```javascript
class MaterialDebugger {
    constructor(scene) {
        this.scene = scene;
        this.materials = [];
    }
    
    addMaterial(material, name) {
        this.materials.push({ material, name, visible: true });
        this.createDebugPlane(material, name);
    }
    
    createDebugPlane(material, name) {
        const geometry = new NinthJS.PlaneGeometry(1, 1);
        const mesh = new NinthJS.Mesh(geometry, material);
        mesh.setPosition(-5 + this.materials.length * 1.5, 3, 0);
        
        this.scene.add(mesh);
    }
    
    toggleVisibility(index) {
        const materialData = this.materials[index];
        materialData.visible = !materialData.visible;
        
        const mesh = this.scene.children.find(child => 
            child.material === materialData.material
        );
        if (mesh) {
            mesh.visible = materialData.visible;
        }
    }
    
    updateProperties() {
        this.materials.forEach((matData, index) => {
            // Animate material properties for debugging
            const time = performance.now() * 0.001;
            matData.material.shininess = 100 + Math.sin(time + index) * 50;
        });
    }
}
```

## Complete Example: Material Playground

```html
<!DOCTYPE html>
<html>
<head>
    <title>Material Playground</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #controls {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
        }
        button { margin: 2px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Material Playground</h3>
        <button onclick="changeMaterial('basic')">Basic</button>
        <button onclick="changeMaterial('phong')">Phong</button>
        <button onclick="changeMaterial('wireframe')">Wireframe</button>
        <button onclick="toggleTexture()">Toggle Texture</button>
        <button onclick="animateMaterial()">Animate</button>
        <div>Current: <span id="currentMaterial">Basic</span></div>
    </div>
    <canvas id="canvas"></canvas>
    
    <script>
        const canvas = document.getElementById('canvas');
        const scene = new NinthJS.Scene();
        const camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new NinthJS.Renderer(canvas);
        
        // Create objects with different materials
        const objects = [];
        const materialTypes = ['basic', 'phong', 'wireframe', 'texture'];
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
        
        for (let i = 0; i < 4; i++) {
            const geometry = new NinthJS.SphereGeometry(1, 32, 16);
            const materials = createMaterialsForObject(i);
            const mesh = new NinthJS.Mesh(geometry, materials[0]);
            mesh.setPosition((i - 1.5) * 3, 0, 0);
            mesh.userData.materials = materials;
            mesh.userData.currentMaterial = 0;
            scene.add(mesh);
            objects.push(mesh);
        }
        
        function createMaterialsForObject(index) {
            const color = colors[index];
            const texture = createProceduralTexture(256, 256, 'checkerboard');
            
            return [
                new NinthJS.BasicMaterial({ color }),                    // Basic
                new NinthJS.PhongMaterial({ color, shininess: 100 }),   // Phong
                new NinthJS.BasicMaterial({ color, wireframe: true }),   // Wireframe
                new NinthJS.BasicMaterial({ map: texture })              // Textured
            ];
        }
        
        function changeMaterial(type) {
            objects.forEach((obj, index) => {
                const materials = obj.userData.materials;
                let newMaterialIndex = 0;
                
                switch(type) {
                    case 'basic': newMaterialIndex = 0; break;
                    case 'phong': newMaterialIndex = 1; break;
                    case 'wireframe': newMaterialIndex = 2; break;
                    case 'texture': newMaterialIndex = 3; break;
                }
                
                obj.material = materials[newMaterialIndex];
                obj.userData.currentMaterial = newMaterialIndex;
            });
            
            document.getElementById('currentMaterial').textContent = type.charAt(0).toUpperCase() + type.slice(1);
        }
        
        function toggleTexture() {
            const textureMaterial = new NinthJS.BasicMaterial({ 
                map: createProceduralTexture(256, 256, 'gradient') 
            });
            
            objects.forEach(obj => {
                if (obj.userData.currentMaterial === 3) {
                    obj.material = textureMaterial;
                }
            });
        }
        
        function animateMaterial() {
            const startTime = performance.now();
            const originalMaterials = objects.map(obj => obj.material);
            
            function animate() {
                const elapsed = performance.now() - startTime;
                const progress = (elapsed % 2000) / 2000;
                
                objects.forEach((obj, index) => {
                    const hue = (progress * 360 + index * 90) % 360;
                    const color = `hsl(${hue}, 70%, 60%)`;
                    
                    if (obj.material.color) {
                        obj.material.color = color;
                    } else if (obj.material.emissive) {
                        obj.material.emissive = color;
                    }
                });
                
                requestAnimationFrame(animate);
            }
            animate();
        }
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate objects
            objects.forEach((obj, index) => {
                const time = performance.now() * 0.001;
                obj.setRotation(0, time + index, 0);
            });
            
            renderer.render(scene, camera);
        }
        
        camera.setPosition(0, 0, 10);
        animate();
        
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>
```

## Best Practices

### 1. Material Organization
- Group materials by type and usage
- Reuse materials when possible
- Name materials descriptively
- Document complex material configurations

### 2. Performance Tips
- Use the simplest material that achieves your goal
- Avoid unnecessary texture lookups
- Compress large textures
- Use LOD for distant objects

### 3. Quality Guidelines
- Test materials under different lighting conditions
- Ensure good contrast for readability
- Consider accessibility (color blindness)
- Provide fallbacks for unsupported features

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Texture doesn't appear | Material color not white | Set material color to '#ffffff' |
| Materials look flat | No lighting | Add appropriate lights to scene |
| Performance issues | Too many unique materials | Share materials, use instancing |
| Wrong UV mapping | Incorrect UV coordinates | Check geometry UV mapping |

### Debug Techniques
```javascript
// Show wireframe for debugging
function debugWireframe(object) {
    const wireframeMaterial = new NinthJS.WireframeMaterial();
    const wireframeObject = new NinthJS.Mesh(object.geometry, wireframeMaterial);
    wireframeObject.position.copy(object.position);
    scene.add(wireframeObject);
}

// Show material properties
function logMaterialInfo(material) {
    console.log('Material Type:', material.type);
    console.log('Properties:', {
        color: material.color,
        transparent: material.transparent,
        opacity: material.opacity,
        wireframe: material.wireframe
    });
}
```

## Next Steps

With materials mastered, you're ready for:

1. **[Animation Basics](./animation-basics.md)** - Animate objects and materials
2. **[Loading 3D Models](./loading-3d-models.md)** - Import external models with materials
3. **[Advanced Rendering](./advanced-rendering.md)** - Master complex rendering techniques
4. **[Physics Integration](./physics-integration.md)** - Materials in physics simulations

---

**You've mastered the art of materials in Ninth.js! Your 3D scenes will now look stunning! 🎨**