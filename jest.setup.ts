// Jest setup file
// This file is executed before each test file

// Mock HTMLCanvasElement and WebGL context for testing
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockImplementation((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        getShaderParameter: jest.fn(() => true),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        getProgramParameter: jest.fn(() => true),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        createVertexArray: jest.fn(),
        bindVertexArray: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        createTexture: jest.fn(),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texParameteri: jest.fn(),
        clear: jest.fn(),
        clearColor: jest.fn(),
        clearDepth: jest.fn(),
        clearStencil: jest.fn(),
        depthFunc: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        viewport: jest.fn(),
        cullFace: jest.fn(),
        frontFace: jest.fn(),
        drawElements: jest.fn(),
        drawArrays: jest.fn(),
        createFramebuffer: jest.fn(),
        bindFramebuffer: jest.fn(),
        framebufferTexture2D: jest.fn(),
        checkFramebufferStatus: jest.fn(),
        deleteFramebuffer: jest.fn(),
        canvas: {
          width: 800,
          height: 600
        },
        drawingBufferWidth: 800,
        drawingBufferHeight: 600,
        SCISSOR_TEST: 0x0C11,
        DEPTH_TEST: 0x0B71,
        CULL_FACE: 0x0B44,
        BACK: 0x0404,
        FRONT: 0x0405,
        FRONT_AND_BACK: 0x0408,
        NEVER: 0x0200,
        LESS: 0x0201,
        EQUAL: 0x0202,
        LEQUAL: 0x0203,
        GREATER: 0x0204,
        NOTEQUAL: 0x0205,
        GEQUAL: 0x0206,
        ALWAYS: 0x0207,
        viewport: jest.fn(),
        compileShader: jest.fn(),
        getShaderParameter: jest.fn(() => true),
        getShaderInfoLog: jest.fn(() => ''),
        deleteShader: jest.fn(),
        createProgram: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        getProgramParameter: jest.fn(() => true),
        getProgramInfoLog: jest.fn(() => ''),
        deleteProgram: jest.fn(),
        createShader: jest.fn(),
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        createBuffer: jest.fn(),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        bufferSubData: jest.fn(),
        createVertexArray: jest.fn(),
        bindVertexArray: jest.fn(),
        createVertexAttribArray: jest.fn(),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        createIndexBuffer: jest.fn(),
        bindIndexBuffer: jest.fn(),
        createTexture: jest.fn(),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texSubImage2D: jest.fn(),
        texParameteri: jest.fn(),
        generateMipmap: jest.fn(),
        createUniformLocation: jest.fn(),
        uniform1f: jest.fn(),
        uniform2f: jest.fn(),
        uniform3f: jest.fn(),
        uniform4f: jest.fn(),
        uniform1i: jest.fn(),
        uniformMatrix4fv: jest.fn(),
        activeTexture: jest.fn(),
        useProgram: jest.fn(),
        drawElements: jest.fn(),
        drawArrays: jest.fn(),
        clear: jest.fn(),
        clearColor: jest.fn(),
        clearDepth: jest.fn(),
        depthFunc: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        cullFace: jest.fn(),
        frontFace: jest.fn(),
        viewport: jest.fn(),
      };
    }
    return null;
  }),
});

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Extend expect matchers if needed
expect.extend({
  toBeApproximately(received: number, expected: number, precision = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision) / 2;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be approximately ${expected} with ${precision} decimal places`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be approximately ${expected} with ${precision} decimal places`,
        pass: false,
      };
    }
  },
});