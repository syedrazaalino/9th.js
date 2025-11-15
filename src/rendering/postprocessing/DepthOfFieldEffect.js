/**
 * Depth of Field Effect
 * Creates realistic depth-based blur using depth texture and circle of confusion calculations
 */

class DepthOfFieldEffect {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        
        // Quality settings
        this.quality = options.quality || 'high'; // 'low', 'medium', 'high'
        this.downsampleRatio = this._getDownsampleRatio(this.quality);
        
        // Effect parameters
        this.focusDistance = options.focusDistance !== undefined ? options.focusDistance : 10.0;
        this.focalLength = options.focalLength !== undefined ? options.focalLength : 50.0;
        this.aperture = options.aperture !== undefined ? options.aperture : 4.0;
        this.maxBlur = options.maxBlur !== undefined ? options.maxBlur : 10.0;
        
        // Circle of confusion settings
        this.cocScale = options.cocScale !== undefined ? options.cocScale : 1.0;
        this.cocBias = options.cocBias !== undefined ? options.cocBias : 0.0;
        
        // Temporal settings
        this.temporalEnabled = options.temporalEnabled !== undefined ? options.temporalEnabled : true;
        this.temporalStrength = options.temporalStrength !== undefined ? options.temporalStrength : 0.05;
        this.temporalBuffer = null;
        
        // Blur buffers
        this.halfResBuffer = null;
        this.depthBlurBuffer = null;
        
        // Internal state
        this.needsUpdate = true;
        
        this._initBuffers();
        this._createMaterials();
    }
    
    _getDownsampleRatio(quality) {
        const ratios = {
            'low': 0.5,
            'medium': 0.75,
            'high': 1.0
        };
        return ratios[quality] || ratios.high;
    }
    
    _initBuffers() {
        const gl = this.renderer.getContext();
        if (!gl) return;
        
        const size = this.renderer.getSize();
        const halfWidth = Math.floor(size.x * this.downsampleRatio);
        const halfHeight = Math.floor(size.y * this.downsampleRatio);
        
        // Create half-resolution buffer for depth processing
        this.halfResBuffer = this._createRenderTarget(halfWidth, halfHeight);
        
        // Create depth blur buffer
        this.depthBlurBuffer = this._createRenderTarget(halfWidth, halfHeight);
        
        // Create temporal buffer
        if (this.temporalEnabled) {
            this.temporalBuffer = this._createRenderTarget(halfWidth, halfHeight);
        }
    }
    
    _createRenderTarget(width, height) {
        const gl = this.renderer.getContext();
        const texture = gl.createTexture();
        const framebuffer = gl.createFramebuffer();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        return {
            texture: texture,
            framebuffer: framebuffer,
            width: width,
            height: height
        };
    }
    
    _createMaterials() {
        this.depthExtractMaterial = this._createDepthExtractMaterial();
        this.depthBlurMaterial = this._createDepthBlurMaterial();
        this.combineMaterial = this._createCombineMaterial();
    }
    
    _createDepthExtractMaterial() {
        return {
            vertexShader: `
                attribute vec2 position;
                attribute vec2 uv;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                varying vec2 vUv;
                uniform sampler2D tDiffuse;
                uniform sampler2D tDepth;
                uniform float focusDistance;
                uniform float focalLength;
                uniform float aperture;
                uniform float cocScale;
                uniform float cocBias;
                uniform float nearClip;
                uniform float farClip;
                
                // Calculate circle of confusion based on depth and camera parameters
                float calculateCoC(float depth, float focusDist, float focalLen, float aper) {
                    // Convert depth to view space distance
                    float viewDistance = nearClip + depth * (farClip - nearClip);
                    
                    // Calculate circle of confusion
                    float coc = abs(focalLen * (focusDist - viewDistance)) / (aper * viewDistance);
                    
                    // Apply scaling and bias
                    coc = coc * cocScale + cocBias;
                    
                    return clamp(coc, 0.0, 1.0);
                }
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float depth = texture2D(tDepth, vUv).r;
                    
                    // Calculate circle of confusion
                    float coc = calculateCoC(depth, focusDistance, focalLength, aperture);
                    
                    // Apply smooth transition near focus distance
                    float smoothCoc = smoothstep(0.0, 1.0, coc);
                    
                    gl_FragColor = vec4(color.rgb, smoothCoc);
                }
            `
        };
    }
    
    _createDepthBlurMaterial() {
        return {
            vertexShader: `
                attribute vec2 position;
                attribute vec2 uv;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                varying vec2 vUv;
                uniform sampler2D tDiffuse;
                uniform vec2 resolution;
                uniform vec2 direction;
                uniform float maxBlur;
                
                // Hexagonal sampling pattern for better quality
                vec2 hexagon[6];
                
                void main() {
                    vec4 centerColor = texture2D(tDiffuse, vUv);
                    float centerAlpha = centerColor.a;
                    
                    if (centerAlpha < 0.01) {
                        gl_FragColor = centerColor;
                        return;
                    }
                    
                    // Initialize hexagon offsets
                    hexagon[0] = vec2(1.0, 0.0);
                    hexagon[1] = vec2(0.5, 0.866);
                    hexagon[2] = vec2(-0.5, 0.866);
                    hexagon[3] = vec2(-1.0, 0.0);
                    hexagon[4] = vec2(-0.5, -0.866);
                    hexagon[5] = vec2(0.5, -0.866);
                    
                    vec3 color = centerColor.rgb * 0.1; // Center weight
                    float totalWeight = 0.1;
                    
                    // Sample in hexagonal pattern around center
                    for (int i = 0; i < 6; i++) {
                        vec2 offset = hexagon[i] * centerAlpha * maxBlur;
                        vec2 sampleUv = vUv + offset / resolution;
                        
                        vec3 sampleColor = texture2D(tDiffuse, sampleUv).rgb;
                        float sampleAlpha = texture2D(tDiffuse, sampleUv).a;
                        
                        float weight = 0.15 * sampleAlpha;
                        color += sampleColor * weight;
                        totalWeight += weight;
                    }
                    
                    // Also sample in-between points for better quality
                    for (int i = 0; i < 6; i++) {
                        vec2 offset1 = hexagon[i] * 0.5 * centerAlpha * maxBlur;
                        vec2 offset2 = hexagon[(i + 1) % 6] * 0.5 * centerAlpha * maxBlur;
                        vec2 midOffset = (offset1 + offset2) * 0.866; // sqrt(3)/2
                        
                        vec2 sampleUv = vUv + midOffset / resolution;
                        
                        vec3 sampleColor = texture2D(tDiffuse, sampleUv).rgb;
                        float sampleAlpha = texture2D(tDiffuse, sampleUv).a;
                        
                        float weight = 0.1 * sampleAlpha;
                        color += sampleColor * weight;
                        totalWeight += weight;
                    }
                    
                    color /= totalWeight;
                    gl_FragColor = vec4(color, centerAlpha);
                }
            `
        };
    }
    
    _createCombineMaterial() {
        return {
            vertexShader: `
                attribute vec2 position;
                attribute vec2 uv;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                varying vec2 vUv;
                uniform sampler2D tDiffuse;
                uniform sampler2D tDof;
                uniform sampler2D tTemporal;
                uniform bool temporalEnabled;
                uniform float temporalStrength;
                
                void main() {
                    vec4 original = texture2D(tDiffuse, vUv);
                    vec4 dof = texture2D(tDof, vUv);
                    
                    // Blend based on alpha (CoC value)
                    vec3 color = mix(original.rgb, dof.rgb, dof.a);
                    
                    // Apply temporal filtering
                    if (temporalEnabled) {
                        vec3 temporal = texture2D(tTemporal, vUv).rgb;
                        color = mix(color, temporal, temporalStrength);
                    }
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };
    }
    
    render(scene, camera, target) {
        if (!this.enabled) return;
        
        const gl = this.renderer.getContext();
        const originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        
        // Step 1: Extract depth and calculate CoC
        this._renderDepthExtractPass(scene, camera);
        
        // Step 2: Apply depth-based blur
        this._renderDepthBlurPass(scene, camera);
        
        // Step 3: Combine with original
        this._renderCombinePass(scene, camera, target);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
    }
    
    _renderDepthExtractPass(scene, camera) {
        // Implementation would render depth extraction pass
        // using depthExtractMaterial with a full-screen quad
    }
    
    _renderDepthBlurPass(scene, camera) {
        // Implementation would perform depth-based blur
        // using depthBlurMaterial with ping-pong buffering
    }
    
    _renderCombinePass(scene, camera, target) {
        // Implementation would combine original scene with blurred depth
        // using combineMaterial
    }
    
    updateQuality(newQuality) {
        this.quality = newQuality;
        this.downsampleRatio = this._getDownsampleRatio(newQuality);
        this._initBuffers();
        this.needsUpdate = true;
    }
    
    updateSize(width, height) {
        this._initBuffers();
        this.needsUpdate = true;
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.temporalBuffer) {
            this._clearTemporalBuffer();
        }
    }
    
    _clearTemporalBuffer() {
        const gl = this.renderer.getContext();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.temporalBuffer.framebuffer);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    dispose() {
        const gl = this.renderer.getContext();
        
        [this.halfResBuffer, this.depthBlurBuffer, this.temporalBuffer].forEach(buffer => {
            if (buffer) {
                gl.deleteTexture(buffer.texture);
                gl.deleteFramebuffer(buffer.framebuffer);
            }
        });
    }
    
    // Camera parameter setters
    setFocusDistance(distance) {
        this.focusDistance = Math.max(0.1, distance);
    }
    
    setFocalLength(length) {
        this.focalLength = Math.max(1.0, length);
    }
    
    setAperture(aperture) {
        this.aperture = Math.max(0.1, aperture);
    }
    
    setMaxBlur(blur) {
        this.maxBlur = Math.max(0.1, blur);
    }
    
    // Utility methods
    focusOnObject(object, camera) {
        if (object && object.position) {
            const distance = object.position.distanceTo(camera.position);
            this.setFocusDistance(distance);
        }
    }
    
    calculateDoF() {
        // Calculate depth of field range
        const hyperfocal = (this.focalLength * this.focalLength) / (this.aperture * 0.03); // Assuming 0.03mm circle of confusion
        
        const nearDistance = (hyperfocal * this.focusDistance) / (hyperfocal + this.focusDistance);
        const farDistance = (hyperfocal * this.focusDistance) / (hyperfocal - this.focusDistance);
        
        return {
            near: nearDistance,
            far: farDistance,
            hyperfocal: hyperfocal
        };
    }
    
    // Getters for UI
    getParameters() {
        return {
            enabled: this.enabled,
            quality: this.quality,
            focusDistance: this.focusDistance,
            focalLength: this.focalLength,
            aperture: this.aperture,
            maxBlur: this.maxBlur,
            cocScale: this.cocScale,
            cocBias: this.cocBias,
            temporalEnabled: this.temporalEnabled,
            temporalStrength: this.temporalStrength
        };
    }
}

export default DepthOfFieldEffect;
