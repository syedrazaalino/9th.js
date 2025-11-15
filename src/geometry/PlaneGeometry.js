/**
 * PlaneGeometry.js
 * Comprehensive plane geometry with proper UV mapping, normals, and tangents
 */

export class PlaneGeometry {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    this.vertices = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this.tangents = [];

    this._generatePlane(width, height, widthSegments, heightSegments);
  }

  _generatePlane(width, height, widthSegments, heightSegments) {
    // Ensure minimum segments
    widthSegments = Math.max(1, Math.floor(widthSegments));
    heightSegments = Math.max(1, Math.floor(heightSegments));

    const w = width / 2;
    const h = height / 2;

    const vertices = (widthSegments + 1) * (heightSegments + 1);
    const indices = widthSegments * heightSegments * 6;

    // Generate vertices, normals, and UVs
    for (let y = 0; y <= heightSegments; y++) {
      const v = y / heightSegments;
      const posY = -h + v * height;

      for (let x = 0; x <= widthSegments; x++) {
        const u = x / widthSegments;
        const posX = -w + u * width;

        // Position (plane lies on XY plane, normal points in +Z direction)
        this.vertices.push(posX, posY, 0);

        // Normal (pointing up, +Z direction)
        this.normals.push(0, 0, 1);

        // UV mapping
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

        // Triangle 1: a-b-d
        this.indices.push(a, b, d);

        // Triangle 2: b-c-d
        this.indices.push(b, c, d);
      }
    }

    // Convert to typed arrays
    this.vertices = new Float32Array(this.vertices);
    this.normals = new Float32Array(this.normals);
    this.uvs = new Float32Array(this.uvs);
    this.indices = new Uint16Array(this.indices);
    this.tangents = new Float32Array(this.vertices.length);

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

  // Create a plane with different orientations
  static createXZPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    const plane = new PlaneGeometry(width, height, widthSegments, heightSegments);
    
    // Rotate vertices to lie on XZ plane instead of XY
    for (let i = 0; i < plane.vertices.length; i += 3) {
      const x = plane.vertices[i];
      const y = plane.vertices[i + 1];
      const z = plane.vertices[i + 2];
      
      plane.vertices[i] = x;
      plane.vertices[i + 1] = z;
      plane.vertices[i + 2] = -y;
    }
    
    // Adjust normals (pointing in +Y direction for XZ plane)
    for (let i = 0; i < plane.normals.length; i += 3) {
      plane.normals[i] = 0;
      plane.normals[i + 1] = 1;
      plane.normals[i + 2] = 0;
    }
    
    // Regenerate tangents for new orientation
    plane._generateTangents();
    
    return plane;
  }

  static createYZPlane(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    const plane = new PlaneGeometry(width, height, widthSegments, heightSegments);
    
    // Rotate vertices to lie on YZ plane instead of XY
    for (let i = 0; i < plane.vertices.length; i += 3) {
      const x = plane.vertices[i];
      const y = plane.vertices[i + 1];
      const z = plane.vertices[i + 2];
      
      plane.vertices[i] = -z;
      plane.vertices[i + 1] = y;
      plane.vertices[i + 2] = x;
    }
    
    // Adjust normals (pointing in +X direction for YZ plane)
    for (let i = 0; i < plane.normals.length; i += 3) {
      plane.normals[i] = 1;
      plane.normals[i + 1] = 0;
      plane.normals[i + 2] = 0;
    }
    
    // Regenerate tangents for new orientation
    plane._generateTangents();
    
    return plane;
  }

  // Get plane properties
  getWidth() {
    return Math.abs(this.vertices[0] - this.vertices[3]) * (Math.floor(this.vertices.length / 6) - 1);
  }

  getHeight() {
    return Math.abs(this.vertices[1] - this.vertices[4]);
  }

  getVertexCount() {
    return this.vertices.length / 3;
  }

  getTriangleCount() {
    return this.indices.length / 3;
  }
}
