/**
 * 9th.js Utils Module
 * 
 * Contains utility functions, helpers, and shared utilities
 */

// Math utilities
export * from './math/MathUtils.js';
export * from './math/Vector3.js';
export * from './math/Matrix4.js';
export * from './math/Quaternion.js';
export * from './math/Euler.js';
export * from './math/Box3.js';
export * from './math/Sphere.js';
export * from './math/Color.js';

// String utilities
export * from './string/StringUtils.js';
export * from './string/UUID.js';
export * from './string/Hash.js';

// Array utilities
export * from './array/ArrayUtils.js';
export * from './array/Float32ArrayUtils.js';
export * from './array/Uint32ArrayUtils.js';

// Object utilities
export * from './object/ObjectUtils.js';
export * from './object/CloneUtils.js';
export * from './object/MergeUtils.js';

// Function utilities
export * from './function/FunctionUtils.js';
export * from './function/Throttle.js';
export * from './function/Debounce.js';
export * from './function/Once.js';

// Async utilities
export * from './async/AsyncUtils.js';
export * from './async/PromiseUtils.js';
export * from './async/AwaitUtils.js';

// File utilities
export * from './file/FileUtils.js';
export * from './file/ImageUtils.js';
export * from './file/DataURLUtils.js';

// Performance utilities
export * from './performance/PerformanceUtils.js';
export * from './performance/Profiling.js';
export * from './performance/Benchmark.js';

// WebGL utilities
export * from './webgl/WebGLUtils.js';
export * from './webgl/ShaderUtils.js';
export * from './webgl/BufferUtils.js';
export * from './webgl/TextureUtils.js';
export * from './webgl/UniformUtils.js';

// Validation utilities
export * from './validation/TypeValidation.js';
export * from './validation/RangeValidation.js';
export * from './validation/RequiredValidation.js';

// Configuration utilities
export * from './config/ConfigManager.js';
export * from './config/EnvironmentDetection.js';

// Export commonly used utilities
export const utilsVersion = '0.1.0';

// Quick utility functions
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return (...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const isWebGLSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
};

export const getWebGLVersion = () => {
  if (!isWebGLSupported()) return 0;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext('webgl2')) return 2;
  return 1;
};