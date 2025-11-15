/**
 * Spline.js
 * Comprehensive cubic spline handling with various spline types, derivatives, and tessellation
 */

import { BufferGeometry } from '../core/BufferGeometry.js';
import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';

export class Spline {
  constructor(points = [], type = 'cubic', tension = 0.5, closed = false) {
    this.points = points.map(p => p.clone ? p.clone() : new Vector3(...p));
    this.type = type;
    this.tension = tension;
    this.closed = closed;
    this.controlPoints = [];
    this.knots = [];
    this.cache = new Map();
    
    this._updateControlPoints();
    this._updateBoundingBox();
  }

  // Update control points based on spline type
  _updateControlPoints() {
    this.controlPoints.length = 0;
    
    switch (this.type) {
      case 'linear':
        this._updateLinearSpline();
        break;
      case 'quadratic':
        this._updateQuadraticSpline();
        break;
      case 'cubic':
        this._updateCubicSpline();
        break;
      case 'catmull-rom':
        this._updateCatmullRomSpline();
        break;
      case 'hermite':
        this._updateHermiteSpline();
        break;
      case 'b-spline':
        this._updateBSpline();
        break;
      default:
        this._updateCubicSpline();
    }
  }

  _updateLinearSpline() {
    // Linear spline just connects points directly
    this.controlPoints = [...this.points];
    this.knots = this.points.map((_, i) => i);
  }

  _updateQuadraticSpline() {
    // Quadratic spline with midpoint interpolation
    this.controlPoints = [];
    
    for (let i = 0; i < this.points.length - 1; i++) {
      this.controlPoints.push(this.points[i]);
      
      // Add midpoint
      const midpoint = this.points[i].clone().add(this.points[i + 1]).multiplyScalar(0.5);
      this.controlPoints.push(midpoint);
    }
    
    // Add last point
    this.controlPoints.push(this.points[this.points.length - 1]);
    
    this.knots = this.controlPoints.map((_, i) => Math.floor(i / 2));
  }

  _updateCubicSpline() {
    // Standard cubic spline with natural boundary conditions
    this.controlPoints = [...this.points];
    this.knots = this.points.map((_, i) => i);
    
    // Calculate spline coefficients if needed for interpolation
    if (this._needsCoefficients()) {
      this._calculateSplineCoefficients();
    }
  }

  _updateCatmullRomSpline() {
    // Catmull-Rom spline
    this.controlPoints = [...this.points];
    this.knots = this.points.map((_, i) => i);
    
    // For Catmull-Rom, we need to handle end conditions
    this._calculateCatmullRomCoefficients();
  }

  _updateHermiteSpline() {
    // Hermite spline requires tangents
    if (!this.tangents || this.tangents.length !== this.points.length) {
      this._calculateHermiteTangents();
    }
    this.controlPoints = [...this.points];
    this.knots = this.points.map((_, i) => i);
  }

  _updateBSpline() {
    // B-spline with uniform knots
    const degree = 3;
    const n = this.points.length - 1;
    
    this.controlPoints = [...this.points];
    
    // Uniform knot vector
    this.knots = [];
    for (let i = 0; i <= n + degree + 1; i++) {
      this.knots.push(i);
    }
  }

  // Evaluation methods
  evaluate(t, derivatives = 0) {
    if (t < 0 || t > 1) throw new Error('Parameter t must be between 0 and 1');
    
    const cacheKey = `${t}_${derivatives}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result;
    switch (this.type) {
      case 'linear':
        result = this._evaluateLinear(t, derivatives);
        break;
      case 'quadratic':
        result = this._evaluateQuadratic(t, derivatives);
        break;
      case 'cubic':
        result = this._evaluateCubic(t, derivatives);
        break;
      case 'catmull-rom':
        result = this._evaluateCatmullRom(t, derivatives);
        break;
      case 'hermite':
        result = this._evaluateHermite(t, derivatives);
        break;
      case 'b-spline':
        result = this._evaluateBSpline(t, derivatives);
        break;
      default:
        result = this._evaluateCubic(t, derivatives);
    }
    
    this.cache.set(cacheKey, result);
    return result;
  }

  _evaluateLinear(t, derivatives) {
    const segment = Math.floor(t * (this.points.length - 1));
    const localT = (t * (this.points.length - 1)) - segment;
    
    const p0 = this.points[segment];
    const p1 = this.points[Math.min(segment + 1, this.points.length - 1)];
    
    if (derivatives === 0) {
      return p0.clone().multiplyScalar(1 - localT).add(p1.clone().multiplyScalar(localT));
    } else {
      const derivative = p1.subtract(p0);
      const result = [this._evaluateLinear(t, 0)];
      for (let i = 1; i <= derivatives; i++) {
        result.push(new Vector3(0, 0, 0)); // Linear has zero higher derivatives
      }
      result[1] = derivative;
      return result;
    }
  }

  _evaluateQuadratic(t, derivatives) {
    const segment = Math.floor(t * (this.points.length - 1) / 2);
    const localT = (t * (this.points.length - 1) / 2) - segment;
    
    const p0 = this.points[segment];
    const p1 = this.controlPoints[segment * 2 + 1];
    const p2 = this.points[Math.min(segment + 1, this.points.length - 1)];
    
    if (derivatives === 0) {
      // Quadratic Bezier
      const weight0 = Math.pow(1 - localT, 2);
      const weight1 = 2 * (1 - localT) * localT;
      const weight2 = Math.pow(localT, 2);
      
      return p0.clone().multiplyScalar(weight0)
                .add(p1.clone().multiplyScalar(weight1))
                .add(p2.clone().multiplyScalar(weight2));
    } else {
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this._evaluateQuadratic(t, 0));
        } else {
          // Quadratic derivatives
          const derivative = p2.subtract(p1.clone().multiplyScalar(2)).add(p0);
          result.push(derivative.multiplyScalar(2));
        }
      }
      return result;
    }
  }

  _evaluateCubic(t, derivatives) {
    const segment = Math.floor(t * (this.points.length - 1));
    const localT = (t * (this.points.length - 1)) - segment;
    
    // Get 4 control points for this segment
    const p0 = this.points[Math.max(0, segment - 1)];
    const p1 = this.points[segment];
    const p2 = this.points[Math.min(segment + 1, this.points.length - 1)];
    const p3 = this.points[Math.min(segment + 2, this.points.length - 1)];
    
    if (derivatives === 0) {
      // Cubic Catmull-Rom spline
      const t2 = localT * localT;
      const t3 = t2 * localT;
      
      return p1.clone().multiplyScalar(0.5 * (2 * p1.x + (-p0.x + p2.x) * localT + 
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + 
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3))
                .add(p1.clone().multiplyScalar(0.5 * (2 * p1.y + (-p0.y + p2.y) * localT + 
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + 
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)))
                .add(p1.clone().multiplyScalar(0.5 * (2 * p1.z + (-p0.z + p2.z) * localT + 
                (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + 
                (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)));
    } else {
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this._evaluateCubic(t, 0));
        } else {
          // Cubic derivatives (simplified)
          const derivative = p3.subtract(p2).add(p1.subtract(p0));
          result.push(derivative.multiplyScalar(3));
        }
      }
      return result;
    }
  }

  _evaluateCatmullRom(t, derivatives) {
    const segment = Math.floor(t * (this.points.length - 1));
    const localT = (t * (this.points.length - 1)) - segment;
    
    const p0 = this.points[Math.max(0, segment - 1)];
    const p1 = this.points[segment];
    const p2 = this.points[Math.min(segment + 1, this.points.length - 1)];
    const p3 = this.points[Math.min(segment + 2, this.points.length - 1)];
    
    if (derivatives === 0) {
      const t2 = localT * localT;
      const t3 = t2 * localT;
      
      // Catmull-Rom basis functions
      const a0 = -0.5 * t3 + t2 - 0.5 * localT;
      const a1 = 1.5 * t3 - 2.5 * t2 + 1;
      const a2 = -1.5 * t3 + 2 * t2 + 0.5 * localT;
      const a3 = 0.5 * t3 - 0.5 * t2;
      
      return p0.clone().multiplyScalar(a0)
                .add(p1.clone().multiplyScalar(a1))
                .add(p2.clone().multiplyScalar(a2))
                .add(p3.clone().multiplyScalar(a3));
    } else {
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this._evaluateCatmullRom(t, 0));
        } else {
          // Catmull-Rom derivatives
          const derivative = p3.subtract(p2).add(p1.subtract(p0)).multiplyScalar(3 * this.tension);
          result.push(derivative);
        }
      }
      return result;
    }
  }

  _evaluateHermite(t, derivatives) {
    const segment = Math.floor(t * (this.points.length - 1));
    const localT = (t * (this.points.length - 1)) - segment;
    
    const p0 = this.points[segment];
    const p1 = this.points[Math.min(segment + 1, this.points.length - 1)];
    const m0 = this.tangents[segment];
    const m1 = this.tangents[Math.min(segment + 1, this.tangents.length - 1)];
    
    if (derivatives === 0) {
      const t2 = localT * localT;
      const t3 = t2 * localT;
      
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + localT;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      
      return p0.clone().multiplyScalar(h00)
                .add(m0.clone().multiplyScalar(h10))
                .add(p1.clone().multiplyScalar(h01))
                .add(m1.clone().multiplyScalar(h11));
    } else {
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this._evaluateHermite(t, 0));
        } else if (k === 1) {
          // First derivative
          const dh00 = 6 * t2 - 6 * localT;
          const dh10 = 3 * t2 - 4 * localT + 1;
          const dh01 = -6 * t2 + 6 * localT;
          const dh11 = 3 * t2 - 2 * localT;
          
          result.push(p0.clone().multiplyScalar(dh00)
                    .add(m0.clone().multiplyScalar(dh10))
                    .add(p1.clone().multiplyScalar(dh01))
                    .add(m1.clone().multiplyScalar(dh11)));
        } else {
          result.push(new Vector3(0, 0, 0)); // Higher derivatives are zero for cubic
        }
      }
      return result;
    }
  }

  _evaluateBSpline(t, derivatives) {
    const n = this.points.length - 1;
    const degree = 3;
    
    // Convert t to knot span
    let u = t * n;
    let span = Math.floor(u);
    if (span >= n) span = n - 1;
    
    const localT = u - span;
    
    if (derivatives === 0) {
      // B-spline evaluation using de Boor's algorithm
      const result = this._deBoorEval(span, localT, degree);
      return result;
    } else {
      const result = [];
      for (let k = 0; k <= derivatives; k++) {
        if (k === 0) {
          result.push(this._evaluateBSpline(t, 0));
        } else {
          // B-spline derivatives
          const derivativeResult = this._deBoorEval(span, localT, degree, k);
          result.push(derivativeResult);
        }
      }
      return result;
    }
  }

  _deBoorEval(span, t, degree, derivative = 0) {
    if (derivative > 0) {
      // Compute derivative
      let result = new Vector3(0, 0, 0);
      for (let j = 1; j <= degree; j++) {
        const knotSpan = span - degree + j;
        if (knotSpan >= 0 && knotSpan < this.knots.length - degree - 1) {
          const weight = degree * (this._knot(knotSpan + degree) - this._knot(knotSpan)) / 
                        (this._knot(span + degree + 1) - this._knot(knotSpan + 1));
          result = result.add(this.points[knotSpan].clone().multiplyScalar(weight));
        }
      }
      return result;
    } else {
      // Standard de Boor evaluation
      const points = [];
      for (let i = 0; i <= degree; i++) {
        const knotSpan = span - degree + i;
        points.push(this.points[knotSpan] ? this.points[knotSpan].clone() : new Vector3(0, 0, 0));
      }
      
      for (let k = 1; k <= degree; k++) {
        for (let j = degree; j >= k; j--) {
          const knotSpan = span - degree + j;
          const alpha = (t - this._knot(knotSpan)) / 
                       (this._knot(knotSpan + degree + 1 - k) - this._knot(knotSpan));
          
          points[j] = points[j - 1].clone().multiplyScalar(1 - alpha)
                     .add(points[j].clone().multiplyScalar(alpha));
        }
      }
      
      return points[degree];
    }
  }

  _knot(index) {
    if (index < 0 || index >= this.knots.length) return 0;
    return this.knots[index];
  }

  // Tessellation to BufferGeometry
  tessellate(segments = 50) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Generate points along the spline
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

  // Surface generation from spline path
  sweep(profileCurve, steps = 20, twist = 0) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    const pathSegments = Math.max(steps, 8);
    const profileSegments = Math.max(steps, 8);

    for (let j = 0; j <= pathSegments; j++) {
      const t = j / pathSegments;
      const pathPoint = this.evaluate(t);
      const pathTangent = this.evaluate(t, 1)[1].normalize();

      for (let i = 0; i <= profileSegments; i++) {
        const s = i / profileSegments;
        const profilePoint = profileCurve.evaluate(s);
        const profileTangent = profileCurve.evaluate(s, 1)[1].normalize();

        // Apply transformation along path
        let transformed = profilePoint.clone();
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
        const binormal = pathTangent.clone().cross(profileTangent).normalize();
        const normal = binormal.cross(pathTangent).normalize();

        normals.push(normal.x, normal.y, normal.z);
        uvs.push(s, t);
      }
    }

    // Generate indices
    for (let j = 0; j < pathSegments; j++) {
      for (let i = 0; i < profileSegments; i++) {
        const a = j * (profileSegments + 1) + i;
        const b = a + profileSegments + 1;
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

  // Helper methods
  _needsCoefficients() {
    // Check if spline coefficients need calculation
    return this.type === 'cubic' && !this.coefficients;
  }

  _calculateSplineCoefficients() {
    // Calculate cubic spline coefficients for natural boundary conditions
    const n = this.points.length - 1;
    this.coefficients = {
      a: [...this.points],
      b: new Array(n).fill(0),
      c: new Array(n + 1).fill(0),
      d: new Array(n).fill(0)
    };

    // Solve tridiagonal system for c coefficients
    // (simplified implementation)
    const h = new Array(n);
    for (let i = 0; i < n; i++) {
      h[i] = this.points[i + 1].subtract(this.points[i]).length();
    }

    // Natural boundary conditions
    this.coefficients.c[0] = 0;
    this.coefficients.c[n] = 0;

    // Thomas algorithm for tridiagonal system
    for (let i = 1; i < n; i++) {
      const denom = 2 * (h[i - 1] + h[i]);
      this.coefficients.c[i] = 6 * (this.points[i + 1].subtract(this.points[i]).subtract(
                 this.points[i].subtract(this.points[i - 1]))) / denom;
    }
  }

  _calculateCatmullRomCoefficients() {
    // Catmull-Rom spline coefficients
    this.catmullRomCoefficients = {
      p0: [],
      p1: [],
      p2: [],
      p3: []
    };

    for (let i = 0; i < this.points.length; i++) {
      const p0 = this.points[Math.max(0, i - 1)];
      const p1 = this.points[i];
      const p2 = this.points[Math.min(this.points.length - 1, i + 1)];
      const p3 = this.points[Math.min(this.points.length - 1, i + 2)];

      this.catmullRomCoefficients.p0.push(p0);
      this.catmullRomCoefficients.p1.push(p1);
      this.catmullRomCoefficients.p2.push(p2);
      this.catmullRomCoefficients.p3.push(p3);
    }
  }

  _calculateHermiteTangents() {
    this.tangents = [];
    
    if (this.points.length < 2) return;

    // Calculate tangents based on neighboring points
    for (let i = 0; i < this.points.length; i++) {
      if (i === 0) {
        // First point - use forward difference
        this.tangents.push(this.points[1].subtract(this.points[0]));
      } else if (i === this.points.length - 1) {
        // Last point - use backward difference
        this.tangents.push(this.points[i].subtract(this.points[i - 1]));
      } else {
        // Middle points - average forward and backward differences
        const forward = this.points[i + 1].subtract(this.points[i]);
        const backward = this.points[i].subtract(this.points[i - 1]);
        this.tangents.push(forward.add(backward).multiplyScalar(0.5));
      }
    }

    // Apply tension
    this.tangents = this.tangents.map(t => t.multiplyScalar(this.tension));
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

  // Add/remove points
  addPoint(point, index = null) {
    if (index === null) {
      this.points.push(point.clone ? point.clone() : new Vector3(...point));
    } else {
      this.points.splice(index, 0, point.clone ? point.clone() : new Vector3(...point));
    }
    this._updateControlPoints();
    this._updateBoundingBox();
    this.cache.clear();
  }

  removePoint(index) {
    if (index >= 0 && index < this.points.length) {
      this.points.splice(index, 1);
      this._updateControlPoints();
      this._updateBoundingBox();
      this.cache.clear();
    }
  }

  // Utility methods
  static fromBezier(bezierCurve) {
    return new Spline(bezierCurve.points, 'cubic');
  }

  toBezier() {
    // Convert to Bezier curve (approximation)
    const controlPoints = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      const p0 = this.points[i];
      const p1 = this.points[i + 1];
      
      // Simple conversion using midpoints
      controlPoints.push(p0.clone());
      if (i < this.points.length - 2) {
        controlPoints.push(p0.clone().add(p1).multiplyScalar(0.5));
      }
    }
    controlPoints.push(this.points[this.points.length - 1].clone());
    
    return new BezierCurve(controlPoints, 3);
  }

  toJSON() {
    return {
      points: this.points.map(p => [p.x, p.y, p.z]),
      type: this.type,
      tension: this.tension,
      closed: this.closed,
      tangents: this.tangents ? this.tangents.map(t => [t.x, t.y, t.z]) : null
    };
  }

  static fromJSON(data) {
    const points = data.points.map(p => new Vector3(p[0], p[1], p[2]));
    const tangents = data.tangents ? data.tangents.map(t => new Vector3(t[0], t[1], t[2])) : null;
    
    const spline = new Spline(points, data.type, data.tension, data.closed);
    if (tangents) {
      spline.tangents = tangents;
    }
    return spline;
  }

  clone() {
    return new Spline(this.points, this.type, this.tension, this.closed);
  }
}
