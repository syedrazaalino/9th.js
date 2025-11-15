/**
 * Geometry Primitives Example
 * Demonstrates all available geometry types with various configurations
 */

import { Mesh } from '../core/mesh.js';
import { 
  BoxGeometry, 
  SphereGeometry, 
  PlaneGeometry, 
  CylinderGeometry, 
  ConeGeometry, 
  CircleGeometry,
  createGeometry,
  getGeometryInfo
} from './primitives.js';

class GeometryDemo {
  constructor(scene) {
    this.scene = scene;
    this.meshes = [];
    this.demoIndex = 0;
  }

  // Create and add all primitive types
  createBasicPrimitives() {
    console.log('Creating basic geometry primitives...');

    // Box geometries with different subdivisions
    const box1 = new BoxGeometry(1, 1, 1);
    this._addMesh(box1, 'Box (Basic)', -4, 0, 0);

    const box2 = new BoxGeometry(1, 1, 1, 4, 4, 4);
    this._addMesh(box2, 'Box (Subdivided)', -4, 2, 0);

    // Sphere geometries with different resolutions
    const sphere1 = new SphereGeometry(0.8, 16, 8);
    this._addMesh(sphere1, 'Sphere (Low)', -2, 0, 0);

    const sphere2 = new SphereGeometry(0.8, 32, 16);
    this._addMesh(sphere2, 'Sphere (Medium)', -2, 2, 0);

    const sphere3 = new SphereGeometry(0.8, 64, 32);
    this._addMesh(sphere3, 'Sphere (High)', -2, 4, 0);

    // Plane geometries
    const plane1 = new PlaneGeometry(1.5, 1.5);
    this._addMesh(plane1, 'Plane (Basic)', 0, 0, 0);

    const plane2 = PlaneGeometry.createXZPlane(2, 2, 4, 4);
    this._addMesh(plane2, 'Plane (XZ)', 0, 2, 0);

    const plane3 = PlaneGeometry.createYZPlane(2, 2, 4, 4);
    this._addMesh(plane3, 'Plane (YZ)', 0, 4, 0);

    console.log(`Created ${this.meshes.length} basic primitive meshes`);
  }

  // Create cylindrical geometries
  createCylindricalPrimitives() {
    console.log('Creating cylindrical geometries...');

    // Basic cylinder
    const cylinder1 = new CylinderGeometry(0.6, 0.6, 2);
    this._addMesh(cylinder1, 'Cylinder', 2, 0, 0);

    // Conical frustum
    const cylinder2 = new CylinderGeometry(0.8, 0.4, 2);
    this._addMesh(cylinder2, 'Conical Frustum', 2, 2, 0);

    // Cone
    const cone1 = new ConeGeometry(0.8, 2);
    this._addMesh(cone1, 'Cone', 2, 4, 0);

    // Open-ended cylinder
    const cylinder3 = new CylinderGeometry(0.6, 0.6, 2, 16, 1, true);
    this._addMesh(cylinder3, 'Cylinder (Open)', 4, 0, 0);

    // Cone without base
    const cone2 = new ConeGeometry(0.8, 2, 16, 1, true);
    this._addMesh(cone2, 'Cone (No Base)', 4, 2, 0);

    // Very high resolution cylinder
    const cylinder4 = new CylinderGeometry(0.6, 0.6, 2, 32, 8);
    this._addMesh(cylinder4, 'Cylinder (High Res)', 4, 4, 0);

    console.log(`Created ${this.meshes.length} cylindrical primitive meshes`);
  }

  // Create circular and specialized geometries
  createCircularPrimitives() {
    console.log('Creating circular and specialized geometries...');

    // Basic circles
    const circle1 = new CircleGeometry(0.8);
    this._addMesh(circle1, 'Circle (Complete)', 6, 0, 0);

    const circle2 = new CircleGeometry(0.8, 64, 0, Math.PI); // Semicircle
    this._addMesh(circle2, 'Semicircle', 6, 2, 0);

    const circle3 = new CircleGeometry(0.8, 32, 0, Math.PI / 2); // Quarter circle
    this._addMesh(circle3, 'Quarter Circle', 6, 4, 0);

    // Specialized circular shapes
    const ring = CircleGeometry.createRing(0.4, 0.8, 32);
    this._addMesh(ring, 'Ring', 8, 0, 0);

    const ellipse = CircleGeometry.createEllipse(1.0, 0.6, 32);
    this._addMesh(ellipse, 'Ellipse', 8, 2, 0);

    const arc = CircleGeometry.createArc(0.8, 32, Math.PI / 4, Math.PI);
    this._addMesh(arc, 'Arc', 8, 4, 0);

    console.log(`Created ${this.meshes.length} circular primitive meshes`);
  }

  // Demonstrate factory function usage
  demonstrateFactoryFunction() {
    console.log('Demonstrating factory function...');

    const geometries = [
      { type: 'box', params: { width: 1, height: 1, depth: 1 } },
      { type: 'sphere', params: { radius: 0.8, widthSegments: 32, heightSegments: 16 } },
      { type: 'plane', params: { width: 1.5, height: 1.5 } },
      { type: 'cylinder', params: { radiusTop: 0.6, radiusBottom: 0.6, height: 1.5 } },
      { type: 'cone', params: { radius: 0.8, height: 1.5 } },
      { type: 'circle', params: { radius: 0.8, segments: 32 } }
    ];

    for (let i = 0; i < geometries.length; i++) {
      const geom = geometries[i];
      const geometry = createGeometry(geom.type, geom.params);
      this._addMesh(geometry, `Factory: ${geom.type}`, 10, i * 1.2, 0);

      // Log geometry information
      const info = getGeometryInfo(geometry);
      console.log(`${geom.type} geometry info:`, info);
    }

    console.log(`Created ${this.meshes.length} factory-generated meshes`);
  }

  // Demonstrate performance characteristics
  demonstratePerformance() {
    console.log('Creating performance comparison geometries...');

    const resolutions = [
      { name: 'Low', segments: 8 },
      { name: 'Medium', segments: 16 },
      { name: 'High', segments: 32 },
      { name: 'Ultra', segments: 64 }
    ];

    // Test sphere performance
    for (let i = 0; i < resolutions.length; i++) {
      const res = resolutions[i];
      const sphere = new SphereGeometry(0.6, res.segments * 2, res.segments);
      this._addMesh(sphere, `Sphere (${res.name})`, 12, i * 1.2, 0);

      const info = getGeometryInfo(sphere);
      console.log(`Sphere ${res.name}:`, info);
    }

    // Test cylinder performance
    for (let i = 0; i < resolutions.length; i++) {
      const res = resolutions[i];
      const cylinder = new CylinderGeometry(0.6, 0.6, 1.2, res.segments, Math.floor(res.segments / 4));
      this._addMesh(cylinder, `Cylinder (${res.name})`, 14, i * 1.2, 0);

      const info = getGeometryInfo(cylinder);
      console.log(`Cylinder ${res.name}:`, info);
    }

    console.log(`Created ${this.meshes.length} performance test meshes`);
  }

  // Add mesh to scene with basic positioning and logging
  _addMesh(geometry, name, x, y, z) {
    const mesh = new Mesh(geometry);
    mesh.position = { x, y, z };
    mesh.setPosition(x, y, z);
    
    // Add some basic metadata
    mesh.name = name;
    mesh.userData = {
      geometryType: geometry.constructor.name,
      vertexCount: geometry.vertices.length / 3,
      triangleCount: geometry.indices ? geometry.indices.length / 3 : 0
    };

    this.scene.add(mesh);
    this.meshes.push(mesh);

    console.log(`Added ${name}: ${mesh.userData.vertexCount} vertices, ${mesh.userData.triangleCount} triangles`);
  }

  // Demonstrate animation of geometries
  animate(time) {
    if (!this.meshes.length) return;

    // Rotate all meshes for better visualization
    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i];
      const rotationSpeed = 0.5 + (i % 3) * 0.2;
      
      mesh.setRotation(
        time * rotationSpeed * 0.001,
        time * rotationSpeed * 0.0008,
        0
      );
    }
  }

  // Generate statistics report
  generateReport() {
    const report = {
      totalMeshes: this.meshes.length,
      totalVertices: 0,
      totalTriangles: 0,
      memoryUsage: 0,
      geometryTypes: {},
      segmentCounts: {}
    };

    for (const mesh of this.meshes) {
      const info = getGeometryInfo(mesh.geometry);
      const type = info.type;

      report.totalVertices += info.vertexCount;
      report.totalTriangles += info.triangleCount;
      report.memoryUsage += info.memoryUsage;

      // Count geometry types
      report.geometryTypes[type] = (report.geometryTypes[type] || 0) + 1;

      // Track segment usage (approximate)
      const segments = this._estimateSegments(mesh.geometry);
      if (segments) {
        const segKey = `${segments} segments`;
        report.segmentCounts[segKey] = (report.segmentCounts[segKey] || 0) + 1;
      }
    }

    return report;
  }

  // Estimate segment counts from geometry
  _estimateSegments(geometry) {
    if (geometry instanceof SphereGeometry) {
      // For spheres, we can estimate from vertex count
      const vertexCount = geometry.vertices.length / 3;
      return Math.round(Math.sqrt(vertexCount / 2));
    }
    
    if (geometry instanceof CylinderGeometry || geometry instanceof ConeGeometry) {
      // For cylinders, segments relate to radial resolution
      return Math.round((geometry.vertices.length / 3) / 6);
    }
    
    if (geometry instanceof CircleGeometry) {
      return Math.round((geometry.vertices.length - 2) / 2); // -2 for center vertex
    }
    
    return null;
  }

  // Demonstrate specific edge cases
  demonstrateEdgeCases() {
    console.log('Creating edge case geometries...');

    // Minimal segments
    const minimalSphere = new SphereGeometry(1, 3, 2);
    this._addMesh(minimalSphere, 'Minimal Sphere', -6, 6, 0);

    // Maximum segments (but reasonable)
    const highResSphere = new SphereGeometry(1, 128, 64);
    this._addMesh(highResSphere, 'High Res Sphere', -4, 6, 0);

    // Very thin cylinder
    const thinCylinder = new CylinderGeometry(0.1, 0.1, 2, 8, 1);
    this._addMesh(thinCylinder, 'Thin Cylinder', -2, 6, 0);

    // Very wide cylinder
    const wideCylinder = new CylinderGeometry(2, 2, 0.2, 32, 1);
    this._addMesh(wideCylinder, 'Wide Cylinder', 0, 6, 0);

    // Small circle with many segments
    const smoothCircle = new CircleGeometry(0.5, 128);
    this._addMesh(smoothCircle, 'Smooth Circle', 2, 6, 0);

    // Large arc
    const largeArc = new CircleGeometry(1, 32, Math.PI / 6, Math.PI * 1.5);
    this._addMesh(largeArc, 'Large Arc', 4, 6, 0);

    console.log(`Created ${this.meshes.length} edge case meshes`);
  }

  // Clear all created meshes
  clear() {
    for (const mesh of this.meshes) {
      this.scene.remove(mesh);
    }
    this.meshes = [];
  }

  // Get current mesh count
  getMeshCount() {
    return this.meshes.length;
  }

  // Get specific mesh by index
  getMesh(index) {
    return this.meshes[index];
  }

  // Demonstrate quality settings
  demonstrateQualitySettings() {
    console.log('Creating quality comparison...');

    const qualities = [
      { name: 'Ultra Low', sphereSeg: [8, 4], cylinderSeg: [6, 1] },
      { name: 'Low', sphereSeg: [16, 8], cylinderSeg: [12, 2] },
      { name: 'Medium', sphereSeg: [32, 16], cylinderSeg: [24, 4] },
      { name: 'High', sphereSeg: [64, 32], cylinderSeg: [48, 8] },
      { name: 'Ultra', sphereSeg: [128, 64], cylinderSeg: [96, 16] }
    ];

    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      
      // Create sphere at this quality
      const sphere = new SphereGeometry(0.6, quality.sphereSeg[0], quality.sphereSeg[1]);
      this._addMesh(sphere, `${quality.name} Sphere`, 16, i * 1.2, 0);

      // Create cylinder at this quality
      const cylinder = new CylinderGeometry(0.6, 0.6, 1.2, quality.cylinderSeg[0], quality.cylinderSeg[1]);
      this._addMesh(cylinder, `${quality.name} Cylinder`, 18, i * 1.2, 0);

      // Compare memory usage
      const sphereInfo = getGeometryInfo(sphere);
      const cylinderInfo = getGeometryInfo(cylinder);
      
      console.log(`${quality.name} quality:`, {
        sphere: { vertices: sphereInfo.vertexCount, memory: sphereInfo.memoryUsage },
        cylinder: { vertices: cylinderInfo.vertexCount, memory: cylinderInfo.memoryUsage }
      });
    }

    console.log(`Created ${this.meshes.length} quality comparison meshes`);
  }
}

// Export for use in other modules
export default GeometryDemo;

// Example usage:
/*
import GeometryDemo from './examples/geometry-demo.js';

const scene = new Scene();
const demo = new GeometryDemo(scene);

// Run different demonstrations
demo.createBasicPrimitives();
demo.createCylindricalPrimitives();
demo.createCircularPrimitives();
demo.demonstrateFactoryFunction();
demo.demonstratePerformance();
demo.demonstrateQualitySettings();
demo.demonstrateEdgeCases();

// Generate final report
const report = demo.generateReport();
console.log('Geometry Demo Report:', report);

// Animation loop
function animate(time) {
  demo.animate(time);
  // ... render scene
}
*/
