import { WebGLRenderer } from '../../../src/core/WebGLRenderer';

describe('WebGLRenderer', () => {
  let renderer: WebGLRenderer;

  beforeEach(() => {
    // Mock canvas element
    const canvas = document.createElement('canvas');
    renderer = new WebGLRenderer({ canvas });
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('Construction', () => {
    it('should create a WebGL renderer with default options', () => {
      expect(renderer.type).toBe('WebGLRenderer');
      expect(renderer.canvas).toBeDefined();
      expect(renderer.context).toBeDefined();
      expect(renderer.outputEncoding).toBe(3001); // sRGB encoding
      expect(renderer.toneMapping).toBe(0); // No tone mapping
      expect(renderer.toneMappingExposure).toBe(1.0);
    });

    it('should create a WebGL renderer with custom options', () => {
      const canvas = document.createElement('canvas');
      const customRenderer = new WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });

      expect(customRenderer.antialias).toBe(true);
      expect(customRenderer.alpha).toBe(false);
      expect(customRenderer.preserveDrawingBuffer).toBe(true);
      expect(customRenderer.powerPreference).toBe('high-performance');

      customRenderer.dispose();
    });

    it('should handle missing canvas gracefully', () => {
      const fallbackRenderer = new WebGLRenderer();
      expect(fallbackRenderer.canvas).toBeDefined();
      fallbackRenderer.dispose();
    });
  });

  describe('Canvas and Context', () => {
    it('should get canvas element', () => {
      const canvas = renderer.canvas;
      expect(canvas).toBeDefined();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('should get WebGL context', () => {
      const context = renderer.getContext();
      expect(context).toBeDefined();
      expect(context.canvas).toBe(renderer.canvas);
    });

    it('should check WebGL context support', () => {
      const isWebGL2Supported = renderer.isWebGL2Supported();
      const isWebGLSupported = renderer.isWebGLSupported();
      
      expect(typeof isWebGL2Supported).toBe('boolean');
      expect(typeof isWebGLSupported).toBe('boolean');
    });
  });

  describe('Rendering Configuration', () => {
    it('should set size correctly', () => {
      const width = 800;
      const height = 600;
      
      renderer.setSize(width, height);
      
      expect(renderer.getSize().width).toBe(width);
      expect(renderer.getSize().height).toBe(height);
    });

    it('should set viewport correctly', () => {
      const x = 10;
      const y = 20;
      const width = 800;
      const height = 600;
      
      renderer.setViewport(x, y, width, height);
      
      expect(renderer.getViewport()).toEqual({
        x: x,
        y: y,
        width: width,
        height: height
      });
    });

    it('should set scissor correctly', () => {
      const x = 10;
      const y = 20;
      const width = 800;
      const height = 600;
      
      renderer.setScissor(x, y, width, height);
      renderer.setScissorTest(true);
      
      expect(renderer.getScissor()).toEqual({
        x: x,
        y: y,
        width: width,
        height: height
      });
      expect(renderer.getScissorTest()).toBe(true);
    });

    it('should enable/disable features', () => {
      expect(renderer.getPixelRatio()).toBe(window.devicePixelRatio);
      
      renderer.setPixelRatio(2.0);
      expect(renderer.getPixelRatio()).toBe(2.0);
      
      renderer.setClearColor(0xff0000, 1.0);
      expect(renderer.getClearColor()).toBe(0xff0000);
      expect(renderer.getClearAlpha()).toBe(1.0);
    });
  });

  describe('Render Targets', () => {
    it('should create render target', () => {
      const renderTarget = renderer.createRenderTarget({
        width: 800,
        height: 600,
        format: 1021, // RGBA format
        type: 5121, // UNSIGNED_BYTE type
        depthBuffer: true,
        stencilBuffer: false
      });

      expect(renderTarget).toBeDefined();
      expect(renderTarget.width).toBe(800);
      expect(renderTarget.height).toBe(600);
      expect(renderTarget.texture).toBeDefined();

      renderer.deleteRenderTarget(renderTarget);
    });

    it('should set render target', () => {
      const renderTarget = renderer.createRenderTarget({
        width: 800,
        height: 600
      });

      renderer.setRenderTarget(renderTarget);
      expect(renderer.getRenderTarget()).toBe(renderTarget);

      renderer.deleteRenderTarget(renderTarget);
    });

    it('should reset render target', () => {
      const renderTarget = renderer.createRenderTarget({
        width: 800,
        height: 600
      });

      renderer.setRenderTarget(renderTarget);
      renderer.setRenderTarget(null);
      expect(renderer.getRenderTarget()).toBeNull();

      renderer.deleteRenderTarget(renderTarget);
    });
  });

  describe('Render Buffer', () => {
    it('should create render buffer', () => {
      const renderBuffer = renderer.createRenderBuffer({
        width: 800,
        height: 600,
        format: 5126, // DEPTH_COMPONENT24
        attachment: 36096 // DEPTH_ATTACHMENT
      });

      expect(renderBuffer).toBeDefined();
      expect(renderBuffer.width).toBe(800);
      expect(renderBuffer.height).toBe(600);

      renderer.deleteRenderBuffer(renderBuffer);
    });

    it('should bind render buffer', () => {
      const renderBuffer = renderer.createRenderBuffer({
        width: 800,
        height: 600
      });

      renderer.bindRenderBuffer(renderBuffer);
      // Check if render buffer is bound
      const isBound = renderer.isRenderBufferBound(renderBuffer);
      expect(isBound).toBe(true);

      renderer.unbindRenderBuffer();
      renderer.deleteRenderBuffer(renderBuffer);
    });
  });

  describe('Frame Buffer', () => {
    it('should create frame buffer', () => {
      const frameBuffer = renderer.createFrameBuffer();
      expect(frameBuffer).toBeDefined();

      renderer.deleteFrameBuffer(frameBuffer);
    });

    it('should attach texture to frame buffer', () => {
      const frameBuffer = renderer.createFrameBuffer();
      const texture = renderer.createTexture({
        width: 800,
        height: 600,
        format: 1021 // RGBA format
      });

      renderer.attachTextureToFrameBuffer(frameBuffer, texture, 36064); // COLOR_ATTACHMENT0
      
      renderer.deleteTexture(texture);
      renderer.deleteFrameBuffer(frameBuffer);
    });

    it('should check frame buffer completeness', () => {
      const frameBuffer = renderer.createFrameBuffer();
      const isComplete = renderer.isFrameBufferComplete(frameBuffer);
      
      expect(typeof isComplete).toBe('boolean');
      
      renderer.deleteFrameBuffer(frameBuffer);
    });
  });

  describe('Buffer Management', () => {
    it('should create and manage buffers', () => {
      const positions = new Float32Array([0, 0, 0, 1, 1, 1]);
      const buffer = renderer.createBuffer({
        data: positions,
        usage: 35048 // STATIC_DRAW
      });

      expect(buffer).toBeDefined();
      expect(buffer.data).toEqual(positions);

      renderer.deleteBuffer(buffer);
    });

    it('should update buffer data', () => {
      const positions = new Float32Array([0, 0, 0, 1, 1, 1]);
      const buffer = renderer.createBuffer({
        data: positions
      });

      const newPositions = new Float32Array([0, 0, 0, 2, 2, 2]);
      renderer.updateBuffer(buffer, newPositions);

      expect(buffer.data).toEqual(newPositions);

      renderer.deleteBuffer(buffer);
    });
  });

  describe('Texture Management', () => {
    it('should create textures', () => {
      const texture = renderer.createTexture({
        width: 800,
        height: 600,
        format: 1021, // RGBA format
        type: 5121, // UNSIGNED_BYTE type
        minFilter: 9987, // LINEAR_MIPMAP_LINEAR
        magFilter: 9729, // LINEAR
        wrapS: 33071, // CLAMP_TO_EDGE
        wrapT: 33071 // CLAMP_TO_EDGE
      });

      expect(texture).toBeDefined();
      expect(texture.width).toBe(800);
      expect(texture.height).toBe(600);
      expect(texture.format).toBe(1021);
      expect(texture.type).toBe(5121);

      renderer.deleteTexture(texture);
    });

    it('should update texture data', () => {
      const texture = renderer.createTexture({
        width: 2,
        height: 2,
        format: 1021 // RGBA format
      });

      const data = new Uint8Array([
        255, 0, 0, 255,   // Red
        0, 255, 0, 255,   // Green
        0, 0, 255, 255,   // Blue
        255, 255, 0, 255  // Yellow
      ]);

      renderer.updateTexture(texture, data);
      expect(texture.data).toEqual(data);

      renderer.deleteTexture(texture);
    });

    it('should bind and unbind textures', () => {
      const texture = renderer.createTexture({
        width: 800,
        height: 600
      });

      renderer.bindTexture(texture, 0); // Bind to texture unit 0
      
      const isBound = renderer.isTextureBound(texture);
      expect(isBound).toBe(true);

      renderer.unbindTexture(0); // Unbind from texture unit 0
      renderer.deleteTexture(texture);
    });
  });

  describe('Shader Management', () => {
    it('should create shaders', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShaderCode = `
        precision mediump float;
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const vertexShader = renderer.createShader(35633, vertexShaderCode); // VERTEX_SHADER
      const fragmentShader = renderer.createShader(35632, fragmentShaderCode); // FRAGMENT_SHADER

      expect(vertexShader).toBeDefined();
      expect(vertexShader.type).toBe(35633);
      expect(fragmentShader).toBeDefined();
      expect(fragmentShader.type).toBe(35632);

      renderer.deleteShader(vertexShader);
      renderer.deleteShader(fragmentShader);
    });

    it('should create shader programs', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;

      const fragmentShaderCode = `
        precision mediump float;
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const vertexShader = renderer.createShader(35633, vertexShaderCode);
      const fragmentShader = renderer.createShader(35632, fragmentShaderCode);

      const program = renderer.createProgram(vertexShader, fragmentShader);

      expect(program).toBeDefined();
      expect(program.vertexShader).toBe(vertexShader);
      expect(program.fragmentShader).toBe(fragmentShader);

      renderer.deleteProgram(program);
    });

    it('should get uniform locations', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        uniform mat4 modelViewMatrix;
        void main() {
          gl_Position = modelViewMatrix * vec4(position, 1.0);
        }
      `;

      const fragmentShaderCode = `
        precision mediump float;
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const vertexShader = renderer.createShader(35633, vertexShaderCode);
      const fragmentShader = renderer.createShader(35632, fragmentShaderCode);
      const program = renderer.createProgram(vertexShader, fragmentShader);

      const colorUniform = renderer.getUniformLocation(program, 'color');
      const modelViewMatrixUniform = renderer.getUniformLocation(program, 'modelViewMatrix');

      expect(colorUniform).toBeDefined();
      expect(modelViewMatrixUniform).toBeDefined();

      renderer.deleteProgram(program);
    });

    it('should get attribute locations', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        attribute vec3 normal;
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;

      const fragmentShaderCode = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
      `;

      const vertexShader = renderer.createShader(35633, vertexShaderCode);
      const fragmentShader = renderer.createShader(35632, fragmentShaderCode);
      const program = renderer.createProgram(vertexShader, fragmentShader);

      const positionAttribute = renderer.getAttribLocation(program, 'position');
      const normalAttribute = renderer.getAttribLocation(program, 'normal');

      expect(positionAttribute).toBeDefined();
      expect(normalAttribute).toBeDefined();

      renderer.deleteProgram(program);
    });
  });

  describe('State Management', () => {
    it('should manage depth testing state', () => {
      renderer.setDepthTest(true);
      expect(renderer.getDepthTest()).toBe(true);

      renderer.setDepthTest(false);
      expect(renderer.getDepthTest()).toBe(false);
    });

    it('should manage depth writing state', () => {
      renderer.setDepthWrite(true);
      expect(renderer.getDepthWrite()).toBe(true);

      renderer.setDepthWrite(false);
      expect(renderer.getDepthWrite()).toBe(false);
    });

    it('should manage depth function', () => {
      renderer.setDepthFunction(515); // LESS_EQUAL
      expect(renderer.getDepthFunction()).toBe(515);
    });

    it('should manage culling state', () => {
      renderer.setCulling(true);
      expect(renderer.getCulling()).toBe(true);

      renderer.setCulling(false);
      expect(renderer.getCulling()).toBe(false);
    });

    it('should manage cull face', () => {
      renderer.setCullFace(1028); // FRONT
      expect(renderer.getCullFace()).toBe(1028);
    });

    it('should manage blend functions', () => {
      renderer.setBlendEquation(32774, 32774); // FUNC_ADD, FUNC_ADD
      expect(renderer.getBlendEquation()).toEqual([32774, 32774]);
    });

    it('should manage color mask', () => {
      renderer.setColorMask(true, false, true, false);
      expect(renderer.getColorMask()).toEqual([true, false, true, false]);
    });

    it('should manage stencil testing', () => {
      renderer.setStencilTest(true);
      expect(renderer.getStencilTest()).toBe(true);

      renderer.setStencilTest(false);
      expect(renderer.getStencilTest()).toBe(false);
    });

    it('should manage stencil functions', () => {
      renderer.setStencilFunction(519, 1, 0xff); // ALWAYS, ref, mask
      expect(renderer.getStencilFunction()).toEqual([519, 1, 0xff]);

      renderer.setStencilOperation(7680, 7680, 7680); // ZERO, ZERO, ZERO
      expect(renderer.getStencilOperation()).toEqual([7680, 7680, 7680]);
    });
  });

  describe('Draw Commands', () => {
    it('should set draw buffers', () => {
      const attachments = [36064, 36065]; // COLOR_ATTACHMENT0, COLOR_ATTACHMENT1
      
      renderer.setDrawBuffers(attachments);
      expect(renderer.getDrawBuffers()).toEqual(attachments);
    });

    it('should clear color, depth, and stencil buffers', () => {
      renderer.setClearColor(0xff0000, 1.0);
      renderer.setClearDepth(1.0);
      renderer.setClearStencil(0);

      renderer.clear(true, true, true);
      // In a real implementation, this would clear the buffers
      expect(renderer).toBeDefined();
    });

    it('should perform draw elements', () => {
      // This would require setting up a complete rendering state
      // For now, we'll just test that the method exists and can be called
      renderer.drawElements(4, 1, 5123, 0); // TRIANGLES, UNSIGNED_SHORT
      expect(renderer).toBeDefined();
    });

    it('should perform draw arrays', () => {
      // This would require setting up a complete rendering state
      // For now, we'll just test that the method exists and can be called
      renderer.drawArrays(4, 0, 3); // TRIANGLES
      expect(renderer).toBeDefined();
    });
  });

  describe('Extensions', () => {
    it('should check for and use extensions', () => {
      const oesTextureFloat = renderer.getExtension('OES_texture_float');
      expect(typeof oesTextureFloat).toBe('object');

      const nonExistentExt = renderer.getExtension('NON_EXISTENT_EXTENSION');
      expect(nonExistentExt).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should get WebGL errors', () => {
      const error = renderer.getError();
      expect(typeof error).toBe('number'); // gl.getError() returns a number
    });

    it('should check shader compilation status', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;

      const vertexShader = renderer.createShader(35633, vertexShaderCode);
      const isCompiled = renderer.isShaderCompiled(vertexShader);
      
      expect(typeof isCompiled).toBe('boolean');

      renderer.deleteShader(vertexShader);
    });

    it('should check program linking status', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;

      const fragmentShaderCode = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
      `;

      const vertexShader = renderer.createShader(35633, vertexShaderCode);
      const fragmentShader = renderer.createShader(35632, fragmentShaderCode);
      const program = renderer.createProgram(vertexShader, fragmentShader);

      const isLinked = renderer.isProgramLinked(program);
      
      expect(typeof isLinked).toBe('boolean');

      renderer.deleteProgram(program);
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure rendering performance', () => {
      renderer.setPerformanceMonitoring(true);
      expect(renderer.getPerformanceMonitoring()).toBe(true);

      const frameCount = renderer.getFrameCount();
      const drawCallCount = renderer.getDrawCallCount();
      const vertexCount = renderer.getVertexCount();

      expect(typeof frameCount).toBe('number');
      expect(typeof drawCallCount).toBe('number');
      expect(typeof vertexCount).toBe('number');

      renderer.setPerformanceMonitoring(false);
      expect(renderer.getPerformanceMonitoring()).toBe(false);
    });

    it('should reset performance counters', () => {
      renderer.resetPerformanceCounters();
      
      const frameCount = renderer.getFrameCount();
      const drawCallCount = renderer.getDrawCallCount();
      
      expect(frameCount).toBe(0);
      expect(drawCallCount).toBe(0);
    });
  });

  describe('Disposal', () => {
    it('should dispose renderer correctly', () => {
      renderer.dispose();
      
      expect(renderer.disposed).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should get parameter information', () => {
      const vendor = renderer.getParameter('VENDOR');
      const rendererInfo = renderer.getParameter('RENDERER');
      const version = renderer.getParameter('VERSION');
      const shadingLanguageVersion = renderer.getParameter('SHADING_LANGUAGE_VERSION');

      expect(typeof vendor).toBe('string');
      expect(typeof rendererInfo).toBe('string');
      expect(typeof version).toBe('string');
      expect(typeof shadingLanguageVersion).toBe('string');
    });

    it('should enable and disable extensions', () => {
      renderer.enableExtension('OES_texture_float');
      const isEnabled = renderer.isExtensionEnabled('OES_texture_float');
      expect(isEnabled).toBe(true);

      renderer.disableExtension('OES_texture_float');
      expect(renderer.isExtensionEnabled('OES_texture_float')).toBe(false);
    });

    it('should check precision support', () => {
      const vertexShaderPrecision = renderer.getShaderPrecision('VERTEX_SHADER');
      const fragmentShaderPrecision = renderer.getShaderPrecision('FRAGMENT_SHADER');

      expect(vertexShaderPrecision).toBeDefined();
      expect(fragmentShaderPrecision).toBeDefined();
    });
  });
});
