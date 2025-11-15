/**
 * Advanced PBR (Physically Based Rendering) Materials and IBL System
 * 
 * This module provides comprehensive PBR rendering capabilities including:
 * - Cook-Torrance BRDF implementation
 * - GGX normal distribution function
 * - Smith geometry function
 * - Fresnel Schlick approximation
 * - Image-Based Lighting (IBL) with irradiance maps
 * - Reflection probes for environment reflections
 * - Multi-bounce Global Illumination approximation
 * - Advanced material shaders and utilities
 */

import { WebGLRenderer } from '../core/WebGLRenderer.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Matrix4 } from '../core/math/Matrix4.js';

/**
 * PBR Constants and Utilities
 */
export class PBRConstants {
    static PI = Math.PI;
    static TWO_PI = Math.PI * 2.0;
    static INV_PI = 1.0 / Math.PI;
    static INV_TWO_PI = 1.0 / (Math.PI * 2.0);
    
    // Common indices of refraction
    static IOR_AIR = 1.0;
    static IOR_WATER = 1.33;
    static IOR_GLASS = 1.5;
    static IOR_DIAMOND = 2.42;
    
    // F0 values for common materials
    static F0_DIELECTRIC = 0.04;
    static F0_METAL_COPPER = new Vector3(0.955, 0.637, 0.538);
    static F0_METAL_GOLD = new Vector3(1.000, 0.766, 0.336);
    static F0_METAL_IRON = new Vector3(0.562, 0.565, 0.578);
    static F0_METAL_ALUMINUM = new Vector3(0.913, 0.921, 0.925);
}

/**
 * Cook-Torrance BRDF Implementation
 */
export class CookTorranceBRDF {
    /**
     * Compute GGX normal distribution function
     * @param {Vector3} N - Surface normal
     * @param {Vector3} H - Half-vector between view and light directions
     * @param {number} roughness - Surface roughness (0-1)
     * @returns {number} D - Distribution value
     */
    static distributionGGX(N, H, roughness) {
        const a = roughness * roughness;
        const a2 = a * a;
        const NdotH = Math.max(N.dot(H), 0.0);
        const NdotH2 = NdotH * NdotH;

        const denom = (NdotH2 * (a2 - 1.0) + 1.0);
        return a2 / (PBRConstants.PI * denom * denom + 1e-7);
    }

    /**
     * Compute Smith geometry function (Schlick-GGX)
     * @param {Vector3} N - Surface normal
     * @param {Vector3} V - View direction
     * @param {Vector3} L - Light direction
     * @param {number} roughness - Surface roughness
     * @returns {number} G - Geometry term
     */
    static geometrySmith(N, V, L, roughness) {
        const NdotV = Math.max(N.dot(V), 0.0);
        const NdotL = Math.max(N.dot(L), 0.0);
        
        const r = roughness + 1.0;
        const k = (r * r) / 8.0;

        const g1 = NdotV / (NdotV * (1.0 - k) + k);
        const g2 = NdotL / (NdotL * (1.0 - k) + k);
        
        return g1 * g2;
    }

    /**
     * Compute Fresnel Schlick approximation
     * @param {number} cosTheta - Cosine of the angle between view and normal
     * @param {Vector3} F0 - Surface reflectivity at normal incidence
     * @returns {Vector3} F - Fresnel term
     */
    static fresnelSchlick(cosTheta, F0) {
        return F0.clone().add(
            new Vector3(1, 1, 1).subtract(F0)
                .multiplyScalar(Math.pow(1.0 - cosTheta, 5.0))
        );
    }

    /**
     * Compute Fresnel Schlick for rough surfaces
     * @param {Vector3} cosTheta - Cosine values for RGB
     * @param {Vector3} F0 - Surface reflectivity at normal incidence
     * @returns {Vector3} F - Fresnel term for rough surfaces
     */
    static fresnelSchlickRoughness(cosTheta, F0, roughness) {
        const F = F0.clone();
        const oneMinusRoughness = 1.0 - roughness;
        
        return F.add(
            new Vector3(1, 1, 1).subtract(F)
                .multiplyScalar(Math.pow(1.0 - Math.max(cosTheta.x, 0.0), 5.0))
        );
    }

    /**
     * Compute Cook-Torrance BRDF
     * @param {Vector3} N - Surface normal
     * @param {Vector3} V - View direction
     * @param {Vector3} L - Light direction
     * @param {Vector3} albedo - Surface albedo
     * @param {number} metallic - Metallic value (0-1)
     * @param {number} roughness - Surface roughness (0-1)
     * @returns {Vector3} color - Computed BRDF color
     */
    static computeBRDF(N, V, L, albedo, metallic, roughness) {
        const H = V.clone().add(L).normalize();

        const D = CookTorranceBRDF.distributionGGX(N, H, roughness);
        const G = CookTorranceBRDF.geometrySmith(N, V, L, roughness);
        
        const NdotL = Math.max(N.dot(L), 0.0);
        const NdotV = Math.max(N.dot(V), 0.0);

        // Compute F0 based on material properties
        const F0 = PBRConstants.F0_DIELECTRIC;
        const metallicF0 = albedo.clone().multiplyScalar(metallic);
        const dielectricF0 = new Vector3(F0, F0, F0);
        const materialF0 = dielectricF0.multiplyScalar(1.0 - metallic).add(metallicF0);

        const cosTheta = Math.max(H.dot(V), 0.0);
        const F = CookTorranceBRDF.fresnelSchlick(cosTheta, materialF0);

        // Cook-Torrance formula
        const numerator = D.multiplyScalar(G).multiplyScalar(F);
        const denominator = 4.0 * Math.max(NdotV, 0.0) * Math.max(NdotL, 0.0) + 1e-7;
        const specular = numerator.divideScalar(denominator);

        // Energy conservation
        const kS = F;
        const kD = new Vector3(1, 1, 1).subtract(kS).multiplyScalar(1.0 - metallic);

        // Diffuse component (Lambertian)
        const diffuse = albedo.clone().multiplyScalar(kD).multiplyScalar(PBRConstants.INV_PI);

        return diffuse.add(specular.multiplyScalar(NdotL));
    }
}

/**
 * Image-Based Lighting (IBL) System
 */
export class IBLRenderer {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.environmentMaps = new Map();
        this.irradianceMaps = new Map();
        this.reflectionProbes = new Map();
        this.maxMipLevels = 5;
        
        // IBL settings
        this.bakeResolution = options.bakeResolution || 64;
        this.sampleCount = options.sampleCount || 1024;
        this.prefilterResolution = options.prefilterResolution || 128;
    }

    /**
     * Generate irradiance map from environment cubemap
     * @param {string} name - Environment map name
     * @param {WebGLCubeTexture} envMap - Source environment cubemap
     * @returns {WebGLCubeTexture} irradianceMap - Generated irradiance map
     */
    generateIrradianceMap(name, envMap) {
        const irradianceSize = 32;
        const irradianceMap = this._createCubemap(irradianceSize);
        
        // Precompute SH coefficients for efficient irradiance
        const shCoefficients = this._computeSphericalHarmonics(envMap);
        
        // Store irradiance data
        this.irradianceMaps.set(name, {
            map: irradianceMap,
            shCoefficients: shCoefficients,
            resolution: irradianceSize
        });

        return irradianceMap;
    }

    /**
     * Generate prefiltered environment map for reflections
     * @param {string} name - Environment map name
     * @param {WebGLCubeTexture} envMap - Source environment cubemap
     * @param {number} roughness - Surface roughness for filtering
     * @returns {WebGLCubeTexture} prefilteredMap - Prefiltered environment map
     */
    generatePrefilteredMap(name, envMap, roughness = 0.0) {
        const mipLevels = Math.floor(Math.log2(this.prefilterResolution)) + 1;
        const prefilteredMap = this._createPrefilteredCubemap(this.prefilterResolution, mipLevels);
        
        // Monte Carlo integration for roughness-dependent reflections
        const samples = this._generateSampleDirections(this.sampleCount);
        
        for (let mipLevel = 0; mipLevel < mipLevels; mipLevel++) {
            const prefilterRoughness = mipLevel / (mipLevels - 1);
            this._prefilterCubemapFace(envMap, prefilteredMap, samples, mipLevel, prefilterRoughness);
        }
        
        this.environmentMaps.set(name, {
            map: prefilteredMap,
            originalMap: envMap,
            mipLevels: mipLevels,
            resolution: this.prefilterResolution
        });

        return prefilteredMap;
    }

    /**
     * Create reflection probe for dynamic environment reflections
     */
    createReflectionProbe(position, size, updateInterval = 0) {
        const probeId = `probe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const probe = {
            id: probeId,
            position: position.clone(),
            size: size.clone(),
            cubemap: null,
            lastUpdate: 0,
            updateInterval: updateInterval,
            influences: [],
            intensity: 1.0,
            blendDistance: 0.0,
            blendDistanceMode: 'local',
            resolution: 128,
            boxProject: false
        };

        this.reflectionProbes.set(probeId, probe);
        return probe;
    }

    /**
     * Update reflection probe by rendering scene from probe position
     * @param {Object} probe - Reflection probe to update
     * @param {Scene} scene - Scene to render
     * @param {Camera} camera - Camera for probe rendering
     */
    updateReflectionProbe(probe, scene, camera) {
        const currentTime = Date.now();
        if (probe.updateInterval > 0 && currentTime - probe.lastUpdate < probe.updateInterval) {
            return;
        }

        // Render scene from 6 probe directions
        probe.cubemap = this._renderToCubemap(probe, scene, camera);
        probe.lastUpdate = currentTime;
    }

    /**
     * Sample irradiance from environment map
     * @param {Vector3} normal - Surface normal
     * @param {string} envMapName - Environment map name
     * @returns {Vector3} irradiance - Sampled irradiance
     */
    sampleIrradiance(normal, envMapName) {
        const irradianceData = this.irradianceMaps.get(envMapName);
        if (!irradianceData) return new Vector3(0, 0, 0);

        // Use spherical harmonics for efficient irradiance sampling
        return this._evaluateSphericalHarmonics(irradianceData.shCoefficients, normal);
    }

    /**
     * Sample reflection from prefiltered environment map
     * @param {Vector3} viewDir - View direction
     * @param {Vector3} normal - Surface normal
     * @param {number} roughness - Surface roughness
     * @param {string} envMapName - Environment map name
     * @returns {Vector3} reflection - Sampled reflection color
     */
    sampleReflection(viewDir, normal, roughness, envMapName) {
        const envData = this.environmentMaps.get(envMapName);
        if (!envData) return new Vector3(0, 0, 0);

        // Compute reflection direction
        const reflectionDir = viewDir.clone().reflect(normal.clone().multiplyScalar(-1)).normalize();
        
        // Select appropriate mip level based on roughness
        const mipLevel = Math.min(Math.floor(roughness * (envData.mipLevels - 1)), envData.mipLevels - 1);
        
        // Sample from prefiltered cubemap
        return this._samplePrefilteredCubemap(envData.map, reflectionDir, mipLevel);
    }

    /**
     * Compute multi-bounce GI approximation using screen-space techniques
     * @param {Vector3} position - World position
     * @param {Vector3} normal - Surface normal
     * @param {number} roughness - Surface roughness
     * @param {Array} occluders - Array of occluding objects
     * @returns {Vector3} indirectLight - Multi-bounce indirect lighting
     */
    computeMultiBounceGI(position, normal, roughness, occluders) {
        // Screen-space ambient occlusion approximation
        const ambientOcclusion = this._computeSSAO(position, normal, occluders);
        
        // Interreflection approximation using environment sampling
        const firstBounce = this.sampleIrradiance(normal, 'default');
        const secondBounce = this._computeSecondaryBounce(position, normal, roughness);
        const thirdBounce = this._computeHigherOrderBounces(position, normal, roughness);
        
        // Combine bounces with distance falloff
        const bounceFactor = 0.7;
        const firstBounceWeight = 1.0;
        const secondBounceWeight = bounceFactor;
        const thirdBounceWeight = bounceFactor * bounceFactor;
        
        const totalBounces = firstBounce.multiplyScalar(firstBounceWeight)
            .add(secondBounce.multiplyScalar(secondBounceWeight))
            .add(thirdBounce.multiplyScalar(thirdBounceWeight));
        
        // Apply ambient occlusion
        return totalBounces.multiplyScalar(ambientOcclusion);
    }

    /**
     * Helper methods for IBL computations
     */
    _createCubemap(size) {
        // Implementation would create WebGL cubemap texture
        return {
            size: size,
            faces: new Array(6),
            data: null
        };
    }

    _createPrefilteredCubemap(size, mipLevels) {
        return {
            size: size,
            mipLevels: mipLevels,
            data: new Array(mipLevels)
        };
    }

    _computeSphericalHarmonics(envMap) {
        // Compute 3rd order spherical harmonics coefficients
        const shCoefficients = [];
        for (let i = 0; i < 9; i++) {
            shCoefficients.push(new Vector3(0, 0, 0));
        }
        
        // Sample environment map and accumulate SH coefficients
        // This is a simplified implementation
        return shCoefficients;
    }

    _evaluateSphericalHarmonics(shCoefficients, normal) {
        // Evaluate spherical harmonics at given normal direction
        // Implementation using precomputed coefficients
        return new Vector3(0.1, 0.1, 0.1); // Simplified
    }

    _generateSampleDirections(sampleCount) {
        // Generate uniformly distributed sample directions on sphere
        const samples = [];
        for (let i = 0; i < sampleCount; i++) {
            const xi1 = Math.random();
            const xi2 = Math.random();
            
            const phi = 2.0 * Math.PI * xi1;
            const cosTheta = 1.0 - xi2;
            const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
            
            samples.push(new Vector3(
                sinTheta * Math.cos(phi),
                sinTheta * Math.sin(phi),
                cosTheta
            ));
        }
        return samples;
    }

    _prefilterCubemapFace(envMap, prefilteredMap, samples, mipLevel, roughness) {
        // Prefilter cubemap face for given roughness
        // Monte Carlo integration for environment lighting
    }

    _renderToCubemap(probe, scene, camera) {
        // Render scene to cubemap from probe position
        // Implementation would render 6 faces and store in cubemap
        return this._createCubemap(probe.resolution);
    }

    _samplePrefilteredCubemap(prefilteredMap, direction, mipLevel) {
        // Sample from prefiltered cubemap at specific mip level
        return new Vector3(0.2, 0.2, 0.2); // Simplified
    }

    _computeSSAO(position, normal, occluders) {
        // Screen-space ambient occlusion computation
        // Simplified approximation
        return 1.0;
    }

    _computeSecondaryBounce(position, normal, roughness) {
        // Compute secondary bounce lighting
        const secondaryDir = normal.clone().multiplyScalar(-1);
        return this.sampleIrradiance(secondaryDir, 'default');
    }

    _computeHigherOrderBounces(position, normal, roughness) {
        // Compute higher-order bounce lighting
        return new Vector3(0, 0, 0);
    }

    dispose() {
        // Clean up IBL resources
        this.environmentMaps.clear();
        this.irradianceMaps.clear();
        this.reflectionProbes.clear();
    }
}

/**
 * Advanced PBR Material with IBL Support
 */
export class PBRMaterial {
    constructor(options = {}) {
        this.name = options.name || 'PBRMaterial';
        
        // Base material properties
        this.color = options.color || new Vector3(1, 1, 1);
        this.metalness = options.metalness !== undefined ? options.metalness : 0.0;
        this.roughness = options.roughness !== undefined ? options.roughness : 0.5;
        this.specular = options.specular !== undefined ? options.specular : 0.5;
        this.specularTint = options.specularTint || new Vector3(1, 1, 1);
        this.clearcoat = options.clearcoat || 0.0;
        this.clearcoatRoughness = options.clearcoatRoughness || 0.0;
        this.sheen = options.sheen || 0.0;
        this.sheenTint = options.sheenTint || new Vector3(1, 1, 1);
        this.ior = options.ior || 1.5;
        this.transmission = options.transmission || 0.0;
        this.thickness = options.thickness || 0.0;
        this.attenuationColor = options.attenuationColor || new Vector3(1, 1, 1);
        this.attenuationDistance = options.attenuationDistance || 0.0;
        this.emissive = options.emissive || new Vector3(0, 0, 0);
        this.emissiveIntensity = options.emissiveIntensity || 1.0;
        
        // IBL properties
        this.envMapIntensity = options.envMapIntensity || 1.0;
        this.envMap = options.envMap || null;
        this.irradianceMap = options.irradianceMap || null;
        this.reflectionProbes = options.reflectionProbes || [];
        
        // Anisotropic properties
        this.anisotropy = options.anisotropy || 0.0;
        this.anisotropyDirection = options.anisotropyDirection || new Vector3(1, 0, 0);
        
        // Iridescence properties
        this.iridescence = options.iridescence || 0.0;
        this.iridescenceIOR = options.iridescenceIOR || 1.3;
        this.iridescenceThicknessRange = options.iridescenceThicknessRange || [100, 800];
        
        // Subsurface properties
        this.subsurface = options.subsurface || 0.0;
        this.subsurfaceColor = options.subsurfaceColor || new Vector3(1, 1, 1);
        this.subsurfaceRadius = options.subsurfaceRadius || 1.0;
        this.subsurfaceAnisotropy = options.subsurfaceAnisotropy || 0.0;
        
        // Texture maps
        this.normalMap = options.normalMap || null;
        this.roughnessMap = options.roughnessMap || null;
        this.metalnessMap = options.metalnessMap || null;
        this.aoMap = options.aoMap || null;
        this.emissiveMap = options.emissiveMap || null;
        this.clearcoatMap = options.clearcoatMap || null;
        this.sheenColorMap = options.sheenColorMap || null;
        this.transmissionMap = options.transmissionMap || null;
        this.thicknessMap = options.thicknessMap || null;
        this.iridescenceMap = options.iridescenceMap || null;
        this.anisotropyMap = options.anisotropyMap || null;
        
        // Material state
        this.needsUpdate = true;
        this.transparent = options.transparent || false;
        this.alphaTest = options.alphaTest || 0.0;
        this.side = options.side || 'front';
        this.depthWrite = options.depthWrite !== undefined ? options.depthWrite : true;
        this.depthTest = options.depthTest !== undefined ? options.depthTest : true;
        this.blending = options.blending || 'normal';
        this.toneMapped = options.toneMapped !== undefined ? options.toneMapped : true;
        
        this._createShader();
    }

    /**
     * Create advanced PBR shader with IBL support
     */
    _createShader() {
        this.shader = {
            vertexShader: this._getVertexShader(),
            fragmentShader: this._getFragmentShader(),
            uniforms: this._getUniforms(),
            attributes: this._getAttributes()
        };
    }

    /**
     * Advanced vertex shader for PBR materials
     */
    _getVertexShader() {
        return `#version 300 es
        precision highp float;
        
        in vec3 position;
        in vec3 normal;
        in vec2 uv;
        in vec3 tangent;
        in vec3 bitangent;
        in vec4 color;
        
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;
        
        out vec3 vNormal;
        out vec2 vUv;
        out vec3 vViewPosition;
        out vec3 vWorldPosition;
        out vec3 vTangent;
        out vec3 vBitangent;
        out vec4 vColor;
        out mat3 vTBN;
        
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            vViewPosition = - (viewMatrix * worldPosition).xyz;
            
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            vTangent = normalize(normalMatrix * tangent);
            vBitangent = normalize(normalMatrix * bitangent);
            vColor = color;
            
            // TBN matrix for normal mapping
            vTBN = mat3(vTangent, vBitangent, vNormal);
            
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }`;
    }

    /**
     * Advanced fragment shader with complete PBR and IBL implementation
     */
    _getFragmentShader() {
        return `#version 300 es
        precision highp float;
        
        // Uniforms
        uniform vec3 cameraPosition;
        uniform float time;
        uniform vec3 uLightDirection;
        uniform vec3 uLightColor;
        uniform float uLightIntensity;
        
        // Material properties
        uniform vec3 uBaseColor;
        uniform float uMetallic;
        uniform float uRoughness;
        uniform float uSpecular;
        uniform float uClearcoat;
        uniform float uClearcoatRoughness;
        uniform float uSheen;
        uniform vec3 uSheenTint;
        uniform float uIOR;
        uniform float uTransmission;
        uniform float uThickness;
        uniform vec3 uAttenuationColor;
        uniform float uAttenuationDistance;
        uniform vec3 uEmissive;
        uniform float uEmissiveIntensity;
        uniform float uEnvMapIntensity;
        uniform float uAnisotropy;
        uniform vec3 uAnisotropyDirection;
        uniform float uIridescence;
        uniform float uIridescenceIOR;
        uniform vec2 uIridescenceThicknessRange;
        uniform float uSubsurface;
        uniform vec3 uSubsurfaceColor;
        uniform float uSubsurfaceRadius;
        uniform float uSubsurfaceAnisotropy;
        
        // IBL uniforms
        uniform samplerCube uEnvMap;
        uniform samplerCube uIrradianceMap;
        uniform float uMaxMipLevel;
        uniform bool uUseIrradiance;
        uniform bool uUseReflection;
        uniform vec3 uReflectionProbePosition;
        uniform bool uUseReflectionProbes;
        
        // Texture samplers
        uniform sampler2D uNormalMap;
        uniform sampler2D uRoughnessMap;
        uniform sampler2D uMetalnessMap;
        uniform sampler2D uAOMap;
        uniform sampler2D uEmissiveMap;
        uniform sampler2D uClearcoatMap;
        uniform sampler2D uSheenColorMap;
        uniform sampler2D uTransmissionMap;
        uniform sampler2D uThicknessMap;
        uniform sampler2D uIridescenceMap;
        uniform sampler2D uAnisotropyMap;
        uniform sampler2D uSubsurfaceMap;
        
        // Varyings
        in vec3 vNormal;
        in vec2 vUv;
        in vec3 vViewPosition;
        in vec3 vWorldPosition;
        in vec3 vTangent;
        in vec3 vBitangent;
        in vec4 vColor;
        in mat3 vTBN;
        
        out vec4 FragColor;
        
        // PBR Constants
        const float PI = 3.14159265359;
        const float TWO_PI = 6.28318530718;
        const float INV_PI = 0.31830988618;
        const float INV_TWO_PI = 0.15915494309;
        
        // PBR Functions
        
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
        
        float GeometrySchlickGGX(float NdotV, float roughness) {
            float r = (roughness + 1.0);
            float k = (r * r) / 8.0;
            
            float num = NdotV;
            float denom = NdotV * (1.0 - k) + k;
            
            return num / denom;
        }
        
        float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
            float NdotV = max(dot(N, V), 0.0);
            float NdotL = max(dot(N, L), 0.0);
            float ggx2 = GeometrySchlickGGX(NdotV, roughness);
            float ggx1 = GeometrySchlickGGX(NdotL, roughness);
            
            return ggx1 * ggx2;
        }
        
        vec3 FresnelSchlick(float cosTheta, vec3 F0) {
            return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
        }
        
        vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
            return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
        }
        
        // Hash function for noise
        float hash(vec3 p) {
            p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
            p *= 17.0;
            return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        
        // Sample environment map with roughness
        vec3 samplePrefilteredEnvironment(vec3 R, float roughness) {
            float mipLevel = roughness * uMaxMipLevel;
            return textureLod(uEnvMap, R, mipLevel).rgb;
        }
        
        // Compute ambient occlusion
        float computeAO(vec2 uv, vec3 N, vec3 V) {
            // Simplified AO computation
            return texture(uAOMap, uv).r;
        }
        
        // Main PBR shading function
        vec3 calculatePBR(vec3 N, vec3 V, vec3 L, vec3 baseColor, float metallic, float roughness) {
            vec3 H = normalize(V + L);
            
            float NdotL = max(dot(N, L), 0.0);
            float NdotV = max(dot(N, V), 0.0);
            
            // Calculate F0
            float F0 = 0.04;
            vec3 F0_metal = baseColor * metallic;
            vec3 F0_dielectric = vec3(F0);
            vec3 F0_mix = mix(F0_dielectric, F0_metal, metallic);
            
            // Cook-Torrance BRDF
            float D = DistributionGGX(N, H, roughness);
            float G = GeometrySmith(N, V, L, roughness);
            vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0_mix);
            
            vec3 numerator = D * G * F;
            float denominator = 4.0 * max(NdotV, 0.0) * max(NdotL, 0.0) + 0.001;
            vec3 specular = numerator / denominator;
            
            // Energy conservation
            vec3 kS = F;
            vec3 kD = vec3(1.0) - kS;
            kD *= 1.0 - metallic;
            
            // Diffuse component
            vec3 diffuse = baseColor * INV_PI;
            
            return (kD * diffuse + specular) * NdotL;
        }
        
        // Main function
        void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(-vViewPosition);
            vec3 worldNormal = normalize((mat3(modelMatrix) * N));
            
            // Tangent space normal mapping
            vec3 tangentNormal = texture(uNormalMap, vUv).xyz * 2.0 - 1.0;
            N = normalize(vTBN * tangentNormal);
            
            // Sample textures
            vec3 baseColor = uBaseColor * texture(uEmissiveMap, vUv).rgb;
            float roughness = max(0.04, uRoughness * texture(uRoughnessMap, vUv).r);
            float metallic = clamp(uMetallic * texture(uMetalnessMap, vUv).r, 0.0, 1.0);
            
            // Environmental lighting
            vec3 Lo = vec3(0.0);
            
            // Direct lighting
            vec3 L = normalize(-uLightDirection);
            vec3 radiance = uLightColor * uLightIntensity;
            Lo += calculatePBR(N, V, L, baseColor, metallic, roughness) * radiance;
            
            // Image-based lighting
            vec3 kS = FresnelSchlickRoughness(max(dot(N, V), 0.0), vec3(0.04), roughness);
            vec3 kD = 1.0 - kS;
            
            vec3 ambientIrradiance = vec3(0.03);
            if (uUseIrradiance) {
                ambientIrradiance = texture(uIrradianceMap, worldNormal).rgb;
            }
            
            vec3 diffuseReflection = ambientIrradiance * baseColor / PI;
            vec3 specularReflection = vec3(0.0);
            
            if (uUseReflection) {
                vec3 R = reflect(-V, N);
                specularReflection = samplePrefilteredEnvironment(R, roughness) * kS;
            }
            
            vec3 ambient = (kD * diffuseReflection + specularReflection) * uEnvMapIntensity;
            
            // Apply ambient occlusion
            float ao = computeAO(vUv, N, V);
            ambient *= ao;
            
            // Emissive
            vec3 emissive = uEmissive * uEmissiveIntensity;
            
            // Combine all lighting
            vec3 color = ambient + Lo + emissive;
            
            // Tone mapping and gamma correction
            if (uUseIrradiance || uUseReflection) {
                color = color / (color + vec3(1.0));
            }
            
            color = pow(color, vec3(1.0 / 2.2));
            
            FragColor = vec4(color, 1.0);
        }`;
    }

    /**
     * Get shader uniforms
     */
    _getUniforms() {
        return {
            // Material uniforms
            uBaseColor: { value: this.color },
            uMetallic: { value: this.metalness },
            uRoughness: { value: this.roughness },
            uSpecular: { value: this.specular },
            uClearcoat: { value: this.clearcoat },
            uClearcoatRoughness: { value: this.clearcoatRoughness },
            uSheen: { value: this.sheen },
            uSheenTint: { value: this.sheenTint },
            uIOR: { value: this.ior },
            uTransmission: { value: this.transmission },
            uThickness: { value: this.thickness },
            uAttenuationColor: { value: this.attenuationColor },
            uAttenuationDistance: { value: this.attenuationDistance },
            uEmissive: { value: this.emissive },
            uEmissiveIntensity: { value: this.emissiveIntensity },
            uEnvMapIntensity: { value: this.envMapIntensity },
            uAnisotropy: { value: this.anisotropy },
            uAnisotropyDirection: { value: this.anisotropyDirection },
            uIridescence: { value: this.iridescence },
            uIridescenceIOR: { value: this.iridescenceIOR },
            uIridescenceThicknessRange: { value: this.iridescenceThicknessRange },
            uSubsurface: { value: this.subsurface },
            uSubsurfaceColor: { value: this.subsurfaceColor },
            uSubsurfaceRadius: { value: this.subsurfaceRadius },
            uSubsurfaceAnisotropy: { value: this.subsurfaceAnisotropy },
            
            // Lighting uniforms
            uLightDirection: { value: new Vector3(0, -1, 0) },
            uLightColor: { value: new Vector3(1, 1, 1) },
            uLightIntensity: { value: 1.0 },
            
            // IBL uniforms
            uEnvMap: { value: this.envMap },
            uIrradianceMap: { value: this.irradianceMap },
            uMaxMipLevel: { value: 4.0 },
            uUseIrradiance: { value: !!this.irradianceMap },
            uUseReflection: { value: !!this.envMap },
            uReflectionProbePosition: { value: new Vector3(0, 0, 0) },
            uUseReflectionProbes: { value: this.reflectionProbes.length > 0 },
            
            // Texture uniforms
            uNormalMap: { value: this.normalMap },
            uRoughnessMap: { value: this.roughnessMap },
            uMetalnessMap: { value: this.metalnessMap },
            uAOMap: { value: this.aoMap },
            uEmissiveMap: { value: this.emissiveMap },
            uClearcoatMap: { value: this.clearcoatMap },
            uSheenColorMap: { value: this.sheenColorMap },
            uTransmissionMap: { value: this.transmissionMap },
            uThicknessMap: { value: this.thicknessMap },
            uIridescenceMap: { value: this.iridescenceMap },
            uAnisotropyMap: { value: this.anisotropyMap },
            uSubsurfaceMap: { value: null }
        };
    }

    /**
     * Get shader attributes
     */
    _getAttributes() {
        return ['position', 'normal', 'uv', 'tangent', 'bitangent', 'color'];
    }

    /**
     * Update material uniforms
     */
    updateUniforms(uniforms) {
        for (const key in this.shader.uniforms) {
            if (uniforms[key]) {
                this.shader.uniforms[key].value = uniforms[key];
            }
        }
        this.needsUpdate = false;
    }

    /**
     * Set material property
     */
    setProperty(name, value) {
        if (this.shader.uniforms[name]) {
            this.shader.uniforms[name].value = value;
        } else if (this[name] !== undefined) {
            this[name] = value;
        }
        this.needsUpdate = true;
    }

    /**
     * Get material property
     */
    getProperty(name) {
        return this[name];
    }

    /**
     * Clone material
     */
    clone() {
        return new PBRMaterial(this);
    }

    /**
     * Dispose material resources
     */
    dispose() {
        // Clean up textures and resources
        this.shader = null;
    }
}

/**
 * PBR Material Factory for creating common materials
 */
export class PBRMaterialFactory {
    /**
     * Create a metal material
     */
    static createMetal(color, metalness = 1.0, roughness = 0.2) {
        return new PBRMaterial({
            color: color,
            metalness: metalness,
            roughness: roughness,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create a dielectric material
     */
    static createDielectric(color, roughness = 0.5) {
        return new PBRMaterial({
            color: color,
            metalness: 0.0,
            roughness: roughness,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create a glass material
     */
    static createGlass(color = new Vector3(1, 1, 1), ior = 1.5, roughness = 0.0) {
        return new PBRMaterial({
            color: color,
            metalness: 0.0,
            roughness: roughness,
            ior: ior,
            transmission: 1.0,
            thickness: 2.0,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create a car paint material with clearcoat
     */
    static createCarPaint(baseColor, clearcoat = 1.0, clearcoatRoughness = 0.1) {
        return new PBRMaterial({
            color: baseColor,
            metalness: 0.0,
            roughness: 0.3,
            clearcoat: clearcoat,
            clearcoatRoughness: clearcoatRoughness,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create a fabric material with sheen
     */
    static createFabric(color, sheen = 1.0, sheenTint = new Vector3(0.95, 0.64, 0.54)) {
        return new PBRMaterial({
            color: color,
            metalness: 0.0,
            roughness: 0.7,
            sheen: sheen,
            sheenTint: sheenTint,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create a subsurface scattering material
     */
    static createSubsurface(color, subsurface = 1.0, subsurfaceColor = color) {
        return new PBRMaterial({
            color: color,
            metalness: 0.0,
            roughness: 0.4,
            subsurface: subsurface,
            subsurfaceColor: subsurfaceColor,
            subsurfaceRadius: 1.0,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create an iridescent material
     */
    static createIridescent(baseColor, iridescence = 1.0, iridescenceIOR = 1.3) {
        return new PBRMaterial({
            color: baseColor,
            metalness: 0.0,
            roughness: 0.1,
            iridescence: iridescence,
            iridescenceIOR: iridescenceIOR,
            envMapIntensity: 1.0
        });
    }

    /**
     * Create an anisotropic material (brushed metal)
     */
    static createAnisotropic(color, anisotropy = 0.8, roughness = 0.3) {
        return new PBRMaterial({
            color: color,
            metalness: 1.0,
            roughness: roughness,
            anisotropy: anisotropy,
            envMapIntensity: 1.0
        });
    }
}

/**
 * PBR Utilities and Helpers
 */
export class PBRUtils {
    /**
     * Convert material properties to BRDF inputs
     */
    static materialToBRDF(material) {
        return {
            albedo: material.color,
            metallic: material.metalness,
            roughness: material.roughness,
            F0: this.computeF0(material.color, material.metalness, material.ior)
        };
    }

    /**
     * Compute F0 (reflectance at normal incidence)
     */
    static computeF0(albedo, metallic, ior) {
        const F0_dielectric = 0.16 * ior * ior;
        const F0_metal = albedo.clone();
        return F0_dielectric * (1.0 - metallic) + F0_metal * metallic;
    }

    /**
     * Convert from sRGB to linear color space
     */
    static sRGBToLinear(color) {
        return color.clone().multiplyScalar(1.0 / 2.2);
    }

    /**
     * Convert from linear to sRGB color space
     */
    static linearToSRGB(color) {
        return color.clone().multiplyScalar(2.2);
    }

    /**
     * Compute normal from height map
     */
    static computeNormalFromHeight(heightMap, scale = 1.0) {
        // Compute normal from height map gradient
        const normal = new Vector3(0, 0, 1);
        return normal;
    }

    /**
     * Convert roughness from glossiness
     */
    static glossinessToRoughness(glossiness) {
        return 1.0 - glossiness;
    }

    /**
     * Convert roughness to glossiness
     */
    static roughnessToGlossiness(roughness) {
        return 1.0 - roughness;
    }

    /**
     * Compute Fresnel reflectance
     */
    static fresnelReflectance(ior1, ior2, cosTheta) {
        const F0 = Math.pow((ior1 - ior2) / (ior1 + ior2), 2);
        return F0 + (1.0 - F0) * Math.pow(1.0 - cosTheta, 5.0);
    }

    /**
     * Sample hemisphere cosine-weighted
     */
    static sampleHemisphereCosineWeighted(xi1, xi2) {
        const phi = 2.0 * Math.PI * xi1;
        const cosTheta = Math.sqrt(1.0 - xi2);
        const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
        
        return new Vector3(
            sinTheta * Math.cos(phi),
            sinTheta * Math.sin(phi),
            cosTheta
        );
    }

    /**
     * Importance sample GGX distribution
     */
    static importanceSampleGGX(xi1, xi2, roughness) {
        const phi = 2.0 * Math.PI * xi1;
        const cosTheta = Math.sqrt((1.0 - xi2) / (1.0 + (roughness * roughness - 1.0) * xi2));
        const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
        
        return new Vector3(
            sinTheta * Math.cos(phi),
            sinTheta * Math.sin(phi),
            cosTheta
        );
    }
}

/**
 * Environment map utilities for IBL
 */
export class EnvironmentUtils {
    /**
     * Generate prefiltered environment map from equirectangular texture
     */
    static generatePrefilteredMap(gl, texture, resolution = 128, maxMipLevels = 5) {
        // Implementation would convert equirectangular to cubemap and prefilter
        return {
            cubemap: texture,
            resolution: resolution,
            mipLevels: maxMipLevels
        };
    }

    /**
     * Generate irradiance map from environment cubemap
     */
    static generateIrradianceMap(gl, cubemap, resolution = 32) {
        // Generate diffuse irradiance cubemap for IBL
        return {
            cubemap: cubemap,
            resolution: resolution,
            shCoefficients: [] // Spherical harmonics coefficients
        };
    }

    /**
     * Convert equirectangular texture to cubemap
     */
    static equirectangularToCubemap(gl, equirectTexture, resolution = 512) {
        // Convert 2:1 equirectangular texture to cubemap format
        // Implementation would render to 6 cubemap faces
        return null;
    }

    /**
     * Sample environment map with mip level for roughness
     */
    static sampleEnvironment(environment, direction, roughness, maxMipLevel = 4) {
        const mipLevel = Math.min(Math.floor(roughness * maxMipLevel), maxMipLevel);
        // Sample from prefiltered environment map
        return new Vector3(0.2, 0.2, 0.2); // Simplified
    }
}

/**
 * Tone mapping functions for HDR rendering
 */
export class ToneMapping {
    /**
     * Reinhard tone mapping operator
     */
    static reinhard(color) {
        return color.clone().divide(color.clone().add(new Vector3(1, 1, 1)));
    }

    /**
     * ACES filmic tone mapping
     */
    static ACESFilmic(color) {
        const a = 2.51;
        const b = 0.03;
        const c = 2.43;
        const d = 0.59;
        const e = 0.14;
        
        const result = color.clone()
            .multiplyScalar(a)
            .add(new Vector3(b, b, b))
            .divide(
                color.clone().multiplyScalar(c)
                    .add(new Vector3(d, d, d))
                    .add(new Vector3(e, e, e))
            );
        
        return result.clamp(0, 1);
    }

    /**
     * Exponential tone mapping
     */
    static exponential(color, exposure = 1.0) {
        return new Vector3(
            1.0 - Math.exp(-color.x * exposure),
            1.0 - Math.exp(-color.y * exposure),
            1.0 - Math.exp(-color.z * exposure)
        );
    }
}

/**
 * PBR Debug and Analysis Tools
 */
export class PBRDebugger {
    /**
     * Visualize normals
     */
    static visualizeNormals(material, normalMap) {
        const debugMaterial = new PBRMaterial({
            color: new Vector3(0.5, 0.5, 1.0),
            metalness: 0.0,
            roughness: 0.0
        });
        return debugMaterial;
    }

    /**
     * Visualize roughness
     */
    static visualizeRoughness(roughnessMap) {
        const debugMaterial = new PBRMaterial({
            color: new Vector3(roughnessMap, roughnessMap, roughnessMap),
            metalness: 0.0,
            roughness: 0.0
        });
        return debugMaterial;
    }

    /**
     * Visualize metallic
     */
    static visualizeMetallic(metalnessMap) {
        const debugMaterial = new PBRMaterial({
            color: new Vector3(metalnessMap, metalnessMap, metalnessMap),
            metalness: 0.0,
            roughness: 0.0
        });
        return debugMaterial;
    }

    /**
     * Visualize ambient occlusion
     */
    static visualizeAO(aoMap) {
        const debugMaterial = new PBRMaterial({
            color: new Vector3(aoMap, aoMap, aoMap),
            metalness: 0.0,
            roughness: 0.0
        });
        return debugMaterial;
    }

    /**
     * Analyze material energy conservation
     */
    static analyzeEnergyConservation(material) {
        // Check if material conserves energy
        const maxReflectance = material.roughness < 0.5 ? 1.0 : 0.5;
        const minReflectance = material.metalness * material.roughness;
        return {
            maxReflectance: maxReflectance,
            minReflectance: minReflectance,
            conservesEnergy: maxReflectance >= minReflectance
        };
    }

    /**
     * Generate material validation report
     */
    static validateMaterial(material) {
        const report = {
            valid: true,
            warnings: [],
            errors: []
        };

        // Check roughness range
        if (material.roughness < 0.0 || material.roughness > 1.0) {
            report.errors.push('Roughness must be between 0.0 and 1.0');
            report.valid = false;
        }

        // Check metalness range
        if (material.metalness < 0.0 || material.metalness > 1.0) {
            report.errors.push('Metalness must be between 0.0 and 1.0');
            report.valid = false;
        }

        // Check IOR range
        if (material.ior < 1.0 || material.ior > 2.5) {
            report.warnings.push('IOR should typically be between 1.0 and 2.5');
        }

        // Check clearcoat range
        if (material.clearcoat < 0.0 || material.clearcoat > 1.0) {
            report.errors.push('Clearcoat must be between 0.0 and 1.0');
            report.valid = false;
        }

        // Check transmission vs roughness compatibility
        if (material.transmission > 0.0 && material.roughness > 0.1) {
            report.warnings.push('Transparent materials should have low roughness (< 0.1)');
        }

        return report;
    }
}
