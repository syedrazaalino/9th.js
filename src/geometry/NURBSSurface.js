/**
 * NURBSSurface.js
 * Comprehensive NURBS surface generation with control point handling,
 * knot vector management, evaluation, derivatives, and tessellation
 */

import { BufferGeometry } from '../core/BufferGeometry.js';
import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Matrix4 } from '../core/math/Matrix4.js';

export class NURBSSurface {
  constructor(controlPoints, uKnots = null, vKnots = null, uDegree = 3, vDegree = 3, weights = null) {
    this.controlPoints = this._processControlPoints(controlPoints);
    this.uDegree = uDegree;
    this.vDegree = vDegree;
    this.uKnots = uKnots || this._generateUniformKnots(this.controlPoints[0].length, uDegree);
    this.vKnots = vKnots || this._generateUniformKnots(this.controlPoints.length, vDegree);
    this.weights = weights || this._generateUniformWeights(this.controlPoints);
    
    this.isRational = this.weights.some(row => row.some(w => w !== 1));
    this.cache = new Map();
    this._validateSurface();
    this._updateBoundingBox();
  }

  // Process and validate control points
  _processControlPoints(controlPoints) {
    if (!Array.isArray(controlPoints) || controlPoints.length === 0) {
      throw new Error('Control points must be a non-empty 2D array');
    }
    
    const processed = controlPoints.map(row => 
      row.map(point => point.clone ? point.clone() : new Vector3(...point))
    );
    
    // Check for consistent dimensions
    const rows = processed.length;
    const cols = processed[0].length;
    
    for (let i = 0; i < rows; i++) {
      if (processed[i].length !== cols) {
        throw new Error('Control points matrix must be rectangular');
      }
    }
    
    return processed;
  }

  // Generate uniform knot vectors
  _generateUniformKnots(numPoints, degree) {
    const numKnots = numPoints + degree + 1;
    const knots = [];
    
    for (let i = 0; i < numKnots; i++) {
      if (i <= degree) {
        knots.push(0);
      } else if (i >= numKnots - degree - 1) {
        knots.push(1);
      } else {
        knots.push((i - degree) / (numKnots - 2 * degree - 1));
      }
    }
    
    return knots;
  }

  // Generate uniform weights
  _generateUniformWeights(controlPoints) {
    return controlPoints.map(row => new Array(row.length).fill(1));
  }

  // Validate surface consistency
  _validateSurface() {
    const uSize = this.controlPoints[0].length;
    const vSize = this.controlPoints.length;
    
    if (uSize < this.uDegree + 1) {
      throw new Error(`Not enough control points in u direction: ${uSize} < ${this.uDegree + 1}`);
    }
    
    if (vSize < this.vDegree + 1) {
      throw new Error(`Not enough control points in v direction: ${vSize} < ${this.vDegree + 1}`);
    }
    
    if (this.uKnots.length !== uSize + this.uDegree + 1) {
      throw new Error(`Invalid u knot vector length: ${this.uKnots.length} != ${uSize + this.uDegree + 1}`);
    }
    
    if (this.vKnots.length !== vSize + this.vDegree + 1) {
      throw new Error(`Invalid v knot vector length: ${this.vKnots.length} != ${vSize + this.vDegree + 1}`);
    }
  }

  // Main evaluation method
  evaluate(u, v, derivatives = 0) {
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      throw new Error('Parameters u and v must be between 0 and 1');
    }
    
    const cacheKey = `${u.toFixed(6)}_${v.toFixed(6)}_${derivatives}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;
    if (derivatives === 0) {
      result = this._evaluateSurface(u, v);
    } else {
      result = this._evaluateSurfaceWithDerivatives(u, v, derivatives);
    }
    
    this.cache.set(cacheKey, result);
    return result;
  }

  // Surface evaluation without derivatives
  _evaluateSurface(u, v) {
    const uSpan = this._findKnotSpan(u, this.uKnots, this.controlPoints[0].length);
    const vSpan = this._findKnotSpan(v, this.vKnots, this.controlPoints.length);
    
    let result = new Vector3(0, 0, 0);
    let weightSum = 0;
    
    // Calculate basis functions
    const uBasis = this._computeBasisFunctions(u, uSpan, this.uDegree, this.uKnots);
    const vBasis = this._computeBasisFunctions(v, vSpan, this.vDegree, this.vKnots);
    
    if (this.isRational) {
      // Rational B-spline evaluation
      for (let i = 0; i <= this.uDegree; i++) {
        for (let j = 0; j <= this.vDegree; j++) {
          const weight = this.weights[vSpan - this.vDegree + j][uSpan - this.uDegree + i];
          const w = weight * uBasis[i] * vBasis[j];
          
          const controlPoint = this.controlPoints[vSpan - this.vDegree + j][uSpan - this.uDegree + i];
          result = result.add(controlPoint.clone().multiplyScalar(w));
          weightSum += w;
        }
      }
      
      return result.divideScalar(weightSum);
    } else {
      // Non-rational B-spline evaluation
      for (let i = 0; i <= this.uDegree; i++) {
        for (let j = 0; j <= this.vDegree; j++) {
          const controlPoint = this.controlPoints[vSpan - this.vDegree + j][uSpan - this.uDegree + i];
          result = result.add(controlPoint.clone().multiplyScalar(uBasis[i] * vBasis[j]));
        }
      }
      
      return result;
    }
  }

  // Surface evaluation with derivatives
  _evaluateSurfaceWithDerivatives(u, v, maxDeriv) {
    const result = {};
    
    const uSpan = this._findKnotSpan(u, this.uKnots, this.controlPoints[0].length);
    const vSpan = this._findKnotSpan(v, this.vKnots, this.controlPoints.length);
    
    // Compute basis functions and their derivatives
    const uBasis = this._computeBasisFunctions(u, uSpan, this.uDegree, this.uKnots);
    const vBasis = this._computeBasisFunctions(v, vSpan, this.vDegree, this.vKnots);
    
    const uBasisDers = this._computeBasisFunctionDerivatives(u, uSpan, this.uDegree, maxDeriv, this.uKnots);
    const vBasisDers = this._computeBasisFunctionDerivatives(v, vSpan, this.vDegree, maxDeriv, this.vKnots);
    
    // Compute derivatives up to specified order
    for (let k = 0; k <= maxDeriv; k++) {
      for (let l = 0; l <= maxDeriv - k; l++) {
        let derivative = new Vector3(0, 0, 0);
        
        if (this.isRational) {
          // Rational surface derivatives (simplified)
          derivative = this._computeRationalDerivative(uSpan, vSpan, k, l, uBasisDers, vBasisDers);
        } else {
          // Non-rational surface derivatives
          for (let i = 0; i <= this.uDegree; i++) {
            for (let j = 0; j <= this.vDegree; j++) {
              const controlPoint = this.controlPoints[vSpan - this.vDegree + j][uSpan - this.uDegree + i];
              const weight = uBasisDers[k][i] * vBasisDers[l][j];
              derivative = derivative.add(controlPoint.clone().multiplyScalar(weight));
            }
          }
        }
        
        result[`${k}_${l}`] = derivative;
      }
    }
    
    return result;
  }

  _computeRationalDerivative(uSpan, vSpan, uDeriv, vDeriv, uBasisDers, vBasisDers) {
    // Simplified rational derivative computation
    let numerator = new Vector3(0, 0, 0);
    let denominator = 0;
    
    for (let i = 0; i <= this.uDegree; i++) {
      for (let j = 0; j <= this.vDegree; j++) {
        const controlPoint = this.controlPoints[vSpan - this.vDegree + j][uSpan - this.uDegree + i];
        const weight = this.weights[vSpan - this.vDegree + j][uSpan - this.uDegree + i];
        const basisWeight = uBasisDers[uDeriv][i] * vBasisDers[vDeriv][j];
        
        numerator = numerator.add(controlPoint.clone().multiplyScalar(weight * basisWeight));
        denominator += weight * basisWeight;
      }
    }
    
    return denominator > 1e-10 ? numerator.divideScalar(denominator) : numerator;
  }

  // Knot span finding
  _findKnotSpan(u, knots, numPoints) {
    const n = numPoints - 1;
    
    if (u >= knots[n + 1]) {
      return n;
    }
    
    let low = this.uDegree;
    let high = n + 1;
    let mid = Math.floor((low + high) / 2);
    
    while (u < knots[mid] || u >= knots[mid + 1]) {
      if (u < knots[mid]) {
        high = mid;
      } else {
        low = mid;
      }
      mid = Math.floor((low + high) / 2);
    }
    
    return mid;
  }

  // Basis function computation
  _computeBasisFunctions(u, span, degree, knots) {
    const basis = new Array(degree + 1).fill(0);
    const left = new Array(degree + 1).fill(0);
    const right = new Array(degree + 1).fill(0);
    
    basis[0] = 1;
    
    for (let j = 1; j <= degree; j++) {
      left[j] = u - knots[span + 1 - j];
      right[j] = knots[span + j] - u;
      
      let saved = 0;
      for (let r = 0; r < j; r++) {
        const denom = right[r + 1] + left[j - r];
        if (Math.abs(denom) < 1e-10) {
          basis[r] = 0;
        } else {
          const temp = basis[r] / denom;
          basis[r] = saved + right[r + 1] * temp;
          saved = left[j - r] * temp;
        }
      }
      basis[j] = saved;
    }
    
    return basis;
  }

  // Basis function derivative computation
  _computeBasisFunctionDerivatives(u, span, degree, derivs, knots) {
    const ders = [];
    for (let i = 0; i <= derivs; i++) {
      ders[i] = new Array(degree + 1).fill(0);
    }
    
    const ndu = [];
    for (let i = 0; i <= degree; i++) {
      ndu[i] = new Array(degree + 1).fill(0);
    }
    
    const a = [];
    for (let i = 0; i <= degree; i++) {
      a[i] = new Array(degree + 1).fill(0);
    }
    
    // Compute basis functions
    ndu[0][0] = 1;
    
    for (let j = 1; j <= degree; j++) {
      let left = 0;
      let right = 0;
      
      for (let r = 0; r < j; r++) {
        ndu[j][r] = Math.min(u - knots[span + 1 - r], knots[span + r] - u) / 
                    Math.max(1e-10, knots[span + r] - knots[span + 1 - r]);
      }
      
      for (let r = 0; r < j; r++) {
        const temp = ndu[j][r];
        for (let s = 0; s <= degree - r - 1; s++) {
          if (s === 0) {
            ndu[j][r] = temp * (knots[span + degree - r] - knots[span + s]);
          } else {
            ndu[j][s] = temp * (knots[span + degree - r] - knots[span + s]) + 
                       ndu[j][s + 1] * (knots[span + s + degree - r] - knots[span + s]);
          }
        }
      }
    }
    
    // Compute derivatives
    ders[0][0] = 1;
    
    for (let k = 1; k <= derivs; k++) {
      for (let j = 1; j <= degree; j++) {
        a[k][j] = 0;
        for (let r = 0; r <= j; r++) {
          if (knots[span + j - r] !== knots[span + j - r + k]) {
            a[k][j] += r * ndu[j][r] / (knots[span + j - r + k] - knots[span + j - r]);
          }
        }
      }
      
      for (let j = 1; j <= degree; j++) {
        for (let k2 = 1; k2 <= derivs; k2++) {
          let temp = 0;
          for (let r = 1; r <= j; r++) {
            temp += a[k2 - 1][r] * ndu[j][r] * j / k2;
          }
          a[k2][j] = temp;
        }
      }
      
      for (let j = 1; j <= degree; j++) {
        let temp = 0;
        for (let k2 = 1; k2 <= derivs; k2++) {
          temp += a[k2][j] * ndu[j][j];
        }
        ders[k2 - 1][j] = temp;
      }
    }
    
    return ders;
  }

  // Surface normal computation
  computeNormal(u, v) {
    const derivatives = this.evaluate(u, v, 1);
    
    const Su = derivatives['1_0']; // ∂S/∂u
    const Sv = derivatives['0_1']; // ∂S/∂v
    
    const normal = Su.cross(Sv).normalize();
    
    if (normal.length() === 0) {
      return new Vector3(0, 1, 0); // Fallback normal
    }
    
    return normal;
  }

  // Tessellation to BufferGeometry
  tessellate(uSegments = 20, vSegments = 20) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    const uStep = 1 / uSegments;
    const vStep = 1 / vSegments;
    
    // Generate vertices
    for (let j = 0; j <= vSegments; j++) {
      const v = j * vStep;
      
      for (let i = 0; i <= uSegments; i++) {
        const u = i * uStep;
        
        const point = this.evaluate(u, v, 0);
        const normal = this.computeNormal(u, v);
        
        vertices.push(point.x, point.y, point.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(u, v);
      }
    }
    
    // Generate indices
    for (let j = 0; j < vSegments; j++) {
      for (let i = 0; i < uSegments; i++) {
        const a = j * (uSegments + 1) + i;
        const b = a + uSegments + 1;
        const c = b + 1;
        const d = a + 1;
        
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

  // Adaptive tessellation
  tessellateAdaptive(maxError = 0.01, maxSegments = 100) {
    const quads = [];
    
    // Start with coarse tessellation
    this._subdivideSurfaceQuad(0, 1, 0, 1, quads, maxError);
    
    // Limit number of segments
    if (quads.length > maxSegments * maxSegments) {
      const factor = Math.sqrt(quads.length / (maxSegments * maxSegments));
      this._mergeSurfaceQuads(quads, factor);
    }
    
    return this._geometryFromSurfaceQuads(quads);
  }

  _subdivideSurfaceQuad(u1, u2, v1, v2, quads, maxError) {
    const uMid = (u1 + u2) / 2;
    const vMid = (v1 + v2) / 2;
    
    if (this._needsSurfaceSubdivision(u1, u2, v1, v2, maxError)) {
      if (Math.abs(u2 - u1) < 0.001 && Math.abs(v2 - v1) < 0.001) {
        quads.push([u1, u2, v1, v2]);
      } else {
        this._subdivideSurfaceQuad(u1, uMid, v1, vMid, quads, maxError);
        this._subdivideSurfaceQuad(uMid, u2, v1, vMid, quads, maxError);
        this._subdivideSurfaceQuad(u1, uMid, vMid, v2, quads, maxError);
        this._subdivideSurfaceQuad(uMid, u2, vMid, v2, quads, maxError);
      }
    } else {
      quads.push([u1, u2, v1, v2]);
    }
  }

  _needsSurfaceSubdivision(u1, u2, v1, v2, maxError) {
    const corners = [
      [u1, v1], [u1, v2], [u2, v1], [u2, v2],
      [(u1 + u2) / 2, (v1 + v2) / 2]
    ];
    
    let maxCurvature = 0;
    for (const [u, v] of corners) {
      try {
        const derivatives = this.evaluate(u, v, 2);
        const Su = derivatives['1_0'];
        const Sv = derivatives['0_1'];
        const Suu = derivatives['2_0'];
        const Suv = derivatives['1_1'];
        const Svv = derivatives['0_2'];
        
        const normal = Su.cross(Sv).normalize();
        
        const K = (Suu.dot(normal) * Svv.dot(normal) - Math.pow(Suv.dot(normal), 2)) /
                  Math.pow(Su.cross(Sv).length(), 2);
        
        maxCurvature = Math.max(maxCurvature, Math.abs(K));
      } catch (e) {
        maxCurvature = maxError * 2;
      }
    }
    
    return maxCurvature > maxError;
  }

  _mergeSurfaceQuads(quads, factor) {
    const threshold = 1 / factor;
    const merged = [];
    
    for (const quad of quads) {
      const uCenter = (quad[0] + quad[1]) / 2;
      const vCenter = (quad[2] + quad[3]) / 2;
      
      try {
        const derivatives = this.evaluate(uCenter, vCenter, 2);
        const Su = derivatives['1_0'];
        const Sv = derivatives['0_1'];
        
        const K = this._computeGaussianCurvature(Su, Sv, derivatives);
        
        if (Math.abs(K) < threshold) {
          merged.push(quad);
        }
      } catch (e) {
        merged.push(quad);
      }
    }
    
    return merged.length > 0 ? merged : quads;
  }

  _computeGaussianCurvature(Su, Sv, derivatives) {
    const Suu = derivatives['2_0'];
    const Suv = derivatives['1_1'];
    const Svv = derivatives['0_2'];
    
    const normal = Su.cross(Sv).normalize();
    
    return (Suu.dot(normal) * Svv.dot(normal) - Math.pow(Suv.dot(normal), 2)) /
           Math.pow(Su.cross(Sv).length(), 2);
  }

  _geometryFromSurfaceQuads(quads) {
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
          uvs.push(u, v);
          
          vertexMap.set(key, vertexIndex++);
        }
        
        quadVertices.push(vertexMap.get(key));
      }
      
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

  // Surface trimming
  trim(uTrims = [], vTrims = []) {
    if (uTrims.length === 0 && vTrims.length === 0) {
      return this; // No trimming
    }
    
    const uRange = uTrims.length > 0 ? uTrims : [0, 1];
    const vRange = vTrims.length > 0 ? vTrims : [0, 1];
    
    // Create trimmed surface (simplified implementation)
    return new NURBSTrimmedSurface(this, uRange, vRange);
  }

  // Surface manipulation
  insertKnot(direction = 'u', knot = 0.5, multiplicity = 1) {
    const newControlPoints = this._deepCloneControlPoints();
    const newKnots = [...this[direction + 'Knots']];
    const newWeights = this.weights ? this._deepCloneWeights() : null;
    
    if (direction === 'u') {
      const span = this._findKnotSpan(knot, this.uKnots, this.controlPoints[0].length);
      this._insertKnotInDirection(newControlPoints, newKnots, newWeights, span, knot, multiplicity, 'u');
    } else {
      const span = this._findKnotSpan(knot, this.vKnots, this.controlPoints.length);
      this._insertKnotInDirection(newControlPoints, newKnots, newWeights, span, knot, multiplicity, 'v');
    }
    
    return new NURBSSurface(newControlPoints, 
                           direction === 'u' ? newKnots : this.uKnots,
                           direction === 'v' ? newKnots : this.vKnots,
                           this.uDegree, this.vDegree, newWeights);
  }

  _insertKnotInDirection(controlPoints, knots, weights, span, knot, multiplicity, direction) {
    const degree = direction === 'u' ? this.uDegree : this.vDegree;
    const numPoints = direction === 'u' ? this.controlPoints[0].length : this.controlPoints.length;
    
    // Insert knot multiple times
    for (let mult = 0; mult < multiplicity; mult++) {
      // Find the insertion index
      let insertIndex = span - degree + 1;
      while (insertIndex < knots.length && knots[insertIndex] <= knot) {
        insertIndex++;
      }
      
      // Insert knot
      knots.splice(insertIndex, 0, knot);
      
      // Compute new control points
      if (direction === 'u') {
        const newRow = [];
        for (let i = 0; i < this.controlPoints.length; i++) {
          const newPoint = new Vector3(0, 0, 0);
          const alpha = (knot - knots[insertIndex - degree]) / 
                       (knots[insertIndex + degree] - knots[insertIndex - degree]);
          
          if (insertIndex > span - degree + 1 && insertIndex - 1 <= span) {
            const p1 = controlPoints[i][insertIndex - degree];
            const p2 = controlPoints[i][insertIndex - degree + 1];
            newPoint.copy(p1.clone().multiplyScalar(1 - alpha).add(p2.clone().multiplyScalar(alpha)));
          } else {
            newPoint.copy(controlPoints[i][insertIndex - degree]);
          }
          
          newRow.push(newPoint);
        }
        
        // Insert new column
        for (let i = 0; i < this.controlPoints.length; i++) {
          controlPoints[i].splice(insertIndex - degree, 0, newRow[i]);
        }
      } else {
        const newPoint = new Vector3(0, 0, 0);
        const alpha = (knot - knots[insertIndex - degree]) / 
                     (knots[insertIndex + degree] - knots[insertIndex - degree]);
        
        if (insertIndex > span - degree + 1 && insertIndex - 1 <= span) {
          const p1 = controlPoints[insertIndex - degree];
          const p2 = controlPoints[insertIndex - degree + 1];
          newPoint.copy(p1.clone().multiplyScalar(1 - alpha).add(p2.clone().multiplyScalar(alpha)));
        } else {
          newPoint.copy(controlPoints[insertIndex - degree]);
        }
        
        controlPoints.splice(insertIndex - degree, 0, newPoint);
      }
    }
  }

  // Surface transformation
  transform(matrix) {
    const newControlPoints = this._deepCloneControlPoints();
    
    for (let i = 0; i < newControlPoints.length; i++) {
      for (let j = 0; j < newControlPoints[i].length; j++) {
        newControlPoints[i][j] = newControlPoints[i][j].applyMatrix4(matrix);
      }
    }
    
    return new NURBSSurface(newControlPoints, 
                           [...this.uKnots], 
                           [...this.vKnots],
                           this.uDegree, 
                           this.vDegree, 
                           this.weights ? this._deepCloneWeights() : null);
  }

  // Utility methods
  _deepCloneControlPoints() {
    return this.controlPoints.map(row => row.map(point => point.clone()));
  }

  _deepCloneWeights() {
    return this.weights.map(row => [...row]);
  }

  getBoundingBox() {
    return this.boundingBox;
  }

  _updateBoundingBox() {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let i = 0; i < this.controlPoints.length; i++) {
      for (let j = 0; j < this.controlPoints[i].length; j++) {
        const point = this.controlPoints[i][j];
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        minZ = Math.min(minZ, point.z);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
        maxZ = Math.max(maxZ, point.z);
      }
    }

    this.boundingBox = {
      min: new Vector3(minX, minY, minZ),
      max: new Vector3(maxX, maxY, maxZ)
    };
  }

  // Predefined NURBS surfaces
  static createPlane(width = 1, height = 1, uSegments = 2, vSegments = 2) {
    const controlPoints = [];
    const uCount = uSegments + 1;
    const vCount = vSegments + 1;
    
    for (let v = 0; v < vCount; v++) {
      const row = [];
      for (let u = 0; u < uCount; u++) {
        const x = (u / uSegments - 0.5) * width;
        const y = (v / vSegments - 0.5) * height;
        row.push(new Vector3(x, y, 0));
      }
      controlPoints.push(row);
    }
    
    return new NURBSSurface(controlPoints, null, null, 1, 1);
  }

  static createSphere(radius = 1, uSegments = 8, vSegments = 6) {
    const controlPoints = [];
    const uCount = uSegments + 1;
    const vCount = vSegments + 1;
    
    for (let v = 0; v < vCount; v++) {
      const row = [];
      const phi = (v / vSegments) * Math.PI; // 0 to π
      
      for (let u = 0; u < uCount; u++) {
        const theta = (u / uSegments) * 2 * Math.PI; // 0 to 2π
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        row.push(new Vector3(x, y, z));
      }
      controlPoints.push(row);
    }
    
    return new NURBSSurface(controlPoints);
  }

  static createTorus(R = 2, r = 1, uSegments = 8, vSegments = 8) {
    const controlPoints = [];
    const uCount = uSegments + 1;
    const vCount = vSegments + 1;
    
    for (let v = 0; v < vCount; v++) {
      const row = [];
      const phi = (v / vSegments) * 2 * Math.PI;
      
      for (let u = 0; u < uCount; u++) {
        const theta = (u / uSegments) * 2 * Math.PI;
        
        const x = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y = r * Math.sin(phi);
        const z = (R + r * Math.cos(phi)) * Math.sin(theta);
        
        row.push(new Vector3(x, y, z));
      }
      controlPoints.push(row);
    }
    
    return new NURBSSurface(controlPoints);
  }

  toJSON() {
    return {
      controlPoints: this.controlPoints.map(row => row.map(p => [p.x, p.y, p.z])),
      uKnots: this.uKnots,
      vKnots: this.vKnots,
      uDegree: this.uDegree,
      vDegree: this.vDegree,
      weights: this.weights,
      isRational: this.isRational
    };
  }

  static fromJSON(data) {
    const controlPoints = data.controlPoints.map(row => 
      row.map(p => new Vector3(p[0], p[1], p[2]))
    );
    
    return new NURBSSurface(controlPoints, data.uKnots, data.vKnots, 
                           data.uDegree, data.vDegree, data.weights);
  }

  clone() {
    return new NURBSSurface(this._deepCloneControlPoints(),
                           [...this.uKnots],
                           [...this.vKnots],
                           this.uDegree,
                           this.vDegree,
                           this.weights ? this._deepCloneWeights() : null);
  }
}

// Trimmed NURBS surface wrapper
class NURBSTrimmedSurface extends NURBSSurface {
  constructor(baseSurface, uRange, vRange) {
    super(baseSurface.controlPoints, baseSurface.uKnots, baseSurface.vKnots, 
          baseSurface.uDegree, baseSurface.vDegree, baseSurface.weights);
    this.baseSurface = baseSurface;
    this.uRange = uRange;
    this.vRange = vRange;
  }

  evaluate(u, v, derivatives = 0) {
    // Map trimmed coordinates to original
    const uOriginal = this.uRange[0] + u * (this.uRange[1] - this.uRange[0]);
    const vOriginal = this.vRange[0] + v * (this.vRange[1] - this.vRange[0]);
    
    return this.baseSurface.evaluate(uOriginal, vOriginal, derivatives);
  }

  computeNormal(u, v) {
    const uOriginal = this.uRange[0] + u * (this.uRange[1] - this.uRange[0]);
    const vOriginal = this.vRange[0] + v * (this.vRange[1] - this.vRange[0]);
    
    return this.baseSurface.computeNormal(uOriginal, vOriginal);
  }
}
