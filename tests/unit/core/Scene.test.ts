import { Scene } from '../../../src/core/Scene';
import { Mesh } from '../../../src/core/Mesh';
import { BoxGeometry } from '../../../src/geometry/BoxGeometry';
import { MeshBasicMaterial } from '../../../src/materials/MeshBasicMaterial';

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene();
  });

  describe('Construction', () => {
    it('should create a scene with default properties', () => {
      expect(scene.type).toBe('Scene');
      expect(scene.children).toBeDefined();
      expect(scene.children).toHaveLength(0);
      expect(scene.background).toBeNull();
      expect(scene.fog).toBeNull();
      expect(scene.matrixAutoUpdate).toBe(true);
    });

    it('should create a scene with optional name', () => {
      const namedScene = new Scene('test-scene');
      expect(namedScene.name).toBe('test-scene');
    });
  });

  describe('Background', () => {
    it('should set and get background color correctly', () => {
      const color = 0xff0000;
      
      scene.background = { type: 'color', color };
      
      expect(scene.background.type).toBe('color');
      expect(scene.background.color).toBe(color);
    });

    it('should set background texture correctly', () => {
      const texture = {}; // Mock texture object
      
      scene.background = { type: 'texture', texture };
      
      expect(scene.background.type).toBe('texture');
      expect(scene.background.texture).toBe(texture);
    });

    it('should clear background', () => {
      scene.background = { type: 'color', color: 0xff0000 };
      scene.clearBackground();
      
      expect(scene.background).toBeNull();
    });
  });

  describe('Fog', () => {
    it('should set and get fog correctly', () => {
      const fogConfig = {
        type: 'linear',
        color: 0xffffff,
        near: 1,
        far: 1000
      };
      
      scene.fog = fogConfig;
      
      expect(scene.fog).toEqual(fogConfig);
    });

    it('should clear fog', () => {
      scene.fog = {
        type: 'linear',
        color: 0xffffff,
        near: 1,
        far: 1000
      };
      
      scene.clearFog();
      
      expect(scene.fog).toBeNull();
    });
  });

  describe('Object Management', () => {
    let mesh: Mesh;

    beforeEach(() => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial();
      mesh = new Mesh(geometry, material);
    });

    afterEach(() => {
      mesh.dispose();
    });

    it('should add objects to scene correctly', () => {
      scene.add(mesh);
      
      expect(scene.children).toContain(mesh);
      expect(scene.children).toHaveLength(1);
      expect(mesh.parent).toBe(scene);
    });

    it('should remove objects from scene correctly', () => {
      scene.add(mesh);
      scene.remove(mesh);
      
      expect(scene.children).not.toContain(mesh);
      expect(scene.children).toHaveLength(0);
      expect(mesh.parent).toBeNull();
    });

    it('should find objects by name', () => {
      mesh.name = 'test-mesh';
      scene.add(mesh);
      
      const foundMesh = scene.getObjectByName('test-mesh');
      expect(foundMesh).toBe(mesh);
    });

    it('should find objects by property', () => {
      mesh.userData.test = 'value';
      scene.add(mesh);
      
      const foundMesh = scene.getObjectByProperty('test', 'value');
      expect(foundMesh).toBe(mesh);
    });

    it('should traverse scene graph correctly', () => {
      const child1 = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      const child2 = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      
      mesh.add(child1);
      mesh.add(child2);
      scene.add(mesh);
      
      const visitedObjects: any[] = [];
      scene.traverse((object) => {
        visitedObjects.push(object);
      });
      
      expect(visitedObjects).toContain(scene);
      expect(visitedObjects).toContain(mesh);
      expect(visitedObjects).toContain(child1);
      expect(visitedObjects).toContain(child2);
    });

    it('should traverse scene graph in reverse', () => {
      const child = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      mesh.add(child);
      scene.add(mesh);
      
      const visitedObjects: any[] = [];
      scene.traverseReverse((object) => {
        visitedObjects.push(object);
      });
      
      expect(visitedObjects).toEqual([child, mesh, scene]);
    });
  });

  describe('Lighting', () => {
    it('should manage scene lights correctly', () => {
      const ambientLight = {}; // Mock ambient light
      const directionalLight = {}; // Mock directional light
      
      scene.add(ambientLight);
      scene.add(directionalLight);
      
      const lights = scene.getLights();
      
      expect(lights).toContain(ambientLight);
      expect(lights).toContain(directionalLight);
    });

    it('should handle ambient light specifically', () => {
      const ambientLight = {}; // Mock ambient light
      ambientLight.isAmbientLight = true;
      
      scene.add(ambientLight);
      
      const ambientLights = scene.getLightsByType('AmbientLight');
      expect(ambientLights).toContain(ambientLight);
    });
  });

  describe('Materials', () => {
    it('should collect all materials in scene', () => {
      const geometry = new BoxGeometry();
      const material1 = new MeshBasicMaterial();
      const material2 = new MeshBasicMaterial();
      
      const mesh1 = new Mesh(geometry, material1);
      const mesh2 = new Mesh(geometry, material2);
      
      scene.add(mesh1);
      scene.add(mesh2);
      
      const materials = scene.getMaterials();
      
      expect(materials).toContain(material1);
      expect(materials).toContain(material2);
    });

    it('should dispose all materials in scene', () => {
      const geometry = new BoxGeometry();
      const material1 = new MeshBasicMaterial();
      const material2 = new MeshBasicMaterial();
      
      const mesh1 = new Mesh(geometry, material1);
      const mesh2 = new Mesh(geometry, material2);
      
      scene.add(mesh1);
      scene.add(mesh2);
      
      scene.disposeMaterials();
      
      expect(material1.disposed).toBe(true);
      expect(material2.disposed).toBe(true);
    });
  });

  describe('Geometry', () => {
    it('should collect all geometries in scene', () => {
      const geometry1 = new BoxGeometry();
      const geometry2 = new BoxGeometry();
      
      const mesh1 = new Mesh(geometry1, new MeshBasicMaterial());
      const mesh2 = new Mesh(geometry2, new MeshBasicMaterial());
      
      scene.add(mesh1);
      scene.add(mesh2);
      
      const geometries = scene.getGeometries();
      
      expect(geometries).toContain(geometry1);
      expect(geometries).toContain(geometry2);
    });

    it('should dispose all geometries in scene', () => {
      const geometry1 = new BoxGeometry();
      const geometry2 = new BoxGeometry();
      
      const mesh1 = new Mesh(geometry1, new MeshBasicMaterial());
      const mesh2 = new Mesh(geometry2, new MeshBasicMaterial());
      
      scene.add(mesh1);
      scene.add(mesh2);
      
      scene.disposeGeometries();
      
      expect(geometry1.disposed).toBe(true);
      expect(geometry2.disposed).toBe(true);
    });
  });

  describe('Raycasting', () => {
    let mesh: Mesh;

    beforeEach(() => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial();
      mesh = new Mesh(geometry, material);
    });

    afterEach(() => {
      mesh.dispose();
    });

    it('should perform raycasting correctly', () => {
      scene.add(mesh);
      
      const raycaster = {
        origin: { x: 0, y: 0, z: 5 },
        direction: { x: 0, y: 0, z: -1 }
      };
      
      const intersects = scene.raycast(raycaster);
      
      expect(Array.isArray(intersects)).toBe(true);
      // Note: Actual raycast testing would require more complex setup
    });

    it('should filter objects for raycasting', () => {
      scene.add(mesh);
      
      mesh.visible = false;
      
      const raycaster = {
        origin: { x: 0, y: 0, z: 5 },
        direction: { x: 0, y: 0, z: -1 }
      };
      
      const intersects = scene.raycast(raycaster);
      
      // Invisible objects should not be raycasted
      expect(intersects).not.toContain(mesh);
    });
  });

  describe('Bouding Boxes and Spheres', () => {
    let mesh1: Mesh;
    let mesh2: Mesh;

    beforeEach(() => {
      const geometry1 = new BoxGeometry();
      const geometry2 = new BoxGeometry();
      const material = new MeshBasicMaterial();
      
      mesh1 = new Mesh(geometry1, material);
      mesh2 = new Mesh(geometry2, material);
      
      scene.add(mesh1);
      scene.add(mesh2);
    });

    afterEach(() => {
      mesh1.dispose();
      mesh2.dispose();
    });

    it('should compute scene bounding box correctly', () => {
      scene.computeBoundingBox();
      
      expect(scene.boundingBox).toBeDefined();
      expect(scene.boundingBox.min).toBeDefined();
      expect(scene.boundingBox.max).toBeDefined();
    });

    it('should compute scene bounding sphere correctly', () => {
      scene.computeBoundingSphere();
      
      expect(scene.boundingSphere).toBeDefined();
      expect(scene.boundingSphere.center).toBeDefined();
      expect(scene.boundingSphere.radius).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Serialization', () => {
    it('should serialize scene correctly', () => {
      const geometry = new BoxGeometry();
      const material = new MeshBasicMaterial();
      const mesh = new Mesh(geometry, material);
      
      scene.add(mesh);
      scene.background = { type: 'color', color: 0xff0000 };
      
      const data = scene.toJSON();
      
      expect(data).toBeDefined();
      expect(data.children).toHaveLength(1);
      expect(data.background).toBeDefined();
    });

    it('should serialize scene without background', () => {
      const data = scene.toJSON();
      
      expect(data.background).toBeNull();
    });
  });

  describe('Events', () => {
    it('should emit events when objects are added', () => {
      const addCallback = jest.fn();
      const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      
      scene.on('objectAdded', addCallback);
      scene.add(mesh);
      
      expect(addCallback).toHaveBeenCalledWith(mesh);
    });

    it('should emit events when objects are removed', () => {
      const removeCallback = jest.fn();
      const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
      
      scene.add(mesh);
      scene.on('objectRemoved', removeCallback);
      scene.remove(mesh);
      
      expect(removeCallback).toHaveBeenCalledWith(mesh);
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of objects efficiently', () => {
      const objectsCount = 1000;
      const objects: Mesh[] = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < objectsCount; i++) {
        const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
        objects.push(mesh);
        scene.add(mesh);
      }
      
      const endTime = performance.now();
      
      expect(scene.children).toHaveLength(objectsCount);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
      
      // Clean up
      objects.forEach(obj => obj.dispose());
    });
  });
});
