/**
 * BoxGeometry.js
 * Comprehensive box geometry with proper UV mapping, normals, and tangents
 */

export class BoxGeometry {
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.tangents = [];

    this._generateBox(width, height, depth, widthSegments, heightSegments, depthSegments);
  }

  _generateBox(width, height, depth, widthSegments, heightSegments, depthSegments) {
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    // Define the 6 faces of the cube
    const faces = [
      // Front face (z = +d)
      {
        normal: [0, 0, 1],
        vertices: [
          [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d]
        ],
        uvs: [
          [0, 0], [1, 0], [1, 1], [0, 1]
        ],
        indices: [0, 1, 2, 0, 2, 3]
      },
      // Back face (z = -d)
      {
        normal: [0, 0, -1],
        vertices: [
          [w, -h, -d], [-w, -h, -d], [-w, h, -d], [w, h, -d]
        ],
        uvs: [
          [0, 0], [1, 0], [1, 1], [0, 1]
        ],
        indices: [0, 1, 2, 0, 2, 3]
      },
      // Top face (y = +h)
      {
        normal: [0, 1, 0],
        vertices: [
          [-w, h, d], [w, h, d], [w, h, -d], [-w, h, -d]
        ],
        uvs: [
          [0, 0], [1, 0], [1, 1], [0, 1]
        ],
        indices: [0, 1, 2, 0, 2, 3]
      },
      // Bottom face (y = -h)
      {
        normal: [0, -1, 0],
        vertices: [
          [-w, -h, -d], [w, -h, -d], [w, -h, d], [-w, -h, d]
        ],
        uvs: [
          [0, 0], [1, 0], [1, 1], [0, 1]
        ],
        indices: [0, 1, 2, 0, 2, 3]
      },
      // Right face (x = +w)
      {
        normal: [1, 0, 0],
        vertices: [
          [w, -h, d], [w, -h, -d], [w, h, -d], [w, h, d]
        ],
        uvs: [
          [0, 0], [1, 0], [1, 1], [0, 1]
        ],
        indices: [0, 1, 2, 0, 2, 3]
      },
      // Left face (x = -w)
      {
        normal: [-1, 0, 0],
        vertices: [
          [-w, -h, -d], [-w, -h, d], [-w, h, d], [-w, h, -d]
        ],
        uvs: [
          [0, 0], [1, 0], [1, 1], [0, 1]
        ],
        indices: [0, 1, 2, 0, 2, 3]
      }
    ];

    const vertexIndex = 0;
    const uvIndex = 0;

    // Generate each face with appropriate segment mapping
    // Front face (z = +d) - uses widthSegments and heightSegments
    this._subdivideFace(faces[0].normal, faces[0].vertices, faces[0].uvs, faces[0].indices, widthSegments, heightSegments, depthSegments);
    
    // Back face (z = -d) - uses widthSegments and heightSegments
    this._subdivideFace(faces[1].normal, faces[1].vertices, faces[1].uvs, faces[1].indices, widthSegments, heightSegments, depthSegments);
    
    // Top face (y = +h) - uses widthSegments and depthSegments
    this._subdivideFace(faces[2].normal, faces[2].vertices, faces[2].uvs, faces[2].indices, widthSegments, depthSegments, heightSegments);
    
    // Bottom face (y = -h) - uses widthSegments and depthSegments
    this._subdivideFace(faces[3].normal, faces[3].vertices, faces[3].uvs, faces[3].indices, widthSegments, depthSegments, heightSegments);
    
    // Right face (x = +w) - uses depthSegments and heightSegments
    this._subdivideFace(faces[4].normal, faces[4].vertices, faces[4].uvs, faces[4].indices, depthSegments, heightSegments, widthSegments);
    
    // Left face (x = -w) - uses depthSegments and heightSegments
    this._subdivideFace(faces[5].normal, faces[5].vertices, faces[5].uvs, faces[5].indices, depthSegments, heightSegments, widthSegments);

    // Generate tangents for normal mapping (before converting to typed arrays)
    this._generateTangents();

    // Convert arrays to typed arrays for performance
    this.vertices = new Float32Array(this.vertices);
    this.normals = new Float32Array(this.normals);
    this.uvs = new Float32Array(this.uvs);
    this.indices = new Uint16Array(this.indices);
    this.tangents = new Float32Array(this.tangents);
  }

  _subdivideFace(normal, baseVertices, baseUVs, baseIndices, uSegments, vSegments, unused) {
    const uvs = [];
    const vertices = [];
    const normals = [];

    // Use the passed segment counts (already mapped correctly by caller)
    uSegments = Math.max(1, uSegments);
    vSegments = Math.max(1, vSegments);

    // Create vertex grid
    for (let i = 0; i <= uSegments; i++) {
      for (let j = 0; j <= vSegments; j++) {
        const u = i / uSegments;
        const v = j / vSegments;

        // Interpolate vertex position
        const vertex = this._lerpVertex(baseVertices, u, v);
        vertices.push(...vertex);

        // Add normal for each vertex
        normals.push(...normal);

        // Interpolate UVs
        const uv = this._lerpUV(baseUVs, u, v);
        uvs.push(...uv);
      }
    }

    // Create indices
    const uvsRow = vSegments + 1;
    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * uvsRow + j;
        const b = (i + 1) * uvsRow + j;
        const c = (i + 1) * uvsRow + (j + 1);
        const d = i * uvsRow + (j + 1);

        this.indices.push(a, b, d);
        this.indices.push(b, c, d);
      }
    }

    // Add vertices, normals, and UVs to main arrays
    this.vertices.push(...vertices);
    this.normals.push(...normals);
    this.uvs.push(...uvs);
  }

  _lerpVertex(vertices, u, v) {
    // Linear interpolation between 4 vertices
    const v1 = vertices[0];
    const v2 = vertices[1];
    const v3 = vertices[2];
    const v4 = vertices[3];

    // First interpolate along u
    const v12 = [
      this._lerp(v1[0], v2[0], u),
      this._lerp(v1[1], v2[1], u),
      this._lerp(v1[2], v2[2], u)
    ];

    const v34 = [
      this._lerp(v4[0], v3[0], u),
      this._lerp(v4[1], v3[1], u),
      this._lerp(v4[2], v3[2], u)
    ];

    // Then interpolate along v
    return [
      this._lerp(v12[0], v34[0], v),
      this._lerp(v12[1], v34[1], v),
      this._lerp(v12[2], v34[2], v)
    ];
  }

  _lerpUV(uvs, u, v) {
    // Linear interpolation between 4 UVs
    const uv1 = uvs[0];
    const uv2 = uvs[1];
    const uv3 = uvs[2];
    const uv4 = uvs[3];

    // First interpolate along u
    const uv12 = [
      this._lerp(uv1[0], uv2[0], u),
      this._lerp(uv1[1], uv2[1], u)
    ];

    const uv34 = [
      this._lerp(uv4[0], uv3[0], u),
      this._lerp(uv4[1], uv3[1], u)
    ];

    // Then interpolate along v
    return [
      this._lerp(uv12[0], uv34[0], v),
      this._lerp(uv12[1], uv34[1], v)
    ];
  }

  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Get vertex count
   */
  getVertexCount() {
    return this.vertices ? this.vertices.length / 3 : 0;
  }

  /**
   * Get triangle count
   */
  getTriangleCount() {
    return this.indices ? this.indices.length / 3 : 0;
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

    // Calculate tangents
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
        this.tangents.push(
          tangent[0] / length,
          tangent[1] / length,
          tangent[2] / length,
          1.0 // w component for handedness
        );
      } else {
        this.tangents.push(0, 0, 0, 1);
      }
    }
  }
}
