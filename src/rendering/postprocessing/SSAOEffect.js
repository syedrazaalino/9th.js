/**
 * Screen Space Ambient Occlusion (SSAO) Effect
 * Creates realistic contact shadows in crevices and corners for enhanced depth perception
 */

class SSAOEffect {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        
        // Quality settings
        this.quality = options.quality || 'high'; // 'low', 'medium', 'high'
        this.downsampleRatio = this._getDownsampleRatio(this.quality);
        
        // Effect parameters
        this.radius = options.radius !== undefined ? options.radius : 0.5;
        this.intensity = options.intensity !== undefined ? options.intensity : 1.0;
        this.kernelSize = this._getKernelSize(this.quality);
        this.sampleCount = options.sampleCount || this.kernelSize;
        
        // Noise settings
        this.noiseEnabled = options.noiseEnabled !== undefined ? options.noiseEnabled : true;
        this.noiseScale = options.noiseScale !== undefined ? options.noiseScale : 2.0;
        this.noiseTexture = null;
        
        // Temporal settings
        this.temporalEnabled = options.temporalEnabled !== undefined ? options.temporalEnabled : true;
        this.temporalStrength = options.temporalStrength !== undefined ? options.temporalStrength : 0.1;
        this.temporalBuffer = null;
        
        // Buffers
        this.halfResBuffer = null;
        this.ssaoBuffer = null;
        this.blurBuffer1 = null;
        this.blurBuffer2 = null;
        
        // Internal state
        this.needsUpdate = true;
        this.sampleKernel = [];
        
        this._initBuffers();
        this._createMaterials();
        this._generateSampleKernel();
        this._createNoiseTexture();
    }
    
    _getDownsampleRatio(quality) {
        const ratios = {
            'low': 0.5,
            'medium': 0.75,
            'high': 1.0
        };
        return ratios[quality] || ratios.high;
    }
    
    _getKernelSize(quality) {
        const sizes = {
            'low': 8,
            'medium': 16,
            'high': 32
        };
        return sizes[quality] || sizes.high;
    }
    
    _initBuffers() {
        const gl = this.renderer.getContext();
        if (!gl) return;
        
        const size = this.renderer.getSize();
        const halfWidth = Math.floor(size.x * this.downsampleRatio);
        const halfHeight = Math.floor(size.y * this.downsampleRatio);
        
        // Create buffers for SSAO processing
        this.halfResBuffer = this._createRenderTarget(halfWidth, halfHeight);
        this.ssaoBuffer = this._createRenderTarget(halfWidth, halfHeight);
        this.blurBuffer1 = this._createRenderTarget(halfWidth, halfHeight);
        this.blurBuffer2 = this._createRenderTarget(halfWidth, halfHeight);
        
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
    
    _generateSampleKernel() {
        this.sampleKernel = [];
        
        for (let i = 0; i < this.kernelSize; i++) {
            const sample = [
                Math.random() * 2.0 - 1.0, // x
                Math.random() * 2.0 - 1.0, // y
                Math.random() // z
            ];
            
            // Normalize vector
            let length = Math.sqrt(sample[0] * sample[0] + sample[1] * sample[1] + sample[2] * sample[2]);
            sample[0] /= length;
            sample[1] /= length;
            sample[2] /= length;
            
            // Scale with quadratic falloff
            const scale = i / this.kernelSize;
            const scaledScale = 0.1 + 0.9 * scale * scale;
            sample[0] *= scaledScale;
            sample[1] *= scaledScale;
            sample[2] *= scaledScale;
            
            this.sampleKernel.push(sample);
        }
    }
    
    _createNoiseTexture() {
        if (!this.noiseEnabled) return;
        
        const gl = this.renderer.getContext();
        if (!gl) return;
        
        const noiseSize = 4;
        const noiseData = [];
        
        // Generate random noise
        for (let i = 0; i < noiseSize * noiseSize; i++) {
            noiseData.push(
                Math.random() * 2.0 - 1.0, // x
                Math.random() * 2.0 - 1.0, // y
                0.0 // z (not used)
            );
        }
        
        this.noiseTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, noiseSize, noiseSize, 0, gl.RGBA, gl.FLOAT, noiseData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    _createMaterials() {
        this.ssaoMaterial = this._createSSAOMaterial();
        this.blurMaterial = this._createBlurMaterial();
        this.combineMaterial = this._createCombineMaterial();
    }
    
    _createSSAOMaterial() {
        return {
            vertexShader: `
                attribute vec2 position;
                attribute vec2 uv;
                varying vec2 vUv;
                varying vec3 vViewPosition;
                
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
                uniform sampler2D tNormal;
                uniform sampler2D tNoise;
                uniform vec3 uSampleKernel[32];
                uniform int uSampleCount;
                uniform float uRadius;
                uniform float uIntensity;
                uniform float uNoiseScale;
                uniform vec2 uResolution;
                uniform vec2 uNearFar;
                
                vec3 getViewPosition(vec2 uv, float depth) {
                    // Convert depth to view space position
                    float z = depth * 2.0 - 1.0; // NDC to view space
                    return vec3(uv * 2.0 - 1.0, z);
                }
                
                vec3 getViewNormal(vec2 uv) {
                    return texture2D(tNormal, uv).rgb * 2.0 - 1.0;
                }
                
                float calculateSSAO(vec3 viewPos, vec3 viewNormal, vec2 uv) {
                    float occlusion = 0.0;
                    
                    // Generate random noise
                    vec3 randomVec = texture2D(tNoise, uv * uNoiseScale).xyz * 2.0 - 1.0;
                    
                    // Create TBN matrix from normal and random vector
                    vec3 tangent = normalize(randomVec - viewNormal * dot(randomVec, viewNormal));
                    vec3 bitangent = cross(viewNormal, tangent);
                    mat3 TBN = mat3(tangent, bitangent, viewNormal);
                    
                    float sampleRadius = uRadius;
                    
                    for (int i = 0; i < 32; i++) {
                        if (i >= uSampleCount) break;
                        
                        vec3 sampleVec = TBN * uSampleKernel[i];
                        vec3 samplePos = viewPos + sampleVec * sampleRadius;
                        
                        // Transform sample position to screen space
                        vec4 offset = vec4(samplePos, 1.0);
                        offset.xyz /= offset.w;
                        
                        if (offset.x < -1.0 || offset.x > 1.0 || 
                            offset.y < -1.0 || offset.y > 1.0 || 
                            offset.z < -1.0 || offset.z > 1.0) {
                            continue;
                        }
                        
                        vec2 sampleUv = offset.xy * 0.5 + 0.5;
                        
                        // Get depth of sample position
                        float sampleDepth = texture2D(tDepth, sampleUv).r;
                        float sampleViewPosZ = getViewPosition(sampleUv, sampleDepth).z;
                        
                        float rangeCheck = smoothstep(0.0, 1.0, sampleRadius / abs(viewPos.z - sampleViewPosZ));
                        float occ = (sampleViewPosZ > samplePos.z + 0.025) ? 1.0 : 0.0;
                        occlusion += occ * rangeCheck;
                    }
                    
                    occlusion = 1.0 - (occlusion / float(uSampleCount));
                    return occlusion;
                }
                
                void main() {
                    float depth = texture2D(tDepth, vUv).r;
                    
                    // Skip if too close or too far
                    if (depth >= 0.999) {
                        gl_FragColor = vec4(1.0);
                        return;
                    }
                    
                    vec3 viewPos = getViewPosition(vUv, depth);
                    vec3 viewNormal = getViewNormal(vUv);
                    
                    float ao = calculateSSAO(viewPos, viewNormal, vUv);
                    
                    // Apply intensity
                    ao = pow(ao, uIntensity);
                    
                    gl_FragColor = vec4(ao, ao, ao, 1.0);
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
                uniform bool horizontal;
                uniform float radius;
                
                void main() {
                    vec2 texelSize = 1.0 / resolution;
                    float weights[5];
                    weights[0] = 0.227027;
                    weights[1] = 0.1945946;
                    weights[2] = 0.1216216;
                    weights[3] = 0.054054;
                    weights[4] = 0.016216;
                    
                    vec4 result = texture2D(tDiffuse, vUv) * weights[0];
                    
                    if (horizontal) {
                        for (int i = 1; i < 5; i++) {
                            vec2 offset = vec2(float(i) * texelSize.x, 0.0);
                            result += texture2D(tDiffuse, vUv + offset) * weights[i];
                            result += texture2D(tDiffuse, vUv - offset) * weights[i];
                        }
                    } else {
                        for (int i = 1; i < 5; i++) {
                            vec2 offset = vec2(0.0, float(i) * texelSize.y);
                            result += texture2D(tDiffuse, vUv + offset) * weights[i];
                            result += texture2D(tDiffuse, vUv - offset) * weights[i];
                        }
                    }
                    
                    gl_FragColor = result;
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
                uniform sampler2D tSSAO;
                uniform sampler2D tTemporal;
                uniform bool temporalEnabled;
                uniform float temporalStrength;
                uniform float intensity;
                
                void main() {
                    vec4 original = texture2D(tDiffuse, vUv);
                    float ao = texture2D(tSSAO, vUv).r;
                    
                    // Apply ambient occlusion
                    vec3 color = original.rgb * ao * intensity;
                    
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
        
        // Step 1: Render SSAO
        this._renderSSAOPass(scene, camera);
        
        // Step 2: Blur SSAO
        this._renderBlurPass(scene, camera);
        
        // Step 3: Combine with original
        this._renderCombinePass(scene, camera, target);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
    }
    
    _renderSSAOPass(scene, camera) {
        // Implementation would render SSAO pass
        // using ssaoMaterial with a full-screen quad
    }
    
    _renderBlurPass(scene, camera) {
        // Horizontal blur
        this._renderBlur(scene, camera, true);
        // Vertical blur
        this._renderBlur(scene, camera, false);
    }
    
    _renderBlur(scene, camera, horizontal) {
        // Implementation would perform horizontal/vertical blur
        // using blurMaterial with ping-pong buffering
    }
    
    _renderCombinePass(scene, camera, target) {
        // Implementation would combine original scene with SSAO
        // using combineMaterial
    }
    
    updateQuality(newQuality) {
        this.quality = newQuality;
        this.downsampleRatio = this._getDownsampleRatio(newQuality);
        this.kernelSize = this._getKernelSize(newQuality);
        this.sampleCount = this.kernelSize;
        this._initBuffers();
        this._generateSampleKernel();
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
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    
    dispose() {
        const gl = this.renderer.getContext();
        
        [this.halfResBuffer, this.ssaoBuffer, this.blurBuffer1, this.blurBuffer2, this.temporalBuffer].forEach(buffer => {
            if (buffer) {
                gl.deleteTexture(buffer.texture);
                gl.deleteFramebuffer(buffer.framebuffer);
            }
        });
        
        if (this.noiseTexture) {
            gl.deleteTexture(this.noiseTexture);
        }
    }
    
    // Parameter setters
    setRadius(radius) {
        this.radius = Math.max(0.01, radius);
    }
    
    setIntensity(intensity) {
        this.intensity = Math.max(0.01, intensity);
    }
    
    setSampleCount(count) {
        this.sampleCount = Math.min(Math.max(8, count), 32);
    }
    
    // Getters for UI
    getParameters() {
        return {
            enabled: this.enabled,
            quality: this.quality,
            radius: this.radius,
            intensity: this.intensity,
            sampleCount: this.sampleCount,
            noiseEnabled: this.noiseEnabled,
            noiseScale: this.noiseScale,
            temporalEnabled: this.temporalEnabled,
            temporalStrength: this.temporalStrength
        };
    }
    
    // Helper methods
    getSampleKernel() {
        return this.sampleKernel;
    }
    
    isSupported() {
        const gl = this.renderer.getContext();
        return gl && gl.getExtension('OES_texture_float');
    }
}

export default SSAOEffect;
