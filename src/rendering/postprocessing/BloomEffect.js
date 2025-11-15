/**
 * Bloom Effect
 * Creates a glow/bloom effect around bright areas using Gaussian blur
 */

class BloomEffect {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        
        // Quality settings
        this.quality = options.quality || 'high'; // 'low', 'medium', 'high'
        this.downsampleRatio = this._getDownsampleRatio(this.quality);
        
        // Effect parameters
        this.intensity = options.intensity !== undefined ? options.intensity : 1.5;
        this.threshold = options.threshold !== undefined ? options.threshold : 0.8;
        this.radius = options.radius !== undefined ? options.radius : 4.0;
        
        // Temporal settings for flicker reduction
        this.temporalEnabled = options.temporalEnabled !== undefined ? options.temporalEnabled : true;
        this.temporalStrength = options.temporalStrength !== undefined ? options.temporalStrength : 0.1;
        this.temporalBuffer = null;
        
        // Ping-pong buffers for blur
        this.halfResBuffer = null;
        this.blurBuffer1 = null;
        this.blurBuffer2 = null;
        
        // Internal state
        this.needsUpdate = true;
        
        this._initBuffers();
        this._createMaterials();
    }
    
    _getDownsampleRatio(quality) {
        const ratios = {
            'low': 0.25,
            'medium': 0.5,
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
        
        // Create half-resolution buffer for bloom processing
        this.halfResBuffer = this._createRenderTarget(halfWidth, halfHeight);
        
        // Create blur buffers
        this.blurBuffer1 = this._createRenderTarget(halfWidth, halfHeight);
        this.blurBuffer2 = this._createRenderTarget(halfWidth, halfHeight);
        
        // Create temporal buffer for flicker reduction
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
        this.extractMaterial = this._createExtractMaterial();
        this.blurMaterial = this._createBlurMaterial();
        this.combineMaterial = this._createCombineMaterial();
    }
    
    _createExtractMaterial() {
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
                uniform float threshold;
                
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    
                    // Extract bright areas above threshold
                    float mask = smoothstep(threshold - 0.1, threshold + 0.1, luminance);
                    vec3 extracted = color.rgb * mask;
                    
                    gl_FragColor = vec4(extracted, 1.0);
                }
            `
        };
    }
    
    _createBlurMaterial() {
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
                uniform float radius;
                
                // Gaussian weights for 9-tap blur
                float weights[9];
                
                void main() {
                    // Initialize weights
                    weights[0] = 0.05; weights[1] = 0.09; weights[2] = 0.12; weights[3] = 0.15; 
                    weights[4] = 0.18; weights[5] = 0.15; weights[6] = 0.12; weights[7] = 0.09; weights[8] = 0.05;
                    
                    vec3 color = vec3(0.0);
                    float totalWeight = 0.0;
                    
                    // Perform multi-tap Gaussian blur
                    for (int i = 0; i < 9; i++) {
                        float offset = float(i - 4) * radius;
                        vec2 sampleUv = vUv + direction * offset / resolution;
                        
                        vec3 sample = texture2D(tDiffuse, sampleUv).rgb;
                        float weight = weights[i];
                        
                        color += sample * weight;
                        totalWeight += weight;
                    }
                    
                    color /= totalWeight;
                    gl_FragColor = vec4(color, 1.0);
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
                uniform sampler2D tBloom;
                uniform float intensity;
                uniform sampler2D tTemporal;
                uniform bool temporalEnabled;
                uniform float temporalStrength;
                
                void main() {
                    vec4 original = texture2D(tDiffuse, vUv);
                    vec3 bloom = texture2D(tBloom, vUv).rgb;
                    
                    // Combine original with bloom
                    vec3 combined = original.rgb + bloom * intensity;
                    
                    // Apply temporal filtering for flicker reduction
                    if (temporalEnabled) {
                        vec3 temporal = texture2D(tTemporal, vUv).rgb;
                        combined = mix(combined, temporal, temporalStrength);
                    }
                    
                    gl_FragColor = vec4(combined, 1.0);
                }
            `
        };
    }
    
    render(scene, camera, target) {
        if (!this.enabled) return;
        
        const gl = this.renderer.getContext();
        const originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        
        // Step 1: Extract bright areas
        this._renderExtractPass(scene, camera);
        
        // Step 2: Blur extracted texture
        this._renderBlurPass(scene, camera);
        
        // Step 3: Combine with original
        this._renderCombinePass(scene, camera, target);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
    }
    
    _renderExtractPass(scene, camera) {
        // Implementation would render the extracted bright areas
        // This would use the extractMaterial with a full-screen quad
    }
    
    _renderBlurPass(scene, camera) {
        // Horizontal blur
        this._renderBlur(scene, camera, true);
        // Vertical blur
        this._renderBlur(scene, camera, false);
    }
    
    _renderBlur(scene, camera, horizontal) {
        // Implementation would perform horizontal/vertical blur
        // using the blurMaterial with ping-pong buffering
    }
    
    _renderCombinePass(scene, camera, target) {
        // Implementation would combine original scene with blurred bloom
        // using the combineMaterial
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
        // Clear temporal buffer to prevent artifacts when re-enabling
        const gl = this.renderer.getContext();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.temporalBuffer.framebuffer);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    dispose() {
        // Clean up WebGL resources
        const gl = this.renderer.getContext();
        
        [this.halfResBuffer, this.blurBuffer1, this.blurBuffer2, this.temporalBuffer].forEach(buffer => {
            if (buffer) {
                gl.deleteTexture(buffer.texture);
                gl.deleteFramebuffer(buffer.framebuffer);
            }
        });
    }
    
    // Parameter setters
    setIntensity(intensity) {
        this.intensity = Math.max(0, intensity);
    }
    
    setThreshold(threshold) {
        this.threshold = Math.max(0, Math.min(1, threshold));
    }
    
    setRadius(radius) {
        this.radius = Math.max(0.1, radius);
    }
    
    // Getters for UI
    getParameters() {
        return {
            enabled: this.enabled,
            quality: this.quality,
            intensity: this.intensity,
            threshold: this.threshold,
            radius: this.radius,
            temporalEnabled: this.temporalEnabled,
            temporalStrength: this.temporalStrength
        };
    }
}

export default BloomEffect;
