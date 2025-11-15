# Lighting Guide

Lighting is one of the most important aspects of 3D graphics. This guide covers lighting systems in 9th.js, from basic lights to advanced shadow mapping and light probes.

## Lighting Fundamentals

Lighting affects:
- **Visibility** - How objects are seen
- **Depth perception** - Spatial relationships
- **Mood and atmosphere** - Scene ambiance
- **Material appearance** - Surface properties
- **Realism** - Natural lighting effects

## Basic Lighting Types

### AmbientLight

Uniform lighting that affects all surfaces equally.

```typescript
const ambientLight = new AmbientLight(0x404040, 1.0);

// Properties
ambientLight.color = new Color(0x404040); // Gray color
ambientLight.intensity = 1.0;             // Light strength

// Usage
scene.add(ambientLight);

// Ambient lighting for different moods
const coolAmbient = new AmbientLight(0x4040ff, 0.3);    // Cool blue
const warmAmbient = new AmbientLight(0xff4040, 0.3);    // Warm red
const neutralAmbient = new AmbientLight(0x404040, 0.5); // Neutral gray
```

### DirectionalLight

Light that behaves like the sun - parallel rays from a specific direction.

```typescript
const directionalLight = new DirectionalLight(0xffffff, 1.0);

// Position and target
directionalLight.position.set(5, 10, 5);
directionalLight.target.position.set(0, 0, 0);

// Configure shadows
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.normalBias = 0.02;

// Properties
directionalLight.color = new Color(0xffffff);
directionalLight.intensity = 1.0;

// Shadows
directionalLight.shadow.enabled = true;
directionalLight.shadow.autoUpdate = true;

// Multiple directional lights for complex lighting
const sunLight = new DirectionalLight(0xffdd88, 1.2);    // Main sun
const fillLight = new DirectionalLight(0x88aaff, 0.3);   // Fill light
const rimLight = new DirectionalLight(0xffffff, 0.5);    // Rim light

sunLight.position.set(10, 10, 5);
fillLight.position.set(-10, 5, -5);
rimLight.position.set(0, 5, -10);
```

### PointLight

Light that radiates in all directions from a single point (like a light bulb).

```typescript
const pointLight = new PointLight(0xffffff, 1.0, 100, 2.0);

// Properties
pointLight.position.set(0, 5, 0);
pointLight.color = new Color(0xff8800);     // Orange light
pointLight.intensity = 1.0;
pointLight.distance = 100;                  // Light falloff distance
pointLight.decay = 2.0;                     // Light decay rate

// Shadows
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 1024;
pointLight.shadow.mapSize.height = 1024;
pointLight.shadow.bias = -0.001;
pointLight.shadow.normalBias = 0.01;

// Multiple point lights
const redLight = new PointLight(0xff0000, 0.5, 20);
const greenLight = new PointLight(0x00ff00, 0.5, 20);
const blueLight = new PointLight(0x0000ff, 0.5, 20);

redLight.position.set(-2, 2, 0);
greenLight.position.set(0, 2, 0);
blueLight.position.set(2, 2, 0);

scene.add(redLight, greenLight, blueLight);

// Animated point light
const flickeringLight = new PointLight(0xffaa00, 1.0, 50);
let flickerTime = 0;

function updateFlickeringLight(deltaTime) {
  flickerTime += deltaTime;
  flickeringLight.intensity = 1.0 + Math.sin(flickerTime * 10) * 0.2;
}
```

### SpotLight

Directional light with a specific angle (like a flashlight or stage spotlight).

```typescript
const spotLight = new SpotLight(0xffffff, 1.0, 100, Math.PI / 6, 0.3, 2.0);

// Properties
spotLight.position.set(5, 5, 5);
spotLight.target.position.set(0, 0, 0);     // Where the light points
spotLight.angle = Math.PI / 6;              // Spotlight angle (30 degrees)
spotLight.penumbra = 0.3;                   // Soft edge (0-1)
spotLight.distance = 100;                   // Light reach
spotLight.decay = 2.0;                      // Light decay
spotLight.color = new Color(0xffffff);
spotLight.intensity = 1.0;

// Shadows
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.bias = -0.0001;
spotLight.shadow.normalBias = 0.05;

// Spotlight follow mouse/pointer
const mouse = { x: 0, y: 0 };

function updateSpotlight() {
  const worldPosition = new Vector3();
  mouse.unproject(camera);
  
  spotLight.target.position.copy(mouse);
  spotLight.target.updateMatrixWorld();
}

// Animated spotlight
function animateSpotlight(time) {
  spotLight.angle = Math.PI / 4 + Math.sin(time) * Math.PI / 8;
  spotLight.penumbra = 0.3 + Math.cos(time * 0.5) * 0.2;
}
```

### HemisphereLight

Light that comes from above and below with different colors (like sky and ground).

```typescript
const hemisphereLight = new HemisphereLight(0xffffff, 0x404040, 1.0);

// Properties
hemisphereLight.skyColor = new Color(0xffffff);    // Sky color
hemisphereLight.groundColor = new Color(0x404040); // Ground color
hemisphereLight.intensity = 1.0;

// Natural lighting setups
const sunsetSky = new HemisphereLight(0xffaa88, 0x442211, 0.8);
const daylightSky = new HemisphereLight(0x87ceeb, 0x8b7d6b, 0.6);
const nightSky = new HemisphereLight(0x4060ff, 0x201040, 0.3);

// Day/night cycle
const dayNightLight = new HemisphereLight(0xffffff, 0x444444, 1.0);

function updateDayNightCycle(time) {
  const cycle = Math.sin(time * 0.1) * 0.5 + 0.5; // 0 to 1
  
  // Sky changes from night blue to day blue
  dayNightLight.skyColor.setHSL(0.6, 0.5, 0.3 + cycle * 0.4);
  
  // Ground gets warmer during day
  dayNightLight.groundColor.setHSL(0.1, 0.3, 0.1 + cycle * 0.3);
  
  dayNightLight.intensity = 0.3 + cycle * 0.7;
}
```

## Advanced Lighting Techniques

### Light Probes

Light probes capture environment lighting and provide realistic illumination.

```typescript
class LightProbe {
  constructor(position = new Vector3(), size = 256) {
    this.position = position.clone();
    this.size = size;
    this.cubeCamera = new CubeCamera(0.1, 1000, size);
    this.intensity = 1.0;
    
    this.cubeCamera.position.copy(this.position);
  }
  
  updateFromScene(scene) {
    // Render environment from probe position
    this.cubeCamera.update(renderer, scene);
    return this.cubeCamera.renderTarget.texture;
  }
  
  applyToMaterials(materials) {
    const envMap = this.updateFromScene(scene);
    
    materials.forEach(material => {
      material.envMap = envMap;
      material.envMapIntensity = this.intensity;
      material.needsUpdate = true;
    });
  }
}

// Multiple light probes for different areas
const probe1 = new LightProbe(new Vector3(0, 5, 0), 256);
const probe2 = new LightProbe(new Vector3(10, 5, 10), 128);
const probe3 = new LightProbe(new Vector3(-10, 3, -10), 128);

// Apply based on object position
function applyLightProbes(object, materials) {
  const position = object.position;
  
  if (position.distanceTo(probe1.position) < 15) {
    probe1.applyToMaterials(materials);
  } else if (position.distanceTo(probe2.position) < 10) {
    probe2.applyToMaterials(materials);
  } else if (position.distanceTo(probe3.position) < 10) {
    probe3.applyToMaterials(materials);
  }
}
```

### Volumetric Lighting

Simulate light scattering through atmosphere or objects.

```typescript
class VolumetricLight {
  constructor(light, opts = {}) {
    this.light = light;
    this.density = opts.density || 0.1;
    this.decay = opts.decay || 1.0;
    this.weight = opts.weight || 0.4;
    this.clamp = opts.clamp || 1.0;
    
    this.createVolume();
  }
  
  createVolume() {
    // Create cone geometry for directional light
    if (this.light instanceof DirectionalLight) {
      const height = 20;
      const radius = 5;
      const geometry = new ConeGeometry(radius, height, 32, 1, true);
      
      const material = new ShaderMaterial({
        uniforms: {
          lightColor: { value: this.light.color },
          density: { value: this.density },
          decay: { value: this.decay },
          weight: { value: this.weight },
          clamp: { value: this.clamp }
        },
        vertexShader: `
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 lightColor;
          uniform float density;
          uniform float decay;
          uniform float weight;
          uniform float clamp;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vec3 lightDir = normalize(vec3(0.0, -1.0, 0.0));
            float intensity = pow(max(0.0, dot(vNormal, lightDir)), density);
            vec3 color = lightColor * intensity * weight;
            gl_FragColor = vec4(color, intensity * clamp);
          }
        `,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide
      });
      
      this.volume = new Mesh(geometry, material);
      this.volume.position.copy(this.light.position);
      this.volume.lookAt(this.light.target.position);
    }
    
    // Create sphere for point light
    if (this.light instanceof PointLight) {
      const geometry = new SphereGeometry(this.light.distance, 32, 16);
      
      const material = new ShaderMaterial({
        uniforms: {
          lightColor: { value: this.light.color },
          lightPosition: { value: this.light.position },
          intensity: { value: this.light.intensity }
        },
        vertexShader: `
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 lightColor;
          uniform vec3 lightPosition;
          uniform float intensity;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            float distance = length(vPosition - lightPosition);
            float fade = 1.0 - smoothstep(0.0, 10.0, distance);
            vec3 lightDir = normalize(lightPosition - vPosition);
            float intensity = max(0.0, dot(vNormal, lightDir)) * fade * intensity;
            vec3 color = lightColor * intensity;
            gl_FragColor = vec4(color, intensity * 0.5);
          }
        `,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false
      });
      
      this.volume = new Mesh(geometry, material);
      this.volume.position.copy(this.light.position);
    }
  }
  
  update() {
    if (this.light instanceof PointLight) {
      this.volume.position.copy(this.light.position);
    }
  }
}

// Usage
const volumetricLight = new VolumetricLight(directionalLight, {
  density: 2.0,
  decay: 1.5,
  weight: 0.4,
  clamp: 0.8
});

scene.add(volumetricLight.volume);
```

### Area Lights

Lights that emit light from a rectangular area (like windows or screens).

```typescript
class AreaLight {
  constructor(width, height, color = 0xffffff, intensity = 1.0) {
    this.width = width;
    this.height = height;
    this.color = new Color(color);
    this.intensity = intensity;
    
    this.createLightPlane();
  }
  
  createLightPlane() {
    const geometry = new PlaneGeometry(this.width, this.height);
    
    const material = new ShaderMaterial({
      uniforms: {
        lightColor: { value: this.color },
        intensity: { value: this.intensity },
        resolution: { value: new Vector2(512, 512) }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lightColor;
        uniform float intensity;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        void main() {
          // Create smooth falloff from center
          vec2 center = vec2(0.5, 0.5);
          float distance = length(vUv - center);
          float falloff = 1.0 - smoothstep(0.0, 0.7, distance);
          
          // Add some pattern
          float pattern = sin(vUv.x * 20.0) * sin(vUv.y * 20.0) * 0.5 + 0.5;
          float finalIntensity = falloff * pattern * intensity;
          
          vec3 color = lightColor * finalIntensity;
          gl_FragColor = vec4(color, finalIntensity);
        }
      `,
      transparent: true,
      side: DoubleSide
    });
    
    this.mesh = new Mesh(geometry, material);
  }
  
  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }
  
  setRotation(x, y, z) {
    this.mesh.rotation.set(x, y, z);
  }
  
  setIntensity(intensity) {
    this.intensity = intensity;
    this.mesh.material.uniforms.intensity.value = intensity;
  }
}

// Window light simulation
const windowLight = new AreaLight(2, 3, 0xffffff, 2.0);
windowLight.setPosition(0, 2, -5);
windowLight.setRotation(0, 0, 0);

// Screen light
const screenLight = new AreaLight(1.5, 1, 0x4488ff, 1.0);
screenLight.setPosition(0, 1, 3);
screenLight.setRotation(Math.PI / 2, 0, 0);

// Animate screen brightness
function animateScreenLight(time) {
  const brightness = Math.sin(time * 0.5) * 0.5 + 0.5; // 0 to 1
  screenLight.setIntensity(0.5 + brightness * 1.5);
}
```

## Shadow Mapping

### Basic Shadow Setup

```typescript
// Configure renderer for shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;

// Configure global shadow settings
renderer.shadowMap.bias = -0.0001;
renderer.shadowMap.radius = 4;

// Individual light shadows
const directionalLight = new DirectionalLight(0xffffff, 1.0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.normalBias = 0.02;
directionalLight.shadow.darkness = 0.5;

// Point light shadows
const pointLight = new PointLight(0xffffff, 1.0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.set(1024, 1024);
pointLight.shadow.bias = -0.001;
pointLight.shadow.normalBias = 0.01;

// Spotlight shadows
const spotLight = new SpotLight(0xffffff, 1.0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(2048, 2048);
spotLight.shadow.bias = -0.0001;
spotLight.shadow.normalBias = 0.05;
spotLight.shadow.radius = 4;
```

### Cascaded Shadow Maps

For large outdoor scenes, use cascaded shadow maps to optimize shadow quality.

```typescript
class CascadedShadowMap {
  constructor(light, camera, options = {}) {
    this.light = light;
    this.camera = camera;
    this.cascadeCount = options.cascadeCount || 3;
    this.cascadeSplits = options.cascadeSplits || [0.1, 0.3, 0.7];
    this.shadowMapSize = options.shadowMapSize || 2048;
    
    this.setupCascades();
  }
  
  setupCascades() {
    this.shadowCameras = [];
    this.shadowMaps = [];
    
    for (let i = 0; i < this.cascadeCount; i++) {
      const shadowCamera = new OrthographicCamera(-20, 20, 20, -20, 1, 100);
      shadowCamera.position.copy(this.light.position);
      shadowCamera.lookAt(this.light.target.position);
      shadowCamera.updateMatrixWorld();
      
      this.shadowCameras.push(shadowCamera);
      
      const shadowMap = new WebGLRenderTarget(
        this.shadowMapSize / Math.pow(2, i),
        this.shadowMapSize / Math.pow(2, i)
      );
      this.shadowMaps.push(shadowMap);
    }
  }
  
  update() {
    const cameraFrustum = this.camera.getWorldFrustum();
    
    for (let i = 0; i < this.cascadeCount; i++) {
      const cascadeEnd = this.cascadeSplits[i] * cameraFrustum.far;
      const shadowCamera = this.shadowCameras[i];
      
      shadowCamera.far = cascadeEnd;
      shadowCamera.updateProjectionMatrix();
      
      // Position shadow camera to cover cascade region
      this.positionShadowCamera(shadowCamera, cascadeEnd);
    }
  }
  
  positionShadowCamera(shadowCamera, distance) {
    // Calculate optimal shadow camera position
    const lightDirection = new Vector3()
      .subVectors(this.light.target.position, this.light.position)
      .normalize();
    
    const cameraPosition = this.camera.position.clone();
    const targetPosition = new Vector3()
      .addVectors(cameraPosition, lightDirection.clone().multiplyScalar(distance));
    
    shadowCamera.position.copy(this.light.position);
    shadowCamera.lookAt(targetPosition);
    shadowCamera.updateMatrixWorld();
  }
  
  renderShadowPass(scene) {
    this.update();
    
    for (let i = 0; i < this.cascadeCount; i++) {
      renderer.setRenderTarget(this.shadowMaps[i]);
      renderer.clear();
      
      const shadowCamera = this.shadowCameras[i];
      
      // Render shadow map
      scene.traverse((object) => {
        if (object.castShadow) {
          object.updateMatrixWorld();
          renderer.renderObject(object, shadowCamera);
        }
      });
    }
    
    renderer.setRenderTarget(null);
  }
}

// Usage
const cascadedShadow = new CascadedShadowMap(directionalLight, camera);
```

## Light Baking

Bake lighting information into textures for better performance.

```typescript
class LightBaker {
  constructor(resolution = 1024) {
    this.resolution = resolution;
    this.bakeCamera = new PerspectiveCamera(90, 1, 0.1, 1000);
    this.renderTarget = new WebGLRenderTarget(resolution, resolution, {
      format: RGBFormat,
      type: UnsignedByteType
    });
  }
  
  bakeLightMap(object, scene, lights) {
    // Create secondary UVs for lightmap
    object.geometry.setAttribute('uv2', object.geometry.getAttribute('uv'));
    
    // Disable dynamic shadows during baking
    lights.forEach(light => {
      const originalShadowSetting = light.castShadow;
      light.castShadow = false;
      light.userData.originalShadowSetting = originalShadowSetting;
    });
    
    // Render from all directions for ambient occlusion
    const lightmapTexture = new LightmapTexture();
    
    for (let face = 0; face < 6; face++) {
      // Set up camera for cube face
      this.setupBakeCamera(face);
      
      // Render scene from this angle
      this.bakeCamera.updateMatrixWorld();
      renderer.setRenderTarget(this.renderTarget);
      renderer.clear();
      renderer.render(scene, this.bakeCamera);
      
      // Read pixels and update lightmap
      const pixels = new Uint8Array(this.resolution * this.resolution * 4);
      renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.resolution, this.resolution, pixels);
      
      // Update lightmap texture
      this.updateLightmap(lightmapTexture, pixels, face);
    }
    
    renderer.setRenderTarget(null);
    
    // Restore shadow settings
    lights.forEach(light => {
      light.castShadow = light.userData.originalShadowSetting;
    });
    
    return lightmapTexture;
  }
  
  setupBakeCamera(face) {
    const directions = [
      new Vector3(1, 0, 0),   // +X
      new Vector3(-1, 0, 0),  // -X
      new Vector3(0, 1, 0),   // +Y
      new Vector3(0, -1, 0),  // -Y
      new Vector3(0, 0, 1),   // +Z
      new Vector3(0, 0, -1)   // -Z
    ];
    
    const targets = [
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0)
    ];
    
    this.bakeCamera.position.set(0, 0, 0);
    this.bakeCamera.lookAt(targets[face]);
  }
}

// Usage
const lightBaker = new LightBaker(1024);
const bakedLightmap = lightBaker.bakeLightMap(wallMesh, scene, [directionalLight]);

// Apply baked lightmap to material
wallMesh.material.lightMap = bakedLightmap;
wallMesh.material.lightMapIntensity = 1.0;
```

## Performance Optimization

### Light Batching

Group similar lights to reduce draw calls.

```typescript
class LightBatcher {
  constructor() {
    this.lightGroups = new Map();
  }
  
  addLight(light, groupName = 'default') {
    if (!this.lightGroups.has(groupName)) {
      this.lightGroups.set(groupName, []);
    }
    
    this.lightGroups.get(groupName).push(light);
  }
  
  optimizeLights() {
    this.lightGroups.forEach((lights, groupName) => {
      // Combine similar point lights into single light with multiple sources
      this.combinePointLights(lights);
      
      // Use light cookies for patterned lighting
      this.applyLightCookies(lights);
      
      // Cull distant lights
      this.cullDistantLights(lights);
    });
  }
  
  combinePointLights(lights) {
    const pointLights = lights.filter(light => light instanceof PointLight);
    
    if (pointLights.length > 8) { // Limit per scene
      // Combine into area light or reduce count
      console.warn(`Too many point lights (${pointLights.length}). Consider optimization.`);
    }
  }
  
  applyLightCookies(lights) {
    lights.forEach(light => {
      if (light instanceof SpotLight) {
        // Apply texture patterns
        light.cookie = this.createCookieTexture();
        light.cookieIntensity = 0.5;
      }
    });
  }
  
  createCookieTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create striped pattern
    context.fillStyle = 'white';
    context.fillRect(0, 0, 256, 256);
    
    context.fillStyle = 'black';
    for (let i = 0; i < 256; i += 32) {
      context.fillRect(i, 0, 16, 256);
    }
    
    return new CanvasTexture(canvas);
  }
  
  cullDistantLights(lights, maxDistance = 100) {
    lights.forEach(light => {
      const distance = light.position.distanceTo(camera.position);
      light.visible = distance < maxDistance;
    });
  }
}
```

### Dynamic Lighting LOD

Adjust light quality based on distance from camera.

```typescript
class DynamicLightLOD {
  constructor(camera) {
    this.camera = camera;
    this.levels = [
      { distance: 10, quality: 'high', shadows: true },
      { distance: 25, quality: 'medium', shadows: true },
      { distance: 50, quality: 'low', shadows: false },
      { distance: Infinity, quality: 'off', shadows: false }
    ];
  }
  
  updateLights(lights) {
    this.levels.forEach(level => {
      const adjustedLights = lights.filter(light => 
        light.position.distanceTo(this.camera.position) < level.distance
      );
      
      adjustedLights.forEach(light => {
        this.applyLODLevel(light, level);
      });
    });
  }
  
  applyLODLevel(light, level) {
    switch (level.quality) {
      case 'high':
        light.intensity *= 1.0;
        light.castShadow = level.shadows;
        if (light.shadow) {
          light.shadow.mapSize.set(2048, 2048);
        }
        break;
        
      case 'medium':
        light.intensity *= 0.8;
        light.castShadow = level.shadows;
        if (light.shadow) {
          light.shadow.mapSize.set(1024, 1024);
        }
        break;
        
      case 'low':
        light.intensity *= 0.5;
        light.castShadow = level.shadows;
        if (light.shadow) {
          light.shadow.mapSize.set(512, 512);
        }
        break;
        
      case 'off':
        light.intensity = 0;
        light.castShadow = false;
        break;
    }
  }
}
```

This completes the lighting guide. Lighting is complex but crucial for realistic 3D scenes. Experiment with different light types and configurations to achieve the desired atmosphere and realism in your 9th.js applications.