/**
 * RenderTarget - Off-screen rendering target backed by a WebGLFramebuffer.
 *
 * Three.js-compatible usage:
 *
 *   const rt = new RenderTarget(1024, 1024, {
 *     format: 'RGBA',
 *     type: 'UNSIGNED_BYTE',
 *     depthBuffer: true,
 *     stencilBuffer: false,
 *     wrapS: 'CLAMP_TO_EDGE',
 *     wrapT: 'CLAMP_TO_EDGE',
 *     minFilter: 'LINEAR',
 *     magFilter: 'LINEAR'
 *   });
 *   renderer.setRenderTarget(rt);
 *   renderer.render(scene, camera);
 *   renderer.setRenderTarget(null);
 *   // rt.texture is the color texture you can sample from
 *
 * GPU resources are created lazily the first time `_ensureGL(gl)` is called
 * (typically by `WebGLRenderer.setRenderTarget`).
 */

/**
 * Map a human-readable string enum to the corresponding GL constant.
 * Falls back to returning the input unchanged if it is already a number.
 */
function resolveGLConstant(gl, name, fallback) {
  if (typeof name === 'number') return name;
  if (typeof name === 'string' && gl && gl[name] !== undefined) return gl[name];
  return fallback;
}

/**
 * Minimal Texture-like object used as a color/depth attachment on a RenderTarget.
 * Mirrors the subset of the Texture API that consumers (materials, shaders)
 * typically need: width, height, format, wrap/filter params, a GL handle, and
 * a `needsUpdate` flag.
 */
export class RenderTargetTexture {
  constructor(width, height, options = {}) {
    this.isTexture = true;
    this.isRenderTargetTexture = true;

    this.width = width || 0;
    this.height = height || 0;

    // String enum names — resolved to GL constants in _ensureGL()
    this.format = options.format || 'RGBA';
    this.type = options.type || 'UNSIGNED_BYTE';
    this.internalFormat = options.internalFormat || null; // auto if null
    this.wrapS = options.wrapS || 'CLAMP_TO_EDGE';
    this.wrapT = options.wrapT || 'CLAMP_TO_EDGE';
    this.minFilter = options.minFilter || 'LINEAR';
    this.magFilter = options.magFilter || 'LINEAR';
    this.generateMipmaps = !!options.generateMipmaps;

    // Cube map support
    this.isCubeMap = !!options.isCubeMap;

    // Texture coordinate transformation (Three.js compatibility)
    this.offset = { x: 0, y: 0 };
    this.repeat = { x: 1, y: 1 };
    this.rotation = 0;
    this.center = { x: 0.5, y: 0.5 };

    // Identity / state
    this.name = options.name || '';
    this.uuid = Math.random().toString(36).substring(2, 11);
    this.version = 0;
    this.needsUpdate = true;

    // GL handle cache (populated by RenderTarget._ensureGL)
    this._gl = null;
    this._glTexture = null;
  }

  clone() {
    const c = new RenderTargetTexture(this.width, this.height, {
      format: this.format,
      type: this.type,
      internalFormat: this.internalFormat,
      wrapS: this.wrapS,
      wrapT: this.wrapT,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      generateMipmaps: this.generateMipmaps,
      isCubeMap: this.isCubeMap,
      name: this.name
    });
    c.offset = { ...this.offset };
    c.repeat = { ...this.repeat };
    return c;
  }

  dispose() {
    if (this._gl && this._glTexture) {
      try { this._gl.deleteTexture(this._glTexture); } catch (_) { /* noop */ }
    }
    this._gl = null;
    this._glTexture = null;
    this.needsUpdate = true;
  }
}

/**
 * RenderTarget class
 */
export class RenderTarget {
  /**
   * @param {number} width
   * @param {number} height
   * @param {object} [options]
   * @param {string} [options.format='RGBA']           Color format string ('RGBA', 'RGB', 'RED', ...)
   * @param {string} [options.type='UNSIGNED_BYTE']    Pixel type ('UNSIGNED_BYTE', 'FLOAT', 'HALF_FLOAT', ...)
   * @param {boolean} [options.depthBuffer=true]
   * @param {boolean} [options.stencilBuffer=false]
   * @param {string} [options.wrapS='CLAMP_TO_EDGE']
   * @param {string} [options.wrapT='CLAMP_TO_EDGE']
   * @param {string} [options.minFilter='LINEAR']
   * @param {string} [options.magFilter='LINEAR']
   * @param {boolean} [options.isCubeTarget=false]
   * @param {boolean} [options.depthTexture=false]    If true, allocate a depthTexture instead of a renderbuffer
   */
  constructor(width, height, options = {}) {
    width = Math.max(1, Math.floor(Number(width) || 1));
    height = Math.max(1, Math.floor(Number(height) || 1));

    this.width = width;
    this.height = height;

    this.format = options.format || 'RGBA';
    this.type = options.type || 'UNSIGNED_BYTE';
    this.wrapS = options.wrapS || 'CLAMP_TO_EDGE';
    this.wrapT = options.wrapT || 'CLAMP_TO_EDGE';
    this.minFilter = options.minFilter || 'LINEAR';
    this.magFilter = options.magFilter || 'LINEAR';
    this.generateMipmaps = !!options.generateMipmaps;

    this.depthBuffer = options.depthBuffer !== undefined ? !!options.depthBuffer : true;
    this.stencilBuffer = !!options.stencilBuffer;
    this.useDepthTexture = !!options.depthTexture;
    this.isCubeTarget = !!options.isCubeTarget;
    this.samples = options.samples || 0; // MSAA sample count (WebGL2 only)

    // Lazily-created GPU resources
    this.framebuffer = null;
    this._depthRenderbuffer = null;
    this._stencilRenderbuffer = null;
    this._gl = null;
    this._isReady = false;

    // Color attachment (RenderTargetTexture). For cube targets, this single
    // texture has `isCubeMap = true` and exposes 6 faces.
    this.texture = new RenderTargetTexture(width, height, {
      format: this.format,
      type: this.type,
      wrapS: this.wrapS,
      wrapT: this.wrapT,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      generateMipmaps: this.generateMipmaps,
      isCubeMap: this.isCubeTarget,
      name: options.name ? `${options.name}_color` : 'renderTarget_color'
    });

    // Optional depth texture (only allocated if useDepthTexture is true)
    this.depthTexture = null;

    // Track which cube face is currently attached (0..5), for cube targets.
    this._activeCubeFace = 0;

    this.uuid = Math.random().toString(36).substring(2, 11);
    this.version = 0;
    this.isRenderTarget = true;
  }

  /* --------------------------------------------------------------------- *
   * Lazy GPU initialization
   * --------------------------------------------------------------------- */

  /**
   * Lazily create the framebuffer, color texture, and depth/stencil
   * renderbuffer for the given GL context. Idempotent — calling again with
   * the same GL context is a no-op.
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @returns {WebGLFramebuffer|null}
   */
  _ensureGL(gl) {
    if (!gl) return null;

    // If a different GL context is passed, dispose of the old resources first.
    if (this._gl && this._gl !== gl) {
      this._disposeGL();
    }
    this._gl = gl;

    if (this._isReady) return this.framebuffer;

    // ---- Framebuffer ----
    const fb = gl.createFramebuffer();
    if (!fb) {
      console.error('RenderTarget: failed to create framebuffer');
      return null;
    }
    this.framebuffer = fb;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // ---- Color attachment ----
    this._createColorTexture(gl);

    if (this.isCubeTarget) {
      // Attach face 0 by default. Use setCubeFace() to switch faces.
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_CUBE_MAP_POSITIVE_X + this._activeCubeFace,
        this.texture._glTexture,
        0
      );
    } else {
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        this.texture._glTexture,
        0
      );
    }

    // ---- Depth / stencil ----
    if (this.useDepthTexture) {
      this._createDepthTexture(gl);
    } else {
      this._createDepthStencilRenderbuffer(gl);
    }

    // Validate completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      const statusName = this._framebufferStatusName(gl, status);
      console.warn(`RenderTarget: framebuffer is not complete (${statusName})`);
    }

    // Restore default framebuffer binding.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this._isReady = true;
    return this.framebuffer;
  }

  /**
   * Allocate (or reallocate) the color texture storage.
   * @private
   */
  _createColorTexture(gl) {
    if (this.texture._glTexture) {
      gl.deleteTexture(this.texture._glTexture);
    }
    const tex = gl.createTexture();
    if (!tex) {
      console.error('RenderTarget: failed to create color texture');
      return;
    }
    this.texture._glTexture = tex;
    this.texture._gl = gl;

    const target = this.isCubeTarget ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
    const format = resolveGLConstant(gl, this.texture.format, gl.RGBA);
    const type = resolveGLConstant(gl, this.texture.type, gl.UNSIGNED_BYTE);

    // Resolve internal format. WebGL2 needs sized internal formats for some
    // type/format combinations (e.g. R32F); WebGL1 accepts the unsized form.
    let internalFormat = this.texture.internalFormat
      ? resolveGLConstant(gl, this.texture.internalFormat, format)
      : this._resolveInternalFormat(gl, format, type);

    const wrapS = resolveGLConstant(gl, this.texture.wrapS, gl.CLAMP_TO_EDGE);
    const wrapT = resolveGLConstant(gl, this.texture.wrapT, gl.CLAMP_TO_EDGE);
    const minFilter = resolveGLConstant(gl, this.texture.minFilter, gl.LINEAR);
    const magFilter = resolveGLConstant(gl, this.texture.magFilter, gl.LINEAR);

    gl.bindTexture(target, tex);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, magFilter);

    if (this.isCubeTarget) {
      for (let face = 0; face < 6; face++) {
        gl.texImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
          0,
          internalFormat,
          this.width,
          this.height,
          0,
          format,
          type,
          null
        );
      }
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        this.width,
        this.height,
        0,
        format,
        type,
        null
      );
    }

    if (this.generateMipmaps) {
      gl.generateMipmap(target);
    }
    this.texture.needsUpdate = false;
  }

  /**
   * Allocate (or reallocate) the depth texture storage. Only used when
   * `options.depthTexture === true`.
   * @private
   */
  _createDepthTexture(gl) {
    if (this.depthTexture === null) {
      this.depthTexture = new RenderTargetTexture(this.width, this.height, {
        format: 'DEPTH_COMPONENT',
        type: 'UNSIGNED_INT',
        wrapS: 'CLAMP_TO_EDGE',
        wrapT: 'CLAMP_TO_EDGE',
        minFilter: 'NEAREST',
        magFilter: 'NEAREST',
        name: 'renderTarget_depth'
      });
    }
    if (this.depthTexture._glTexture) {
      gl.deleteTexture(this.depthTexture._glTexture);
    }
    const tex = gl.createTexture();
    if (!tex) {
      console.warn('RenderTarget: failed to create depth texture (depth extension unavailable?)');
      return;
    }
    this.depthTexture._glTexture = tex;
    this.depthTexture._gl = gl;

    const format = resolveGLConstant(gl, this.depthTexture.format, gl.DEPTH_COMPONENT);
    const type = resolveGLConstant(gl, this.depthTexture.type, gl.UNSIGNED_INT);
    const internalFormat = this._resolveInternalFormat(gl, format, type);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      this.width,
      this.height,
      0,
      format,
      type,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      this.stencilBuffer ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      tex,
      0
    );
    this.depthTexture.needsUpdate = false;
  }

  /**
   * Allocate (or reallocate) the depth/stencil renderbuffer.
   * @private
   */
  _createDepthStencilRenderbuffer(gl) {
    if (!this.depthBuffer && !this.stencilBuffer) return;

    const useCombined = this.depthBuffer && this.stencilBuffer;
    const attachment = useCombined ? gl.DEPTH_STENCIL_ATTACHMENT
      : this.depthBuffer ? gl.DEPTH_ATTACHMENT
      : gl.STENCIL_ATTACHMENT;

    const internalFormat = useCombined
      ? (gl.DEPTH_STENCIL || 34041)
      : this.depthBuffer
        ? (gl.DEPTH_COMPONENT16 || 0x81A5)
        : (gl.STENCIL_INDEX8 || 0x8D48);

    let rb = this._depthRenderbuffer;
    if (!rb) {
      rb = gl.createRenderbuffer();
      if (!rb) {
        console.warn('RenderTarget: failed to create depth/stencil renderbuffer');
        return;
      }
      this._depthRenderbuffer = rb;
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, this.width, this.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, rb);
  }

  /**
   * Resolve the GL internal-format enum for a (format, type) pair. Prefers
   * WebGL2 sized formats when available; falls back to the unsized format
   * for WebGL1.
   * @private
   */
  _resolveInternalFormat(gl, format, type) {
    // WebGL2 sized internal formats
    const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' &&
      gl instanceof WebGL2RenderingContext;

    if (isWebGL2) {
      // Map a few common (format, type) pairs to sized internal formats.
      if (format === gl.RGBA) {
        if (type === gl.UNSIGNED_BYTE) return gl.RGBA8;
        if (type === (gl.FLOAT || 0x1406)) return gl.RGBA32F;
        if (type === (gl.HALF_FLOAT || 0x140B)) return gl.RGBA16F;
      }
      if (format === gl.RGB) {
        if (type === gl.UNSIGNED_BYTE) return gl.RGB8;
        if (type === (gl.FLOAT || 0x1406)) return gl.RGB32F;
      }
      if (format === (gl.RED || 0x1903)) {
        if (type === gl.UNSIGNED_BYTE) return gl.R8;
        if (type === (gl.FLOAT || 0x1406)) return gl.R32F;
        if (type === (gl.HALF_FLOAT || 0x140B)) return gl.R16F;
      }
      if (format === (gl.DEPTH_COMPONENT || 0x1902)) {
        if (type === gl.UNSIGNED_INT) return gl.DEPTH_COMPONENT24;
        if (type === (gl.UNSIGNED_SHORT || 0x1403)) return gl.DEPTH_COMPONENT16;
      }
      if (format === (gl.DEPTH_STENCIL || 34041)) {
        return gl.DEPTH24_STENCIL8;
      }
    }
    return format;
  }

  /**
   * Translate a framebuffer status code into a readable name.
   * @private
   */
  _framebufferStatusName(gl, status) {
    const map = {
      [gl.FRAMEBUFFER_COMPLETE]: 'FRAMEBUFFER_COMPLETE',
      [gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
      [gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
      [gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
      [gl.FRAMEBUFFER_UNSUPPORTED]: 'FRAMEBUFFER_UNSUPPORTED'
    };
    return map[status] || `0x${status.toString(16)}`;
  }

  /* --------------------------------------------------------------------- *
   * Cube map face selection
   * --------------------------------------------------------------------- */

  /**
   * For cube-map render targets, switch the active face attachment so the
   * next draw renders into face `faceIndex` (0..5).
   * @param {WebGLRenderingContext} gl
   * @param {number} faceIndex - 0..5 (POSITIVE_X, NEGATIVE_X, POSITIVE_Y, ...)
   */
  setCubeFace(gl, faceIndex) {
    if (!this.isCubeTarget) return;
    faceIndex = Math.max(0, Math.min(5, Math.floor(faceIndex)));
    if (!this._isReady) this._ensureGL(gl);
    if (!this.framebuffer) return;
    this._activeCubeFace = faceIndex;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex,
      this.texture._glTexture,
      0
    );
  }

  /* --------------------------------------------------------------------- *
   * Resize / disposal
   * --------------------------------------------------------------------- */

  /**
   * Resize the render target. Reallocates GPU storage on the next bind.
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    width = Math.max(1, Math.floor(Number(width) || 1));
    height = Math.max(1, Math.floor(Number(height) || 1));
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;
    this.texture.width = width;
    this.texture.height = height;
    if (this.depthTexture) {
      this.depthTexture.width = width;
      this.depthTexture.height = height;
    }

    // If we've already allocated GPU resources, reallocate now.
    if (this._isReady && this._gl) {
      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this.framebuffer);
      this._createColorTexture(this._gl);
      // Re-attach the (new) color texture
      if (this.isCubeTarget) {
        this._gl.framebufferTexture2D(
          this._gl.FRAMEBUFFER,
          this._gl.COLOR_ATTACHMENT0,
          this._gl.TEXTURE_CUBE_MAP_POSITIVE_X + this._activeCubeFace,
          this.texture._glTexture,
          0
        );
      } else {
        this._gl.framebufferTexture2D(
          this._gl.FRAMEBUFFER,
          this._gl.COLOR_ATTACHMENT0,
          this._gl.TEXTURE_2D,
          this.texture._glTexture,
          0
        );
      }
      if (this.useDepthTexture) {
        this._createDepthTexture(this._gl);
      } else {
        this._createDepthStencilRenderbuffer(this._gl);
      }
      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    }
    this.version++;
  }

  /**
   * Delete all GPU resources (framebuffer, textures, renderbuffers).
   * Safe to call multiple times.
   */
  dispose() {
    this._disposeGL();
  }

  /** @private */
  _disposeGL() {
    const gl = this._gl;
    if (!gl) return;

    if (this.framebuffer) {
      try { gl.deleteFramebuffer(this.framebuffer); } catch (_) { /* noop */ }
      this.framebuffer = null;
    }
    if (this.texture) {
      this.texture.dispose();
    }
    if (this.depthTexture) {
      this.depthTexture.dispose();
    }
    if (this._depthRenderbuffer) {
      try { gl.deleteRenderbuffer(this._depthRenderbuffer); } catch (_) { /* noop */ }
      this._depthRenderbuffer = null;
    }
    this._isReady = false;
    this._gl = null;
  }

  /* --------------------------------------------------------------------- *
   * Convenience accessors
   * --------------------------------------------------------------------- */

  /**
   * Get the color attachment texture.
   * @returns {RenderTargetTexture}
   */
  getTexture() {
    return this.texture;
  }

  /**
   * Get the depth attachment texture (or null if not allocated).
   * @returns {RenderTargetTexture|null}
   */
  getDepthTexture() {
    return this.depthTexture;
  }

  /**
   * Whether GPU resources have been allocated for a GL context.
   * @returns {boolean}
   */
  isReady() {
    return this._isReady;
  }

  /**
   * Bind this render target's framebuffer on the given GL context.
   * Allocates GPU resources on first use.
   * @param {WebGLRenderingContext} gl
   */
  bind(gl) {
    if (!this._isReady || this._gl !== gl) {
      this._ensureGL(gl);
    }
    if (this.framebuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }
  }

  /**
   * Unbind — restores the default framebuffer (the canvas).
   * @param {WebGLRenderingContext} gl
   */
  unbind(gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
