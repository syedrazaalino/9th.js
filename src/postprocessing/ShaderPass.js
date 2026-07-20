/**
 * ShaderPass — applies a fullscreen shader to the input render target
 * and writes the result to the output. Built on top of the shared
 * fullscreen quad in EffectComposer.
 *
 * Accepts either:
 *   1. A plain shader definition: { uniforms, vertexShader, fragmentShader }
 *      where `uniforms` is an object of `{ name: { value } }` entries
 *      (Three.js convention).
 *   2. A Material instance from `core/Material.js`. In that case the
 *      pass will lazily compile the material's vertexSource/fragmentSource
 *      into its own program and apply the material's `properties` map as
 *      uniforms (plus any user overrides set via `pass.uniforms`).
 *
 * The input texture from `readBuffer.texture` is bound to texture unit 0
 * and exposed to the fragment shader as the sampler named by `textureID`
 * (default `"tDiffuse"`).
 */

import {
  Pass,
  compileProgram,
  setUniformValue,
  applyUniforms,
  bindFullscreenQuad,
  drawFullscreenQuad
} from './EffectComposer.js';

export class ShaderPass extends Pass {
  /**
   * @param {Object|import('../core/Material.js').Material} shaderOrMaterial
   * @param {string} [textureID='tDiffuse']  Name of the input sampler uniform.
   */
  constructor(shaderOrMaterial, textureID = 'tDiffuse') {
    super();
    this.textureID = textureID;

    // User-overridable uniforms (applied on top of defaults each frame).
    this.uniforms = {};

    this._material = null;
    this._shaderDef = null;
    this._programInfo = null;
    this._materialProgramInfo = null;

    if (!shaderOrMaterial) {
      throw new Error('ShaderPass: shader/material argument is required');
    }

    if (shaderOrMaterial.isMaterial) {
      this._material = shaderOrMaterial;
      // Mirror the material's properties into our uniforms map for
      // visibility, but real application happens via material.shader.
      if (shaderOrMaterial.properties) {
        for (const [name, value] of shaderOrMaterial.properties) {
          this.uniforms[name] = { value };
        }
      }
    } else if (
      typeof shaderOrMaterial === 'object' &&
      (shaderOrMaterial.vertexShader || shaderOrMaterial.fragmentShader)
    ) {
      this._shaderDef = shaderOrMaterial;
      // Clone the def's defaults so callers can mutate `pass.uniforms`
      // without modifying the original shader definition.
      if (shaderOrMaterial.uniforms) {
        for (const key in shaderOrMaterial.uniforms) {
          if (Object.prototype.hasOwnProperty.call(shaderOrMaterial.uniforms, key)) {
            this.uniforms[key] = shaderOrMaterial.uniforms[key];
          }
        }
      }
    } else {
      throw new Error(
        'ShaderPass: expected a Material instance or a shader definition ' +
        '{ uniforms, vertexShader, fragmentShader }'
      );
    }

    this.needsSwap = true;
  }

  /**
   * Lazily compile the shader program on first render.
   * @param {WebGLRenderingContext} gl
   * @private
   */
  _ensureProgram(gl) {
    if (this._programInfo) return this._programInfo;

    let vs, fs;
    if (this._shaderDef) {
      vs = this._shaderDef.vertexShader;
      fs = this._shaderDef.fragmentShader;
    } else if (this._material) {
      vs = this._material.vertexSource;
      fs = this._material.fragmentSource;
      if (!vs || !fs) {
        // Fall back to letting the Material initialise its own shader.
        if (typeof this._material.initShader === 'function') {
          this._material.initShader(gl);
        }
        const shader = this._material.shader;
        if (shader && shader.isReady && shader.isReady()) {
          this._materialProgramInfo = {
            program: shader.program,
            uniforms: shader.uniformLocations,
            attributes: shader.attributeLocations
          };
          return null;
        }
        throw new Error('ShaderPass: Material has no vertexSource/fragmentSource and could not init a shader');
      }
    }

    if (!vs || !fs) {
      throw new Error('ShaderPass: missing vertex or fragment shader source');
    }

    this._programInfo = compileProgram(gl, vs, fs);
    return this._programInfo;
  }

  /**
   * @param {import('../core/WebGLRenderer.js').WebGLRenderer} renderer
   * @param {import('./EffectComposer.js').WebGLRenderTarget|null} writeBuffer
   * @param {import('./EffectComposer.js').WebGLRenderTarget} readBuffer
   * @param {number} [deltaTime]
   */
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    const gl = renderer.getContext ? renderer.getContext() : renderer.gl;
    if (!gl) return;

    // Bind target (screen or offscreen).
    if (writeBuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeBuffer.framebuffer);
      gl.viewport(0, 0, writeBuffer.width, writeBuffer.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const w = renderer.canvas ? renderer.canvas.width : gl.drawingBufferWidth;
      const h = renderer.canvas ? renderer.canvas.height : gl.drawingBufferHeight;
      gl.viewport(0, 0, w, h);
    }

    // Save state — fullscreen quad draws with no depth/blend/cull.
    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);
    const prevActiveUnit = gl.getParameter(gl.ACTIVE_TEXTURE);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    try {
      const programInfo = this._ensureProgram(gl);

      // Material-only path: drive the Material's own shader.
      if (this._materialProgramInfo) {
        const shader = this._material.shader;
        shader.use();

        // Bind input texture to unit 0.
        if (readBuffer && readBuffer.texture) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, readBuffer.texture);
          shader.setUniform(this.textureID, { type: 'texture', unit: 0 });
        }

        // Apply material's own properties (uniforms).
        if (typeof this._material.updateUniforms === 'function') {
          this._material.updateUniforms();
        }
        // Apply user overrides.
        for (const name in this.uniforms) {
          if (!Object.prototype.hasOwnProperty.call(this.uniforms, name)) continue;
          const entry = this.uniforms[name];
          const value = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
          shader.setUniform(name, value);
        }

        // Bind + draw fullscreen quad using material's attribute locations.
        bindFullscreenQuad(gl, this._materialProgramInfo);
        drawFullscreenQuad(gl);
        return;
      }

      // Standard path: own compiled program.
      gl.useProgram(programInfo.program);

      // Bind input texture to unit 0.
      if (readBuffer && readBuffer.texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, readBuffer.texture);
        setUniformValue(gl, programInfo, this.textureID, { type: 'texture', unit: 0 });
      }

      // Apply default uniforms from the shader def, then user overrides.
      if (this._shaderDef && this._shaderDef.uniforms) {
        applyUniforms(gl, programInfo, this._shaderDef.uniforms);
      }
      applyUniforms(gl, programInfo, this.uniforms);

      // Bind + draw.
      bindFullscreenQuad(gl, programInfo);
      drawFullscreenQuad(gl);
    } finally {
      // Restore GL state for downstream passes / renderer.
      if (prevDepthTest) gl.enable(gl.DEPTH_TEST);
      if (prevBlend) gl.enable(gl.BLEND);
      if (prevCullFace) gl.enable(gl.CULL_FACE);
      gl.activeTexture(prevActiveUnit || gl.TEXTURE0);
    }
  }

  /**
   * Update a uniform value at runtime.
   * @param {string} name
   * @param {*} value
   */
  setUniform(name, value) {
    this.uniforms[name] = { value };
  }

  /**
   * Bulk-update uniforms.
   * @param {Object} uniforms
   */
  setUniforms(uniforms) {
    for (const k in uniforms) {
      if (Object.prototype.hasOwnProperty.call(uniforms, k)) {
        this.uniforms[k] = uniforms[k] && typeof uniforms[k] === 'object' && 'value' in uniforms[k]
          ? uniforms[k]
          : { value: uniforms[k] };
      }
    }
  }

  dispose() {
    // We don't own the Material — only dispose programs we compiled.
    if (this._programInfo && this._programInfo.program) {
      // Note: we cannot easily get the gl context here; rely on GC.
      this._programInfo = null;
    }
    this._materialProgramInfo = null;
  }
}

export default ShaderPass;
