import { MeshBasicMaterial } from '../../../src/materials/MeshBasicMaterial';
import { Color } from '../../../src/core/Color';

describe('MeshBasicMaterial', () => {
  let material: MeshBasicMaterial;

  beforeEach(() => {
    material = new MeshBasicMaterial();
  });

  afterEach(() => {
    material.dispose();
  });

  describe('Construction', () => {
    it('should create a basic material with default properties', () => {
      expect(material.type).toBe('MeshBasicMaterial');
      expect(material.color).toEqual({ r: 1, g: 1, b: 1 }); // White by default
      expect(material.opacity).toBe(1.0);
      expect(material.transparent).toBe(false);
      expect(material.side).toBe(2); // FrontSide
      expect(material.depthTest).toBe(true);
      expect(material.depthWrite).toBe(true);
      expect(material.blending).toBe(1); // Normal blending
    });

    it('should create a basic material with custom color', () => {
      const redMaterial = new MeshBasicMaterial({ color: 0xff0000 });
      expect(redMaterial.color).toEqual({ r: 1, g: 0, b: 0 });
      redMaterial.dispose();
    });

    it('should create a basic material with custom opacity', () => {
      const transparentMaterial = new MeshBasicMaterial({ 
        color: 0xffffff,
        opacity: 0.5,
        transparent: true
      });
      expect(transparentMaterial.opacity).toBe(0.5);
      expect(transparentMaterial.transparent).toBe(true);
      transparentMaterial.dispose();
    });
  });

  describe('Color Management', () => {
    it('should set and get color using hex value', () => {
      material.setColor(0xff0000);
      expect(material.color.r).toBe(1);
      expect(material.color.g).toBe(0);
      expect(material.color.b).toBe(0);
    });

    it('should set and get color using RGB object', () => {
      const redColor = { r: 1, g: 0, b: 0 };
      material.setColor(redColor);
      expect(material.color).toEqual(redColor);
    });

    it('should handle color normalization', () => {
      material.setColor({ r: 255, g: 128, b: 64 });
      expect(material.color.r).toBeApproximately(1.0, 2);
      expect(material.color.g).toBeApproximately(0.502, 2);
      expect(material.color.b).toBeApproximately(0.251, 2);
    });

    it('should clamp color values', () => {
      material.setColor({ r: 2, g: -0.5, b: 1.5 });
      expect(material.color.r).toBe(1);
      expect(material.color.g).toBe(0);
      expect(material.color.b).toBe(1);
    });

    it('should support color multiplication', () => {
      material.setColor(0xff0000);
      material.multiplyColor(0.5);
      expect(material.color.r).toBe(0.5);
      expect(material.color.g).toBe(0);
      expect(material.color.b).toBe(0);
    });

    it('should support color addition', () => {
      material.setColor(0xff0000);
      material.addColor(0x00ff00);
      expect(material.color.r).toBe(1);
      expect(material.color.g).toBe(1);
      expect(material.color.b).toBe(0);
    });
  });

  describe('Transparency', () => {
    it('should handle transparency correctly', () => {
      material.opacity = 0.5;
      material.transparent = true;
      
      expect(material.opacity).toBe(0.5);
      expect(material.transparent).toBe(true);
    });

    it('should update material uniform when opacity changes', () => {
      material.opacity = 0.8;
      material.updateUniform('opacity');
      
      expect(material.getUniform('opacity')).toBe(0.8);
    });

    it('should handle alpha blending correctly', () => {
      material.transparent = true;
      material.blending = 2; // Additive blending
      
      expect(material.transparent).toBe(true);
      expect(material.blending).toBe(2);
    });
  });

  describe('Material Sides', () => {
    it('should set material side correctly', () => {
      material.side = 0; // BackSide
      expect(material.side).toBe(0);
      
      material.side = 1; // FrontSide
      expect(material.side).toBe(1);
      
      material.side = 2; // DoubleSide
      expect(material.side).toBe(2);
    });

    it('should update material side in shader uniforms', () => {
      material.side = 1; // FrontSide
      material.updateUniform('materialSide');
      
      expect(material.getUniform('materialSide')).toBe(1);
    });
  });

  describe('Depth Testing', () => {
    it('should handle depth test settings', () => {
      material.depthTest = false;
      expect(material.depthTest).toBe(false);
      
      material.depthTest = true;
      expect(material.depthTest).toBe(true);
    });

    it('should handle depth write settings', () => {
      material.depthWrite = false;
      expect(material.depthWrite).toBe(false);
      
      material.depthWrite = true;
      expect(material.depthWrite).toBe(true);
    });

    it('should update depth write uniform', () => {
      material.depthWrite = false;
      material.updateUniform('depthWrite');
      
      expect(material.getUniform('depthWrite')).toBe(false);
    });
  });

  describe('Blending Modes', () => {
    it('should support different blending modes', () => {
      material.blending = 1; // Normal
      expect(material.blending).toBe(1);
      
      material.blending = 2; // Additive
      expect(material.blending).toBe(2);
      
      material.blending = 3; // Subtractive
      expect(material.blending).toBe(3);
      
      material.blending = 4; // Multiply
      expect(material.blending).toBe(4);
    });

    it('should update blending uniforms', () => {
      material.blending = 2; // Additive
      material.updateUniform('blending');
      
      expect(material.getUniform('blending')).toBe(2);
    });
  });

  describe('Vertex Colors', () => {
    it('should support vertex colors', () => {
      material.vertexColors = true;
      expect(material.vertexColors).toBe(true);
      
      material.vertexColors = false;
      expect(material.vertexColors).toBe(false);
    });

    it('should update vertex color uniform', () => {
      material.vertexColors = true;
      material.updateUniform('vertexColors');
      
      expect(material.getUniform('vertexColors')).toBe(true);
    });
  });

  describe('Wireframe Rendering', () => {
    it('should support wireframe mode', () => {
      material.wireframe = true;
      expect(material.wireframe).toBe(true);
      
      material.wireframe = false;
      expect(material.wireframe).toBe(false);
    });

    it('should update wireframe uniform', () => {
      material.wireframe = true;
      material.updateUniform('wireframe');
      
      expect(material.getUniform('wireframe')).toBe(true);
    });
  });

  describe('Line Width', () => {
    it('should set line width for line materials', () => {
      material.lineWidth = 2.0;
      expect(material.lineWidth).toBe(2.0);
      
      material.lineWidth = 0.5;
      expect(material.lineWidth).toBe(0.5);
    });

    it('should clamp line width to valid range', () => {
      material.lineWidth = -1;
      expect(material.lineWidth).toBe(0);
      
      material.lineWidth = 10;
      expect(material.lineWidth).toBeLessThanOrEqual(1); // Typically clamped to 1 in WebGL
    });
  });

  describe('Color Dithering', () => {
    it('should support color dithering', () => {
      material.dithering = true;
      expect(material.dithering).toBe(true);
      
      material.dithering = false;
      expect(material.dithering).toBe(false);
    });

    it('should update dithering uniform', () => {
      material.dithering = true;
      material.updateUniform('dithering');
      
      expect(material.getUniform('dithering')).toBe(true);
    });
  });

  describe('Lighting Independence', () => {
    it('should not require lighting', () => {
      // MeshBasicMaterial is not affected by lights
      expect(material.lights).toBe(false);
      
      material.lights = true;
      expect(material.lights).toBe(true);
    });
  });

  describe('Shader Compilation', () => {
    it('should compile with default settings', async () => {
      await material.compile();
      
      expect(material.isCompiled()).toBe(true);
    });

    it('should compile with transparency', async () => {
      material.transparent = true;
      material.opacity = 0.5;
      
      await material.compile();
      
      expect(material.isCompiled()).toBe(true);
    });

    it('should compile with vertex colors', async () => {
      material.vertexColors = true;
      
      await material.compile();
      
      expect(material.isCompiled()).toBe(true);
    });

    it('should compile with wireframe', async () => {
      material.wireframe = true;
      
      await material.compile();
      
      expect(material.isCompiled()).toBe(true);
    });
  });

  describe('Uniform Updates', () => {
    it('should update color uniform', () => {
      material.setColor(0xff0000);
      material.updateUniform('color');
      
      const colorUniform = material.getUniform('color');
      expect(colorUniform.r).toBe(1);
      expect(colorUniform.g).toBe(0);
      expect(colorUniform.b).toBe(0);
    });

    it('should update opacity uniform', () => {
      material.opacity = 0.8;
      material.updateUniform('opacity');
      
      expect(material.getUniform('opacity')).toBe(0.8);
    });

    it('should update multiple uniforms', () => {
      material.setColor(0xff0000);
      material.opacity = 0.7;
      material.transparent = true;
      
      material.updateUniform('color');
      material.updateUniform('opacity');
      material.updateUniform('transparent');
      
      expect(material.getUniform('color').r).toBe(1);
      expect(material.getUniform('opacity')).toBe(0.7);
      expect(material.getUniform('transparent')).toBe(true);
    });
  });

  describe('Events', () => {
    it('should emit compilation events', async () => {
      const compilationCallback = jest.fn();
      
      material.on('compiled', compilationCallback);
      await material.compile();
      
      expect(compilationCallback).toHaveBeenCalled();
    });

    it('should emit disposal events', () => {
      const disposalCallback = jest.fn();
      
      material.on('disposed', disposalCallback);
      material.dispose();
      
      expect(disposalCallback).toHaveBeenCalled();
    });
  });

  describe('Cloning', () => {
    it('should clone material correctly', () => {
      material.setColor(0xff0000);
      material.opacity = 0.5;
      material.transparent = true;
      material.vertexColors = true;
      material.wireframe = true;
      
      const clonedMaterial = material.clone();
      
      expect(clonedMaterial.type).toBe('MeshBasicMaterial');
      expect(clonedMaterial.color).toEqual(material.color);
      expect(clonedMaterial.opacity).toBe(material.opacity);
      expect(clonedMaterial.transparent).toBe(material.transparent);
      expect(clonedMaterial.vertexColors).toBe(material.vertexColors);
      expect(clonedMaterial.wireframe).toBe(material.wireframe);
      
      clonedMaterial.dispose();
    });

    it('should clone material without affecting original', () => {
      material.setColor(0xff0000);
      const clonedMaterial = material.clone();
      
      clonedMaterial.setColor(0x00ff00);
      
      expect(material.color.r).toBe(1);
      expect(clonedMaterial.color.g).toBe(1);
      
      clonedMaterial.dispose();
    });
  });

  describe('Material Properties Update', () => {
    it('should detect property changes', () => {
      const propertyChangedCallback = jest.fn();
      
      material.on('propertyChanged', propertyChangedCallback);
      
      material.opacity = 0.5;
      
      expect(propertyChangedCallback).toHaveBeenCalledWith('opacity', 0.5);
    });

    it('should trigger shader recompilation on property changes', async () => {
      material.compile();
      expect(material.isCompiled()).toBe(true);
      
      material.opacity = 0.5;
      material.transparent = true;
      
      // Should trigger recompilation
      await material.compile();
      
      expect(material.isCompiled()).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle multiple property updates efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        material.opacity = i / 1000;
        material.updateUniform('opacity');
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should complete efficiently
    });

    it('should handle multiple color updates efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const color = i % 256;
        material.setColor(color << 16);
        material.updateUniform('color');
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Serialization', () => {
    it('should serialize material correctly', () => {
      material.setColor(0xff0000);
      material.opacity = 0.8;
      material.transparent = true;
      material.vertexColors = true;
      
      const data = material.toJSON();
      
      expect(data).toBeDefined();
      expect(data.type).toBe('MeshBasicMaterial');
      expect(data.color).toBe(0xff0000);
      expect(data.opacity).toBe(0.8);
      expect(data.transparent).toBe(true);
      expect(data.vertexColors).toBe(true);
    });

    it('should serialize with default values', () => {
      const data = material.toJSON();
      
      expect(data.opacity).toBe(1.0);
      expect(data.transparent).toBe(false);
      expect(data.vertexColors).toBe(false);
      expect(data.wireframe).toBe(false);
    });
  });

  describe('Disposal', () => {
    it('should dispose material correctly', () => {
      material.dispose();
      
      expect(material.disposed).toBe(true);
    });

    it('should clean up shaders on disposal', () => {
      material.compile();
      expect(material.isCompiled()).toBe(true);
      
      material.dispose();
      
      expect(material.vertexShader).toBeNull();
      expect(material.fragmentShader).toBeNull();
      expect(material.program).toBeNull();
    });
  });

  describe('Static Factory Methods', () => {
    it('should create material from JSON', () => {
      const json = {
        type: 'MeshBasicMaterial',
        color: 0xff0000,
        opacity: 0.8,
        transparent: true
      };
      
      const materialFromJSON = MeshBasicMaterial.fromJSON(json);
      
      expect(materialFromJSON.color.r).toBe(1);
      expect(materialFromJSON.opacity).toBe(0.8);
      expect(materialFromJSON.transparent).toBe(true);
      
      materialFromJSON.dispose();
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJSON = {
        type: 'InvalidMaterial',
        color: 0xff0000
      };
      
      const materialFromJSON = MeshBasicMaterial.fromJSON(invalidJSON);
      
      expect(materialFromJSON).toBeNull();
    });
  });
});
