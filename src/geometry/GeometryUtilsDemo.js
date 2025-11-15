/**
 * Geometry Utils Usage Examples
 * Demonstrates how to use the geometry utility functions
 */

import { BoxGeometry, SphereGeometry, PlaneGeometry } from './primitives.js';
import {
  cloneGeometry,
  mergeGeometries,
  optimizeGeometry,
  calculateNormals,
  calculateTangents,
  unwrapUVs,
  createSpatialPartition,
  generateLOD,
  analyzeGeometry,
  GeometryProfiler
} from './GeometryUtils.js';

class GeometryUtilsDemo {
  constructor() {
    this.demoMerging();
    this.demoOptimization();
    this.demoNormalsAndTangents();
    this.demoUVUnwrapping();
    this.demoSpatialPartitioning();
    this.demoLOD();
    this.demoAnalysis();
  }

  /**
   * Demo: Geometry merging
   */
  demoMerging() {
    console.log('=== Geometry Merging Demo ===');
    
    // Create multiple box geometries
    const box1 = new BoxGeometry(1, 1, 1);
    const box2 = new BoxGeometry(1, 1, 1);
    const plane = new PlaneGeometry(2, 2);

    // Translate geometries for demonstration
    this.translateGeometry(box2, 2, 0, 0);
    this.translateGeometry(plane, 0, 0, 2);

    // Merge geometries
    const merged = mergeGeometries([box1, box2, plane]);
    
    console.log('Original geometries: 3');
    console.log('Merged vertices:', merged.vertices.length / 3);
    console.log('Merged triangles:', merged.indices ? merged.indices.length / 3 : 0);
    console.log('Has normals:', !!merged.normals);
    console.log('');
  }

  /**
   * Demo: Geometry optimization
   */
  demoOptimization() {
    console.log('=== Geometry Optimization Demo ===');
    
    const box = new BoxGeometry(1, 1, 1);
    console.log('Original vertices:', box.vertices.length / 3);
    
    const optimized = optimizeGeometry(box, 0.001);
    console.log('Optimized vertices:', optimized.vertices.length / 3);
    console.log('Original memory:', this.getMemoryUsage(box));
    console.log('Optimized memory:', this.getMemoryUsage(optimized));
    console.log('');
  }

  /**
   * Demo: Normals and Tangents calculation
   */
  demoNormalsAndTangents() {
    console.log('=== Normals and Tangents Demo ===');
    
    const plane = new PlaneGeometry(2, 2);
    
    // Calculate normals
    const normals = calculateNormals(plane);
    console.log('Calculated normals:', normals.length / 3);
    console.log('First normal:', Array.from(normals.slice(0, 3)).map(n => n.toFixed(2)));
    
    // Calculate tangents
    try {
      const tangents = calculateTangents(plane);
      console.log('Calculated tangents:', tangents.length / 4);
      console.log('First tangent:', Array.from(tangents.slice(0, 4)).map(n => n.toFixed(2)));
    } catch (e) {
      console.log('Tangents calculation requires UV coordinates');
    }
    console.log('');
  }

  /**
   * Demo: UV unwrapping
   */
  demoUVUnwrapping() {
    console.log('=== UV Unwrapping Demo ===');
    
    const box = new BoxGeometry(1, 1, 1);
    
    // Planar unwrapping
    const planarUVs = unwrapUVs(box, 'planar');
    console.log('Planar UVs:', planarUVs.length / 2);
    console.log('First UV:', Array.from(planarUVs.slice(0, 2)).map(uv => uv.toFixed(3)));
    
    // Cylindrical unwrapping
    const cylinderUVs = unwrapUVs(box, 'cylindrical');
    console.log('Cylindrical UVs:', cylinderUVs.length / 2);
    
    // Spherical unwrapping
    const sphereUVs = unwrapUVs(box, 'spherical');
    console.log('Spherical UVs:', sphereUVs.length / 2);
    console.log('');
  }

  /**
   * Demo: Spatial partitioning
   */
  demoSpatialPartitioning() {
    console.log('=== Spatial Partitioning Demo ===');
    
    const box = new BoxGeometry(10, 10, 10);
    
    // Create spatial partition
    const partition = createSpatialPartition(box, 4, 3);
    console.log('Spatial partition created with bounds:');
    console.log('- Center:', partition.bounds.center);
    console.log('- Size:', partition.bounds.size);
    
    // Add test objects
    const testObjects = this.generateTestObjects(10);
    for (const obj of testObjects) {
      partition.insert(obj);
    }
    
    console.log('Added', testObjects.length, 'objects to partition');
    console.log('Objects in root:', partition.objects.length);
    console.log('Child nodes:', partition.nodes.length);
    console.log('');
  }

  /**
   * Demo: Level of Detail generation
   */
  demoLOD() {
    console.log('=== Level of Detail Demo ===');
    
    const sphere = new SphereGeometry(1, 16, 12);
    console.log('Original vertices:', sphere.vertices.length / 3);
    
    const lodLevels = generateLOD(sphere, 4);
    
    lodLevels.forEach((level, index) => {
      console.log(`LOD Level ${index}:`);
      console.log(`  Distance: ${level.distance}`);
      console.log(`  Vertices: ${level.geometry.vertices.length / 3}`);
      console.log(`  Memory: ${this.getMemoryUsage(level.geometry)} bytes`);
    });
    console.log('');
  }

  /**
   * Demo: Geometry analysis
   */
  demoAnalysis() {
    console.log('=== Geometry Analysis Demo ===');
    
    const sphere = new SphereGeometry(1, 8, 6);
    const stats = analyzeGeometry(sphere);
    
    console.log('Geometry Statistics:');
    console.log('- Vertex count:', stats.vertexCount);
    console.log('- Triangle count:', stats.triangleCount);
    console.log('- Has normals:', stats.hasNormals);
    console.log('- Has UVs:', stats.hasUVs);
    console.log('- Surface area:', stats.surfaceArea.toFixed(3));
    console.log('- Bounding box:', stats.boundingBox);
    console.log('- Memory usage:', stats.memoryUsage);
    console.log('');
  }

  /**
   * Demo: Performance profiling
   */
  demoPerformance() {
    console.log('=== Performance Profiling Demo ===');
    
    const profiler = new GeometryProfiler();
    
    // Profile merging operation
    const mergeOp = profiler.startOperation('Geometry Merging');
    const box1 = new BoxGeometry(1, 1, 1);
    const box2 = new BoxGeometry(1, 1, 1);
    const merged = mergeGeometries([box1, box2]);
    profiler.endOperation(mergeOp);
    
    // Profile optimization
    const optOp = profiler.startOperation('Geometry Optimization');
    const optimized = optimizeGeometry(merged);
    profiler.endOperation(optOp);
    
    // Profile normal calculation
    const normalOp = profiler.startOperation('Normal Calculation');
    const normals = calculateNormals(optimized);
    profiler.endOperation(normalOp);
    
    const report = profiler.getReport();
    console.log('Performance Report:');
    console.log(report);
  }

  // Helper methods
  translateGeometry(geometry, x, y, z) {
    for (let i = 0; i < geometry.vertices.length; i += 3) {
      geometry.vertices[i] += x;
      geometry.vertices[i + 1] += y;
      geometry.vertices[i + 2] += z;
    }
  }

  getMemoryUsage(geometry) {
    let total = 0;
    total += geometry.vertices.length * 4;
    if (geometry.indices) total += geometry.indices.length * (geometry.indices.constructor === Uint16Array ? 2 : 4);
    if (geometry.normals) total += geometry.normals.length * 4;
    if (geometry.uvs) total += geometry.uvs.length * 4;
    return total;
  }

  generateTestObjects(count) {
    const objects = [];
    for (let i = 0; i < count; i++) {
      objects.push({
        bounds: {
          min: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, z: Math.random() * 20 - 10 },
          max: { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, z: Math.random() * 20 - 10 }
        },
        data: `object_${i}`
      });
    }
    return objects;
  }
}

// Run demonstration
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('Starting Geometry Utils Demo...');
  new GeometryUtilsDemo();
} else {
  // Demo is already exported
  // module.exports removed for UMD compatibility
}
