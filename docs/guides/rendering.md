# Rendering Guide

This guide covers advanced rendering techniques and optimization strategies in 9th.js. Understanding these concepts will help you create high-performance, visually stunning 3D applications.

## Rendering Pipeline Overview

The 9th.js rendering pipeline follows these stages:

1. **Update** - Update transforms, animations, and physics
2. **Culling** - Determine visible objects
3. **Sorting** - Order objects for optimal rendering
4. **Shading** - Apply materials and lighting
5. **Post-processing** - Apply visual effects

## Basic Rendering Setup

```typescript
// Initialize engine with custom options
const engine = new Engine(canvas, {
  antialias: true,           // Smooth edges
  alpha: false,              // Opaque canvas
  depth: true,               // Depth testing
  stencil: false,            // No stencil buffer
  powerPreference: 'high-performance',
  renderer: {
    maxLights: 8,           // Limit lights for performance
    enableCulling: true,    // Enable frustum culling
    shadowMapSize: 2048     // Shadow map resolution
  }
});

// Configure scene
const scene = new Scene();
scene.background = new Color(0x87ceeb); // Sky blue

// Setup camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10);
engine.setCamera(camera);
```

## Lighting Systems

### Basic Lighting

```typescript
// Ambient light - overall scene illumination
const ambientLight = new AmbientLight(0x404040, 1);
scene.add(ambientLight);

// Directional light - like the sun
const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight);

// Point light - localized light source
const pointLight = new PointLight(0xffffff, 1);
pointLight.position.set(5, 5, 5);
pointLight.distance = 50;     // Light falloff distance
pointLight.decay = 2;         // Light decay rate
scene.add(pointLight);

// Spotlight - directional light with angle
const spotLight = new SpotLight(0xffffff, 1);
spotLight.position.set(5, 5, 5);
spotLight.target.position.set(0, 0, 0);
spotLight.angle = Math.PI / 6;    // Spotlight angle
spotLight.penumbra = 0.3;         // Soft edge
spotLight.decay = 2;
spotLight.distance = 50;
scene.add(spotLight);
```

### Advanced Lighting Techniques

#### Light Probes

```typescript
// Environment lighting using light probes
class LightProbeManager {
  private lightProbes: LightProbe[] = [];
  
  addLightProbe(position: Vector3, radius: number): LightProbe {
    const lightProbe = new LightProbe(position, radius);
    this.lightProbes.push(lightProbe);
    scene.add(lightProbe);
    return lightProbe;
  }
  
  update(): void {
    this.lightProbes.forEach(probe => {
      probe.updateFromEnvironment();
    });
  }
}

// Usage
const probeManager = new LightProbeManager();
const probe = probeManager.addLightProbe(new Vector3(0, 5, 0), 10);
```

#### Volumetric Lighting

```typescript
// Create volumetric light effect
class VolumetricLight {
  private material: ShaderMaterial;
  private cone: ConeGeometry;
  private mesh: Mesh;
  
  constructor(light: Light) {
    this.setupVolumetricCone(light);
  }
  
  private setupVolumetricCone(light: Light) {
    // Create cone geometry extending from light
    this.cone = new ConeGeometry(5, 20, 32, 1, true);
    
    // Custom shader for volumetric effect
    this.material = new ShaderMaterial({
      uniforms: {
        lightColor: { value: light.color },
        lightPosition: { value: light.position },
        coneAngle: { value: Math.PI / 6 }
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
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform vec3 lightColor;
        uniform vec3 lightPosition;
        uniform float coneAngle;
        
        void main() {
          vec3 lightDir = normalize(lightPosition - vPosition);
          float intensity = pow(max(0.0, dot(lightDir, vNormal)), 4.0);
          vec3 color = lightColor * intensity * 0.1;
          gl_FragColor = vec4(color, intensity * 0.3);
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false
    });
    
    this.mesh = new Mesh(this.cone, this.material);
    this.mesh.position.copy(light.position);
  }
}
```

## Shadow Mapping

### Basic Shadow Setup

```typescript
// Enable shadow maps
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

// Configure light to cast shadows
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.normalBias = 0.02;

// Configure objects
cube.castShadow = true;
cube.receiveShadow = true;
plane.receiveShadow = true;
```

### Advanced Shadow Techniques

#### Cascaded Shadow Maps

```typescript
// Implement cascaded shadow maps for large outdoor scenes
class CascadedShadowMap {
  private cascades: ShadowCamera[] = [];
  private resolution: number = 2048;
  
  constructor(light: DirectionalLight, camera: Camera) {
    this.setupCascades(light, camera);
  }
  
  private setupCascades(light: DirectionalLight, camera: Camera) {
    const cascadeDistances = [10, 50, 200]; // Near to far cascades
    
    for (let i = 0; i < 3; i++) {
      const shadowCamera = new OrthographicCamera(-20, 20, 20, -20, 1, cascadeDistances[i]);
      shadowCamera.position.copy(light.position);
      shadowCamera.lookAt(0, 0, 0);
      shadowCamera.updateMatrixWorld();
      
      this.cascades.push(shadowCamera);
    }
  }
  
  update(camera: Camera): void {
    // Update cascade frustums based on main camera
    const frustum = camera.getWorldFrustum();
    
    this.cascades.forEach((shadowCam, index) => {
      // Adjust shadow camera frustum
      const distance = index === 0 ? frustum.near : frustum.far;
      shadowCam.far = distance;
      shadowCam.updateProjectionMatrix();
    });
  }
}
```

#### Soft Shadows

```typescript
// PCF soft shadow filtering
class SoftShadowRenderer extends WebGLRenderer {
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.setupSoftShadows();
  }
  
  private setupSoftShadows(): void {
    // Configure for soft shadows
    this.shadowMap.enabled = true;
    this.shadowMap.type = PCFSoftShadowMap;
    
    // Use larger kernel for softer shadows
    this.shadowMap.blurSamples = 16;
  }
  
  render(scene: Scene, camera: Camera): void {
    // Render shadows with blur
    this.renderShadows(scene);
    
    // Render main scene
    super.render(scene, camera);
  }
  
  private renderShadows(scene: Scene): void {
    scene.traverse((object) => {
      if (object.castShadow) {
        this.renderShadow(object);
      }
    });
  }
}
```

## Materials and Shaders

### Shader Material Basics

```typescript
// Custom vertex and fragment shaders
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 lightColor;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Animated pattern
    vec2 animatedUv = vUv + sin(time) * 0.1;
    
    // Basic lighting
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(0.0, dot(vNormal, lightDir));
    
    // Combine lighting with pattern
    vec3 color = lightColor * diff * (sin(animatedUv.x * 10.0) * 0.5 + 0.5);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Create shader material
const shaderMaterial = new ShaderMaterial({
  uniforms: {
    lightColor: { value: new Color(0x00ff00) },
    time: { value: 0 }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  side: DoubleSide
});
```

### PBR (Physically Based Rendering)

```typescript
// PBR material with textures
const pbrMaterial = new StandardMaterial({
  // Base color
  color: 0xffffff,
  
  // PBR properties
  metalness: 0.2,
  roughness: 0.8,
  
  // Normal mapping
  normalMap: normalTexture,
  normalScale: new Vector2(1, 1),
  
  // Occlusion
  aoMap: aoTexture,
  aoMapIntensity: 1.0,
  
  // Emission
  emissive: new Color(0x000000),
  emissiveMap: emissiveTexture,
  emissiveIntensity: 1.0,
  
  // Alpha
  alphaMap: alphaTexture,
  transparent: true,
  opacity: 1.0,
  
  // Environment
  envMap: envMap,
  envMapIntensity: 1.0,
  
  // UV transform
  map: baseColorTexture,
  uvTransform: new Matrix3().set(
    2, 0, 0,
    0, 2, 0,
    0, 0, 1
  )
});

// Advanced PBR with clearcoat
const advancedPBR = new PhysicalMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.05,
  
  // Clearcoat layer
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  clearcoatNormalMap: clearcoatNormalTexture,
  
  // Sheen
  sheen: 0.5,
  sheenColor: new Color(0xffffff),
  sheenRoughness: 0.5,
  
  // Transmission (glass-like)
  transmission: 0.9,
  thickness: 1.0,
  ior: 1.5, // Index of refraction
  attenuationColor: new Color(0xffffff),
  attenuationDistance: 1.0
});
```

### Shader Material Utilities

```typescript
// Utility class for managing shaders
class ShaderManager {
  private shaders: Map<string, ShaderMaterial> = new Map();
  
  createWobbleShader(): ShaderMaterial {
    const shader = new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        amplitude: { value: 0.1 },
        frequency: { value: 2.0 }
      },
      vertexShader: `
        uniform float time;
        uniform float amplitude;
        uniform float frequency;
        
        varying vec3 vNormal;
        
        void main() {
          vec3 newPosition = position;
          newPosition.z += sin(position.x * frequency + time) * amplitude;
          
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        
        void main() {
          float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
          gl_FragColor = vec4(vec3(0.5 + lighting * 0.5), 1.0);
        }
      `
    });
    
    this.shaders.set('wobble', shader);
    return shader;
  }
  
  updateShaderTime(time: number): void {
    this.shaders.forEach(shader => {
      if (shader.uniforms.time) {
        shader.uniforms.time.value = time;
      }
    });
  }
}
```

## Post-Processing Effects

### Basic Post-Processing Setup

```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

// Create composer
const composer = new EffectComposer(renderer);

// Add passes
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// FXAA for anti-aliasing
const fxaaPass = new ShaderPass(FXAAShader);
composer.addPass(fxaaPass);

// Bloom effect
const bloomPass = new UnrealBloomPass(
  new Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// Render with composer
function animate() {
  requestAnimationFrame(animate);
  
  composer.render();
}
```

### Custom Post-Processing Pass

```typescript
// Custom color grading pass
class ColorGradingPass extends ShaderPass {
  constructor() {
    super(new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        brightness: { value: 0.0 },
        contrast: { value: 1.0 },
        saturation: { value: 1.0 },
        hue: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float brightness;
        uniform float contrast;
        uniform float saturation;
        uniform float hue;
        varying vec2 vUv;
        
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs((q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Brightness
          color.rgb += brightness;
          
          // Contrast
          color.rgb = (color.rgb - 0.5) * contrast + 0.5;
          
          // Saturation
          float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(vec3(luma), color.rgb, saturation);
          
          // Hue
          vec3 hsv = rgb2hsv(color.rgb);
          hsv.x += hue;
          color.rgb = hsv2rgb(hsv);
          
          gl_FragColor = color;
        }
      `,
      transparent: false
    }));
  }
  
  setBrightness(brightness: number): void {
    this.material.uniforms.brightness.value = brightness;
  }
  
  setContrast(contrast: number): void {
    this.material.uniforms.contrast.value = contrast;
  }
}

// Usage
const colorGradingPass = new ColorGradingPass();
composer.addPass(colorGradingPass);

// Adjust in real-time
colorGradingPass.setBrightness(0.1);
colorGradingPass.setContrast(1.2);
colorGradingPass.setSaturation(0.8);
```

## Optimization Techniques

### Geometry Optimization

```typescript
// Level of Detail (LOD) system
class LODSystem {
  private lodObjects: LODObject[] = [];
  
  addLODObject(object: Object3D, distances: number[], geometries: BufferGeometry[]): void {
    const lodObject = new LODObject();
    
    for (let i = 0; i < geometries.length; i++) {
      const mesh = new Mesh(geometries[i], object.material);
      mesh.position.copy(object.position);
      mesh.rotation.copy(object.rotation);
      mesh.scale.copy(object.scale);
      mesh.visible = i === 0; // Show highest detail by default
      
      mesh.userData.lodLevel = i;
      mesh.userData.lodDistance = distances[i];
      
      lodObject.add(mesh);
    }
    
    this.lodObjects.push(lodObject);
    scene.add(lodObject);
  }
  
  update(camera: Camera): void {
    const cameraPosition = camera.position.clone();
    
    this.lodObjects.forEach(lodObject => {
      const worldPosition = lodObject.getWorldPosition();
      const distance = cameraPosition.distanceTo(worldPosition);
      
      lodObject.children.forEach(child => {
        const lodDistance = child.userData.lodDistance;
        child.visible = distance < lodDistance;
      });
    });
  }
}
```

### Instancing Optimization

```typescript
// Efficiently render many similar objects
class InstancedRenderer {
  private instances: Map<string, InstancedMesh> = new Map();
  
  addInstancedGeometry(key: string, geometry: BufferGeometry, material: Material, count: number): InstancedMesh {
    const instanced = new InstancedMesh(geometry, material, count);
    this.instances.set(key, instanced);
    scene.add(instanced);
    return instanced;
  }
  
  setInstanceTransform(key: string, index: number, position: Vector3, rotation?: Euler, scale?: Vector3): void {
    const instanced = this.instances.get(key);
    if (!instanced) return;
    
    const matrix = new Matrix4();
    matrix.compose(
      position,
      rotation ? new Quaternion().setFromEuler(rotation) : new Quaternion(),
      scale || new Vector3(1, 1, 1)
    );
    
    instanced.setMatrixAt(index, matrix);
    instanced.instanceMatrix.needsUpdate = true;
  }
  
  setInstanceColor(key: string, index: number, color: Color): void {
    const instanced = this.instances.get(key);
    if (!instanced) return;
    
    instanced.setColorAt(index, color);
    instanced.instanceColor.needsUpdate = true;
  }
}

// Usage
const renderer = new InstancedRenderer();
const instancedTrees = renderer.addInstancedGeometry('trees', treeGeometry, treeMaterial, 1000);

// Position trees
for (let i = 0; i < 1000; i++) {
  const position = new Vector3(
    (Math.random() - 0.5) * 1000,
    0,
    (Math.random() - 0.5) * 1000
  );
  
  renderer.setInstanceTransform('trees', i, position);
  
  // Vary colors
  const color = new Color();
  color.setHSL(Math.random() * 0.1 + 0.3, 0.7, 0.4);
  renderer.setInstanceColor('trees', i, color);
}
```

### Texture Atlasing

```typescript
// Combine multiple textures into one atlas
class TextureAtlas {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private texture: CanvasTexture;
  private regions: Map<string, Rectangle> = new Map();
  
  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d')!;
    
    this.texture = new CanvasTexture(this.canvas);
    this.texture.magFilter = NearestFilter;
    this.texture.minFilter = NearestFilter;
  }
  
  addTexture(key: string, image: HTMLImageElement): void {
    // Simple packing algorithm - pack textures in a grid
    const cols = Math.floor(this.canvas.width / image.width);
    const rows = Math.floor(this.canvas.height / image.height);
    
    const index = this.regions.size;
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    const x = col * image.width;
    const y = row * image.height;
    
    this.context.drawImage(image, x, y);
    
    this.regions.set(key, new Rectangle(x, y, image.width, image.height));
    this.texture.needsUpdate = true;
  }
  
  getRegion(key: string): Rectangle {
    return this.regions.get(key)!;
  }
  
  getTexture(): Texture {
    return this.texture;
  }
}
```

## Performance Monitoring

```typescript
// Performance monitoring system
class PerformanceMonitor {
  private stats: PerformanceStats;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 60;
  
  constructor() {
    this.stats = {
      fps: 0,
      frameTime: 0,
      triangles: 0,
      drawCalls: 0,
      textures: 0,
      geometries: 0,
      shaders: 0
    };
  }
  
  update(currentTime: number): void {
    this.frameCount++;
    
    // Calculate FPS
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    // Get renderer stats
    const rendererInfo = renderer.info;
    this.stats.drawCalls = rendererInfo.render.calls;
    this.stats.triangles = rendererInfo.render.triangles;
    this.stats.textures = rendererInfo.textures;
    this.stats.geometries = rendererInfo.geometries;
  }
  
  getStats(): PerformanceStats {
    return this.stats;
  }
  
  logStats(): void {
    console.log(`
      FPS: ${this.fps}
      Triangles: ${this.stats.triangles}
      Draw Calls: ${this.stats.drawCalls}
      Textures: ${this.stats.textures}
      Geometries: ${this.stats.geometries}
    `);
  }
}
```

This completes the rendering guide. Next, explore the [Animation Guide](animation.md) for creating complex animations, or check out the [Examples](../examples/) for practical implementations.