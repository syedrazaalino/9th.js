import { BoxGeometry } from '../../../src/geometry/BoxGeometry';

describe('BoxGeometry', () => {
  let geometry: BoxGeometry;

  describe('Default Constructor', () => {
    beforeEach(() => {
      geometry = new BoxGeometry();
    });

    afterEach(() => {
      geometry.dispose();
    });

    it('should create a cube geometry with default size (1x1x1)', () => {
      expect(geometry.parameters.width).toBe(1);
      expect(geometry.parameters.height).toBe(1);
      expect(geometry.parameters.depth).toBe(1);
      expect(geometry.parameters.widthSegments).toBe(1);
      expect(geometry.parameters.heightSegments).toBe(1);
      expect(geometry.parameters.depthSegments).toBe(1);
    });

    it('should have correct vertex count for default cube', () => {
      const positions = geometry.getAttribute('position');
      // 6 faces × 4 vertices per face = 24 vertices
      expect(positions.count).toBe(24);
    });

    it('should have correct normal count', () => {
      const normals = geometry.getAttribute('normal');
      expect(normals.count).toBe(24);
    });

    it('should have correct UV coordinate count', () => {
      const uvs = geometry.getAttribute('uv');
      expect(uvs.count).toBe(24);
    });

    it('should have correct index count', () => {
      const indices = geometry.getIndex();
      // 6 faces × 2 triangles per face × 3 indices per triangle = 36 indices
      expect(indices.count).toBe(36);
    });
  });

  describe('Custom Size Constructor', () => {
    it('should create geometry with specified width, height, depth', () => {
      const customGeometry = new BoxGeometry(2, 3, 4);
      
      expect(customGeometry.parameters.width).toBe(2);
      expect(customGeometry.parameters.height).toBe(3);
      expect(customGeometry.parameters.depth).toBe(4);
      
      customGeometry.dispose();
    });

    it('should handle zero dimensions correctly', () => {
      const flatGeometry = new BoxGeometry(0, 1, 1);
      
      expect(flatGeometry.parameters.width).toBe(0);
      expect(flatGeometry.parameters.height).toBe(1);
      expect(flatGeometry.parameters.depth).toBe(1);
      
      flatGeometry.dispose();
    });

    it('should handle negative dimensions correctly', () => {
      const negativeGeometry = new BoxGeometry(-1, 1, 1);
      
      expect(negativeGeometry.parameters.width).toBe(-1);
      
      negativeGeometry.dispose();
    });
  });

  describe('Segment Constructor', () => {
    it('should create geometry with specified segments', () => {
      const segmentedGeometry = new BoxGeometry(1, 1, 1, 2, 3, 4);
      
      expect(segmentedGeometry.parameters.widthSegments).toBe(2);
      expect(segmentedGeometry.parameters.heightSegments).toBe(3);
      expect(segmentedGeometry.parameters.depthSegments).toBe(4);
      
      segmentedGeometry.dispose();
    });

    it('should handle zero segments', () => {
      const noSegmentsGeometry = new BoxGeometry(1, 1, 1, 0, 0, 0);
      
      expect(noSegmentsGeometry.parameters.widthSegments).toBe(0);
      expect(noSegmentsGeometry.parameters.heightSegments).toBe(0);
      expect(noSegmentsGeometry.parameters.depthSegments).toBe(0);
      
      noSegmentsGeometry.dispose();
    });
  });

  describe('Vertex Positions', () => {
    beforeEach(() => {
      geometry = new BoxGeometry(2, 3, 4);
    });

    afterEach(() => {
      geometry.dispose();
    });

    it('should have correct position values for width', () => {
      const positions = geometry.getAttribute('position');
      
      // Check if positions span from -1 to +1 (width of 2 centered at origin)
      let minX = Infinity;
      let maxX = -Infinity;
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      
      expect(minX).toBeApproximately(-1, 1);
      expect(maxX).toBeApproximately(1, 1);
    });

    it('should have correct position values for height', () => {
      const positions = geometry.getAttribute('position');
      
      // Check if positions span from -1.5 to +1.5 (height of 3 centered at origin)
      let minY = Infinity;
      let maxY = -Infinity;
      
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      
      expect(minY).toBeApproximately(-1.5, 1);
      expect(maxY).toBeApproximately(1.5, 1);
    });

    it('should have correct position values for depth', () => {
      const positions = geometry.getAttribute('position');
      
      // Check if positions span from -2 to +2 (depth of 4 centered at origin)
      let minZ = Infinity;
      let maxZ = -Infinity;
      
      for (let i = 0; i < positions.count; i++) {
        const z = positions.getZ(i);
        minZ = Math.min(minZ, z);
        maxZ = Math.max(maxZ, z);
      }
      
      expect(minZ).toBeApproximately(-2, 1);
      expect(maxZ).toBeApproximately(2, 1);
    });
  });

  describe('Normals', () => {
    beforeEach(() => {
      geometry = new BoxGeometry();
    });

    afterEach(() => {
      geometry.dispose();
    });

    it('should have unit length normals', () => {
      const normals = geometry.getAttribute('normal');
      
      for (let i = 0; i < normals.count; i++) {
        const x = normals.getX(i);
        const y = normals.getY(i);
        const z = normals.getZ(i);
        
        const length = Math.sqrt(x * x + y * y + z * z);
        expect(length).toBeApproximately(1, 2);
      }
    });

    it('should have correct normals for each face', () => {
      const normals = geometry.getAttribute('normal');
      const positions = geometry.getAttribute('position');
      
      // Check front face (z = 1)
      const frontFaceNormals = [];
      for (let i = 0; i < normals.count; i++) {
        const z = positions.getZ(i);
        if (z > 0.5) { // Front face
          frontFaceNormals.push({
            x: normals.getX(i),
            y: normals.getY(i),
            z: normals.getZ(i)
          });
        }
      }
      
      // All front face normals should point in +Z direction
      frontFaceNormals.forEach(normal => {
        expect(normal.z).toBeApproximately(1, 2);
        expect(Math.abs(normal.x)).toBeLessThan(0.1);
        expect(Math.abs(normal.y)).toBeLessThan(0.1);
      });
    });
  });

  describe('UV Coordinates', () => {
    beforeEach(() => {
      geometry = new BoxGeometry();
    });

    afterEach(() => {
      geometry.dispose();
    });

    it('should have UV coordinates in range [0, 1]', () => {
      const uvs = geometry.getAttribute('uv');
      
      for (let i = 0; i < uvs.count; i++) {
        const u = uvs.getX(i);
        const v = uvs.getY(i);
        
        expect(u).toBeGreaterThanOrEqual(0);
        expect(u).toBeLessThanOrEqual(1);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it('should have correct UV mapping for each face', () => {
      const uvs = geometry.getAttribute('uv');
      const positions = geometry.getAttribute('position');
      
      // Check that UV coordinates create proper texture mapping
      // This is more of an integration test
      const uniqueUVCombinations = new Set();
      
      for (let i = 0; i < uvs.count; i++) {
        const u = Math.round(uvs.getX(i) * 10) / 10; // Round to avoid floating point issues
        const v = Math.round(uvs.getY(i) * 10) / 10;
        uniqueUVCombinations.add(`${u},${v}`);
      }
      
      // Should have multiple UV combinations for proper texture mapping
      expect(uniqueUVCombinations.size).toBeGreaterThan(4);
    });
  });

  describe('Indices', () => {
    beforeEach(() => {
      geometry = new BoxGeometry();
    });

    afterEach(() => {
      geometry.dispose();
    });

    it('should have valid indices', () => {
      const positions = geometry.getAttribute('position');
      const indices = geometry.getIndex();
      
      for (let i = 0; i < indices.count; i++) {
        const index = indices.getX(i);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(positions.count);
      }
    });

    it('should form correct triangles', () => {
      const indices = geometry.getIndex();
      
      // Check that triangles are formed correctly
      for (let i = 0; i < indices.count; i += 3) {
        const index1 = indices.getX(i);
        const index2 = indices.getX(i + 1);
        const index3 = indices.getX(i + 2);
        
        // All three indices should be different (no degenerate triangles)
        expect(index1).not.toBe(index2);
        expect(index2).not.toBe(index3);
        expect(index1).not.toBe(index3);
      }
    });
  });

  describe('Segmented Box', () => {
    it('should create geometry with segments correctly', () => {
      const segmentedGeometry = new BoxGeometry(1, 1, 1, 2, 2, 2);
      
      const positions = segmentedGeometry.getAttribute('position');
      const normals = segmentedGeometry.getAttribute('normal');
      const uvs = segmentedGeometry.getAttribute('uv');
      const indices = segmentedGeometry.getIndex();
      
      // With 2 segments per axis, we should have:
      // - (2+1)³ = 27 unique vertices
      // - But due to face normals, we have (2*3)*4 = 24 vertices for each face type
      
      expect(positions.count).toBeGreaterThan(24);
      expect(normals.count).toBe(positions.count);
      expect(uvs.count).toBe(positions.count);
      expect(indices.count).toBeGreaterThan(36);
      
      segmentedGeometry.dispose();
    });

    it('should handle high segment counts', () => {
      const highSegGeometry = new BoxGeometry(1, 1, 1, 10, 10, 10);
      
      const positions = highSegGeometry.getAttribute('position');
      
      // Should have more vertices due to segmentation
      expect(positions.count).toBeGreaterThan(100);
      
      highSegGeometry.dispose();
    });
  });

  describe('Memory Management', () => {
    it('should dispose geometry correctly', () => {
      const geometry = new BoxGeometry();
      
      geometry.dispose();
      
      expect(geometry.disposed).toBe(true);
    });

    it('should clean up attributes on disposal', () => {
      const geometry = new BoxGeometry();
      
      geometry.dispose();
      
      // Attributes should be cleaned up
      expect(() => geometry.getAttribute('position')).not.toThrow();
    });
  });

  describe('Serialization', () => {
    it('should serialize geometry correctly', () => {
      const geometry = new BoxGeometry(2, 3, 4, 2, 3, 4);
      
      const data = geometry.toJSON();
      
      expect(data).toBeDefined();
      expect(data.parameters.width).toBe(2);
      expect(data.parameters.height).toBe(3);
      expect(data.parameters.depth).toBe(4);
      expect(data.parameters.widthSegments).toBe(2);
      expect(data.parameters.heightSegments).toBe(3);
      expect(data.parameters.depthSegments).toBe(4);
      
      geometry.dispose();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small dimensions', () => {
      const tinyGeometry = new BoxGeometry(0.001, 0.001, 0.001);
      
      const positions = tinyGeometry.getAttribute('position');
      expect(positions.count).toBeGreaterThan(0);
      
      tinyGeometry.dispose();
    });

    it('should handle very large dimensions', () => {
      const hugeGeometry = new BoxGeometry(1000, 1000, 1000);
      
      const positions = hugeGeometry.getAttribute('position');
      expect(positions.count).toBeGreaterThan(0);
      
      hugeGeometry.dispose();
    });

    it('should handle one dimension being zero', () => {
      const flatGeometry = new BoxGeometry(0, 1, 1);
      
      const positions = flatGeometry.getAttribute('position');
      expect(positions.count).toBe(0); // Should have no vertices if width is 0
      
      flatGeometry.dispose();
    });
  });

  describe('Clone and Copy', () => {
    it('should clone geometry correctly', () => {
      const originalGeometry = new BoxGeometry(2, 3, 4, 2, 3, 4);
      
      const clonedGeometry = originalGeometry.clone();
      
      expect(clonedGeometry.parameters.width).toBe(2);
      expect(clonedGeometry.parameters.height).toBe(3);
      expect(clonedGeometry.parameters.depth).toBe(4);
      expect(clonedGeometry.parameters.widthSegments).toBe(2);
      expect(clonedGeometry.parameters.heightSegments).toBe(3);
      expect(clonedGeometry.parameters.depthSegments).toBe(4);
      
      // Should have same number of vertices
      const originalPositions = originalGeometry.getAttribute('position');
      const clonedPositions = clonedGeometry.getAttribute('position');
      expect(clonedPositions.count).toBe(originalPositions.count);
      
      originalGeometry.dispose();
      clonedGeometry.dispose();
    });
  });

  describe('Performance', () => {
    it('should create large segmented geometry efficiently', () => {
      const startTime = performance.now();
      
      const largeGeometry = new BoxGeometry(1, 1, 1, 50, 50, 50);
      
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should create in less than 100ms
      
      largeGeometry.dispose();
    });
  });
});
