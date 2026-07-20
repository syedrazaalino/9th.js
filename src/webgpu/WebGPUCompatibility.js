/**
 * WebGPUCompatibility.js — Feature detection for WebGPU.
 *
 * Safe to import in any environment (Node.js, browsers without WebGPU,
 * browsers with WebGPU). None of the exported functions throw if
 * `navigator.gpu` is undefined — `isWebGPUSupported()` simply returns false.
 */

/**
 * Returns true if the host runtime exposes the WebGPU entry point on
 * `navigator.gpu`. This is a cheap, synchronous check — it does not
 * actually create a device or verify adapter availability.
 *
 * @returns {boolean}
 */
export function hasWebGPU() {
  return (
    typeof navigator !== 'undefined' &&
    navigator !== null &&
    typeof navigator.gpu === 'object' &&
    navigator.gpu !== null &&
    typeof navigator.gpu.requestAdapter === 'function'
  );
}

/**
 * Asynchronously check whether WebGPU is supported AND a usable adapter
 * can be obtained. Resolves to `true` if WebGPU is usable, `false`
 * otherwise. Never rejects — returns false on any failure.
 *
 * @param {object} [options]  Optional adapter-selection hints.
 * @param {GPUPowerPreference} [options.powerPreference]
 * @returns {Promise<boolean>}
 */
export async function isWebGPUSupported(options = {}) {
  if (!hasWebGPU()) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: options.powerPreference || 'high-performance'
    });
    return !!adapter;
  } catch (_) {
    return false;
  }
}

/**
 * Synchronously probe `navigator.gpu` for its preferred swap-chain format.
 *
 * Returns `'bgra8unorm'` or `'rgba8unorm'` when WebGPU is available.
 * Returns `'bgra8unorm'` (the most common default) as a fallback when
 * WebGPU is unavailable — this is a string, never null/undefined, so it
 * can safely be used as a default descriptor field.
 *
 * @returns {'bgra8unorm'|'rgba8unorm'}
 */
export function getPreferredFormat() {
  if (hasWebGPU() && typeof navigator.gpu.getPreferredCanvasFormat === 'function') {
    try {
      const fmt = navigator.gpu.getPreferredCanvasFormat();
      if (fmt === 'rgba8unorm' || fmt === 'bgra8unorm') return fmt;
      return 'bgra8unorm';
    } catch (_) {
      return 'bgra8unorm';
    }
  }
  return 'bgra8unorm';
}

/**
 * Build a structured capabilities object from a GPUDevice.
 *
 * If `device` is null/undefined (e.g. in Node.js), returns a zeroed-out
 * capabilities object with `supported: false` so callers can branch on it.
 *
 * @param {GPUDevice|null|undefined} device
 * @returns {object}
 */
export function getWebGPUCapabilities(device) {
  if (!device) {
    return {
      supported: false,
      webgpu: false,
      maxBufferSize: 0,
      maxTextureDimension1D: 0,
      maxTextureDimension2D: 0,
      maxTextureDimension3D: 0,
      maxTextureArrayLayers: 0,
      maxBindGroups: 0,
      maxBindingsPerBindGroup: 0,
      maxDynamicUniformBuffersPerPipelineLayout: 0,
      maxDynamicStorageBuffersPerPipelineLayout: 0,
      maxSampledTexturesPerShaderStage: 0,
      maxSamplersPerShaderStage: 0,
      maxStorageBuffersPerShaderStage: 0,
      maxStorageTexturesPerShaderStage: 0,
      maxUniformBuffersPerShaderStage: 0,
      maxUniformBufferBindingSize: 0,
      maxStorageBufferBindingSize: 0,
      minUniformBufferOffsetAlignment: 0,
      minStorageBufferOffsetAlignment: 0,
      maxVertexBuffers: 0,
      maxVertexAttributes: 0,
      maxVertexBufferArrayStride: 0,
      maxInterStageShaderVariables: 0,
      maxComputeWorkgroupsPerDimension: 0,
      maxComputeInvocationsPerWorkgroup: 0,
      maxComputeWorkgroupSizeX: 0,
      maxComputeWorkgroupSizeY: 0,
      maxComputeWorkgroupSizeZ: 0,
      features: [],
      preferredFormat: getPreferredFormat()
    };
  }

  /** @type {any} */
  const l = (device.limits) || {};
  /** @type {any} */
  const features = device.features ? Array.from(device.features) : [];

  return {
    supported: true,
    webgpu: true,
    maxBufferSize: l.maxBufferSize || 0,
    maxTextureDimension1D: l.maxTextureDimension1D || 0,
    maxTextureDimension2D: l.maxTextureDimension2D || 0,
    maxTextureDimension3D: l.maxTextureDimension3D || 0,
    maxTextureArrayLayers: l.maxTextureArrayLayers || 0,
    maxBindGroups: l.maxBindGroups || 0,
    maxBindingsPerBindGroup: l.maxBindingsPerBindGroup || 0,
    maxDynamicUniformBuffersPerPipelineLayout: l.maxDynamicUniformBuffersPerPipelineLayout || 0,
    maxDynamicStorageBuffersPerPipelineLayout: l.maxDynamicStorageBuffersPerPipelineLayout || 0,
    maxSampledTexturesPerShaderStage: l.maxSampledTexturesPerShaderStage || 0,
    maxSamplersPerShaderStage: l.maxSamplersPerShaderStage || 0,
    maxStorageBuffersPerShaderStage: l.maxStorageBuffersPerShaderStage || 0,
    maxStorageTexturesPerShaderStage: l.maxStorageTexturesPerShaderStage || 0,
    maxUniformBuffersPerShaderStage: l.maxUniformBuffersPerShaderStage || 0,
    maxUniformBufferBindingSize: l.maxUniformBufferBindingSize || 0,
    maxStorageBufferBindingSize: l.maxStorageBufferBindingSize || 0,
    minUniformBufferOffsetAlignment: l.minUniformBufferOffsetAlignment || 0,
    minStorageBufferOffsetAlignment: l.minStorageBufferOffsetAlignment || 0,
    maxVertexBuffers: l.maxVertexBuffers || 0,
    maxVertexAttributes: l.maxVertexAttributes || 0,
    maxVertexBufferArrayStride: l.maxVertexBufferArrayStride || 0,
    maxInterStageShaderVariables: l.maxInterStageShaderVariables || 0,
    maxComputeWorkgroupsPerDimension: l.maxComputeWorkgroupsPerDimension || 0,
    maxComputeInvocationsPerWorkgroup: l.maxComputeInvocationsPerWorkgroup || 0,
    maxComputeWorkgroupSizeX: l.maxComputeWorkgroupSizeX || 0,
    maxComputeWorkgroupSizeY: l.maxComputeWorkgroupSizeY || 0,
    maxComputeWorkgroupSizeZ: l.maxComputeWorkgroupSizeZ || 0,
    features,
    preferredFormat: getPreferredFormat()
  };
}

/**
 * Default export — a namespace object bundling all the detection helpers,
 * for consumers who prefer `import * as WebGPUCompatibility from '...'`.
 */
export const WebGPUCompatibility = {
  hasWebGPU,
  isWebGPUSupported,
  getPreferredFormat,
  getWebGPUCapabilities
};

export default WebGPUCompatibility;
