/**
 * CircleGeometry.js
 * Comprehensive circle geometry with proper UV mapping, normals, and tangents
 */

export class CircleGeometry {
  constructor(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.tangents = [];

    this._generateCircle(radius, segments, thetaStart, thetaLength);
  }

  _generateCircle(radius, segments, thetaStart, thetaLength) {
    // Ensure minimum segments
    segments = Math.max(3, Math.floor(segments));

    // Ensure valid theta range
    thetaStart = Math.max(0, Math.min(thetaStart, Math.PI * 2));
    thetaLength = Math.max(0, Math.min(thetaLength, Math.PI * 2));

    const vertexCount = segments + 2; // +2 for center and closing vertex

    // Add center vertex
    this.vertices.push(0, 0, 0);
    this.normals.push(0, 0, 1); // Normal pointing up (XY plane)
    this.uvs.push(0.5, 0.5); // Center UV

    // Generate circle vertices
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const theta = thetaStart + u * thetaLength;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const x = radius * cosTheta;
      const y = radius * sinTheta;

      this.vertices.push(x, y, 0);
      this.normals.push(0, 0, 1); // Same normal for all circle vertices

      // UV mapping - map circle to unit square
      this.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
    }

    // Add closing vertex (duplicate of first circle vertex for seam handling)
    if (thetaLength < Math.PI * 2) {
      // Partial circle - add explicit closing
      const theta = thetaStart + thetaLength;
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const x = radius * cosTheta;
      const y = radius * sinTheta;

      this.vertices.push(x, y, 0);
      this.normals.push(0, 0, 1);
      this.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
    }

    // Generate indices for triangle fan
    for (let i = 1; i <= segments; i++) {
      const centerIndex = 0;
      const currentIndex = i;
      const nextIndex = i + 1;

      if (i === segments) {
        // Connect last vertex back to first (closing the circle)
        this.indices.push(centerIndex, currentIndex, 1);
      } else {
        this.indices.push(centerIndex, currentIndex, nextIndex);
      }
    }

    // Convert to typed arrays
    this.vertices = new Float32Array(this.vertices);
    this.normals = new Float32Array(this.normals);
    this.uvs = new Float32Array(this.uvs);
    this.indices = new Uint16Array(this.indices);
    this.tangents = new Float32Array((this.vertices.length / 3) * 4);

    // Generate tangents
    this._generateTangents();
  }

  _generateTangents() {
    const vertexCount = this.vertices.length / 3;
    const tan1 = new Array(vertexCount);
    const tan2 = new Array(vertexCount);

    // Initialize tangent arrays
    for (let i = 0; i < vertexCount; i++) {
      tan1[i] = [0, 0, 0];
      tan2[i] = [0, 0, 0];
    }

    const vertices = this.vertices;
    const uvs = this.uvs;
    const normals = this.normals;
    const indices = this.indices;

    // Calculate tangents using UV derivatives
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      const v1 = [vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]];
      const v2 = [vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]];
      const v3 = [vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]];

      const uv1 = [uvs[i1 * 2], uvs[i1 * 2 + 1]];
      const uv2 = [uvs[i2 * 2], uvs[i2 * 2 + 1]];
      const uv3 = [uvs[i3 * 2], uvs[i3 * 2 + 1]];

      const x1 = v2[0] - v1[0];
      const y1 = v2[1] - v1[1];
      const z1 = v2[2] - v1[2];
      const x2 = v3[0] - v1[0];
      const y2 = v3[1] - v1[1];
      const z2 = v3[2] - v1[2];

      const s1 = uv2[0] - uv1[0];
      const t1 = uv2[1] - uv1[1];
      const s2 = uv3[0] - uv1[0];
      const t2 = uv3[1] - uv1[1];

      const denom = s1 * t2 - s2 * t1;
      const r = Math.abs(denom) > 0.000001 ? 1.0 / denom : 0.0;

      const sdir = [(t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r];
      const tdir = [(s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r];

      tan1[i1][0] += sdir[0];
      tan1[i1][1] += sdir[1];
      tan1[i1][2] += sdir[2];
      tan1[i2][0] += sdir[0];
      tan1[i2][1] += sdir[1];
      tan1[i2][2] += sdir[2];
      tan1[i3][0] += sdir[0];
      tan1[i3][1] += sdir[1];
      tan1[i3][2] += sdir[2];

      tan2[i1][0] += tdir[0];
      tan2[i1][1] += tdir[1];
      tan2[i1][2] += tdir[2];
      tan2[i2][0] += tdir[0];
      tan2[i2][1] += tdir[1];
      tan2[i2][2] += tdir[2];
      tan2[i3][0] += tdir[0];
      tan2[i3][1] += tdir[1];
      tan2[i3][2] += tdir[2];
    }

    // Orthonormalize tangents
    for (let i = 0; i < vertexCount; i++) {
      const n = [normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]];
      const t = tan1[i];

      // Gram-Schmidt orthonormalize
      const dot = n[0] * t[0] + n[1] * t[1] + n[2] * t[2];
      const tangent = [
        t[0] - n[0] * dot,
        t[1] - n[1] * dot,
        t[2] - n[2] * dot
      ];

      const length = Math.sqrt(tangent[0] * tangent[0] + tangent[1] * tangent[1] + tangent[2] * tangent[2]);
      
      if (length > 0.000001) {
        this.tangents[i * 4] = tangent[0] / length;
        this.tangents[i * 4 + 1] = tangent[1] / length;
        this.tangents[i * 4 + 2] = tangent[2] / length;
        
        // Calculate handedness
        const t2 = tan2[i];
        const dot2 = t2[0] * tangent[0] + t2[1] * tangent[1] + t2[2] * tangent[2];
        this.tangents[i * 4 + 3] = dot2 < 0 ? -1 : 1;
      } else {
        // Fallback tangent
        this.tangents[i * 4] = 1;
        this.tangents[i * 4 + 1] = 0;
        this.tangents[i * 4 + 2] = 0;
        this.tangents[i * 4 + 3] = 1;
      }
    }
  }

  // Create a semicircle
  static createSemicircle(radius = 1, segments = 32, startAngle = 0) {
    return new CircleGeometry(radius, segments, startAngle, Math.PI);
  }

  // Create a quarter circle
  static createQuarterCircle(radius = 1, segments = 32, startAngle = 0) {
    return new CircleGeometry(radius, segments, startAngle, Math.PI / 2);
  }

  // Create a ring (annulus)
  static createRing(innerRadius = 0.5, outerRadius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    const geometry = new CircleGeometry();
    
    geometry.vertices = [];
    geometry.normals = [];
    geometry.uvs = [];
    geometry.indices = [];
    geometry.tangents = [];

    segments = Math.max(3, Math.floor(segments));
    thetaStart = Math.max(0, Math.min(thetaStart, Math.PI * 2));
    thetaLength = Math.max(0, Math.min(thetaLength, Math.PI * 2));

    // Generate inner and outer circle vertices
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const theta = thetaStart + u * thetaLength;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      // Outer vertex
      const xOuter = outerRadius * cosTheta;
      const yOuter = outerRadius * sinTheta;
      
      geometry.vertices.push(xOuter, yOuter, 0);
      geometry.normals.push(0, 0, 1);
      geometry.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);

      // Inner vertex
      const xInner = innerRadius * cosTheta;
      const yInner = innerRadius * sinTheta;
      
      geometry.vertices.push(xInner, yInner, 0);
      geometry.normals.push(0, 0, 1);
      geometry.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
    }

    // Generate indices for ring (quad strip)
    for (let i = 0; i < segments; i++) {
      const outer1 = i * 2;
      const inner1 = i * 2 + 1;
      const outer2 = (i + 1) * 2;
      const inner2 = (i + 1) * 2 + 1;

      // Two triangles per quad
      geometry.indices.push(outer1, inner1, outer2);
      geometry.indices.push(inner1, inner2, outer2);
    }

    // Convert to typed arrays
    geometry.vertices = new Float32Array(geometry.vertices);
    geometry.normals = new Float32Array(geometry.normals);
    geometry.uvs = new Float32Array(geometry.uvs);
    geometry.indices = new Uint16Array(geometry.indices);
    geometry.tangents = new Float32Array((geometry.vertices.length / 3) * 4);

    geometry._generateTangents();

    return geometry;
  }

  // Create an arc (partial circle outline)
  static createArc(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    const geometry = new CircleGeometry();
    
    geometry.vertices = [];
    geometry.normals = [];
    geometry.uvs = [];
    geometry.indices = [];
    geometry.tangents = [];

    segments = Math.max(2, Math.floor(segments));
    thetaStart = Math.max(0, Math.min(thetaStart, Math.PI * 2));
    thetaLength = Math.max(0, Math.min(thetaLength, Math.PI * 2));

    // Generate arc vertices
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const theta = thetaStart + u * thetaLength;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const x = radius * cosTheta;
      const y = radius * sinTheta;

      geometry.vertices.push(x, y, 0);
      geometry.normals.push(0, 0, 1);
      geometry.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
    }

    // Convert to typed arrays (no indices for line strip)
    geometry.vertices = new Float32Array(geometry.vertices);
    geometry.normals = new Float32Array(geometry.normals);
    geometry.uvs = new Float32Array(geometry.uvs);
    geometry.indices = new Uint16Array(0); // No indices for line geometry
    geometry.tangents = new Float32Array((geometry.vertices.length / 3) * 4);

    geometry._generateTangents();

    return geometry;
  }

  // Create ellipse
  static createEllipse(radiusX = 1, radiusY = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    const geometry = new CircleGeometry();
    
    geometry.vertices = [];
    geometry.normals = [];
    geometry.uvs = [];
    geometry.indices = [];
    geometry.tangents = [];

    segments = Math.max(3, Math.floor(segments));
    thetaStart = Math.max(0, Math.min(thetaStart, Math.PI * 2));
    thetaLength = Math.max(0, Math.min(thetaLength, Math.PI * 2));

    // Add center vertex
    geometry.vertices.push(0, 0, 0);
    geometry.normals.push(0, 0, 1);
    geometry.uvs.push(0.5, 0.5);

    // Generate ellipse vertices
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const theta = thetaStart + u * thetaLength;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const x = radiusX * cosTheta;
      const y = radiusY * sinTheta;

      geometry.vertices.push(x, y, 0);
      geometry.normals.push(0, 0, 1);
      geometry.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
    }

    // Generate indices for triangle fan
    for (let i = 1; i <= segments; i++) {
      const centerIndex = 0;
      const currentIndex = i;
      const nextIndex = i + 1;

      if (i === segments) {
        geometry.indices.push(centerIndex, currentIndex, 1);
      } else {
        geometry.indices.push(centerIndex, currentIndex, nextIndex);
      }
    }

    // Convert to typed arrays
    geometry.vertices = new Float32Array(geometry.vertices);
    geometry.normals = new Float32Array(geometry.normals);
    geometry.uvs = new Float32Array(geometry.uvs);
    geometry.indices = new Uint16Array(geometry.indices);
    geometry.tangents = new Float32Array((geometry.vertices.length / 3) * 4);

    geometry._generateTangents();

    return geometry;
  }

  // Get circle properties
  getRadius() {
    // Calculate actual radius from first non-center vertex
    if (this.vertices.length >= 6) {
      return Math.sqrt(this.vertices[3] * this.vertices[3] + this.vertices[4] * this.vertices[4]);
    }
    return 0;
  }

  getInnerRadius() {
    // For ring geometries, return inner radius
    // This would be used for ring-specific implementations
    return this.getRadius() * 0.5; // Default fallback
  }

  getOuterRadius() {
    // For ring geometries, return outer radius
    return this.getRadius(); // Default to overall radius
  }

  getThetaLength() {
    // Calculate the actual theta length from vertices
    if (this.vertices.length < 6) return 0;
    
    // Estimate from first and last circle vertices
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

  getVertexCount() {
    return this.vertices.length / 3;
  }

  getTriangleCount() {
    return this.indices.length / 3;
  }

  // Utility to check if this is a complete circle
  isComplete() {
    return Math.abs(this.getThetaLength() - Math.PI * 2) < 0.01;
  }
}
