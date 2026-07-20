/**
 * src/webgpu/index.js — WebGPU subsystem exports.
 *
 * Importable in any environment (Node.js, browsers without WebGPU).
 * Importing this module never throws; only `init()` / `isWebGPUSupported()`
 * actually probe for WebGPU at runtime.
 */

export { WebGPUBackend } from './WebGPUBackend.js';
export { WebGPURenderer } from './WebGPURenderer.js';
export {
  hasWebGPU,
  isWebGPUSupported,
  getPreferredFormat,
  getWebGPUCapabilities,
  WebGPUCompatibility
} from './WebGPUCompatibility.js';

// Default export — convenience namespace.
import * as WebGPUNamespace from './WebGPUCompatibility.js';
export default WebGPUNamespace;
