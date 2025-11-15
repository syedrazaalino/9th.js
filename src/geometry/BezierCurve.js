/**
 * BezierCurve.js
 * Comprehensive Bezier curve handling with evaluation, derivatives, and tessellation
 */

import { BufferGeometry } from '../core/BufferGeometry.js';
import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';

export class BezierCurve {
  constructor(points = [], degree = 3, weights = []) {
    this.points = points.map(p => p.clone ? p.clone() : new Vector3(...p));
    this.degree = Math.min(degree, this.points.length - 1);
    this.weights = weights.length === points.length ? weights : new Array(points.length).fill(1);
    this.isRational = weights.length > 0 && weights.some(w => w !== 1);
    this.cache = new Map();
    this._updateBoundingBox();
  }

  // Evaluation methods
  evaluate(t, derivatives = 0) {
    if (t < 0 || t > 1) throw new Error('Parameter t must be between 0 and 1');
    
    const cacheKey = `${t}_${derivatives}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = this.isRational ? 
      this._evaluateRationalBezier(t, derivatives) : 
      this._evaluatePolynomialBezier(t, derivatives);
    
    this.cache.set(cacheKey, result);
    return result;
  }

  _evaluatePolynomialBezier(t, derivatives) {
    const degree = this.degree;
    const n = degree;
    const points = this.points;

    if (derivatives === 0) {
      // Direct evaluation using Bernstein polynomials
      let result = new Vector3(0, 0, 0);
      for (let i = 0; i <= n; i++) {
        const weight = this._bernstein(i, n, t);
        result = result.add(points[i].multiplyScalar(weight));
      }
      return result;
    } else {
      // Return array of derivatives
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this.evaluate(t, 0));
        } else {
          // Compute k-th derivative
          const derivativePoints = [];
          for (let i = 0; i <= n - k; i++) {
            const diff = points[i + k].subtract(points[i]);
            // Calculate factorial for k terms: n * (n-1) * ... * (n-k+1)
            let factorial = 1;
            for (let i = 0; i < k; i++) {
                factorial *= (n - i);
            }
            derivativePoints.push(diff.multiplyScalar(factorial / this._factorial(k)));
          }
          
          const derivativeCurve = new BezierCurve(derivativePoints, degree - k);
          result.push(derivativeCurve.evaluate(t, 0));
        }
      }
      return result;
    }
  }

  _evaluateRationalBezier(t, derivatives) {
    const degree = this.degree;
    const n = degree;
    const points = this.points;
    const weights = this.weights;

    if (derivatives === 0) {
      // Rational evaluation
      let numerator = new Vector3(0, 0, 0);
      let denominator = 0;

      for (let i = 0; i <= n; i++) {
        const weight = weights[i];
        const bernstein = this._bernstein(i, n, t);
        const w = weight * bernstein;
        
        numerator = numerator.add(points[i].multiplyScalar(w));
        denominator += w;
      }

      return numerator.divideScalar(denominator);
    } else {
      // Rational derivatives using quotient rule
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this.evaluate(t, 0));
        } else {
          // Complex rational derivative calculation
          let numerator = new Vector3(0, 0, 0);
          let denominator = 0;

          for (let i = 0; i <= n - k; i++) {
            let sum = new Vector3(0, 0, 0);
            for (let j = 1; j <= k; j++) {
              sum = sum.add(points[i + j].multiplyScalar(this._binomial(j, k)));
            }
            
            const weight = weights[i];
            const bernstein = this._bernstein(i, n - k, t);
            const w = weight * bernstein;
            
            numerator = numerator.add(sum.multiplyScalar(w));
            denominator += w;
          }

          result.push(numerator.divideScalar(denominator));
        }
      }
      return result;
    }
  }

  // Bernstein polynomial helper
  _bernstein(i, n, t) {
    return this._binomial(i, n) * Math.pow(t, i) * Math.pow(1 - t, n - i);
  }

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

  // Tessellation to BufferGeometry
  tessellate(segments = 20) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Generate points along the curve
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = this.evaluate(t);
      const derivative = this.evaluate(t, 1)[1];
      const tangent = derivative.normalize();
      
      vertices.push(point.x, point.y, point.z);
      
      // Calculate normal (perpendicular to tangent)
      const normal = new Vector3(0, 1, 0);
      if (Math.abs(tangent.y) > 0.9) {
        normal.set(1, 0, 0);
      }
      const binormal = tangent.clone().cross(normal).normalize();
      normal.copy(binormal.cross(tangent).normalize());
      
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(t, 0);

      if (i > 0) {
        indices.push(i - 1, i);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32Array(vertices));
    geometry.setAttribute('normal', new Float32Array(normals));
    geometry.setAttribute('uv', new Float32Array(uvs));
    geometry.setIndex(indices);
    
    return geometry;
  }

  // Surface of revolution
  revolve(angle = 2 * Math.PI, segments = 20) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const steps = Math.max(segments, 8);
    const angleStep = angle / steps;

    // Generate vertices for the surface
    for (let j = 0; j <= steps; j++) {
      const phi = j * angleStep;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = this.evaluate(t);
        
        // Rotate around Y-axis
        const x = point.x * cosPhi;
        const z = point.x * sinPhi;
        const y = point.y;

        vertices.push(x, y, z);

        // Calculate normal
        const derivative = this.evaluate(t, 1)[1];
        const tangent = derivative.normalize();
        const radial = new Vector3(cosPhi, 0, sinPhi);
        const normal = tangent.clone().cross(radial).normalize();

        normals.push(normal.x, normal.y, normal.z);
        uvs.push(t, phi / (2 * Math.PI));
      }
    }

    // Generate indices
    for (let j = 0; j < steps; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        const b = a + segments + 1;
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

  // Extrusion along path
  extrude(path, sections = 20, twist = 0) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const curveSegments = Math.max(sections, 8);
    const pathSegments = Math.max(sections, 8);

    for (let j = 0; j <= pathSegments; j++) {
      const t = j / pathSegments;
      const pathPoint = path.evaluate(t);
      const pathTangent = path.evaluate(t, 1)[1].normalize();

      for (let i = 0; i <= curveSegments; i++) {
        const s = i / curveSegments;
        const curvePoint = this.evaluate(s);
        const curveTangent = this.evaluate(s, 1)[1].normalize();

        // Apply transformation along path
        let transformed = curvePoint.clone();
        transformed = transformed.add(pathPoint);

        // Apply twist if specified
        if (twist !== 0) {
          const twistAngle = twist * t;
          const cos = Math.cos(twistAngle);
          const sin = Math.sin(twistAngle);
          const x = transformed.x * cos - transformed.z * sin;
          const z = transformed.x * sin + transformed.z * cos;
          transformed.x = x;
          transformed.z = z;
        }

        vertices.push(transformed.x, transformed.y, transformed.z);

        // Calculate normal
        const binormal = pathTangent.clone().cross(curveTangent).normalize();
        const normal = binormal.cross(pathTangent).normalize();

        normals.push(normal.x, normal.y, normal.z);
        uvs.push(s, t);
      }
    }

    // Generate indices
    for (let j = 0; j < pathSegments; j++) {
      for (let i = 0; i < curveSegments; i++) {
        const a = j * (curveSegments + 1) + i;
        const b = a + curveSegments + 1;
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

  // Subdivision for smoother curves
  subdivide(iterations = 1) {
    let newPoints = [...this.points];

    for (let iter = 0; iter < iterations; iter++) {
      const subdivided = [];
      
      // Add first point
      subdivided.push(newPoints[0].clone());
      
      // Insert new points between each pair
      for (let i = 0; i < newPoints.length - 1; i++) {
        const p1 = newPoints[i];
        const p2 = newPoints[i + 1];
        
        // De Casteljau's algorithm for subdivision
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        subdivided.push(mid);
      }
      
      // Add last point
      subdivided.push(newPoints[newPoints.length - 1].clone());
      newPoints = subdivided;
    }

    return new BezierCurve(newPoints, newPoints.length - 1, this.weights);
  }

  // Find closest point on curve
  findClosestPoint(targetPoint, iterations = 10) {
    let t = 0.5; // Initial guess
    
    for (let i = 0; i < iterations; i++) {
      const point = this.evaluate(t);
      const derivative = this.evaluate(t, 1)[1];
      
      // Newton's method
      const vector = point.subtract(targetPoint);
      const dotProduct = vector.dot(derivative);
      const derivativeMagnitudeSq = derivative.dot(derivative);
      
      if (Math.abs(derivativeMagnitudeSq) < 1e-10) break;
      
      t = t - dotProduct / derivativeMagnitudeSq;
      t = Math.max(0, Math.min(1, t)); // Clamp to [0,1]
    }
    
    return {
      parameter: t,
      point: this.evaluate(t),
      distance: this.evaluate(t).subtract(targetPoint).length()
    };
  }

  // Get bounding box
  getBoundingBox() {
    return this.boundingBox;
  }

  _updateBoundingBox() {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      minZ = Math.min(minZ, point.z);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      maxZ = Math.max(maxZ, point.z);
    }

    this.boundingBox = {
      min: new Vector3(minX, minY, minZ),
      max: new Vector3(maxX, maxY, maxZ)
    };
  }

  // Create from control points (auto-detect degree)
  static fromPoints(points, weights = []) {
    const n = points.length;
    let degree;
    
    if (n <= 5) degree = n - 1; // Use all points for small sets
    else if (n <= 10) degree = 3; // Default to cubic
    else degree = Math.min(4, n - 1); // Limit degree
    
    return new BezierCurve(points.slice(0, degree + 1), degree, weights);
  }

  // Convert to other curve types
  toSpline() {
    // Convert Bezier to cubic spline
    return new Spline(this.points, 'cubic');
  }

  toJSON() {
    return {
      points: this.points.map(p => [p.x, p.y, p.z]),
      degree: this.degree,
      weights: this.weights,
      isRational: this.isRational
    };
  }

  static fromJSON(data) {
    const points = data.points.map(p => new Vector3(p[0], p[1], p[2]));
    return new BezierCurve(points, data.degree, data.weights);
  }

  // Clone the curve
  clone() {
    return new BezierCurve(this.points, this.degree, this.weights);
  }
}
