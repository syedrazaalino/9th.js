/**
 * RenderPass — renders the given scene/camera into the EffectComposer's
 * current writeBuffer (or directly to screen when renderToScreen=true).
 *
 * This is the only pass that actually rasterizes scene geometry; all
 * other passes operate on the resulting framebuffer via fullscreen
 * shaders.
 */

import { Pass } from './EffectComposer.js';

export class RenderPass extends Pass {
  /**
   * @param {import('../core/Scene.js').Scene} scene
   * @param {import('../core/Camera.js').Camera} camera
   * @param {import('../core/Material.js').Material|null} [overrideMaterial=null]
   * @param {number|{r,g,b}|string|null} [clearColor=null]  When set, restored after pass.
   * @param {number} [clearAlpha=0]
   */
  constructor(scene, camera, overrideMaterial = null, clearColor = null, clearAlpha = 0) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.overrideMaterial = overrideMaterial;
    this.clearColor = clearColor;
    this.clearAlpha = clearAlpha;

    // RenderPass always needs to clear its target before drawing the scene.
    this.clear = true;
    this.needsSwap = true;
  }

  /**
   * Attach (or re-attach) a depth texture to the given writeBuffer's
   * framebuffer so that downstream passes (DepthOfFieldPass, SSAOPass)
   * can sample scene depth. No-op when WEBGL_depth_texture is unavailable.
   *
   * @param {WebGLRenderingContext} gl
   * @param {import('./EffectComposer.js').WebGLRenderTarget} writeBuffer
   * @private
   */
  _ensureDepthAttachment(gl, writeBuffer) {
    if (!writeBuffer) return null;
    const hasExt = !!gl.getExtension('WEBGL_depth_texture');
    if (!hasExt) return null;
    this._gl = gl;

    // (Re)create the depth texture if size changed.
    if (!this._depthTexture ||
        this._depthTextureWidth !== writeBuffer.width ||
        this._depthTextureHeight !== writeBuffer.height) {
      if (this._depthTexture) {
        gl.deleteTexture(this._depthTexture);
      }
      this._depthTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this._depthTexture);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT,
        writeBuffer.width, writeBuffer.height, 0,
        gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      this._depthTextureWidth = writeBuffer.width;
      this._depthTextureHeight = writeBuffer.height;
    }

    // Attach to the writeBuffer's framebuffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeBuffer.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D, this._depthTexture, 0
    );

    // Expose the depth texture on the writeBuffer so downstream passes
    // can find it after the EffectComposer swaps buffers.
    writeBuffer.depthTextureObj = this._depthTexture;
    return this._depthTexture;
  }

  /**
   * @param {import('../core/WebGLRenderer.js').WebGLRenderer} renderer
   * @param {import('./EffectComposer.js').WebGLRenderTarget|null} writeBuffer
   * @param {import('./EffectComposer.js').WebGLRenderTarget} readBuffer
   * @param {number} [deltaTime]
   */
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    const gl = renderer.getContext ? renderer.getContext() : renderer.gl;
    if (!gl || !this.scene || !this.camera) return;

    // Bind our target (or screen) before letting the renderer draw.
    if (writeBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeBuffer.framebuffer);
      gl.viewport(0, 0, writeBuffer.width, writeBuffer.height);
      // Attach a depth texture so DOF/SSAO passes can sample it.
      this._ensureDepthAttachment(gl, writeBuffer);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // Apply optional override clear color (and restore afterwards).
    let prevClearColor = null;
    let prevClearAlpha = null;
    const hasOverrideColor = this.clearColor !== null && this.clearColor !== undefined;
    if (hasOverrideColor && typeof renderer.setClearColor === 'function') {
      // Cache current clear color so we can restore it.
      prevClearColor = renderer.clearColor ? { ...renderer.clearColor } : null;
      prevClearAlpha = prevClearColor ? prevClearColor.a : 1.0;
      renderer.setClearColor(this.clearColor, this.clearAlpha);
    }

    // Apply override material (Three.js compatibility). The current 9th.js
    // renderer does not natively honour an override material, so we walk
    // the scene ourselves, swap materials on each mesh, and restore them.
    let swapped = [];
    if (this.overrideMaterial && this.scene && typeof this.scene.traverse === 'function') {
      this.scene.traverse((obj) => {
        if (obj && obj.isMesh && obj.material && obj.material !== this.overrideMaterial) {
          swapped.push({ obj, material: obj.material });
          obj.material = this.overrideMaterial;
        }
      });
    }

    try {
      renderer.render(this.scene, this.camera);
    } finally {
      // Restore materials.
      for (const { obj, material } of swapped) {
        obj.material = material;
      }
      // Restore clear color.
      if (hasOverrideColor && prevClearColor !== null && typeof renderer.setClearColor === 'function') {
        renderer.setClearColor(prevClearColor, prevClearAlpha);
      }
    }
  }

  /**
   * @returns {import('../core/Scene.js').Scene}
   */
  getScene() {
    return this.scene;
  }

  /**
   * @returns {import('../core/Camera.js').Camera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Release the depth texture owned by this pass.
   */
  dispose() {
    if (this._depthTexture && this._gl) {
      try { this._gl.deleteTexture(this._depthTexture); } catch (_) { /* ignore */ }
    }
    this._depthTexture = null;
    this._depthTextureWidth = 0;
    this._depthTextureHeight = 0;
  }
}

export default RenderPass;
