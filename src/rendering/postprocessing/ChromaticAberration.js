/**
 * Chromatic Aberration Effect
 * Creates color separation effect mimicking lens imperfections
 */

class ChromaticAberration {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.enabled = options.enabled !== undefined ? options.enabled : true;
        
        // Quality settings
        this.quality = options.quality || 'high'; // 'low', 'medium', 'high'
        this.downsampleRatio = this._getDownsampleRatio(this.quality);
        
        // Effect parameters
        this.intensity = options.intensity !== undefined ? options.intensity : 0.002;
        this.offsetX = options.offsetX !== undefined ? options.offsetX : 0.0;
        this.offsetY = options.offsetY !== undefined ? options.offsetY : 0.0;
        this.angle = options.angle !== undefined ? options.angle : 0.0;
        
        // Color channel separation
        this.redOffset = options.redOffset !== undefined ? options.redOffset : { x: 1.0, y: 0.0 };
        this.greenOffset = options.greenOffset !== undefined ? options.greenOffset : { x: 0.0, y: 0.0 };
        this.blueOffset = options.blueOffset !== undefined ? options.blueOffset : { x: -1.0, y: 0.0 };
        
        // Animation parameters
        this.animate = options.animate !== undefined ? options.animate : false;
        this.animationSpeed = options.animationSpeed !== undefined ? options.animationSpeed : 1.0;
        this.animationPhase = 0;
        
        // Temporal settings
        this.temporalEnabled = options.temporalEnabled !== undefined ? options.temporalEnabled : false;
        this.temporalStrength = options.temporalStrength !== undefined ? options.temporalStrength : 0.02;
        this.temporalBuffer = null;
        
        // Buffers
        this.halfResBuffer = null;
        this.separationBuffer = null;
        
        // Internal state
        this.needsUpdate = true;
        
        this._initBuffers();
        this._createMaterials();
    }
    
    _getDownsampleRatio(quality) {
        const ratios = {
            'low': 0.75,
            'medium': 1.0,
            'high': 1.0
        };
        return ratios[quality] || ratios.high;
    }
    
    _initBuffers() {
        const gl = this.renderer.getContext();
        if (!gl) return;
        
        const size = this.renderer.getSize();
        const width = Math.floor(size.x * this.downsampleRatio);
        const height = Math.floor(size.y * this.downsampleRatio);
        
        // Create buffers for chromatic aberration processing
        this.halfResBuffer = this._createRenderTarget(width, height);
        this.separationBuffer = this._createRenderTarget(width, height);
        
        // Create temporal buffer
        if (this.temporalEnabled) {
            this.temporalBuffer = this._createRenderTarget(width, height);
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
        this.separationMaterial = this._createSeparationMaterial();
        this.combineMaterial = this._createCombineMaterial();
    }
    
    _createSeparationMaterial() {
        return {
            vertexShader: `
                attribute vec2 position;
                attribute vec2 uv;
                varying vec2 vUv;
                varying vec2 vScreenPos;
                
                void main() {
                    vUv = uv;
                    vScreenPos = position * 0.5 + 0.5;
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                varying vec2 vUv;
                varying vec2 vScreenPos;
                uniform sampler2D tDiffuse;
                uniform vec2 uResolution;
                uniform float uIntensity;
                uniform vec2 uRedOffset;
                uniform vec2 uGreenOffset;
                uniform vec2 uBlueOffset;
                uniform bool uAnimate;
                uniform float uAnimationTime;
                uniform float uAnimationSpeed;
                
                vec2 getOffset(vec2 baseOffset, vec2 screenPos) {
                    vec2 offset = baseOffset;
                    
                    // Radial falloff - stronger at edges
                    vec2 center = vec2(0.5, 0.5);
                    float distance = length(screenPos - center);
                    float falloff = smoothstep(0.0, 0.8, distance);
                    
                    // Add some variation based on angle
                    float angle = atan(screenPos.y - center.y, screenPos.x - center.x);
                    float radialVariation = sin(angle * 3.0 + uAnimationTime * uAnimationSpeed) * 0.5 + 0.5;
                    
                    offset *= falloff * uIntensity;
                    offset *= (0.5 + radialVariation * 0.5);
                    
                    return offset;
                }
                
                void main() {
                    vec2 redOffset = getOffset(uRedOffset, vScreenPos);
                    vec2 greenOffset = getOffset(uGreenOffset, vScreenPos);
                    vec2 blueOffset = getOffset(uBlueOffset, vScreenPos);
                    
                    // Sample each color channel at slightly different positions
                    float r = texture2D(tDiffuse, vUv + redOffset / uResolution).r;
                    float g = texture2D(tDiffuse, vUv + greenOffset / uResolution).g;
                    float b = texture2D(tDiffuse, vUv + blueOffset / uResolution).b;
                    
                    gl_FragColor = vec4(r, g, b, 1.0);
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
                uniform sampler2D tSeparated;
                uniform sampler2D tTemporal;
                uniform bool temporalEnabled;
                uniform float temporalStrength;
                uniform float mixAmount;
                
                void main() {
                    vec4 original = texture2D(tDiffuse, vUv);
                    vec4 separated = texture2D(tSeparated, vUv);
                    
                    // Mix original with chromatic aberration
                    vec3 color = mix(original.rgb, separated.rgb, mixAmount);
                    
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
    
    render(scene, camera, target, time) {
        if (!this.enabled) return;
        
        const gl = this.renderer.getContext();
        const originalFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        
        // Update animation
        if (this.animate && time !== undefined) {
            this.animationPhase = time * this.animationSpeed;
            this._updateAnimatedOffsets();
        }
        
        // Step 1: Apply chromatic separation
        this._renderSeparationPass(scene, camera);
        
        // Step 2: Combine with original
        this._renderCombinePass(scene, camera, target);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
    }
    
    _renderSeparationPass(scene, camera) {
        // Implementation would render separation pass
        // using separationMaterial with a full-screen quad
    }
    
    _renderCombinePass(scene, camera, target) {
        // Implementation would combine original scene with separated colors
        // using combineMaterial
    }
    
    _updateAnimatedOffsets() {
        if (!this.animate) return;
        
        // Create dynamic offsets based on animation phase
        const baseAngle = this.angle;
        const animatedIntensity = this.intensity * (0.5 + 0.5 * Math.sin(this.animationPhase * 2.0));
        
        const offsetX = Math.cos(baseAngle) * animatedIntensity;
        const offsetY = Math.sin(baseAngle) * animatedIntensity;
        
        this.redOffset = {
            x: offsetX * 1.5,
            y: offsetY * 1.5
        };
        
        this.greenOffset = {
            x: offsetX * 0.5,
            y: offsetY * 0.5
        };
        
        this.blueOffset = {
            x: -offsetX * 1.0,
            y: -offsetY * 1.0
        };
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
        
        [this.halfResBuffer, this.separationBuffer, this.temporalBuffer].forEach(buffer => {
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
    
    setAngle(angle) {
        this.angle = angle;
        this._updateDirectionOffsets();
    }
    
    setOffsets(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this._updateDirectionOffsets();
    }
    
    setRedOffset(x, y) {
        this.redOffset = { x: x, y: y };
    }
    
    setGreenOffset(x, y) {
        this.greenOffset = { x: x, y: y };
    }
    
    setBlueOffset(x, y) {
        this.blueOffset = { x: x, y: y };
    }
    
    setAnimation(enabled) {
        this.animate = enabled;
        if (!enabled) {
            this._updateDirectionOffsets();
        }
    }
    
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.01, speed);
    }
    
    _updateDirectionOffsets() {
        if (this.animate) return;
        
        // Update color channel offsets based on direction
        const magnitude = Math.sqrt(this.offsetX * this.offsetX + this.offsetY * this.offsetY);
        if (magnitude > 0) {
            const normalizedX = this.offsetX / magnitude;
            const normalizedY = this.offsetY / magnitude;
            
            this.redOffset = {
                x: normalizedX * magnitude * 1.5,
                y: normalizedY * magnitude * 1.5
            };
            
            this.greenOffset = {
                x: normalizedX * magnitude * 0.5,
                y: normalizedY * magnitude * 0.5
            };
            
            this.blueOffset = {
                x: -normalizedX * magnitude * 1.0,
                y: -normalizedY * magnitude * 1.0
            };
        }
    }
    
    // Preset methods
    applyPreset(preset) {
        switch (preset) {
            case 'subtle':
                this.intensity = 0.001;
                this.redOffset = { x: 0.5, y: 0.0 };
                this.greenOffset = { x: 0.0, y: 0.0 };
                this.blueOffset = { x: -0.5, y: 0.0 };
                break;
                
            case 'moderate':
                this.intensity = 0.003;
                this.redOffset = { x: 1.5, y: 0.0 };
                this.greenOffset = { x: 0.0, y: 0.0 };
                this.blueOffset = { x: -1.0, y: 0.0 };
                break;
                
            case 'strong':
                this.intensity = 0.005;
                this.redOffset = { x: 2.0, y: 1.0 };
                this.greenOffset = { x: 0.0, y: 0.0 };
                this.blueOffset = { x: -1.5, y: -1.0 };
                break;
                
            case 'cinematic':
                this.intensity = 0.002;
                this.animate = true;
                this.animationSpeed = 0.5;
                break;
        }
    }
    
    // Utility methods
    getDirectionVector() {
        return {
            x: Math.cos(this.angle),
            y: Math.sin(this.angle)
        };
    }
    
    setDirectionFromVector(x, y) {
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude > 0) {
            this.angle = Math.atan2(y, x);
            this.intensity = magnitude;
        }
    }
    
    // Getters for UI
    getParameters() {
        return {
            enabled: this.enabled,
            quality: this.quality,
            intensity: this.intensity,
            angle: this.angle,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            redOffset: this.redOffset,
            greenOffset: this.greenOffset,
            blueOffset: this.blueOffset,
            animate: this.animate,
            animationSpeed: this.animationSpeed,
            temporalEnabled: this.temporalEnabled,
            temporalStrength: this.temporalStrength
        };
    }
    
    // Effect-specific methods
    simulateLensDistortion() {
        // Simulate common lens distortion patterns
        const center = 0.5;
        const radius = 0.3;
        const distortionStrength = this.intensity;
        
        // Radial chromatic aberration
        this.redOffset = { x: distortionStrength, y: 0 };
        this.greenOffset = { x: 0, y: 0 };
        this.blueOffset = { x: -distortionStrength, y: 0 };
    }
    
    simulatePrismEffect() {
        // Simulate prism-like effect with animated rainbow dispersion
        this.animate = true;
        this.animationSpeed = 2.0;
        this.redOffset = { x: 0, y: Math.sin(0) * this.intensity };
        this.greenOffset = { x: 0, y: Math.sin(2.094) * this.intensity };
        this.blueOffset = { x: 0, y: Math.sin(4.188) * this.intensity };
    }
}

export default ChromaticAberration;
