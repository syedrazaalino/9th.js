/**
 * WebGPURenderer.js — Minimal WebGPU renderer (preview).
 *
 * Mirrors the public API shape of WebGLRenderer:
 *   - constructor(canvas, options)
 *   - async init()
 *   - render(scene, camera)
 *   - setSize(w, h)
 *   - setClearColor(color)
 *   - setPixelRatio(r)
 *   - dispose()
 *   - capabilities
 *
 * Status: PREVIEW. The current `render()` implementation just clears the
 * screen with a solid color — a full WebGPU renderer would need WGSL
 * shaders for every material type, scene-graph traversal, bind groups,
 * pipeline caching, etc. That work is intentionally deferred; the goal of
 * this layer is to let users opt-in to WebGPU today (`createRenderer({
 * preferWebGPU: true })`) so we can ship the plumbing without rewriting
 * every material system.
 *
 * The `isWebGPU = true` flag lets downstream code (e.g. `createRenderer`)
 * detect which kind of renderer was returned.
 */

import { WebGPUBackend } from './WebGPUBackend.js';
import { getWebGPUCapabilities } from './WebGPUCompatibility.js';

export class WebGPURenderer {
  /** Set to `true` on every WebGPURenderer instance for runtime detection. */
  isWebGPU = true;

  /**
   * @param {HTMLCanvasElement|OffscreenCanvas|{canvas:HTMLCanvasElement,...options}} canvas
   * @param {object} [options]
   */
  constructor(canvas, options = {}) {
    // Three.js-style constructor: new WebGPURenderer({ canvas, ... })
    if (canvas && typeof canvas === 'object' && canvas.canvas && typeof canvas.canvas.getContext === 'function') {
      options = { ...canvas, ...options };
      canvas = canvas.canvas;
    }

    this.canvas = canvas;
    this.options = {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      sampleCount: options.antialias === false ? 1 : 4,
      ...options
    };

    /** @type {WebGPUBackend|null} */
    this.backend = null;

    /** Compatibility surface — mirrors WebGLRenderer.capabilities. */
    this.capabilities = { webgpu: true };

    // Render settings (mirrors WebGLRenderer).
    this.autoClear = true;
    this.autoClearColor = true;
    this.autoClearDepth = true;
    this.autoClearStencil = true;
    this.clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
    this.clearDepth = 1.0;
    this.clearStencil = 0;
    this._pixelRatio = 1;
    this._width = 0;
    this._height = 0;

    // Performance metrics (mirrors WebGLRenderer.performance shape).
    this.performance = {
      frameTime: 0,
      renderTime: 0,
      drawCalls: 0,
      triangles: 0,
      vertices: 0,
      lastFrameTime: 0,
      fps: 60,
      memoryUsage: 0
    };

    /** Whether init() has been awaited successfully. */
    this._initialized = false;
  }

  /* --------------------------------------------------------------------- *
   * Lifecycle
   * --------------------------------------------------------------------- */

  /**
   * Asynchronously initialize the WebGPU backend. Must be awaited before
   * calling `render()`.
   *
   * @returns {Promise<this>}
   * @throws {Error} if WebGPU is unavailable or initialization fails.
   */
  async init() {
    if (this._initialized) return this;

    this.backend = new WebGPUBackend({
      sampleCount: this.options.sampleCount,
      powerPreference: this.options.powerPreference,
      alpha: this.options.alpha
    });
    await this.backend.init(this.canvas);

    // Initial size from the canvas's drawing buffer.
    const w = this.canvas.width || (this.canvas.clientWidth || 1);
    const h = this.canvas.height || (this.canvas.clientHeight || 1);
    this.setSize(w, h);

    // Populate capabilities from the device.
    try {
      this.capabilities = {
        ...this.capabilities,
        ...getWebGPUCapabilities(this.backend.device)
      };
    } catch (_) {
      // ignore — keep the { webgpu: true } minimum
    }

    this._initialized = true;
    return this;
  }

  /**
   * @returns {boolean}
   */
  isInitialized() {
    return this._initialized && this.backend && this.backend.isInitialized();
  }

  /* --------------------------------------------------------------------- *
   * Sizing
   * --------------------------------------------------------------------- */

  /**
   * Set the drawing-buffer size (in physical pixels).
   * @param {number} width
   * @param {number} height
   * @returns {this}
   */
  setSize(width, height) {
    width = Math.max(1, Math.floor(Number(width) || 1));
    height = Math.max(1, Math.floor(Number(height) || 1));
    const displayWidth = Math.floor(width * (this._pixelRatio || 1));
    const displayHeight = Math.floor(height * (this._pixelRatio || 1));

    if (this.canvas) {
      if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
      }
      if (this.canvas.style) {
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
      }
    }

    this._width = width;
    this._height = height;

    if (this.backend && this.backend.isInitialized()) {
      this.backend.setSize(displayWidth, displayHeight);
    }
    return this;
  }

  /**
   * Set the device pixel ratio multiplier.
   * @param {number} value
   * @returns {this}
   */
  setPixelRatio(value) {
    this._pixelRatio = Math.max(0.1, Number(value) || 1);
    if (this._width && this._height) {
      this.setSize(this._width, this._height);
    }
    return this;
  }

  /**
   * @returns {number}
   */
  getPixelRatio() {
    return this._pixelRatio || 1;
  }

  /**
   * @param {{width:number,height:number}} [target]
   * @returns {{width:number,height:number}}
   */
  getSize(target = { width: 0, height: 0 }) {
    target.width = this._width;
    target.height = this._height;
    return target;
  }

  /**
   * @param {{width:number,height:number}} [target]
   * @returns {{width:number,height:number}}
   */
  getDrawingBufferSize(target = { width: 0, height: 0 }) {
    target.width = this.canvas ? this.canvas.width : 0;
    target.height = this.canvas ? this.canvas.height : 0;
    return target;
  }

  /* --------------------------------------------------------------------- *
   * Clear color
   * --------------------------------------------------------------------- */

  /**
   * Set the clear color. Accepts:
   *   - { r, g, b } or { r, g, b, a } (any 0..1 or 0..255 form)
   *   - a hex number (0xff0000)
   *   - a hex string ('#ff0000' or 'ff0000')
   *   - an array [r, g, b] or [r, g, b, a]
   *   - a Color instance with .r/.g/.b
   * @param {Color|{r:number,g:number,b:number,a?:number}|number|string|number[]} color
   * @param {number} [alpha=1]
   * @returns {this}
   */
  setClearColor(color, alpha = 1.0) {
    if (color == null) return this;
    if (typeof color === 'number' && Number.isFinite(color)) {
      // hex
      const hex = color;
      this.clearColor.r = ((hex >> 16) & 0xff) / 255;
      this.clearColor.g = ((hex >> 8) & 0xff) / 255;
      this.clearColor.b = (hex & 0xff) / 255;
      this.clearColor.a = alpha;
    } else if (typeof color === 'string') {
      let h = color.replace('#', '').trim();
      if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
      }
      const num = parseInt(h, 16);
      if (!Number.isNaN(num)) {
        this.clearColor.r = ((num >> 16) & 0xff) / 255;
        this.clearColor.g = ((num >> 8) & 0xff) / 255;
        this.clearColor.b = (num & 0xff) / 255;
      }
      this.clearColor.a = alpha;
    } else if (Array.isArray(color)) {
      this.clearColor.r = Number(color[0]) || 0;
      this.clearColor.g = Number(color[1]) || 0;
      this.clearColor.b = Number(color[2]) || 0;
      this.clearColor.a = color.length > 3 ? Number(color[3]) : alpha;
    } else if (typeof color === 'object') {
      // Normalize possibly-0..255 Color objects to 0..1
      const r = Number(color.r ?? 0);
      const g = Number(color.g ?? 0);
      const b = Number(color.b ?? 0);
      this.clearColor.r = r > 1 ? r / 255 : r;
      this.clearColor.g = g > 1 ? g / 255 : g;
      this.clearColor.b = b > 1 ? b / 255 : b;
      this.clearColor.a = color.a !== undefined ? Number(color.a) : alpha;
    }
    return this;
  }

  /**
   * @returns {{r:number,g:number,b:number,a:number}}
   */
  getClearColor() {
    return this.clearColor;
  }

  /* --------------------------------------------------------------------- *
   * Rendering (PREVIEW)
   * --------------------------------------------------------------------- */

  /**
   * Render the scene. PREVIEW: currently just clears the screen with the
   * configured clear color. A real implementation would need WGSL shaders
   * for every material type.
   *
   * @param {object} scene   (currently ignored)
   * @param {object} camera  (currently ignored)
   */
  render(scene, camera) {
    if (!this.backend || !this.backend.isInitialized()) {
      // Not ready yet — silently no-op so callers don't crash.
      return;
    }

    const startTime = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();

    // Reset performance counters (mirrors WebGLRenderer).
    this.performance.drawCalls = 0;
    this.performance.triangles = 0;
    this.performance.vertices = 0;

    if (this.autoClear) {
      this._clear();
    }

    const endTime = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
    this.performance.renderTime = endTime - startTime;
    this.performance.frameTime = this.performance.renderTime;
    this.performance.lastFrameTime = endTime;
    if (this.performance.renderTime > 0) {
      this.performance.fps = 1000 / this.performance.renderTime;
    }
  }

  /**
   * Clear the current swap-chain texture with the configured clear color.
   * @private
   */
  _clear() {
    const backend = this.backend;
    if (!backend || !backend.isInitialized()) return;

    const encoder = backend.createCommandEncoder();
    const colorView = backend.getCurrentTextureView();

    if (this.autoClearColor) {
      const c = this.clearColor;
      // When MSAA is enabled, render into the MSAA target and resolve.
      if (backend.sampleCount > 1) {
        const msaaView = backend.getMSAATextureView();
        const depthView = backend.getDepthTextureView();
        const renderPass = encoder.beginRenderPass({
          colorAttachments: [{
            view: msaaView,
            resolveTarget: colorView,
            clearValue: { r: c.r, g: c.g, b: c.b, a: c.a },
            loadOp: 'clear',
            storeOp: 'store'
          }],
          depthStencilAttachment: depthView ? {
            view: depthView,
            depthClearValue: this.clearDepth,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: this.clearStencil,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'
          } : undefined
        });
        renderPass.end();
      } else {
        const depthView = backend.getDepthTextureView();
        const renderPass = encoder.beginRenderPass({
          colorAttachments: [{
            view: colorView,
            clearValue: { r: c.r, g: c.g, b: c.b, a: c.a },
            loadOp: 'clear',
            storeOp: 'store'
          }],
          depthStencilAttachment: depthView ? {
            view: depthView,
            depthClearValue: this.clearDepth,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: this.clearStencil,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'
          } : undefined
        });
        renderPass.end();
      }
    }

    const cmd = encoder.finish();
    backend.submit([cmd]);
  }

  /**
   * Manually clear (mirrors WebGLRenderer.clear()).
   */
  clear() {
    this._clear();
  }

  /**
   * Force-submit the device queue (mirrors the WebGLRenderer.forceCommit
   * helper that some consumers expect). No-op when not initialized.
   */
  forceCommit() {
    if (this.backend && this.backend.device && this.backend.device.queue) {
      // No-op submission to flush pending work.
    }
  }

  /* --------------------------------------------------------------------- *
   * Dispose
   * --------------------------------------------------------------------- */

  /**
   * Release all GPU resources. The renderer cannot be reused after dispose().
   */
  dispose() {
    if (this.backend) {
      try { this.backend.destroy(); } catch (_) { /* noop */ }
      this.backend = null;
    }
    this._initialized = false;
  }
}

export default WebGPURenderer;
