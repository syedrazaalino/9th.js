/**
 * EffectComposer — Three.js-style post-processing pipeline manager.
 *
 * Maintains a ping-pong pair of WebGLRenderTargets (`readBuffer` /
 * `writeBuffer`) and executes a list of `Pass` instances in order. Each
 * pass reads from the previous pass's output (via `readBuffer`) and
 * writes to `writeBuffer`; the buffers are then swapped unless the pass
 * opted out via `needsSwap = false`. The last enabled pass renders
 * directly to the screen (renderTarget = null).
 *
 * The composer also provides shared GL helpers used by ShaderPass and
 * the effect passes:
 *   - WebGLRenderTarget       : FBO + color attachment helper
 *   - Pass                    : base class for all post-processing passes
 *   - compileProgram          : GLSL ES 1.00 program compiler
 *   - setUniformValue         : uniform setter (number/array/bool/texture)
 *   - createFullscreenQuad    : shared clip-space quad VBO
 *   - bindFullscreenQuad      : bind the shared quad for rendering
 *   - drawFullscreenQuad      : issue drawArrays for the quad
 *
 * All shader code in this module uses GLSL ES 1.00
 * (attribute/varying/texture2D/gl_FragColor) to match the existing
 * 9th.js materials.
 */

// ---------------------------------------------------------------------------
// Internal: tiny GLSL ES 1.00 program cache key + compiler
// ---------------------------------------------------------------------------

function _hashSource(s) {
  // FNV-1a-ish 32-bit hash; collisions are fine — we still re-validate by source.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36);
}

/**
 * Compile a vertex+fragment shader pair into a WebGLProgram and cache
 * uniform / attribute locations.
 *
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
 * @param {string} vertexSource
 * @param {string} fragmentSource
 * @returns {{program: WebGLProgram, uniforms: Map<string,WebGLUniformLocation>, attributes: Map<string,number>}}
 */
export function compileProgram(gl, vertexSource, fragmentSource) {
  function _compile(type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('PostFX shader compile failed: ' + log + '\n--- source ---\n' + src);
    }
    return shader;
  }

  const vs = _compile(gl.VERTEX_SHADER, vertexSource);
  const fs = _compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('PostFX program link failed: ' + log);
  }

  const uniforms = new Map();
  const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < numUniforms; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    // Strip trailing [0] for arrays — we set them via the base name.
    const name = info.name.replace(/\[0\]$/, '');
    const loc = gl.getUniformLocation(program, name);
    if (loc) uniforms.set(name, loc);
  }

  const attributes = new Map();
  const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < numAttribs; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (!info) continue;
    const loc = gl.getAttribLocation(program, info.name);
    if (loc >= 0) attributes.set(info.name, loc);
  }

  return { program, uniforms, attributes };
}

/**
 * Set a uniform on a program-info produced by {@link compileProgram}.
 *
 * Supported value types:
 *   - number              → uniform1f
 *   - boolean             → uniform1i
 *   - [x,y] / [x,y,z] / [x,y,z,w] / length-9 / length-16
 *   - Float32Array (same lengths as above)
 *   - { type:'texture', unit:n } → uniform1i(unit)
 *
 * @param {WebGLRenderingContext} gl
 * @param {{uniforms:Map}} programInfo
 * @param {string} name
 * @param {*} value
 */
export function setUniformValue(gl, programInfo, name, value) {
  const loc = programInfo.uniforms.get(name);
  if (loc === undefined || loc === null) return;

  if (typeof value === 'number') {
    gl.uniform1f(loc, value);
  } else if (typeof value === 'boolean') {
    gl.uniform1i(loc, value ? 1 : 0);
  } else if (value && typeof value === 'object') {
    if (value.type === 'texture' || value.isTexture) {
      const unit = (value.unit !== undefined) ? value.unit : 0;
      gl.uniform1i(loc, unit);
    } else if (Array.isArray(value) || value instanceof Float32Array) {
      switch (value.length) {
        case 1: gl.uniform1fv(loc, value); break;
        case 2: gl.uniform2fv(loc, value); break;
        case 3: gl.uniform3fv(loc, value); break;
        case 4: gl.uniform4fv(loc, value); break;
        case 9: gl.uniformMatrix3fv(loc, false, value); break;
        case 16: gl.uniformMatrix4fv(loc, false, value); break;
        default:
          // Fallback for arbitrary-length float arrays (e.g. SSAO kernels)
          gl.uniform1fv(loc, value);
      }
    } else if (typeof value.toArray === 'function') {
      // Matrix4 / Vector / Color from the math package
      const arr = value.toArray();
      setUniformValue(gl, programInfo, name, arr);
    }
  }
}

/**
 * Push every uniform from a plain object into a program-info.
 * Each entry may be a raw value or `{ value: <raw value> }` (Three.js style).
 *
 * @param {WebGLRenderingContext} gl
 * @param {{uniforms:Map}} programInfo
 * @param {Object} uniforms
 */
export function applyUniforms(gl, programInfo, uniforms) {
  if (!uniforms) return;
  for (const key in uniforms) {
    if (!Object.prototype.hasOwnProperty.call(uniforms, key)) continue;
    const entry = uniforms[key];
    const value = entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
    setUniformValue(gl, programInfo, key, value);
  }
}

// ---------------------------------------------------------------------------
// Shared fullscreen quad (clip-space triangle strip, 4 verts)
// ---------------------------------------------------------------------------

const QUAD_POSITIONS = new Float32Array([
  // x      y     z     u     v
  -1.0, -1.0, 0.0,  0.0, 0.0,
   1.0, -1.0, 0.0,  1.0, 0.0,
  -1.0,  1.0, 0.0,  0.0, 1.0,
   1.0,  1.0, 0.0,  1.0, 1.0
]);

let _sharedQuadBuffer = null;

/**
 * Lazily create (and cache) a single shared WebGLBuffer containing the
 * fullscreen quad vertices. All ShaderPass instances draw from this buffer.
 *
 * @param {WebGLRenderingContext} gl
 * @returns {WebGLBuffer}
 */
export function createFullscreenQuad(gl) {
  if (_sharedQuadBuffer && _sharedQuadBuffer.gl === gl) {
    return _sharedQuadBuffer.buffer;
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, QUAD_POSITIONS, gl.STATIC_DRAW);
  _sharedQuadBuffer = { gl, buffer };
  return buffer;
}

/**
 * Bind the shared fullscreen quad buffer and wire up its `position`
 * (location auto-detected) and `uv` attributes for the given program.
 *
 * Layout is interleaved: vec3 position + vec2 uv, stride = 20 bytes.
 *
 * @param {WebGLRenderingContext} gl
 * @param {{attributes:Map}} programInfo
 */
export function bindFullscreenQuad(gl, programInfo) {
  const buffer = createFullscreenQuad(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const posLoc = programInfo.attributes.get('position');
  if (posLoc !== undefined && posLoc >= 0) {
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 20, 0);
  }
  const uvLoc = programInfo.attributes.get('uv');
  if (uvLoc !== undefined && uvLoc >= 0) {
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 20, 12);
  }
}

/**
 * Issue a drawArrays call for the fullscreen quad (TRIANGLE_STRIP, 4 verts).
 */
export function drawFullscreenQuad(gl) {
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

/**
 * Convenience: bind + draw the fullscreen quad in one call.
 */
export function renderFullscreenQuad(gl, programInfo) {
  bindFullscreenQuad(gl, programInfo);
  drawFullscreenQuad(gl);
}

// ---------------------------------------------------------------------------
// WebGLRenderTarget — FBO + color attachment (optional depth texture)
// ---------------------------------------------------------------------------

/**
 * Minimal render-target wrapper used by EffectComposer and individual
 * post-processing passes. Stores a WebGLFramebuffer, a color texture,
 * and (optionally) a depth texture / depth renderbuffer.
 */
export class WebGLRenderTarget {
  /**
   * @param {WebGLRenderingContext} gl
   * @param {number} width
   * @param {number} height
   * @param {Object} [options]
   * @param {boolean} [options.depthBuffer=true]      Allocate a depth renderbuffer.
   * @param {boolean} [options.depthTexture=false]    Attach a depth TEXTURE (needs WEBGL_depth_texture).
   * @param {GLenum}  [options.type=UNSIGNED_BYTE]    Color texture pixel type.
   * @param {GLenum}  [options.format=RGBA]           Color texture format.
   * @param {GLenum}  [options.minFilter=LINEAR]
   * @param {GLenum}  [options.magFilter=LINEAR]
   */
  constructor(gl, width, height, options = {}) {
    this.gl = gl;
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));

    this.depthBuffer = options.depthBuffer !== false;
    this.depthTexture = options.depthTexture === true;

    this.type = options.type || gl.UNSIGNED_BYTE;
    this.format = options.format || gl.RGBA;

    this.minFilter = options.minFilter || gl.LINEAR;
    this.magFilter = options.magFilter || gl.LINEAR;

    this.texture = null;     // WebGLTexture (color)
    this.depthTextureObj = null; // WebGLTexture (depth) when requested
    this.framebuffer = null; // WebGLFramebuffer
    this._depthRenderbuffer = null;

    this._create();
  }

  _create() {
    const gl = this.gl;

    // Color texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.format, this.width, this.height, 0, this.format, this.type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Framebuffer
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

    // Depth
    if (this.depthTexture) {
      const ext = gl.getExtension('WEBGL_depth_texture');
      if (ext) {
        const depthType = (this.type === gl.FLOAT) ? gl.FLOAT : gl.UNSIGNED_SHORT;
        this.depthTextureObj = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depthTextureObj);
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT,
          this.width, this.height, 0,
          gl.DEPTH_COMPONENT, depthType, null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTextureObj, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
      } else {
        // Fallback to a renderbuffer
        this.depthTexture = false;
        this._depthRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depthRenderbuffer);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      }
    } else if (this.depthBuffer) {
      this._depthRenderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this._depthRenderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._depthRenderbuffer);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Resize the render target, recreating its GPU resources.
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    width = Math.max(1, Math.floor(width));
    height = Math.max(1, Math.floor(height));
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.dispose(true);
    this._create();
  }

  /**
   * Bind this render target as the active framebuffer.
   * Pass `null` to render to the default framebuffer (canvas).
   * @param {WebGLRenderTarget|null} target
   */
  static bind(gl, target) {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  /**
   * Release all GPU resources.
   * @param {boolean} [keepAlive] Internal flag — when true, the caller
   *   will recreate the resources immediately (used by setSize).
   */
  dispose(keepAlive = false) {
    const gl = this.gl;
    if (!gl) return;
    if (this.texture) { gl.deleteTexture(this.texture); this.texture = null; }
    if (this.depthTextureObj) { gl.deleteTexture(this.depthTextureObj); this.depthTextureObj = null; }
    if (this._depthRenderbuffer) { gl.deleteRenderbuffer(this._depthRenderbuffer); this._depthRenderbuffer = null; }
    if (this.framebuffer) { gl.deleteFramebuffer(this.framebuffer); this.framebuffer = null; }
    if (keepAlive) return;
    this.gl = null;
  }
}

// ---------------------------------------------------------------------------
// Pass — base class for all post-processing passes
// ---------------------------------------------------------------------------

/**
 * Base class for all post-processing passes. Subclasses must implement
 * `render(renderer, writeBuffer, readBuffer, deltaTime)`.
 *
 * Flags:
 *   - enabled       : when false, the pass is skipped by EffectComposer
 *   - needsSwap     : when true (default), ping-pong buffers are swapped after this pass
 *   - renderToScreen: set automatically by EffectComposer for the last enabled pass
 *   - clear         : when true, the writeBuffer is cleared before this pass runs
 */
export class Pass {
  constructor() {
    this.enabled = true;
    this.needsSwap = true;
    this.renderToScreen = false;
    this.clear = false;
  }

  /**
   * Render this pass. Subclasses override.
   * @param {WebGLRenderer} renderer
   * @param {WebGLRenderTarget|null} writeBuffer  Target to render into (null = screen)
   * @param {WebGLRenderTarget} readBuffer        Input texture source
   * @param {number} [deltaTime]
   */
  render(renderer, writeBuffer, readBuffer, deltaTime) {
    // no-op base
  }

  /**
   * Resize any internal render targets this pass owns.
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    // base no-op; passes with internal targets override
  }

  /**
   * Release GPU resources owned by this pass.
   */
  dispose() {
    // base no-op
  }
}

// ---------------------------------------------------------------------------
// EffectComposer
// ---------------------------------------------------------------------------

/**
 * EffectComposer manages a pipeline of {@link Pass} instances and the
 * ping-pong buffers between them.
 */
export class EffectComposer {
  /**
   * @param {WebGLRenderer} renderer
   * @param {Object} [options]
   * @param {number} [options.resolutionScale=1.0]
   */
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.gl = renderer.getContext ? renderer.getContext() : renderer.gl;
    this.passes = [];

    this.resolutionScale = options.resolutionScale || 1.0;

    // Determine initial size from the renderer's drawing buffer.
    const drawingSize = renderer.getDrawingBufferSize
      ? renderer.getDrawingBufferSize()
      : { width: renderer.canvas.width, height: renderer.canvas.height };

    this._width = Math.max(1, Math.floor(drawingSize.width * this.resolutionScale));
    this._height = Math.max(1, Math.floor(drawingSize.height * this.resolutionScale));

    // Ping-pong buffers. Color-only; depth handled per-pass as needed.
    this.readBuffer = new WebGLRenderTarget(this.gl, this._width, this._height, {
      depthBuffer: false
    });
    this.writeBuffer = new WebGLRenderTarget(this.gl, this._width, this._height, {
      depthBuffer: false
    });

    // Pre-warm the shared fullscreen quad.
    createFullscreenQuad(this.gl);
  }

  /**
   * Append a pass to the pipeline.
   * @param {Pass} pass
   */
  addPass(pass) {
    this.passes.push(pass);
    pass.setSize(this._width, this._height);
    return this;
  }

  /**
   * Insert a pass at the given index.
   * @param {Pass} pass
   * @param {number} index
   */
  insertPass(pass, index) {
    this.passes.splice(index, 0, pass);
    pass.setSize(this._width, this._height);
    return this;
  }

  /**
   * Remove a pass from the pipeline.
   * @param {Pass} pass
   * @returns {boolean} true if the pass was removed
   */
  removePass(pass) {
    const idx = this.passes.indexOf(pass);
    if (idx === -1) return false;
    this.passes.splice(idx, 1);
    if (typeof pass.dispose === 'function') {
      try { pass.dispose(); } catch (_) { /* ignore */ }
    }
    return true;
  }

  /**
   * @returns {Pass[]} a shallow copy of the current pipeline
   */
  getPasses() {
    return this.passes.slice();
  }

  /**
   * Resize all render targets (composer-level + every pass).
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    width = Math.max(1, Math.floor(width * this.resolutionScale));
    height = Math.max(1, Math.floor(height * this.resolutionScale));
    if (width === this._width && height === this._height) return;

    this._width = width;
    this._height = height;

    this.readBuffer.setSize(width, height);
    this.writeBuffer.setSize(width, height);

    for (const pass of this.passes) {
      pass.setSize(width, height);
    }
  }

  /**
   * Set the device pixel ratio used by the underlying renderer.
   * @param {number} ratio
   */
  setPixelRatio(ratio) {
    if (typeof this.renderer.setPixelRatio === 'function') {
      this.renderer.setPixelRatio(ratio);
    }
    // Re-sync composer size to the renderer's drawing buffer.
    const size = this.renderer.getDrawingBufferSize
      ? this.renderer.getDrawingBufferSize()
      : { width: this.renderer.canvas.width, height: this.renderer.canvas.height };
    this.setSize(size.width, size.height);
  }

  /**
   * Execute the entire pipeline.
   *
   * Algorithm (Three.js-compatible):
   *   1. Find the index of the last enabled pass — it renders to screen.
   *   2. For each enabled pass:
   *        - mark renderToScreen = (this is the last enabled pass)
   *        - call pass.render(renderer, writeBuffer, readBuffer, deltaTime)
   *        - if pass.needsSwap and not last, swap readBuffer <-> writeBuffer
   *   3. After all passes, restore framebuffer binding to the screen.
   *
   * @param {number} [deltaTime=0]
   */
  render(deltaTime = 0) {
    const gl = this.gl;
    if (!gl) return;

    // Determine the last enabled pass index.
    let lastIndex = -1;
    for (let i = 0; i < this.passes.length; i++) {
      if (this.passes[i].enabled) lastIndex = i;
    }

    // Save GL state we'll touch so we can restore it.
    const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevViewport = gl.getParameter(gl.VIEWPORT);
    const prevDepthTest = gl.isEnabled(gl.DEPTH_TEST);
    const prevBlend = gl.isEnabled(gl.BLEND);
    const prevCullFace = gl.isEnabled(gl.CULL_FACE);

    for (let i = 0; i < this.passes.length; i++) {
      const pass = this.passes[i];
      if (!pass.enabled) continue;

      pass.renderToScreen = (i === lastIndex);

      const writeTarget = pass.renderToScreen ? null : this.writeBuffer;

      // Optional clear before pass
      if (pass.clear && writeTarget) {
        WebGLRenderTarget.bind(gl, writeTarget);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      pass.render(this.renderer, writeTarget, this.readBuffer, deltaTime);

      if (pass.needsSwap && i !== lastIndex) {
        const tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;
      }
    }

    // Restore framebuffer binding to whatever the canvas expects (screen).
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(prevViewport[0], prevViewport[1], prevViewport[2], prevViewport[3]);

    // Restore render state — the next renderer.render() will re-apply its own.
    if (prevDepthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);
    if (prevBlend) gl.enable(gl.BLEND); else gl.disable(gl.BLEND);
    if (prevCullFace) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);

    // The renderer may have stored the "previous framebuffer" — make sure
    // it doesn't think it's still bound to one of our ping-pong targets.
    if (this.renderer._currentRenderTarget !== undefined) {
      this.renderer._currentRenderTarget = null;
    }
  }

  /**
   * Reset the pipeline (drop all passes and dispose their resources).
   */
  reset() {
    for (const pass of this.passes) {
      if (typeof pass.dispose === 'function') {
        try { pass.dispose(); } catch (_) { /* ignore */ }
      }
    }
    this.passes = [];
  }

  /**
   * Dispose composer-level resources (ping-pong targets). Does NOT
   * dispose the underlying renderer.
   */
  dispose() {
    this.reset();
    if (this.readBuffer) this.readBuffer.dispose();
    if (this.writeBuffer) this.writeBuffer.dispose();
    this.readBuffer = null;
    this.writeBuffer = null;
  }
}

export default EffectComposer;
