# Advanced Rendering in Ninth.js

Master the art of advanced rendering techniques in Ninth.js. This tutorial covers post-processing effects, custom shaders, advanced lighting, and cutting-edge rendering methods.

## Rendering Pipeline Overview

Understanding Ninth.js rendering pipeline:
- **Geometry Processing** - Vertex transformations and clipping
- **Rasterization** - Converting 3D to 2D pixels
- **Fragment Processing** - Pixel shading and texturing
- **Post-Processing** - Screen-space effects and filters

## Custom Shaders

### Vertex and Fragment Shaders

```javascript
// Custom vertex shader
const vertexShader = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    
    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    uniform mat3 normalMatrix;
    
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
`;

// Custom fragment shader
const fragmentShader = `
    precision highp float;
    
    uniform vec3 lightPosition;
    uniform vec3 cameraPosition;
    uniform float time;
    
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
        // Basic lighting
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(lightPosition - vPosition);
        vec3 viewDir = normalize(cameraPosition - vPosition);
        
        float diffuse = max(dot(normal, lightDir), 0.0);
        
        // Specular reflection
        vec3 reflectDir = reflect(-lightDir, normal);
        float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        
        // Animated color
        vec3 baseColor = vec3(
            0.5 + 0.5 * sin(time + vUv.x * 10.0),
            0.5 + 0.5 * sin(time + vUv.y * 10.0),
            0.5 + 0.5 * sin(time + vUv.x * vUv.y * 20.0)
        );
        
        vec3 finalColor = baseColor * (0.3 + 0.7 * diffuse) + specular * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Create custom material
const customMaterial = new NinthJS.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        lightPosition: { value: new NinthJS.Vector3(5, 5, 5) },
        cameraPosition: { value: new NinthJS.Vector3() },
        time: { value: 0 }
    }
});
```

### Complete Shader Example: Toon Shading

```html
<!DOCTYPE html>
<html>
<head>
    <title>Custom Shader Demo - Ninth.js</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; }
        #controls {
            position: absolute; top: 10px; left: 10px; z-index: 100;
            background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 5px;
        }
        .slider-group { margin: 10px 0; }
        input[type="range"] { width: 150px; }
        label { display: inline-block; width: 100px; }
    </style>
</head>
<body>
    <div id="controls">
        <h3>Shader Controls</h3>
        <div class="slider-group">
            <label>Quantization:</label>
            <input type="range" id="quantization" min="1" max="8" value="3">
            <span id="quantizationValue">3</span>
        </div>
        <div class="slider-group">
            <label>Specular:</label>
            <input type="range" id="specular" min="0" max="2" step="0.1" value="0.5">
            <span id="specularValue">0.5</span>
        </div>
        <div class="slider-group">
            <label>Rim Light:</label>
            <input type="range" id="rimLight" min="0" max="2" step="0.1" value="1">
            <span id="rimLightValue">1</span>
        </div>
        <button onclick="toggleWireframe()">Wireframe</button>
        <button onclick="addObject()">Add Object</button>
    </div>
    
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        // Toon shader materials
        const toonVertexShader = `
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vViewPosition;
            
            void main() {
                vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                vNormal = normalize(normalMatrix * normal);
                vUv = uv;
                vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        
        const toonFragmentShader = `
            precision highp float;
            
            uniform vec3 lightPosition;
            uniform vec3 cameraPosition;
            uniform float time;
            uniform float quantization;
            uniform float specularStrength;
            uniform float rimLightStrength;
            uniform vec3 baseColor;
            
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vViewPosition;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(lightPosition - vPosition);
                vec3 viewDir = normalize(vViewPosition);
                
                // Quantized diffuse lighting
                float NdotL = max(dot(normal, lightDir), 0.0);
                float quantizedDiffuse = floor(NdotL * quantization) / quantization;
                
                // Toon shading colors
                vec3 toonColors[4];
                toonColors[0] = baseColor * 0.3;  // Shadow
                toonColors[1] = baseColor * 0.6;  // Mid-tone 1
                toonColors[2] = baseColor * 0.9;  // Mid-tone 2
                toonColors[3] = vec3(1.0);        // Highlight
                
                vec3 diffuseColor;
                if (quantizedDiffuse < 0.25) {
                    diffuseColor = toonColors[0];
                } else if (quantizedDiffuse < 0.5) {
                    diffuseColor = toonColors[1];
                } else if (quantizedDiffuse < 0.75) {
                    diffuseColor = toonColors[2];
                } else {
                    diffuseColor = toonColors[3];
                }
                
                // Specular highlight (simplified)
                vec3 reflectDir = reflect(-lightDir, normal);
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 16.0);
                vec3 specular = vec3(spec) * specularStrength;
                
                // Rim lighting
                float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                rim = smoothstep(0.6, 1.0, rim);
                vec3 rimLight = rim * rimLightStrength * baseColor;
                
                // Outline effect
                float outline = max(dot(viewDir, normal), 0.0);
                outline = smoothstep(0.0, 0.4, outline);
                vec3 outlineColor = vec3(0.0); // Black outline
                
                // Combine all effects
                vec3 finalColor = diffuseColor + specular + rimLight;
                finalColor = mix(outlineColor, finalColor, outline);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        class ShaderDemo {
            constructor() {
                this.canvas = document.getElementById('canvas');
                this.scene = new NinthJS.Scene();
                this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                this.renderer = new NinthJS.Renderer(this.canvas);
                this.objects = [];
                
                this.init();
                this.createScene();
                this.setupControls();
                this.animate();
            }
            
            init() {
                this.scene.setBackground('#112233');
                this.camera.setPosition(0, 2, 8);
                
                // Setup lighting
                const ambientLight = new NinthJS.AmbientLight(0.3, '#404040');
                this.scene.add(ambientLight);
                
                const directionalLight = new NinthJS.DirectionalLight(0.8, '#ffffff');
                directionalLight.setPosition(5, 5, 5);
                this.scene.add(directionalLight);
                
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = NinthJS.PCFSoftShadowMap;
                
                window.addEventListener('resize', () => this.handleResize());
            }
            
            createScene() {
                // Create ground
                const groundGeometry = new NinthJS.PlaneGeometry(20, 20);
                const groundMaterial = new NinthJS.PhongMaterial({ color: '#333333' });
                const ground = new NinthJS.Mesh(groundGeometry, groundMaterial);
                ground.setRotation(-Math.PI / 2, 0, 0);
                ground.receiveShadow = true;
                this.scene.add(ground);
                
                // Create initial objects with custom shader
                this.createShaderObject(0, 0, 0, '#4488ff');
            }
            
            createShaderObject(x, y, z, color) {
                const geometry = new NinthJS.SphereGeometry(1, 32, 16);
                const material = new NinthJS.ShaderMaterial({
                    vertexShader: toonVertexShader,
                    fragmentShader: toonFragmentShader,
                    uniforms: {
                        lightPosition: { value: new NinthJS.Vector3(5, 5, 5) },
                        cameraPosition: { value: new NinthJS.Vector3() },
                        time: { value: 0 },
                        quantization: { value: 3 },
                        specularStrength: { value: 0.5 },
                        rimLightStrength: { value: 1 },
                        baseColor: { value: new NinthJS.Color(color) }
                    }
                });
                
                const mesh = new NinthJS.Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.setPosition(x, y, z);
                
                this.scene.add(mesh);
                this.objects.push(mesh);
                
                return mesh;
            }
            
            setupControls() {
                const quantizationSlider = document.getElementById('quantization');
                const quantizationValue = document.getElementById('quantizationValue');
                quantizationSlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    quantizationValue.textContent = value;
                    this.updateUniform('quantization', value);
                });
                
                const specularSlider = document.getElementById('specular');
                const specularValue = document.getElementById('specularValue');
                specularSlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    specularValue.textContent = value;
                    this.updateUniform('specularStrength', value);
                });
                
                const rimLightSlider = document.getElementById('rimLight');
                const rimLightValue = document.getElementById('rimLightValue');
                rimLightSlider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    rimLightValue.textContent = value;
                    this.updateUniform('rimLightStrength', value);
                });
            }
            
            updateUniform(uniformName, value) {
                this.objects.forEach(obj => {
                    if (obj.material.uniforms[uniformName]) {
                        obj.material.uniforms[uniformName].value = value;
                    }
                });
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                const time = performance.now() * 0.001;
                
                // Update camera position for view direction
                this.camera.updateMatrixWorld();
                this.camera.updateMatrixWorldInverse();
                
                // Update objects
                this.objects.forEach((obj, index) => {
                    const rotationSpeed = 0.5 + index * 0.2;
                    obj.setRotation(time * rotationSpeed, time * rotationSpeed * 1.5, 0);
                    
                    // Update shader uniforms
                    obj.material.uniforms.time.value = time;
                    obj.material.uniforms.cameraPosition.value.copy(this.camera.position);
                });
                
                // Animate light position
                const light = this.scene.children.find(child => child.type === 'DirectionalLight');
                if (light) {
                    const lightRadius = 8;
                    light.setPosition(
                        Math.cos(time) * lightRadius,
                        5 + Math.sin(time * 0.5) * 2,
                        Math.sin(time) * lightRadius
                    );
                    
                    // Update shader light position uniform
                    this.objects.forEach(obj => {
                        obj.material.uniforms.lightPosition.value.copy(light.position);
                    });
                }
                
                this.renderer.render(this.scene, this.camera);
            }
            
            handleResize() {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        }
        
        // Global functions
        function toggleWireframe() {
            shaderDemo.objects.forEach(obj => {
                obj.material.wireframe = !obj.material.wireframe;
            });
        }
        
        function addObject() {
            const x = (Math.random() - 0.5) * 6;
            const z = (Math.random() - 0.5) * 6;
            const colors = ['#4488ff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            shaderDemo.createShaderObject(x, 1, z, color);
        }
        
        const shaderDemo = new ShaderDemo();
    </script>
</body>
</html>
```

## Post-Processing Effects

### Effect Composer Setup

```javascript
class PostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.renderPass = null;
        this.effects = [];
        
        this.init();
    }
    
    init() {
        // Setup render target
        this.setupRenderTarget();
        
        // Setup effect composer
        this.setupComposer();
        
        // Add render pass
        this.renderPass = new NinthJS.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
    }
    
    setupRenderTarget() {
        const parameters = {
            minFilter: NinthJS.LinearFilter,
            magFilter: NinthJS.LinearFilter,
            format: NinthJS.RGBAFormat,
            type: NinthJS.UnsignedByteType,
            depthBuffer: true,
            stencilBuffer: false
        };
        
        this.renderTarget = new NinthJS.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            parameters
        );
    }
    
    setupComposer() {
        this.composer = new NinthJS.EffectComposer(this.renderer);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setPixelRatio(window.devicePixelRatio);
    }
    
    render() {
        this.composer.render();
    }
    
    resize(width, height) {
        this.composer.setSize(width, height);
        this.renderTarget.setSize(width, height);
    }
}
```

### Custom Post-Processing Shader

```javascript
class BloomEffect {
    constructor(intensity = 1.5, threshold = 0.8) {
        this.intensity = intensity;
        this.threshold = threshold;
        this.uniforms = {
            tDiffuse: { value: null },
            brightnessThreshold: { value: threshold },
            bloomIntensity: { value: intensity }
        };
        
        this.material = new NinthJS.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
            transparent: true
        });
    }
    
    getVertexShader() {
        return `
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    getFragmentShader() {
        return `
            uniform sampler2D tDiffuse;
            uniform float brightnessThreshold;
            uniform float bloomIntensity;
            
            varying vec2 vUv;
            
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);
                
                // Calculate brightness
                float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                
                // Extract bright areas
                vec3 bright = color.rgb * smoothstep(brightnessThreshold, 1.0, brightness);
                
                // Apply bloom intensity
                vec3 bloom = bright * bloomIntensity;
                
                // Add bloom to original color
                vec3 finalColor = color.rgb + bloom;
                
                gl_FragColor = vec4(finalColor, color.a);
            }
        `;
    }
    
    setIntensity(intensity) {
        this.uniforms.bloomIntensity.value = intensity;
    }
    
    setThreshold(threshold) {
        this.uniforms.brightnessThreshold.value = threshold;
    }
}
```

### Complete Post-Processing Chain

```javascript
class AdvancedPostProcessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.composer = null;
        this.renderPass = null;
        this.effects = {};
        
        this.init();
    }
    
    init() {
        // Setup render passes
        this.renderPass = new NinthJS.RenderPass(this.scene, this.camera);
        this.copyPass = new NinthJS.ShaderPass(
            new NinthJS.ShaderMaterial({
                uniforms: {
                    tDiffuse: { value: null }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    varying vec2 vUv;
                    void main() {
                        gl_FragColor = texture2D(tDiffuse, vUv);
                    }
                `
            })
        );
        
        // Setup effects
        this.setupEffects();
        
        // Setup composer
        this.composer = new NinthJS.EffectComposer(this.renderer);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.effects.bloom.renderToScreen);
        this.composer.addPass(this.effects.fxaa.renderToScreen);
        this.composer.addPass(this.copyPass);
    }
    
    setupEffects() {
        // Bloom effect
        this.effects.bloom = new BloomEffect();
        this.effects.bloom.renderToScreen = new NinthJS.ShaderPass(this.effects.bloom.material);
        this.effects.bloom.renderToScreen.renderToScreen = true;
        
        // FXAA (Fast Approximate Anti-Aliasing)
        this.effects.fxaa = new FXAAEffect();
        this.effects.fxaa.renderToScreen = new NinthJS.ShaderPass(this.effects.fxaa.material);
        
        // Add more effects here
        this.effects.chromaticAberration = new ChromaticAberrationEffect(0.002);
        this.effects.chromaticAberration.renderToScreen = new NinthJS.ShaderPass(this.effects.chromaticAberration.material);
        
        // Add to composer (except bloom which is handled separately)
        this.composer.addPass(this.effects.chromaticAberration.renderToScreen);
    }
    
    render() {
        this.composer.render();
    }
    
    resize(width, height) {
        this.composer.setSize(width, height);
    }
    
    enableBloom(enable) {
        this.effects.bloom.renderToScreen.enabled = enable;
    }
    
    enableFXAA(enable) {
        this.effects.fxaa.renderToScreen.enabled = enable;
    }
    
    enableChromaticAberration(enable) {
        this.effects.chromaticAberration.renderToScreen.enabled = enable;
    }
}

// Additional post-processing effects
class ChromaticAberrationEffect {
    constructor(amount = 0.002) {
        this.uniforms = {
            tDiffuse: { value: null },
            amount: { value: amount }
        };
        
        this.material = new NinthJS.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                
                void main() {
                    vec2 offset = amount * vec2(1.0, 1.0);
                    
                    // Sample RGB channels with slight offsets
                    vec4 colorR = texture2D(tDiffuse, vUv + offset);
                    vec4 colorG = texture2D(tDiffuse, vUv);
                    vec4 colorB = texture2D(tDiffuse, vUv - offset);
                    
                    vec4 finalColor;
                    finalColor.r = colorR.r;
                    finalColor.g = colorG.g;
                    finalColor.b = colorB.b;
                    finalColor.a = (colorR.a + colorG.a + colorB.b) / 3.0;
                    
                    gl_FragColor = finalColor;
                }
            `
        });
    }
}
```

## Advanced Lighting Techniques

### HDR Environment Mapping

```javascript
class HDREnvironment {
    constructor(renderer) {
        this.renderer = renderer;
        this.pmremGenerator = new NinthJS.PMREMGenerator(renderer);
        this.environment = null;
    }
    
    loadHDR(url) {
        const loader = new NinthJS.RGBELoader();
        
        return new Promise((resolve, reject) => {
            loader.load(url, (hdrTexture) => {
                // Convert HDR to PMREM for better performance
                const pmrem = this.pmremGenerator.fromEquirectangular(hdrTexture);
                this.environment = pmrem.texture;
                
                // Don't dispose the original HDR texture if you need it later
                hdrTexture.dispose();
                
                resolve(this.environment);
            }, undefined, reject);
        });
    }
    
    applyToScene(scene) {
        if (this.environment) {
            scene.environment = this.environment;
            scene.background = this.environment;
        }
    }
}
```

### Advanced Material: Physical-Based Rendering

```javascript
class PBRDemo {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.scene = new NinthJS.Scene();
        this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new NinthJS.WebGLRenderer({ antialias: true });
        
        this.init();
        this.createScene();
        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = NinthJS.sRGBEncoding;
        this.renderer.toneMapping = NinthJS.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        
        document.body.appendChild(this.renderer.domElement);
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    createScene() {
        // Load HDR environment
        const hdrLoader = new NinthJS.RGBELoader();
        hdrLoader.load('path/to/environment.hdr', (hdrTexture) => {
            const pmremGenerator = new NinthJS.PMREMGenerator(this.renderer);
            const environmentMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
            
            this.scene.environment = environmentMap;
            hdrTexture.dispose();
            pmremGenerator.dispose();
        });
        
        // Create PBR materials
        this.createPBRMaterials();
        
        // Setup lighting
        this.setupLighting();
    }
    
    createPBRMaterials() {
        // Gold material
        const goldMaterial = new NinthJS.MeshPhysicalMaterial({
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        
        const goldSphere = new NinthJS.Mesh(
            new NinthJS.SphereGeometry(1, 32, 16),
            goldMaterial
        );
        goldSphere.setPosition(-3, 0, 0);
        this.scene.add(goldSphere);
        
        // Glass material
        const glassMaterial = new NinthJS.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1.0,
            thickness: 0.5,
            ior: 1.5,
            clearcoat: 1.0
        });
        
        const glassSphere = new NinthJS.Mesh(
            new NinthJS.SphereGeometry(1, 32, 16),
            glassMaterial
        );
        glassSphere.setPosition(0, 0, 0);
        this.scene.add(glassSphere);
        
        // Ceramic material
        const ceramicMaterial = new NinthJS.MeshPhysicalMaterial({
            color: 0xffaa00,
            metalness: 0,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            sheen: 1.0,
            sheenColor: 0xffddcc
        });
        
        const ceramicSphere = new NinthJS.Mesh(
            new NinthJS.SphereGeometry(1, 32, 16),
            ceramicMaterial
        );
        ceramicSphere.setPosition(3, 0, 0);
        this.scene.add(ceramicSphere);
    }
    
    setupLighting() {
        // Environment light
        const ambientLight = new NinthJS.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new NinthJS.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Area lights
        const areaLight1 = new NinthJS.RectAreaLight(0xffffff, 20, 2, 2);
        areaLight1.position.set(-5, 3, 0);
        this.scene.add(areaLight1);
        
        const areaLight2 = new NinthJS.RectAreaLight(0x4488ff, 15, 2, 2);
        areaLight2.position.set(5, 3, 0);
        areaLight2.rotation.y = Math.PI;
        this.scene.add(areaLight2);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate objects
        this.scene.children.forEach(child => {
            if (child.isMesh) {
                child.rotation.y += 0.005;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
```

## Advanced Shadows

### Cascaded Shadow Maps

```javascript
class CascadedShadowRenderer {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.cascadedShadowMap = true;
        this.shadowMapSize = 4096;
        this.cascadeCount = 4;
        this.cascadeSplits = [0.1, 0.3, 0.6, 1.0];
        this.lightFrustums = [];
        
        this.init();
    }
    
    init() {
        // Setup cascaded shadow maps
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = NinthJS.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Create shadow cameras for each cascade
        for (let i = 0; i < this.cascadeCount; i++) {
            const camera = new NinthJS.DirectionalCamera();
            camera.shadow.mapSize.width = this.shadowMapSize;
            camera.shadow.mapSize.height = this.shadowMapSize;
            camera.shadow.camera.near = 0.1;
            camera.shadow.camera.far = 100;
            
            this.lightFrustums.push(camera);
        }
    }
    
    updateShadowMaps() {
        const light = this.findMainLight();
        if (!light) return;
        
        const camera = this.camera;
        const lightDirection = light.getWorldDirection(new NinthJS.Vector3());
        const cameraPosition = camera.getWorldPosition(new NinthJS.Vector3());
        
        // Calculate shadow camera position
        const shadowCameraPosition = cameraPosition.clone()
            .add(lightDirection.clone().multiplyScalar(-50));
        
        // Update each cascade
        for (let i = 0; i < this.cascadeCount; i++) {
            const shadowCamera = this.lightFrustums[i];
            
            // Set shadow camera position and direction
            shadowCamera.position.copy(shadowCameraPosition);
            shadowCamera.lookAt(cameraPosition);
            shadowCamera.updateMatrixWorld();
            shadowCamera.updateProjectionMatrix();
            
            // Set cascade split
            if (i < this.cascadeCount - 1) {
                shadowCamera.near = this.cascadeSplits[i] * 100;
                shadowCamera.far = this.cascadeSplits[i + 1] * 100;
            }
            
            // Update camera projection
            shadowCamera.updateProjectionMatrix();
        }
    }
    
    findMainLight() {
        for (const child of this.scene.children) {
            if (child.isDirectionalLight) {
                return child;
            }
        }
        return null;
    }
}
```

## Performance Optimization

### Geometry Instancing

```javascript
class InstancedMeshDemo {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.scene = new NinthJS.Scene();
        this.camera = new NinthJS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new NinthJS.WebGLRenderer(this.canvas);
        
        this.init();
        this.createInstancedObjects();
        this.animate();
    }
    
    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor('#112233');
        
        window.addEventListener('resize', () => this.handleResize());
    }
    
    createInstancedObjects() {
        const instanceCount = 1000;
        
        // Create geometry and material
        const geometry = new NinthJS.BoxGeometry(0.1, 0.1, 0.1);
        const material = new NinthJS.PhongMaterial({ 
            color: '#4488ff',
            vertexColors: true // Enable per-instance colors
        });
        
        // Create instanced mesh
        const instancedMesh = new NinthJS.InstancedMesh(geometry, material, instanceCount);
        
        // Set per-instance transformations
        const matrix = new NinthJS.Matrix4();
        const color = new NinthJS.Color();
        const position = new NinthJS.Vector3();
        const quaternion = new NinthJS.Quaternion();
        const scale = new NinthJS.Vector3();
        
        for (let i = 0; i < instanceCount; i++) {
            // Random position in a sphere
            position.set(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );
            
            // Random rotation
            quaternion.setFromEuler(new NinthJS.Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ));
            
            // Random scale
            scale.setScalar(0.5 + Math.random() * 2);
            
            // Compose transformation matrix
            matrix.compose(position, quaternion, scale);
            instancedMesh.setMatrixAt(i, matrix);
            
            // Set per-instance color
            color.setHSL(i / instanceCount, 0.7, 0.6);
            instancedMesh.setColorAt(i, color);
        }
        
        instancedMesh.instanceMatrix.needsUpdate = true;
        
        this.scene.add(instancedMesh);
        this.instancedMesh = instancedMesh;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate instanced mesh
        if (this.instancedMesh) {
            this.instancedMesh.rotation.y += 0.001;
            this.instancedMesh.rotation.x += 0.0005;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
```

### GPU-Based Particle System

```javascript
class GPUParticleSystem {
    constructor(maxParticles = 10000) {
        this.maxParticles = maxParticles;
        this.particles = [];
        this.geometry = new NinthJS.BufferGeometry();
        this.material = new NinthJS.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: NinthJS.AdditiveBlending,
            uniforms: {
                time: { value: 0 },
                delta: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 customColor;
                attribute float customAlpha;
                
                varying vec3 vColor;
                varying float vAlpha;
                varying float vLife;
                
                uniform float time;
                uniform float delta;
                
                void main() {
                    vColor = customColor;
                    vAlpha = customAlpha;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
                    
                    gl_FragColor = vec4(vColor, alpha * vAlpha);
                }
            `
        });
        
        this.setupGeometry();
    }
    
    setupGeometry() {
        const positions = new Float32Array(this.maxParticles * 3);
        const colors = new Float32Array(this.maxParticles * 3);
        const sizes = new Float32Array(this.maxParticles);
        const alphas = new Float32Array(this.maxParticles);
        
        this.geometry.setAttribute('position', new NinthJS.BufferAttribute(positions, 3));
        this.geometry.setAttribute('customColor', new NinthJS.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new NinthJS.BufferAttribute(sizes, 1));
        this.geometry.setAttribute('customAlpha', new NinthJS.BufferAttribute(alphas, 1));
        
        this.geometry.attributes.position.setUsage(NinthJS.DynamicDrawUsage);
        this.geometry.attributes.customColor.setUsage(NinthJS.DynamicDrawUsage);
        this.geometry.attributes.size.setUsage(NinthJS.DynamicDrawUsage);
        this.geometry.attributes.customAlpha.setUsage(NinthJS.DynamicDrawUsage);
    }
    
    spawnParticle(position, velocity, color, size, life) {
        if (this.particles.length < this.maxParticles) {
            const particle = {
                position: position.clone(),
                velocity: velocity.clone(),
                color: color.clone(),
                size: size,
                life: life,
                maxLife: life,
                active: true
            };
            
            this.particles.push(particle);
        }
    }
    
    update(deltaTime) {
        this.material.uniforms.time.value = performance.now() * 0.001;
        this.material.uniforms.delta.value = deltaTime;
        
        // Update particle data
        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.customColor.array;
        const sizes = this.geometry.attributes.size.array;
        const alphas = this.geometry.attributes.customAlpha.array;
        
        let i = 0;
        let j = 0;
        
        this.particles.forEach((particle, index) => {
            if (!particle.active) return;
            
            // Update particle
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            particle.velocity.multiplyScalar(0.98); // Apply drag
            particle.life -= deltaTime;
            
            // Remove dead particles
            if (particle.life <= 0) {
                particle.active = false;
                return;
            }
            
            // Update buffer data
            positions[i] = particle.position.x;
            positions[i + 1] = particle.position.y;
            positions[i + 2] = particle.position.z;
            
            colors[j] = particle.color.r;
            colors[j + 1] = particle.color.g;
            colors[j + 2] = particle.color.b;
            
            sizes[index] = particle.size;
            alphas[index] = particle.life / particle.maxLife;
            
            i += 3;
            j += 3;
        });
        
        // Clean up inactive particles
        this.particles = this.particles.filter(p => p.active);
        
        // Mark attributes for update
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.customColor.needsUpdate = true;
        this.geometry.attributes.size.needsUpdate = true;
        this.geometry.attributes.customAlpha.needsUpdate = true;
    }
    
    addToScene(scene) {
        this.points = new NinthJS.Points(this.geometry, this.material);
        scene.add(this.points);
    }
}
```

## Advanced Rendering Techniques

### Screen Space Reflections

```javascript
class ScreenSpaceReflections {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.reflectionRenderTarget = null;
        this.reflectionMaterial = null;
        
        this.init();
    }
    
    init() {
        // Setup reflection render target
        this.reflectionRenderTarget = new NinthJS.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: NinthJS.LinearFilter,
                magFilter: NinthJS.LinearFilter,
                format: NinthJS.RGBAFormat
            }
        );
        
        // Create reflection material
        this.reflectionMaterial = new NinthJS.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: this.reflectionRenderTarget.texture },
                projectionMatrix: { value: this.camera.projectionMatrix },
                cameraMatrix: { value: this.camera.matrixWorldInverse },
                screenSize: { value: new NinthJS.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform mat4 projectionMatrix;
                uniform mat4 cameraMatrix;
                uniform vec2 screenSize;
                varying vec2 vUv;
                
                vec3 getWorldPosition(vec2 uv, float depth) {
                    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
                    vec4 view = inverse(projectionMatrix) * clip;
                    view /= view.w;
                    vec4 world = inverse(cameraMatrix) * view;
                    return world.xyz;
                }
                
                void main() {
                    // Get reflection data from render target
                    vec4 reflection = texture2D(tDiffuse, vUv);
                    
                    // Mix reflection with original
                    gl_FragColor = reflection;
                }
            `,
            transparent: true
        });
    }
    
    render() {
        // Render reflection to texture
        const originalTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.reflectionRenderTarget);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(originalTarget);
    }
}
```

### Volumetric Lighting

```javascript
class VolumetricLight {
    constructor(light, scene) {
        this.light = light;
        this.scene = scene;
        this.lightVolume = null;
        
        this.createLightVolume();
    }
    
    createLightVolume() {
        // Create volumetric cone for spotlight
        if (this.light.type === 'SpotLight') {
            const height = 10;
            const radius = Math.tan(this.light.angle) * height;
            
            const geometry = new NinthJS.CylinderGeometry(0, radius, height, 32, 1, true);
            const material = new NinthJS.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: NinthJS.AdditiveBlending,
                uniforms: {
                    lightColor: { value: this.light.color.clone() },
                    lightPosition: { value: this.light.position.clone() },
                    lightDirection: { value: new NinthJS.Vector3() },
                    cameraPosition: { value: new NinthJS.Vector3() },
                    attenuation: { value: 0.1 },
                    anglePower: { value: 2.0 }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying vec3 vWorldPosition;
                    
                    void main() {
                        vPosition = position;
                        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * viewMatrix * worldPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 lightColor;
                    uniform vec3 lightPosition;
                    uniform vec3 lightDirection;
                    uniform vec3 cameraPosition;
                    uniform float attenuation;
                    uniform float anglePower;
                    
                    varying vec3 vPosition;
                    varying vec3 vWorldPosition;
                    
                    void main() {
                        vec3 toLight = lightPosition - vWorldPosition;
                        float distance = length(toLight);
                        float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance);
                        
                        vec3 toCamera = normalize(cameraPosition - vWorldPosition);
                        vec3 toLightNormalized = normalize(toLight);
                        
                        float angle = dot(-lightDirection, toLightNormalized);
                        angle = pow(max(angle, 0.0), anglePower);
                        
                        float intensity = attenuation * angle;
                        
                        vec4 color = vec4(lightColor, intensity * 0.3);
                        gl_FragColor = color;
                    }
                `
            });
            
            this.lightVolume = new NinthJS.Mesh(geometry, material);
            this.lightVolume.position.copy(this.light.position);
            this.lightVolume.lookAt(
                this.light.position.clone().add(this.light.target.position)
            );
            this.scene.add(this.lightVolume);
        }
    }
    
    update() {
        if (this.lightVolume) {
            // Update light volume to follow light
            this.lightVolume.position.copy(this.light.position);
            
            const targetPos = this.light.target.position.clone();
            this.lightVolume.lookAt(targetPos);
            
            // Update shader uniforms
            this.lightVolume.material.uniforms.lightPosition.value.copy(this.light.position);
            this.lightVolume.material.uniforms.lightDirection.value.copy(
                targetPos.clone().sub(this.light.position).normalize()
            );
        }
    }
}
```

## Best Practices for Advanced Rendering

### 1. Performance Optimization
- Use instanced rendering for repeated objects
- Implement frustum culling and occlusion culling
- Use appropriate texture compression
- Batch draw calls when possible

### 2. Quality Guidelines
- Use HDR environments for realistic lighting
- Implement proper tone mapping and color grading
- Use physically-based materials for consistency
- Test rendering on different hardware

### 3. Shader Development
- Minimize texture lookups in shaders
- Use appropriate precision qualifiers
- Optimize branching in shaders
- Profile shader performance regularly

### 4. Memory Management
- Dispose of unused render targets and materials
- Use texture atlases to reduce memory usage
- Implement LOD systems for complex shaders
- Monitor GPU memory usage during development

## Troubleshooting Rendering Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Poor performance | Too many draw calls | Use instancing, batching |
| Blurry textures | Low resolution textures | Use appropriate texture sizes and mipmaps |
| Strange lighting | Missing normal maps | Ensure proper normal mapping setup |
| Shader errors | GLSL syntax errors | Use shader validation tools |
| Memory issues | Not disposing resources | Implement proper cleanup |

## Next Steps

With advanced rendering mastered, explore:

1. **[Performance Optimization](./performance-optimization.md)** - Optimize rendering performance
2. **[Physics Integration](./physics-integration.md)** - Visual effects for physics
3. **[Loading 3D Models](./loading-3d-models.md)** - Advanced materials for models
4. **[Animation Basics](./animation-basics.md)** - Visual effects in animations

---

**Your 3D graphics have reached professional quality! Create stunning visual experiences! 🎨**