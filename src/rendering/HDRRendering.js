/**
 * HDRRendering - High Dynamic Range Rendering Pipeline
 * Implements HDR framebuffers, tone mapping operators, exposure control,
 * gamma correction, and HDR texture loading with automatic adaptation
 */

import { WebGLRenderer } from '../core/WebGLRenderer.js';

export class HDRRenderer extends WebGLRenderer {
    constructor(canvas, options = {}) {
        super(canvas, options);
        
        // HDR settings
        this.hdrSettings = {
            enabled: true,
            exposure: 1.0,
            minExposure: 0.01,
            maxExposure: 100.0,
            toneMapping: 'ACES', // 'ACES', 'Reinhard', 'Filmic', 'Uncharted2'
            gamma: 2.2,
            autoExposure: true,
            adaptationSpeed: 1.0,
            bloomEnabled: false,
            bloomThreshold: 1.0,
            bloomIntensity: 0.5
        };

        // HDR framebuffers
        this.hdrFramebuffers = new Map();
        this.renderTarget = null;
        this.bloomTargets = [];

        // Exposure tracking
        this.currentExposure = this.hdrSettings.exposure;
        this.adaptationBuffer = [];
        this.adaptationBufferSize = 16; // Average over last 16 frames
        this.averageLuminance = 0.18; // Target average luminance

        // HDR shaders
        this.shaders = new Map();

        // HDR texture cache
        this.hdrTextures = new Map();

        // Sky rendering
        this.skySettings = {
            enabled: true,
            intensity: 1.0,
            turbidity: 2.0,
            rayleigh: 1.2,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            sunPosition: { x: 0, y: 1, z: 0 }
        };

        this.initHDR();
    }

    /**
     * Initialize HDR rendering pipeline
     */
    initHDR() {
        this.checkHDRSupport();
        this.setupHDRFramebuffers();
        this.compileHDRShaders();
        this.setupEventListeners();
        
        console.log('HDR Rendering initialized successfully');
    }

    /**
     * Check for HDR support
     */
    checkHDRSupport() {
        const gl = this.gl;
        
        this.hdrCapabilities = {
            floatTextures: !!gl.getExtension('OES_texture_float'),
            halfFloatTextures: !!gl.getExtension('OES_texture_half_float'),
            floatLinear: !!gl.getExtension('OES_texture_float_linear'),
            halfFloatLinear: !!gl.getExtension('OES_texture_half_float_linear'),
            colorBufferFloat: !!gl.getExtension('EXT_color_buffer_float'),
            colorBufferHalfFloat: !!gl.getExtension('EXT_color_buffer_half_float')
        };

        // Prefer half-float for better compatibility
        this.hdrFloatType = this.hdrCapabilities.halfFloatLinear ? 
            gl.HALF_FLOAT : gl.FLOAT;

        console.log('HDR Capabilities:', this.hdrCapabilities);
    }

    /**
     * Setup HDR framebuffers
     */
    setupHDRFramebuffers() {
        const gl = this.gl;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Main HDR framebuffer
        this.renderTarget = this.createHDRFramebuffer(width, height);

        // Bloom framebuffers
        if (this.hdrSettings.bloomEnabled) {
            this.createBloomTargets(width, height);
        }

        // Downsample targets for adaptation
        this.adaptationTargets = this.createAdaptationTargets(width, height);
    }

    /**
     * Create HDR framebuffer
     */
    createHDRFramebuffer(width, height) {
        const gl = this.gl;
        const framebuffer = gl.createFramebuffer();
        const texture = gl.createTexture();

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Create HDR color texture
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, 
                     gl.RGBA, this.hdrFloatType, null);

        // Create depth buffer
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

        // Attach texture and depth buffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                               gl.TEXTURE_2D, texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, 
                                  gl.RENDERBUFFER, depthBuffer);

        // Check framebuffer status
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('HDR framebuffer incomplete: ' + status.toString(16));
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);

        const framebufferId = this.generateId();
        this.hdrFramebuffers.set(framebufferId, {
            framebuffer,
            texture,
            depthBuffer,
            width,
            height,
            attachments: []
        });

        return {
            id: framebufferId,
            framebuffer,
            texture,
            width,
            height
        };
    }

    /**
     * Create bloom targets
     */
    createBloomTargets(width, height) {
        const gl = this.gl;
        const numTargets = 4;
        
        this.bloomTargets = [];
        
        for (let i = 0; i < numTargets; i++) {
            const targetWidth = Math.max(1, Math.floor(width / Math.pow(2, i + 1)));
            const targetHeight = Math.max(1, Math.floor(height / Math.pow(2, i + 1)));
            
            const target = {
                downsample: this.createHDRFramebuffer(targetWidth, targetHeight),
                upsample: this.createHDRFramebuffer(targetWidth, targetHeight),
                width: targetWidth,
                height: targetHeight
            };
            
            this.bloomTargets.push(target);
        }
    }

    /**
     * Create adaptation targets for automatic exposure
     */
    createAdaptationTargets(width, height) {
        const targets = [];
        let currentWidth = width;
        let currentHeight = height;
        
        // Create downsampled targets until we get to 1x1
        while (currentWidth > 1 || currentHeight > 1) {
            currentWidth = Math.max(1, Math.floor(currentWidth / 2));
            currentHeight = Math.max(1, Math.floor(currentHeight / 2));
            
            targets.push(this.createHDRFramebuffer(currentWidth, currentHeight));
        }
        
        return targets;
    }

    /**
     * Compile HDR shaders
     */
    compileHDRShaders() {
        this.compileToneMappingShaders();
        this.compileAdaptationShaders();
        this.compileBloomShaders();
        this.compileSkyShaders();
        this.compileHDRShader();
    }

    /**
     * Compile tone mapping shaders
     */
    compileToneMappingShaders() {
        const vertexShader = `
            attribute vec3 position;
            attribute vec2 uv;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            
            varying vec2 vUV;
            
            void main() {
                vUV = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;

        // Tone mapping fragment shaders
        const toneMappingFragments = {
            ACES: `
                precision highp float;
                
                varying vec2 vUV;
                
                uniform sampler2D hdrTexture;
                uniform float exposure;
                uniform float gamma;
                
                // ACES Film Tone Mapping approximation
                vec3 ACESFilm(vec3 x) {
                    float a = 2.51;
                    float b = 0.03;
                    float c = 2.43;
                    float d = 0.59;
                    float e = 0.14;
                    return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
                }
                
                void main() {
                    vec3 hdrColor = texture2D(hdrTexture, vUV).rgb;
                    
                    // Apply exposure
                    hdrColor *= exposure;
                    
                    // ACES tone mapping
                    vec3 mappedColor = ACESFilm(hdrColor);
                    
                    // Gamma correction
                    mappedColor = pow(mappedColor, vec3(1.0/gamma));
                    
                    gl_FragColor = vec4(mappedColor, 1.0);
                }
            `,
            
            Reinhard: `
                precision highp float;
                
                varying vec2 vUV;
                
                uniform sampler2D hdrTexture;
                uniform float exposure;
                uniform float gamma;
                
                void main() {
                    vec3 hdrColor = texture2D(hdrTexture, vUV).rgb;
                    
                    // Apply exposure and Reinhard tone mapping
                    vec3 mappedColor = hdrColor * exposure / (hdrColor * exposure + vec3(1.0));
                    
                    // Gamma correction
                    mappedColor = pow(mappedColor, vec3(1.0/gamma));
                    
                    gl_FragColor = vec4(mappedColor, 1.0);
                }
            `,
            
            Filmic: `
                precision highp float;
                
                varying vec2 vUV;
                
                uniform sampler2D hdrTexture;
                uniform float exposure;
                uniform float gamma;
                
                // Filmic tone mapping curve
                vec3 FilmicCurve(vec3 x) {
                    vec3 result = max(vec3(0.0), x - 0.004);
                    return (result*(6.2*result+0.5))/(result*(6.2*result+1.7)+0.06);
                }
                
                void main() {
                    vec3 hdrColor = texture2D(hdrTexture, vUV).rgb;
                    
                    // Apply exposure
                    hdrColor *= exposure;
                    
                    // Filmic tone mapping
                    vec3 mappedColor = FilmicCurve(hdrColor);
                    
                    // Gamma correction
                    mappedColor = pow(mappedColor, vec3(1.0/gamma));
                    
                    gl_FragColor = vec4(mappedColor, 1.0);
                }
            `,
            
            Uncharted2: `
                precision highp float;
                
                varying vec2 vUV;
                
                uniform sampler2D hdrTexture;
                uniform float exposure;
                uniform float gamma;
                
                // Uncharted 2 tone mapping
                vec3 Uncharted2ToneMap(vec3 color) {
                    float A = 0.15;
                    float B = 0.50;
                    float C = 0.10;
                    float D = 0.20;
                    float E = 0.02;
                    float F = 0.30;
                    
                    return ((color*(A*color+C*B)+D*E)/(color*(A*color+B)+D*F)) - E/F;
                }
                
                void main() {
                    vec3 hdrColor = texture2D(hdrTexture, vUV).rgb;
                    
                    // Apply exposure
                    hdrColor *= exposure;
                    
                    // Uncharted2 tone mapping
                    vec3 mappedColor = Uncharted2ToneMap(hdrColor);
                    
                    // White balance
                    vec3 whitePoint = Uncharted2ToneMap(vec3(11.2));
                    mappedColor /= whitePoint;
                    
                    // Gamma correction
                    mappedColor = pow(mappedColor, vec3(1.0/gamma));
                    
                    gl_FragColor = vec4(mappedColor, 1.0);
                }
            `
        };

        // Compile all tone mapping shaders
        Object.entries(toneMappingFragments).forEach(([name, fragmentShader]) => {
            const programId = this.compileShader(vertexShader, fragmentShader);
            this.shaders.set(`toneMapping_${name}`, programId);
        });
    }

    /**
     * Compile adaptation shaders
     */
    compileAdaptationShaders() {
        const vertexShader = `
            attribute vec3 position;
            attribute vec2 uv;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            
            varying vec2 vUV;
            
            void main() {
                vUV = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;

        // Luminance calculation shader
        const luminanceShader = `
            precision highp float;
            
            varying vec2 vUV;
            
            uniform sampler2D inputTexture;
            
            float luminance(vec3 color) {
                return dot(color, vec3(0.2126, 0.7152, 0.0722));
            }
            
            void main() {
                vec3 color = texture2D(inputTexture, vUV).rgb;
                float lum = luminance(color);
                
                gl_FragColor = vec4(lum, lum, lum, 1.0);
            }
        `;

        // Downsample shader
        const downsampleShader = `
            precision highp float;
            
            varying vec2 vUV;
            
            uniform sampler2D inputTexture;
            uniform vec2 textureSize;
            
            void main() {
                vec2 texelSize = 1.0 / textureSize;
                vec3 color = vec3(0.0);
                
                // Sample 4 pixels and average
                color += texture2D(inputTexture, vUV + texelSize * vec2(-0.5, -0.5)).rgb;
                color += texture2D(inputTexture, vUV + texelSize * vec2(0.5, -0.5)).rgb;
                color += texture2D(inputTexture, vUV + texelSize * vec2(-0.5, 0.5)).rgb;
                color += texture2D(inputTexture, vUV + texelSize * vec2(0.5, 0.5)).rgb;
                
                color /= 4.0;
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Average luminance shader
        const averageShader = `
            precision highp float;
            
            varying vec2 vUV;
            
            uniform sampler2D inputTexture;
            
            void main() {
                vec3 color = texture2D(inputTexture, vUV).rgb;
                float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
                
                gl_FragColor = vec4(lum, lum, lum, 1.0);
            }
        `;

        const luminanceId = this.compileShader(vertexShader, luminanceShader);
        const downsampleId = this.compileShader(vertexShader, downsampleShader);
        const averageId = this.compileShader(vertexShader, averageShader);

        this.shaders.set('luminance', luminanceId);
        this.shaders.set('downsample', downsampleId);
        this.shaders.set('average', averageId);
    }

    /**
     * Compile bloom shaders
     */
    compileBloomShaders() {
        const vertexShader = `
            attribute vec3 position;
            attribute vec2 uv;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            
            varying vec2 vUV;
            
            void main() {
                vUV = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            }
        `;

        // Gaussian blur shader
        const blurShader = `
            precision highp float;
            
            varying vec2 vUV;
            
            uniform sampler2D inputTexture;
            uniform vec2 direction; // 1,0 for horizontal, 0,1 for vertical
            
            void main() {
                vec2 texelSize = 1.0 / vec2(textureSize(inputTexture, 0));
                vec3 color = vec3(0.0);
                float weights[5];
                weights[0] = 0.227027;
                weights[1] = 0.1945946;
                weights[2] = 0.1216216;
                weights[3] = 0.054054;
                weights[4] = 0.016216;
                
                color += texture2D(inputTexture, vUV).rgb * weights[0];
                
                for (int i = 1; i < 5; i++) {
                    vec2 offset = float(i) * texelSize * direction;
                    color += texture2D(inputTexture, vUV + offset).rgb * weights[i];
                    color += texture2D(inputTexture, vUV - offset).rgb * weights[i];
                }
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Bloom threshold shader
        const thresholdShader = `
            precision highp float;
            
            varying vec2 vUV;
            
            uniform sampler2D inputTexture;
            uniform float threshold;
            
            void main() {
                vec3 color = texture2D(inputTexture, vUV).rgb;
                float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
                
                if (lum > threshold) {
                    gl_FragColor = vec4(color, 1.0);
                } else {
                    gl_FragColor = vec4(0.0);
                }
            }
        `;

        const blurId = this.compileShader(vertexShader, blurShader);
        const thresholdId = this.compileShader(vertexShader, thresholdShader);

        this.shaders.set('bloomBlur', blurId);
        this.shaders.set('bloomThreshold', thresholdId);
    }

    /**
     * Compile sky shaders
     */
    compileSkyShaders() {
        const skyVertexShader = `
            attribute vec3 position;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat4 viewMatrixNoTranslation;
            
            varying vec3 vWorldPosition;
            
            void main() {
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                vec4 pos = projectionMatrix * viewMatrixNoTranslation * modelMatrix * vec4(position, 1.0);
                gl_Position = pos;
            }
        `;

        const skyFragmentShader = `
            precision highp float;
            
            varying vec3 vWorldPosition;
            
            uniform vec3 sunPosition;
            uniform float turbidity;
            uniform float rayleigh;
            uniform float mieCoefficient;
            uniform float mieDirectionalG;
            uniform float intensity;
            
            // Rayleigh scattering
            float rayleighPhase(float cosTheta) {
                return (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
            }
            
            // Mie scattering approximation
            float hgPhase(float cosTheta, float g) {
                return (1.0 / (4.0 * 3.14159)) * ((1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5));
            }
            
            void main() {
                vec3 viewDirection = normalize(vWorldPosition);
                
                // Sun angle
                float sunDotView = dot(viewDirection, normalize(sunPosition));
                float cosTheta = sunDotView;
                
                // Scattering calculations
                vec3 rayleighScattering = vec3(5.804e-6, 13.558e-6, 33.1e-6) * rayleigh;
                vec3 mieScattering = vec3(21e-6) * mieCoefficient;
                
                // Optical depth
                float opticalDepthR = 8.0e3;
                float opticalDepthM = 1.2e3;
                
                // Phase functions
                float rayleighPhaseValue = rayleighPhase(cosTheta);
                float miePhaseValue = hgPhase(cosTheta, mieDirectionalG);
                
                // Attenuation
                float attenuation = exp(-(rayleighScattering + mieScattering) * opticalDepthR);
                
                vec3 skyColor = attenuation * miePhaseValue * mieScattering;
                skyColor += attenuation * rayleighPhaseValue * rayleighScattering;
                
                // Sun intensity
                float sunAngularDiameter = 0.00935;
                float sunCutoff = cos(89.1 * 3.14159 / 180.0);
                float sunIntensity = smoothstep(sunCutoff, sunCutoff + 0.0015, cosTheta);
                
                vec3 sunColor = vec3(25.0) * sunIntensity;
                skyColor += sunColor;
                
                skyColor *= intensity;
                
                gl_FragColor = vec4(skyColor, 1.0);
            }
        `;

        const skyId = this.compileShader(skyVertexShader, skyFragmentShader);
        this.shaders.set('sky', skyId);
    }

    /**
     * Compile HDR vertex shader
     */
    compileHDRShader() {
        const vertexShader = `
            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;
            
            uniform mat4 modelMatrix;
            uniform mat4 viewMatrix;
            uniform mat4 projectionMatrix;
            uniform mat3 normalMatrix;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUV;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vPosition = worldPosition.xyz;
                vNormal = normalize(normalMatrix * normal);
                vUV = uv;
                gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
        `;

        const fragmentShader = `
            precision highp float;
            
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying vec2 vUV;
            
            uniform vec3 baseColor;
            uniform float emissiveIntensity;
            uniform vec3 lightDirection;
            uniform vec3 ambientColor;
            uniform vec3 lightColor;
            uniform float lightIntensity;
            uniform samplerCube environmentMap;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(-lightDirection);
                
                // Lighting calculations
                float diffuse = max(dot(normal, lightDir), 0.0);
                vec3 lighting = ambientColor + diffuse * lightColor * lightIntensity;
                
                // Final color with HDR values
                vec3 color = baseColor * lighting;
                
                // Emissive contribution
                color += baseColor * emissiveIntensity;
                
                // Environment reflection (optional)
                vec3 viewDir = normalize(-vPosition);
                vec3 reflectDir = reflect(-viewDir, normal);
                vec3 envColor = textureCube(environmentMap, reflectDir).rgb;
                color += envColor * 0.1; // Subtle environment reflection
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        const hdrId = this.compileShader(vertexShader, fragmentShader);
        this.shaders.set('hdrBasic', hdrId);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle exposure changes
        this.on('toneMappingChanged', (data) => {
            this.currentExposure = data.exposure;
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.setupHDRFramebuffers();
    }

    /**
     * Render HDR scene
     */
    renderHDR(scene, camera) {
        if (!this.hdrSettings.enabled) {
            return this.render(scene, camera);
        }

        const gl = this.gl;
        if (!gl || this.isContextLost) return;

        // 1. Render scene to HDR framebuffer
        this.renderToHDRBuffer(scene, camera);

        // 2. Process automatic exposure if enabled
        if (this.hdrSettings.autoExposure) {
            this.updateAutomaticExposure();
        }

        // 3. Process bloom if enabled
        if (this.hdrSettings.bloomEnabled) {
            this.processBloom();
        }

        // 4. Apply tone mapping and render to screen
        this.applyToneMapping();

        // 5. Render HDR sky if enabled
        if (this.skySettings.enabled) {
            this.renderHDRSky(scene, camera);
        }
    }

    /**
     * Render scene to HDR buffer
     */
    renderToHDRBuffer(scene, camera) {
        const gl = this.gl;
        
        // Bind HDR framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderTarget.framebuffer);
        gl.viewport(0, 0, this.renderTarget.width, this.renderTarget.height);
        
        // Clear with black (HDR color space)
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // Switch to HDR shader program
        const oldRenderObject = this.renderObject.bind(this);
        this.renderObject = (object, cam, scn) => {
            if (object.renderHDR) {
                object.renderHDR(this, cam, scn);
            } else {
                this.useHDRShader();
                object.render(this, cam, scn);
            }
        };
        
        // Render scene normally
        this.render(scene, camera);
        
        // Restore normal rendering
        this.renderObject = oldRenderObject;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Use HDR shader for rendering
     */
    useHDRShader() {
        const gl = this.gl;
        const programId = this.shaders.get('hdrBasic');
        if (programId) {
            const program = this.programs.get(programId);
            if (program) {
                gl.useProgram(program.program);
            }
        }
    }

    /**
     * Update automatic exposure
     */
    updateAutomaticExposure() {
        const gl = this.gl;
        
        // Calculate current average luminance
        const avgLuminance = this.calculateAverageLuminance();
        
        // Store in adaptation buffer
        this.adaptationBuffer.push(avgLuminance);
        if (this.adaptationBuffer.length > this.adaptationBufferSize) {
            this.adaptationBuffer.shift();
        }
        
        // Calculate target exposure based on adaptation
        const targetLuminance = this.adaptationBuffer.reduce((a, b) => a + b, 0) / 
                               this.adaptationBuffer.length;
        
        // Calculate exposure adjustment
        const targetExposure = this.hdrSettings.exposure * (this.averageLuminance / targetLuminance);
        
        // Smooth adaptation
        this.currentExposure += (targetExposure - this.currentExposure) * 
                               (this.hdrSettings.adaptationSpeed * 0.01);
        
        // Clamp exposure
        this.currentExposure = Math.max(this.hdrSettings.minExposure, 
                                       Math.min(this.hdrSettings.maxExposure, this.currentExposure));
    }

    /**
     * Calculate average luminance
     */
    calculateAverageLuminance() {
        const gl = this.gl;
        
        // Downsample to smallest target
        let currentTarget = this.renderTarget;
        
        // Downsample through all adaptation targets
        for (const target of this.adaptationTargets) {
            this.downsampleTexture(currentTarget.texture, target, currentTarget.width, currentTarget.height);
            currentTarget = target;
        }
        
        // Read final 1x1 pixel to get average luminance
        const pixels = new Uint8Array(4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, currentTarget.framebuffer);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        // Convert to luminance (approximation)
        return (pixels[0] + pixels[1] + pixels[2]) / (3 * 255.0);
    }

    /**
     * Downsample texture
     */
    downsampleTexture(inputTexture, outputTarget, inputWidth, inputHeight) {
        const gl = this.gl;
        
        // Bind output framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputTarget.framebuffer);
        gl.viewport(0, 0, outputTarget.width, outputTarget.height);
        
        // Use downsample shader
        const programId = this.shaders.get('downsample');
        if (programId) {
            const program = this.programs.get(programId);
            gl.useProgram(program.program);
            
            // Bind input texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, inputTexture);
            gl.uniform1i(gl.getUniformLocation(program.program, 'inputTexture'), 0);
            gl.uniform2f(gl.getUniformLocation(program.program, 'textureSize'), inputWidth, inputHeight);
            
            // Render full-screen quad (simplified)
            this.renderFullScreenQuad();
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Process bloom effect
     */
    processBloom() {
        const gl = this.gl;
        
        if (this.bloomTargets.length === 0) return;
        
        // 1. Threshold pass
        let currentInput = this.renderTarget;
        this.bloomPass('threshold', currentInput, this.bloomTargets[0].downsample);
        
        // 2. Blur passes (downsample)
        for (let i = 0; i < this.bloomTargets.length - 1; i++) {
            const input = i === 0 ? this.bloomTargets[0].downsample : this.bloomTargets[i].downsample;
            const output = this.bloomTargets[i + 1].downsample;
            this.bloomPass('blur', input, output);
        }
        
        // 3. Blur passes (upsample)
        for (let i = this.bloomTargets.length - 1; i > 0; i--) {
            const input = this.bloomTargets[i].upsample;
            const output = this.bloomTargets[i - 1].upsample;
            this.bloomPass('blur', input, output);
        }
    }

    /**
     * Single bloom pass
     */
    bloomPass(type, input, output) {
        const gl = this.gl;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, output.framebuffer);
        gl.viewport(0, 0, output.width, output.height);
        
        const programId = type === 'threshold' ? 'bloomThreshold' : 'bloomBlur';
        const shaderId = this.shaders.get(programId);
        
        if (shaderId) {
            const program = this.programs.get(shaderId);
            gl.useProgram(program.program);
            
            // Bind input texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, input.texture);
            gl.uniform1i(gl.getUniformLocation(program.program, 'inputTexture'), 0);
            
            if (type === 'threshold') {
                gl.uniform1f(gl.getUniformLocation(program.program, 'threshold'), 
                            this.hdrSettings.bloomThreshold);
            } else {
                // Blur direction - horizontal for downsample, vertical for upsample
                const isDownsample = output.width < input.width;
                gl.uniform2f(gl.getUniformLocation(program.program, 'direction'), 
                           isDownsample ? 1.0 : 0.0, 
                           isDownsample ? 0.0 : 1.0);
            }
            
            this.renderFullScreenQuad();
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Apply tone mapping
     */
    applyToneMapping() {
        const gl = this.gl;
        
        // Bind default framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        
        // Use appropriate tone mapping shader
        const programId = this.shaders.get(`toneMapping_${this.hdrSettings.toneMapping}`);
        if (programId) {
            const program = this.programs.get(programId);
            gl.useProgram(program.program);
            
            // Bind HDR texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.renderTarget.texture);
            gl.uniform1i(gl.getUniformLocation(program.program, 'hdrTexture'), 0);
            
            // Set uniforms
            gl.uniform1f(gl.getUniformLocation(program.program, 'exposure'), this.currentExposure);
            gl.uniform1f(gl.getUniformLocation(program.program, 'gamma'), this.hdrSettings.gamma);
            
            this.renderFullScreenQuad();
        }
    }

    /**
     * Render HDR sky
     */
    renderHDRSky(scene, camera) {
        const gl = this.gl;
        
        // Create sky mesh if it doesn't exist
        if (!this.skyMesh) {
            this.createSkyMesh();
        }
        
        // Render sky
        const programId = this.shaders.get('sky');
        if (programId) {
            const program = this.programs.get(programId);
            gl.useProgram(program.program);
            
            // Set sky uniforms
            gl.uniform3f(gl.getUniformLocation(program.program, 'sunPosition'),
                        this.skySettings.sunPosition.x,
                        this.skySettings.sunPosition.y,
                        this.skySettings.sunPosition.z);
            gl.uniform1f(gl.getUniformLocation(program.program, 'turbidity'), this.skySettings.turbidity);
            gl.uniform1f(gl.getUniformLocation(program.program, 'rayleigh'), this.skySettings.rayleigh);
            gl.uniform1f(gl.getUniformLocation(program.program, 'mieCoefficient'), this.skySettings.mieCoefficient);
            gl.uniform1f(gl.getUniformLocation(program.program, 'mieDirectionalG'), this.skySettings.mieDirectionalG);
            gl.uniform1f(gl.getUniformLocation(program.program, 'intensity'), this.skySettings.intensity);
            
            // Set camera matrices without translation for sky
            const viewMatrixNoTranslation = camera.matrix.clone();
            viewMatrixNoTranslation.elements[12] = 0;
            viewMatrixNoTranslation.elements[13] = 0;
            viewMatrixNoTranslation.elements[14] = 0;
            
            gl.uniformMatrix4fv(gl.getUniformLocation(program.program, 'viewMatrixNoTranslation'), 
                               false, viewMatrixNoTranslation.elements);
            
            this.skyMesh.render(this, camera, scene);
        }
    }

    /**
     * Create sky mesh
     */
    createSkyMesh() {
        // Create a large sphere for the sky
        const segments = 32;
        const vertices = [];
        const uvs = [];
        const indices = [];
        
        for (let lat = 0; lat <= segments; lat++) {
            const theta = lat * Math.PI / segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            
            for (let lon = 0; lon <= segments; lon++) {
                const phi = lon * 2 * Math.PI / segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                
                const x = cosPhi * sinTheta;
                const y = cosTheta;
                const z = sinPhi * sinTheta;
                
                vertices.push(x, y, z);
                uvs.push(lon / segments, lat / segments);
            }
        }
        
        for (let lat = 0; lat < segments; lat++) {
            for (let lon = 0; lon < segments; lon++) {
                const first = (lat * (segments + 1)) + lon;
                const second = first + segments + 1;
                
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }
        
        // Create mesh (simplified - using basic material)
        this.skyMesh = {
            vertices: vertices,
            uvs: uvs,
            indices: indices,
            render: (renderer, camera, scene) => {
                const gl = renderer.gl;
                
                // Render full-screen triangle
                const positions = new Float32Array([
                    -1, -1, 0,  0,  0,
                     3, -1, 0,  2,  0,
                    -1,  3, 0,  0,  2
                ]);
                
                const buffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STREAM_DRAW);
                
                const posLoc = 0;
                const uvLoc = 1;
                
                gl.enableVertexAttribArray(posLoc);
                gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 20, 0);
                
                gl.enableVertexAttribArray(uvLoc);
                gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 20, 12);
                
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                
                gl.deleteBuffer(buffer);
            }
        };
    }

    /**
     * Render full-screen quad (simplified)
     */
    renderFullScreenQuad() {
        const gl = this.gl;
        
        // Create or reuse full-screen quad geometry
        if (!this.fullScreenQuad) {
            const positions = new Float32Array([
                -1, -1, 0, 0, 0,
                 1, -1, 0, 1, 0,
                -1,  1, 0, 0, 1
            ]);
            
            const indices = new Uint16Array([0, 1, 2]);
            
            this.fullScreenQuad = {
                positions: positions,
                indices: indices,
                vbo: gl.createBuffer(),
                ibo: gl.createBuffer()
            };
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.fullScreenQuad.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullScreenQuad.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        }
        
        // Bind geometry
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fullScreenQuad.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fullScreenQuad.ibo);
        
        // Set attribute pointers
        const posLoc = 0;
        const uvLoc = 1;
        
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 20, 0);
        
        gl.enableVertexAttribArray(uvLoc);
        gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 20, 12);
        
        // Draw
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * Load HDR texture
     */
    loadHDRTexture(url) {
        // For now, create a placeholder HDR texture
        // In a real implementation, you would load an HDR file (like .hdr format)
        // and parse it to extract RGB values and positions
        
        const textureId = this.generateId();
        const width = 256;
        const height = 256;
        const data = new Float32Array(width * height * 4);
        
        // Generate some test HDR data
        for (let i = 0; i < width * height; i++) {
            const x = (i % width) / width;
            const y = Math.floor(i / width) / height;
            
            // Create a simple HDR gradient pattern
            data[i * 4 + 0] = Math.pow(x * 2, 2.2) * 100; // R channel (HDR)
            data[i * 4 + 1] = Math.pow(y * 2, 2.2) * 50;  // G channel (HDR)
            data[i * 4 + 2] = Math.pow((x + y) / 2 * 2, 2.2) * 200; // B channel (HDR)
            data[i * 4 + 3] = 1.0; // Alpha
        }
        
        this.hdrTextures.set(textureId, {
            url: url,
            width: width,
            height: height,
            data: data,
            format: 'HDR'
        });
        
        return textureId;
    }

    /**
     * Set HDR settings
     */
    setHDRSettings(settings) {
        Object.assign(this.hdrSettings, settings);
        
        // Emit tone mapping change if exposure changed
        if (settings.exposure !== undefined) {
            this.emit('toneMappingChanged', { exposure: this.currentExposure });
        }
        
        // Recompile shaders if tone mapping algorithm changed
        if (settings.toneMapping) {
            this.compileHDRShaders();
        }
        
        // Recreate bloom targets if bloom settings changed
        if (settings.bloomEnabled !== undefined) {
            this.setupHDRFramebuffers();
        }
    }

    /**
     * Set sky settings
     */
    setSkySettings(settings) {
        Object.assign(this.skySettings, settings);
    }

    /**
     * Get HDR performance metrics
     */
    getHDRPerformance() {
        return {
            currentExposure: this.currentExposure,
            averageLuminance: this.averageLuminance,
            adaptationBufferSize: this.adaptationBuffer.length,
            hdrEnabled: this.hdrSettings.enabled,
            toneMapping: this.hdrSettings.toneMapping,
            bloomEnabled: this.hdrSettings.bloomEnabled,
            framebuffers: this.hdrFramebuffers.size,
            shaders: this.shaders.size,
            hdrTextures: this.hdrTextures.size
        };
    }

    /**
     * Dispose HDR resources
     */
    disposeHDR() {
        const gl = this.gl;
        
        // Delete HDR framebuffers
        this.hdrFramebuffers.forEach((data, id) => {
            if (data.framebuffer) gl.deleteFramebuffer(data.framebuffer);
            if (data.texture) gl.deleteTexture(data.texture);
            if (data.depthBuffer) gl.deleteRenderbuffer(data.depthBuffer);
        });
        
        this.hdrFramebuffers.clear();
        
        // Delete bloom targets
        this.bloomTargets.forEach(target => {
            if (target.downsample) this.hdrFramebuffers.delete(target.downsample.id);
            if (target.upsample) this.hdrFramebuffers.delete(target.upsample.id);
        });
        
        this.bloomTargets = [];
        
        // Delete adaptation targets
        this.adaptationTargets?.forEach(target => {
            this.hdrFramebuffers.delete(target.id);
        });
        
        // Delete HDR shaders
        this.shaders.forEach((programId, name) => {
            const program = this.programs.get(programId);
            if (program) {
                gl.deleteProgram(program.program);
                this.programs.delete(programId);
            }
        });
        
        this.shaders.clear();
        
        // Clear texture cache
        this.hdrTextures.clear();
        
        console.log('HDR resources disposed');
    }

    /**
     * Dispose renderer
     */
    dispose() {
        this.disposeHDR();
        super.dispose();
    }
}
