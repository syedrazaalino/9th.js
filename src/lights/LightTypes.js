/**
 * Light Types Enumeration
 * Defines all supported light types in the lighting system
 */

export const LightType = {
  AMBIENT: 'AmbientLight',
  DIRECTIONAL: 'DirectionalLight',
  POINT: 'PointLight',
  SPOT: 'SpotLight',
  HEMISPHERE: 'HemisphereLight',
  RECT_AREA: 'RectAreaLight',
  SPHERE: 'SphereLight',
  DISK: 'DiskLight',
  VOLUME: 'VolumeLight'
};

export const ShadowType = {
  NONE: 0,
  BASIC_SHADOW_MAP: 1,
  PCF_SHADOW_MAP: 2,
  PCF_SOFT_SHADOW_MAP: 3,
  VSM_SHADOW_MAP: 4
};

export const LightShading = {
  UNLIT: 'unlit',
  LAMBERT: 'lambert',
  PHONG: 'phong',
  BLINN_PHONG: 'blinn-phong',
  PBR: 'pbr',
  TOON: 'toon',
  NPR: 'npr' // Non-photorealistic rendering
};

export const LightFlags = {
  REQUIRE_SHADOWS: 1 << 0,
  REQUIRE_UNIFORM_UPDATE: 1 << 1,
  REQUIRE_TRANSFORM_UPDATE: 1 << 2,
  DYNAMIC: 1 << 3,
  STATIC: 1 << 4,
  VOLUME_LIGHT: 1 << 5,
  AREA_LIGHT: 1 << 6,
  ENVIRONMENT_LIGHT: 1 << 7
};

/**
 * Get light type string from constructor/class name
 */
export function getLightType(light) {
  if (!light) return null;
  
  const type = light.type || light.constructor.name;
  return type;
}

/**
 * Check if light type requires shadows
 */
export function requiresShadows(lightType) {
  switch (lightType) {
    case LightType.DIRECTIONAL:
    case LightType.POINT:
    case LightType.SPOT:
    case LightType.SPHERE:
    case LightType.DISK:
      return true;
    case LightType.AMBIENT:
    case LightType.HEMISPHERE:
    case LightType.RECT_AREA:
    case LightType.VOLUME:
      return false;
    default:
      return false;
  }
}

/**
 * Get maximum shadow resolution for light type
 */
export function getMaxShadowResolution(lightType) {
  switch (lightType) {
    case LightType.DIRECTIONAL:
    case LightType.SPOT:
      return 2048;
    case LightType.POINT:
    case LightType.SPHERE:
    case LightType.DISK:
      return 1024;
    case LightType.AMBIENT:
    case LightType.HEMISPHERE:
    case LightType.RECT_AREA:
    case LightType.VOLUME:
      return 0; // No shadows
    default:
      return 1024;
  }
}

/**
 * Get shadow camera type for light type
 */
export function getShadowCameraType(lightType) {
  switch (lightType) {
    case LightType.DIRECTIONAL:
    case LightType.SPOT:
    case LightType.RECT_AREA:
      return 'orthographic';
    case LightType.POINT:
    case LightType.SPHERE:
    case LightType.DISK:
      return 'perspective';
    case LightType.AMBIENT:
    case LightType.HEMISPHERE:
    case LightType.VOLUME:
      return null; // No shadows
    default:
      return null;
  }
}

/**
 * Validate light properties based on type
 */
export function validateLightProperties(light) {
  const errors = [];
  
  if (!light.color) {
    errors.push('Light must have a color property');
  }
  
  if (typeof light.intensity !== 'number' || light.intensity < 0) {
    errors.push('Light intensity must be a non-negative number');
  }
  
  if (light.castShadow && !requiresShadows(getLightType(light))) {
    errors.push(`${getLightType(light)} does not support shadows`);
  }
  
  // Type-specific validations
  switch (getLightType(light)) {
    case LightType.POINT:
    case LightType.SPHERE:
      if (light.distance !== undefined && light.distance < 0) {
        errors.push('Point light distance must be non-negative');
      }
      if (light.decay !== undefined && (light.decay < 0 || light.decay > 2)) {
        errors.push('Point light decay must be between 0 and 2');
      }
      break;
      
    case LightType.SPOT:
      if (light.angle !== undefined && (light.angle < 0 || light.angle > Math.PI)) {
        errors.push('Spot light angle must be between 0 and π radians');
      }
      if (light.penumbra !== undefined && (light.penumbra < 0 || light.penumbra > 1)) {
        errors.push('Spot light penumbra must be between 0 and 1');
      }
      break;
  }
  
  return errors;
}

/**
 * Get default properties for light type
 */
export function getDefaultLightProperties(lightType) {
  const defaults = {
    [LightType.AMBIENT]: {
      color: '#404040',
      intensity: 0.4,
      castShadow: false
    },
    [LightType.DIRECTIONAL]: {
      color: '#ffffff',
      intensity: 1.0,
      castShadow: true,
      shadowBias: 0.0005
    },
    [LightType.POINT]: {
      color: '#ffffff',
      intensity: 1.0,
      castShadow: true,
      distance: 0,
      decay: 2
    },
    [LightType.SPOT]: {
      color: '#ffffff',
      intensity: 1.0,
      castShadow: true,
      angle: Math.PI / 6,
      penumbra: 0.3,
      distance: 0,
      decay: 2
    },
    [LightType.HEMISPHERE]: {
      color: '#ffffff',
      groundColor: '#444444',
      intensity: 0.6,
      castShadow: false
    },
    [LightType.RECT_AREA]: {
      color: '#ffffff',
      intensity: 1.0,
      castShadow: false,
      width: 10,
      height: 10
    },
    [LightType.VOLUME]: {
      color: '#ffffff',
      intensity: 1.0,
      castShadow: false,
      volumeSize: 1.0,
      scattering: 0.1
    }
  };
  
  return defaults[lightType] || defaults[LightType.AMBIENT];
}
