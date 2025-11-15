/**
 * Light Examples
 * Demonstrates usage of all light types in a practical scene setup
 */

import { AmbientLight } from './AmbientLight.js';
import { DirectionalLight } from './DirectionalLight.js';
import { PointLight } from './PointLight.js';
import { SpotLight } from './SpotLight.js';
import { Vec3, Color } from '../extras/helpers.ts';

export class LightScene {
  constructor() {
    this.lights = {
      ambient: null,
      directional: null,
      pointLights: [],
      spotLights: []
    };
    this.scene = null;
    this.renderer = null;
  }

  /**
   * Set up a basic outdoor scene with sunlight
   */
  setupOutdoorScene() {
    console.log('Setting up outdoor scene...');

    // Ambient light for base illumination
    this.lights.ambient = new AmbientLight(0.3, 0x404060); // Slightly blue ambient
    
    // Main sun directional light
    this.lights.directional = new DirectionalLight(1.2, '#fff8dc', new Vec3(-1, -1, -1));
    this.lights.directional.setPosition(50, 50, 50);
    this.lights.directional.setTarget(0, 0, 0);
    
    // Configure realistic shadows
    this.lights.directional.configureShadow({
      mapSize: 2048,
      bias: 0.0001,
      intensity: 1.0,
      camera: {
        left: -30,
        right: 30,
        top: 30,
        bottom: -30,
        near: 0.1,
        far: 100
      }
    });

    console.log('Outdoor scene setup complete');
    console.log('Sun position:', this.lights.directional.position);
    console.log('Sun direction:', this.lights.directional.direction);
  }

  /**
   * Set up an indoor scene with multiple light sources
   */
  setupIndoorScene() {
    console.log('Setting up indoor scene...');

    // Soft ambient light
    this.lights.ambient = new AmbientLight(0.2, '#e6f3ff'); // Cool blue ambient

    // Main ceiling directional light (simulating window light)
    this.lights.directional = new DirectionalLight(0.8, '#ffffff', new Vec3(0, -1, 0));
    this.lights.directional.setPosition(0, 5, 0);
    this.lights.directional.setTarget(0, 0, 0);
    this.lights.directional.configureShadow({
      mapSize: 1024,
      bias: 0.001,
      intensity: 0.8
    });

    // Table lamp (point light)
    const tableLamp = new PointLight(1.5, '#fff8dc', new Vec3(0, 2, 0), 8, 1.2);
    this.lights.pointLights.push(tableLamp);

    // Overhead pendant light
    const pendantLight = new PointLight(1.0, '#ffffff', new Vec3(-2, 3, -2), 6, 2.0);
    this.lights.pointLights.push(pendantLight);

    // Reading lamp (spotlight)
    const readingLamp = new SpotLight(
      2.0, // intensity
      '#fffef0', // warm white
      new Vec3(2, 2, 1), // position
      new Vec3(2, 1, 1), // target (reading area)
      Math.PI / 6, // 30 degrees
      0.4 // 40% penumbra
    );
    readingLamp.setAttenuation(10, 1.5);
    this.lights.spotLights.push(readingLamp);

    console.log('Indoor scene setup complete');
    console.log('Point lights:', this.lights.pointLights.length);
    console.log('Spot lights:', this.lights.spotLights.length);
  }

  /**
   * Set up a dramatic scene with colored lighting
   */
  setupDramaticScene() {
    console.log('Setting up dramatic scene...');

    // Dark ambient for dramatic effect
    this.lights.ambient = new AmbientLight(0.1, '#1a1a2e');

    // Main key light (directional)
    this.lights.directional = new DirectionalLight(1.5, '#ffffff', new Vec3(-0.5, -1, 0.5));
    this.lights.directional.setPosition(10, 15, 10);
    this.lights.directional.setTarget(0, 0, 0);
    this.lights.directional.configureShadow({
      mapSize: 4096,
      bias: 0.0005,
      intensity: 1.2
    });

    // Colorful accent lights (point lights)
    const redLight = new PointLight(0.8, '#ff0040', new Vec3(-3, 1, -3), 5, 2.0);
    const blueLight = new PointLight(0.6, '#0080ff', new Vec3(3, 1, 3), 4, 2.0);
    const greenLight = new PointLight(0.7, '#00ff80', new Vec3(-3, 1, 3), 4, 2.0);

    this.lights.pointLights.push(redLight, blueLight, greenLight);

    // Stage spotlight
    const stageSpot = new SpotLight(
      3.0,
      '#ffffff',
      new Vec3(0, 6, 0),
      new Vec3(0, 0, 0), // Look straight down
      Math.PI / 8, // 22.5 degrees
      0.2 // 20% penumbra
    );
    stageSpot.setAttenuation(20, 1.0);
    this.lights.spotLights.push(stageSpot);

    console.log('Dramatic scene setup complete');
  }

  /**
   * Create a futuristic scene with neon-like lighting
   */
  setupFuturisticScene() {
    console.log('Setting up futuristic scene...');

    // Cyber blue ambient
    this.lights.ambient = new AmbientLight(0.15, '#001122');

    // Harsh overhead directional light
    this.lights.directional = new DirectionalLight(2.0, '#c0e0ff', new Vec3(0, -1, 0));
    this.lights.directional.setPosition(0, 10, 0);
    this.lights.directional.configureShadow({
      mapSize: 8192,
      bias: 0.0001,
      intensity: 1.8
    });

    // Neon strips (point lights with high intensity)
    const neonColors = [
      { color: '#ff0080', position: new Vec3(-4, 1, 0) },
      { color: '#00ff80', position: new Vec3(4, 1, 0) },
      { color: '#0080ff', position: new Vec3(0, 1, -4) },
      { color: '#ffff00', position: new Vec3(0, 1, 4) },
      { color: '#ff4000', position: new Vec3(-2, 1, -2) },
      { color: '#8000ff', position: new Vec3(2, 1, 2) }
    ];

    neonColors.forEach(neon => {
      const light = new PointLight(2.5, neon.color, neon.position, 6, 1.5);
      light.castShadow = false; // Neon typically doesn't cast hard shadows
      this.lights.pointLights.push(light);
    });

    // Scanning spotlight
    const scanner = new SpotLight(
      4.0,
      '#00ffff',
      new Vec3(0, 2, 0),
      new Vec3(0, 0, 0),
      Math.PI / 12, // 15 degrees
      0.1 // Very sharp edge
    );
    scanner.setAttenuation(15, 2.0);
    this.lights.spotLights.push(scanner);

    console.log('Futuristic scene setup complete');
  }

  /**
   * Demonstrate light animations
   */
  setupAnimatedScene() {
    console.log('Setting up animated scene...');

    this.lights.ambient = new AmbientLight(0.2, '#ffffff');

    // Flickering candle (point light)
    const candle = new PointLight(1.0, '#ffdfa0', new Vec3(0, 1, 0), 4, 2.0);
    candle._flickerPhase = Math.random() * Math.PI * 2;
    this.lights.pointLights.push(candle);

    // Rotating spotlight
    const rotSpot = new SpotLight(2.0, '#ffffff', new Vec3(0, 4, 0));
    rotSpot._rotationSpeed = 0.5;
    rotSpot._centerTarget = new Vec3(0, 0, 0);
    this.lights.spotLights.push(rotSpot);

    // Pulsing neon (point light)
    const neon = new PointLight(1.5, '#ff0080', new Vec3(3, 1, 0), 5, 1.8);
    neon._pulsePhase = Math.random() * Math.PI * 2;
    neon._pulseSpeed = 2.0;
    this.lights.pointLights.push(neon);

    console.log('Animated scene setup complete');
  }

  /**
   * Update animated lights
   * Call this in your animation loop
   */
  updateAnimatedLights(deltaTime, time) {
    // Flickering candle
    const candle = this.lights.pointLights[0];
    if (candle && candle._flickerPhase !== undefined) {
      candle._flickerPhase += deltaTime * 8;
      const flicker = 0.8 + Math.sin(candle._flickerPhase) * 0.2 + 
                     (Math.random() - 0.5) * 0.1;
      candle.setIntensity(Math.max(0.5, flicker));
    }

    // Rotating spotlight
    const rotSpot = this.lights.spotLights[0];
    if (rotSpot && rotSpot._rotationSpeed !== undefined) {
      const angle = time * rotSpot._rotationSpeed;
      const radius = 2;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      rotSpot.setPosition(x, 4, z);
      
      const target = rotSpot._centerTarget;
      rotSpot.setTarget(target.x, target.y, target.z);
    }

    // Pulsing neon
    const neon = this.lights.pointLights[1];
    if (neon && neon._pulsePhase !== undefined) {
      neon._pulsePhase += deltaTime * neon._pulseSpeed;
      const pulse = 1.0 + Math.sin(neon._pulsePhase) * 0.5;
      neon.setIntensity(pulse);
    }
  }

  /**
   * Get all lights in the scene
   */
  getAllLights() {
    const allLights = [];
    
    if (this.lights.ambient) allLights.push(this.lights.ambient);
    if (this.lights.directional) allLights.push(this.lights.directional);
    allLights.push(...this.lights.pointLights);
    allLights.push(...this.lights.spotLights);
    
    return allLights;
  }

  /**
   * Update all lights (call each frame)
   */
  update(deltaTime) {
    this.getAllLights().forEach(light => {
      if (light.update) {
        light.update(deltaTime);
      }
    });
  }

  /**
   * Clean up all light resources
   */
  dispose() {
    this.getAllLights().forEach(light => {
      if (light.dispose) {
        light.dispose();
      }
    });
    
    this.lights = {
      ambient: null,
      directional: null,
      pointLights: [],
      spotLights: []
    };
  }

  /**
   * Convert scene to JSON for serialization
   */
  toJSON() {
    return {
      lights: {
        ambient: this.lights.ambient?.toJSON(),
        directional: this.lights.directional?.toJSON(),
        pointLights: this.lights.pointLights.map(light => light.toJSON()),
        spotLights: this.lights.spotLights.map(light => light.toJSON())
      }
    };
  }

  /**
   * Create a new scene from JSON data
   */
  static fromJSON(data) {
    const scene = new LightScene();
    
    if (data.lights.ambient) {
      scene.lights.ambient = new AmbientLight(
        data.lights.ambient.intensity,
        data.lights.ambient.color
      );
    }
    
    if (data.lights.directional) {
      const dirData = data.lights.directional;
      scene.lights.directional = new DirectionalLight(
        dirData.intensity,
        dirData.color,
        dirData.direction
      );
      scene.lights.directional.position = dirData.position;
      scene.lights.directional.target = dirData.target;
    }
    
    // Restore point lights
    if (data.lights.pointLights) {
      scene.lights.pointLights = data.lights.pointLights.map(lightData => {
        const light = new PointLight(
          lightData.intensity,
          lightData.color,
          lightData.position,
          lightData.distance,
          lightData.decay
        );
        return light;
      });
    }
    
    // Restore spot lights
    if (data.lights.spotLights) {
      scene.lights.spotLights = data.lights.spotLights.map(lightData => {
        const light = new SpotLight(
          lightData.intensity,
          lightData.color,
          lightData.position,
          lightData.target,
          lightData.angle,
          lightData.penumbra,
          lightData.distance,
          lightData.decay
        );
        return light;
      });
    }
    
    return scene;
  }
}

// Example usage
export function demonstrateLightUsage() {
  console.log('=== Lighting System Demonstration ===\n');
  
  // 1. Basic outdoor scene
  console.log('1. Outdoor Scene:');
  const outdoorScene = new LightScene();
  outdoorScene.setupOutdoorScene();
  console.log('Lights created:', outdoorScene.getAllLights().length);
  console.log('Ambient intensity:', outdoorScene.lights.ambient.intensity);
  console.log('Sun intensity:', outdoorScene.lights.directional.intensity);
  
  console.log('\n2. Indoor Scene:');
  const indoorScene = new LightScene();
  indoorScene.setupIndoorScene();
  console.log('Point lights:', indoorScene.lights.pointLights.length);
  console.log('Spot lights:', indoorScene.lights.spotLights.length);
  
  // 3. Spotlight details
  const spotlight = indoorScene.lights.spotLights[0];
  console.log('Reading lamp angle:', spotlight.angle * 180 / Math.PI, 'degrees');
  console.log('Reading lamp penumbra:', spotlight.penumbra * 100, '%');
  
  // 4. Point light attenuation
  const tableLamp = indoorScene.lights.pointLights[0];
  console.log('Table lamp range:', tableLamp.distance, 'units');
  console.log('Table lamp decay:', tableLamp.decay);
  
  // 5. Calculate light contribution
  const samplePosition = new Vec3(1, 1, 1);
  const contribution = tableLamp.calculateContribution({
    position: samplePosition,
    normal: new Vec3(0, 1, 0),
    cameraPosition: new Vec3(5, 5, 5)
  });
  console.log('Light contribution at (1,1,1):', contribution);
  
  console.log('\n=== Demonstration Complete ===');
}

// Export additional utility functions
export function createSimpleIndoorScene() {
  const scene = new LightScene();
  scene.setupIndoorScene();
  return scene;
}

export function createSimpleOutdoorScene() {
  const scene = new LightScene();
  scene.setupOutdoorScene();
  return scene;
}
