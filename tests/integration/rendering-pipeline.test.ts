import { Scene } from '../../../src/core/Scene';
import { Mesh } from '../../../src/core/Mesh';
import { BoxGeometry } from '../../../src/geometry/BoxGeometry';
import { SphereGeometry } from '../../../src/geometry/SphereGeometry';
import { MeshBasicMaterial } from '../../../src/materials/MeshBasicMaterial';
import { MeshStandardMaterial } from '../../../src/materials/MeshStandardMaterial';
import { PerspectiveCamera } from '../../../src/cameras/PerspectiveCamera';
import { WebGLRenderer } from '../../../src/core/WebGLRenderer';
import { AmbientLight } from '../../../src/lights/AmbientLight';
import { DirectionalLight } from '../../../src/lights/DirectionalLight';

describe('Rendering Pipeline Integration', () => {
  let canvas: HTMLCanvasElement;
  let renderer: WebGLRenderer;
  let scene: Scene;
  let camera: PerspectiveCamera;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    renderer = new WebGLRenderer({ canvas });
    scene = new Scene();
    camera = new PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 0, 5);
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('Basic Rendering Pipeline', () => {
    it('should render a simple scene', async () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      renderer.setSize(800, 600);
      renderer.render(scene, camera);
      
      expect(renderer.getSize().width).toBe(800);
      expect(renderer.getSize().height).toBe(600);
      
      cube.dispose();
    });

    it('should handle multiple objects in scene', () => {
      const cubes: Mesh[] = [];
      const materials = [
        new MeshBasicMaterial({ color: 0xff0000 }),
        new MeshBasicMaterial({ color: 0x00ff00 }),
        new MeshBasicMaterial({ color: 0x0000ff }),
      ];
      
      for (let i = 0; i < 3; i++) {
        const geometry = new BoxGeometry();
        const cube = new Mesh(geometry, materials[i]);
        cube.position.set(i * 2 - 2, 0, 0);
        cubes.push(cube);
        scene.add(cube);
      }
      
      renderer.render(scene, camera);
      
      expect(scene.children.length).toBe(3);
      
      cubes.forEach(cube => cube.dispose());
      materials.forEach(material => material.dispose());
    });

    it('should handle geometry changes correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Initial render
      renderer.render(scene, camera);
      
      // Modify geometry
      geometry.setAttribute('position', new Float32Array([
        0, 0, 0,
        2, 0, 0,
        0, 2, 0,
        0, 0, 2,
      ]));
      geometry.computeBoundingBox();
      
      // Second render
      renderer.render(scene, camera);
      
      // Check that bounding box was updated
      expect(geometry.boundingBox.max.x).toBe(2);
      expect(geometry.boundingBox.max.y).toBe(2);
      expect(geometry.boundingBox.max.z).toBe(2);
      
      cube.dispose();
    });
  });

  describe('Lighting Integration', () => {
    it('should handle ambient lighting correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshStandardMaterial({ color: 0xffffff });
      const cube = new Mesh(geometry, material);
      
      const ambientLight = new AmbientLight(0x404040, 0.5);
      scene.add(cube);
      scene.add(ambientLight);
      
      renderer.render(scene, camera);
      
      expect(scene.children).toContain(ambientLight);
      
      cube.dispose();
      material.dispose();
      ambientLight.dispose();
    });

    it('should handle directional lighting correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.5
      });
      const cube = new Mesh(geometry, material);
      
      const directionalLight = new DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(5, 5, 5);
      directionalLight.target.position.set(0, 0, 0);
      
      scene.add(cube);
      scene.add(directionalLight);
      scene.add(directionalLight.target);
      
      renderer.render(scene, camera);
      
      expect(directionalLight.position.x).toBe(5);
      expect(directionalLight.position.y).toBe(5);
      expect(directionalLight.position.z).toBe(5);
      
      cube.dispose();
      material.dispose();
      directionalLight.dispose();
      directionalLight.target.dispose();
    });

    it('should handle multiple lights correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshStandardMaterial({ color: 0xffffff });
      const cube = new Mesh(geometry, material);
      
      const ambientLight = new AmbientLight(0x404040, 0.3);
      const directionalLight = new DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      
      scene.add(cube);
      scene.add(ambientLight);
      scene.add(directionalLight);
      
      renderer.render(scene, camera);
      
      const lights = scene.getLights();
      expect(lights).toContain(ambientLight);
      expect(lights).toContain(directionalLight);
      
      cube.dispose();
      material.dispose();
      ambientLight.dispose();
      directionalLight.dispose();
    });
  });

  describe('Camera Integration', () => {
    it('should handle perspective camera correctly', () => {
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
      
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      renderer.render(scene, camera);
      
      expect(camera.position.z).toBe(5);
      expect(camera.near).toBe(0.1);
      expect(camera.far).toBe(1000);
      
      cube.dispose();
    });

    it('should handle camera aspect ratio changes', () => {
      const initialAspect = camera.aspect;
      expect(initialAspect).toBe(800 / 600);
      
      // Resize renderer
      renderer.setSize(1200, 800);
      
      // Update camera aspect
      camera.aspect = 1200 / 800;
      camera.updateProjectionMatrix();
      
      expect(camera.aspect).toBe(1200 / 800);
    });

    it('should handle camera frustum culling', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      // Position cube outside camera view
      cube.position.set(0, 0, -1000);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      // Cube should be frustum culled (not visible)
      expect(cube.visible).toBe(false);
      
      cube.dispose();
    });
  });

  describe('Material Integration', () => {
    it('should handle different material types', () => {
      const basicMaterial = new MeshBasicMaterial({ color: 0xff0000 });
      const standardMaterial = new MeshStandardMaterial({ 
        color: 0x00ff00,
        metalness: 0.5,
        roughness: 0.5 
      });
      
      const cube1 = new Mesh(new BoxGeometry(), basicMaterial);
      const cube2 = new Mesh(new BoxGeometry(), standardMaterial);
      
      cube1.position.x = -1.5;
      cube2.position.x = 1.5;
      
      scene.add(cube1);
      scene.add(cube2);
      
      renderer.render(scene, camera);
      
      expect(cube1.material).toBe(basicMaterial);
      expect(cube2.material).toBe(standardMaterial);
      
      cube1.dispose();
      cube2.dispose();
      basicMaterial.dispose();
      standardMaterial.dispose();
    });

    it('should handle transparent materials correctly', () => {
      const geometry = new BoxGeometry();
      
      const opaqueMaterial = new MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: false, 
        opacity: 1.0 
      });
      
      const transparentMaterial = new MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.5 
      });
      
      const opaqueCube = new Mesh(geometry.clone(), opaqueMaterial);
      const transparentCube = new Mesh(geometry.clone(), transparentMaterial);
      
      opaqueCube.position.z = 0;
      transparentCube.position.z = 0.1;
      
      scene.add(opaqueCube);
      scene.add(transparentCube);
      
      renderer.render(scene, camera);
      
      expect(opaqueMaterial.transparent).toBe(false);
      expect(transparentMaterial.transparent).toBe(true);
      expect(transparentMaterial.opacity).toBe(0.5);
      
      opaqueCube.dispose();
      transparentCube.dispose();
      opaqueMaterial.dispose();
      transparentMaterial.dispose();
    });

    it('should handle material property changes during rendering', async () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Initial render
      renderer.render(scene, camera);
      
      // Change material color
      material.setColor(0x00ff00);
      material.updateUniform('color');
      
      // Second render
      renderer.render(scene, camera);
      
      expect(material.color.g).toBe(1);
      
      cube.dispose();
    });
  });

  describe('Geometry Integration', () => {
    it('should handle different geometry types', () => {
      const boxGeometry = new BoxGeometry(1, 1, 1);
      const sphereGeometry = new SphereGeometry(0.5, 32, 16);
      
      const boxMaterial = new MeshBasicMaterial({ color: 0xff0000 });
      const sphereMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
      
      const box = new Mesh(boxGeometry, boxMaterial);
      const sphere = new Mesh(sphereGeometry, sphereMaterial);
      
      box.position.x = -1.5;
      sphere.position.x = 1.5;
      
      scene.add(box);
      scene.add(sphere);
      
      renderer.render(scene, camera);
      
      expect(box.geometry.type).toBe('BoxGeometry');
      expect(sphere.geometry.type).toBe('SphereGeometry');
      
      box.dispose();
      sphere.dispose();
      boxMaterial.dispose();
      sphereMaterial.dispose();
    });

    it('should handle geometry instancing', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      
      const instances: Mesh[] = [];
      for (let i = 0; i < 5; i++) {
        const instance = new Mesh(geometry, material);
        instance.position.set(i * 2 - 4, 0, 0);
        instances.push(instance);
        scene.add(instance);
      }
      
      renderer.render(scene, camera);
      
      expect(scene.children.length).toBe(5);
      expect(instances.length).toBe(5);
      
      instances.forEach(instance => instance.dispose());
      material.dispose();
    });
  });

  describe('Render Target Integration', () => {
    it('should render to offscreen texture', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Create render target
      const renderTarget = renderer.createRenderTarget({
        width: 512,
        height: 512,
        format: 1021, // RGBA format
        type: 5121, // UNSIGNED_BYTE type
        depthBuffer: true,
        stencilBuffer: false
      });
      
      // Render to target
      renderer.setRenderTarget(renderTarget);
      renderer.setSize(512, 512);
      renderer.render(scene, camera);
      
      // Reset to default target
      renderer.setRenderTarget(null);
      
      expect(renderTarget.width).toBe(512);
      expect(renderTarget.height).toBe(512);
      
      renderer.deleteRenderTarget(renderTarget);
      cube.dispose();
    });

    it('should handle multiple render targets', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      const renderTarget1 = renderer.createRenderTarget({ width: 512, height: 512 });
      const renderTarget2 = renderer.createRenderTarget({ width: 512, height: 512 });
      
      renderer.render(scene, camera);
      
      renderer.deleteRenderTarget(renderTarget1);
      renderer.deleteRenderTarget(renderTarget2);
      cube.dispose();
    });
  });

  describe('Animation Integration', () => {
    it('should handle animated objects', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Simulate animation frame
      cube.rotation.x += 0.1;
      cube.rotation.y += 0.1;
      
      renderer.render(scene, camera);
      
      expect(cube.rotation.x).toBe(0.1);
      expect(cube.rotation.y).toBe(0.1);
      
      cube.dispose();
    });

    it('should handle multiple animated objects', () => {
      const cubes: Mesh[] = [];
      const materials = [
        new MeshBasicMaterial({ color: 0xff0000 }),
        new MeshBasicMaterial({ color: 0x00ff00 }),
        new MeshBasicMaterial({ color: 0x0000ff }),
      ];
      
      for (let i = 0; i < 3; i++) {
        const cube = new Mesh(new BoxGeometry(), materials[i]);
        cube.position.set(i * 2 - 2, 0, 0);
        cubes.push(cube);
        scene.add(cube);
      }
      
      // Animate all cubes
      cubes.forEach((cube, index) => {
        cube.rotation.x += 0.1 * (index + 1);
        cube.rotation.y += 0.1 * (index + 1);
      });
      
      renderer.render(scene, camera);
      
      cubes.forEach((cube, index) => {
        expect(cube.rotation.x).toBe(0.1 * (index + 1));
        expect(cube.rotation.y).toBe(0.1 * (index + 1));
      });
      
      cubes.forEach(cube => cube.dispose());
      materials.forEach(material => material.dispose());
    });
  });

  describe('Memory Management Integration', () => {
    it('should handle scene disposal correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      scene.add(new AmbientLight(0x404040));
      
      // Add to scene
      expect(scene.children.length).toBe(2);
      
      // Dispose scene
      scene.dispose();
      
      // Scene should be cleaned up
      expect(scene.children.length).toBe(0);
    });

    it('should handle material and geometry disposal', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Dispose cube
      cube.dispose();
      
      // Geometry and material should also be disposed
      expect(geometry.disposed).toBe(true);
      expect(material.disposed).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large number of objects', () => {
      const objectCount = 1000;
      const objects: Mesh[] = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < objectCount; i++) {
        const geometry = new BoxGeometry();
        const material = new MeshBasicMaterial({ color: 0xff0000 });
        const cube = new Mesh(geometry, material);
        
        cube.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
        
        objects.push(cube);
        scene.add(cube);
      }
      
      renderer.render(scene, camera);
      
      const endTime = performance.now();
      
      expect(scene.children.length).toBe(objectCount);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in reasonable time
      
      objects.forEach(obj => obj.dispose());
    });

    it('should handle frequent rendering updates', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      const startTime = performance.now();
      const frameCount = 100;
      
      for (let i = 0; i < frameCount; i++) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      }
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render efficiently
      expect(cube.rotation.x).toBe(frameCount * 0.01);
      
      cube.dispose();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid geometry gracefully', () => {
      // Test with null geometry
      const invalidMesh = new Mesh(null as any, new MeshBasicMaterial({ color: 0xff0000 }));
      scene.add(invalidMesh);
      
      expect(() => renderer.render(scene, camera)).not.toThrow();
      
      invalidMesh.dispose();
    });

    it('should handle invalid material gracefully', () => {
      const geometry = new BoxGeometry();
      const invalidMesh = new Mesh(geometry, null as any);
      scene.add(invalidMesh);
      
      expect(() => renderer.render(scene, camera)).not.toThrow();
      
      invalidMesh.dispose();
    });

    it('should handle disposed resources gracefully', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Dispose the resources
      geometry.dispose();
      material.dispose();
      
      // Should still be able to render without crashing
      expect(() => renderer.render(scene, camera)).not.toThrow();
      
      cube.dispose();
    });
  });

  describe('Serialization Integration', () => {
    it('should serialize and deserialize scene correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      cube.position.set(1, 2, 3);
      cube.rotation.set(0.1, 0.2, 0.3);
      
      scene.add(cube);
      scene.background = { type: 'color', color: 0x000000 };
      
      // Serialize scene
      const sceneData = scene.toJSON();
      
      expect(sceneData.children).toHaveLength(1);
      expect(sceneData.background).toBeDefined();
      
      // Deserialize to new scene
      const newScene = Scene.fromJSON(sceneData);
      
      expect(newScene.children.length).toBe(1);
      expect(newScene.background).toBeDefined();
      
      cube.dispose();
    });
  });
});
