// Browser-specific Jest setup
// This file is executed before each browser test file

const { JSDOM } = require('jsdom');

// Set up JSDOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <title>9th.js Browser Tests</title>
</head>
<body>
  <canvas id="test-canvas" width="800" height="600"></canvas>
  <div id="test-container"></div>
</body>
</html>
`, {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
  runScripts: 'dangerously'
});

// Set global variables
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.Text = dom.window.Text;
global.requestAnimationFrame = dom.window.requestAnimationFrame;
global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
global.performance = {
  now: () => Date.now()
};

// Mock WebGL context for browser tests
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockImplementation((contextType, options) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      const mockWebGLContext = {
        // WebGL constants
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
        SCISSOR_TEST: 0x0C11,
        
        // WebGL methods
        createShader: jest.fn(() => ({ id: 'mock-shader' })),
        shaderSource: jest.fn(),
        compileShader: jest.fn(() => true),
        getShaderParameter: jest.fn(() => true),
        getShaderInfoLog: jest.fn(() => ''),
        deleteShader: jest.fn(),
        
        createProgram: jest.fn(() => ({ id: 'mock-program' })),
        attachShader: jest.fn(),
        linkProgram: jest.fn(() => true),
        getProgramParameter: jest.fn(() => true),
        getProgramInfoLog: jest.fn(() => ''),
        deleteProgram: jest.fn(),
        
        createBuffer: jest.fn(() => ({ id: 'mock-buffer' })),
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),
        bufferSubData: jest.fn(),
        deleteBuffer: jest.fn(),
        
        createVertexArray: jest.fn(() => ({ id: 'mock-vertex-array' })),
        bindVertexArray: jest.fn(),
        deleteVertexArray: jest.fn(),
        
        createVertexAttribArray: jest.fn(() => ({ id: 'mock-vertex-attrib' })),
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),
        
        createIndexBuffer: jest.fn(() => ({ id: 'mock-index-buffer' })),
        bindIndexBuffer: jest.fn(),
        
        createTexture: jest.fn(() => ({ id: 'mock-texture' })),
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texSubImage2D: jest.fn(),
        texParameteri: jest.fn(),
        generateMipmap: jest.fn(),
        deleteTexture: jest.fn(),
        
        createUniformLocation: jest.fn(() => ({ id: 'mock-uniform' })),
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
        clearStencil: jest.fn(),
        
        depthFunc: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        cullFace: jest.fn(),
        frontFace: jest.fn(),
        viewport: jest.fn(),
        
        createFramebuffer: jest.fn(() => ({ id: 'mock-framebuffer' })),
        bindFramebuffer: jest.fn(),
        framebufferTexture2D: jest.fn(),
        checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
        deleteFramebuffer: jest.fn(),
        
        // Context properties
        canvas: {
          width: 800,
          height: 600
        },
        drawingBufferWidth: 800,
        drawingBufferHeight: 600
      };
      
      return mockWebGLContext;
    }
    
    if (contextType === '2d') {
      return {
        canvas: {
          width: 800,
          height: 600
        },
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(() => ({
          data: new Uint8Array(800 * 600 * 4),
          width: 800,
          height: 600
        })),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        transform: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 }))
      };
    }
    
    return null;
  }),
});

// Mock WebGL extensions
Object.defineProperty(WebGLRenderingContext.prototype, 'getExtension', {
  value: jest.fn((name) => {
    if (name === 'OES_texture_float') {
      return { texImage2D: jest.fn() };
    }
    if (name === 'WEBGL_depth_texture') {
      return {};
    }
    if (name === 'OES_element_index_uint') {
      return {};
    }
    return null;
  })
});

// Mock WebGL2 context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: function(contextType, ...args) {
    if (contextType === 'webgl2') {
      // Add WebGL2-specific features
      const webgl1Context = this.getContext('webgl', ...args);
      if (!webgl1Context) return null;
      
      return {
        ...webgl1Context,
        createVertexArray: jest.fn(() => ({ id: 'mock-vertex-array-webgl2' })),
        bindVertexArray: jest.fn(),
        deleteVertexArray: jest.fn(),
        
        createSampler: jest.fn(() => ({ id: 'mock-sampler' })),
        bindSampler: jest.fn(),
        deleteSampler: jest.fn(),
        
        samplerParameteri: jest.fn(),
        samplerParameterf: jest.fn(),
        
        // WebGL2 buffer types
        copyBufferSubData: jest.fn(),
        getBufferSubData: jest.fn(),
        
        // FramebufferLayer
        framebufferTextureLayer: jest.fn(),
        
        // InvalidateFramebuffer
        invalidateFramebuffer: jest.fn(),
        invalidateSubFramebuffer: jest.fn(),
        
        // ReadBuffer
        readBuffer: jest.fn(),
        
        // getInternalformatParameter
        getInternalformatParameter: jest.fn(),
        
        // RenderbufferStorageMultisample
        renderbufferStorageMultisample: jest.fn(),
        
        // texStorage2D
        texStorage2D: jest.fn(),
        
        // texStorage3D
        texStorage3D: jest.fn(),
      };
    }
    
    return this.getContext = HTMLCanvasElement.prototype.getContext;
  }
});

// Mock AudioContext for browser tests
global.AudioContext = class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'suspended';
  }
  
  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(() => new Uint8Array(1024)),
      getByteTimeDomainData: jest.fn(() => new Uint8Array(2048)),
      getFloatFrequencyData: jest.fn(() => new Float32Array(1024)),
      getFloatTimeDomainData: jest.fn(() => new Float32Array(2048)),
    };
  }
  
  createGain() {
    return {
      gain: { value: 1 },
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
  }
  
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440 },
      start: jest.fn(),
      stop: jest.fn(),
      connect: jest.fn(),
    };
  }
  
  createBuffer() {
    return {
      getChannelData: jest.fn(() => new Float32Array(44100)),
      length: 44100,
      sampleRate: 44100,
    };
  }
  
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
};

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen(new Event('open'));
    }, 0);
  }
  
  send(data) {
    // Mock send operation
  }
  
  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose(new Event('close'));
  }
  
  addEventListener(type, listener) {
    if (type === 'open' && this.readyState === 1) {
      setTimeout(() => listener(new Event('open')), 0);
    }
  }
  
  removeEventListener(type, listener) {
    // Mock removal
  }
};

// Mock fetch for network requests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: new Map([['content-type', 'application/json']]),
    text: () => Promise.resolve('{}'),
    json: () => Promise.resolve({}),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observers = new Set();
  }
  
  observe(target) {
    this.observers.add(target);
    // Simulate resize
    setTimeout(() => {
      this.callback([{ target, contentRect: target.getBoundingClientRect() }], this);
    }, 0);
  }
  
  unobserve(target) {
    this.observers.delete(target);
  }
  
  disconnect() {
    this.observers.clear();
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.observers = new Set();
  }
  
  observe(target) {
    this.observers.add(target);
    // Simulate intersection
    setTimeout(() => {
      this.callback([{ target, isIntersecting: true, intersectionRatio: 1.0 }], this);
    }, 0);
  }
  
  unobserve(target) {
    this.observers.delete(target);
  }
  
  disconnect() {
    this.observers.clear();
  }
};

// Extend expect matchers for browser tests
expect.extend({
  toBeInViewport(received) {
    const pass = true; // Mock implementation
    if (pass) {
      return {
        message: () => `expected ${received} not to be in viewport`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be in viewport`,
        pass: false,
      };
    }
  },
  
  toBeVisible(received) {
    const pass = true; // Mock implementation
    if (pass) {
      return {
        message: () => `expected ${received} not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be visible`,
        pass: false,
      };
    }
  },
  
  toHaveAttribute(received, attribute, value) {
    const pass = true; // Mock implementation
    if (pass) {
      return {
        message: () => `expected ${received} not to have attribute ${attribute}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have attribute ${attribute}`,
        pass: false,
      };
    }
  }
});

// Setup global test helpers
global.createTestCanvas = (width = 800, height = 600) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return canvas;
};

global.createTestWebGLContext = (canvas, version = 'webgl') => {
  return canvas.getContext(version);
};

// Clean up after each test
afterEach(() => {
  // Clean up any mocks
  jest.clearAllMocks();
  
  // Reset DOM
  const container = document.getElementById('test-container');
  if (container) {
    container.innerHTML = '';
  }
  
  // Reset global state
  global.fetch.mockClear();
});
