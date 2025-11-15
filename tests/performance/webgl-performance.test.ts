import { WebGLRenderer } from '../../../src/core/WebGLRenderer';
import { BoxGeometry } from '../../../src/geometry/BoxGeometry';
import { SphereGeometry } from '../../../src/geometry/SphereGeometry';
import { MeshBasicMaterial } from '../../../src/materials/MeshBasicMaterial';
import { Scene } from '../../../src/core/Scene';
import { Mesh } from '../../../src/core/Mesh';

describe('WebGL Performance Tests', () => {
  let canvas: HTMLCanvasElement;
  let renderer: WebGLRenderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    renderer = new WebGLRenderer({ canvas });
    renderer.setPerformanceMonitoring(true);
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('Buffer Creation Performance', () => {
    it('should create buffers efficiently', () => {
      const testData = new Float32Array(1000 * 3); // 1000 vertices with 3 components each
      
      const startTime = performance.now();
      const bufferCount = 100;
      const buffers: any[] = [];
      
      for (let i = 0; i < bufferCount; i++) {
        const buffer = renderer.createBuffer({
          data: testData,
          usage: 35048 // STATIC_DRAW
        });
        buffers.push(buffer);
      }
      
      const endTime = performance.now();
      const createTime = endTime - startTime;
      
      expect(createTime).toBeLessThan(100); // Should create buffers quickly
      expect(buffers.length).toBe(bufferCount);
      
      buffers.forEach(buffer => renderer.deleteBuffer(buffer));
    });

    it('should update buffer data efficiently', () => {
      const buffer = renderer.createBuffer({
        data: new Float32Array(1000 * 3)
      });
      
      const testData = new Float32Array(1000 * 3);
      testData.fill(1.0); // Fill with test data
      
      const startTime = performance.now();
      const updateCount = 50;
      
      for (let i = 0; i < updateCount; i++) {
        testData.fill(Math.random());
        renderer.updateBuffer(buffer, testData);
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(200); // Should update buffers efficiently
      
      renderer.deleteBuffer(buffer);
    });
  });

  describe('Texture Performance', () => {
    it('should create textures efficiently', () => {
      const startTime = performance.now();
      const textureCount = 50;
      const textures: any[] = [];
      
      for (let i = 0; i < textureCount; i++) {
        const texture = renderer.createTexture({
          width: 512,
          height: 512,
          format: 1021, // RGBA format
          type: 5121, // UNSIGNED_BYTE type
          minFilter: 9987, // LINEAR_MIPMAP_LINEAR
          magFilter: 9729, // LINEAR
          wrapS: 33071, // CLAMP_TO_EDGE
          wrapT: 33071 // CLAMP_TO_EDGE
        });
        textures.push(texture);
      }
      
      const endTime = performance.now();
      const createTime = endTime - startTime;
      
      expect(createTime).toBeLessThan(1000); // Should create textures in reasonable time
      expect(textures.length).toBe(textureCount);
      
      textures.forEach(texture => renderer.deleteTexture(texture));
    });

    it('should update texture data efficiently', () => {
      const texture = renderer.createTexture({
        width: 1024,
        height: 1024,
        format: 1021 // RGBA format
      });
      
      const imageData = new Uint8Array(1024 * 1024 * 4);
      imageData.fill(255); // Fill with white pixels
      
      const startTime = performance.now();
      const updateCount = 10;
      
      for (let i = 0; i < updateCount; i++) {
        // Randomize some pixels
        for (let j = 0; j < imageData.length; j += 4) {
          imageData[j] = Math.random() * 255;     // R
          imageData[j + 1] = Math.random() * 255; // G
          imageData[j + 2] = Math.random() * 255; // B
          imageData[j + 3] = 255;                 // A
        }
        renderer.updateTexture(texture, imageData);
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(2000); // Should update textures efficiently
      
      renderer.deleteTexture(texture);
    });

    it('should handle texture uploads to GPU efficiently', () => {
      const texture = renderer.createTexture({
        width: 2048,
        height: 2048,
        format: 1021 // RGBA format
      });
      
      const largeImageData = new Uint8Array(2048 * 2048 * 4);
      largeImageData.fill(128); // Fill with gray
      
      const startTime = performance.now();
      
      renderer.updateTexture(texture, largeImageData);
      
      const endTime = performance.now();
      const uploadTime = endTime - startTime;
      
      expect(uploadTime).toBeLessThan(500); // Should upload textures quickly
      
      renderer.deleteTexture(texture);
    });
  });

  describe('Shader Compilation Performance', () => {
    it('should compile vertex shaders efficiently', () => {
      const vertexShaderCode = `
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat4 modelMatrix;
        uniform mat3 normalMatrix;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      
      const startTime = performance.now();
      const shaderCount = 20;
      const shaders: any[] = [];
      
      for (let i = 0; i < shaderCount; i++) {
        const shader = renderer.createShader(35633, vertexShaderCode); // VERTEX_SHADER
        shaders.push(shader);
      }
      
      const endTime = performance.now();
      const compileTime = endTime - startTime;
      
      expect(compileTime).toBeLessThan(500); // Should compile shaders quickly
      expect(shaders.length).toBe(shaderCount);
      
      shaders.forEach(shader => renderer.deleteShader(shader));
    });

    it('should compile fragment shaders efficiently', () => {
      const fragmentShaderCode = `
        precision mediump float;
        
        uniform vec3 color;
        uniform float opacity;
        uniform vec3 lightPosition;
        uniform vec3 cameraPosition;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(lightPosition - vPosition);
          float diff = max(dot(normal, lightDir), 0.0);
          
          vec3 viewDir = normalize(cameraPosition - vPosition);
          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
          
          vec3 ambient = color * 0.2;
          vec3 diffuse = color * diff * 0.8;
          vec3 specular = vec3(1.0) * spec * 0.3;
          
          vec3 finalColor = ambient + diffuse + specular;
          gl_FragColor = vec4(finalColor, opacity);
        }
      `;
      
      const startTime = performance.now();
      const shaderCount = 20;
      const shaders: any[] = [];
      
      for (let i = 0; i < shaderCount; i++) {
        const shader = renderer.createShader(35632, fragmentShaderCode); // FRAGMENT_SHADER
        shaders.push(shader);
      }
      
      const endTime = performance.now();
      const compileTime = endTime - startTime;
      
      expect(compileTime).toBeLessThan(500);
      expect(shaders.length).toBe(shaderCount);
      
      shaders.forEach(shader => renderer.deleteShader(shader));
    });

    it('should link shader programs efficiently', () => {
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
      
      const startTime = performance.now();
      const programCount = 20;
      const programs: any[] = [];
      
      for (let i = 0; i < programCount; i++) {
        const vertexShader = renderer.createShader(35633, vertexShaderCode);
        const fragmentShader = renderer.createShader(35632, fragmentShaderCode);
        const program = renderer.createProgram(vertexShader, fragmentShader);
        programs.push(program);
      }
      
      const endTime = performance.now();
      const linkTime = endTime - startTime;
      
      expect(linkTime).toBeLessThan(500); // Should link programs quickly
      expect(programs.length).toBe(programCount);
      
      programs.forEach(program => renderer.deleteProgram(program));
    });
  });

  describe('Geometry Performance', () => {
    it('should create complex geometries efficiently', () => {
      const startTime = performance.now();
      const geometryCount = 50;
      const geometries: any[] = [];
      
      for (let i = 0; i < geometryCount; i++) {
        const geometry = new BoxGeometry(
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5,
          Math.floor(Math.random() * 10) + 1,
          Math.floor(Math.random() * 10) + 1,
          Math.floor(Math.random() * 10) + 1
        );
        geometries.push(geometry);
      }
      
      const endTime = performance.now();
      const createTime = endTime - startTime;
      
      expect(createTime).toBeLessThan(500); // Should create geometries quickly
      expect(geometries.length).toBe(geometryCount);
      
      geometries.forEach(geometry => geometry.dispose());
    });

    it('should handle large vertex buffers efficiently', () => {
      const vertexCount = 100000; // 100K vertices
      const positions = new Float32Array(vertexCount * 3);
      const normals = new Float32Array(vertexCount * 3);
      const uvs = new Float32Array(vertexCount * 2);
      const indices = new Uint16Array(vertexCount);
      
      // Generate test data
      for (let i = 0; i < vertexCount; i++) {
        positions[i * 3] = Math.random() * 10 - 5;
        positions[i * 3 + 1] = Math.random() * 10 - 5;
        positions[i * 3 + 2] = Math.random() * 10 - 5;
        
        normals[i * 3] = Math.random() * 2 - 1;
        normals[i * 3 + 1] = Math.random() * 2 - 1;
        normals[i * 3 + 2] = Math.random() * 2 - 1;
        
        uvs[i * 2] = Math.random();
        uvs[i * 2 + 1] = Math.random();
        
        indices[i] = i;
      }
      
      const geometry = new BoxGeometry();
      geometry.setAttribute('position', positions);
      geometry.setAttribute('normal', normals);
      geometry.setAttribute('uv', uvs);
      geometry.setIndex(indices);
      
      const startTime = performance.now();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const endTime = performance.now();
      
      const computeTime = endTime - startTime;
      
      expect(computeTime).toBeLessThan(100); // Should compute bounds quickly
      
      geometry.dispose();
    });

    it('should handle geometry updates efficiently', () => {
      const geometry = new BoxGeometry();
      const originalPositions = new Float32Array([
        -1, -1, -1,
         1, -1, -1,
         1,  1, -1,
        -1,  1, -1,
        -1, -1,  1,
         1, -1,  1,
         1,  1,  1,
        -1,  1,  1,
      ]);
      
      geometry.setAttribute('position', originalPositions);
      
      const startTime = performance.now();
      const updateCount = 100;
      
      for (let i = 0; i < updateCount; i++) {
        const newPositions = new Float32Array(originalPositions.length);
        for (let j = 0; j < newPositions.length; j++) {
          newPositions[j] = originalPositions[j] + Math.random() * 0.1 - 0.05;
        }
        geometry.setAttribute('position', newPositions);
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(50); // Should update geometry quickly
      
      geometry.dispose();
    });
  });

  describe('Material Performance', () => {
    it('should create materials efficiently', () => {
      const startTime = performance.now();
      const materialCount = 100;
      const materials: any[] = [];
      
      for (let i = 0; i < materialCount; i++) {
        const material = new MeshBasicMaterial({
          color: Math.random() * 0xffffff,
          opacity: Math.random(),
          transparent: Math.random() > 0.5,
          side: Math.floor(Math.random() * 3)
        });
        materials.push(material);
      }
      
      const endTime = performance.now();
      const createTime = endTime - startTime;
      
      expect(createTime).toBeLessThan(100); // Should create materials quickly
      expect(materials.length).toBe(materialCount);
      
      materials.forEach(material => material.dispose());
    });

    it('should handle material property updates efficiently', () => {
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      
      const startTime = performance.now();
      const updateCount = 1000;
      
      for (let i = 0; i < updateCount; i++) {
        material.opacity = Math.random();
        material.setColor(Math.random() * 0xffffff);
        material.updateUniform('opacity');
        material.updateUniform('color');
      }
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      expect(updateTime).toBeLessThan(100); // Should update material properties quickly
      
      material.dispose();
    });

    it('should compile materials efficiently', async () => {
      const startTime = performance.now();
      const materialCount = 10;
      const materials: any[] = [];
      
      for (let i = 0; i < materialCount; i++) {
        const material = new MeshBasicMaterial({
          color: 0xff0000,
          transparent: i % 2 === 0,
          opacity: 0.5,
          vertexColors: i % 3 === 0
        });
        materials.push(material);
      }
      
      // Compile all materials
      await Promise.all(materials.map(material => material.compile()));
      
      const endTime = performance.now();
      const compileTime = endTime - startTime;
      
      expect(compileTime).toBeLessThan(1000); // Should compile materials in reasonable time
      
      materials.forEach(material => material.dispose());
    });
  });

  describe('Render Performance', () => {
    it('should handle draw call batching efficiently', () => {
      const scene = new Scene();
      const meshCount = 100;
      const meshes: Mesh[] = [];
      
      // Create many simple meshes
      for (let i = 0; i < meshCount; i++) {
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const mesh = new Mesh(geometry, material);
        
        mesh.position.set(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50
        );
        
        meshes.push(mesh);
        scene.add(mesh);
      }
      
      const startTime = performance.now();
      const frameCount = 50;
      
      for (let frame = 0; frame < frameCount; frame++) {
        // Animate meshes
        meshes.forEach((mesh, index) => {
          mesh.rotation.x += 0.01;
          mesh.rotation.y += 0.01;
        });
        
        // Render frame
        renderer.render(scene, {} as any); // Mock camera
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      const fps = frameCount / (renderTime / 1000);
      
      expect(renderTime).toBeLessThan(2000); // Should render efficiently
      expect(fps).toBeGreaterThan(20); // Should maintain reasonable FPS
      
      meshes.forEach(mesh => mesh.dispose());
    });

    it('should handle high-poly geometries efficiently', () => {
      const scene = new Scene();
      const highPolyGeometry = new SphereGeometry(1, 64, 32); // High detail sphere
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      
      const meshCount = 10;
      const meshes: Mesh[] = [];
      
      for (let i = 0; i < meshCount; i++) {
        const mesh = new Mesh(highPolyGeometry.clone(), material.clone());
        mesh.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        meshes.push(mesh);
        scene.add(mesh);
      }
      
      const startTime = performance.now();
      const frameCount = 10;
      
      for (let frame = 0; frame < frameCount; frame++) {
        renderer.render(scene, {} as any); // Mock camera
      }
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Should handle high-poly efficiently
      
      meshes.forEach(mesh => mesh.dispose());
    });

    it('should measure rendering performance correctly', () => {
      renderer.setPerformanceMonitoring(true);
      
      const scene = new Scene();
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new Mesh(geometry, material);
      
      scene.add(mesh);
      
      const frameCount = 10;
      for (let i = 0; i < frameCount; i++) {
        renderer.render(scene, {} as any); // Mock camera
      }
      
      const frameCountMeasured = renderer.getFrameCount();
      const drawCallCount = renderer.getDrawCallCount();
      const vertexCount = renderer.getVertexCount();
      
      expect(frameCountMeasured).toBe(frameCount);
      expect(drawCallCount).toBeGreaterThan(0);
      expect(vertexCount).toBeGreaterThan(0);
      
      mesh.dispose();
    });
  });

  describe('Memory Usage Performance', () => {
    it('should manage GPU memory efficiently', () => {
      const initialMemoryUsage = renderer.getMemoryUsage();
      
      // Create many GPU resources
      const bufferCount = 100;
      const textureCount = 50;
      const shaderCount = 20;
      
      const buffers: any[] = [];
      const textures: any[] = [];
      const shaders: any[] = [];
      
      // Create buffers
      for (let i = 0; i < bufferCount; i++) {
        const buffer = renderer.createBuffer({
          data: new Float32Array(1000)
        });
        buffers.push(buffer);
      }
      
      // Create textures
      for (let i = 0; i < textureCount; i++) {
        const texture = renderer.createTexture({
          width: 256,
          height: 256,
          format: 1021
        });
        textures.push(texture);
      }
      
      // Create shaders
      for (let i = 0; i < shaderCount; i++) {
        const shader = renderer.createShader(35633, `
          attribute vec3 position;
          void main() {
            gl_Position = vec4(position, 1.0);
          }
        `);
        shaders.push(shader);
      }
      
      // Check memory usage
      const currentMemoryUsage = renderer.getMemoryUsage();
      expect(currentMemoryUsage).toBeGreaterThan(initialMemoryUsage);
      
      // Clean up
      buffers.forEach(buffer => renderer.deleteBuffer(buffer));
      textures.forEach(texture => renderer.deleteTexture(texture));
      shaders.forEach(shader => renderer.deleteShader(shader));
      
      const finalMemoryUsage = renderer.getMemoryUsage();
      expect(finalMemoryUsage).toBeLessThanOrEqual(initialMemoryUsage);
    });

    it('should handle frequent allocation/deallocation', () => {
      const operations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < operations; i++) {
        const texture = renderer.createTexture({ width: 128, height: 128 });
        renderer.deleteTexture(texture);
      }
      
      const endTime = performance.now();
      const allocationTime = endTime - startTime;
      
      expect(allocationTime).toBeLessThan(500); // Should handle frequent operations efficiently
    });
  });

  describe('Concurrency Performance', () => {
    it('should handle concurrent shader operations', async () => {
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
      
      const startTime = performance.now();
      
      // Create shaders concurrently
      const shaderPromises = Array.from({ length: 20 }, async (_, i) => {
        const vertexShader = renderer.createShader(35633, vertexShaderCode);
        const fragmentShader = renderer.createShader(35632, fragmentShaderCode);
        const program = renderer.createProgram(vertexShader, fragmentShader);
        
        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 1));
        
        return { vertexShader, fragmentShader, program };
      });
      
      const shaders = await Promise.all(shaderPromises);
      
      const endTime = performance.now();
      const concurrentTime = endTime - startTime;
      
      expect(concurrentTime).toBeLessThan(500); // Should handle concurrent operations efficiently
      expect(shaders.length).toBe(20);
      
      shaders.forEach(({ vertexShader, fragmentShader, program }) => {
        renderer.deleteShader(vertexShader);
        renderer.deleteShader(fragmentShader);
        renderer.deleteProgram(program);
      });
    });
  });

  describe('Benchmark Comparison', () => {
    it('should benchmark different geometry types', () => {
      const geometryTypes = [
        () => new BoxGeometry(1, 1, 1),
        () => new SphereGeometry(0.5, 16, 8),
        () => new BoxGeometry(1, 1, 1, 10, 10, 10),
        () => new SphereGeometry(0.5, 32, 16)
      ];
      
      const results: number[] = [];
      
      geometryTypes.forEach((createGeometry, index) => {
        const startTime = performance.now();
        
        const geometryCount = 100;
        const geometries: any[] = [];
        
        for (let i = 0; i < geometryCount; i++) {
          const geometry = createGeometry();
          geometries.push(geometry);
        }
        
        const endTime = performance.now();
        const creationTime = endTime - startTime;
        
        results.push(creationTime);
        
        geometries.forEach(geometry => geometry.dispose());
      });
      
      // All geometry types should be created in reasonable time
      results.forEach(time => {
        expect(time).toBeLessThan(500);
      });
      
      // BoxGeometry should generally be faster than high-detail SphereGeometry
      expect(results[0]).toBeLessThanOrEqual(results[3]);
    });

    it('should benchmark material operations', () => {
      const materialTypes = [
        () => new MeshBasicMaterial({ color: 0xff0000 }),
        () => new MeshBasicMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.5,
          side: 2
        }),
        () => new MeshBasicMaterial({ 
          color: 0xff0000,
          vertexColors: true,
          wireframe: true
        })
      ];
      
      const results: number[] = [];
      
      materialTypes.forEach((createMaterial, index) => {
        const startTime = performance.now();
        
        const materialCount = 100;
        const materials: any[] = [];
        
        for (let i = 0; i < materialCount; i++) {
          const material = createMaterial();
          materials.push(material);
        }
        
        const endTime = performance.now();
        const creationTime = endTime - startTime;
        
        results.push(creationTime);
        
        materials.forEach(material => material.dispose());
      });
      
      // All material types should be created in reasonable time
      results.forEach(time => {
        expect(time).toBeLessThan(100);
      });
      
      // More complex materials should take longer
      expect(results[1]).toBeGreaterThanOrEqual(results[0]);
      expect(results[2]).toBeGreaterThanOrEqual(results[0]);
    });
  });
});
