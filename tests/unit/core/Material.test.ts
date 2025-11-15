import { Material } from '../../../src/core/Material';

describe('Material', () => {
  let material: Material;

  beforeEach(() => {
    material = new Material();
  });

  afterEach(() => {
    material.dispose();
  });

  describe('Construction', () => {
    it('should create a material with default properties', () => {
      expect(material.type).toBe('Material');
      expect(material.visible).toBe(true);
      expect(material.transparent).toBe(false);
      expect(material.opacity).toBe(1.0);
      expect(material.blending).toBeDefined();
      expect(material.depthTest).toBe(true);
      expect(material.depthWrite).toBe(true);
      expect(material.stencilTest).toBe(false);
    });
  });

  describe('Visibility', () => {
    it('should toggle visibility correctly', () => {
      expect(material.visible).toBe(true);
      
      material.visible = false;
      expect(material.visible).toBe(false);
      
      material.visible = true;
      expect(material.visible).toBe(true);
    });
  });

  describe('Transparency', () => {
    it('should handle transparency correctly', () => {
      expect(material.transparent).toBe(false);
      expect(material.opacity).toBe(1.0);
      
      material.transparent = true;
      material.opacity = 0.5;
      
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.5);
    });

    it('should clamp opacity values', () => {
      material.opacity = -0.5;
      expect(material.opacity).toBe(0);
      
      material.opacity = 1.5;
      expect(material.opacity).toBe(1);
    });
  });

  describe('Depth Testing', () => {
    it('should handle depth test correctly', () => {
      expect(material.depthTest).toBe(true);
      
      material.depthTest = false;
      expect(material.depthTest).toBe(false);
    });

    it('should handle depth write correctly', () => {
      expect(material.depthWrite).toBe(true);
      
      material.depthWrite = false;
      expect(material.depthWrite).toBe(false);
    });
  });

  describe('Color', () => {
    it('should set and get color correctly', () => {
      const color = { r: 1, g: 0, b: 0 };
      
      material.color = color;
      expect(material.color).toEqual(color);
    });

    it('should set color using hex value', () => {
      const hexColor = 0xff0000;
      
      material.setColor(hexColor);
      expect(material.color.r).toBe(1);
      expect(material.color.g).toBe(0);
      expect(material.color.b).toBe(0);
    });
  });

  describe('Blending', () => {
    it('should set blending mode correctly', () => {
      expect(material.blending).toBeDefined();
      
      material.setBlending('additive');
      expect(material.blending.type).toBe('additive');
    });

    it('should support different blending modes', () => {
      const blendingModes = ['normal', 'additive', 'subtractive', 'multiply'];
      
      blendingModes.forEach(mode => {
        material.setBlending(mode);
        expect(material.blending.type).toBe(mode);
      });
    });
  });

  describe('Uniforms', () => {
    it('should manage uniforms correctly', () => {
      material.setUniform('testFloat', 1.0);
      material.setUniform('testColor', { r: 0, g: 1, b: 0 });
      
      expect(material.getUniform('testFloat')).toBe(1.0);
      expect(material.getUniform('testColor')).toEqual({ r: 0, g: 1, b: 0 });
    });

    it('should return undefined for non-existent uniforms', () => {
      expect(material.getUniform('nonExistent')).toBeUndefined();
    });
  });

  describe('Vertex Shader', () => {
    it('should set and get vertex shader correctly', () => {
      const vertexShader = `
        precision mediump float;
        attribute vec3 position;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      
      material.setVertexShader(vertexShader);
      expect(material.getVertexShader()).toBe(vertexShader);
    });
  });

  describe('Fragment Shader', () => {
    it('should set and get fragment shader correctly', () => {
      const fragmentShader = `
        precision mediump float;
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `;
      
      material.setFragmentShader(fragmentShader);
      expect(material.getFragmentShader()).toBe(fragmentShader);
    });
  });

  describe('Shader Compilation', () => {
    it('should compile shaders correctly', async () => {
      const vertexShader = `
        precision mediump float;
        attribute vec3 position;
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;
      
      const fragmentShader = `
        precision mediump float;
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `;
      
      material.setVertexShader(vertexShader);
      material.setFragmentShader(fragmentShader);
      
      await material.compile();
      
      expect(material.isCompiled()).toBe(true);
    });

    it('should handle compilation errors', async () => {
      const invalidShader = 'invalid shader code';
      
      material.setVertexShader(invalidShader);
      material.setFragmentShader(invalidShader);
      
      await material.compile();
      
      expect(material.isCompiled()).toBe(false);
    });
  });

  describe('Program Linking', () => {
    it('should link program correctly', async () => {
      const vertexShader = `
        precision mediump float;
        attribute vec3 position;
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;
      
      const fragmentShader = `
        precision mediump float;
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 1.0);
        }
      `;
      
      material.setVertexShader(vertexShader);
      material.setFragmentShader(fragmentShader);
      material.setColor({ r: 1, g: 0, b: 0 });
      
      await material.linkProgram();
      
      expect(material.isLinked()).toBe(true);
    });
  });

  describe('Uniform Updates', () => {
    it('should update color uniform correctly', () => {
      const color = { r: 0.5, g: 0.3, b: 0.7 };
      material.setColor(color);
      
      material.updateUniform('color');
      
      expect(material.getUniform('color')).toEqual(color);
    });

    it('should update opacity uniform correctly', () => {
      material.opacity = 0.8;
      
      material.updateUniform('opacity');
      
      expect(material.getUniform('opacity')).toBe(0.8);
    });
  });

  describe('Events', () => {
    it('should emit compilation events', () => {
      const compilationCallback = jest.fn();
      
      material.on('compiled', compilationCallback);
      
      material.emit('compiled');
      
      expect(compilationCallback).toHaveBeenCalled();
    });

    it('should emit disposal events', () => {
      const disposalCallback = jest.fn();
      
      material.on('disposed', disposalCallback);
      
      material.dispose();
      
      expect(disposalCallback).toHaveBeenCalled();
    });
  });

  describe('Disposal', () => {
    it('should dispose material resources correctly', () => {
      material.dispose();
      
      expect(material.disposed).toBe(true);
      expect(material.vertexShader).toBeNull();
      expect(material.fragmentShader).toBeNull();
      expect(material.program).toBeNull();
    });
  });

  describe('Cloning', () => {
    it('should clone material correctly', () => {
      material.setColor({ r: 1, g: 0, b: 0 });
      material.opacity = 0.5;
      material.transparent = true;
      
      const clonedMaterial = material.clone();
      
      expect(clonedMaterial.type).toBe(material.type);
      expect(clonedMaterial.color).toEqual(material.color);
      expect(clonedMaterial.opacity).toBe(material.opacity);
      expect(clonedMaterial.transparent).toBe(material.transparent);
    });
  });

  describe('Customization Hooks', () => {
    it('should provide customization hooks', () => {
      const beforeCompile = jest.fn();
      const afterCompile = jest.fn();
      const onBeforeRender = jest.fn();
      const onAfterRender = jest.fn();
      
      material.beforeCompile(beforeCompile);
      material.afterCompile(afterCompile);
      material.onBeforeRender(onBeforeRender);
      material.onAfterRender(onAfterRender);
      
      material.emit('beforeCompile');
      material.emit('afterCompile');
      material.emit('beforeRender');
      material.emit('afterRender');
      
      expect(beforeCompile).toHaveBeenCalled();
      expect(afterCompile).toHaveBeenCalled();
      expect(onBeforeRender).toHaveBeenCalled();
      expect(onAfterRender).toHaveBeenCalled();
    });
  });
});
