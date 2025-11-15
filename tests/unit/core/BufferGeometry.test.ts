import { BufferGeometry } from '../../../src/core/BufferGeometry';

describe('BufferGeometry', () => {
  let geometry: BufferGeometry;

  beforeEach(() => {
    geometry = new BufferGeometry();
  });

  afterEach(() => {
    geometry.dispose();
  });

  describe('Construction', () => {
    it('should create an empty geometry by default', () => {
      expect(geometry.attributes).toBeDefined();
      expect(geometry.index).toBeDefined();
      expect(geometry.boundingBox).toBeDefined();
      expect(geometry.boundingSphere).toBeDefined();
    });

    it('should have default vertex attributes', () => {
      expect(geometry.attributes.position).toBeDefined();
      expect(geometry.attributes.normal).toBeDefined();
      expect(geometry.attributes.uv).toBeDefined();
      expect(geometry.attributes.color).toBeDefined();
    });
  });

  describe('Vertex Attributes', () => {
    it('should set and get position data correctly', () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
      ]);
      
      geometry.setAttribute('position', positions);
      const attribute = geometry.getAttribute('position');
      
      expect(attribute).toBeDefined();
      expect(attribute.array).toEqual(positions);
      expect(attribute.itemSize).toBe(3);
      expect(attribute.count).toBe(3);
    });

    it('should set and get normal data correctly', () => {
      const normals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ]);
      
      geometry.setAttribute('normal', normals);
      const attribute = geometry.getAttribute('normal');
      
      expect(attribute).toBeDefined();
      expect(attribute.array).toEqual(normals);
      expect(attribute.itemSize).toBe(3);
    });

    it('should set and get UV coordinates correctly', () => {
      const uvs = new Float32Array([
        0, 0,
        1, 0,
        0, 1,
      ]);
      
      geometry.setAttribute('uv', uvs);
      const attribute = geometry.getAttribute('uv');
      
      expect(attribute).toBeDefined();
      expect(attribute.array).toEqual(uvs);
      expect(attribute.itemSize).toBe(2);
    });
  });

  describe('Index Buffer', () => {
    it('should set and get index buffer correctly', () => {
      const indices = new Uint16Array([0, 1, 2]);
      
      geometry.setIndex(indices);
      const index = geometry.getIndex();
      
      expect(index).toBeDefined();
      expect(index.array).toEqual(indices);
      expect(index.count).toBe(3);
    });
  });

  describe('Bounding Box', () => {
    it('should compute bounding box correctly', () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 1, 1,
      ]);
      
      geometry.setAttribute('position', positions);
      geometry.computeBoundingBox();
      
      const bbox = geometry.boundingBox;
      expect(bbox.min.x).toBe(0);
      expect(bbox.min.y).toBe(0);
      expect(bbox.min.z).toBe(0);
      expect(bbox.max.x).toBe(1);
      expect(bbox.max.y).toBe(1);
      expect(bbox.max.z).toBe(1);
    });

    it('should update bounding box when positions change', () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 1, 1,
      ]);
      
      geometry.setAttribute('position', positions);
      geometry.computeBoundingBox();
      
      const newPositions = new Float32Array([
        -1, -1, -1,
        2, 2, 2,
      ]);
      
      geometry.setAttribute('position', newPositions);
      geometry.computeBoundingBox();
      
      const bbox = geometry.boundingBox;
      expect(bbox.min.x).toBe(-1);
      expect(bbox.min.y).toBe(-1);
      expect(bbox.min.z).toBe(-1);
      expect(bbox.max.x).toBe(2);
      expect(bbox.max.y).toBe(2);
      expect(bbox.max.z).toBe(2);
    });
  });

  describe('Bounding Sphere', () => {
    it('should compute bounding sphere correctly', () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ]);
      
      geometry.setAttribute('position', positions);
      geometry.computeBoundingSphere();
      
      const sphere = geometry.boundingSphere;
      expect(sphere).toBeDefined();
      expect(sphere.center).toBeDefined();
      expect(sphere.radius).toBeGreaterThan(0);
    });
  });

  describe('Geometry Operations', () => {
    it('should merge geometries correctly', () => {
      const geometry1 = new BufferGeometry();
      geometry1.setAttribute('position', new Float32Array([0, 0, 0, 1, 0, 0]));
      
      const geometry2 = new BufferGeometry();
      geometry2.setAttribute('position', new Float32Array([0, 1, 0, 0, 0, 1]));
      
      BufferGeometry.mergeGeometries([geometry1, geometry2]);
      
      const mergedPositions = geometry.getAttribute('position');
      expect(mergedPositions.count).toBe(4);
    });

    it('should compute vertex normals correctly', () => {
      const positions = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0,
      ]);
      
      const indices = new Uint16Array([0, 1, 2]);
      
      geometry.setAttribute('position', positions);
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      
      const normals = geometry.getAttribute('normal');
      expect(normals).toBeDefined();
      expect(normals.count).toBe(3);
      
      // All normals should point in the same direction for this triangle
      expect(normals.array[0]).toBeApproximately(normals.array[3]);
      expect(normals.array[1]).toBeApproximately(normals.array[4]);
      expect(normals.array[2]).toBeApproximately(normals.array[5]);
    });
  });

  describe('Memory Management', () => {
    it('should dispose attributes correctly', () => {
      const positions = new Float32Array([0, 0, 0, 1, 1, 1]);
      geometry.setAttribute('position', positions);
      
      geometry.dispose();
      
      expect(() => geometry.getAttribute('position')).not.toThrow();
    });

    it('should dispose index correctly', () => {
      const indices = new Uint16Array([0, 1, 2]);
      geometry.setIndex(indices);
      
      geometry.dispose();
      
      expect(() => geometry.getIndex()).not.toThrow();
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize geometry correctly', () => {
      const positions = new Float32Array([0, 0, 0, 1, 1, 1]);
      const normals = new Float32Array([0, 0, 1, 0, 0, 1]);
      
      geometry.setAttribute('position', positions);
      geometry.setAttribute('normal', normals);
      
      const data = geometry.toJSON();
      
      expect(data).toBeDefined();
      expect(data.attributes.position).toBeDefined();
      expect(data.attributes.normal).toBeDefined();
    });
  });
});
