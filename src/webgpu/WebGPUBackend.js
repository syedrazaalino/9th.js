/**
 * WebGPUBackend.js — Low-level WebGPU device/context wrapper.
 *
 * Provides a thin abstraction over `navigator.gpu` so that the rest of the
 * engine can talk to WebGPU without having to know about adapter requests,
 * device-loss handling, or context configuration in detail.
 *
 * Safety: This module is importable in any environment (including Node.js
 * without `navigator.gpu`). Constructing a `WebGPUBackend` is cheap; calling
 * `init()` is what actually probes for WebGPU and will throw a clear error
 * if WebGPU is unavailable.
 */

/**
 * Returns true if the global `navigator.gpu` is available (i.e. the host
 * runtime exposes the WebGPU API). Safe to call from Node.js — returns false.
 */
function hasWebGPU() {
  return (
    typeof navigator !== 'undefined' &&
    navigator !== null &&
    typeof navigator.gpu === 'object' &&
    navigator.gpu !== null
  );
}

export class WebGPUBackend {
  /**
   * @param {object} [options]
   * @param {number} [options.sampleCount=4]            MSAA sample count (1 or 4).
   * @param {GPUPowerPreference} [options.powerPreference='high-performance']
   * @param {boolean} [options.depthStencil=true]
   * @param {GPUTextureFormat} [options.format]          Preferred canvas format; auto-detected if omitted.
   * @param {boolean} [options.alpha=false]
   * @param {GPUDevice} [options.device]                 Pre-existing device (skip adapter request).
   */
  constructor(options = {}) {
    this.options = {
      sampleCount: options.sampleCount === 1 ? 1 : 4,
      powerPreference: options.powerPreference || 'high-performance',
      depthStencil: options.depthStencil !== false,
      alpha: !!options.alpha,
      format: options.format || null
    };

    /** @type {GPUDevice|null} */
    this.device = options.device || null;
    /** @type {GPUCanvasContext|null} */
    this.context = null;
    /** @type {HTMLCanvasElement|OffscreenCanvas|null} */
    this.canvas = null;
    /** @type {GPUTextureFormat|null} */
    this.format = this.options.format;
    /** @type {number} */
    this.sampleCount = this.options.sampleCount;

    /** @type {GPUAdapter|null} */
    this.adapter = null;

    /** @type {GPUTexture|null} Current depth/stencil texture (recreated on resize). */
    this._depthTexture = null;
    /** @type {GPUTexture|null} Current MSAA color texture (recreated on resize). */
    this._msaaTexture = null;

    /** @type {number} */
    this._width = 0;
    /** @type {number} */
    this._height = 0;

    /** @type {boolean} */
    this._isInitialized = false;
    /** @type {boolean} */
    this._isLost = false;

    /** @type {(() => void)[]} device-lost listeners */
    this._lostHandlers = [];
  }

  /* --------------------------------------------------------------------- *
   * Initialization
   * --------------------------------------------------------------------- */

  /**
   * Asynchronously request an adapter + device and configure the canvas
   * context for WebGPU rendering.
   *
   * @param {HTMLCanvasElement|OffscreenCanvas} canvas
   * @returns {Promise<WebGPUBackend>} this
   * @throws {Error} if WebGPU is unavailable, no suitable adapter exists,
   *                 or the device request fails.
   */
  async init(canvas) {
    if (!hasWebGPU()) {
      throw new Error(
        '[9th.js WebGPUBackend] WebGPU is not available in this environment ' +
        '(navigator.gpu is undefined). Use a WebGPU-capable browser or ' +
        'fall back to the WebGLRenderer.'
      );
    }
    if (!canvas) {
      throw new Error('[9th.js WebGPUBackend] init(canvas) — canvas is required.');
    }
    if (typeof canvas.getContext !== 'function') {
      throw new Error('[9th.js WebGPUBackend] canvas does not implement getContext().');
    }

    this.canvas = canvas;

    // --- Adapter ---
    try {
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: this.options.powerPreference
      });
    } catch (e) {
      throw new Error(`[9th.js WebGPUBackend] requestAdapter() failed: ${e.message || e}`);
    }
    if (!this.adapter) {
      throw new Error(
        '[9th.js WebGPUBackend] No suitable WebGPU adapter found. ' +
        'The hardware/OS may not support WebGPU.'
      );
    }

    // --- Device ---
    const requiredFeatures = [];
    const requiredLimits = {};
    try {
      this.device = await this.adapter.requestDevice({
        requiredFeatures,
        requiredLimits
      });
    } catch (e) {
      throw new Error(`[9th.js WebGPUBackend] requestDevice() failed: ${e.message || e}`);
    }
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] requestDevice() returned null.');
    }

    // Listen for device loss.
    if (this.device.lost) {
      this.device.lost.then((info) => {
        this._isLost = true;
        const reason = info && info.reason ? info.reason : 'unknown';
        const msg = info && info.message ? info.message : '';
        console.warn(`[9th.js WebGPUBackend] GPUDevice lost (${reason}): ${msg}`);
        for (const cb of this._lostHandlers) {
          try { cb(info); } catch (_) { /* swallow */ }
        }
      }).catch(() => { /* swallow */ });
    }

    // --- Canvas context ---
    try {
      this.context = canvas.getContext('webgpu');
    } catch (e) {
      throw new Error(`[9th.js WebGPUBackend] getContext('webgpu') failed: ${e.message || e}`);
    }
    if (!this.context) {
      throw new Error(
        '[9th.js WebGPUBackend] Canvas getContext("webgpu") returned null. ' +
        'Ensure the canvas is a real HTMLCanvasElement/OffscreenCanvas in a ' +
        'WebGPU-capable browser.'
      );
    }

    // --- Format + configure ---
    if (!this.format) {
      try {
        this.format = navigator.gpu.getPreferredCanvasFormat();
      } catch (_) {
        // Fallback to bgra8unorm (the dominant default on Windows/Linux).
        this.format = 'bgra8unorm';
      }
    }

    this._configure();

    // Initial size tracking.
    const w = canvas.width || (canvas.clientWidth || 0);
    const h = canvas.height || (canvas.clientHeight || 0);
    if (w > 0 && h > 0) {
      this._width = w;
      this._height = h;
    }

    this._isInitialized = true;
    return this;
  }

  /** Configure / reconfigure the GPUCanvasContext. */
  _configure() {
    if (!this.device || !this.context) return;
    const configuration = {
      device: this.device,
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      alphaMode: this.options.alpha ? 'premultiplied' : 'opaque'
    };
    try {
      this.context.configure(configuration);
    } catch (e) {
      throw new Error(`[9th.js WebGPUBackend] context.configure() failed: ${e.message || e}`);
    }
  }

  /* --------------------------------------------------------------------- *
   * Public state
   * --------------------------------------------------------------------- */

  /**
   * Whether `init()` has completed successfully.
   * @returns {boolean}
   */
  isInitialized() {
    return this._isInitialized && !!this.device && !this._isLost;
  }

  /**
   * Whether the underlying GPUDevice has been lost.
   * @returns {boolean}
   */
  isLost() {
    return this._isLost;
  }

  /**
   * Register a callback to be invoked when the GPUDevice is lost.
   * @param {(info: GPUDeviceLostInfo) => void} cb
   */
  onDeviceLost(cb) {
    if (typeof cb === 'function') this._lostHandlers.push(cb);
  }

  /**
   * @returns {GPUDevice|null}
   */
  getDevice() { return this.device; }

  /**
   * @returns {GPUCanvasContext|null}
   */
  getContext() { return this.context; }

  /**
   * @returns {GPUTextureFormat|null}
   */
  getFormat() { return this.format; }

  /**
   * @returns {number}
   */
  getSampleCount() { return this.sampleCount; }

  /* --------------------------------------------------------------------- *
   * Buffer / texture helpers
   * --------------------------------------------------------------------- */

  /**
   * Create a GPUBuffer and (optionally) upload initial data.
   *
   * @param {ArrayBuffer|ArrayBufferView|null} data   If null, allocates zeroed storage of `size` bytes.
   * @param {GPUBufferUsageFlags} usage                Bitmask of GPUBufferUsage.* constants.
   * @param {number} [size]                            Required when data is null.
   * @returns {GPUBuffer}
   */
  createBuffer(data, usage, size) {
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] createBuffer() called before init()');
    }
    let byteLength;
    let view = null;
    if (data) {
      view = data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      byteLength = view.byteLength;
    } else {
      byteLength = Math.max(0, Math.floor(Number(size) || 0));
    }
    if (byteLength === 0) {
      // WebGPU disallows zero-length buffers; allocate 1 byte (rounded up to 4).
      byteLength = 1;
    }

    const buffer = this.device.createBuffer({
      size: Math.ceil(byteLength / 4) * 4, // 4-byte alignment required
      usage,
      mappedAtCreation: !!data
    });

    if (data && view) {
      const mapped = buffer.getMappedRange();
      new Uint8Array(mapped).set(view);
      buffer.unmap();
    }
    return buffer;
  }

  /**
   * Create a GPUTexture from a descriptor.
   * @param {GPUTextureDescriptor} descriptor
   * @returns {GPUTexture}
   */
  createTexture(descriptor) {
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] createTexture() called before init()');
    }
    return this.device.createTexture(descriptor);
  }

  /**
   * Create a sampler from a descriptor.
   * @param {GPUSamplerDescriptor} descriptor
   * @returns {GPUSampler}
   */
  createSampler(descriptor = {}) {
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] createSampler() called before init()');
    }
    return this.device.createSampler(descriptor);
  }

  /**
   * Create a new command encoder.
   * @returns {GPUCommandEncoder}
   */
  createCommandEncoder() {
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] createCommandEncoder() called before init()');
    }
    return this.device.createCommandEncoder();
  }

  /**
   * Submit an array of command buffers to the device queue.
   * @param {GPUCommandBuffer[]} commands
   */
  submit(commands) {
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] submit() called before init()');
    }
    if (!Array.isArray(commands)) commands = [commands];
    this.device.queue.submit(commands);
  }

  /**
   * Write raw bytes into a GPUBuffer at the given offset.
   * @param {GPUBuffer} buffer
   * @param {number} bufferOffset  In bytes.
   * @param {ArrayBuffer|ArrayBufferView} data
   * @param {number} [dataOffset=0]
   * @param {number} [size]
   */
  writeBuffer(buffer, bufferOffset, data, dataOffset = 0, size) {
    if (!this.device) {
      throw new Error('[9th.js WebGPUBackend] writeBuffer() called before init()');
    }
    this.device.queue.writeBuffer(buffer, bufferOffset, data, dataOffset, size);
  }

  /* --------------------------------------------------------------------- *
   * Resize / frame
   * --------------------------------------------------------------------- */

  /**
   * Resize the canvas's drawing buffer. Recreates the internal
   * depth/stencil and MSAA color textures.
   *
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    width = Math.max(1, Math.floor(Number(width) || 1));
    height = Math.max(1, Math.floor(Number(height) || 1));
    if (!this.canvas) return;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this._width = width;
    this._height = height;
    this._recreateAuxTextures();
  }

  /**
   * Get the current drawing-buffer dimensions.
   * @returns {{width:number, height:number}}
   */
  getSize() {
    return { width: this._width, height: this._height };
  }

  /** Lazily (re)create the depth/stencil + MSAA color textures. */
  _recreateAuxTextures() {
    if (!this.device || !this.canvas) return;
    const w = this._width || this.canvas.width || 1;
    const h = this._height || this.canvas.height || 1;

    if (this._depthTexture) {
      try { this._depthTexture.destroy(); } catch (_) { /* noop */ }
      this._depthTexture = null;
    }
    if (this._msaaTexture) {
      try { this._msaaTexture.destroy(); } catch (_) { /* noop */ }
      this._msaaTexture = null;
    }

    if (this.options.depthStencil) {
      this._depthTexture = this.device.createTexture({
        size: [w, h],
        sampleCount: this.sampleCount,
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
    }
    if (this.sampleCount > 1) {
      this._msaaTexture = this.device.createTexture({
        size: [w, h],
        sampleCount: this.sampleCount,
        format: this.format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
    }
  }

  /**
   * Acquire the next frame's color texture view from the swap chain.
   * @returns {GPUTextureView}
   */
  getCurrentTextureView() {
    if (!this.context) {
      throw new Error('[9th.js WebGPUBackend] getCurrentTextureView() called before init()');
    }
    let texture;
    try {
      texture = this.context.getCurrentTexture();
    } catch (e) {
      throw new Error(`[9th.js WebGPUBackend] getCurrentTexture() failed: ${e.message || e}`);
    }
    return texture.createView();
  }

  /**
   * Get (creating if needed) the depth/stencil texture view.
   * @returns {GPUTextureView|null}
   */
  getDepthTextureView() {
    if (!this._depthTexture) this._recreateAuxTextures();
    return this._depthTexture ? this._depthTexture.createView() : null;
  }

  /**
   * Get (creating if needed) the MSAA color texture view.
   * @returns {GPUTextureView|null}
   */
  getMSAATextureView() {
    if (!this._msaaTexture) this._recreateAuxTextures();
    return this._msaaTexture ? this._msaaTexture.createView() : null;
  }

  /* --------------------------------------------------------------------- *
   * Cleanup
   * --------------------------------------------------------------------- */

  /**
   * Release all GPU resources. The backend cannot be reused after destroy().
   */
  destroy() {
    if (this._depthTexture) {
      try { this._depthTexture.destroy(); } catch (_) { /* noop */ }
      this._depthTexture = null;
    }
    if (this._msaaTexture) {
      try { this._msaaTexture.destroy(); } catch (_) { /* noop */ }
      this._msaaTexture = null;
    }
    if (this.context) {
      try { this.context.unconfigure(); } catch (_) { /* noop */ }
      this.context = null;
    }
    if (this.device) {
      try { this.device.destroy(); } catch (_) { /* noop */ }
      this.device = null;
    }
    this.adapter = null;
    this.canvas = null;
    this._isInitialized = false;
    this._isLost = true;
  }
}

export default WebGPUBackend;
