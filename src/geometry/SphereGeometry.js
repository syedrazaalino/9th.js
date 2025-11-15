/**
 * SphereGeometry.js
 * Comprehensive sphere geometry with proper UV mapping, normals, and tangents
 */

export class SphereGeometry {
  constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.tangents = [];

    this._generateSphere(radius, widthSegments, heightSegments);
  }

  _generateSphere(radius, widthSegments, heightSegments) {
    // Ensure minimum segments
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));

    const phiStart = 0;
    const phiLength = Math.PI * 2;
    const thetaStart = 0;
    const thetaLength = Math.PI;

    const thetaEnd = thetaStart + thetaLength;
    
    const vertexCount = (widthSegments + 1) * (heightSegments + 1);

    // Generate vertices, normals, and UVs
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const theta = thetaStart + v * thetaLength;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const phi = phiStart + u * phiLength;

        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // Calculate vertex position
        const xPos = -radius * cosPhi * sinTheta;
        const yPos = radius * cosTheta;
        const zPos = radius * sinPhi * sinTheta;

        this.vertices.push(xPos, yPos, zPos);

        // Calculate normal (same as position for sphere)
        const normalLength = Math.sqrt(xPos * xPos + yPos * yPos + zPos * zPos);
        this.normals.push(
          xPos / normalLength,
          yPos / normalLength,
          zPos / normalLength
        );

        // UV mapping - spherical coordinates
        this.uvs.push(u, 1 - v);
      }
    }

    // Generate indices
    const vertsPerRow = widthSegments + 1;
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * vertsPerRow + x;
        const b = (y + 1) * vertsPerRow + x;
        const c = (y + 1) * vertsPerRow + (x + 1);
        const d = y * vertsPerRow + (x + 1);

        // Two triangles per quad
        if (y !== 0) {
          this.indices.push(a, b, d);
        }

        if (y !== heightSegments - 1) {
          this.indices.push(b, c, d);
        }
      }
    }

    // Handle seams where u wraps around
    for (let y = 0; y <= heightSegments; y++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = y * vertsPerRow + x;
        const b = y * vertsPerRow + x + 1;
        const c = (y + 1) * vertsPerRow + x + 1;
        const d = (y + 1) * vertsPerRow + x;

        // Check if we're at the seam (u=0 and u=1)
        if (x === 0) {
          // Create duplicate vertices at seam with different u coordinates
          const vertexIndex = a * 3;
          const uvIndex = a * 2;

          // Clone the vertex and UV for seam handling
          this.vertices.push(
            this.vertices[vertexIndex],
            this.vertices[vertexIndex + 1],
            this.vertices[vertexIndex + 2]
          );
          this.normals.push(
            this.normals[vertexIndex],
            this.normals[vertexIndex + 1],
            this.normals[vertexIndex + 2]
          );
          this.uvs.push(1, this.uvs[uvIndex + 1]); // u=1 for seam

          const seamVertexIndex = this.vertices.length / 3 - 1;

          if (y !== 0) {
            this.indices.push(seamVertexIndex, b, d);
          }
          if (y !== heightSegments - 1) {
            this.indices.push(seamVertexIndex, c, d);
          }
        }
      }
    }

    // Convert to typed arrays
    this.vertices = new Float32Array(this.vertices);
    this.normals = new Float32Array(this.normals);
    this.uvs = new Float32Array(this.uvs);

    // Use Uint32Array if we have too many vertices
    if (this.indices.length > 65535) {
      this.indices = new Uint32Array(this.indices);
    } else {
      this.indices = new Uint16Array(this.indices);
    }

    this.tangents = new Float32Array((this.vertices.length / 3) * 4);

    // Generate tangents for normal mapping
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

    // Orthonormalize tangents and calculate handedness
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
        // Fallback tangent if calculation failed
        this.tangents[i * 4] = 1;
        this.tangents[i * 4 + 1] = 0;
        this.tangents[i * 4 + 2] = 0;
        this.tangents[i * 4 + 3] = 1;
      }
    }
  }

  // Optimize for rendering by merging vertices at seams
  optimize() {
    // This could implement vertex welding for better performance
    // For now, the basic optimization is using appropriate index type
    return this;
  }

  // Get sphere-specific properties
  getVertexCount() {
    return this.vertices.length / 3;
  }

  getTriangleCount() {
    return this.indices.length / 3;
  }
}
