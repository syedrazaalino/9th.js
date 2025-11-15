/**
 * Comprehensive Shadow Mapping System
 * Implements shadow maps, shadow generators for different light types,
 * cascade shadow mapping, shadow filtering, and shadow material system
 */

import { Matrix4 } from '../core/math/Matrix4.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Vector4 } from '../core/math/Vector4.js';
import { Color } from '../core/math/Color.js';

/**
 * Shadow filtering types
 */
export const ShadowFilterType = {
    NONE: 'none',
    PCF_2x2: 'pcf_2x2',
    PCF_3x3: 'pcf_3x3',
    PCF_4x4: 'pcf_4x4',
    PCF_8x8: 'pcf_8x8',
    VSM: 'vsm',
    VSM_GAUSSIAN: 'vsm_gaussian',
    BLSM: 'blsm'
};

/**
 * Shadow map types
 */
export const ShadowMapType = {
    BASIC: 'basic',
    CASCADE: 'cascade',
    OMNIDIRECTIONAL: 'omnidirectional'
};

/**
 * Shadow quality presets
 */
export const ShadowQuality = {
    LOW: {
        mapSize: 512,
        bias: 0.005,
        normalBias: 0.0,
        filterType: ShadowFilterType.PCF_2x2,
        cascadeCount: 1
    },
    MEDIUM: {
        mapSize: 1024,
        bias: 0.003,
        normalBias: 0.5,
        filterType: ShadowFilterType.PCF_3x3,
        cascadeCount: 2
    },
    HIGH: {
        mapSize: 2048,
        bias: 0.001,
        normalBias: 1.0,
        filterType: ShadowFilterType.PCF_4x4,
        cascadeCount: 3
    },
    ULTRA: {
        mapSize: 4096,
        bias: 0.0005,
        normalBias: 1.5,
        filterType: ShadowFilterType.PCF_8x8,
        cascadeCount: 4
    }
};

/**
 * Shadow Map class for managing shadow map textures and framebuffers
 */
export class ShadowMap {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.type = options.type || ShadowMapType.BASIC;
        this.size = options.size || 1024;
        this.format = options.format || gl.DEPTH_COMPONENT;
        this.internalFormat = options.internalFormat || gl.DEPTH_COMPONENT16;
        this.type = options.type || gl.UNSIGNED_SHORT;
        
        // Framebuffer and textures
        this.framebuffer = null;
        this.depthTexture = null;
        this.colorTexture = null;
        
        // Cascade shadow mapping
        this.cascadeCount = options.cascadeCount || 1;
        this.cascadeSplits = [];
        this.cascadeFrustums = [];
        
        // Shadow camera
        this.camera = {
            projectionMatrix: new Matrix4(),
            viewMatrix: new Matrix4(),
            position: new Vector3(),
            target: new Vector3(),
            up: new Vector3(0, 1, 0),
            near: 0.1,
            far: 100.0,
            left: -10,
            right: 10,
            top: 10,
            bottom: -10
        };
        
        this.initialized = false;
        this.needsUpdate = true;
        
        this.init();
    }
    
    /**
     * Initialize shadow map resources
     */
    init() {
        if (this.initialized) return;
        
        const gl = this.gl;
        
        // Create framebuffer
        this.framebuffer = gl.createFramebuffer();
        if (!this.framebuffer) {
            throw new Error('Failed to create shadow framebuffer');
        }
        
        // Create depth texture
        this.depthTexture = this.createDepthTexture();
        
        // Create color texture for VSM (optional)
        if (this.supportsColorTexture()) {
            this.colorTexture = this.createColorTexture();
        }
        
        this.setupFramebuffer();
        this.setupCascades();
        
        this.initialized = true;
        this.needsUpdate = true;
        
        console.log(`ShadowMap initialized: ${this.type}, size: ${this.size}x${this.size}`);
    }
    
    /**
     * Create depth texture
     */
    createDepthTexture() {
        const gl = this.gl;
        const depthTexture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.texImage2D(
            gl.TEXTURE_2D, 0, 
            gl.DEPTH_COMPONENT, 
            this.size, this.size, 0,
            gl.DEPTH_COMPONENT, 
            gl.UNSIGNED_SHORT, 
            null
        );
        
        return depthTexture;
    }
    
    /**
     * Create color texture for VSM
     */
    createColorTexture() {
        const gl = this.gl;
        const colorTexture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.texImage2D(
            gl.TEXTURE_2D, 0, 
            gl.RGBA, 
            this.size, this.size, 0,
            gl.RGBA, 
            gl.UNSIGNED_BYTE, 
            null
        );
        
        return colorTexture;
    }
    
    /**
     * Check if color texture is supported
     */
    supportsColorTexture() {
        const gl = this.gl;
        return gl.getExtension('WEBGL_depth_texture') !== null;
    }
    
    /**
     * Setup framebuffer attachments
     */
    setupFramebuffer() {
        const gl = this.gl;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        // Attach depth texture
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, 
            gl.DEPTH_ATTACHMENT, 
            gl.TEXTURE_2D, 
            this.depthTexture, 
            0
        );
        
        // Attach color texture if available
        if (this.colorTexture) {
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, 
                gl.COLOR_ATTACHMENT0, 
                gl.TEXTURE_2D, 
                this.colorTexture, 
                0
            );
        }
        
        // Check framebuffer status
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error(`Shadow framebuffer incomplete: ${status}`);
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    /**
     * Setup cascade shadow mapping
     */
    setupCascades() {
        this.cascadeSplits = [];
        this.cascadeFrustums = [];
        
        for (let i = 0; i < this.cascadeCount; i++) {
            this.cascadeSplits.push((i + 1) / this.cascadeCount);
            this.cascadeFrustums.push({
                projectionMatrix: new Matrix4(),
                viewMatrix: new Matrix4(),
                frustum: {
                    left: -10,
                    right: 10,
                    top: 10,
                    bottom: -10,
                    near: 0.1,
                    far: 100.0
                }
            });
        }
    }
    
    /**
     * Bind shadow map for rendering
     */
    bind(cascadeIndex = 0) {
        const gl = this.gl;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.size, this.size);
        
        // Clear depth buffer
        gl.clear(gl.DEPTH_BUFFER_BIT);
        
        return this.framebuffer;
    }
    
    /**
     * Unbind shadow map
     */
    unbind() {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    /**
     * Update shadow camera
     */
    updateCamera(position, target, options = {}) {
        this.camera.position.copy(position);
        this.camera.target.copy(target);
        
        if (options.up) this.camera.up.copy(options.up);
        if (options.near !== undefined) this.camera.near = options.near;
        if (options.far !== undefined) this.camera.far = options.far;
        if (options.left !== undefined) this.camera.left = options.left;
        if (options.right !== undefined) this.camera.right = options.right;
        if (options.top !== undefined) this.camera.top = options.top;
        if (options.bottom !== undefined) this.camera.bottom = options.bottom;
        
        // Update view matrix
        this.camera.viewMatrix.makeLookAt(
            this.camera.position, 
            this.camera.target, 
            this.camera.up
        );
        
        // Update projection matrix
        if (options.orthographic) {
            this.camera.projectionMatrix.makeOrthographic(
                this.camera.left, this.camera.right,
                this.camera.top, this.camera.bottom,
                this.camera.near, this.camera.far
            );
        } else {
            this.camera.projectionMatrix.makePerspective(
                options.fov || Math.PI / 4,
                options.aspect || 1.0,
                this.camera.near, this.camera.far
            );
        }
        
        this.needsUpdate = true;
    }
    
    /**
     * Calculate cascade splits for directional light
     */
    calculateCascadeSplits(camera, nearClip, farClip, lambda = 0.5) {
        const cascades = [];
        const clipRange = farClip - nearClip;
        const ratio = farClip / nearClip;
        
        for (let i = 0; i < this.cascadeCount; i++) {
            const p = (i + 1) / this.cascadeCount;
            const log = nearClip * Math.pow(ratio, p);
            const uniform = nearClip + clipRange * p;
            const d = lambda * log + (1.0 - lambda) * uniform;
            cascades.push(d / farClip);
        }
        
        this.cascadeSplits = cascades;
        return cascades;
    }
    
    /**
     * Get shadow map matrix for shader
     */
    getShadowMatrix(cascadeIndex = 0) {
        const lightVP = new Matrix4();
        lightVP.multiplyMatrices(this.camera.projectionMatrix, this.camera.viewMatrix);
        return lightVP;
    }
    
    /**
     * Get texture for binding
     */
    getTexture() {
        return this.depthTexture;
    }
    
    /**
     * Get color texture for VSM
     */
    getColorTexture() {
        return this.colorTexture;
    }
    
    /**
     * Resize shadow map
     */
    resize(size) {
        if (this.size === size) return;
        
        this.size = size;
        this.dispose();
        this.init();
    }
    
    /**
     * Dispose shadow map resources
     */
    dispose() {
        const gl = this.gl;
        
        if (this.framebuffer) {
            gl.deleteFramebuffer(this.framebuffer);
            this.framebuffer = null;
        }
        
        if (this.depthTexture) {
            gl.deleteTexture(this.depthTexture);
            this.depthTexture = null;
        }
        
        if (this.colorTexture) {
            gl.deleteTexture(this.colorTexture);
            this.colorTexture = null;
        }
        
        this.initialized = false;
    }
}

/**
 * Base Shadow Generator class
 */
export class ShadowGenerator {
    constructor(light, options = {}) {
        this.light = light;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.bias = options.bias || 0.001;
        this.normalBias = options.normalBias || 0.0;
        this.mapSize = options.mapSize || 1024;
        this.filterType = options.filterType || ShadowFilterType.PCF_3x3;
        this.radius = options.radius || 2.0;
        
        // Shadow map
        this.shadowMap = null;
        this.shadowMapType = options.shadowMapType || ShadowMapType.BASIC;
        
        // Performance tracking
        this.renderTime = 0;
        this.lastUpdate = 0;
        this.updateInterval = options.updateInterval || 0; // 0 = always update
        
        // Culling
        this.frustumCorners = [];
        this.lightSpaceFrustum = [];
        
        this.needsUpdate = true;
    }
    
    /**
     * Initialize shadow generator
     */
    init(gl) {
        if (!this.enabled) return;
        
        this.shadowMap = new ShadowMap(gl, {
            type: this.getShadowMapType(),
            size: this.mapSize,
            cascadeCount: this.getCascadeCount()
        });
        
        console.log(`Shadow generator initialized for ${this.light.constructor.name}`);
    }
    
    /**
     * Get shadow map type for this light
     */
    getShadowMapType() {
        switch (this.light.constructor.name) {
            case 'DirectionalLight':
                return ShadowMapType.CASCADE;
            case 'PointLight':
                return ShadowMapType.OMNIDIRECTIONAL;
            case 'SpotLight':
                return ShadowMapType.BASIC;
            default:
                return ShadowMapType.BASIC;
        }
    }
    
    /**
     * Get cascade count
     */
    getCascadeCount() {
        if (this.light.constructor.name === 'DirectionalLight') {
            return this.cascadeCount || 3;
        }
        return 1;
    }
    
    /**
     * Update shadow map if needed
     */
    shouldUpdate() {
        if (!this.enabled || !this.shadowMap) return false;
        
        const now = performance.now();
        if (this.updateInterval === 0) return true;
        
        return (now - this.lastUpdate) > this.updateInterval;
    }
    
    /**
     * Update shadow generator
     */
    update(scene, camera, frustum) {
        if (!this.enabled || !this.shadowMap) return;
        
        const startTime = performance.now();
        
        try {
            // Update shadow camera
            this.updateShadowCamera(scene, camera);
            
            // Render shadow map
            this.renderShadowMap(scene);
            
            this.needsUpdate = false;
            this.lastUpdate = performance.now();
            
        } catch (error) {
            console.error('Shadow update failed:', error);
        }
        
        this.renderTime = performance.now() - startTime;
    }
    
    /**
     * Update shadow camera based on light type
     */
    updateShadowCamera(scene, camera) {
        // Override in subclasses
    }
    
    /**
     * Render shadow map
     */
    renderShadowMap(scene) {
        if (!this.shadowMap || !this.enabled) return;
        
        // Bind shadow map
        this.shadowMap.bind();
        
        // Set shadow rendering state
        this.setupShadowRenderingState();
        
        // Render scene from light perspective
        this.renderSceneFromLight(scene);
        
        // Unbind shadow map
        this.shadowMap.unbind();
    }
    
    /**
     * Setup rendering state for shadow passes
     */
    setupShadowRenderingState() {
        const gl = this.shadowMap.gl;
        
        // Set culling for shadow rendering
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT); // Render back faces to shadow map
        
        // Disable blending for depth-only shadows
        gl.disable(gl.BLEND);
        
        // Ensure depth test is enabled
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }
    
    /**
     * Render scene from light perspective
     */
    renderSceneFromLight(scene) {
        // Override in subclasses for different shadow map types
        // This should traverse scene and render casters
    }
    
    /**
     * Get shadow uniform data for shaders
     */
    getShadowUniforms() {
        if (!this.shadowMap) return null;
        
        const uniforms = {
            enabled: this.enabled,
            mapSize: this.mapSize,
            bias: this.bias,
            normalBias: this.normalBias,
            filterType: this.filterType,
            lightPosition: this.light.position || new Vector3(),
            lightDirection: this.light.direction || new Vector3()
        };
        
        // Add cascade data for directional lights
        if (this.light.constructor.name === 'DirectionalLight') {
            uniforms.cascadeCount = this.getCascadeCount();
            uniforms.cascadeSplits = this.shadowMap.cascadeSplits;
            uniforms.shadowMatrices = [];
            
            for (let i = 0; i < uniforms.cascadeCount; i++) {
                uniforms.shadowMatrices.push(this.shadowMap.getShadowMatrix(i));
            }
        }
        
        return uniforms;
    }
    
    /**
     * Set shadow quality parameters
     */
    setQuality(quality) {
        this.mapSize = quality.mapSize;
        this.bias = quality.bias;
        this.normalBias = quality.normalBias;
        this.filterType = quality.filterType;
        
        if (this.shadowMap) {
            this.shadowMap.resize(this.mapSize);
        }
    }
    
    /**
     * Enable/disable shadows
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.needsUpdate = true;
        
        if (!enabled && this.shadowMap) {
            this.shadowMap.dispose();
            this.shadowMap = null;
        } else if (enabled && !this.shadowMap) {
            // Reinitialize when enabled
            this.needsUpdate = true;
        }
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            renderTime: this.renderTime,
            mapSize: this.mapSize,
            enabled: this.enabled,
            lastUpdate: this.lastUpdate
        };
    }
    
    /**
     * Dispose shadow generator
     */
    dispose() {
        if (this.shadowMap) {
            this.shadowMap.dispose();
            this.shadowMap = null;
        }
    }
}

/**
 * Directional Light Shadow Generator with Cascades
 */
export class DirectionalShadowGenerator extends ShadowGenerator {
    constructor(light, options = {}) {
        super(light, options);
        
        this.cascadeCount = options.cascadeCount || 3;
        this.cascadeBlendWidth = options.cascadeBlendWidth || 0.1;
        this.optimizeCascades = options.optimizeCascades !== false;
        this.fitToCascade = options.fitToCascade !== false;
        
        // Frustum management
        this.sourceFrustum = null;
        this.cascadeFrustums = [];
        this.lightSpaceBounds = [];
        
        // Optimization
        this.maxShadowDistance = options.maxShadowDistance || 100.0;
        this.shadowCameraSize = options.shadowCameraSize || 50.0;
    }
    
    /**
     * Update shadow camera with cascade shadow mapping
     */
    updateShadowCamera(scene, camera) {
        // Calculate source camera frustum
        this.sourceFrustum = this.calculateFrustum(camera);
        
        // Calculate cascade splits
        const cascades = this.shadowMap.calculateCascadeSplits(
            camera, 
            camera.near, 
            camera.far
        );
        
        // Update each cascade
        for (let i = 0; i < this.cascadeCount; i++) {
            const cascadeFrustum = this.calculateCascadeFrustum(
                camera,
                i > 0 ? cascades[i - 1] : 0,
                cascades[i]
            );
            
            this.updateCascadeCamera(i, cascadeFrustum);
        }
    }
    
    /**
     * Calculate camera frustum
     */
    calculateFrustum(camera) {
        const frustum = {
            near: camera.near,
            far: camera.far,
            fov: camera.fov,
            aspect: camera.aspect
        };
        
        // Calculate frustum corners in world space
        this.frustumCorners = this.getFrustumCorners(camera);
        
        return frustum;
    }
    
    /**
     * Get frustum corners in world space
     */
    getFrustumCorners(camera) {
        const corners = [];
        const near = camera.near;
        const far = camera.far;
        const fov = camera.fov;
        const aspect = camera.aspect;
        
        const nearHeight = 2 * Math.tan(fov / 2) * near;
        const nearWidth = nearHeight * aspect;
        const farHeight = 2 * Math.tan(fov / 2) * far;
        const farWidth = farHeight * aspect;
        
        // Near and far center points
        const nearCenter = camera.position.clone().add(
            camera.getForwardVector().multiplyScalar(near)
        );
        const farCenter = camera.position.clone().add(
            camera.getForwardVector().multiplyScalar(far)
        );
        
        // Near corners
        corners.push(nearCenter.clone().add(new Vector3(-nearWidth/2, -nearHeight/2, 0)));
        corners.push(nearCenter.clone().add(new Vector3(nearWidth/2, -nearHeight/2, 0)));
        corners.push(nearCenter.clone().add(new Vector3(nearWidth/2, nearHeight/2, 0)));
        corners.push(nearCenter.clone().add(new Vector3(-nearWidth/2, nearHeight/2, 0)));
        
        // Far corners
        corners.push(farCenter.clone().add(new Vector3(-farWidth/2, -farHeight/2, 0)));
        corners.push(farCenter.clone().add(new Vector3(farWidth/2, -farHeight/2, 0)));
        corners.push(farCenter.clone().add(new Vector3(farWidth/2, farHeight/2, 0)));
        corners.push(farCenter.clone().add(new Vector3(-farWidth/2, farHeight/2, 0)));
        
        return corners;
    }
    
    /**
     * Calculate cascade frustum bounds
     */
    calculateCascadeFrustum(camera, startDist, endDist) {
        // Get the cascade corners
        const cascadeCorners = this.getCascadeCorners(camera, startDist, endDist);
        
        // Calculate bounds in light space
        const bounds = this.calculateLightSpaceBounds(cascadeCorners, this.light.direction);
        
        return {
            corners: cascadeCorners,
            bounds: bounds,
            startDistance: startDist * camera.far,
            endDistance: endDist * camera.far
        };
    }
    
    /**
     * Get frustum corners for a specific cascade
     */
    getCascadeCorners(camera, startDist, endDist) {
        const corners = [];
        const near = camera.near;
        const far = camera.far;
        
        const cascadeNear = Math.max(near, startDist * far);
        const cascadeFar = Math.max(cascadeNear, endDist * far);
        
        const fov = camera.fov;
        const aspect = camera.aspect;
        
        const nearHeight = 2 * Math.tan(fov / 2) * cascadeNear;
        const nearWidth = nearHeight * aspect;
        const farHeight = 2 * Math.tan(fov / 2) * cascadeFar;
        const farWidth = farHeight * aspect;
        
        // Near and far center points
        const nearCenter = camera.position.clone().add(
            camera.getForwardVector().multiplyScalar(cascadeNear)
        );
        const farCenter = camera.position.clone().add(
            camera.getForwardVector().multiplyScalar(cascadeFar)
        );
        
        // Near corners
        corners.push(nearCenter.clone().add(new Vector3(-nearWidth/2, -nearHeight/2, 0)));
        corners.push(nearCenter.clone().add(new Vector3(nearWidth/2, -nearHeight/2, 0)));
        corners.push(nearCenter.clone().add(new Vector3(nearWidth/2, nearHeight/2, 0)));
        corners.push(nearCenter.clone().add(new Vector3(-nearWidth/2, nearHeight/2, 0)));
        
        // Far corners
        corners.push(farCenter.clone().add(new Vector3(-farWidth/2, -farHeight/2, 0)));
        corners.push(farCenter.clone().add(new Vector3(farWidth/2, -farHeight/2, 0)));
        corners.push(farCenter.clone().add(new Vector3(farWidth/2, farHeight/2, 0)));
        corners.push(farCenter.clone().add(new Vector3(-farWidth/2, farHeight/2, 0)));
        
        return corners;
    }
    
    /**
     * Calculate light space bounds for frustum
     */
    calculateLightSpaceBounds(corners, lightDirection) {
        const lightDir = lightDirection.clone().normalize();
        const up = Vector3.up;
        
        // Create light space basis
        const right = Vector3.cross(lightDir, up).normalize();
        const realUp = Vector3.cross(right, lightDir).normalize();
        
        // Transform corners to light space
        const lightSpaceCorners = corners.map(corner => {
            const offset = corner.clone().sub(corners[0]); // Relative to first corner
            return {
                x: offset.dot(right),
                y: offset.dot(realUp),
                z: -offset.dot(lightDir)
            };
        });
        
        // Calculate bounds
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        
        lightSpaceCorners.forEach(corner => {
            minX = Math.min(minX, corner.x);
            minY = Math.min(minY, corner.y);
            minZ = Math.min(minZ, corner.z);
            maxX = Math.max(maxX, corner.x);
            maxY = Math.max(maxY, corner.y);
            maxZ = Math.max(maxZ, corner.z);
        });
        
        // Pad bounds to prevent acne
        const padding = Math.max(maxX - minX, maxY - minY) * 0.1;
        minX -= padding; minY -= padding; minZ -= padding;
        maxX += padding; maxY += padding; maxZ += padding;
        
        return {
            min: new Vector3(minX, minY, minZ),
            max: new Vector3(maxX, maxY, maxZ),
            size: new Vector3(maxX - minX, maxY - minY, maxZ - minZ),
            center: new Vector3(
                (minX + maxX) / 2,
                (minY + maxY) / 2,
                (minZ + maxZ) / 2
            )
        };
    }
    
    /**
     * Update cascade camera
     */
    updateCascadeCamera(cascadeIndex, cascadeFrustum) {
        const bounds = cascadeFrustum.bounds;
        const center = cascadeFrustum.corners[0].clone().add(
            new Vector3(
                bounds.center.x,
                bounds.center.y,
                bounds.center.z
            )
        );
        
        // Position shadow camera to cover the cascade bounds
        const lightDir = this.light.direction.clone().normalize();
        const shadowCamPos = center.clone().sub(
            lightDir.clone().multiplyScalar(bounds.size.z * 0.5 + 10)
        );
        
        // Update shadow map camera
        this.shadowMap.camera.position.copy(shadowCamPos);
        this.shadowMap.camera.target.copy(center);
        
        // Calculate orthographic projection
        const halfSize = Math.max(bounds.size.x, bounds.size.y) * 0.5;
        this.shadowMap.camera.left = -halfSize;
        this.shadowMap.camera.right = halfSize;
        this.shadowMap.camera.top = halfSize;
        this.shadowMap.camera.bottom = -halfSize;
        this.shadowMap.camera.near = 0.1;
        this.shadowMap.camera.far = bounds.size.z + 20;
        
        // Update matrices
        this.shadowMap.camera.viewMatrix.makeLookAt(
            this.shadowMap.camera.position,
            this.shadowMap.camera.target,
            Vector3.up
        );
        
        this.shadowMap.camera.projectionMatrix.makeOrthographic(
            this.shadowMap.camera.left,
            this.shadowMap.camera.right,
            this.shadowMap.camera.top,
            this.shadowMap.camera.bottom,
            this.shadowMap.camera.near,
            this.shadowMap.camera.far
        );
    }
    
    /**
     * Render cascade shadow maps
     */
    renderSceneFromLight(scene) {
        for (let cascadeIndex = 0; cascadeIndex < this.cascadeCount; cascadeIndex++) {
            // Bind cascade-specific framebuffer region if needed
            this.bindCascade(cascadeIndex);
            
            // Render scene for this cascade
            this.renderCascade(scene, cascadeIndex);
        }
    }
    
    /**
     * Bind specific cascade
     */
    bindCascade(cascadeIndex) {
        // For basic implementation, bind the whole shadow map
        // For optimized implementation, could bind sub-regions
        this.shadowMap.bind();
    }
    
    /**
     * Render scene for specific cascade
     */
    renderCascade(scene, cascadeIndex) {
        // Set viewport for cascade
        const gl = this.shadowMap.gl;
        gl.viewport(0, 0, this.mapSize, this.mapSize);
        
        // Render scene from light camera
        this.renderSceneFromCamera(scene, this.shadowMap.camera);
    }
    
    /**
     * Render scene from specific camera
     */
    renderSceneFromCamera(scene, camera) {
        // This should traverse the scene and render shadow casters
        // Implementation would depend on the scene structure
        console.log(`Rendering cascade ${this.renderSceneFromCamera} from light camera`);
    }
}

/**
 * Point Light Shadow Generator (Omnidirectional)
 */
export class PointShadowGenerator extends ShadowGenerator {
    constructor(light, options = {}) {
        super(light, options);
        
        this.cubemapFaces = 6;
        this.faceCameras = [];
        this.faceDirections = [
            Vector3.right, Vector3.negativeUnitX, Vector3.up,
            Vector3.negativeUnitY, Vector3.forward, Vector3.backward
        ];
        this.upVectors = [
            Vector3.up, Vector3.up, Vector3.backward,
            Vector3.forward, Vector3.up, Vector3.up
        ];
    }
    
    /**
     * Update omnidirectional shadow camera
     */
    updateShadowCamera(scene, camera) {
        // Setup cameras for each cubemap face
        this.setupFaceCameras();
    }
    
    /**
     * Setup cameras for each cubemap face
     */
    setupFaceCameras() {
        this.faceCameras = [];
        
        for (let i = 0; i < this.cubemapFaces; i++) {
            this.faceCameras.push({
                position: this.light.position.clone(),
                target: this.light.position.clone().add(this.faceDirections[i]),
                up: this.upVectors[i],
                projectionMatrix: new Matrix4(),
                viewMatrix: new Matrix4()
            });
        }
    }
    
    /**
     * Render cubemap shadow map
     */
    renderSceneFromLight(scene) {
        for (let faceIndex = 0; faceIndex < this.cubemapFaces; faceIndex++) {
            this.renderFace(scene, faceIndex);
        }
    }
    
    /**
     * Render single face of cubemap
     */
    renderFace(scene, faceIndex) {
        const camera = this.faceCameras[faceIndex];
        
        // Update camera matrices
        camera.viewMatrix.makeLookAt(
            camera.position, 
            camera.target, 
            camera.up
        );
        
        camera.projectionMatrix.makePerspective(
            Math.PI / 2, 1.0, 0.1, this.light.distance || 100.0
        );
        
        // Bind face-specific framebuffer
        this.bindFace(faceIndex);
        
        // Render scene for this face
        this.renderSceneFromCamera(scene, camera);
    }
    
    /**
     * Bind specific cubemap face
     */
    bindFace(faceIndex) {
        // Implementation would bind the specific face of the cubemap
        this.shadowMap.bind();
    }
}

/**
 * Spot Light Shadow Generator
 */
export class SpotShadowGenerator extends ShadowGenerator {
    constructor(light, options = {}) {
        super(light, options);
        
        this.spotSize = light.angle || Math.PI / 6;
        this.penumbra = light.penumbra || 0.3;
    }
    
    /**
     * Update spotlight shadow camera
     */
    updateShadowCamera(scene, camera) {
        const lightPos = this.light.position;
        const lightTarget = this.light.target;
        const lightDir = this.light.direction;
        
        // Update shadow map camera
        this.shadowMap.camera.position.copy(lightPos);
        this.shadowMap.camera.target.copy(lightTarget);
        this.shadowMap.camera.up.set(0, 1, 0);
        
        // Calculate orthographic bounds based on spotlight size
        const distance = lightPos.distanceTo(lightTarget);
        const radius = Math.tan(this.spotSize) * distance;
        const padding = radius * (1 + this.penumbra);
        
        this.shadowMap.camera.left = -padding;
        this.shadowMap.camera.right = padding;
        this.shadowMap.camera.top = padding;
        this.shadowMap.camera.bottom = -padding;
        this.shadowMap.camera.near = 0.1;
        this.shadowMap.camera.far = distance + 10;
        
        // Update matrices
        this.shadowMap.camera.viewMatrix.makeLookAt(
            this.shadowMap.camera.position,
            this.shadowMap.camera.target,
            this.shadowMap.camera.up
        );
        
        this.shadowMap.camera.projectionMatrix.makeOrthographic(
            this.shadowMap.camera.left,
            this.shadowMap.camera.right,
            this.shadowMap.camera.top,
            this.shadowMap.camera.bottom,
            this.shadowMap.camera.near,
            this.shadowMap.camera.far
        );
    }
}

/**
 * Shadow Filter implementations
 */
export class ShadowFilters {
    /**
     * PCF (Percentage Closer Filtering) - 2x2
     */
    static applyPCF2x2(depthTexture, uv, compareDepth, textureSize) {
        const texelSize = 1.0 / textureSize;
        let visibility = 0.0;
        
        for (let x = -1; x <= 0; x++) {
            for (let y = -1; y <= 0; y++) {
                const offsetUV = [uv[0] + x * texelSize, uv[1] + y * texelSize];
                const depth = depthTexture.get2D(offsetUV[0], offsetUV[1]);
                visibility += (compareDepth <= depth) ? 1.0 : 0.0;
            }
        }
        
        return visibility / 4.0;
    }
    
    /**
     * PCF (Percentage Closer Filtering) - 3x3
     */
    static applyPCF3x3(depthTexture, uv, compareDepth, textureSize) {
        const texelSize = 1.0 / textureSize;
        let visibility = 0.0;
        let count = 0;
        
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                const offsetUV = [uv[0] + x * texelSize, uv[1] + y * texelSize];
                const depth = depthTexture.get2D(offsetUV[0], offsetUV[1]);
                if (depth > 0) { // Valid depth
                    visibility += (compareDepth <= depth) ? 1.0 : 0.0;
                    count++;
                }
            }
        }
        
        return visibility / count;
    }
    
    /**
     * PCF (Percentage Closer Filtering) - 4x4
     */
    static applyPCF4x4(depthTexture, uv, compareDepth, textureSize) {
        const texelSize = 2.0 / textureSize;
        let visibility = 0.0;
        
        for (let x = -2; x <= 1; x++) {
            for (let y = -2; y <= 1; y++) {
                const offsetUV = [uv[0] + x * texelSize, uv[1] + y * texelSize];
                const depth = depthTexture.get2D(offsetUV[0], offsetUV[1]);
                visibility += (compareDepth <= depth) ? 1.0 : 0.0;
            }
        }
        
        return visibility / 16.0;
    }
    
    /**
     * VSM (Variance Shadow Mapping)
     */
    static applyVSM(depthTexture, uv, compareDepth, textureSize, lightBleedReduction = 0.2) {
        const texelSize = 1.0 / textureSize;
        const moment1 = depthTexture.get2D(uv[0], uv[1]);
        const moment2 = depthTexture.get2D(uv[0], uv[1], 1); // Assuming second channel
        
        const variance = Math.max(moment2 - moment1 * moment1, 0.0001);
        const d = compareDepth - moment1;
        
        let pMax = variance / (variance + d * d);
        pMax = Math.max(0.0, Math.min(1.0, pMax));
        
        // Light bleed reduction
        return pMax * (1.0 - lightBleedReduction) + lightBleedReduction;
    }
}

/**
 * Shadow Material system
 */
export class ShadowMaterial {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.vertexShader = this.getShadowVertexShader();
        this.fragmentShader = this.getShadowFragmentShader(options);
        this.program = null;
        this.uniforms = {};
        this.attributes = {};
        
        this.compile();
    }
    
    /**
     * Get shadow vertex shader
     */
    getShadowVertexShader() {
        return `
            attribute vec3 position;
            attribute vec3 normal;
            
            uniform mat4 modelMatrix;
            uniform mat4 lightViewProjectionMatrix;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            
            varying vec3 vNormal;
            varying vec4 vLightCoord;
            varying vec3 vPosition;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vPosition = worldPosition.xyz;
                vNormal = normalize(normalMatrix * normal);
                vLightCoord = lightViewProjectionMatrix * worldPosition;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }
    
    /**
     * Get shadow fragment shader
     */
    getShadowFragmentShader(options = {}) {
        const filterType = options.filterType || ShadowFilterType.PCF_3x3;
        const bias = options.bias || 0.001;
        const normalBias = options.normalBias || 0.0;
        
        let filteringCode = '';
        
        switch (filterType) {
            case ShadowFilterType.PCF_2x2:
                filteringCode = this.getPCF2x2Code();
                break;
            case ShadowFilterType.PCF_3x3:
                filteringCode = this.getPCF3x3Code();
                break;
            case ShadowFilterType.PCF_4x4:
                filteringCode = this.getPCF4x4Code();
                break;
            case ShadowFilterType.VSM:
                filteringCode = this.getVSMCode();
                break;
            default:
                filteringCode = this.getBasicShadowCode();
        }
        
        return `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec4 vLightCoord;
            varying vec3 vPosition;
            
            uniform sampler2D shadowMap;
            uniform vec3 lightDirection;
            uniform float shadowBias;
            uniform float normalOffsetScale;
            uniform vec2 shadowMapSize;
            uniform vec3 cameraPosition;
            
            ${filteringCode}
            
            void main() {
                float depth = gl_FragCoord.z;
                
                // Apply normal bias to reduce shadow acne
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(-lightDirection);
                float ndotl = max(dot(normal, lightDir), 0.0);
                float normalOffset = ndotl * normalOffsetScale;
                
                vec4 lightCoord = vLightCoord;
                lightCoord.xyz /= lightCoord.w;
                lightCoord.xyz += normal * normalOffset;
                lightCoord.w = lightCoord.z - shadowBias;
                
                float shadow = calculateShadow(lightCoord.xy, lightCoord.z);
                
                gl_FragColor = vec4(shadow, shadow, shadow, 1.0);
            }
        `;
    }
    
    /**
     * Basic shadow code
     */
    getBasicShadowCode() {
        return `
            float calculateShadow(vec2 uv, float depth) {
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    return 1.0;
                }
                
                float closestDepth = texture2D(shadowMap, uv).r;
                return (depth <= closestDepth) ? 1.0 : 0.0;
            }
        `;
    }
    
    /**
     * PCF 2x2 filtering code
     */
    getPCF2x2Code() {
        return `
            float calculateShadow(vec2 uv, float depth) {
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    return 1.0;
                }
                
                float texelSize = 1.0 / shadowMapSize.x;
                float shadow = 0.0;
                
                for (int x = 0; x <= 1; x++) {
                    for (int y = 0; y <= 1; y++) {
                        vec2 offset = vec2(float(x), float(y)) * texelSize;
                        float closestDepth = texture2D(shadowMap, uv + offset).r;
                        shadow += (depth <= closestDepth) ? 1.0 : 0.0;
                    }
                }
                
                return shadow / 4.0;
            }
        `;
    }
    
    /**
     * PCF 3x3 filtering code
     */
    getPCF3x3Code() {
        return `
            float calculateShadow(vec2 uv, float depth) {
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    return 1.0;
                }
                
                float texelSize = 1.0 / shadowMapSize.x;
                float shadow = 0.0;
                float count = 0.0;
                
                for (int x = -1; x <= 1; x++) {
                    for (int y = -1; y <= 1; y++) {
                        vec2 offset = vec2(float(x), float(y)) * texelSize;
                        float closestDepth = texture2D(shadowMap, uv + offset).r;
                        shadow += (depth <= closestDepth) ? 1.0 : 0.0;
                        count += 1.0;
                    }
                }
                
                return shadow / count;
            }
        `;
    }
    
    /**
     * PCF 4x4 filtering code
     */
    getPCF4x4Code() {
        return `
            float calculateShadow(vec2 uv, float depth) {
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    return 1.0;
                }
                
                float texelSize = 2.0 / shadowMapSize.x;
                float shadow = 0.0;
                
                for (int x = -2; x <= 1; x++) {
                    for (int y = -2; y <= 1; y++) {
                        vec2 offset = vec2(float(x), float(y)) * texelSize;
                        float closestDepth = texture2D(shadowMap, uv + offset).r;
                        shadow += (depth <= closestDepth) ? 1.0 : 0.0;
                    }
                }
                
                return shadow / 16.0;
            }
        `;
    }
    
    /**
     * VSM filtering code
     */
    getVSMCode() {
        return `
            float calculateShadow(vec2 uv, float depth) {
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                    return 1.0;
                }
                
                vec4 moments = texture2D(shadowMap, uv);
                float moment1 = moments.r;
                float moment2 = moments.g;
                
                float variance = max(moment2 - moment1 * moment1, 0.00001);
                float d = depth - moment1;
                float pMax = variance / (variance + d * d);
                
                return clamp(pMax, 0.0, 1.0);
            }
        `;
    }
    
    /**
     * Compile shader program
     */
    compile() {
        const gl = this.gl;
        
        try {
            this.program = gl.createProgram();
            const vertexShader = this.createShader(gl.VERTEX_SHADER, this.vertexShader);
            const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, this.fragmentShader);
            
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);
            
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                throw new Error('Shadow shader program linking failed: ' + gl.getProgramInfoLog(this.program));
            }
            
            // Get uniform locations
            this.uniforms = {
                modelMatrix: gl.getUniformLocation(this.program, 'modelMatrix'),
                lightViewProjectionMatrix: gl.getUniformLocation(this.program, 'lightViewProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(this.program, 'modelViewMatrix'),
                projectionMatrix: gl.getUniformLocation(this.program, 'projectionMatrix'),
                normalMatrix: gl.getUniformLocation(this.program, 'normalMatrix'),
                shadowMap: gl.getUniformLocation(this.program, 'shadowMap'),
                lightDirection: gl.getUniformLocation(this.program, 'lightDirection'),
                shadowBias: gl.getUniformLocation(this.program, 'shadowBias'),
                normalOffsetScale: gl.getUniformLocation(this.program, 'normalOffsetScale'),
                shadowMapSize: gl.getUniformLocation(this.program, 'shadowMapSize'),
                cameraPosition: gl.getUniformLocation(this.program, 'cameraPosition')
            };
            
            // Get attribute locations
            this.attributes = {
                position: gl.getAttribLocation(this.program, 'position'),
                normal: gl.getAttribLocation(this.program, 'normal')
            };
            
            console.log('Shadow material compiled successfully');
            
        } catch (error) {
            console.error('Shadow material compilation failed:', error);
            throw error;
        }
    }
    
    /**
     * Create and compile shader
     */
    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`${type} shader compilation failed: ${error}`);
        }
        
        return shader;
    }
    
    /**
     * Use this material for rendering
     */
    use() {
        const gl = this.gl;
        gl.useProgram(this.program);
    }
    
    /**
     * Set uniform values
     */
    setUniform(name, value) {
        const gl = this.gl;
        const location = this.uniforms[name];
        
        if (!location) return;
        
        if (typeof value === 'number') {
            gl.uniform1f(location, value);
        } else if (Array.isArray(value)) {
            switch (value.length) {
                case 2: gl.uniform2fv(location, value); break;
                case 3: gl.uniform3fv(location, value); break;
                case 4: gl.uniform4fv(location, value); break;
                case 9: gl.uniformMatrix3fv(location, false, value); break;
                case 16: gl.uniformMatrix4fv(location, false, value); break;
            }
        }
    }
    
    /**
     * Dispose material
     */
    dispose() {
        const gl = this.gl;
        
        if (this.program) {
            gl.deleteProgram(this.program);
            this.program = null;
        }
    }
}

/**
 * Shadow Manager - Coordinates all shadow generators
 */
export class ShadowManager {
    constructor(gl, options = {}) {
        this.gl = gl;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        this.quality = options.quality || ShadowQuality.MEDIUM;
        this.maxShadowDistance = options.maxShadowDistance || 100.0;
        
        // Shadow generators
        this.generators = new Map();
        
        // Performance tracking
        this.totalRenderTime = 0;
        this.frameCount = 0;
        
        // Debug
        this.debug = options.debug || false;
    }
    
    /**
     * Add shadow generator for a light
     */
    addGenerator(light, options = {}) {
        let generator;
        
        switch (light.constructor.name) {
            case 'DirectionalLight':
                generator = new DirectionalShadowGenerator(light, options);
                break;
            case 'PointLight':
                generator = new PointShadowGenerator(light, options);
                break;
            case 'SpotLight':
                generator = new SpotShadowGenerator(light, options);
                break;
            default:
                console.warn(`Unsupported light type for shadows: ${light.constructor.name}`);
                return;
        }
        
        generator.init(this.gl);
        this.generators.set(light.id, generator);
        
        console.log(`Added shadow generator for ${light.constructor.name}`);
    }
    
    /**
     * Remove shadow generator
     */
    removeGenerator(lightId) {
        const generator = this.generators.get(lightId);
        if (generator) {
            generator.dispose();
            this.generators.delete(lightId);
        }
    }
    
    /**
     * Get shadow generator for light
     */
    getGenerator(lightId) {
        return this.generators.get(lightId);
    }
    
    /**
     * Update all shadow maps
     */
    update(scene, camera, frustum) {
        if (!this.enabled) return;
        
        const startTime = performance.now();
        
        this.generators.forEach((generator, lightId) => {
            if (generator.shouldUpdate()) {
                generator.update(scene, camera, frustum);
            }
        });
        
        const endTime = performance.now();
        this.totalRenderTime += (endTime - startTime);
        this.frameCount++;
    }
    
    /**
     * Get all shadow uniform data
     */
    getShadowUniforms() {
        const uniforms = [];
        
        this.generators.forEach((generator, lightId) => {
            const generatorUniforms = generator.getShadowUniforms();
            if (generatorUniforms) {
                uniforms.push({
                    lightId: lightId,
                    ...generatorUniforms
                });
            }
        });
        
        return uniforms;
    }
    
    /**
     * Set shadow quality for all generators
     */
    setQuality(quality) {
        this.quality = quality;
        
        this.generators.forEach(generator => {
            generator.setQuality(quality);
        });
    }
    
    /**
     * Enable/disable shadows
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        this.generators.forEach(generator => {
            generator.setEnabled(enabled);
        });
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const generatorMetrics = {};
        
        this.generators.forEach((generator, lightId) => {
            generatorMetrics[lightId] = generator.getPerformanceMetrics();
        });
        
        return {
            enabled: this.enabled,
            quality: this.quality,
            generatorCount: this.generators.size,
            avgRenderTime: this.frameCount > 0 ? this.totalRenderTime / this.frameCount : 0,
            totalRenderTime: this.totalRenderTime,
            frameCount: this.frameCount,
            generators: generatorMetrics
        };
    }
    
    /**
     * Dispose all shadow resources
     */
    dispose() {
        this.generators.forEach(generator => {
            generator.dispose();
        });
        this.generators.clear();
    }
}

// All exports are already done above with individual export statements
