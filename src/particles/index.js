// Main particle system exports
export { ParticleSystem } from './ParticleSystem.js';
export { ParticleEmitter, PointEmitter, SphereEmitter, BoxEmitter, ConeEmitter } from './ParticleEmitter.js';
export { Particle } from './Particle.js';
export { ParticleMaterial } from './ParticleMaterial.js';

// Enhanced Particle Systems
export { 
    FluidSimulation, 
    FluidParticle, 
    createDamBreakSimulation, 
    createWaterSplashSimulation 
} from './FluidSimulation.js';

export { 
    SoftBodySimulation, 
    SoftBodyParticle, 
    Constraint, 
    SoftBodyRope 
} from './SoftBodySimulation.js';

export { 
    GPUParticleSystem, 
    GPUFireworkSystem, 
    GPUExplosionSystem 
} from './GPUParticleSystem.js';

/**
 * Convenience function to create a basic particle system
 */
export function createParticleSystem(options = {}) {
    return new ParticleSystem(options);
}

/**
 * Convenience function to create a point emitter
 */
export function createPointEmitter(options = {}) {
    return new PointEmitter(options);
}

/**
 * Convenience function to create a sphere emitter
 */
export function createSphereEmitter(options = {}) {
    return new SphereEmitter(options);
}

/**
 * Convenience function to create a box emitter
 */
export function createBoxEmitter(options = {}) {
    return new BoxEmitter(options);
}

/**
 * Convenience function to create a cone emitter
 */
export function createConeEmitter(options = {}) {
    return new ConeEmitter(options);
}

/**
 * Create a complete particle system with a single emitter
 */
export function createFireworkSystem(options = {}) {
    const particleSystem = new ParticleSystem({
        maxParticles: options.maxParticles || 1000,
        particleSize: options.particleSize || 2.0,
        blending: options.blending || 'additive'
    });
    
    const emitter = new ConeEmitter({
        rate: options.rate || 500,
        particleLifetime: [2, 4],
        initialSpeed: [5, 15],
        initialDirection: { x: 0, y: 1, z: 0 },
        colorStart: { r: 1, g: 0.8, b: 0.2 },
        colorEnd: { r: 1, g: 0.2, b: 0.0 },
        emissionAngle: 45,
        autoplay: true
    });
    
    particleSystem.addEmitter(emitter);
    particleSystem.material.applyShader('fire');
    
    return { particleSystem, emitter };
}

/**
 * Create a smoke particle system
 */
export function createSmokeSystem(options = {}) {
    const particleSystem = new ParticleSystem({
        maxParticles: options.maxParticles || 2000,
        particleSize: options.particleSize || 4.0,
        blending: 'normal'
    });
    
    const emitter = new SphereEmitter({
        rate: options.rate || 100,
        particleLifetime: [3, 8],
        initialSpeed: [0.5, 2],
        colorStart: { r: 0.7, g: 0.7, b: 0.7 },
        colorEnd: { r: 0.3, g: 0.3, b: 0.3 },
        alphaStart: 0.6,
        alphaEnd: 0.0,
        gravity: { x: 0, y: 1, z: 0 },
        emissionRadius: options.emissionRadius || 2.0,
        autoplay: true
    });
    
    particleSystem.addEmitter(emitter);
    particleSystem.material.applyShader('water');
    
    return { particleSystem, emitter };
}

/**
 * Create a spark particle system
 */
export function createSparkSystem(options = {}) {
    const particleSystem = new ParticleSystem({
        maxParticles: options.maxParticles || 500,
        particleSize: options.particleSize || 1.0,
        blending: 'additive'
    });
    
    const emitter = new ConeEmitter({
        rate: options.rate || 300,
        particleLifetime: [0.5, 2],
        initialSpeed: [10, 25],
        colorStart: { r: 1, g: 1, b: 0.9 },
        colorEnd: { r: 1, g: 0.5, b: 0.1 },
        emissionAngle: 30,
        gravity: { x: 0, y: -9.81, z: 0 },
        autoplay: true
    });
    
    particleSystem.addEmitter(emitter);
    particleSystem.material.applyShader('spark');
    
    return { particleSystem, emitter };
}

/**
 * Create a magical particle system
 */
export function createMagicSystem(options = {}) {
    const particleSystem = new ParticleSystem({
        maxParticles: options.maxParticles || 1500,
        particleSize: options.particleSize || 3.0,
        blending: 'additive'
    });
    
    const emitter = new PointEmitter({
        rate: options.rate || 200,
        particleLifetime: [2, 5],
        initialSpeed: [1, 8],
        colorStart: { r: 0.8, g: 0.4, b: 1.0 },
        colorEnd: { r: 0.4, g: 0.8, b: 1.0 },
        alphaStart: 1.0,
        alphaEnd: 0.0,
        autoplay: true
    });
    
    particleSystem.addEmitter(emitter);
    particleSystem.material.applyShader('magic');
    
    return { particleSystem, emitter };
}

/**
 * Default particle system presets
 */
export const Presets = {
    firework: {
        maxParticles: 1000,
        particleSize: 2.0,
        blending: 'additive',
        rate: 500,
        particleLifetime: [2, 4],
        initialSpeed: [5, 15],
        colorStart: { r: 1, g: 0.8, b: 0.2 },
        colorEnd: { r: 1, g: 0.2, b: 0.0 },
        shader: 'fire'
    },
    
    smoke: {
        maxParticles: 2000,
        particleSize: 4.0,
        blending: 'normal',
        rate: 100,
        particleLifetime: [3, 8],
        initialSpeed: [0.5, 2],
        colorStart: { r: 0.7, g: 0.7, b: 0.7 },
        colorEnd: { r: 0.3, g: 0.3, b: 0.3 },
        alphaStart: 0.6,
        alphaEnd: 0.0,
        shader: 'water'
    },
    
    sparks: {
        maxParticles: 500,
        particleSize: 1.0,
        blending: 'additive',
        rate: 300,
        particleLifetime: [0.5, 2],
        initialSpeed: [10, 25],
        colorStart: { r: 1, g: 1, b: 0.9 },
        colorEnd: { r: 1, g: 0.5, b: 0.1 },
        shader: 'spark'
    },
    
    magic: {
        maxParticles: 1500,
        particleSize: 3.0,
        blending: 'additive',
        rate: 200,
        particleLifetime: [2, 5],
        initialSpeed: [1, 8],
        colorStart: { r: 0.8, g: 0.4, b: 1.0 },
        colorEnd: { r: 0.4, g: 0.8, b: 1.0 },
        shader: 'magic'
    },
    
    rain: {
        maxParticles: 3000,
        particleSize: 0.5,
        blending: 'normal',
        rate: 1000,
        particleLifetime: [2, 4],
        initialSpeed: [15, 25],
        colorStart: { r: 0.6, g: 0.7, b: 0.9 },
        colorEnd: { r: 0.4, g: 0.5, b: 0.7 },
        gravity: { x: 0, y: -9.81, z: 0 }
    },
    
    snow: {
        maxParticles: 2000,
        particleSize: 2.0,
        blending: 'normal',
        rate: 150,
        particleLifetime: [5, 10],
        initialSpeed: [0.5, 2],
        colorStart: { r: 1, g: 1, b: 1 },
        colorEnd: { r: 0.9, g: 0.9, b: 1 },
        gravity: { x: 0, y: -1, z: 0 }
    }
};

/**
 * Create a particle system from a preset
 */
export function createFromPreset(presetName, customOptions = {}) {
    const preset = Presets[presetName];
    if (!preset) {
        throw new Error(`Unknown preset: ${presetName}`);
    }
    
    const options = { ...preset, ...customOptions };
    const particleSystem = new ParticleSystem(options);
    
    let emitter;
    switch (options.shape || 'point') {
        case 'sphere':
            emitter = new SphereEmitter(options);
            break;
        case 'box':
            emitter = new BoxEmitter(options);
            break;
        case 'cone':
            emitter = new ConeEmitter(options);
            break;
        default:
            emitter = new PointEmitter(options);
    }
    
    particleSystem.addEmitter(emitter);
    
    // Apply preset shader if specified
    if (options.shader) {
        particleSystem.material.applyShader(options.shader);
    }
    
    return { particleSystem, emitter };
}

/**
 * ENHANCED PARTICLE SYSTEMS
 */

// Fluid Simulation Convenience Functions
export function createFluidSimulation(type = 'damBreak', options = {}) {
    switch (type) {
        case 'damBreak':
            return createDamBreakSimulation(options);
        case 'waterSplash':
            return createWaterSplashSimulation(options);
        case 'custom':
            return new FluidSimulation(options);
        default:
            return createDamBreakSimulation(options);
    }
}

// Soft Body Simulation Convenience Functions
export function createSoftBody(type = 'hangingCloth', options = {}) {
    switch (type) {
        case 'hangingCloth':
            return SoftBodySimulation.createHangingCloth(
                options.width || 10,
                options.height || 8,
                options.segments || 20
            );
        case 'flag':
            return SoftBodySimulation.createFlag(
                options.width || 12,
                options.height || 8,
                options.segments || 24
            );
        case 'rope':
            return new SoftBodyRope(options);
        case 'suspended':
            return SoftBodySimulation.createSuspendedSheet(
                options.width || 10,
                options.height || 10,
                options.segments || 15
            );
        default:
            return SoftBodySimulation.createHangingCloth();
    }
}

// GPU Particle System Convenience Functions
export function createGPUParticles(type = 'basic', options = {}) {
    switch (type) {
        case 'fireworks':
            return new GPUFireworkSystem(options);
        case 'explosion':
            return new GPUExplosionSystem(options);
        case 'basic':
        default:
            return new GPUParticleSystem(options);
    }
}

// Combined demo convenience function
export function createParticleSystemDemo(type = 'fluid', options = {}) {
    switch (type) {
        case 'fluid':
            return createFluidSimulation('damBreak', options);
        case 'cloth':
            return createSoftBody('hangingCloth', options);
        case 'gpu':
            return createGPUParticles('basic', options);
        default:
            return createFluidSimulation('damBreak', options);
    }
}
