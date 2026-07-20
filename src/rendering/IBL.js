/**
 * IBL.js — Image-Based Lighting (PMREM generator) entry point.
 *
 * Provides a high-level interface for generating environment maps suitable
 * for PBR materials, using the underlying EnvironmentMapProcessor +
 * BRDFLUT utilities.
 *
 * Usage:
 *   import { IBL } from '9th.js';
 *   const ibl = new IBL(renderer);
 *
 *   const envFromScene    = await ibl.fromScene(scene, 256);
 *   const envFromHDR      = await ibl.fromHDRFile('studio.hdr');
 *   const envFromEqui     = await ibl.fromEquirectangular(equirectTex, 512);
 *   const envFromCube     = ibl.fromCubeTexture(cubeTexture);
 *
 *   scene.environment = envFromCube.texture;
 *
 * The returned object exposes:
 *   - `texture`     — the cube color texture (suitable for `scene.environment`)
 *   - `cubeTarget`  — the underlying cube RenderTarget
 *   - `pmrem`       — array of prefiltered cube RenderTargets (one per roughness mip)
 *                     (only populated when PMREM generation is requested)
 *   - `diffuseEnv`  — diffuse irradiance cube RenderTarget (when generated)
 *   - `brdfLUT`     — precomputed BRDF LUT texture (when generated)
 *
 * This module never touches `document` or `navigator` at import time, so
 * it is safe to import from Node.js.
 */

import { RenderTarget } from '../core/RenderTarget.js';
import { EnvironmentMapProcessor } from './EnvironmentMapProcessor.js';
import { BRDFLUT } from './BRDFLUT.js';

// Lazy import to avoid a hard runtime dependency on the renderer module.
let _PerspectiveCamera = null;
async function _getPerspectiveCamera() {
  if (_PerspectiveCamera) return _PerspectiveCamera;
  try {
    const mod = await import('../cameras/PerspectiveCamera.js');
    _PerspectiveCamera = mod.PerspectiveCamera;
    return _PerspectiveCamera;
  } catch (_) {
    return null;
  }
}

/**
 * @typedef {Object} IBLResult
 * @property {RenderTargetTexture|null} texture       The cube environment texture (set on `scene.environment`).
 * @property {RenderTarget|null}        cubeTarget    The underlying cube RenderTarget.
 * @property {RenderTarget[]|null}      pmrem         Prefiltered cube targets per roughness mip.
 * @property {RenderTarget|null}        diffuseEnv    Diffuse irradiance cube RenderTarget.
 * @property {RenderTargetTexture|null} brdfLUT       BRDF integration LUT texture.
 * @property {IBL}                      ibl           Back-reference to the owning IBL instance.
 */

export class IBL {
  /**
   * @param {WebGLRenderer|WebGLRenderingContext} renderer
   * @param {object} [options]
   * @param {boolean} [options.autoBRDFLUT=true]   Generate the BRDF LUT on first use.
   * @param {number}  [options.defaultSize=512]    Default cube edge length.
   */
  constructor(renderer, options = {}) {
    if (renderer && renderer.gl) {
      this.renderer = renderer;
      this.gl = renderer.gl;
    } else {
      this.renderer = null;
      this.gl = renderer;
    }

    this.options = {
      autoBRDFLUT: options.autoBRDFLUT !== false,
      defaultSize: options.defaultSize || 512
    };

    /** @type {EnvironmentMapProcessor} */
    this.processor = new EnvironmentMapProcessor(this.gl || (this.renderer && this.renderer.gl));

    /** @type {BRDFLUT|null} */
    this._brdfLUT = null;

    /** @type {WeakMap<object, IBLResult>} */
    this._cache = new WeakMap();

    this.isIBL = true;
    this.id = 'ibl_' + Math.random().toString(36).substring(2, 11);
  }

  /* ------------------------------------------------------------------- *
   * BRDF LUT accessor
   * ------------------------------------------------------------------- */

  /**
   * Get (lazily creating) the BRDF integration LUT.
   *
   * @param {number} [size=512]
   * @param {number} [sampleCount=256]
   * @returns {RenderTargetTexture|null}
   */
  getBRDFLUT(size = 512, sampleCount = 256) {
    if (!this._brdfLUT) {
      this._brdfLUT = new BRDFLUT(this.renderer || this.gl);
    }
    if (!this._brdfLUT.texture || this._brdfLUT.size !== size) {
      this._brdfLUT.generate(size, sampleCount);
    }
    return this._brdfLUT.texture;
  }

  /* ------------------------------------------------------------------- *
   * Source: cube texture
   * ------------------------------------------------------------------- */

  /**
   * Wrap an existing cube texture as an IBL result. Optionally generates
   * the diffuse + specular (PMREM) variants too.
   *
   * @param {object} cubeTexture  Any object exposing a GL cube texture handle
   *        (CubeTexture, RenderTargetTexture with isCubeMap, or raw GL texture).
   * @param {object} [options]
   * @param {boolean} [options.generateDiffuse=false]
   * @param {boolean} [options.generatePMREM=false]
   * @returns {IBLResult}
   */
  fromCubeTexture(cubeTexture, options = {}) {
    const result = this._newResult();
    result.texture = (cubeTexture && cubeTexture.texture) ? cubeTexture.texture
                  : (cubeTexture && cubeTexture._glTexture) ? cubeTexture
                  : cubeTexture;
    result.cubeTarget = null; // caller-owned texture
    result._sourceCube = cubeTexture;

    if (options.generateDiffuse) {
      try {
        result.diffuseEnv = this.processor.generateDiffuseEnv(cubeTexture, 32, 256);
      } catch (e) {
        console.warn('[9th.js IBL.fromCubeTexture] diffuse generation failed:', e);
      }
    }
    if (options.generatePMREM) {
      try {
        result.pmrem = this.processor.cubemapToPMREM(cubeTexture, 256, 128, 5);
      } catch (e) {
        console.warn('[9th.js IBL.fromCubeTexture] PMREM generation failed:', e);
      }
    }
    if (this.options.autoBRDFLUT) {
      try { result.brdfLUT = this.getBRDFLUT(); } catch (_) { /* noop */ }
    }
    return result;
  }

  /* ------------------------------------------------------------------- *
   * Source: equirectangular texture (single-pass shader)
   * ------------------------------------------------------------------- */

  /**
   * @param {object} equirectTexture  Any 2D texture object exposing a GL texture handle.
   * @param {number} [size=512]
   * @param {object} [options]
   * @param {boolean} [options.generateDiffuse=false]
   * @param {boolean} [options.generatePMREM=false]
   * @returns {IBLResult}
   */
  fromEquirectangular(equirectTexture, size = 512, options = {}) {
    if (!this.gl) throw new Error('[9th.js IBL] No GL context — pass a renderer or GL to the constructor.');
    size = Math.max(16, Math.floor(Number(size) || this.options.defaultSize || 512));

    const cubeTarget = this.processor.equirectToCubemap(equirectTexture, size);
    const result = this._newResult();
    result.cubeTarget = cubeTarget;
    result.texture = cubeTarget.texture;

    if (options.generateDiffuse) {
      try {
        result.diffuseEnv = this.processor.generateDiffuseEnv(cubeTarget.texture, 32, 256);
      } catch (e) {
        console.warn('[9th.js IBL.fromEquirectangular] diffuse generation failed:', e);
      }
    }
    if (options.generatePMREM) {
      try {
        result.pmrem = this.processor.cubemapToPMREM(cubeTarget.texture, 256, 128, 5);
      } catch (e) {
        console.warn('[9th.js IBL.fromEquirectangular] PMREM generation failed:', e);
      }
    }
    if (this.options.autoBRDFLUT) {
      try { result.brdfLUT = this.getBRDFLUT(); } catch (_) { /* noop */ }
    }
    return result;
  }

  /* ------------------------------------------------------------------- *
   * Source: scene (render the scene 6 times into a cube target)
   * ------------------------------------------------------------------- */

  /**
   * Render the given scene from 6 cube-camera viewpoints into a cube
   * RenderTarget. The result is suitable as `scene.environment` for IBL.
   *
   * @param {object} scene       A 9th.js Scene (anything with .traverse()).
   * @param {number} [size=256]  Cube edge length in pixels.
   * @param {object} [options]
   * @param {boolean} [options.generateDiffuse=false]
   * @param {boolean} [options.generatePMREM=false]
   * @param {number}  [options.near=0.1]
   * @param {number}  [options.far=100]
   * @returns {Promise<IBLResult>}
   */
  async fromScene(scene, size = 256, options = {}) {
    if (!this.renderer) {
      throw new Error('[9th.js IBL.fromScene] A WebGLRenderer is required (raw GL is not enough).');
    }
    if (!this.renderer.setRenderTarget) {
      throw new Error('[9th.js IBL.fromScene] Renderer does not implement setRenderTarget().');
    }
    size = Math.max(16, Math.floor(Number(size) || 256));
    const near = options.near !== undefined ? options.near : 0.1;
    const far = options.far !== undefined ? options.far : 100;

    // Create the cube render target.
    const cubeTarget = new RenderTarget(size, size, {
      format: 'RGBA',
      type: 'UNSIGNED_BYTE',
      minFilter: 'LINEAR',
      magFilter: 'LINEAR',
      wrapS: 'CLAMP_TO_EDGE',
      wrapT: 'CLAMP_TO_EDGE',
      depthBuffer: true,
      stencilBuffer: false,
      isCubeTarget: true,
      generateMipmaps: false,
      name: 'ibl_fromScene'
    });
    cubeTarget._ensureGL(this.gl);

    // Create a perspective camera with 90° FOV.
    const PerspectiveCamera = await _getPerspectiveCamera();
    if (!PerspectiveCamera) {
      throw new Error('[9th.js IBL.fromScene] Could not import PerspectiveCamera.');
    }
    const cam = new PerspectiveCamera(90, 1, near, far);

    // Save renderer state.
    const prevTarget = this.renderer.getRenderTarget ? this.renderer.getRenderTarget() : null;
    const prevClearColor = this.renderer.clearColor ? { ...this.renderer.clearColor } : null;

    try {
      // Render the scene once per cube face.
      const faceStates = [
        { pos: [1, 0, 0],  up: [0, -1, 0] },
        { pos: [-1, 0, 0], up: [0, -1, 0] },
        { pos: [0, 1, 0],  up: [0, 0, 1] },
        { pos: [0, -1, 0], up: [0, 0, -1] },
        { pos: [0, 0, 1],  up: [0, -1, 0] },
        { pos: [0, 0, -1], up: [0, -1, 0] }
      ];
      for (let face = 0; face < 6; face++) {
        const st = faceStates[face];
        // Position the camera at the origin and aim it at the face direction.
        if (typeof cam.position !== 'undefined') {
          cam.position.x = 0; cam.position.y = 0; cam.position.z = 0;
        }
        if (typeof cam.lookAt === 'function') {
          cam.lookAt(st.pos[0], st.pos[1], st.pos[2]);
        }
        // Configure the cube target to render into this face.
        this.renderer.setRenderTarget(cubeTarget);
        if (typeof cubeTarget.setCubeFace === 'function') {
          cubeTarget.setCubeFace(this.gl, face);
        }
        this.gl.viewport(0, 0, size, size);
        this.renderer.render(scene, cam);
      }
    } catch (e) {
      console.error('[9th.js IBL.fromScene] rendering failed:', e);
      throw e;
    } finally {
      // Restore renderer state.
      this.renderer.setRenderTarget(prevTarget);
      if (prevClearColor && this.renderer.setClearColor) {
        this.renderer.setClearColor(prevClearColor);
      }
    }

    const result = this._newResult();
    result.cubeTarget = cubeTarget;
    result.texture = cubeTarget.texture;

    if (options.generateDiffuse) {
      try {
        result.diffuseEnv = this.processor.generateDiffuseEnv(cubeTarget.texture, 32, 256);
      } catch (e) {
        console.warn('[9th.js IBL.fromScene] diffuse generation failed:', e);
      }
    }
    if (options.generatePMREM) {
      try {
        result.pmrem = this.processor.cubemapToPMREM(cubeTarget.texture, 256, 128, 5);
      } catch (e) {
        console.warn('[9th.js IBL.fromScene] PMREM generation failed:', e);
      }
    }
    if (this.options.autoBRDFLUT) {
      try { result.brdfLUT = this.getBRDFLUT(); } catch (_) { /* noop */ }
    }
    return result;
  }

  /* ------------------------------------------------------------------- *
   * Source: HDR file
   * ------------------------------------------------------------------- */

  /**
   * Load an HDR (Radiance .hdr / .pic) file from disk and convert it into
   * an environment map.
   *
   * @param {string} url
   * @param {object} [options]
   * @param {number} [options.size=512]
   * @param {boolean} [options.generateDiffuse=false]
   * @param {boolean} [options.generatePMREM=false]
   * @returns {Promise<IBLResult>}
   */
  async fromHDRFile(url, options = {}) {
    const size = options.size || this.options.defaultSize || 512;

    // Try to load HDR data via the existing HDRRendering module.
    let hdrTexture = null;
    try {
      const mod = await import('./HDRRendering.js');
      const HDRRenderer = mod.HDRRenderer;
      if (HDRRenderer && typeof HDRRenderer.loadHDRTexture === 'function') {
        hdrTexture = await HDRRenderer.loadHDRTexture(url);
      } else if (HDRRenderer && HDRRenderer.prototype && typeof HDRRenderer.prototype.loadHDRTexture === 'function') {
        // some builds expose it as an instance method
        hdrTexture = await (this.renderer && (this.renderer.hdrRenderer instanceof HDRRenderer)
          ? this.renderer.hdrRenderer
          : new HDRRenderer(this.canvas || (this.renderer && this.renderer.canvas), {})
        ).loadHDRTexture(url);
      }
    } catch (e) {
      console.warn('[9th.js IBL.fromHDRFile] HDR module load failed; falling back to TextureLoader:', e);
    }

    if (!hdrTexture) {
      // Fallback: try the generic TextureLoader (will return an LDR texture,
      // but the API still works for preview).
      try {
        const loaderMod = await import('../loaders/index.js');
        const TextureLoader = loaderMod.TextureLoader;
        if (TextureLoader) {
          const loader = new TextureLoader(this.gl || (this.renderer && this.renderer.gl));
          hdrTexture = await loader.loadAsync(url);
        }
      } catch (e) {
        throw new Error(`[9th.js IBL.fromHDRFile] Could not load HDR file "${url}": ${e.message || e}`);
      }
    }

    if (!hdrTexture) {
      throw new Error(`[9th.js IBL.fromHDRFile] Could not load HDR file "${url}".`);
    }

    return this.fromEquirectangular(hdrTexture, size, options);
  }

  /* ------------------------------------------------------------------- *
   * Helpers
   * ------------------------------------------------------------------- */

  /**
   * @private
   * @returns {IBLResult}
   */
  _newResult() {
    const result = {
      texture: null,
      cubeTarget: null,
      pmrem: null,
      diffuseEnv: null,
      brdfLUT: null,
      ibl: this,
      dispose: null
    };
    result.dispose = () => this._disposeResult(result);
    return result;
  }

  /**
   * Dispose of the GPU resources held by a result object.
   * @private
   */
  _disposeResult(result) {
    if (!result) return;
    if (result.cubeTarget) {
      try { result.cubeTarget.dispose(); } catch (_) { /* noop */ }
      result.cubeTarget = null;
    }
    if (result.pmrem && Array.isArray(result.pmrem)) {
      for (const rt of result.pmrem) {
        try { rt.dispose(); } catch (_) { /* noop */ }
      }
      result.pmrem = null;
    }
    if (result.diffuseEnv) {
      try { result.diffuseEnv.dispose(); } catch (_) { /* noop */ }
      result.diffuseEnv = null;
    }
    result.texture = null;
    result.brdfLUT = null; // owned by IBL, not the result
  }

  /**
   * Release all GPU resources held by this IBL instance.
   */
  dispose() {
    if (this.processor) {
      try { this.processor.dispose(); } catch (_) { /* noop */ }
      this.processor = null;
    }
    if (this._brdfLUT) {
      try { this._brdfLUT.dispose(); } catch (_) { /* noop */ }
      this._brdfLUT = null;
    }
  }
}

export default IBL;
