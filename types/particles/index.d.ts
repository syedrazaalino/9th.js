/**
 * Particles Module Type Definitions
 * Particle system for effects
 */

// Particle system classes
export class ParticleSystem {
    constructor(options?: any);
    addEmitter(emitter: ParticleEmitter): void;
    update(deltaTime: number): void;
    render(renderer: any, camera: any): void;
}

export class Particle {
    constructor(options?: any);
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    age: number;
    lifetime: number;
}

export class ParticleEmitter {
    constructor(options?: any);
    emit(): Particle | null;
    update(deltaTime: number): void;
}

export class PointEmitter extends ParticleEmitter {}
export class SphereEmitter extends ParticleEmitter {}
export class BoxEmitter extends ParticleEmitter {}
export class ConeEmitter extends ParticleEmitter {}

export class ParticleMaterial {
    constructor(options?: any);
    applyShader(shader: string): void;
}

// Enhanced particle systems
export class FluidSimulation {
    constructor(options?: any);
}

export class SoftBodySimulation {
    constructor(options?: any);
}

export class GPUParticleSystem {
    constructor(options?: any);
}

// Convenience functions
export function createParticleSystem(options?: any): ParticleSystem;
export function createPointEmitter(options?: any): PointEmitter;
export function createSphereEmitter(options?: any): SphereEmitter;
export function createBoxEmitter(options?: any): BoxEmitter;
export function createConeEmitter(options?: any): ConeEmitter;
export function createFireworkSystem(options?: any): { particleSystem: ParticleSystem; emitter: ParticleEmitter };
export function createSmokeSystem(options?: any): { particleSystem: ParticleSystem; emitter: ParticleEmitter };
export function createSparkSystem(options?: any): { particleSystem: ParticleSystem; emitter: ParticleEmitter };
export function createMagicSystem(options?: any): { particleSystem: ParticleSystem; emitter: ParticleEmitter };
export function createFromPreset(presetName: string, customOptions?: any): { particleSystem: ParticleSystem; emitter: ParticleEmitter };

// Presets
export const Presets: {
    firework: any;
    smoke: any;
    sparks: any;
    magic: any;
    rain: any;
    snow: any;
};