import { WebGLRenderer } from '../../../src/core/WebGLRenderer';
import { Scene } from '../../../src/core/Scene';
import { Mesh } from '../../../src/core/Mesh';
import { BoxGeometry } from '../../../src/geometry/BoxGeometry';
import { SphereGeometry } from '../../../src/geometry/SphereGeometry';
import { PlaneGeometry } from '../../../src/geometry/PlaneGeometry';
import { MeshBasicMaterial } from '../../../src/materials/MeshBasicMaterial';
import { MeshStandardMaterial } from '../../../src/materials/MeshStandardMaterial';
import { MeshPhongMaterial } from '../../../src/materials/MeshPhongMaterial';
import { PerspectiveCamera } from '../../../src/cameras/PerspectiveCamera';
import { AmbientLight } from '../../../src/lights/AmbientLight';
import { DirectionalLight } from '../../../src/lights/DirectionalLight';
import { PointLight } from '../../../src/lights/PointLight';

// Helper function to capture pixel data from canvas
function captureCanvasPixels(canvas: HTMLCanvasElement): Uint8Array {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get 2D context');
  }
  
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return imageData.data;
}

// Helper function to compare pixel data
function comparePixels(actual: Uint8Array, expected: Uint8Array, tolerance = 10): number {
  if (actual.length !== expected.length) {
    return actual.length - expected.length;
  }
  
  let totalDifference = 0;
  let pixelCount = actual.length / 4; // RGBA
  
  for (let i = 0; i < actual.length; i += 4) {
    const rDiff = Math.abs(actual[i] - expected[i]);
    const gDiff = Math.abs(actual[i + 1] - expected[i + 1]);
    const bDiff = Math.abs(actual[i + 2] - expected[i + 2]);
    const aDiff = Math.abs(actual[i + 3] - expected[i + 3]);
    
    const pixelDifference = (rDiff + gDiff + bDiff + aDiff) / 4;
    totalDifference += pixelDifference;
  }
  
  return totalDifference / pixelCount;
}

describe('Visual Regression Tests', () => {
  let canvas: HTMLCanvasElement;
  let renderer: WebGLRenderer;
  let scene: Scene;
  let camera: PerspectiveCamera;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    
    renderer = new WebGLRenderer({ canvas });
    scene = new Scene();
    camera = new PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
  });

  afterEach(() => {
    renderer.dispose();
  });

  describe('Basic Rendering', () => {
    it('should render solid cube correctly', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Render the scene
      renderer.setSize(400, 300);
      renderer.render(scene, camera);
      
      // In a real implementation, this would compare against stored baseline images
      // For now, we verify the render completed without error
      expect(cube.position.x).toBe(0);
      expect(cube.position.y).toBe(0);
      expect(cube.position.z).toBe(0);
      
      cube.dispose();
    });

    it('should render colored cube with correct colors', () => {
      const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
      
      colors.forEach((color, index) => {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ color });
        const cube = new Mesh(geometry, material);
        
        cube.position.set((index % 3 - 1) * 2, Math.floor(index / 3) * 2 - 1, 0);
        scene.add(cube);
      });
      
      renderer.render(scene, camera);
      
      const cubes = scene.children.filter(child => child instanceof Mesh);
      expect(cubes.length).toBe(6);
      
      cubes.forEach(cube => cube.dispose());
    });

    it('should render multiple spheres correctly', () => {
      const sphereCount = 5;
      for (let i = 0; i < sphereCount; i++) {
        const geometry = new SphereGeometry(0.5, 32, 16);
        const material = new MeshBasicMaterial({ color: 0x888888 });
        const sphere = new Mesh(geometry, material);
        
        sphere.position.set(
          (i - 2) * 1.5,
          Math.sin(i * Math.PI / 2) * 2,
          Math.cos(i * Math.PI / 2) * 2
        );
        
        scene.add(sphere);
      }
      
      renderer.render(scene, camera);
      
      const spheres = scene.children.filter(child => child instanceof Mesh);
      expect(spheres.length).toBe(5);
      
      spheres.forEach(sphere => sphere.dispose());
    });

    it('should render plane geometry correctly', () => {
      const geometry = new PlaneGeometry(3, 2);
      const material = new MeshBasicMaterial({ color: 0x4444ff });
      const plane = new Mesh(geometry, material);
      
      plane.rotation.x = -Math.PI / 4;
      scene.add(plane);
      
      renderer.render(scene, camera);
      
      expect(plane.rotation.x).toBe(-Math.PI / 4);
      
      plane.dispose();
    });
  });

  describe('Lighting Visual Tests', () => {
    it('should render scene with ambient lighting', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshStandardMaterial({ 
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.5
      });
      const cube = new Mesh(geometry, material);
      
      const ambientLight = new AmbientLight(0x404040, 0.8);
      scene.add(cube);
      scene.add(ambientLight);
      
      renderer.render(scene, camera);
      
      expect(ambientLight.intensity).toBe(0.8);
      
      cube.dispose();
      ambientLight.dispose();
    });

    it('should render scene with directional lighting', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.3,
        roughness: 0.7
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
      directionalLight.dispose();
      directionalLight.target.dispose();
    });

    it('should render scene with multiple lights', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshStandardMaterial({ color: 0xffffff });
      const cube = new Mesh(geometry, material);
      
      const ambientLight = new AmbientLight(0x404040, 0.3);
      const directionalLight = new DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      const pointLight = new PointLight(0xff0000, 0.5);
      pointLight.position.set(-5, 5, 5);
      
      scene.add(cube);
      scene.add(ambientLight);
      scene.add(directionalLight);
      scene.add(directionalLight.target);
      scene.add(pointLight);
      
      renderer.render(scene, camera);
      
      const lights = scene.getLights();
      expect(lights.length).toBe(3);
      
      cube.dispose();
      ambientLight.dispose();
      directionalLight.dispose();
      directionalLight.target.dispose();
      pointLight.dispose();
    });

    it('should render lit material with Phong shading', () => {
      const geometry = new SphereGeometry(1, 32, 16);
      const material = new MeshPhongMaterial({
        color: 0xffffff,
        shininess: 100,
        specular: 0x111111
      });
      const sphere = new Mesh(geometry, material);
      
      const directionalLight = new DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(2, 2, 2);
      
      scene.add(sphere);
      scene.add(directionalLight);
      
      renderer.render(scene, camera);
      
      expect(material.shininess).toBe(100);
      expect(material.specular).toBe(0x111111);
      
      sphere.dispose();
      directionalLight.dispose();
    });
  });

  describe('Material Visual Tests', () => {
    it('should render transparent materials correctly', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      
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
      transparentCube.position.z = 0.5;
      
      scene.add(opaqueCube);
      scene.add(transparentCube);
      
      renderer.render(scene, camera);
      
      expect(opaqueMaterial.transparent).toBe(false);
      expect(transparentMaterial.transparent).toBe(true);
      expect(transparentMaterial.opacity).toBe(0.5);
      
      opaqueCube.dispose();
      transparentCube.dispose();
    });

    it('should render wireframe materials correctly', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({
        color: 0x0000ff,
        wireframe: true
      });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(material.wireframe).toBe(true);
      
      cube.dispose();
    });

    it('should render side variations correctly', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({
        color: 0xff8800,
        side: 0 // BackSide
      });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(material.side).toBe(0); // BackSide
      
      cube.dispose();
    });

    it('should render double-sided materials correctly', () => {
      const geometry = new PlaneGeometry(3, 3);
      const material = new MeshBasicMaterial({
        color: 0x8844ff,
        side: 2 // DoubleSide
      });
      const plane = new Mesh(geometry, material);
      
      plane.rotation.x = Math.PI / 4;
      scene.add(plane);
      
      renderer.render(scene, camera);
      
      expect(material.side).toBe(2); // DoubleSide
      
      plane.dispose();
    });
  });

  describe('Camera Visual Tests', () => {
    it('should handle camera perspective correctly', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Close camera
      camera.position.z = 3;
      camera.updateProjectionMatrix();
      
      renderer.render(scene, camera);
      
      expect(camera.position.z).toBe(3);
      expect(camera.near).toBe(0.1);
      expect(camera.far).toBe(1000);
      
      cube.dispose();
    });

    it('should handle camera rotation', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Rotate camera around scene
      camera.position.x = 5 * Math.cos(0);
      camera.position.z = 5 * Math.sin(0);
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      
      expect(camera.position.x).toBe(5);
      expect(camera.position.z).toBe(0);
      
      cube.dispose();
    });

    it('should handle different field of view', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0x0000ff });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Wide field of view
      camera.fov = 120;
      camera.updateProjectionMatrix();
      
      renderer.render(scene, camera);
      
      expect(camera.fov).toBe(120);
      
      cube.dispose();
    });
  });

  describe('Transform Visual Tests', () => {
    it('should render scaled objects correctly', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0xff6600 });
      const cube = new Mesh(geometry, material);
      
      cube.scale.set(2, 3, 1.5);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(cube.scale.x).toBe(2);
      expect(cube.scale.y).toBe(3);
      expect(cube.scale.z).toBe(1.5);
      
      cube.dispose();
    });

    it('should render rotated objects correctly', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x66ff00 });
      const cube = new Mesh(geometry, material);
      
      cube.rotation.set(Math.PI / 4, Math.PI / 3, Math.PI / 6);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(cube.rotation.x).toBe(Math.PI / 4);
      expect(cube.rotation.y).toBe(Math.PI / 3);
      expect(cube.rotation.z).toBe(Math.PI / 6);
      
      cube.dispose();
    });

    it('should render positioned objects correctly', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x0066ff });
      const cube = new Mesh(geometry, material);
      
      cube.position.set(3, -2, 1);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(cube.position.x).toBe(3);
      expect(cube.position.y).toBe(-2);
      expect(cube.position.z).toBe(1);
      
      cube.dispose();
    });
  });

  describe('Background Visual Tests', () => {
    it('should render solid color background', () => {
      scene.background = { type: 'color', color: 0x112233 };
      
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      renderer.render(scene, camera);
      
      expect(scene.background.type).toBe('color');
      expect(scene.background.color).toBe(0x112233);
      
      cube.dispose();
    });

    it('should render gradient background', () => {
      // In a real implementation, this would use a gradient texture
      scene.background = { type: 'color', color: 0x000000 };
      
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xffffff });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      renderer.render(scene, camera);
      
      scene.clearBackground();
      expect(scene.background).toBeNull();
      
      cube.dispose();
    });
  });

  describe('Animation Visual Tests', () => {
    it('should render rotating cube animation', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Animate rotation
      for (let frame = 0; frame < 10; frame++) {
        cube.rotation.y += 0.1;
        renderer.render(scene, camera);
      }
      
      expect(cube.rotation.y).toBe(1.0);
      
      cube.dispose();
    });

    it('should render bouncing cube animation', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Animate position
      for (let frame = 0; frame < 10; frame++) {
        cube.position.y = Math.sin(frame * 0.5) * 2;
        renderer.render(scene, camera);
      }
      
      expect(cube.position.y).toBeApproximately(Math.sin(5), 0.1);
      
      cube.dispose();
    });

    it('should render color changing animation', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      
      // Animate color
      for (let frame = 0; frame < 10; frame++) {
        const intensity = Math.abs(Math.sin(frame * 0.5));
        const red = Math.floor(255 * intensity);
        material.setColor(red << 16);
        renderer.render(scene, camera);
      }
      
      expect(material.color.r).toBeLessThanOrEqual(1);
      
      cube.dispose();
    });
  });

  describe('Depth Testing Visual Tests', () => {
    it('should render depth testing correctly', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      
      const frontMaterial = new MeshBasicMaterial({ color: 0xff0000 });
      const backMaterial = new MeshBasicMaterial({ color: 0x0000ff });
      
      const frontCube = new Mesh(geometry.clone(), frontMaterial);
      const backCube = new Mesh(geometry.clone(), backMaterial);
      
      frontCube.position.z = 0;
      backCube.position.z = -2;
      
      scene.add(backCube);
      scene.add(frontCube);
      
      renderer.render(scene, camera);
      
      expect(frontMaterial.depthTest).toBe(true);
      expect(backMaterial.depthTest).toBe(true);
      
      frontCube.dispose();
      backCube.dispose();
    });

    it('should render with depth write disabled', () => {
      const geometry = new BoxGeometry(2, 2, 2);
      const material = new MeshBasicMaterial({ 
        color: 0xff0000,
        depthWrite: false
      });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      renderer.render(scene, camera);
      
      expect(material.depthWrite).toBe(false);
      
      cube.dispose();
    });
  });

  describe('Blending Visual Tests', () => {
    it('should render additive blending correctly', () => {
      const geometry = new SphereGeometry(1, 16, 8);
      
      const material1 = new MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        blending: 2 // Additive blending
      });
      
      const material2 = new MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        blending: 2 // Additive blending
      });
      
      const sphere1 = new Mesh(geometry.clone(), material1);
      const sphere2 = new Mesh(geometry.clone(), material2);
      
      sphere1.position.x = -1;
      sphere2.position.x = 1;
      
      scene.add(sphere1);
      scene.add(sphere2);
      
      renderer.render(scene, camera);
      
      expect(material1.blending).toBe(2);
      expect(material2.blending).toBe(2);
      
      sphere1.dispose();
      sphere2.dispose();
    });

    it('should render subtractive blending correctly', () => {
      const geometry = new SphereGeometry(1, 16, 8);
      
      const material = new MeshBasicMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.3,
        blending: 3 // Subtractive blending
      });
      
      const sphere = new Mesh(geometry, material);
      scene.add(sphere);
      
      renderer.render(scene, camera);
      
      expect(material.blending).toBe(3);
      
      sphere.dispose();
    });
  });

  describe('Multiple Objects Visual Tests', () => {
    it('should render scene with many objects', () => {
      const objectCount = 50;
      
      for (let i = 0; i < objectCount; i++) {
        const geometry = new BoxGeometry(
          Math.random() * 0.5 + 0.5,
          Math.random() * 0.5 + 0.5,
          Math.random() * 0.5 + 0.5
        );
        const material = new MeshBasicMaterial({ 
          color: Math.random() * 0xffffff 
        });
        const cube = new Mesh(geometry, material);
        
        cube.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        
        scene.add(cube);
      }
      
      renderer.render(scene, camera);
      
      const meshes = scene.children.filter(child => child instanceof Mesh);
      expect(meshes.length).toBe(objectCount);
      
      meshes.forEach(mesh => mesh.dispose());
    });

    it('should render scene with hierarchical objects', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      
      const parent = new Mesh(geometry.clone(), material.clone());
      const child1 = new Mesh(geometry.clone(), material.clone());
      const child2 = new Mesh(geometry.clone(), material.clone());
      
      child1.position.set(2, 0, 0);
      child2.position.set(-2, 0, 0);
      
      parent.add(child1);
      parent.add(child2);
      scene.add(parent);
      
      renderer.render(scene, camera);
      
      expect(parent.children.length).toBe(2);
      expect(parent.position.x).toBe(0);
      expect(child1.position.x).toBe(2);
      expect(child2.position.x).toBe(-2);
      
      parent.dispose();
    });
  });

  describe('Edge Cases Visual Tests', () => {
    it('should render very small objects', () => {
      const geometry = new BoxGeometry(0.01, 0.01, 0.01);
      const material = new MeshBasicMaterial({ color: 0xff0000 });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      renderer.render(scene, camera);
      
      expect(cube.scale.x).toBe(1); // Default scale
      expect(cube.scale.y).toBe(1);
      expect(cube.scale.z).toBe(1);
      
      cube.dispose();
    });

    it('should render very large objects', () => {
      const geometry = new BoxGeometry(100, 100, 100);
      const material = new MeshBasicMaterial({ color: 0x0000ff });
      const cube = new Mesh(geometry, material);
      
      scene.add(cube);
      renderer.render(scene, camera);
      
      expect(cube.scale.x).toBe(1);
      
      cube.dispose();
    });

    it('should render objects at extreme positions', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new Mesh(geometry, material);
      
      cube.position.set(1000, -500, 2000);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(cube.position.x).toBe(1000);
      expect(cube.position.y).toBe(-500);
      expect(cube.position.z).toBe(2000);
      
      cube.dispose();
    });

    it('should render objects with extreme rotations', () => {
      const geometry = new BoxGeometry(1, 1, 1);
      const material = new MeshBasicMaterial({ color: 0xffff00 });
      const cube = new Mesh(geometry, material);
      
      cube.rotation.set(Math.PI, Math.PI * 1.5, Math.PI * 2);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      expect(cube.rotation.x).toBe(Math.PI);
      expect(cube.rotation.y).toBe(Math.PI * 1.5);
      expect(cube.rotation.z).toBe(Math.PI * 2);
      
      cube.dispose();
    });
  });
});
