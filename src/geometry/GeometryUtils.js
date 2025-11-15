/**
 * Geometry Utilities and Optimizations
 * Provides functions for geometry processing, optimization, and spatial partitioning
 */

/**
 * Bounding box calculation
 */
function calculateBoundingBox(geometry) {
  const vertices = geometry.vertices;
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];

    min.x = Math.min(min.x, x);
    min.y = Math.min(min.y, y);
    min.z = Math.min(min.z, z);
    max.x = Math.max(max.x, x);
    max.y = Math.max(max.y, y);
    max.z = Math.max(max.z, z);
  }

  const center = {
    x: (min.x + max.x) / 2,
    y: (min.y + max.y) / 2,
    z: (min.z + max.z) / 2
  };

  const size = {
    x: max.x - min.x,
    y: max.y - min.y,
    z: max.z - min.z
  };

  return { min, max, center, size };
}

/**
 * Geometry cloning with deep copy
 */
function cloneGeometry(geometry) {
  const cloned = {
    vertices: new Float32Array(geometry.vertices),
    indices: null,
    normals: null,
    uvs: null
  };

  if (geometry.indices) {
    cloned.indices = geometry.indices.constructor === Uint16Array ?
      new Uint16Array(geometry.indices) :
      new Uint32Array(geometry.indices);
  }

  if (geometry.normals) {
    cloned.normals = new Float32Array(geometry.normals);
  }

  if (geometry.uvs) {
    cloned.uvs = new Float32Array(geometry.uvs);
  }

  return cloned;
}

/**
 * Geometry merging - combines multiple geometries
 */
function mergeGeometries(geometries) {
  if (!geometries || geometries.length === 0) {
    throw new Error('No geometries provided for merging');
  }

  const vertexOffsets = [];
  let totalVertices = 0;
  let totalIndices = 0;

  // Calculate total sizes
  for (const geom of geometries) {
    vertexOffsets.push(totalVertices);
    totalVertices += geom.vertices.length / 3;
    totalIndices += geom.indices ? geom.indices.length : 0;
  }

  const mergedVertices = new Float32Array(totalVertices * 3);
  const mergedNormals = new Float32Array(totalVertices * 3);
  const mergedUVs = new Float32Array(totalVertices * 2);
  const mergedIndices = new Uint32Array(totalIndices);

  let vertexOffset = 0;
  let indexOffset = 0;

  // Merge data
  for (let i = 0; i < geometries.length; i++) {
    const geom = geometries[i];
    
    // Copy vertices
    for (let j = 0; j < geom.vertices.length; j++) {
      mergedVertices[vertexOffset * 3 + j] = geom.vertices[j];
    }

    // Copy normals if available
    if (geom.normals) {
      for (let j = 0; j < geom.normals.length; j++) {
        mergedNormals[vertexOffset * 3 + j] = geom.normals[j];
      }
    }

    // Copy UVs if available
    if (geom.uvs) {
      for (let j = 0; j < geom.uvs.length; j++) {
        mergedUVs[vertexOffset * 2 + j] = geom.uvs[j];
      }
    }

    // Copy and offset indices
    if (geom.indices) {
      for (let j = 0; j < geom.indices.length; j++) {
        mergedIndices[indexOffset + j] = vertexOffset + geom.indices[j];
      }
      indexOffset += geom.indices.length;
    }

    vertexOffset += geom.vertices.length / 3;
  }

  return {
    vertices: mergedVertices,
    indices: mergedIndices,
    normals: mergedNormals,
    uvs: mergedUVs
  };
}

/**
 * Geometry optimization - removes duplicate vertices
 */
function optimizeGeometry(geometry, tolerance = 1e-6) {
  const vertices = geometry.vertices;
  const indices = geometry.indices;
  const normals = geometry.normals;
  const uvs = geometry.uvs;

  if (!indices || vertices.length === 0) {
    return geometry; // Cannot optimize without indices
  }

  const vertexMap = new Map();
  const newVertices = [];
  const newIndices = new indices.constructor(indices.length);
  
  let uniqueVertexCount = 0;

  // Find unique vertices
  for (let i = 0; i < vertices.length; i += 3) {
    const vx = vertices[i];
    const vy = vertices[i + 1];
    const vz = vertices[i + 2];
    
    const key = `${Math.round(vx / tolerance)}_${Math.round(vy / tolerance)}_${Math.round(vz / tolerance)}`;
    
    if (!vertexMap.has(key)) {
      vertexMap.set(key, uniqueVertexCount);
      newVertices.push(vx, vy, vz);
      uniqueVertexCount++;
    }
    
    newIndices[i / 3] = vertexMap.get(key);
  }

  // Create optimized geometry
  const optimized = {
    vertices: new Float32Array(newVertices),
    indices: newIndices,
    normals: null,
    uvs: null
  };

  // Recalculate normals if they exist
  if (normals) {
    optimized.normals = calculateNormals(optimized);
  }

  // Copy UVs if they exist
  if (uvs) {
    optimized.uvs = new Float32Array(uvs);
  }

  return optimized;
}

/**
 * Calculate vertex normals
 */
function calculateNormals(geometry) {
  const vertices = geometry.vertices;
  const indices = geometry.indices;

  const normals = new Float32Array(vertices.length);

  if (!indices) {
    // Calculate normals per face (flat shading)
    for (let i = 0; i < vertices.length; i += 9) {
      const v1x = vertices[i];
      const v1y = vertices[i + 1];
      const v1z = vertices[i + 2];
      const v2x = vertices[i + 3];
      const v2y = vertices[i + 4];
      const v2z = vertices[i + 5];
      const v3x = vertices[i + 6];
      const v3y = vertices[i + 7];
      const v3z = vertices[i + 8];

      const e1x = v2x - v1x;
      const e1y = v2y - v1y;
      const e1z = v2z - v1z;
      const e2x = v3x - v1x;
      const e2y = v3y - v1y;
      const e2z = v3z - v1z;

      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;

      normals[i] += nx;
      normals[i + 1] += ny;
      normals[i + 2] += nz;
      normals[i + 3] += nx;
      normals[i + 4] += ny;
      normals[i + 5] += nz;
      normals[i + 6] += nx;
      normals[i + 7] += ny;
      normals[i + 8] += nz;
    }
  } else {
    // Calculate smooth normals (per-vertex)
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;

      const v1x = vertices[i1];
      const v1y = vertices[i1 + 1];
      const v1z = vertices[i1 + 2];
      const v2x = vertices[i2];
      const v2y = vertices[i2 + 1];
      const v2z = vertices[i2 + 2];
      const v3x = vertices[i3];
      const v3y = vertices[i3 + 1];
      const v3z = vertices[i3 + 2];

      const e1x = v2x - v1x;
      const e1y = v2y - v1y;
      const e1z = v2z - v1z;
      const e2x = v3x - v1x;
      const e2y = v3y - v1y;
      const e2z = v3z - v1z;

      const nx = e1y * e2z - e1z * e2y;
      const ny = e1z * e2x - e1x * e2z;
      const nz = e1x * e2y - e1y * e2x;

      normals[i1] += nx;
      normals[i1 + 1] += ny;
      normals[i1 + 2] += nz;
      normals[i2] += nx;
      normals[i2 + 1] += ny;
      normals[i2 + 2] += nz;
      normals[i3] += nx;
      normals[i3 + 1] += ny;
      normals[i3 + 2] += nz;
    }
  }

  // Normalize normals
  for (let i = 0; i < normals.length; i += 3) {
    const x = normals[i];
    const y = normals[i + 1];
    const z = normals[i + 2];
    const length = Math.sqrt(x * x + y * y + z * z);

    if (length > 0) {
      normals[i] = x / length;
      normals[i + 1] = y / length;
      normals[i + 2] = z / length;
    }
  }

  return normals;
}

/**
 * Calculate tangent vectors for normal mapping
 */
function calculateTangents(geometry) {
  const vertices = geometry.vertices;
  const normals = geometry.normals || calculateNormals(geometry);
  const uvs = geometry.uvs;
  const indices = geometry.indices;

  if (!uvs) {
    throw new Error('UV coordinates required for tangent calculation');
  }

  const tangents = new Float32Array(vertices.length);
  const bitangents = new Float32Array(vertices.length);

  // Initialize accumulators
  for (let i = 0; i < tangents.length; i++) {
    tangents[i] = 0;
    bitangents[i] = 0;
  }

  if (!indices) {
    // Flat geometry
    for (let i = 0; i < vertices.length; i += 9) {
      processTriangle(i, i + 3, i + 6);
    }
  } else {
    // Indexed geometry
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;
      processTriangle(i1, i2, i3);
    }
  }

  function processTriangle(i1, i2, i3) {
    const v1 = { x: vertices[i1], y: vertices[i1 + 1], z: vertices[i1 + 2] };
    const v2 = { x: vertices[i2], y: vertices[i2 + 1], z: vertices[i2 + 2] };
    const v3 = { x: vertices[i3], y: vertices[i3 + 1], z: vertices[i3 + 2] };

    const uv1 = { x: uvs[(i1 / 3) * 2], y: uvs[(i1 / 3) * 2 + 1] };
    const uv2 = { x: uvs[(i2 / 3) * 2], y: uvs[(i2 / 3) * 2 + 1] };
    const uv3 = { x: uvs[(i3 / 3) * 2], y: uvs[(i3 / 3) * 2 + 1] };

    const x1 = v2.x - v1.x;
    const y1 = v2.y - v1.y;
    const z1 = v2.z - v1.z;
    const x2 = v3.x - v1.x;
    const y2 = v3.y - v1.y;
    const z2 = v3.z - v1.z;

    const s1 = uv2.x - uv1.x;
    const t1 = uv2.y - uv1.y;
    const s2 = uv3.x - uv1.x;
    const t2 = uv3.y - uv1.y;

    const denom = s1 * t2 - s2 * t1;
    if (Math.abs(denom) < 1e-10) return;

    const r = 1.0 / denom;

    const tangent = {
      x: (t2 * x1 - t1 * x2) * r,
      y: (t2 * y1 - t1 * y2) * r,
      z: (t2 * z1 - t1 * z2) * r
    };

    const bitangent = {
      x: (s1 * x2 - s2 * x1) * r,
      y: (s1 * y2 - s2 * y1) * r,
      z: (s1 * z2 - s2 * z1) * r
    };

    // Accumulate tangents and bitangents
    for (const vi of [i1, i2, i3]) {
      tangents[vi] += tangent.x;
      tangents[vi + 1] += tangent.y;
      tangents[vi + 2] += tangent.z;
      bitangents[vi] += bitangent.x;
      bitangents[vi + 1] += bitangent.y;
      bitangents[vi + 2] += bitangent.z;
    }
  }

  // Orthonormalize tangents
  for (let i = 0; i < tangents.length; i += 3) {
    const nx = normals[i];
    const ny = normals[i + 1];
    const nz = normals[i + 2];
    const tx = tangents[i];
    const ty = tangents[i + 1];
    const tz = tangents[i + 2];

    // Gram-Schmidt orthonormalize
    const dot = nx * tx + ny * ty + nz * tz;
    tangents[i] = tx - dot * nx;
    tangents[i + 1] = ty - dot * ny;
    tangents[i + 2] = tz - dot * nz;

    // Normalize
    const length = Math.sqrt(
      tangents[i] * tangents[i] +
      tangents[i + 1] * tangents[i + 1] +
      tangents[i + 2] * tangents[i + 2]
    );

    if (length > 0) {
      tangents[i] /= length;
      tangents[i + 1] /= length;
      tangents[i + 2] /= length;
    }

    // Calculate handedness
    const bx = bitangents[i];
    const by = bitangents[i + 1];
    const bz = bitangents[i + 2];
    const crossN = nx * ty * bz - nx * tz * by - ny * tx * bz + ny * tz * bx + nz * tx * by - nz * ty * bx;
    const w = crossN < 0 ? -1 : 1;

    // Store as 4D vector (x, y, z, w)
    tangents[i + 3] = w;
  }

  return tangents;
}

/**
 * Simple UV unwrapping (planar projection)
 */
function unwrapUVs(geometry, method = 'planar') {
  const vertices = geometry.vertices;
  const uvs = new Float32Array((vertices.length / 3) * 2);

  switch (method) {
    case 'planar':
      // Planar projection based on dominant axis
      let maxX = 0, maxY = 0, maxZ = 0;
      
      for (let i = 0; i < vertices.length; i += 3) {
        maxX = Math.max(maxX, Math.abs(vertices[i]));
        maxY = Math.max(maxY, Math.abs(vertices[i + 1]));
        maxZ = Math.max(maxZ, Math.abs(vertices[i + 2]));
      }

      // Project onto the dominant plane
      for (let i = 0; i < vertices.length; i += 3) {
        const uvi = i / 3 * 2;
        
        if (maxX >= maxY && maxX >= maxZ) {
          // Project on YZ plane
          uvs[uvi] = (vertices[i + 1] / (maxY || 1)) * 0.5 + 0.5;
          uvs[uvi + 1] = (vertices[i + 2] / (maxZ || 1)) * 0.5 + 0.5;
        } else if (maxY >= maxX && maxY >= maxZ) {
          // Project on XZ plane
          uvs[uvi] = (vertices[i] / (maxX || 1)) * 0.5 + 0.5;
          uvs[uvi + 1] = (vertices[i + 2] / (maxZ || 1)) * 0.5 + 0.5;
        } else {
          // Project on XY plane
          uvs[uvi] = (vertices[i] / (maxX || 1)) * 0.5 + 0.5;
          uvs[uvi + 1] = (vertices[i + 1] / (maxY || 1)) * 0.5 + 0.5;
        }
      }
      break;

    case 'cylindrical':
      // Cylindrical unwrapping
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        const z = vertices[i + 2];
        
        const uvi = i / 3 * 2;
        const angle = Math.atan2(z, x);
        
        uvs[uvi] = (angle / (Math.PI * 2)) * 0.5 + 0.5;
        uvs[uvi + 1] = (y / 2) * 0.5 + 0.5;
      }
      break;

    case 'spherical':
      // Spherical unwrapping
      const bounds = calculateBoundingBox(geometry);
      const radius = Math.max(bounds.size.x, bounds.size.y, bounds.size.z) / 2;

      for (let i = 0; i < vertices.length; i += 3) {
        const x = (vertices[i] - bounds.center.x) / radius;
        const y = (vertices[i + 1] - bounds.center.y) / radius;
        const z = (vertices[i + 2] - bounds.center.z) / radius;
        
        const uvi = i / 3 * 2;
        const r = Math.sqrt(x * x + y * y + z * z);
        
        if (r > 0) {
          const theta = Math.acos(y / r);
          const phi = Math.atan2(z, x);
          
          uvs[uvi] = phi / (Math.PI * 2) + 0.5;
          uvs[uvi + 1] = theta / Math.PI;
        } else {
          uvs[uvi] = 0;
          uvs[uvi + 1] = 0;
        }
      }
      break;

    default:
      throw new Error(`Unknown unwrapping method: ${method}`);
  }

  return uvs;
}

/**
 * Spatial partitioning for performance optimization
 */
class SpatialPartition {
  constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
    this.bounds = bounds; // { center: {x,y,z}, size: {x,y,z} }
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    this.objects = [];
    this.nodes = [];
  }

  clear() {
    this.objects.length = 0;
    for (let node of this.nodes) {
      node.clear();
    }
    this.nodes.length = 0;
  }

  split() {
    const nextLevel = this.level + 1;
    const subW = this.bounds.size.x / 2;
    const subH = this.bounds.size.y / 2;
    const subD = this.bounds.size.z / 2;

    const x = this.bounds.center.x;
    const y = this.bounds.center.y;
    const z = this.bounds.center.z;

    // 8 octants
    this.nodes[0] = new SpatialPartition({
      center: { x: x - subW / 2, y: y - subH / 2, z: z - subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[1] = new SpatialPartition({
      center: { x: x + subW / 2, y: y - subH / 2, z: z - subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[2] = new SpatialPartition({
      center: { x: x - subW / 2, y: y + subH / 2, z: z - subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[3] = new SpatialPartition({
      center: { x: x + subW / 2, y: y + subH / 2, z: z - subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[4] = new SpatialPartition({
      center: { x: x - subW / 2, y: y - subH / 2, z: z + subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[5] = new SpatialPartition({
      center: { x: x + subW / 2, y: y - subH / 2, z: z + subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[6] = new SpatialPartition({
      center: { x: x - subW / 2, y: y + subH / 2, z: z + subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);

    this.nodes[7] = new SpatialPartition({
      center: { x: x + subW / 2, y: y + subH / 2, z: z + subD / 2 },
      size: { x: subW, y: subH, z: subD }
    }, this.maxObjects, this.maxLevels, nextLevel);
  }

  getIndex(bounds) {
    let index = -1;
    const midX = this.bounds.center.x;
    const midY = this.bounds.center.y;
    const midZ = this.bounds.center.z;

    const minX = bounds.min.x;
    const minY = bounds.min.y;
    const minZ = bounds.min.z;
    const maxX = bounds.max.x;
    const maxY = bounds.max.y;
    const maxZ = bounds.max.z;

    const topQuadrant = maxY > midY;
    const bottomQuadrant = minY < midY;
    const leftQuadrant = minX < midX;
    const rightQuadrant = maxX > midX;
    const frontQuadrant = minZ < midZ;
    const backQuadrant = maxZ > midZ;

    if (bottomQuadrant) {
      if (leftQuadrant) {
        if (frontQuadrant) index = 0;
        else index = 4;
      } else if (rightQuadrant) {
        if (frontQuadrant) index = 1;
        else index = 5;
      }
    } else if (topQuadrant) {
      if (leftQuadrant) {
        if (frontQuadrant) index = 2;
        else index = 6;
      } else if (rightQuadrant) {
        if (frontQuadrant) index = 3;
        else index = 7;
      }
    }

    return index;
  }

  insert(object) {
    if (this.nodes.length > 0) {
      const index = this.getIndex(object.bounds);
      if (index !== -1) {
        this.nodes[index].insert(object);
        return;
      }
    }

    this.objects.push(object);

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i].bounds);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  retrieve(returnObjects, object) {
    const index = this.getIndex(object.bounds);
    if (index !== -1 && this.nodes.length > 0) {
      this.nodes[index].retrieve(returnObjects, object);
    } else if (this.nodes.length > 0) {
      // Check against multiple nodes
      for (let node of this.nodes) {
        if (node.bounds.max.x > object.bounds.min.x &&
            node.bounds.min.x < object.bounds.max.x &&
            node.bounds.max.y > object.bounds.min.y &&
            node.bounds.min.y < object.bounds.max.y &&
            node.bounds.max.z > object.bounds.min.z &&
            node.bounds.min.z < object.bounds.max.z) {
          node.retrieve(returnObjects, object);
        }
      }
    }

    returnObjects.push.apply(returnObjects, this.objects);
    return returnObjects;
  }
}

/**
 * Create spatial partition for geometry
 */
function createSpatialPartition(geometry, maxObjects = 10, maxLevels = 5) {
  const bounds = calculateBoundingBox(geometry);
  return new SpatialPartition({
    center: bounds.center,
    size: bounds.size
  }, maxObjects, maxLevels);
}

/**
 * Geometry LOD (Level of Detail) generation
 */
function generateLOD(geometry, levels = 3) {
  const lodLevels = [];
  
  for (let i = 0; i < levels; i++) {
    const lodGeometry = cloneGeometry(geometry);
    
    // Simplification factor based on level
    const factor = 1 - (i / levels) * 0.8; // Reduce up to 80% in highest level
    
    // Simplify by reducing vertex count
    const newVertexCount = Math.floor(geometry.vertices.length * factor);
    const simplifiedVertices = new Float32Array(newVertexCount);
    
    for (let j = 0; j < newVertexCount; j += 3) {
      const originalIndex = Math.floor((j / newVertexCount) * geometry.vertices.length);
      simplifiedVertices[j] = geometry.vertices[originalIndex];
      simplifiedVertices[j + 1] = geometry.vertices[originalIndex + 1];
      simplifiedVertices[j + 2] = geometry.vertices[originalIndex + 2];
    }
    
    lodGeometry.vertices = simplifiedVertices;
    
    // Recalculate normals
    if (geometry.normals) {
      lodGeometry.normals = calculateNormals(lodGeometry);
    }
    
    lodLevels.push({
      distance: i * 10, // Distance thresholds for switching
      geometry: lodGeometry
    });
  }
  
  return lodLevels;
}

/**
 * Frustum culling preparation
 */
function createBoundingSphere(geometry) {
  const bounds = calculateBoundingBox(geometry);
  const radius = Math.sqrt(
    Math.pow(bounds.size.x / 2, 2) +
    Math.pow(bounds.size.y / 2, 2) +
    Math.pow(bounds.size.z / 2, 2)
  );
  
  return {
    center: bounds.center,
    radius: radius
  };
}

/**
 * Geometry analytics and statistics
 */
function analyzeGeometry(geometry) {
  const stats = {
    vertexCount: geometry.vertices.length / 3,
    indexCount: geometry.indices ? geometry.indices.length : 0,
    triangleCount: geometry.indices ? geometry.indices.length / 3 : geometry.vertices.length / 9,
    hasNormals: !!geometry.normals,
    hasUVs: !!geometry.uvs,
    boundingBox: calculateBoundingBox(geometry),
    memoryUsage: {
      vertices: geometry.vertices.length * 4, // 4 bytes per float
      indices: geometry.indices ? geometry.indices.length * (geometry.indices.constructor === Uint16Array ? 2 : 4) : 0,
      normals: geometry.normals ? geometry.normals.length * 4 : 0,
      uvs: geometry.uvs ? geometry.uvs.length * 4 : 0
    }
  };
  
  // Calculate surface area
  stats.surfaceArea = calculateSurfaceArea(geometry);
  
  return stats;
}

/**
 * Calculate surface area of geometry
 */
function calculateSurfaceArea(geometry) {
  const vertices = geometry.vertices;
  const indices = geometry.indices;
  let area = 0;
  
  if (!indices) {
    // Flat geometry
    for (let i = 0; i < vertices.length; i += 9) {
      area += calculateTriangleArea(
        vertices[i], vertices[i + 1], vertices[i + 2],
        vertices[i + 3], vertices[i + 4], vertices[i + 5],
        vertices[i + 6], vertices[i + 7], vertices[i + 8]
      );
    }
  } else {
    // Indexed geometry
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;
      
      area += calculateTriangleArea(
        vertices[i1], vertices[i1 + 1], vertices[i1 + 2],
        vertices[i2], vertices[i2 + 1], vertices[i2 + 2],
        vertices[i3], vertices[i3 + 1], vertices[i3 + 2]
      );
    }
  }
  
  return area;
}

function calculateTriangleArea(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  const edge1x = x2 - x1;
  const edge1y = y2 - y1;
  const edge1z = z2 - z1;
  const edge2x = x3 - x1;
  const edge2y = y3 - y1;
  const edge2z = z3 - z1;
  
  const crossX = edge1y * edge2z - edge1z * edge2y;
  const crossY = edge1z * edge2x - edge1x * edge2z;
  const crossZ = edge1x * edge2y - edge1y * edge2x;
  
  return Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) * 0.5;
}

/**
 * Performance profiler for geometry operations
 */
class GeometryProfiler {
  constructor() {
    this.operations = [];
  }

  startOperation(name) {
    return {
      name,
      startTime: performance.now(),
      endTime: null
    };
  }

  endOperation(operation) {
    operation.endTime = performance.now();
    this.operations.push(operation);
  }

  getReport() {
    const report = {
      totalOperations: this.operations.length,
      totalTime: 0,
      operations: []
    };

    for (const op of this.operations) {
      const duration = op.endTime - op.startTime;
      report.totalTime += duration;
      report.operations.push({
        name: op.name,
        duration: duration,
        percentage: 0
      });
    }

    // Calculate percentages
    for (const op of report.operations) {
      op.percentage = report.totalTime > 0 ? (op.duration / report.totalTime) * 100 : 0;
    }

    return report;
  }

  clear() {
    this.operations.length = 0;
  }
}

export {
  calculateBoundingBox,
  cloneGeometry,
  mergeGeometries,
  optimizeGeometry,
  calculateNormals,
  calculateTangents,
  unwrapUVs,
  SpatialPartition,
  createSpatialPartition,
  generateLOD,
  createBoundingSphere,
  analyzeGeometry,
  calculateSurfaceArea,
  GeometryProfiler
};
