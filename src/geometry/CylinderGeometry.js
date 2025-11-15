/**
 * CylinderGeometry.js
 * Comprehensive cylinder geometry with proper UV mapping, normals, and tangents
 */

export class CylinderGeometry {
  constructor(radiusTop = 1, radiusBottom = 1, height = 1, radialSegments = 8, heightSegments = 1, openEnded = false) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.tangents = [];

    this._generateCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
  }

  _generateCylinder(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded) {
    // Ensure minimum segments
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const heightHalf = height / 2;
    const radiusDiff = radiusTop - radiusBottom;

    let vertexCount = 0;

    // Generate side vertices
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const yPos = -heightHalf + v * height;
      const radius = radiusBottom + v * radiusDiff;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Calculate vertex position
        const xPos = radius * cosTheta;
        const zPos = radius * sinTheta;

        this.vertices.push(xPos, yPos, zPos);

        // Calculate normal
        const normal = this._calculateCylinderNormal(radiusDiff, cosTheta, sinTheta, y, heightSegments);
        this.normals.push(...normal);

        // UV mapping
        this.uvs.push(u, v);
      }
    }

    // Generate top and bottom caps if not open ended
    if (!openEnded && radiusTop > 0 && radiusBottom > 0) {
      // Top cap
      const topStartIndex = this.vertices.length / 3;
      this.vertices.push(0, heightHalf, 0);
      this.normals.push(0, 1, 0);
      this.uvs.push(0.5, 0.5);

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const xPos = radiusTop * cosTheta;
        const zPos = radiusTop * sinTheta;

        this.vertices.push(xPos, heightHalf, zPos);
        this.normals.push(0, 1, 0);
        this.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
      }

      // Bottom cap
      const bottomStartIndex = this.vertices.length / 3;
      this.vertices.push(0, -heightHalf, 0);
      this.normals.push(0, -1, 0);
      this.uvs.push(0.5, 0.5);

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        const xPos = radiusBottom * cosTheta;
        const zPos = radiusBottom * sinTheta;

        this.vertices.push(xPos, -heightHalf, zPos);
        this.normals.push(0, -1, 0);
        this.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
      }
    }

    // Generate side indices
    const vertsPerRow = radialSegments + 1;
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = y * vertsPerRow + x;
        const b = (y + 1) * vertsPerRow + x;
        const c = (y + 1) * vertsPerRow + (x + 1);
        const d = y * vertsPerRow + (x + 1);

        this.indices.push(a, b, d);
        this.indices.push(b, c, d);
      }
    }

    // Generate cap indices if not open ended
    if (!openEnded && radiusTop > 0 && radiusBottom > 0) {
      const topStart = this.vertices.length / 3;
      const centerTopIndex = topStart - 1; // Last added vertex is center of top cap
      const topRingStart = centerTopIndex + 1;

      // Top cap triangles (fan)
      for (let x = 0; x < radialSegments; x++) {
        this.indices.push(centerTopIndex, topRingStart + x, topRingStart + x + 1);
      }

      const bottomStart = this.vertices.length / 3;
      const centerBottomIndex = bottomStart - 1; // Last added vertex is center of bottom cap
      const bottomRingStart = centerBottomIndex + 1;

      // Bottom cap triangles (fan, reversed winding)
      for (let x = 0; x < radialSegments; x++) {
        this.indices.push(centerBottomIndex, bottomRingStart + x + 1, bottomRingStart + x);
      }
    }

    // Convert to typed arrays
    this.vertices = new Float32Array(this.vertices);
    this.normals = new Float32Array(this.normals);
    this.uvs = new Float32Array(this.uvs);

    // Use appropriate index type
    if (this.indices.length > 65535) {
      this.indices = new Uint32Array(this.indices);
    } else {
      this.indices = new Uint16Array(this.indices);
    }

    this.tangents = new Float32Array((this.vertices.length / 3) * 4);

    // Generate tangents
    this._generateTangents();
  }

  _calculateCylinderNormal(radiusDiff, cosTheta, sinTheta, y, heightSegments) {
    // For cylinders, normals point outward from the surface
    // The normal calculation considers the slope of the cylinder sides
    if (radiusDiff === 0) {
      // Perfect cylinder
      return [cosTheta, 0, sinTheta];
    } else {
      // Conical frustum
      // The normal has a radial component and a vertical component
      const slope = radiusDiff / heightSegments;
      const normalLength = Math.sqrt(cosTheta * cosTheta + sinTheta * sinTheta + slope * slope);
      
      return [
        cosTheta / normalLength,
        -slope / normalLength,
        sinTheta / normalLength
      ];
    }
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

  // Create a cone (special case of cylinder)
  static createCone(radius = 1, height = 1, radialSegments = 8, heightSegments = 1, openEnded = false) {
    return new CylinderGeometry(0, radius, height, radialSegments, heightSegments, openEnded);
  }

  // Get cylinder properties
  getRadiusTop() {
    return Math.sqrt(this.vertices[0] * this.vertices[0] + this.vertices[2] * this.vertices[2]);
  }

  getRadiusBottom() {
    const bottomRadiusStart = this.vertices.length - 3;
    return Math.sqrt(this.vertices[bottomRadiusStart] * this.vertices[bottomRadiusStart] + 
                     this.vertices[bottomRadiusStart + 2] * this.vertices[bottomRadiusStart + 2]);
  }

  getHeight() {
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (let i = 1; i < this.vertices.length; i += 3) {
      const y = this.vertices[i];
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    return maxY - minY;
  }

  getVertexCount() {
    return this.vertices.length / 3;
  }

  getTriangleCount() {
    return this.indices.length / 3;
  }
}
