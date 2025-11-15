/**
 * ConeGeometry.js
 * Comprehensive cone geometry with proper UV mapping, normals, and tangents
 */

export class ConeGeometry {
  constructor(radius = 1, height = 1, radialSegments = 8, heightSegments = 1, openEnded = false) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.tangents = [];

    this._generateCone(radius, height, radialSegments, heightSegments, openEnded);
  }

  _generateCone(radius, height, radialSegments, heightSegments, openEnded) {
    // Ensure minimum segments
    radialSegments = Math.max(3, Math.floor(radialSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const heightHalf = height / 2;
    const slope = radius / height;

    // Generate side vertices
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const yPos = -heightHalf + v * height;
      const radiusAtHeight = radius * (1 - v); // Linear interpolation from base to apex

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        // Calculate vertex position
        const xPos = radiusAtHeight * cosTheta;
        const zPos = radiusAtHeight * sinTheta;

        this.vertices.push(xPos, yPos, zPos);

        // Calculate normal for cone surface
        const normal = this._calculateConeNormal(slope, cosTheta, sinTheta, radiusAtHeight, radius);
        this.normals.push(...normal);

        // UV mapping for cone
        this.uvs.push(u, v);
      }
    }

    // Add apex vertex
    const apexIndex = this.vertices.length / 3;
    this.vertices.push(0, heightHalf, 0);
    this.normals.push(0, 1, 0); // Pointing up for the apex
    this.uvs.push(0.5, 0);

    // Add base center vertex
    const baseCenterIndex = this.vertices.length / 3;
    this.vertices.push(0, -heightHalf, 0);
    this.normals.push(0, -1, 0); // Pointing down for the base
    this.uvs.push(0.5, 1);

    // Add base ring vertices
    const baseRingStart = this.vertices.length / 3;
    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * Math.PI * 2;

      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const xPos = radius * cosTheta;
      const zPos = radius * sinTheta;

      this.vertices.push(xPos, -heightHalf, zPos);
      this.normals.push(0, -1, 0); // Normal pointing down for base
      this.uvs.push((cosTheta + 1) / 2, (sinTheta + 1) / 2);
    }

    // Generate side indices (connecting to apex)
    const vertsPerRow = radialSegments + 1;
    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = y * vertsPerRow + x;
        const b = (y + 1) * vertsPerRow + x;
        const c = (y + 1) * vertsPerRow + (x + 1);
        const d = y * vertsPerRow + (x + 1);

        // For cone sides, the triangles connect different height levels
        this.indices.push(a, b, d);
        this.indices.push(b, c, d);
      }
    }

    // Connect side to apex (fan triangulation)
    for (let x = 0; x < radialSegments; x++) {
      const a = x;
      const b = x + 1;
      
      // Connect to apex
      this.indices.push(a, b, apexIndex);
    }

    // Generate base indices if not open ended
    if (!openEnded) {
      for (let x = 0; x < radialSegments; x++) {
        const a = baseCenterIndex;
        const b = baseRingStart + x;
        const c = baseRingStart + x + 1;

        // Base triangles (fan, reversed winding)
        this.indices.push(a, c, b);
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

  _calculateConeNormal(slope, cosTheta, sinTheta, radiusAtHeight, fullRadius) {
    // For a cone, the normal calculation considers the slope angle
    // The normal points outward from the cone surface
    
    // For a cone, the normal has radial and vertical components
    const normalLength = Math.sqrt(1 + slope * slope);
    
    return [
      cosTheta / normalLength,
      slope / normalLength,
      sinTheta / normalLength
    ];
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

  // Create a truncated cone (cone with apex cut off)
  static createTruncatedCone(radiusBottom = 1, radiusTop = 0.5, height = 1, radialSegments = 8, heightSegments = 1, openEnded = false) {
    return new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded);
  }

  // Create a pyramid (cone with rectangular base)
  static createPyramid(width = 1, depth = 1, height = 1) {
    const geometry = new ConeGeometry();
    
    // Override the cone generation to create a pyramid
    geometry.vertices = [];
    geometry.normals = [];
    geometry.uvs = [];
    geometry.indices = [];
    geometry.tangents = [];

    const widthHalf = width / 2;
    const depthHalf = depth / 2;
    const heightHalf = height / 2;

    // Base vertices
    const baseVertices = [
      [-widthHalf, -heightHalf, -depthHalf],
      [widthHalf, -heightHalf, -depthHalf],
      [widthHalf, -heightHalf, depthHalf],
      [-widthHalf, -heightHalf, depthHalf]
    ];

    // Apex
    const apex = [0, heightHalf, 0];

    // Add base vertices
    for (const vertex of baseVertices) {
      geometry.vertices.push(...vertex);
      geometry.normals.push(0, -1, 0); // Base normal
    }

    // Add apex
    geometry.vertices.push(...apex);
    geometry.normals.push(0, 1, 0); // Apex normal

    // Base UVs
    for (let i = 0; i < 4; i++) {
      geometry.uvs.push(i % 2, Math.floor(i / 2));
    }
    geometry.uvs.push(0.5, 0.5); // Apex UV

    // Side faces
    const faceIndices = [
      [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4] // Faces connecting to apex
    ];

    for (const face of faceIndices) {
      geometry.indices.push(...face);
    }

    // Base triangle
    geometry.indices.push(0, 2, 1);
    geometry.indices.push(0, 3, 2);

    // Generate side normals for pyramid
    geometry._generatePyramidNormals();

    // Convert to typed arrays
    geometry.vertices = new Float32Array(geometry.vertices);
    geometry.normals = new Float32Array(geometry.normals);
    geometry.uvs = new Float32Array(geometry.uvs);
    geometry.indices = new Uint16Array(geometry.indices);
    geometry.tangents = new Float32Array(20); // 5 vertices * 4 components

    geometry._generateTangents();

    return geometry;
  }

  _generatePyramidNormals() {
    // Calculate normals for each face of the pyramid
    const vertices = this.vertices;
    const normals = this.normals;
    const indices = this.indices;

    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i];
      const i2 = indices[i + 1];
      const i3 = indices[i + 2];

      const v1 = [vertices[i1 * 3], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]];
      const v2 = [vertices[i2 * 3], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]];
      const v3 = [vertices[i3 * 3], vertices[i3 * 3 + 1], vertices[i3 * 3 + 2]];

      // Calculate face normal using cross product
      const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
      const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];

      const normal = [
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0]
      ];

      const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
      
      if (length > 0.000001) {
        normal[0] /= length;
        normal[1] /= length;
        normal[2] /= length;
      }

      // Set normal for all three vertices of this face
      normals[i1 * 3] = normal[0];
      normals[i1 * 3 + 1] = normal[1];
      normals[i1 * 3 + 2] = normal[2];

      normals[i2 * 3] = normal[0];
      normals[i2 * 3 + 1] = normal[1];
      normals[i2 * 3 + 2] = normal[2];

      normals[i3 * 3] = normal[0];
      normals[i3 * 3 + 1] = normal[1];
      normals[i3 * 3 + 2] = normal[2];
    }
  }

  // Get cone properties
  getRadius() {
    // Return base radius
    return Math.sqrt(this.vertices[0] * this.vertices[0] + this.vertices[2] * this.vertices[2]);
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
