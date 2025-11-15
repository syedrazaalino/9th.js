# Lights Class Reference

Ninth.js provides a comprehensive lighting system with various light types for different lighting scenarios. This document covers all light classes and their properties.

## Light Base Class

The base class for all light types. Provides common functionality and properties.

### Constructor

```javascript
const light = new Light(color, intensity);
```

**Parameters:**
- `color` (Color|number|string, optional): Light color (default: 0xffffff)
- `intensity` (number, optional): Light intensity (default: 1)

**Example:**
```javascript
import { Light } from 'ninthjs';

const light = new Light(0xffffff, 1.0);
scene.add(light);
```

## Properties

### Basic Properties

#### `color`

The color of the light.

**Type:** `Color`  
**Default:** `0xffffff` (white)

**Example:**
```javascript
// Different light colors
const whiteLight = new Light(0xffffff, 1.0);     // White
const redLight = new Light(0xff0000, 1.0);       // Red
const warmLight = new Light(0xffaa66, 0.8);      // Warm orange
const coolLight = new Light(0x6699ff, 1.2);      // Cool blue

// Change color programmatically
whiteLight.color.setHex(0x00ff00); // Green
whiteLight.color.setRGB(0.5, 0.8, 1.0); // Custom RGB
whiteLight.color.setHSL(0.6, 0.5, 0.7); // Custom HSL
```

#### `intensity`

The intensity of the light.

**Type:** `number`  
**Default:** `1`

**Example:**
```javascript
// Different intensities
const brightLight = new Light(0xffffff, 2.0);    // Very bright
const normalLight = new Light(0xffffff, 1.0);    // Normal
const dimLight = new Light(0xffffff, 0.3);       // Dim
const moonlight = new Light(0x6699ff, 0.1);      // Very dim moonlight

// Animate intensity
function animateLightIntensity() {
    light.intensity = 0.5 + Math.sin(Date.now() * 0.001) * 0.5;
}
```

#### `position`

The position of the light in 3D space.

**Type:** `Vector3`  
**Default:** `{x: 0, y: 1, z: 0}`

**Example:**
```javascript
// Position lights strategically
const sunLight = new DirectionalLight(0xffffff, 1.0);
sunLight.position.set(10, 10, 5); // From above and side

const fillLight = new DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 5, -5); // From opposite side

const groundLight = new PointLight(0xffffff, 0.5);
groundLight.position.set(0, 0, 0); // At ground level
```

### Shadow Properties

#### `castShadow`

Whether this light casts shadows.

**Type:** `boolean`  
**Default:** `false`

**Example:**
```javascript
// Enable shadow casting
const spotlight = new SpotLight(0xffffff, 1.0);
spotlight.castShadow = true;

// Configure shadow settings
spotlight.shadow.mapSize.width = 2048;
spotlight.shadow.mapSize.height = 2048;
spotlight.shadow.bias = -0.0001;

// Disable for performance
const backgroundLight = new AmbientLight(0x404040, 0.2);
backgroundLight.castShadow = false; // Ambient light doesn't cast shadows
```

#### `shadow`

Shadow configuration object.

**Type:** `Object`  
**Default:** Shadow configuration

**Example:**
```javascript
// Configure shadows for a directional light
const dirLight = new DirectionalLight(0xffffff, 1.0);
dirLight.castShadow = true;

// Shadow camera settings
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = -10;
dirLight.shadow.camera.right = 10;
dirLight.shadow.camera.top = 10;
dirLight.shadow.camera.bottom = -10;

// Shadow map settings
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// Shadow filtering
dirLight.shadow.radius = 4; // For PCF soft shadows
dirLight.shadow.normalBias = 0.02;
dirLight.shadow.bias = -0.0005;
```

## Light Types

### AmbientLight

Provides uniform lighting to all objects in the scene.

#### Constructor

```javascript
const ambientLight = new AmbientLight(color, intensity);
```

**Parameters:**
- `color` (Color|number|string, optional): Light color (default: 0xffffff)
- `intensity` (number, optional): Light intensity (default: 1)

**Example:**
```javascript
import { AmbientLight } from 'ninthjs';

// Basic ambient light
const ambientLight = new AmbientLight(0x404040, 0.6);
scene.add(ambientLight);

// Colored ambient light
const warmAmbient = new AmbientLight(0xffaa66, 0.4);
scene.add(warmAmbient);

// Multiple ambient lights for mood lighting
const blueAmbient = new AmbientLight(0x6699ff, 0.2);
const orangeAmbient = new AmbientLight(0xff8844, 0.1);
scene.add(blueAmbient, orangeAmbient);
```

#### Properties

Inherits all properties from Light base class.

#### Usage

```javascript
// Typical lighting setup
const scene = new Scene();

// Ambient light for overall illumination
const ambientLight = new AmbientLight(0x404040, 0.6);

// Directional light for main lighting
const directionalLight = new DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;

// Point light for local lighting
const pointLight = new PointLight(0xffffff, 0.5, 100);
pointLight.position.set(5, 5, 5);

scene.add(ambientLight, directionalLight, pointLight);
```

### DirectionalLight

Provides parallel light rays, like sunlight.

#### Constructor

```javascript
const directionalLight = new DirectionalLight(color, intensity);
```

**Parameters:**
- `color` (Color|number|string, optional): Light color (default: 0xffffff)
- `intensity` (number, optional): Light intensity (default: 1)

**Example:**
```javascript
import { DirectionalLight } from 'ninthjs';

// Main sun light
const sunLight = new DirectionalLight(0xffffff, 1.0);
sunLight.position.set(10, 10, 5);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight);
scene.add(sunLight.target);

// Moonlight
const moonLight = new DirectionalLight(0x6699ff, 0.1);
moonLight.position.set(-10, 10, -5);
moonLight.target.position.set(0, 0, 0);
scene.add(moonLight, moonLight.target);

// Sunset light
const sunsetLight = new DirectionalLight(0xff8844, 0.8);
sunsetLight.position.set(5, 2, 5);
sunsetLight.target.position.set(0, 0, 0);
scene.add(sunsetLight, sunsetLight.target);
```

#### Properties

##### `target`

The target object the light points to.

**Type:** `Object3D`  
**Default:** Default target object

**Example:**
```javascript
// Point light at specific target
const dirLight = new DirectionalLight(0xffffff, 1.0);
dirLight.position.set(10, 10, 5);

// Point at the center of the scene
dirLight.target.position.set(0, 0, 0);
scene.add(dirLight.target);

// Point at a moving object
const movingTarget = new Object3D();
scene.add(movingTarget);
dirLight.target = movingTarget;

// Follow camera
dirLight.target.position.copy(camera.position);
```

##### `shadow`

Shadow configuration (inherits from Light).

**Example:**
```javascript
// Configure directional light shadows
const dirLight = new DirectionalLight(0xffffff, 1.0);
dirLight.castShadow = true;

// Optimize shadow camera for large scenes
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 200;

// Improve shadow quality
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.bias = -0.00001;
```

#### Usage

```javascript
// Sunlight with shadows
const sunlight = new DirectionalLight(0xffffff, 1.0);
sunlight.position.set(50, 30, 20);
sunlight.target.position.set(0, 0, 0);
sunlight.castShadow = true;

// Configure shadow camera
sunlight.shadow.mapSize.width = 2048;
sunlight.shadow.mapSize.height = 2048;
sunlight.shadow.camera.near = 0.5;
sunlight.shadow.camera.far = 200;
sunlight.shadow.camera.left = -50;
sunlight.shadow.camera.right = 50;
sunlight.shadow.camera.top = 50;
sunlight.shadow.camera.bottom = -50;

scene.add(sunlight);
scene.add(sunlight.target);

// Animate sun
function updateSun(time) {
    const angle = time * 0.1;
    const radius = 50;
    
    sunlight.position.x = Math.cos(angle) * radius;
    sunlight.position.y = Math.sin(angle) * radius;
    sunlight.position.z = 20;
    
    sunlight.target.position.set(0, 0, 0);
}
```

### PointLight

Provides light that radiates in all directions from a point.

#### Constructor

```javascript
const pointLight = new PointLight(color, intensity, distance, decay);
```

**Parameters:**
- `color` (Color|number|string, optional): Light color (default: 0xffffff)
- `intensity` (number, optional): Light intensity (default: 1)
- `distance` (number, optional): Maximum distance of light (default: 0, infinite)
- `decay` (number, optional): How fast the light decays (default: 2)

**Example:**
```javascript
import { PointLight } from 'ninthjs';

// Basic point light
const bulb = new PointLight(0xffffff, 1.0);
bulb.position.set(5, 5, 5);
scene.add(bulb);

// Limited range point light
const flashlight = new PointLight(0xffffff, 2.0, 20);
flashlight.position.set(0, 2, 0);
scene.add(flashlight);

// Realistic point light with decay
const candle = new PointLight(0xffaa66, 0.5, 10, 2);
candle.position.set(0, 1, 0);
scene.add(candle);
```

#### Properties

##### `distance`

Maximum distance of the light's effect.

**Type:** `number`  
**Default:** `0` (infinite)

**Example:**
```javascript
// Infinite range (default)
const infiniteLight = new PointLight(0xffffff, 1.0);
console.log('Distance:', infiniteLight.distance); // 0

// Limited range
const limitedLight = new PointLight(0xffffff, 1.0, 10);
console.log('Distance:', limitedLight.distance); // 10

// Animate light range
function animateLightRange() {
    limitedLight.distance = 5 + Math.sin(Date.now() * 0.001) * 5;
}
```

##### `decay`

How fast the light intensity decreases with distance.

**Type:** `number`  
**Default:** `2`

**Example:**
```javascript
// Fast decay (realistic)
const realisticLight = new PointLight(0xffffff, 1.0, 10, 2);
console.log('Decay:', realisticLight.decay);

// Slow decay
const slowDecayLight = new PointLight(0xffffff, 1.0, 10, 0.5);

// Fast decay (very quick falloff)
const fastDecayLight = new PointLight(0xffffff, 1.0, 10, 3);
```

#### Usage

```javascript
// Multiple point lights for complex lighting
const scene = new Scene();

// Main room lighting
const mainLight = new PointLight(0xffffff, 0.8, 30, 2);
mainLight.position.set(0, 8, 0);

// Accent lighting
const accentLight1 = new PointLight(0xff4444, 0.3, 8, 2);
accentLight1.position.set(3, 4, 3);

const accentLight2 = new PointLight(0x4444ff, 0.3, 8, 2);
accentLight2.position.set(-3, 4, -3);

// Practical lighting
const lamp1 = new PointLight(0xffaa66, 0.6, 6, 2);
lamp1.position.set(2, 2, 2);

const lamp2 = new PointLight(0xffaa66, 0.6, 6, 2);
lamp2.position.set(-2, 2, -2);

scene.add(mainLight, accentLight1, accentLight2, lamp1, lamp2);

// Animate lights
function animateLights(time) {
    // Pulsing main light
    mainLight.intensity = 0.6 + Math.sin(time * 0.5) * 0.2;
    
    // Moving accent lights
    accentLight1.position.x = 3 + Math.sin(time * 2) * 2;
    accentLight2.position.z = -3 + Math.cos(time * 2) * 2;
}
```

### SpotLight

Provides a cone-shaped light beam.

#### Constructor

```javascript
const spotLight = new SpotLight(color, intensity, distance, angle, penumbra, decay);
```

**Parameters:**
- `color` (Color|number|string, optional): Light color (default: 0xffffff)
- `intensity` (number, optional): Light intensity (default: 1)
- `distance` (number, optional): Maximum distance of light (default: 0, infinite)
- `angle` (number, optional): Light cone angle in radians (default: Math.PI / 3)
- `penumbra` (number, optional): Penumbra angle in radians (default: 0)
- `decay` (number, optional): How fast the light decays (default: 2)

**Example:**
```javascript
import { SpotLight } from 'ninthjs';

// Basic spotlight
const spotlight = new SpotLight(0xffffff, 1.0);
spotlight.position.set(0, 10, 0);
spotLight.target.position.set(0, 0, 0);
scene.add(spotlight);
scene.add(spotLight.target);

// Narrow beam spotlight
const narrowSpot = new SpotLight(0xffffff, 1.5, 20, Math.PI / 8);
narrowSpot.position.set(0, 10, 0);
narrowSpot.target.position.set(0, 0, 0);
scene.add(narrowSpot, narrowSpot.target);

// Wide beam with soft edges
const wideSpot = new SpotLight(0xffffff, 0.8, 15, Math.PI / 2, Math.PI / 8);
wideSpot.position.set(0, 10, 0);
wideSpot.target.position.set(0, 0, 0);
scene.add(wideSpot, wideSpot.target);
```

#### Properties

##### `angle`

The angle of the light cone in radians.

**Type:** `number`  
**Default:** `Math.PI / 3` (60 degrees)

**Example:**
```javascript
// Different beam angles
const narrowSpot = new SpotLight(0xffffff, 1.0);
narrowSpot.angle = Math.PI / 12; // 15 degrees

const wideSpot = new SpotLight(0xffffff, 1.0);
wideSpot.angle = Math.PI / 2; // 90 degrees

// Animate beam angle
function animateSpotAngle(spotlight, time) {
    spotlight.angle = Math.PI / 6 + Math.sin(time) * Math.PI / 12;
}
```

##### `penumbra`

The penumbra angle for soft edges in radians.

**Type:** `number`  
**Default:** `0` (hard edges)

**Example:**
```javascript
// Hard-edged spotlight
const hardSpot = new SpotLight(0xffffff, 1.0);
hardSpot.angle = Math.PI / 4;
hardSpot.penumbra = 0;

// Soft-edged spotlight
const softSpot = new SpotLight(0xffffff, 1.0);
softSpot.angle = Math.PI / 4;
softSpot.penumbra = Math.PI / 8; // Soft edges
```

##### `target`

The target object the spotlight points to.

**Type:** `Object3D`  
**Default:** Default target object

**Example:**
```javascript
// Spotlight following a moving object
const spotlight = new SpotLight(0xffffff, 1.0);
spotlight.position.set(0, 10, 0);

const movingTarget = new Object3D();
movingTarget.position.set(5, 0, 0);
scene.add(movingTarget);

spotlight.target = movingTarget;
scene.add(spotlight.target);

// Update target position
function updateTargetPosition(time) {
    movingTarget.position.x = Math.sin(time * 0.5) * 5;
}
```

#### Usage

```javascript
// Stage lighting setup
const stage = new Scene();

// Main spotlight
const mainSpot = new SpotLight(0xffffff, 2.0, 30, Math.PI / 6, Math.PI / 12);
mainSpot.position.set(0, 15, 10);
mainSpot.target.position.set(0, 0, 0);
mainSpot.castShadow = true;
scene.add(mainSpot, mainSpot.target);

// Color spotlights
const redSpot = new SpotLight(0xff4444, 0.8, 20, Math.PI / 4, Math.PI / 8);
redSpot.position.set(-10, 12, 8);
redSpot.target.position.set(0, 0, 0);
scene.add(redSpot, redSpot.target);

const blueSpot = new SpotLight(0x4444ff, 0.8, 20, Math.PI / 4, Math.PI / 8);
blueSpot.position.set(10, 12, 8);
blueSpot.target.position.set(0, 0, 0);
scene.add(blueSpot, blueSpot.target);

// Moving spotlight
const movingSpot = new SpotLight(0xffffff, 1.5, 25, Math.PI / 3, Math.PI / 6);
movingSpot.position.set(0, 20, 0);
movingSpot.target.position.set(0, 0, 0);
scene.add(movingSpot, movingSpot.target);

// Animate moving spotlight
function updateMovingSpot(time) {
    const angle = time * 0.2;
    const radius = 15;
    
    movingSpot.position.x = Math.cos(angle) * radius;
    movingSpot.position.z = Math.sin(angle) * radius;
    movingSpot.target.position.set(0, 0, 0);
}
```

### HemisphereLight

Provides sky and ground lighting with different colors.

#### Constructor

```javascript
const hemisphereLight = new HemisphereLight(skyColor, groundColor, intensity);
```

**Parameters:**
- `skyColor` (Color|number|string, optional): Sky light color (default: 0xffffff)
- `groundColor` (Color|number|string, optional): Ground light color (default: 0x444444)
- `intensity` (number, optional): Light intensity (default: 1)

**Example:**
```javascript
import { HemisphereLight } from 'ninthjs';

// Natural daylight
const daylight = new HemisphereLight(0x87ceeb, 0x8b7355, 0.6);
scene.add(daylight);

// Sunset colors
const sunset = new HemisphereLight(0xffaa66, 0x442211, 0.8);
scene.add(sunset);

// Night colors
const night = new HemisphereLight(0x1a1a2e, 0x16213e, 0.2);
scene.add(night);

// Custom colors
const customHemisphere = new HemisphereLight(0x6699ff, 0x996633, 0.5);
scene.add(customHemisphere);
```

#### Properties

##### `groundColor`

The color of the ground lighting.

**Type:** `Color`  
**Default:** `0x444444`

**Example:**
```javascript
// Different ground colors
const warmGround = new HemisphereLight(0x87ceeb, 0xffaa66, 0.6);
const coolGround = new HemisphereLight(0x87ceeb, 0x6699ff, 0.6);

// Animated ground color
function animateGroundColor(hemisphereLight, time) {
    const groundColor = new Color();
    groundColor.setHSL(0.1 + Math.sin(time * 0.1) * 0.05, 0.7, 0.4);
    hemisphereLight.groundColor.copy(groundColor);
}
```

#### Usage

```javascript
// Natural outdoor lighting
const scene = new Scene();

// Hemisphere light for ambient sky/ground lighting
const hemiLight = new HemisphereLight(0x87ceeb, 0x8b7355, 0.6);
scene.add(hemiLight);

// Directional light for sun
const sunLight = new DirectionalLight(0xffffff, 0.8);
sunLight.position.set(10, 10, 5);
sunLight.target.position.set(0, 0, 0);
scene.add(sunLight, sunLight.target);

// Interior lighting with hemisphere light
const interiorScene = new Scene();

// Warm hemisphere light for cozy interior
const interiorHemi = new HemisphereLight(0xffddcc, 0x664433, 0.4);
scene.add(interiorHemi);

// Point lights for local lighting
const lamp1 = new PointLight(0xffaa66, 0.8, 6, 2);
lamp1.position.set(3, 3, 3);

const lamp2 = new PointLight(0xffaa66, 0.8, 6, 2);
lamp2.position.set(-3, 3, -3);

scene.add(interiorHemi, lamp1, lamp2);
```

## Light Manager

Utility class for managing multiple lights in a scene.

### Constructor

```javascript
const lightManager = new LightManager(scene);
```

**Parameters:**
- `scene` (Scene): The scene to manage lights for

**Example:**
```javascript
import { LightManager } from 'ninthjs';

const scene = new Scene();
const lightManager = new LightManager(scene);
```

### Methods

#### `addLight(light)`

Add a light to the manager.

**Parameters:**
- `light` (Light): Light to add

**Returns:** `number` - Light ID

**Example:**
```javascript
const ambientLight = new AmbientLight(0x404040, 0.6);
const lightId = lightManager.addLight(ambientLight);

console.log('Light added with ID:', lightId);
```

#### `removeLight(lightId)`

Remove a light from the manager.

**Parameters:**
- `lightId` (number): ID of light to remove

**Example:**
```javascript
lightManager.removeLight(lightId);
```

#### `getLights()`

Get all managed lights.

**Returns:** `Array<Light>` - Array of all lights

**Example:**
```javascript
const allLights = lightManager.getLights();
console.log('Total lights:', allLights.length);
```

#### `updateShadows()`

Update all shadow maps.

**Example:**
```javascript
// Call after changing light positions
function updateLightShadows() {
    lightManager.updateShadows();
}
```

#### `optimize()`

Optimize lights for performance.

**Example:**
```javascript
// Remove lights that don't affect visible objects
lightManager.optimize();

// Combine similar lights for better performance
lightManager.combineSimilarLights();
```

## Usage Patterns

### Basic Scene Lighting

```javascript
// Standard three-point lighting setup
const scene = new Scene();

// Key light (main directional light)
const keyLight = new DirectionalLight(0xffffff, 1.0);
keyLight.position.set(10, 10, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;

// Fill light (softer directional light)
const fillLight = new DirectionalLight(0xffffff, 0.3);
fillLight.position.set(-5, 5, -5);

// Rim light (backlight for depth)
const rimLight = new DirectionalLight(0xffffff, 0.5);
rimLight.position.set(0, 10, -10);

// Ambient light for overall illumination
const ambientLight = new AmbientLight(0x404040, 0.3);

scene.add(keyLight, fillLight, rimLight, ambientLight);
```

### Dynamic Day/Night Cycle

```javascript
class DayNightCycle {
    constructor(scene) {
        this.scene = scene;
        this.time = 0;
        this.dayDuration = 60; // seconds
        
        // Lighting setup
        this.sunLight = new DirectionalLight(0xffffff, 1.0);
        this.moonLight = new DirectionalLight(0x6699ff, 0.1);
        this.skyLight = new HemisphereLight(0x87ceeb, 0x8b7355, 0.6);
        
        this.scene.add(this.sunLight, this.moonLight, this.skyLight);
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        const normalizedTime = (this.time % this.dayDuration) / this.dayDuration;
        
        // Calculate sun position
        const sunAngle = normalizedTime * Math.PI * 2;
        const sunRadius = 50;
        
        this.sunLight.position.x = Math.cos(sunAngle) * sunRadius;
        this.sunLight.position.y = Math.sin(sunAngle) * sunRadius;
        this.sunLight.position.z = 20;
        
        // Moon is opposite the sun
        this.moonLight.position.x = -this.sunLight.position.x;
        this.moonLight.position.y = -this.sunLight.position.y;
        this.moonLight.position.z = 20;
        
        // Update light intensities based on time
        const sunIntensity = Math.max(0, Math.sin(sunAngle));
        const moonIntensity = Math.max(0, Math.sin(sunAngle + Math.PI));
        
        this.sunLight.intensity = sunIntensity * 1.2;
        this.moonLight.intensity = moonIntensity * 0.3;
        
        // Update sky colors
        const skyDayColor = new Color(0x87ceeb);
        const skyNightColor = new Color(0x1a1a2e);
        const groundDayColor = new Color(0x8b7355);
        const groundNightColor = new Color(0x16213e);
        
        const dayFactor = (sunIntensity + moonIntensity) / 2;
        this.skyLight.color.copy(skyDayColor).lerp(skyNightColor, 1 - dayFactor);
        this.skyLight.groundColor.copy(groundDayColor).lerp(groundNightColor, 1 - dayFactor);
        this.skyLight.intensity = 0.3 + dayFactor * 0.4;
    }
}

// Usage
const dayNightCycle = new DayNightCycle(scene);

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    
    dayNightCycle.update(deltaTime);
    renderer.render(scene, camera);
}
```

### Performance-Optimized Lighting

```javascript
class OptimizedLighting {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.maxDynamicLights = 8;
        
        this.setupStaticLights();
        this.setupDynamicLights();
    }
    
    setupStaticLights() {
        // Static ambient lighting (doesn't change)
        const ambientLight = new AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Static hemisphere light
        const hemiLight = new HemisphereLight(0x87ceeb, 0x8b7355, 0.4);
        this.scene.add(hemiLight);
    }
    
    setupDynamicLights() {
        // Dynamic point lights for interactive elements
        for (let i = 0; i < this.maxDynamicLights; i++) {
            const light = new PointLight(0xffffff, 0, 10, 2);
            light.visible = false;
            this.scene.add(light);
            this.lights.push(light);
        }
    }
    
    activateLight(index, position, color = 0xffffff, intensity = 1.0) {
        if (index < this.lights.length) {
            const light = this.lights[index];
            light.position.copy(position);
            light.color.setHex(color);
            light.intensity = intensity;
            light.visible = true;
            return true;
        }
        return false;
    }
    
    deactivateLight(index) {
        if (index < this.lights.length) {
            this.lights[index].visible = false;
            return true;
        }
        return false;
    }
    
    updateLightPositions(positions) {
        for (let i = 0; i < Math.min(positions.length, this.lights.length); i++) {
            if (this.lights[i].visible) {
                this.lights[i].position.copy(positions[i]);
            }
        }
    }
}

// Usage
const optimizedLighting = new OptimizedLighting(scene);

// Activate lights for moving objects
function updateDynamicLights(objects) {
    const positions = objects.map(obj => obj.position);
    optimizedLighting.updateLightPositions(positions);
}
```

The Ninth.js lighting system provides comprehensive control over scene illumination with performance optimizations and realistic light behavior for various 3D applications.