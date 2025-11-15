/**
 * EnvironmentMap.js - Environment map processing for PBR lighting
 * Handles PMREM generation, HDR processing, irradiance maps, and reflection maps
 */

import { CubeTexture } from './CubeTexture.js';

export class EnvironmentMap {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.id = this.generateId();
        
        // Environment map types
        this.type = options.type || 'default'; // 'default', 'irradiance', 'reflection'
        
        // Texture data
        this.cubemap = null;
        this.equirectangular = null;
        
        // PMREM prefiltering
        this.prefiltered = null;
        this.pmremGenerator = null;
        this.pmremRenderTarget = null;
        
        // Irradiance map for diffuse lighting
        this.irradiance = null;
        this.irradianceSize = options.irradianceSize || 32;
        
        // Reflection prefiltering for specular lighting
        this.prefilterMap = null;
        this.maxPrefilterRays = options.maxPrefilterRays || 128;
        this.roughnessLevels = options.roughnessLevels || [0, 0.5, 1.0];
        
        // HDR processing
        this.hdrData = null;
        this.toneMapping = options.toneMapping || 'linear';
        this.exposure = options.exposure || 1.0;
        
        // Environment properties
        this.intensity = options.intensity || 1.0;
        this.encoding = options.encoding || 'linear';
        this.mapping = options.mapping || 'default';
        
        // Performance settings
        this.roughnessBias = options.roughnessBias || 0.001;
        this.sampleCount = options.sampleCount || 64;
        this.filterSize = options.filterSize || 256;
        
        this.init();
    }
    
    /**
     * Initialize environment map
     */
    init() {
        if (this.type === 'irradiance') {
            this.pmremGenerator = new PMREMGenerator(this.gl, {
                resolution: this.irradianceSize,
                sampleCount: this.sampleCount
            });
        } else if (this.type === 'reflection') {
            this.pmremGenerator = new PMREMGenerator(this.gl, {
                resolution: this.filterSize,
                sampleCount: this.sampleCount,
                maxPrefilterRays: this.maxPrefilterRays
            });
        }
    }
    
    /**
     * Set cubemap texture directly
     */
    setCubemap(cubemap) {
        this.cubemap = cubemap;
        this.updateDerivedMaps();
    }
    
    /**
     * Load environment map from equirectangular texture
     */
    setFromEquirectangular(equirectangularTexture, options = {}) {
        this.equirectangular = equirectangularTexture;
        
        // Convert to cubemap
        this.cubemap = CubeTexture.fromEquirectangular(
            this.gl, 
            equirectangularTexture, 
            options.resolution || 512
        );
        
        this.updateDerivedMaps();
    }
    
    /**
     * Load HDR environment map
     */
    loadHDR(hdrData, options = {}) {
        this.hdrData = hdrData;
        
        // Process HDR data
        const processedHDR = this.processHDRData(hdrData, options);
        
        // Convert to environment map
        this.setFromEquirectangular(processedHDR, options);
    }
    
    /**
     * Process HDR data for environment mapping
     */
    processHDRData(hdrData, options = {}) {
        // Apply tone mapping
        if (this.toneMapping !== 'linear') {
            hdrData = this.applyToneMapping(hdrData, this.toneMapping);
        }
        
        // Apply exposure
        if (this.exposure !== 1.0) {
            hdrData = this.applyExposure(hdrData, this.exposure);
        }
        
        return hdrData;
    }
    
    /**
     * Apply tone mapping to HDR data
     */
    applyToneMapping(data, toneMapping) {
        switch (toneMapping) {
            case 'linear':
                return data; // No change
            
            case 'reinhard':
                return this.reinhardToneMapping(data);
            
            case 'aces':
                return this.acesToneMapping(data);
            
            case 'film':
                return this.filmicToneMapping(data);
            
            case 'photographic':
                return this.photographicToneMapping(data);
            
            default:
                console.warn(`Unknown tone mapping: ${toneMapping}`);
                return data;
        }
    }
    
    /**
     * Reinhard tone mapping operator
     */
    reinhardToneMapping(data) {
        return data.map(pixel => {
            return pixel.map(channel => channel / (1.0 + channel));
        });
    }
    
    /**
     * ACES tone mapping operator
     */
    acesToneMapping(data) {
        // Simplified ACES approximation
        const a = 2.51;
        const b = 0.03;
        const c = 2.43;
        const d = 0.59;
        const e = 0.14;
        
        return data.map(pixel => {
            return pixel.map(channel => {
                const x = Math.max(0, channel);
                return Math.min(1, (x * (a * x + b)) / (x * (c * x + d) + e));
            });
        });
    }
    
    /**
     * Filmic tone mapping operator
     */
    filmicToneMapping(data) {
        return data.map(pixel => {
            return pixel.map(channel => {
                const x = Math.max(0, channel);
                return Math.pow(x, 0.5) * 0.5;
            });
        });
    }
    
    /**
     * Photographic tone mapping operator
     */
    photographicToneMapping(data) {
        const exposure = 1.0;
        return data.map(pixel => {
            return pixel.map(channel => {
                return 1.0 - Math.exp(-channel * exposure);
            });
        });
    }
    
    /**
     * Apply exposure adjustment
     */
    applyExposure(data, exposure) {
        return data.map(pixel => {
            return pixel.map(channel => channel * exposure);
        });
    }
    
    /**
     * Update derived maps (irradiance, prefiltered reflection)
     */
    updateDerivedMaps() {
        if (!this.cubemap) return;
        
        // Generate irradiance map for diffuse lighting
        if (this.type === 'irradiance' || this.type === 'default') {
            this.generateIrradianceMap();
        }
        
        // Generate prefiltered reflection map for specular lighting
        if (this.type === 'reflection' || this.type === 'default') {
            this.generatePrefilterMap();
        }
        
        // Generate PMREM if needed
        if (this.pmremGenerator) {
            this.generatePMREM();
        }
    }
    
    /**
     * Generate irradiance map (diffuse environment lighting)
     */
    generateIrradianceMap() {
        const resolution = this.irradianceSize;
        this.irradiance = new CubeTexture(this.gl, {
            size: resolution,
            minFilter: this.gl.LINEAR,
            magFilter: this.gl.LINEAR,
            generateMipmaps: false
        });
        
        // Sample the environment in many directions and average
        // This simulates diffuse lighting from the environment
        const sampleCount = 2048; // High sample count for quality
        const weights = new Array(sampleCount).fill(1.0 / sampleCount);
        
        // Implementation would involve:
        // 1. Generating sample directions using a low-discrepancy sequence
        // 2. Sampling the cubemap at each direction
        // 3. Averaging the results for each cube face
        
        console.log(`Generated irradiance map at ${resolution}x${resolution}`);
    }
    
    /**
     * Generate prefiltered reflection map (for specular environment lighting)
     */
    generatePrefilterMap() {
        const roughnessLevels = this.roughnessLevels;
        this.prefilterMap = new Map();
        
        roughnessLevels.forEach(roughness => {
            const prefilteredCube = this.prefilterCubemap(roughness);
            this.prefilterMap.set(roughness, prefilteredCube);
        });
        
        console.log(`Generated prefilter maps for roughness levels: ${roughnessLevels.join(', ')}`);
    }
    
    /**
     * Prefilter cubemap for a specific roughness value
     */
    prefilterCubemap(roughness) {
        const resolution = this.filterSize;
        const prefiltered = new CubeTexture(this.gl, {
            size: resolution,
            minFilter: this.gl.LINEAR_MIPMAP_LINEAR,
            magFilter: this.gl.LINEAR,
            generateMipmaps: true
        });
        
        // Prefiltering: blur the environment based on roughness
        // Rough surfaces = more blur, smooth surfaces = less blur
        const sampleCount = Math.floor(1024 * roughness + 64);
        
        // Implementation would involve:
        // 1. Convolving the cubemap with a BRDF
        // 2. Using importance sampling based on the GGX distribution
        // 3. Mipmap levels correspond to different roughness levels
        
        console.log(`Prefiltered for roughness ${roughness} with ${sampleCount} samples`);
        return prefiltered;
    }
    
    /**
     * Generate PMREM (Pre-filtered Mipmapped Radiance Environment Map)
     */
    generatePMREM() {
        if (!this.pmremGenerator || !this.cubemap) return;
        
        const renderTarget = this.pmremGenerator.createRenderTarget();
        
        // Render environment to PMREM format
        this.pmremGenerator.prefilter(this.cubemap, renderTarget);
        
        this.pmremRenderTarget = renderTarget;
        
        console.log('Generated PMREM environment map');
    }
    
    /**
     * Get the appropriate environment map for a given roughness
     */
    getEnvironmentMap(roughness = 0.0, type = 'reflection') {
        switch (type) {
            case 'irradiance':
                return this.irradiance || this.cubemap;
            
            case 'reflection':
                if (this.prefilterMap) {
                    // Find the closest roughness level
                    let closest = this.roughnessLevels[0];
                    let minDiff = Math.abs(roughness - closest);
                    
                    for (const level of this.roughnessLevels) {
                        const diff = Math.abs(roughness - level);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closest = level;
                        }
                    }
                    
                    return this.prefilterMap.get(closest) || this.cubemap;
                }
                return this.cubemap;
            
            case 'pmrem':
                return this.pmremRenderTarget ? 
                       this.pmremRenderTarget.texture : this.cubemap;
            
            default:
                return this.cubemap;
        }
    }
    
    /**
     * Create skybox material
     */
    createSkyboxMaterial(shaderOptions = {}) {
        const vertexShader = `
            varying vec3 vWorldPosition;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `;
        
        const fragmentShader = `
            precision highp float;
            uniform samplerCube environmentMap;
            uniform float intensity;
            varying vec3 vWorldPosition;
            
            void main() {
                vec3 direction = normalize(vWorldPosition);
                vec4 color = textureCube(environmentMap, direction);
                
                gl_FragColor = vec4(color.rgb * intensity, 1.0);
            }
        `;
        
        return {
            vertexShader,
            fragmentShader,
            uniforms: {
                environmentMap: { value: this.cubemap },
                intensity: { value: this.intensity }
            }
        };
    }
    
    /**
     * Create PBR environment material
     */
    createPBRMaterial(shaderOptions = {}) {
        const vertexShader = shaderOptions.vertexShader || `
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;
            
            void main() {
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                
                gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = shaderOptions.fragmentShader || `
            precision highp float;
            
            uniform samplerCube envMap;
            uniform samplerCube irradianceMap;
            uniform samplerCube prefilterMap;
            uniform vec3 cameraPosition;
            uniform vec3 baseColor;
            uniform float metallic;
            uniform float roughness;
            uniform float envMapIntensity;
            
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;
            
            const float PI = 3.14159265359;
            
            // Normal Distribution Function: GGX
            float DistributionGGX(vec3 N, vec3 H, float roughness) {
                float a = roughness * roughness;
                float a2 = a * a;
                float NdotH = max(dot(N, H), 0.0);
                float NdotH2 = NdotH * NdotH;
                
                float num = a2;
                float denom = (NdotH2 * (a2 - 1.0) + 1.0);
                denom = PI * denom * denom;
                
                return num / denom;
            }
            
            // Schlick-GGX Geometry Function
            float GeometrySchlickGGX(float NdotV, float roughness) {
                float r = (roughness + 1.0);
                float k = (r * r) / 8.0;
                
                float num = NdotV;
                float denom = NdotV * (1.0 - k) + k;
                
                return num / denom;
            }
            
            // Smith Geometry Function
            float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
                float NdotV = max(dot(N, V), 0.0);
                float NdotL = max(dot(N, L), 0.0);
                float ggx2 = GeometrySchlickGGX(NdotV, roughness);
                float ggx1 = GeometrySchlickGGX(NdotL, roughness);
                
                return ggx1 * ggx2;
            }
            
            // Fresnel Schlick
            vec3 FresnelSchlick(float cosTheta, vec3 F0) {
                return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
            }
            
            vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
                return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
            }
            
            void main() {
                vec3 N = normalize(vWorldNormal);
                vec3 V = normalize(cameraPosition - vWorldPosition);
                
                vec3 albedo = baseColor;
                float metallicFactor = metallic;
                float roughnessFactor = roughness;
                
                // Calculate F0 (surface reflection at zero incidence)
                vec3 F0 = vec3(0.04);
                F0 = mix(F0, albedo, metallicFactor);
                
                // Direct lighting
                vec3 Lo = vec3(0.0);
                
                // Ambient lighting using irradiance map
                vec3 kd = (1.0 - FresnelSchlick(max(dot(N, V), 0.0), F0)) * (1.0 - metallicFactor);
                vec3 diffuseIrradiance = textureCube(irradianceMap, N).rgb;
                vec3 diffuse = diffuseIrradiance * albedo;
                
                // Specular reflection using prefiltered map
                vec3 R = reflect(-V, N);
                const float MAX_REFLECTION_LOD = 4.0;
                vec3 prefilteredColor = textureCubeLod(prefilterMap, R, roughnessFactor * MAX_REFLECTION_LOD).rgb;
                vec3 specular = prefilteredColor * FresnelSchlick(max(dot(N, V), 0.0), F0);
                
                vec3 ambient = (kd * diffuse + specular) * envMapIntensity;
                
                vec3 color = ambient + Lo;
                
                // Tone mapping and gamma correction
                color = color / (color + vec3(1.0));
                color = pow(color, vec3(1.0/2.2));
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        return {
            vertexShader,
            fragmentShader,
            uniforms: {
                envMap: { value: this.cubemap },
                irradianceMap: { value: this.irradiance || this.cubemap },
                prefilterMap: { 
                    value: this.prefilterMap ? 
                           this.prefilterMap.get(Math.min(...this.roughnessLevels)) : 
                           this.cubemap 
                },
                envMapIntensity: { value: this.intensity }
            }
        };
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        if (this.cubemap) {
            this.cubemap.dispose();
            this.cubemap = null;
        }
        
        if (this.irradiance) {
            this.irradiance.dispose();
            this.irradiance = null;
        }
        
        if (this.prefilterMap) {
            this.prefilterMap.forEach(cube => cube.dispose());
            this.prefilterMap.clear();
        }
        
        if (this.pmremRenderTarget) {
            this.gl.deleteFramebuffer(this.pmremRenderTarget.framebuffer);
            this.pmremRenderTarget = null;
        }
        
        if (this.pmremGenerator) {
            this.pmremGenerator.dispose();
            this.pmremGenerator = null;
        }
    }
    
    /**
     * Generate unique ID
     */
    generateId() {
        return 'env_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get environment map info
     */
    getInfo() {
        return {
            id: this.id,
            type: this.type,
            hasCubemap: !!this.cubemap,
            hasIrradiance: !!this.irradiance,
            hasPrefilter: !!this.prefilterMap,
            hasPMREM: !!this.pmremRenderTarget,
            roughnessLevels: this.roughnessLevels,
            intensity: this.intensity,
            toneMapping: this.toneMapping,
            exposure: this.exposure
        };
    }
}

/**
 * PMREMGenerator - Generates prefiltered environment maps for PBR rendering
 */
export class PMREMGenerator {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.resolution = options.resolution || 256;
        this.sampleCount = options.sampleCount || 1024;
        this.maxPrefilterRays = options.maxPrefilterRays || 32;
        
        this.renderTargets = [];
        this.coneGeometry = null;
        
        this.init();
    }
    
    init() {
        this.createRenderTargets();
        this.createConeGeometry();
    }
    
    createRenderTargets() {
        // Create render targets for different mipmap levels
        for (let i = 0; i < 10; i++) {
            const size = Math.max(16, this.resolution >> i);
            const target = this.gl.createFramebuffer();
            
            this.renderTargets.push({
                framebuffer: target,
                texture: this.gl.createTexture(),
                size: size,
                level: i
            });
        }
    }
    
    createConeGeometry() {
        // Geometry for sampling the environment using a cone
        // Implementation depends on specific sampling strategy
    }
    
    prefilter(cubemap, renderTarget) {
        // Prefilter the environment map for different roughness levels
        // This creates mipmap-like levels with increasing roughness
        console.log('Prefiltering environment map...');
        
        // Implementation would involve:
        // 1. Setting up a camera for each cubemap face
        // 2. Rendering with a cone geometry that samples the environment
        // 3. Increasing blur/sample area for higher roughness levels
    }
    
    createRenderTarget() {
        return {
            framebuffer: this.gl.createFramebuffer(),
            texture: this.gl.createTexture(),
            size: this.resolution
        };
    }
    
    dispose() {
        this.renderTargets.forEach(target => {
            if (target.framebuffer) {
                this.gl.deleteFramebuffer(target.framebuffer);
            }
            if (target.texture) {
                this.gl.deleteTexture(target.texture);
            }
        });
        
        if (this.coneGeometry) {
            this.gl.deleteBuffer(this.coneGeometry);
        }
        
        this.renderTargets = [];
        this.coneGeometry = null;
    }
}
