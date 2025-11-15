import { Material } from '../core/Material.js';
import { Shader } from '../core/Shader.js';

// Simple Texture placeholder
class Texture {
    constructor() {
        this.image = null;
        this.needsUpdate = false;
    }
}

/**
 * Custom shader material for particle rendering
 * Supports GPU instancing, sprite rendering, and custom effects
 */
export class ParticleMaterial extends Material {
    constructor(parameters = {}) {
        super();
        
        // Default shader uniforms
        this.uniforms = {
            time: { value: 0 },
            particleSize: { value: 1.0 },
            perspectiveScale: { value: 1.0 },
            colorMap: { value: null },
            alphaMap: { value: null },
            blending: { value: parameters.blending || 'additive' },
            opacity: { value: parameters.opacity || 1.0 }
        };
        
        // Merge with provided parameters
        Object.assign(this.uniforms, parameters.uniforms || {});
        
        // Default material properties
        this.transparent = parameters.transparent !== false;
        this.depthWrite = parameters.depthWrite !== undefined ? parameters.depthWrite : false;
        this.depthTest = parameters.depthTest !== undefined ? parameters.depthTest : true;
        this.opacity = parameters.opacity || 1.0;
        this.blending = parameters.blending;
        
        // GPU instancing support
        this.vertexColors = parameters.vertexColors !== false;
        this.sizeAttenuation = parameters.sizeAttenuation !== false;
        
        // Custom shaders
        this.vertexShader = parameters.vertexShader || this.getDefaultVertexShader();
        this.fragmentShader = parameters.fragmentShader || this.getDefaultFragmentShader();
        
        // Compile the shader
        this.needsUpdate = true;
    }
    
    /**
     * Default vertex shader for particle rendering
     */
    getDefaultVertexShader() {
        return `
            attribute vec3 instancePosition;
            attribute vec3 instanceScale;
            attribute vec3 instanceVelocity;
            attribute vec3 instanceAcceleration;
            attribute vec4 instanceColor;
            attribute float instanceLifetime;
            attribute float instanceAge;
            attribute float instanceRotation;
            attribute float instanceRotationSpeed;
            attribute float instanceTextureIndex;
            attribute float instanceActive;
            
            uniform float time;
            uniform float particleSize;
            uniform float perspectiveScale;
            
            varying vec2 vUv;
            varying vec4 vColor;
            varying float vAge;
            varying float vLifetime;
            varying vec3 vVelocity;
            
            void main() {
                // Only render active particles
                if (instanceActive < 0.5) {
                    gl_Position = vec4(2.0, 2.0, 2.0, 2.0); // Move off-screen
                    return;
                }
                
                // Pass UV coordinates
                vUv = uv;
                
                // Pass color and life data
                vColor = instanceColor;
                vAge = instanceAge;
                vLifetime = instanceLifetime;
                vVelocity = instanceVelocity;
                
                // Calculate age progress (0-1)
                float ageProgress = instanceAge / instanceLifetime;
                
                // Apply rotation
                float rotation = instanceRotation + instanceRotationSpeed * time;
                mat2 rotationMatrix = mat2(
                    cos(rotation), -sin(rotation),
                    sin(rotation), cos(rotation)
                );
                
                vec2 rotatedPosition = rotationMatrix * position.xy;
                
                // Scale particle based on size and life
                float lifeScale = 1.0;
                
                // Optional: size fade based on age
                // lifeScale *= (1.0 - ageProgress * 0.5); // Fade to 50% at end of life
                
                // Optional: velocity-based scaling
                float velocityMagnitude = length(instanceVelocity);
                lifeScale *= (1.0 + velocityMagnitude * 0.1);
                
                vec2 scaledPosition = rotatedPosition * instanceScale.xy * particleSize * lifeScale;
                
                // Particle billboard rotation to face camera
                vec4 worldPosition = vec4(instancePosition + vec3(scaledPosition, 0.0), 1.0);
                vec4 mvPosition = modelViewMatrix * worldPosition;
                
                // Size attenuation for perspective
                if (sizeAttenuation) {
                    gl_PointSize = particleSize * instanceScale.x * lifeScale * (perspectiveScale / -mvPosition.z);
                } else {
                    gl_PointSize = particleSize * instanceScale.x * lifeScale;
                }
                
                // Pass age progress to fragment shader
                vAge = ageProgress;
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
    }
    
    /**
     * Default fragment shader for particle rendering
     */
    getDefaultFragmentShader() {
        return `
            uniform sampler2D colorMap;
            uniform sampler2D alphaMap;
            uniform float time;
            uniform float opacity;
            
            varying vec2 vUv;
            varying vec4 vColor;
            varying float vAge;
            varying float vLifetime;
            varying vec3 vVelocity;
            
            void main() {
                // Get base color from texture or use vertex color
                vec4 texColor = texture2D(colorMap, vUv);
                vec4 finalColor = texColor;
                
                // Apply vertex color
                finalColor *= vColor;
                
                // Apply alpha texture if available
                if (alphaMap != 0) {
                    float alphaValue = texture2D(alphaMap, vUv).r;
                    finalColor.a *= alphaValue;
                }
                
                // Life-based fade
                float lifeFactor = 1.0 - vAge;
                finalColor.a *= lifeFactor;
                
                // Velocity-based effects
                float velocityGlow = length(vVelocity) * 0.1;
                finalColor.rgb += vec3(velocityGlow);
                
                // Alpha test for soft particles
                if (finalColor.a < 0.01) {
                    discard;
                }
                
                gl_FragColor = vec4(finalColor.rgb, finalColor.a * opacity);
            }
        `;
    }
    
    /**
     * Fire/Explosion shader
     */
    getFireShader() {
        return {
            vertexShader: this.getDefaultVertexShader(),
            fragmentShader: `
                uniform float time;
                uniform sampler2D noiseMap;
                
                varying vec2 vUv;
                varying vec4 vColor;
                varying float vAge;
                varying vec3 vVelocity;
                
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    
                    return mix(a, b, u.x) +
                           (c - a) * u.y * (1.0 - u.x) +
                           (d - b) * u.x * u.y;
                }
                
                void main() {
                    // Create fire-like gradient
                    vec2 center = vUv - 0.5;
                    float dist = length(center);
                    float radial = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    // Fire colors based on age and height
                    vec3 fireColor;
                    if (radial > 0.7) {
                        fireColor = vec3(1.0, 0.8, 0.2); // Yellow
                    } else if (radial > 0.4) {
                        fireColor = vec3(1.0, 0.4, 0.1); // Orange
                    } else {
                        fireColor = vec3(1.0, 0.1, 0.0); // Red
                    }
                    
                    // Add noise for fire flicker
                    float noiseValue = noise(vUv * 10.0 + time * 2.0);
                    fireColor *= (0.5 + noiseValue * 0.5);
                    
                    // Alpha based on radial falloff and age
                    float alpha = radial * (1.0 - vAge);
                    alpha *= (0.5 + noiseValue * 0.5);
                    
                    // Apply vertex color
                    fireColor *= vColor.rgb;
                    
                    if (alpha < 0.01) {
                        discard;
                    }
                    
                    gl_FragColor = vec4(fireColor, alpha);
                }
            `
        };
    }
    
    /**
     * Water/Smoke shader
     */
    getWaterShader() {
        return {
            vertexShader: this.getDefaultVertexShader(),
            fragmentShader: `
                uniform float time;
                uniform sampler2D noiseMap;
                
                varying vec2 vUv;
                varying vec4 vColor;
                varying float vAge;
                varying vec3 vVelocity;
                
                void main() {
                    // Create smooth, flowing appearance
                    vec2 distortedUv = vUv + vVelocity.xy * 0.1 * time;
                    
                    float noiseValue = texture2D(noiseMap, distortedUv).r;
                    float smoothNoise = smoothstep(0.3, 0.7, noiseValue);
                    
                    // Water-like blue color
                    vec3 waterColor = vec3(0.2, 0.5, 0.8);
                    waterColor += vec3(0.1) * smoothNoise;
                    
                    // Alpha with soft edges
                    float alpha = (1.0 - vAge) * smoothNoise;
                    alpha *= (1.0 - length(vUv - 0.5));
                    
                    // Apply vertex color
                    waterColor *= vColor.rgb;
                    
                    if (alpha < 0.01) {
                        discard;
                    }
                    
                    gl_FragColor = vec4(waterColor, alpha);
                }
            `
        };
    }
    
    /**
     * Spark/Trail shader
     */
    getSparkShader() {
        return {
            vertexShader: this.getDefaultVertexShader(),
            fragmentShader: `
                uniform float time;
                
                varying vec2 vUv;
                varying vec4 vColor;
                varying float vAge;
                varying vec3 vVelocity;
                
                void main() {
                    // Create elongated spark shape
                    vec2 center = vUv - 0.5;
                    center.x *= 2.0; // Make sparks longer
                    
                    float dist = length(center);
                    float spark = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    // Bright white/yellow core
                    vec3 sparkColor = vec3(1.0, 0.9, 0.6);
                    sparkColor *= 2.0; // Make it bright
                    
                    // Alpha based on shape and life
                    float alpha = spark * (1.0 - vAge * 0.5);
                    
                    // Apply vertex color
                    sparkColor *= vColor.rgb;
                    
                    if (alpha < 0.01) {
                        discard;
                    }
                    
                    gl_FragColor = vec4(sparkColor, alpha);
                }
            `
        };
    }
    
    /**
     * Magic/Particle effects shader
     */
    getMagicShader() {
        return {
            vertexShader: this.getDefaultVertexShader(),
            fragmentShader: `
                uniform float time;
                uniform sampler2D noiseMap;
                
                varying vec2 vUv;
                varying vec4 vColor;
                varying float vAge;
                varying vec3 vVelocity;
                
                // HSL to RGB conversion
                vec3 hsl2rgb(vec3 hsl) {
                    vec3 rgb = clamp(abs(mod(hsl.x*6.0 + vec3(0,4,2), 6.0)-3.0)-1.0, 0.0, 1.0);
                    rgb = rgb*rgb*(3.0-2.0*rgb);
                    return hsl.z + hsl.y*(rgb-0.5)*(1.0-abs(2.0*hsl.z-1.0));
                }
                
                void main() {
                    // Create magical particle effect
                    float dist = length(vUv - 0.5);
                    
                    // Magic circle pattern
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float circlePattern = sin(angle * 8.0 + time * 3.0) * 0.5 + 0.5;
                    
                    // Magic color based on time and position
                    float hue = fract(time * 0.2 + dist * 2.0 + circlePattern * 0.3);
                    vec3 magicColor = hsl2rgb(vec3(hue, 0.8, 0.6));
                    
                    // Add sparkle effect
                    float sparkle = step(0.95, fract(sin(vUv.x * 100.0 + time * 50.0) * 43758.5453));
                    magicColor += vec3(sparkle) * 2.0;
                    
                    // Alpha with magic glow
                    float alpha = (1.0 - dist) * (1.0 - vAge) * 0.8;
                    alpha += sparkle * 0.5;
                    
                    // Apply vertex color
                    magicColor *= vColor.rgb;
                    
                    if (alpha < 0.01) {
                        discard;
                    }
                    
                    gl_FragColor = vec4(magicColor, alpha);
                }
            `
        };
    }
    
    /**
     * Apply custom shader effects
     */
    applyShader(shaderType) {
        switch (shaderType) {
            case 'fire':
                const fireShader = this.getFireShader();
                this.vertexShader = fireShader.vertexShader;
                this.fragmentShader = fireShader.fragmentShader;
                break;
                
            case 'water':
                const waterShader = this.getWaterShader();
                this.vertexShader = waterShader.vertexShader;
                this.fragmentShader = waterShader.fragmentShader;
                break;
                
            case 'spark':
                const sparkShader = this.getSparkShader();
                this.vertexShader = sparkShader.vertexShader;
                this.fragmentShader = sparkShader.fragmentShader;
                break;
                
            case 'magic':
                const magicShader = this.getMagicShader();
                this.vertexShader = magicShader.vertexShader;
                this.fragmentShader = magicShader.fragmentShader;
                break;
        }
        
        this.needsUpdate = true;
    }
    
    /**
     * Set particle size
     */
    setParticleSize(size) {
        this.uniforms.particleSize.value = size;
    }
    
    /**
     * Set texture maps
     */
    setTextures(colorMap, alphaMap) {
        if (colorMap) this.uniforms.colorMap.value = colorMap;
        if (alphaMap) this.uniforms.alphaMap.value = alphaMap;
    }
    
    /**
     * Set blending mode
     */
    setBlending(mode) {
        this.blending = mode;
    }
    
    /**
     * Clone this material
     */
    clone() {
        const material = new ParticleMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            transparent: this.transparent,
            depthWrite: this.depthWrite,
            depthTest: this.depthTest,
            blending: this.blending,
            vertexColors: this.vertexColors,
            sizeAttenuation: this.sizeAttenuation
        });
        
        return material;
    }
}
