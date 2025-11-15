/**
 * Geometry primitives module
 * Built-in geometric shapes and primitives
 * 
 * This module provides comprehensive implementations of basic 3D geometry primitives
 * including proper UV mapping, normals, tangents, and performance optimizations.
 */

import { MeshGeometry } from '../core/mesh';

// Import JavaScript geometry classes (compiled to JS from TypeScript)
const BoxGeometryJS = require('./BoxGeometry.js');
const SphereGeometryJS = require('./SphereGeometry.js');
const PlaneGeometryJS = require('./PlaneGeometry.js');
const CylinderGeometryJS = require('./CylinderGeometry.js');
const ConeGeometryJS = require('./ConeGeometry.js');
const CircleGeometryJS = require('./CircleGeometry.js');

// Type definitions for geometry interfaces
export interface GeometryParams {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radialSegments?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
  segments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaLength?: number;
}

// Enhanced BoxGeometry with proper implementation
export class BoxGeometry implements MeshGeometry {
  public vertices: Float32Array;
  public indices: Uint16Array | Uint32Array;
  public normals: Float32Array;
  public uvs: Float32Array;
  public tangents?: Float32Array;

  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    const geometry = new BoxGeometryJS.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
    
    this.vertices = geometry.vertices;
    this.indices = geometry.indices;
    this.normals = geometry.normals;
    this.uvs = geometry.uvs;
    this.tangents = geometry.tangents;
  }

  // Utility methods
  getVertexCount(): number {
    return this.vertices.length / 3;
  }

  getTriangleCount(): number {
    return this.indices.length / 3;
  }

  getDimensions() {
    return {
      width: Math.abs(this.vertices[0] - this.vertices[3]),
      height: Math.abs(this.vertices[1] - this.vertices[7]),
      depth: Math.abs(this.vertices[2] - this.vertices[5])
    };
  }
}

// Enhanced SphereGeometry with proper implementation
export class SphereGeometry implements MeshGeometry {
  public vertices: Float32Array;
  public indices: Uint16Array | Uint32Array;
  public normals: Float32Array;
  public uvs: Float32Array;
  public tangents?: Float32Array;

  constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
    const geometry = new SphereGeometryJS.SphereGeometry(radius, widthSegments, heightSegments);
    
    this.vertices = geometry.vertices;
    this.indices = geometry.indices;
    this.normals = geometry.normals;
    this.uvs = geometry.uvs;
    this.tangents = geometry.tangents;
  }

  // Utility methods
  getVertexCount(): number {
    return this.vertices.length / 3;
  }

  getTriangleCount(): number {
    return this.indices.length / 3;
  }

  getRadius(): number {
    return Math.sqrt(this.vertices[0] * this.vertices[0] + 
                     this.vertices[1] * this.vertices[1] + 
                     this.vertices[2] * this.vertices[2]);
  }
}

// Enhanced PlaneGeometry with proper implementation
export class PlaneGeometry implements MeshGeometry {
  public vertices: Float32Array;
  public indices: Uint16Array;
  public normals: Float32Array;
  public uvs: Float32Array;
  public tangents?: Float32Array;

  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    const geometry = new PlaneGeometryJS.PlaneGeometry(width, height, widthSegments, heightSegments);
    
    this.vertices = geometry.vertices;
    this.indices = geometry.indices;
    this.normals = geometry.normals;
    this.uvs = geometry.uvs;
    this.tangents = geometry.tangents;
  }

  // Static methods for different plane orientations
  static createXZPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1): PlaneGeometry {
    const geometry = PlaneGeometryJS.PlaneGeometry.createXZPlane(width, height, widthSegments, heightSegments);
    const planeGeometry = new PlaneGeometry();
    planeGeometry.vertices = geometry.vertices;
    planeGeometry.indices = geometry.indices;
    planeGeometry.normals = geometry.normals;
    planeGeometry.uvs = geometry.uvs;
    planeGeometry.tangents = geometry.tangents;
    return planeGeometry;
  }

  static createYZPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1): PlaneGeometry {
    const geometry = PlaneGeometryJS.PlaneGeometry.createYZPlane(width, height, widthSegments, heightSegments);
    const planeGeometry = new PlaneGeometry();
    planeGeometry.vertices = geometry.vertices;
    planeGeometry.indices = geometry.indices;
    planeGeometry.normals = geometry.normals;
    planeGeometry.uvs = geometry.uvs;
    planeGeometry.tangents = geometry.tangents;
    return planeGeometry;
  }

  // Utility methods
  getVertexCount(): number {
    return this.vertices.length / 3;
  }

  getTriangleCount(): number {
    return this.indices.length / 3;
  }

  getDimensions() {
    return {
      width: Math.abs(this.vertices[0] - this.vertices[3]),
      height: Math.abs(this.vertices[1] - this.vertices[4])
    };
  }
}

// New CylinderGeometry
export class CylinderGeometry implements MeshGeometry {
  public vertices: Float32Array;
  public indices: Uint16Array | Uint32Array;
  public normals: Float32Array;
  public uvs: Float32Array;
  public tangents?: Float32Array;

  constructor(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 8, heightSegments = 1, openEnded = false) {
    const geometry = new CylinderGeometryJS.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
    
    this.vertices = geometry.vertices;
    this.indices = geometry.indices;
    this.normals = geometry.normals;
    this.uvs = geometry.uvs;
    this.tangents = geometry.tangents;
  }

  // Utility methods
  getVertexCount(): number {
    return this.vertices.length / 3;
  }

  getTriangleCount(): number {
    return this.indices.length / 3;
  }

  getDimensions() {
    return {
      radiusTop: Math.sqrt(this.vertices[0] * this.vertices[0] + this.vertices[2] * this.vertices[2]),
      radiusBottom: Math.sqrt(this.vertices[this.vertices.length - 3] * this.vertices[this.vertices.length - 3] + 
                              this.vertices[this.vertices.length - 1] * this.vertices[this.vertices.length - 1]),
      height: this.getHeight()
    };
  }

  getHeight(): number {
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (let i = 1; i < this.vertices.length; i += 3) {
      const y = this.vertices[i];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    return maxY - minY;
  }
}

// New ConeGeometry
export class ConeGeometry implements MeshGeometry {
  public vertices: Float32Array;
  public indices: Uint16Array | Uint32Array;
  public normals: Float32Array;
  public uvs: Float32Array;
  public tangents?: Float32Array;

  constructor(radius = 1, height = 1, radialSegments = 8, heightSegments = 1, openEnded = false) {
    const geometry = new ConeGeometryJS.ConeGeometry(radius, height, radialSegments, heightSegments, openEnded);
    
    this.vertices = geometry.vertices;
    this.indices = geometry.indices;
    this.normals = geometry.normals;
    this.uvs = geometry.uvs;
    this.tangents = geometry.tangents;
  }

  // Utility methods
  getVertexCount(): number {
    return this.vertices.length / 3;
  }

  getTriangleCount(): number {
    return this.indices.length / 3;
  }

  getDimensions() {
    return {
      radius: Math.sqrt(this.vertices[0] * this.vertices[0] + this.vertices[2] * this.vertices[2]),
      height: this.getHeight()
    };
  }

  getHeight(): number {
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (let i = 1; i < this.vertices.length; i += 3) {
      const y = this.vertices[i];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    return maxY - minY;
  }
}

// New CircleGeometry
export class CircleGeometry implements MeshGeometry {
  public vertices: Float32Array;
  public indices: Uint16Array;
  public normals: Float32Array;
  public uvs: Float32Array;
  public tangents?: Float32Array;

  constructor(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    const geometry = new CircleGeometryJS.CircleGeometry(radius, segments, thetaStart, thetaLength);
    
    this.vertices = geometry.vertices;
    this.indices = geometry.indices;
    this.normals = geometry.normals;
    this.uvs = geometry.uvs;
    this.tangents = geometry.tangents;
  }

  // Static methods for specialized shapes
  static createSemicircle(radius = 1, segments = 32, startAngle = 0): CircleGeometry {
    const geometry = CircleGeometryJS.CircleGeometry.createSemicircle(radius, segments, startAngle);
    const circleGeometry = new CircleGeometry();
    circleGeometry.vertices = geometry.vertices;
    circleGeometry.indices = geometry.indices;
    circleGeometry.normals = geometry.normals;
    circleGeometry.uvs = geometry.uvs;
    circleGeometry.tangents = geometry.tangents;
    return circleGeometry;
  }

  static createRing(innerRadius = 0.5, outerRadius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2): CircleGeometry {
    const geometry = CircleGeometryJS.CircleGeometry.createRing(innerRadius, outerRadius, segments, thetaStart, thetaLength);
    const circleGeometry = new CircleGeometry();
    circleGeometry.vertices = geometry.vertices;
    circleGeometry.indices = geometry.indices;
    circleGeometry.normals = geometry.normals;
    circleGeometry.uvs = geometry.uvs;
    circleGeometry.tangents = geometry.tangents;
    return circleGeometry;
  }

  static createArc(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2): CircleGeometry {
    const geometry = CircleGeometryJS.CircleGeometry.createArc(radius, segments, thetaStart, thetaLength);
    const circleGeometry = new CircleGeometry();
    circleGeometry.vertices = geometry.vertices;
    circleGeometry.indices = geometry.indices;
    circleGeometry.normals = geometry.normals;
    circleGeometry.uvs = geometry.uvs;
    circleGeometry.tangents = geometry.tangents;
    return circleGeometry;
  }

  static createEllipse(radiusX = 1, radiusY = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2): CircleGeometry {
    const geometry = CircleGeometryJS.CircleGeometry.createEllipse(radiusX, radiusY, segments, thetaStart, thetaLength);
    const circleGeometry = new CircleGeometry();
    circleGeometry.vertices = geometry.vertices;
    circleGeometry.indices = geometry.indices;
    circleGeometry.normals = geometry.normals;
    circleGeometry.uvs = geometry.uvs;
    circleGeometry.tangents = geometry.tangents;
    return circleGeometry;
  }

  // Utility methods
  getVertexCount(): number {
    return this.vertices.length / 3;
  }

  getTriangleCount(): number {
    return this.indices.length / 3;
  }

  getRadius(): number {
    if (this.vertices.length >= 6) {
      return Math.sqrt(this.vertices[3] * this.vertices[3] + this.vertices[4] * this.vertices[4]);
    }
    return 0;
  }

  isComplete(): boolean {
    return Math.abs(this.getThetaLength() - Math.PI * 2) < 0.01;
  }

  getThetaLength(): number {
    if (this.vertices.length < 6) return 0;
    
    const firstX = this.vertices[3];
    const firstY = this.vertices[4];
    const lastX = this.vertices[this.vertices.length - 3];
    const lastY = this.vertices[this.vertices.length - 2];
    
    const firstAngle = Math.atan2(firstY, firstX);
    const lastAngle = Math.atan2(lastY, lastX);
    
    let angle = lastAngle - firstAngle;
    if (angle < 0) angle += Math.PI * 2;
    return angle;
  }
}

// Factory function to create geometries with common parameters
export function createGeometry(type: string, params: GeometryParams = {}): MeshGeometry {
  switch (type.toLowerCase()) {
    case 'box':
      return new BoxGeometry(params.width || 1, params.height || 1, params.depth || 1, 
                            params.widthSegments || 1, params.heightSegments || 1, params.depthSegments || 1);
    
    case 'sphere':
      return new SphereGeometry(params.radius || 1, params.widthSegments || 32, params.heightSegments || 16);
    
    case 'plane':
      return new PlaneGeometry(params.width || 1, params.height || 1, 
                              params.widthSegments || 1, params.heightSegments || 1);
    
    case 'cylinder':
      return new CylinderGeometry(params.radiusTop || 1, params.radiusBottom || 1, params.height || 1,
                                 params.radialSegments || 8, params.heightSegments || 1, params.openEnded || false);
    
    case 'cone':
      return new ConeGeometry(params.radius || 1, params.height || 1,
                            params.radialSegments || 8, params.heightSegments || 1, params.openEnded || false);
    
    case 'circle':
      return new CircleGeometry(params.radius || 1, params.segments || 32, 
                               params.thetaStart || 0, params.thetaLength || Math.PI * 2);
    
    default:
      throw new Error(`Unknown geometry type: ${type}`);
  }
}

// Geometry metadata and statistics
export interface GeometryInfo {
  type: string;
  vertexCount: number;
  triangleCount: number;
  hasTangents: boolean;
  indexType: 'Uint16Array' | 'Uint32Array' | 'none';
  memoryUsage: number; // bytes
}

export function getGeometryInfo(geometry: MeshGeometry): GeometryInfo {
  const vertexCount = geometry.vertices.length / 3;
  const triangleCount = geometry.indices ? geometry.indices.length / 3 : 0;
  const hasTangents = 'tangents' in geometry && geometry.tangents !== undefined;
  
  let indexType: 'Uint16Array' | 'Uint32Array' | 'none' = 'none';
  if (geometry.indices) {
    if (geometry.indices instanceof Uint16Array) {
      indexType = 'Uint16Array';
    } else if (geometry.indices instanceof Uint32Array) {
      indexType = 'Uint32Array';
    }
  }
  
  const memoryUsage = 
    geometry.vertices.byteLength +
    (geometry.indices ? geometry.indices.byteLength : 0) +
    (geometry.normals ? geometry.normals.byteLength : 0) +
    (geometry.uvs ? geometry.uvs.byteLength : 0) +
    (geometry.tangents ? geometry.tangents.byteLength : 0);
  
  return {
    type: geometry.constructor.name,
    vertexCount,
    triangleCount,
    hasTangents,
    indexType,
    memoryUsage
  };
}