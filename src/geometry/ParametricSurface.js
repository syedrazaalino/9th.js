/**
 * ParametricSurface.js
 * Comprehensive parametric surface handling with custom surface definitions, 
 * derivatives, and tessellation capabilities
 */

import { BufferGeometry } from '../core/BufferGeometry.js';
import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';

export class ParametricSurface {
  constructor(surfaceFunction, uRange = [0, 1], vRange = [0, 1], options = {}) {
    this.surfaceFunction = surfaceFunction;
    this.uRange = uRange;
    this.vRange = vRange;
    this.uSegments = options.uSegments || 20;
    this.vSegments = options.vSegments || 20;
    this.options = options;
    this.cache = new Map();
    
    this._precomputeIfNeeded();
    this._updateBoundingBox();
  }

  // Main evaluation method
  evaluate(u, v, derivatives = 0) {
    if (u < this.uRange[0] || u > this.uRange[1] || 
        v < this.vRange[0] || v > this.vRange[1]) {
      throw new Error('Parameters u and v must be within their ranges');
    }
    
    const cacheKey = `${u.toFixed(6)}_${v.toFixed(6)}_${derivatives}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = this.surfaceFunction(u, v, derivatives);
    
    this.cache.set(cacheKey, result);
    return result;
  }

  // Partial derivative calculations
  computePartialDerivatives(u, v, maxOrder = 2) {
    const derivatives = {};
    
    // Zero-th order (position)
    derivatives[0] = derivatives[0] || {};
    derivatives[0][0] = this.evaluate(u, v, 0);
    
    // First order derivatives
    for (let order = 1; order <= maxOrder; order++) {
      derivatives[order] = derivatives[order] || {};
      
      for (let i = 0; i <= order; i++) {
        const j = order - i;
        derivatives[i] = derivatives[i] || {};
        
        // Compute mixed partial derivative S_uv^i^j
        derivatives[i][j] = this._computeMixedDerivative(u, v, i, j);
      }
    }
    
    return derivatives;
  }

  _computeMixedDerivative(u, v, uOrder, vOrder) {
    const epsilon = 0.001;
    const du = epsilon * (this.uRange[1] - this.uRange[0]);
    const dv = epsilon * (this.vRange[1] - this.vRange[0]);
    
    let result = 0;
    
    // Finite difference approximation for mixed derivatives
    for (let i = 0; i <= uOrder; i++) {
      for (let j = 0; j <= vOrder; j++) {
        const sign = ((i + j) % 2 === 0) ? 1 : -1;
        const coefficient = this._binomial(uOrder, i) * this._binomial(vOrder, j);
        
        const uOffset = (uOrder - 2 * i) * du;
        const vOffset = (vOrder - 2 * j) * dv;
        
        const point = this.evaluate(
          Math.max(this.uRange[0], Math.min(this.uRange[1], u + uOffset)),
          Math.max(this.vRange[0], Math.min(this.vRange[1], v + vOffset)),
          0
        );
        
        result += sign * coefficient * point;
      }
    }
    
    const scale = Math.pow(du, uOrder) * Math.pow(dv, vOrder);
    return result.multiplyScalar(1 / Math.pow(4, uOrder + vOrder) / scale);
  }

  // Surface normal calculation
  computeNormal(u, v) {
    const derivatives = this.computePartialDerivatives(u, v, 1);
    
    const Su = derivatives[1][0]; // ∂S/∂u
    const Sv = derivatives[0][1]; // ∂S/∂v
    
    const normal = Su.cross(Sv).normalize();
    
    if (normal.length() === 0) {
      // Handle degenerate case - use fallback normal
      return new Vector3(0, 1, 0);
    }
    
    return normal;
  }

  // Tangent space calculation
  computeTangentSpace(u, v) {
    const point = this.evaluate(u, v, 0);
    const normal = this.computeNormal(u, v);
    
    const derivatives = this.computePartialDerivatives(u, v, 1);
    const Su = derivatives[1][0];
    const Sv = derivatives[0][1];
    
    // Create orthonormal basis
    let tangentU = Su.normalize();
    if (tangentU.length() === 0) {
      tangentU = new Vector3(1, 0, 0);
    }
    
    const tangentV = normal.clone().cross(tangentU).normalize();
    tangentU = tangentV.clone().cross(normal).normalize();
    
    return {
      position: point,
      normal: normal,
      tangentU: tangentU,
      tangentV: tangentV
    };
  }

  // Principal curvature calculation
  computeCurvatures(u, v) {
    const derivatives = this.computePartialDerivatives(u, v, 2);
    
    const S = derivatives[0][0];
    const Su = derivatives[1][0];
    const Sv = derivatives[0][1];
    const Suu = derivatives[2][0];
    const Suv = derivatives[1][1];
    const Svv = derivatives[0][2];
    
    const normal = Su.cross(Sv).normalize();
    
    // First fundamental form
    const E = Su.dot(Su);
    const F = Su.dot(Sv);
    const G = Sv.dot(Sv);
    
    // Second fundamental form
    const e = Suu.dot(normal);
    const f = Suv.dot(normal);
    const g = Svv.dot(normal);
    
    // Gaussian curvature
    const det1 = E * G - F * F;
    const K = det1 > 1e-10 ? (e * g - f * f) / det1 : 0;
    
    // Mean curvature
    const H = det1 > 1e-10 ? (e * G - 2 * f * F + g * E) / (2 * det1) : 0;
    
    // Principal curvatures
    const discriminant = H * H - K;
    const k1 = H + Math.sqrt(Math.max(0, discriminant));
    const k2 = H - Math.sqrt(Math.max(0, discriminant));
    
    return {
      K: K,      // Gaussian curvature
      H: H,      // Mean curvature
      k1: k1,    // Principal curvature 1
      k2: k2,    // Principal curvature 2
      normal: normal
    };
  }

  // Tessellation to BufferGeometry
  tessellate(uSegments = null, vSegments = null) {
    const uSeg = uSegments || this.uSegments;
    const vSeg = vSegments || this.vSegments;
    
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    const uStep = (this.uRange[1] - this.uRange[0]) / uSeg;
    const vStep = (this.vRange[1] - this.vRange[0]) / vSeg;
    
    // Generate vertices
    for (let j = 0; j <= vSeg; j++) {
      const v = this.vRange[0] + j * vStep;
      
      for (let i = 0; i <= uSeg; i++) {
        const u = this.uRange[0] + i * uStep;
        
        const point = this.evaluate(u, v, 0);
        const normal = this.computeNormal(u, v);
        
        vertices.push(point.x, point.y, point.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push((u - this.uRange[0]) / (this.uRange[1] - this.uRange[0]),
                 (v - this.vRange[0]) / (this.vRange[1] - this.vRange[0]));
      }
    }
    
    // Generate indices
    for (let j = 0; j < vSeg; j++) {
      for (let i = 0; i < uSeg; i++) {
        const a = j * (uSeg + 1) + i;
        const b = a + uSeg + 1;
        const c = b + 1;
        const d = a + 1;
        
        // Two triangles per quad
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }
    
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32Array(vertices));
    geometry.setAttribute('normal', new Float32Array(normals));
    geometry.setAttribute('uv', new Float32Array(uvs));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Adaptive tessellation based on curvature
  tessellateAdaptive(maxError = 0.01, maxSegments = 100) {
    const quads = [];
    
    // Start with coarse tessellation
    this._subdivideQuad(this.uRange[0], this.uRange[1], this.vRange[0], this.vRange[1], quads, maxError);
    
    // Limit number of segments
    if (quads.length > maxSegments * maxSegments) {
      const factor = Math.sqrt(quads.length / (maxSegments * maxSegments));
      this._mergeQuads(quads, factor);
    }
    
    // Generate geometry from quads
    return this._geometryFromQuads(quads);
  }

  _subdivideQuad(u1, u2, v1, v2, quads, maxError) {
    const uMid = (u1 + u2) / 2;
    const vMid = (v1 + v2) / 2;
    
    // Check if this quad needs subdivision
    if (this._needsSubdivision(u1, u2, v1, v2, maxError)) {
      if (Math.abs(u2 - u1) < 0.001 && Math.abs(v2 - v1) < 0.001) {
        // Minimum size reached
        quads.push([u1, u2, v1, v2]);
      } else {
        // Subdivide into 4 quads
        const u1New = (u1 + uMid) / 2;
        const u2New = (uMid + u2) / 2;
        const v1New = (v1 + vMid) / 2;
        const v2New = (vMid + v2) / 2;
        
        this._subdivideQuad(u1, uMid, v1, vMid, quads, maxError);
        this._subdivideQuad(uMid, u2, v1, vMid, quads, maxError);
        this._subdivideQuad(u1, uMid, vMid, v2, quads, maxError);
        this._subdivideQuad(uMid, u2, vMid, v2, quads, maxError);
      }
    } else {
      quads.push([u1, u2, v1, v2]);
    }
  }

  _needsSubdivision(u1, u2, v1, v2, maxError) {
    // Test curvature at center and corners
    const uCenter = (u1 + u2) / 2;
    const vCenter = (v1 + v2) / 2;
    
    const corners = [
      [u1, v1], [u1, v2], [u2, v1], [u2, v2],
      [uCenter, vCenter]
    ];
    
    let maxCurvature = 0;
    for (const [u, v] of corners) {
      try {
        const curvatures = this.computeCurvatures(u, v);
        maxCurvature = Math.max(maxCurvature, Math.abs(curvatures.K), Math.abs(curvatures.H));
      } catch (e) {
        // Handle evaluation errors
        maxCurvature = maxError * 2;
      }
    }
    
    return maxCurvature > maxError;
  }

  _mergeQuads(quads, factor) {
    // Simple quad merging based on curvature threshold
    const threshold = 1 / factor;
    const merged = [];
    
    for (const quad of quads) {
      const uCenter = (quad[0] + quad[1]) / 2;
      const vCenter = (quad[2] + quad[3]) / 2;
      
      try {
        const curvatures = this.computeCurvatures(uCenter, vCenter);
        if (Math.abs(curvatures.K) < threshold && Math.abs(curvatures.H) < threshold) {
          merged.push(quad);
        }
      } catch (e) {
        merged.push(quad);
      }
    }
    
    return merged.length > 0 ? merged : quads;
  }

  _geometryFromQuads(quads) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    const vertexMap = new Map();
    let vertexIndex = 0;
    
    for (const [u1, u2, v1, v2] of quads) {
      const corners = [
        [u1, v1], [u2, v1], [u2, v2], [u1, v2]
      ];
      
      const quadVertices = [];
      
      for (const [u, v] of corners) {
        const key = `${u.toFixed(6)}_${v.toFixed(6)}`;
        
        if (!vertexMap.has(key)) {
          const point = this.evaluate(u, v, 0);
          const normal = this.computeNormal(u, v);
          
          vertices.push(point.x, point.y, point.z);
          normals.push(normal.x, normal.y, normal.z);
          uvs.push((u - this.uRange[0]) / (this.uRange[1] - this.uRange[0]),
                   (v - this.vRange[0]) / (this.vRange[1] - this.vRange[0]));
          
          vertexMap.set(key, vertexIndex++);
        }
        
        quadVertices.push(vertexMap.get(key));
      }
      
      // Add triangle indices
      indices.push(quadVertices[0], quadVertices[1], quadVertices[3]);
      indices.push(quadVertices[1], quadVertices[2], quadVertices[3]);
    }
    
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32Array(vertices));
    geometry.setAttribute('normal', new Float32Array(normals));
    geometry.setAttribute('uv', new Float32Array(uvs));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Surface area calculation
  computeArea(samples = 100) {
    const uStep = (this.uRange[1] - this.uRange[0]) / samples;
    const vStep = (this.vRange[1] - this.vRange[0]) / samples;
    
    let area = 0;
    
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < samples; j++) {
        const u = this.uRange[0] + i * uStep;
        const v = this.vRange[0] + j * vStep;
        
        const derivatives = this.computePartialDerivatives(u, v, 1);
        const Su = derivatives[1][0];
        const Sv = derivatives[0][1];
        
        const normal = Su.cross(Sv);
        area += normal.length() * uStep * vStep;
      }
    }
    
    return area;
  }

  // Volume calculation (for closed surfaces)
  computeVolume(samples = 50) {
    const uStep = (this.uRange[1] - this.uRange[0]) / samples;
    const vStep = (this.vRange[1] - this.vRange[0]) / samples;
    
    let volume = 0;
    
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < samples; j++) {
        const u = this.uRange[0] + i * uStep;
        const v = this.vRange[0] + j * vStep;
        
        const point = this.evaluate(u, v, 0);
        const normal = this.computeNormal(u, v);
        
        // Shoelace formula for surface volume
        volume += point.dot(normal) * uStep * vStep;
      }
    }
    
    return Math.abs(volume) / 3;
  }

  // Surface intersection
  intersectWithRay(origin, direction, maxDistance = Infinity) {
    const intersections = [];
    const samples = 50; // Coarse sampling for initial detection
    
    const uStep = (this.uRange[1] - this.uRange[0]) / samples;
    const vStep = (this.vRange[1] - this.vRange[0]) / samples;
    
    // Sample surface to find potential intersections
    for (let i = 0; i <= samples; i++) {
      for (let j = 0; j <= samples; j++) {
        const u = this.uRange[0] + i * uStep;
        const v = this.vRange[0] + j * vStep;
        
        const point = this.evaluate(u, v, 0);
        const normal = this.computeNormal(u, v);
        
        // Ray-plane intersection test
        const denom = direction.dot(normal);
        if (Math.abs(denom) > 1e-6) {
          const t = point.subtract(origin).dot(normal) / denom;
          if (t > 0 && t < maxDistance) {
            intersections.push({
              parameter: [u, v],
              point: origin.clone().add(direction.clone().multiplyScalar(t)),
              distance: t,
              normal: normal
            });
          }
        }
      }
    }
    
    return intersections;
  }

  // Surface sampling for path following
  sampleAlongParameter(direction = 'u', samples = 100) {
    const path = [];
    
    if (direction === 'u') {
      for (let i = 0; i <= samples; i++) {
        const u = this.uRange[0] + (this.uRange[1] - this.uRange[0]) * i / samples;
        const v = (this.vRange[0] + this.vRange[1]) / 2;
        
        const point = this.evaluate(u, v, 0);
        const normal = this.computeNormal(u, v);
        
        path.push({
          parameter: [u, v],
          point: point,
          normal: normal,
          tangent: this._computeTangent(u, v, 'u')
        });
      }
    } else {
      for (let i = 0; i <= samples; i++) {
        const v = this.vRange[0] + (this.vRange[1] - this.vRange[0]) * i / samples;
        const u = (this.uRange[0] + this.uRange[1]) / 2;
        
        const point = this.evaluate(u, v, 0);
        const normal = this.computeNormal(u, v);
        
        path.push({
          parameter: [u, v],
          point: point,
          normal: normal,
          tangent: this._computeTangent(u, v, 'v')
        });
      }
    }
    
    return path;
  }

  _computeTangent(u, v, direction) {
    const epsilon = 0.001;
    const du = epsilon * (this.uRange[1] - this.uRange[0]);
    const dv = epsilon * (this.vRange[1] - this.vRange[0]);
    
    let point1, point2;
    
    if (direction === 'u') {
      point1 = this.evaluate(u - du, v, 0);
      point2 = this.evaluate(u + du, v, 0);
    } else {
      point1 = this.evaluate(u, v - dv, 0);
      point2 = this.evaluate(u, v + dv, 0);
    }
    
    return point2.subtract(point1).normalize();
  }

  // Helper methods
  _binomial(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    return this._factorial(n) / (this._factorial(k) * this._factorial(n - k));
  }

  _factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  _precomputeIfNeeded() {
    if (this.options.precompute) {
      const cacheSize = this.uSegments * this.vSegments;
      for (let i = 0; i <= this.uSegments; i++) {
        for (let j = 0; j <= this.vSegments; j++) {
          const u = this.uRange[0] + (this.uRange[1] - this.uRange[0]) * i / this.uSegments;
          const v = this.vRange[0] + (this.vRange[1] - this.vRange[0]) * j / this.vSegments;
          this.evaluate(u, v, 0);
        }
      }
    }
  }

  _updateBoundingBox() {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    const samples = 20;
    const uStep = (this.uRange[1] - this.uRange[0]) / samples;
    const vStep = (this.vRange[1] - this.vRange[0]) / samples;

    for (let i = 0; i <= samples; i++) {
      for (let j = 0; j <= samples; j++) {
        const u = this.uRange[0] + i * uStep;
        const v = this.vRange[0] + j * vStep;
        
        try {
          const point = this.evaluate(u, v, 0);
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          minZ = Math.min(minZ, point.z);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
          maxZ = Math.max(maxZ, point.z);
        } catch (e) {
          // Skip points that can't be evaluated
        }
      }
    }

    if (minX === Infinity) {
      // Fallback bounding box
      this.boundingBox = {
        min: new Vector3(-1, -1, -1),
        max: new Vector3(1, 1, 1)
      };
    } else {
      this.boundingBox = {
        min: new Vector3(minX, minY, minZ),
        max: new Vector3(maxX, maxY, maxZ)
      };
    }
  }

  getBoundingBox() {
    return this.boundingBox;
  }

  // Utility methods
  toJSON() {
    return {
      uRange: this.uRange,
      vRange: this.vRange,
      uSegments: this.uSegments,
      vSegments: this.vSegments,
      options: this.options
    };
  }

  static fromJSON(data) {
    // Note: surface function cannot be serialized
    throw new Error('ParametricSurface with custom function cannot be serialized from JSON');
  }

  clone() {
    return new ParametricSurface(this.surfaceFunction, this.uRange, this.vRange, {
      ...this.options,
      uSegments: this.uSegments,
      vSegments: this.vSegments
    });
  }

  // Predefined parametric surfaces
  static createSphere(radius = 1, uRange = [0, Math.PI], vRange = [0, 2 * Math.PI]) {
    return new ParametricSurface((u, v) => {
      const x = radius * Math.sin(u) * Math.cos(v);
      const y = radius * Math.cos(u);
      const z = radius * Math.sin(u) * Math.sin(v);
      return new Vector3(x, y, z);
    }, uRange, vRange);
  }

  static createTorus(R = 2, r = 1, uRange = [0, 2 * Math.PI], vRange = [0, 2 * Math.PI]) {
    return new ParametricSurface((u, v) => {
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = r * Math.sin(v);
      const z = (R + r * Math.cos(v)) * Math.sin(u);
      return new Vector3(x, y, z);
    }, uRange, vRange);
  }

  static createPlane(width = 1, height = 1, uRange = [-width/2, width/2], vRange = [-height/2, height/2]) {
    return new ParametricSurface((u, v) => {
      return new Vector3(u, v, 0);
    }, uRange, vRange);
  }

  static createCylinder(radius = 1, height = 2, uRange = [0, 2 * Math.PI], vRange = [-height/2, height/2]) {
    return new ParametricSurface((u, v) => {
      const x = radius * Math.cos(u);
      const y = v;
      const z = radius * Math.sin(u);
      return new Vector3(x, y, z);
    }, uRange, vRange);
  }

  static createKleinBottle(uRange = [0, 2 * Math.PI], vRange = [0, 2 * Math.PI]) {
    return new ParametricSurface((u, v) => {
      const x = (Math.cos(u) * (Math.cos(u/2) * Math.cos(v) - Math.sin(u/2) * Math.sin(2*v)));
      const y = (Math.sin(u) * (Math.cos(u/2) * Math.cos(v) - Math.sin(u/2) * Math.sin(2*v)));
      const z = (Math.cos(u/2) * Math.sin(v) + Math.sin(u/2) * Math.cos(2*v));
      return new Vector3(x, y, z);
    }, uRange, vRange);
  }
}
