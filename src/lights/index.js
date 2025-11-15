/**
 * Lights module
 * Complete lighting system infrastructure for 3D scenes
 */

// Core light classes (new implementations)
import { AmbientLight } from './AmbientLight.js';
import { DirectionalLight } from './DirectionalLight.js';
import { PointLight } from './PointLight.js';
import { SpotLight } from './SpotLight.js';

export { AmbientLight, DirectionalLight, PointLight, SpotLight };

// Examples and utilities
import { LightScene, demonstrateLightUsage } from './light-examples.js';
export { LightScene, demonstrateLightUsage };

// Legacy exports for compatibility
import { Light } from './Light.js';
import { LightGroup } from './LightGroup.js';
import { LightManager } from './LightManager.js';
import { LightUniforms } from './LightUniforms.js';
export { Light, LightGroup, LightManager, LightUniforms };

// Types and utilities
export {
  LightType,
  ShadowType,
  LightShading,
  LightFlags,
  getLightType,
  requiresShadows,
  getMaxShadowResolution,
  getShadowCameraType,
  validateLightProperties,
  getDefaultLightProperties
} from './LightTypes.js';

// Legacy compatibility exports
export {
  AmbientLight as LegacyAmbientLight,
  DirectionalLight as LegacyDirectionalLight,
  PointLight as LegacyPointLight,
  SpotLight as LegacySpotLight
} from './directional.ts';

// Extended light classes (to be added)
// export { HemisphereLight } from './HemisphereLight.js';
// export { RectAreaLight } from './RectAreaLight.js';
// export { VolumeLight } from './VolumeLight.js';

/**
 * Light factory function for creating lights by type
 * @param {string} type - Type of light ('ambient', 'directional', 'point', 'spot')
 * @param {Object} options - Light options
 * @returns {AmbientLight|DirectionalLight|PointLight|SpotLight} New light instance
 */
export function createLight(type, options = {}) {
  switch (type.toLowerCase()) {
    case 'ambient':
      return new AmbientLight(options.intensity || 0.5, options.color || 0xffffff);
    
    case 'directional':
      return new DirectionalLight(
        options.intensity || 1.0,
        options.color || 0xffffff,
        options.direction || { x: -1, y: -1, z: -1 }
      );
    
    case 'point':
      return new PointLight(
        options.intensity || 1.0,
        options.color || 0xffffff,
        options.position || { x: 0, y: 0, z: 0 },
        options.distance || 0,
        options.decay || 2
      );
    
    case 'spot':
    case 'spotlight':
      return new SpotLight(
        options.intensity || 1.0,
        options.color || 0xffffff,
        options.position || { x: 0, y: 0, z: 0 },
        options.target || { x: 0, y: 0, z: -1 },
        options.angle || Math.PI / 6,
        options.penumbra || 0.3,
        options.distance || 0,
        options.decay || 2
      );
    
    default:
      throw new Error(`Unknown light type: ${type}`);
  }
}

/**
 * Light configuration presets for common scenarios
 */
export const LightPresets = {
  // Ambient light presets
  ambient: {
    moonlight: { intensity: 0.1, color: 0x404080 },
    office: { intensity: 0.3, color: 0xffffff },
    bright: { intensity: 0.6, color: 0xffffff }
  },

  // Directional light presets (sun-like)
  directional: {
    sunlight: { intensity: 1.2, color: 0xfff8dc, direction: { x: -1, y: -1, z: -1 } },
    skylight: { intensity: 0.8, color: 0xc0e0ff, direction: { x: 0, y: -1, z: 0 } },
    evening: { intensity: 0.6, color: 0xffa500, direction: { x: -0.5, y: -0.8, z: 0.3 } }
  },

  // Point light presets
  point: {
    bulb: { intensity: 1.0, color: 0xfff8dc, distance: 10, decay: 2 },
    torch: { intensity: 2.0, color: 0xffdfa0, distance: 8, decay: 1.5 },
    candle: { intensity: 0.8, color: 0xffdfa0, distance: 4, decay: 2 },
    neon: { intensity: 2.5, color: 0xff0080, distance: 6, decay: 1.5 }
  },

  // Spot light presets
  spot: {
    stage: { intensity: 3.0, color: 0xffffff, angle: Math.PI / 6, penumbra: 0.2 },
    flashlight: { intensity: 2.0, color: 0xffffff, angle: Math.PI / 12, penumbra: 0.1 },
    reading: { intensity: 1.5, color: 0xfffef0, angle: Math.PI / 4, penumbra: 0.4 },
    theater: { intensity: 2.5, color: 0xffc0c0, angle: Math.PI / 8, penumbra: 0.3 }
  }
};

/**
 * Create a light using a preset
 * @param {string} type - Light type
 * @param {string} presetName - Preset name
 * @param {Object} overrides - Options to override preset values
 * @returns {AmbientLight|DirectionalLight|PointLight|SpotLight} New light instance
 */
export function createLightFromPreset(type, presetName, overrides = {}) {
  const presets = LightPresets[type.toLowerCase()];
  if (!presets) {
    throw new Error(`Unknown light type for presets: ${type}`);
  }
  
  const preset = presets[presetName];
  if (!preset) {
    throw new Error(`Unknown preset '${presetName}' for ${type} lights`);
  }
  
  const options = { ...preset, ...overrides };
  return createLight(type, options);
}

/**
 * Create a lighting system with default setup
 */
export function createLightingSystem(options = {}) {
  const manager = new LightManager({
    maxLights: options.maxLights || 8,
    maxShadowMaps: options.maxShadowMaps || 4,
    shadowEnabled: options.shadowEnabled !== false,
    autoUpdate: options.autoUpdate !== false,
    frustumCulling: options.frustumCulling !== false,
    frustumCullingDistance: options.frustumCullingDistance || 100
  });
  
  // Create default ambient light
  const ambientLight = manager.createLight(LightType.AMBIENT, {
    intensity: 0.3,
    color: '#404040'
  });
  
  // Create main directional light if requested
  if (options.mainDirectional !== false) {
    const directionalLight = manager.createLight(LightType.DIRECTIONAL, {
      intensity: 1.0,
      color: '#ffffff',
      direction: { x: -1, y: -1, z: -1 },
      castShadow: true,
      shadowBias: 0.0005
    });
    
    // Position the directional light
    if (directionalLight) {
      directionalLight.setPosition(10, 10, 10);
      directionalLight.setRotation(-Math.PI / 4, -Math.PI / 4, 0);
    }
  }
  
  return {
    manager,
    ambientLight,
    createLight: (type, options) => manager.createLight(type, options),
    addLight: (light, group) => manager.addLight(light, group),
    removeLight: (light) => manager.removeLight(light),
    addGroup: (group) => manager.addGroup(group),
    getLightsByType: (type) => manager.getLightsByType(type),
    getShadowCasters: () => manager.getShadowCasters(),
    getActiveLights: (camera) => manager.getActiveLights(camera),
    optimizeLights: (budget) => manager.optimizeLights(budget),
    getStats: () => manager.getStats()
  };
}

/**
 * Lighting presets for common scenarios
 */
export const LightingPresets = {
  // Minimal lighting for performance
  minimal: () => ({
    maxLights: 2,
    maxShadowMaps: 0,
    shadowEnabled: false,
    frustumCulling: true,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.5, color: '#ffffff' }
    ]
  }),
  
  // Standard indoor lighting
  indoor: () => ({
    maxLights: 6,
    maxShadowMaps: 2,
    shadowEnabled: true,
    frustumCulling: true,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.2, color: '#404040' },
      { type: LightType.DIRECTIONAL, intensity: 0.8, color: '#ffffff', direction: { x: 0, y: -1, z: 0 }, castShadow: true }
    ]
  }),
  
  // Outdoor lighting with sky and sun
  outdoor: () => ({
    maxLights: 8,
    maxShadowMaps: 4,
    shadowEnabled: true,
    frustumCulling: true,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.3, color: '#87ceeb' },
      { type: LightType.HEMISPHERE, intensity: 0.6, color: '#ffffff', groundColor: '#8B4513' },
      { type: LightType.DIRECTIONAL, intensity: 1.2, color: '#ffffff', direction: { x: -1, y: -1, z: -0.5 }, castShadow: true }
    ]
  }),
  
  // Studio lighting with multiple spotlights
  studio: () => ({
    maxLights: 10,
    maxShadowMaps: 6,
    shadowEnabled: true,
    frustumCulling: false,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.1, color: '#ffffff' },
      { type: LightType.SPOT, intensity: 1.0, color: '#ffffff', position: { x: 0, y: 5, z: 0 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 3, castShadow: true },
      { type: LightType.SPOT, intensity: 0.8, color: '#ffffff', position: { x: 3, y: 3, z: 3 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4, castShadow: true },
      { type: LightType.SPOT, intensity: 0.8, color: '#ffffff', position: { x: -3, y: 3, z: 3 }, target: { x: 0, y: 0, z: 0 }, angle: Math.PI / 4, castShadow: true }
    ]
  }),
  
  // Night scene with limited lighting
  night: () => ({
    maxLights: 4,
    maxShadowMaps: 2,
    shadowEnabled: true,
    frustumCulling: true,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.05, color: '#1a1a2e' },
      { type: LightType.POINT, intensity: 0.8, color: '#ffffaa', position: { x: 0, y: 2, z: 0 }, distance: 15, castShadow: true }
    ]
  }),
  
  // Performance-focused preset
  performance: () => ({
    maxLights: 4,
    maxShadowMaps: 1,
    shadowEnabled: true,
    frustumCulling: true,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.4, color: '#ffffff' },
      { type: LightType.DIRECTIONAL, intensity: 0.6, color: '#ffffff', direction: { x: -1, y: -1, z: -1 }, castShadow: true }
    ]
  }),
  
  // High quality preset for powerful hardware
  highQuality: () => ({
    maxLights: 16,
    maxShadowMaps: 8,
    shadowEnabled: true,
    frustumCulling: false,
    lights: [
      { type: LightType.AMBIENT, intensity: 0.2, color: '#404040' },
      { type: LightType.HEMISPHERE, intensity: 0.5, color: '#87ceeb', groundColor: '#654321' },
      { type: LightType.DIRECTIONAL, intensity: 1.0, color: '#ffffff', direction: { x: -1, y: -1, z: -0.5 }, castShadow: true },
      { type: LightType.RECT_AREA, intensity: 0.8, color: '#ffffff', width: 5, height: 5 }
    ]
  })
};

/**
 * Apply a lighting preset to a light manager
 */
export function applyLightingPreset(manager, presetName) {
  const preset = LightingPresets[presetName];
  if (!preset) {
    console.warn(`Lighting preset "${presetName}" not found`);
    return;
  }
  
  const config = preset();
  
  // Clear existing lights
  manager.clear();
  
  // Apply configuration
  manager.options.maxLights = config.maxLights;
  manager.options.maxShadowMaps = config.maxShadowMaps;
  manager.options.shadowEnabled = config.shadowEnabled;
  manager.options.frustumCulling = config.frustumCulling;
  
  // Create lights from preset
  config.lights.forEach(lightConfig => {
    manager.createLight(lightConfig.type, lightConfig);
  });
  
  return manager;
}

/**
 * Utility functions for lighting calculations
 */
export const LightingUtils = {
  /**
   * Calculate light intensity at a point
   */
  calculateIntensityAtPoint(light, point) {
    if (!light.position) return light.intensity;
    
    const dx = light.position.x - point.x;
    const dy = light.position.y - point.y;
    const dz = light.position.z - point.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    switch (light.type) {
      case LightType.POINT:
      case LightType.SPOT:
        if (light.distance > 0) {
          return light.intensity / (1.0 + 0.09 * distance + 0.032 * distance * distance);
        }
        return light.intensity;
        
      case LightType.DIRECTIONAL:
        return light.intensity;
        
      default:
        return light.intensity;
    }
  },
  
  /**
   * Get light contribution to a surface
   */
  getLightContribution(light, surfaceNormal, surfacePosition, cameraPosition) {
    if (!light.visible) return { color: [0, 0, 0], intensity: 0 };
    
    let direction, position, distance;
    
    // Determine light direction and position
    switch (light.type) {
      case LightType.DIRECTIONAL:
        direction = light.direction || { x: 0, y: -1, z: 0 };
        break;
        
      case LightType.POINT:
      case LightType.SPOT:
        position = light.position || { x: 0, y: 0, z: 0 };
        direction = {
          x: position.x - surfacePosition.x,
          y: position.y - surfacePosition.y,
          z: position.z - surfacePosition.z
        };
        distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        direction = {
          x: direction.x / distance,
          y: direction.y / distance,
          z: direction.z / distance
        };
        break;
        
      default:
        return { color: [1, 1, 1], intensity: light.intensity * 0.2 };
    }
    
    // Calculate basic diffuse lighting
    const dotProduct = surfaceNormal.x * direction.x + surfaceNormal.y * direction.y + surfaceNormal.z * direction.z;
    const intensity = Math.max(0, dotProduct) * light.intensity;
    
    // Convert color hex to RGB
    const color = this._hexToRgb(light.color);
    
    return {
      color: [color[0] / 255, color[1] / 255, color[2] / 255],
      intensity
    };
  },
  
  /**
   * Convert hex color to RGB array
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [255, 255, 255];
  },
  
  /**
   * Blend multiple light contributions
   */
  blendLights(lightContributions) {
    const blended = { color: [0, 0, 0], intensity: 0 };
    
    lightContributions.forEach(contrib => {
      blended.color[0] += contrib.color[0] * contrib.intensity;
      blended.color[1] += contrib.color[1] * contrib.intensity;
      blended.color[2] += contrib.color[2] * contrib.intensity;
      blended.intensity += contrib.intensity;
    });
    
    // Normalize color
    const maxComponent = Math.max(blended.color[0], blended.color[1], blended.color[2]);
    if (maxComponent > 1) {
      blended.color = blended.color.map(c => c / maxComponent);
    }
    
    return blended;
  }
};

// Version information
export const VERSION = '1.0.0';
export const LIGHTS_MODULE_VERSION = '1.0.0';

/**
 * Light utility functions
 */
export const LightUtils = {
  /**
   * Convert color temperature to RGB color
   * @param {number} temperature - Color temperature in Kelvin (1000-40000)
   * @returns {Color} Color object
   */
  colorTemperatureToRGB(temperature) {
    const temp = Math.max(1000, Math.min(40000, temperature)) / 100;
    
    let r, g, b;
    
    if (temp <= 66) {
      r = 255;
      g = temp;
      g = 99.4708025861 * Math.log(g) - 161.1195681661;
      b = temp <= 19 ? 0 : (138.5177312231 * Math.log(temp - 10) - 305.0447927307);
    } else {
      r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
      g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
      b = 255;
    }
    
    return {
      r: Math.max(0, Math.min(255, r)) / 255,
      g: Math.max(0, Math.min(255, g)) / 255,
      b: Math.max(0, Math.min(255, b)) / 255
    };
  },

  /**
   * Calculate light intensity needed for desired illuminance
   * @param {number} illuminance - Desired illuminance in lux
   * @param {number} distance - Distance from light to surface
   * @param {number} area - Surface area
   * @returns {number} Required light intensity
   */
  calculateRequiredIntensity(illuminance, distance, area = 1) {
    // Basic inverse square law: illuminance = intensity / (distance²)
    // intensity = illuminance × distance²
    return illuminance * distance * distance / area;
  },

  /**
   * Convert between different light measurement units
   */
  convertLightUnits: {
    /**
     * Convert candela to lumens
     * @param {number} candela - Candela value
     * @param {number} angle - Beam angle in radians
     * @returns {number} Lumen value
     */
    candelaToLumens(candela, angle) {
      const solidAngle = 2 * Math.PI * (1 - Math.cos(angle / 2));
      return candela * solidAngle;
    },

    /**
     * Convert lumens to candela
     * @param {number} lumens - Lumen value
     * @param {number} angle - Beam angle in radians
     * @returns {number} Candela value
     */
    lumensToCandela(lumens, angle) {
      const solidAngle = 2 * Math.PI * (1 - Math.cos(angle / 2));
      return lumens / solidAngle;
    }
  },

  /**
   * Common color presets for different light types
   */
  colorPresets: {
    // Color temperature colors
    candlelight: () => LightUtils.colorTemperatureToRGB(1800),
    tungsten: () => LightUtils.colorTemperatureToRGB(2700),
    halogen: () => LightUtils.colorTemperatureToRGB(3200),
    daylight: () => LightUtils.colorTemperatureToRGB(5600),
    fluorescent: () => LightUtils.colorTemperatureToRGB(6500),
    
    // Named colors
    warmWhite: () => ({ r: 1.0, g: 0.95, b: 0.8 }),
    coolWhite: () => ({ r: 0.8, g: 0.9, b: 1.0 }),
    neonRed: () => ({ r: 1.0, g: 0.0, b: 0.5 }),
    neonGreen: () => ({ r: 0.0, g: 1.0, b: 0.5 }),
    neonBlue: () => ({ r: 0.0, g: 0.5, b: 1.0 }),
    fire: () => ({ r: 1.0, g: 0.3, b: 0.0 }),
    ice: () => ({ r: 0.7, g: 0.9, b: 1.0 })
  }
};

// Default export removed for UMD compatibility
// Use named exports instead
