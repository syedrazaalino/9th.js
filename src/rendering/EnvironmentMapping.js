/**
 * EnvironmentMapping.js - Advanced Environment Mapping System
 * Features real-time reflection probes, SSR, dynamic environment mapping
 * Support for multiple reflection types and performance optimization
 */

import { CubeTexture } from './CubeTexture.js';
import { EnvironmentMap } from './EnvironmentMap.js';

export class ReflectionProbe {
    constructor(gl, position, options = {}) {
        this.gl = gl;
        this.position = position; // [x, y, z]
        this.id = this.generateId();
        
        // Probe properties
        this.size = options.size || 256;
        this.cubemap = null;
        this.active = true;
        this.updateInterval = options.updateInterval || 0; // 0 = always update
        this.lastUpdate = 0;
        
        // Influence bounds
        this.influenceRadius = options.influenceRadius || 10.0;
        this.boxSize = options.boxSize || [20, 20, 20];
        this.parallaxCorrection = options.parallaxCorrection !== false;
        
        // Performance settings
        this.priority = options.priority || 1.0; // Higher = more important
        this.updateDistance = options.updateDistance || 50.0;
        this.resolution = options.resolution || 256;
        this.nearPlane = options.nearPlane || 0.1;
        this.farPlane = options.farPlane || 100.0;
        
        // Storage and filtering
        this.compression = options.compression || 'none'; // 'none', 'bc1', 'bc3'
        this.mipmap = options.mipmap !== false;
        this.maxMipLevel = options.maxMipLevel || 8;
        
        // Custom rendering callback
        this.renderCallback = options.renderCallback || null;
        
        this.init();
    }
    
    init() {
        // Create cubemap for this reflection probe
        this.cubemap = new CubeTexture(this.gl, {
            size: this.size,
            generateMipmaps: this.mipmap,
            format: this.gl.RGBA8
        });
    }
    
    generateId() {
        return 'probe_' + Math.random().toString(36).substr(2, 9);
    }
    
    setPosition(position) {
        this.position = position;
    }
    
    shouldUpdate(cameraPosition, currentTime) {
        if (!this.active) return false;
        if (this.updateInterval === 0) return true;
        
        // Check update interval
        if (currentTime - this.lastUpdate < this.updateInterval) return false;
        
        // Check distance from camera
        const distance = this.getDistance(cameraPosition);
        if (distance > this.updateDistance) return false;
        
        return true;
    }
    
    getDistance(position) {
        const dx = this.position[0] - position[0];
        const dy = this.position[1] - position[1];
        const dz = this.position[2] - position[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    needsRender(targetPosition) {
        // Check if probe needs to be rendered based on distance and priority
        const distance = this.getDistance(targetPosition);
        const maxRenderDistance = this.updateDistance * 2;
        return distance <= maxRenderDistance;
    }
    
    dispose() {
        if (this.cubemap) {
            this.cubemap.dispose();
            this.cubemap = null;
        }
    }
}

export class ScreenSpaceReflection {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.enabled = options.enabled !== false;
        this.quality = options.quality || 'medium'; // 'low', 'medium', 'high'
        
        // Performance settings
        this.maxSteps = this.getQualitySetting('maxSteps', 64);
        this.maxDistance = this.getQualitySetting('maxDistance', 10.0);
        this.stepSize = this.getQualitySetting('stepSize', 1.0);
        this.bias = this.getQualitySetting('bias', 0.01);
        
        // Resolution settings
        this.downsampleFactor = options.downsampleFactor || 1;
        this.halfResolution = options.halfResolution || false;
        
        // Thickness and smoothing
        this.thickness = options.thickness || 0.1;
        this.smoothness = options.smoothness || 0.5;
        
        // Fallback handling
        this.enableFallBack = options.enableFallBack !== false;
        this.fallbackProbe = options.fallbackProbe || null;
        
        // Shader programs
        this.ssrShader = null;
        this.combineShader = null;
        this.blurShader = null;
        
        // Render targets
        this.normalTarget = null;
        this.depthTarget = null;
        this.ssrTarget = null;
        this.tempTarget = null;
        
        // G-buffers
        this.gBuffer = {
            position: null,
            normal: null,
            albedo: null,
            roughness: null,
            metalness: null,
            depth: null
        };
        
        this.init();
    }
    
    getQualitySetting(setting, defaultValue) {
        const settings = {
            low: {
                maxSteps: 32,
                maxDistance: 5.0,
                stepSize: 2.0,
                bias: 0.02
            },
            medium: {
                maxSteps: 64,
                maxDistance: 10.0,
                stepSize: 1.0,
                bias: 0.01
            },
            high: {
                maxSteps: 128,
                maxDistance: 20.0,
                stepSize: 0.5,
                bias: 0.005
            }
        };
        
        return settings[this.quality]?.[setting] || defaultValue;
    }
    
    init() {
        if (!this.enabled) return;
        
        this.createRenderTargets();
        this.createShaderPrograms();
    }
    
    createRenderTargets() {
        const { gl } = this;
        const extensions = gl.getSupportedExtensions();
        
        // Check for required extensions
        if (!extensions.includes('WEBGL_depth_texture')) {
            console.warn('WEBGL_depth_texture not supported, SSR disabled');
            this.enabled = false;
            return;
        }
        
        // Create G-buffer targets
        for (let key in this.gBuffer) {
            if (this.gBuffer[key]) continue;
            
            this.gBuffer[key] = this.createRenderTarget({
                width: this.getWidth(),
                height: this.getHeight(),
                format: this.getFormatForBuffer(key)
            });
        }
        
        // Create SSR targets
        this.ssrTarget = this.createRenderTarget({
            width: this.getWidth(),
            height: this.getHeight(),
            format: gl.RGBA
        });
        
        this.tempTarget = this.createRenderTarget({
            width: this.getWidth(),
            height: this.getHeight(),
            format: gl.RGBA
        });
    }
    
    getWidth() {
        return this.halfResolution ? Math.floor(window.innerWidth / 2) : window.innerWidth;
    }
    
    getHeight() {
        return this.halfResolution ? Math.floor(window.innerHeight / 2) : window.innerHeight;
    }
    
    getFormatForBuffer(bufferType) {
        const { gl } = this;
        const formats = {
            position: gl.RGBA16F,
            normal: gl.RGBA8,
            albedo: gl.RGBA8,
            roughness: gl.R8,
            metalness: gl.R8,
            depth: gl.DEPTH_COMPONENT24
        };
        
        return formats[bufferType] || gl.RGBA8;
    }
    
    createRenderTarget(options) {
        const { gl } = this;
        const framebuffer = gl.createFramebuffer();
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, options.format, options.width, options.height, 0, 
                     this.getFormatType(options.format), gl.UNSIGNED_BYTE, null);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        return { framebuffer, texture, width: options.width, height: options.height };
    }
    
    createShaderPrograms() {
        // SSR ray tracing shader
        this.ssrShader = this.createSSRShader();
        
        // SSR combine shader
        this.combineShader = this.createCombineShader();
        
        // SSR blur shader
        this.blurShader = this.createBlurShader();
    }
    
    createSSRShader() {
        const vertexShader = `
            attribute vec3 position;
            attribute vec2 uv;
            
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            
            uniform sampler2D gBufferPosition;
            uniform sampler2D gBufferNormal;
            uniform sampler2D gBufferDepth;
            
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 inverseProjection;
            uniform mat4 inverseView;
            
            uniform vec2 resolution;
            uniform int maxSteps;
            uniform float maxDistance;
            uniform float stepSize;
            uniform float bias;
            uniform float thickness;
            
            varying vec2 vUv;
            
            // Reconstruct world position from depth
            vec3 getWorldPosition(vec2 uv) {
                float depth = texture2D(gBufferDepth, uv).x;
                vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
                vec4 view = inverseProjection * clip;
                view /= view.w;
                vec4 world = inverseView * view;
                return world.xyz;
            }
            
            // Reconstruct normal from normal buffer
            vec3 getNormal(vec2 uv) {
                vec3 normal = texture2D(gBufferNormal, uv).xyz;
                return normal * 2.0 - 1.0;
            }
            
            // Get view direction
            vec3 getViewDirection(vec2 uv) {
                vec3 worldPos = getWorldPosition(uv);
                vec4 viewPos = viewMatrix * vec4(worldPos, 1.0);
                return normalize(viewPos.xyz);
            }
            
            // Binary search for intersection
            float binarySearch(vec3 ro, vec3 rd, float tMin, float tMax) {
                for (int i = 0; i < 5; i++) {
                    float tMid = (tMin + tMax) * 0.5;
                    vec3 pos = ro + rd * tMid;
                    
                    // Convert to screen space
                    vec4 clip = projectionMatrix * vec4(pos, 1.0);
                    vec2 uv = clip.xy / clip.w * 0.5 + 0.5;
                    
                    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                        tMax = tMid;
                        continue;
                    }
                    
                    float depth = texture2D(gBufferDepth, uv).x;
                    float currentDepth = clip.z / clip.w;
                    
                    if (currentDepth > depth + bias) {
                        tMax = tMid;
                    } else {
                        tMin = tMid;
                    }
                }
                
                return (tMin + tMax) * 0.5;
            }
            
            void main() {
                vec3 worldPos = getWorldPosition(vUv);
                vec3 normal = getNormal(vUv);
                vec3 viewDir = getViewDirection(vUv);
                
                // Calculate reflection direction
                vec3 reflectDir = reflect(-viewDir, normal);
                
                // Ray march
                vec3 ro = worldPos + normal * bias;
                vec3 rd = normalize(reflectDir);
                
                float tMin = 0.0;
                float tMax = maxDistance;
                
                float hitT = -1.0;
                
                for (int i = 0; i < maxSteps; i++) {
                    vec3 pos = ro + rd * tMax;
                    
                    // Convert to screen space
                    vec4 clip = projectionMatrix * vec4(pos, 1.0);
                    if (clip.w <= 0.0) continue;
                    
                    vec2 uv = clip.xy / clip.w * 0.5 + 0.5;
                    
                    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                        tMax *= 0.5;
                        continue;
                    }
                    
                    float depth = texture2D(gBufferDepth, uv).x;
                    float currentDepth = clip.z / clip.w;
                    
                    if (abs(currentDepth - depth) < thickness) {
                        hitT = binarySearch(ro, rd, tMin, tMax);
                        break;
                    }
                    
                    if (currentDepth < depth) {
                        tMax = tMin + (tMax - tMin) * 0.5;
                    } else {
                        tMin = tMax;
                        tMax += stepSize;
                    }
                    
                    if (tMax > maxDistance) break;
                }
                
                if (hitT > 0.0) {
                    vec3 hitPos = ro + rd * hitT;
                    vec4 clip = projectionMatrix * vec4(hitPos, 1.0);
                    vec2 hitUv = clip.xy / clip.w * 0.5 + 0.5;
                    
                    // Sample albedo and calculate final color
                    vec3 albedo = texture2D(gBufferAlbedo, hitUv).rgb;
                    float fresnel = pow(1.0 - max(dot(normalize(normal), normalize(-viewDir)), 0.0), 5.0);
                    
                    gl_FragColor = vec4(albedo * fresnel, fresnel);
                } else {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                }
            }
        `;
        
        return this.createProgram(vertexShader, fragmentShader);
    }
    
    createCombineShader() {
        const vertexShader = `
            attribute vec3 position;
            attribute vec2 uv;
            
            varying vec2 vUv;
            
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            
            uniform sampler2D colorBuffer;
            uniform sampler2D ssrBuffer;
            uniform sampler2D normalBuffer;
            
            uniform float ssrIntensity;
            uniform float ssrThickness;
            
            varying vec2 vUv;
            
            void main() {
                vec3 color = texture2D(colorBuffer, vUv).rgb;
                vec3 ssrColor = texture2D(ssrBuffer, vUv).rgb;
                float ssrAlpha = texture2D(ssrBuffer, vUv).a;
                
                // Blend SSR with original color
                vec3 finalColor = mix(color, ssrColor, ssrAlpha * ssrIntensity);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        return this.createProgram(vertexShader, fragmentShader);
    }
    
    createProgram(vertexSource, fragmentSource) {
        const { gl } = this;
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking failed:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    renderGBuffer(scene, camera) {
        // Render scene to G-buffer for SSR
        // This would integrate with the main renderer
        console.log('Rendering G-buffer for SSR');
    }
    
    renderSSR(camera) {
        if (!this.enabled) return null;
        
        const { gl } = this;
        
        // Bind SSR target
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ssrTarget.framebuffer);
        gl.viewport(0, 0, this.ssrTarget.width, this.ssrTarget.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Use SSR shader
        gl.useProgram(this.ssrShader);
        
        // Set uniforms
        this.setSSRUniforms(camera);
        
        // Render full-screen quad
        this.renderFullScreenQuad();
        
        // Apply blur if needed
        if (this.smoothness > 0.0) {
            this.applyBlur();
        }
        
        return this.ssrTarget;
    }
    
    setSSRUniforms(camera) {
        const { gl } = this;
        
        // Set common uniforms
        gl.uniform2f(gl.getUniformLocation(this.ssrShader, 'resolution'), 
                    this.ssrTarget.width, this.ssrTarget.height);
        gl.uniform1i(gl.getUniformLocation(this.ssrShader, 'maxSteps'), this.maxSteps);
        gl.uniform1f(gl.getUniformLocation(this.ssrShader, 'maxDistance'), this.maxDistance);
        gl.uniform1f(gl.getUniformLocation(this.ssrShader, 'stepSize'), this.stepSize);
        gl.uniform1f(gl.getUniformLocation(this.ssrShader, 'bias'), this.bias);
        gl.uniform1f(gl.getUniformLocation(this.ssrShader, 'thickness'), this.thickness);
        
        // Set camera matrices
        if (camera.projectionMatrix) {
            gl.uniformMatrix4fv(gl.getUniformLocation(this.ssrShader, 'projectionMatrix'), 
                               false, camera.projectionMatrix.elements);
        }
        
        if (camera.matrixWorldInverse) {
            gl.uniformMatrix4fv(gl.getUniformLocation(this.ssrShader, 'viewMatrix'), 
                               false, camera.matrixWorldInverse.elements);
        }
    }
    
    applyBlur() {
        const { gl } = this;
        
        // Apply horizontal blur
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.tempTarget.framebuffer);
        gl.useProgram(this.blurShader);
        
        // Set blur uniforms and render
        this.renderFullScreenQuad();
        
        // Apply vertical blur
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ssrTarget.framebuffer);
        this.renderFullScreenQuad();
    }
    
    renderFullScreenQuad() {
        // Render a full-screen quad (implementation would depend on geometry system)
        console.log('Rendering full-screen quad');
    }
    
    dispose() {
        // Clean up resources
        Object.values(this.gBuffer).forEach(target => {
            if (target) {
                this.gl.deleteFramebuffer(target.framebuffer);
                this.gl.deleteTexture(target.texture);
            }
        });
        
        if (this.ssrTarget) {
            this.gl.deleteFramebuffer(this.ssrTarget.framebuffer);
            this.gl.deleteTexture(this.ssrTarget.texture);
        }
    }
}

export class EnvironmentMapping {
    constructor(gl, options = {}) {
        this.gl = gl;
        
        // Reflection probes management
        this.probes = [];
        this.activeProbes = [];
        this.probeManager = null;
        
        // Screen space reflections
        this.ssr = null;
        this.enableSSR = options.enableSSR !== false;
        
        // Environment mapping types
        this.reflectionTypes = {
            SSR: 'ssr',
            PROBE: 'probe',
            CUBEMAP: 'cubemap',
            PARALLAX: 'parallax'
        };
        
        // Performance settings
        this.maxProbes = options.maxProbes || 8;
        this.maxSSRRes = options.maxSSRRes || 512;
        this.enableCulling = options.enableCulling !== false;
        this.lodLevels = options.lodLevels || 4;
        
        // Optimization settings
        this.frustumCulling = options.frustumCulling !== false;
        this.distanceCulling = options.distanceCulling !== false;
        this.priorityCulling = options.priorityCulling !== false;
        
        this.init();
    }
    
    init() {
        // Initialize SSR
        if (this.enableSSR) {
            this.ssr = new ScreenSpaceReflection(this.gl);
        }
        
        // Initialize probe manager
        this.probeManager = new ProbeManager(this.gl, {
            maxProbes: this.maxProbes,
            maxSSRRes: this.maxSSRRes
        });
    }
    
    /**
     * Add reflection probe at position
     */
    addProbe(position, options = {}) {
        const probe = new ReflectionProbe(this.gl, position, options);
        this.probes.push(probe);
        
        // Maintain active probes list
        this.updateActiveProbes();
        
        return probe;
    }
    
    /**
     * Remove reflection probe
     */
    removeProbe(probe) {
        const index = this.probes.indexOf(probe);
        if (index !== -1) {
            probe.dispose();
            this.probes.splice(index, 1);
            this.updateActiveProbes();
        }
    }
    
    /**
     * Auto-place reflection probes based on scene analysis
     */
    autoPlaceProbes(environmentMeshes, options = {}) {
        const { maxProbes = 8, regionSize = 10.0, minDistance = 5.0 } = options;
        
        // Analyze environment mesh distribution
        const regions = this.analyzeRegions(environmentMeshes, regionSize);
        
        // Place probes in high-reflectance areas
        let probesAdded = 0;
        for (let region of regions) {
            if (probesAdded >= maxProbes) break;
            
            if (region.reflectivity > 0.3 && region.meshCount > 0) {
                const probe = this.addProbe(region.center, {
                    influenceRadius: regionSize,
                    priority: region.reflectivity,
                    updateDistance: regionSize * 2
                });
                
                probesAdded++;
            }
        }
        
        return probesAdded;
    }
    
    /**
     * Analyze scene regions for probe placement
     */
    analyzeRegions(meshes, regionSize) {
        const regions = [];
        
        if (meshes.length === 0) return regions;
        
        // Calculate scene bounds
        const bounds = this.calculateSceneBounds(meshes);
        const gridSize = Math.ceil(Math.max(
            bounds.size[0], bounds.size[1], bounds.size[2]
        ) / regionSize);
        
        // Create grid
        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                for (let z = 0; z < gridSize; z++) {
                    const region = {
                        center: [
                            bounds.min[0] + (x + 0.5) * regionSize,
                            bounds.min[1] + (y + 0.5) * regionSize,
                            bounds.min[2] + (z + 0.5) * regionSize
                        ],
                        size: [regionSize, regionSize, regionSize],
                        meshes: [],
                        meshCount: 0,
                        reflectivity: 0.0
                    };
                    
                    regions.push(region);
                }
            }
        }
        
        // Assign meshes to regions
        for (let mesh of meshes) {
            const region = this.findRegionForMesh(mesh, regions, regionSize);
            if (region) {
                region.meshes.push(mesh);
                region.meshCount++;
                
                // Calculate average reflectivity
                const meshReflectivity = this.getMeshReflectivity(mesh);
                region.reflectivity = (region.reflectivity * (region.meshCount - 1) + meshReflectivity) / region.meshCount;
            }
        }
        
        return regions.filter(region => region.meshCount > 0);
    }
    
    /**
     * Calculate scene bounds from meshes
     */
    calculateSceneBounds(meshes) {
        const bounds = {
            min: [Infinity, Infinity, Infinity],
            max: [-Infinity, -Infinity, -Infinity]
        };
        
        for (let mesh of meshes) {
            if (mesh.geometry && mesh.geometry.boundingBox) {
                const box = mesh.geometry.boundingBox;
                bounds.min[0] = Math.min(bounds.min[0], box.min.x);
                bounds.min[1] = Math.min(bounds.min[1], box.min.y);
                bounds.min[2] = Math.min(bounds.min[2], box.min.z);
                bounds.max[0] = Math.max(bounds.max[0], box.max.x);
                bounds.max[1] = Math.max(bounds.max[1], box.max.y);
                bounds.max[2] = Math.max(bounds.max[2], box.max.z);
            }
        }
        
        bounds.size = [
            bounds.max[0] - bounds.min[0],
            bounds.max[1] - bounds.min[1],
            bounds.max[2] - bounds.min[2]
        ];
        
        return bounds;
    }
    
    /**
     * Find region that contains a mesh
     */
    findRegionForMesh(mesh, regions, regionSize) {
        if (!mesh.geometry || !mesh.geometry.boundingBox) return null;
        
        const box = mesh.geometry.boundingBox;
        const center = [
            (box.min.x + box.max.x) * 0.5,
            (box.min.y + box.max.y) * 0.5,
            (box.min.z + box.max.z) * 0.5
        ];
        
        for (let region of regions) {
            if (this.isPointInRegion(center, region)) {
                return region;
            }
        }
        
        return null;
    }
    
    /**
     * Check if point is in region
     */
    isPointInRegion(point, region) {
        const center = region.center;
        const size = region.size;
        
        return (
            point[0] >= center[0] - size[0] * 0.5 &&
            point[0] < center[0] + size[0] * 0.5 &&
            point[1] >= center[1] - size[1] * 0.5 &&
            point[1] < center[1] + size[1] * 0.5 &&
            point[2] >= center[2] - size[2] * 0.5 &&
            point[2] < center[2] + size[2] * 0.5
        );
    }
    
    /**
     * Get mesh reflectivity estimate
     */
    getMeshReflectivity(mesh) {
        // Estimate reflectivity based on material properties
        if (mesh.material) {
            const mat = mesh.material;
            
            // Check for metalness and roughness
            if (mat.metalness !== undefined && mat.roughness !== undefined) {
                // Higher metalness and lower roughness = higher reflectivity
                return mat.metalness * (1.0 - mat.roughness * 0.5);
            }
            
            // Check for reflectivity property
            if (mat.reflectivity !== undefined) {
                return mat.reflectivity;
            }
        }
        
        // Default reflectivity
        return 0.1;
    }
    
    /**
     * Update active probes based on camera position and view
     */
    updateActiveProbes(camera, currentTime = 0) {
        this.activeProbes = [];
        
        // Filter probes based on distance, priority, and visibility
        for (let probe of this.probes) {
            if (probe.shouldUpdate(camera.position, currentTime)) {
                // Frustum culling
                if (this.frustumCulling && !this.isProbeInFrustum(probe, camera)) {
                    continue;
                }
                
                // Distance culling
                if (this.distanceCulling && probe.getDistance(camera.position) > probe.updateDistance) {
                    continue;
                }
                
                this.activeProbes.push(probe);
            }
        }
        
        // Sort by priority and distance
        this.activeProbes.sort((a, b) => {
            const distA = a.getDistance(camera.position);
            const distB = b.getDistance(camera.position);
            
            // Higher priority first, then closer distance
            if (Math.abs(a.priority - b.priority) > 0.1) {
                return b.priority - a.priority;
            }
            
            return distA - distB;
        });
        
        // Limit active probes
        if (this.activeProbes.length > this.maxProbes) {
            this.activeProbes = this.activeProbes.slice(0, this.maxProbes);
        }
    }
    
    /**
     * Check if probe is in camera frustum
     */
    isProbeInFrustum(probe, camera) {
        // Simplified frustum culling
        // In practice, this would use proper frustum-plane intersection
        const frustum = camera.frustum;
        if (!frustum) return true;
        
        // Check if probe center is in frustum
        const position = probe.position;
        for (let i = 0; i < frustum.planes.length; i++) {
            const plane = frustum.planes[i];
            const distance = plane.x * position[0] + plane.y * position[1] + 
                           plane.z * position[2] + plane.w;
            
            if (distance < -probe.influenceRadius) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get appropriate reflection for a surface
     */
    getReflection(surfacePosition, surfaceNormal, viewDirection, material) {
        const useSSR = this.shouldUseSSR(surfacePosition, surfaceNormal, material);
        
        if (useSSR && this.ssr) {
            return {
                type: this.reflectionTypes.SSR,
                data: null // SSR is computed on-the-fly
            };
        }
        
        // Use reflection probe
        const nearestProbe = this.findNearestProbe(surfacePosition);
        if (nearestProbe) {
            return {
                type: this.reflectionTypes.PROBE,
                data: nearestProbe.cubemap,
                probe: nearestProbe
            };
        }
        
        // Fallback to environment cubemap
        if (this.defaultEnvironment) {
            return {
                type: this.reflectionTypes.CUBEMAP,
                data: this.defaultEnvironment
            };
        }
        
        return null;
    }
    
    /**
     * Determine if SSR should be used for this surface
     */
    shouldUseSSR(position, normal, material) {
        if (!this.ssr || !this.ssr.enabled) return false;
        
        // Don't use SSR for very rough surfaces
        if (material.roughness > 0.8) return false;
        
        // Don't use SSR for non-metal surfaces with low metalness
        if (material.metalness < 0.1 && material.roughness > 0.5) return false;
        
        // Check if position is in a good area for SSR
        // (not too close to edges, within valid depth range)
        
        return true;
    }
    
    /**
     * Find nearest probe to position
     */
    findNearestProbe(position) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (let probe of this.activeProbes) {
            const distance = probe.getDistance(position);
            if (distance < probe.influenceRadius && distance < minDistance) {
                nearest = probe;
                minDistance = distance;
            }
        }
        
        return nearest;
    }
    
    /**
     * Render all active probes
     */
    renderProbes(scene, camera, currentTime = 0) {
        for (let probe of this.activeProbes) {
            if (probe.shouldUpdate(camera.position, currentTime)) {
                this.renderProbe(probe, scene, camera);
                probe.lastUpdate = currentTime;
            }
        }
    }
    
    /**
     * Render single probe
     */
    renderProbe(probe, scene, camera) {
        // Save current camera state
        const originalPosition = camera.position.slice();
        const originalRotation = camera.rotation.slice();
        
        // Render cubemap for probe
        const faces = [
            [1, 0, 0],   // +X
            [-1, 0, 0],  // -X
            [0, 1, 0],   // +Y
            [0, -1, 0],  // -Y
            [0, 0, 1],   // +Z
            [0, 0, -1]   // -Z
        ];
        
        for (let i = 0; i < 6; i++) {
            const [x, y, z] = faces[i];
            
            // Set camera to probe position and orientation
            camera.position = probe.position.slice();
            camera.lookAt(
                probe.position[0] + x,
                probe.position[1] + y,
                probe.position[2] + z
            );
            
            // Render scene to probe cubemap face
            this.renderSceneToProbeFace(scene, camera, probe, i);
        }
        
        // Restore camera state
        camera.position = originalPosition;
        camera.rotation = originalRotation;
        
        // Apply parallax correction if enabled
        if (probe.parallaxCorrection) {
            this.applyParallaxCorrection(probe);
        }
    }
    
    /**
     * Render scene to specific probe cubemap face
     */
    renderSceneToProbeFace(scene, camera, probe, faceIndex) {
        // This would integrate with the main rendering pipeline
        // For now, we'll call the render callback if provided
        
        if (probe.renderCallback) {
            probe.renderCallback(scene, camera, probe, faceIndex);
        } else {
            // Default rendering logic
            console.log(`Rendering probe ${probe.id} face ${faceIndex}`);
        }
    }
    
    /**
     * Apply parallax correction to probe cubemap
     */
    applyParallaxCorrection(probe) {
        // Parallax correction adjusts reflections to account for local vs distant environments
        // This is a complex shader-based technique
        
        console.log('Applying parallax correction to probe', probe.id);
    }
    
    /**
     * Set default environment cubemap
     */
    setDefaultEnvironment(environmentMap) {
        this.defaultEnvironment = environmentMap;
    }
    
    /**
     * Enable/disable features dynamically
     */
    setFeatureEnabled(feature, enabled) {
        switch (feature) {
            case 'ssr':
                this.enableSSR = enabled;
                if (enabled && !this.ssr) {
                    this.ssr = new ScreenSpaceReflection(this.gl);
                } else if (!enabled && this.ssr) {
                    this.ssr.dispose();
                    this.ssr = null;
                }
                break;
            
            case 'probes':
                this.probesEnabled = enabled;
                break;
            
            case 'culling':
                this.enableCulling = enabled;
                break;
        }
    }
    
    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            totalProbes: this.probes.length,
            activeProbes: this.activeProbes.length,
            ssrEnabled: !!this.ssr,
            memoryUsage: this.estimateMemoryUsage(),
            renderTime: this.estimateRenderTime()
        };
    }
    
    /**
     * Estimate memory usage
     */
    estimateMemoryUsage() {
        let total = 0;
        
        // Probe memory
        for (let probe of this.probes) {
            total += probe.size * probe.size * 6 * 4; // RGBA8 = 4 bytes per pixel
        }
        
        // SSR memory
        if (this.ssr) {
            total += this.ssrTarget?.width * this.ssrTarget?.height * 4 || 0;
        }
        
        return total;
    }
    
    /**
     * Estimate render time
     */
    estimateRenderTime() {
        let total = 0;
        
        // Probe rendering time
        total += this.activeProbes.length * 2.0; // ~2ms per probe face
        
        // SSR time
        if (this.ssr) {
            total += this.ssr.enabled ? 1.0 : 0; // ~1ms for SSR
        }
        
        return total;
    }
    
    /**
     * Dispose all resources
     */
    dispose() {
        // Dispose probes
        for (let probe of this.probes) {
            probe.dispose();
        }
        this.probes = [];
        this.activeProbes = [];
        
        // Dispose SSR
        if (this.ssr) {
            this.ssr.dispose();
            this.ssr = null;
        }
        
        // Dispose probe manager
        if (this.probeManager) {
            this.probeManager.dispose();
            this.probeManager = null;
        }
    }
}

/**
 * ProbeManager - Advanced probe management and optimization
 */
class ProbeManager {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.options = options;
        
        // Probe LOD system
        this.lodLevels = options.lodLevels || 4;
        this.lodDistances = options.lodDistances || [5, 15, 50, 150];
        this.lodResolutions = options.lodResolutions || [512, 256, 128, 64];
        
        // Probe culling and optimization
        this.enableClustering = options.enableClustering !== false;
        this.enableInstancing = options.enableInstancing !== false;
        this.enableTemporalSmoothing = options.enableTemporalSmoothing !== false;
        
        // Performance tracking
        this.renderStats = {
            totalRenders: 0,
            totalTime: 0,
            averageTime: 0
        };
    }
    
    /**
     * Create LOD-optimized probe
     */
    createLODProbe(position, cameraDistance) {
        const lodLevel = this.getLODLevel(cameraDistance);
        const resolution = this.lodResolutions[lodLevel];
        
        return new ReflectionProbe(this.gl, position, {
            size: resolution,
            updateDistance: this.lodDistances[lodLevel]
        });
    }
    
    /**
     * Get LOD level based on distance
     */
    getLODLevel(distance) {
        for (let i = this.lodDistances.length - 1; i >= 0; i--) {
            if (distance >= this.lodDistances[i]) {
                return i;
            }
        }
        return 0;
    }
    
    /**
     * Cluster nearby probes for optimization
     */
    clusterProbes(probes, threshold = 5.0) {
        const clusters = [];
        const processed = new Set();
        
        for (let probe of probes) {
            if (processed.has(probe)) continue;
            
            const cluster = {
                center: probe.position.slice(),
                probes: [probe],
                averagePosition: probe.position.slice(),
                averagePriority: probe.priority
            };
            
            processed.add(probe);
            
            // Find nearby probes
            for (let otherProbe of probes) {
                if (processed.has(otherProbe)) continue;
                
                const distance = this.getDistance(probe.position, otherProbe.position);
                if (distance < threshold) {
                    cluster.probes.push(otherProbe);
                    processed.add(otherProbe);
                    
                    // Update cluster center and average
                    this.updateClusterAverage(cluster);
                }
            }
            
            clusters.push(cluster);
        }
        
        return clusters;
    }
    
    /**
     * Update cluster average position and priority
     */
    updateClusterAverage(cluster) {
        const count = cluster.probes.length;
        
        // Calculate average position
        cluster.averagePosition = [0, 0, 0];
        for (let probe of cluster.probes) {
            cluster.averagePosition[0] += probe.position[0];
            cluster.averagePosition[1] += probe.position[1];
            cluster.averagePosition[2] += probe.position[2];
        }
        cluster.averagePosition[0] /= count;
        cluster.averagePosition[1] /= count;
        cluster.averagePosition[2] /= count;
        
        // Calculate average priority
        let totalPriority = 0;
        for (let probe of cluster.probes) {
            totalPriority += probe.priority;
        }
        cluster.averagePriority = totalPriority / count;
    }
    
    /**
     * Get distance between two positions
     */
    getDistance(pos1, pos2) {
        const dx = pos1[0] - pos2[0];
        const dy = pos1[1] - pos2[1];
        const dz = pos1[2] - pos2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Enable temporal smoothing for probe updates
     */
    enableTemporalSmoothing(probe, smoothingFactor = 0.1) {
        probe.temporalSmoothing = {
            enabled: true,
            factor: smoothingFactor,
            lastUpdate: 0,
            smoothedCubemap: null
        };
    }
    
    /**
     * Apply temporal smoothing to probe update
     */
    applyTemporalSmoothing(probe, currentCubemap, currentTime) {
        if (!probe.temporalSmoothing?.enabled) return currentCubemap;
        
        const smoothing = probe.temporalSmoothing;
        
        if (!smoothing.smoothedCubemap) {
            // First update, just store current
            smoothing.smoothedCubemap = currentCubemap;
            return currentCubemap;
        }
        
        // Blend current and smoothed cubemaps
        const alpha = smoothing.factor;
        const beta = 1.0 - alpha;
        
        // This would be a proper cubemap blending operation
        // For now, we'll just return the current cubemap
        console.log('Applying temporal smoothing to probe', probe.id);
        
        return currentCubemap;
    }
    
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return {
            ...this.renderStats,
            lodLevels: this.lodLevels,
            averageLODLevel: this.calculateAverageLOD()
        };
    }
    
    /**
     * Calculate average LOD level
     */
    calculateAverageLOD() {
        // Implementation would track current LOD levels of active probes
        return 0;
    }
    
    /**
     * Dispose all resources
     */
    dispose() {
        // Clean up probe manager resources
        console.log('Disposing ProbeManager');
    }
}

export default EnvironmentMapping;
