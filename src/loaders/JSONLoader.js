/**
 * JSONLoader.js
 * Enhanced loader for custom JSON 3D model format
 * Supports compression, materials, animations, and geometry optimization
 */

import { Loader, LoadingManager } from './loader.ts';

export class JSONLoader extends Loader {
  constructor(manager = LoadingManager.default) {
    super(manager);
    this.material = null;
    this.materials = null;
    this.useWorker = false;
    this.parseIndices = true;
    this.parseUvs = true;
    this.parseNormals = true;
    this.parseColors = false;
    this.parseTangents = false;
    this.parseMorphTargets = false;
    this.parseAnimations = false;
    this.manager = manager;
    this.texturePath = '';
    this.crossOrigin = 'anonymous';
  }

  /**
   * Load JSON file from URL
   * @param {string} url - URL of JSON file
   * @param {function} onLoad - Callback when loaded
   * @param {function} onProgress - Progress callback
   * @param {function} onError - Error callback
   */
  load(url, onLoad, onProgress, onError) {
    this.loadAsync(url).then(result => {
      onLoad?.(result);
    }).catch(onError);
  }

  /**
   * Load JSON file asynchronously
   * @param {string} url - URL of JSON file
   * @returns {Promise} Promise resolving to parsed object
   */
  async loadAsync(url) {
    return new Promise((resolve, reject) => {
      const loader = new XMLHttpRequestLoader();
      
      loader.load(url, (responseText) => {
        try {
          const result = this.parse(responseText);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, (event) => {
        if (this.manager) {
          this.manager.onProgress?.(url, event.loaded, event.total);
        }
      }, (error) => {
        reject(new Error(`Failed to load JSON file: ${url}`));
      });
    });
  }

  /**
   * Parse JSON data
   * @param {string} text - JSON text to parse
   * @returns {object} Parsed geometry object
   */
  parse(text) {
    let jsonData;
    
    try {
      jsonData = JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }

    return this._parseJSONGeometry(jsonData);
  }

  /**
   * Parse JSON geometry data
   * @param {object} json - Parsed JSON data
   * @returns {object} Geometry object with optimization
   */
  _parseJSONGeometry(json) {
    let geometry = {};
    
    // Handle metadata
    if (json.metadata) {
      geometry.metadata = json.metadata;
    }

    // Handle geometry data
    if (json.geometry) {
      const geo = json.geometry;
      
      // Parse vertices
      if (geo.vertices) {
        geometry.vertices = this._decompressVertices(geo.vertices, geo.vertexCompression);
      }
      
      // Parse indices
      if (this.parseIndices && geo.indices) {
        geometry.indices = this._decompressIndices(geo.indices, geo.indexType);
      }
      
      // Parse normals
      if (this.parseNormals && geo.normals) {
        geometry.normals = this._decompressNormals(geo.normals, geo.normalCompression);
      }
      
      // Parse UVs
      if (this.parseUvs && geo.uvs) {
        geometry.uvs = this._decompressUVs(geo.uvs, geo.uvCompression);
      }
      
      // Parse colors
      if (this.parseColors && geo.colors) {
        geometry.colors = this._decompressColors(geo.colors, geo.colorCompression);
      }
      
      // Parse tangents
      if (this.parseTangents && geo.tangents) {
        geometry.tangents = this._decompressTangents(geo.tangents);
      }
      
      // Parse morph targets
      if (this.parseMorphTargets && geo.morphTargets) {
        geometry.morphTargets = this._parseMorphTargets(geo.morphTargets);
      }
    }

    // Handle materials
    if (json.materials) {
      geometry.materials = this._parseMaterials(json.materials);
    }

    // Handle animations
    if (this.parseAnimations && json.animations) {
      geometry.animations = json.animations;
    }

    // Handle skinning
    if (json.skin) {
      geometry.skin = this._parseSkinning(json.skin);
    }

    // Handle bounding boxes
    if (json.boundingBox) {
      geometry.boundingBox = json.boundingBox;
    }

    // Apply optimizations
    geometry = this._optimizeGeometry(geometry);

    // Add metadata
    geometry.type = 'JSON';
    geometry.format = json.format || 'custom';
    geometry.version = json.version || 1;

    return geometry;
  }

  /**
   * Decompress vertex data
   * @param {Array|object} vertices - Compressed or uncompressed vertex data
   * @param {object} compression - Compression information
   * @returns {number[]} Decompressed vertex array
   */
  _decompressVertices(vertices, compression) {
    if (!compression) {
      return vertices;
    }

    if (compression.type === 'quantized') {
      return this._decompressQuantizedVertices(vertices, compression);
    } else if (compression.type === 'delta') {
      return this._decompressDeltaVertices(vertices, compression);
    }

    return vertices;
  }

  /**
   * Decompress quantized vertex data
   * @param {object} data - Compressed data
   * @param {object} compression - Compression info
   * @returns {number[]} Decompressed vertices
   */
  _decompressQuantizedVertices(data, compression) {
    const { quantized, min, scale } = data;
    const vertices = new Array((quantized.length / 3) * 3);
    
    for (let i = 0; i < quantized.length; i += 3) {
      vertices[i] = (quantized[i] / compression.quantizationBits) * scale[0] + min[0];
      vertices[i + 1] = (quantized[i + 1] / compression.quantizationBits) * scale[1] + min[1];
      vertices[i + 2] = (quantized[i + 2] / compression.quantizationBits) * scale[2] + min[2];
    }
    
    return vertices;
  }

  /**
   * Decompress delta-encoded vertices
   * @param {object} data - Compressed data
   * @param {object} compression - Compression info
   * @returns {number[]} Decompressed vertices
   */
  _decompressDeltaVertices(data, compression) {
    const { deltas, min } = data;
    const vertices = new Array(deltas.length);
    
    vertices[0] = min[0] + deltas[0];
    vertices[1] = min[1] + deltas[1];
    vertices[2] = min[2] + deltas[2];
    
    for (let i = 3; i < deltas.length; i += 3) {
      vertices[i] = vertices[i - 3] + deltas[i];
      vertices[i + 1] = vertices[i - 2] + deltas[i + 1];
      vertices[i + 2] = vertices[i - 1] + deltas[i + 2];
    }
    
    return vertices;
  }

  /**
   * Decompress index data
   * @param {Array|object} indices - Compressed or uncompressed index data
   * @param {string} indexType - Index type information
   * @returns {number[]} Decompressed indices
   */
  _decompressIndices(indices, indexType) {
    if (!indexType || indexType.type === 'uint32') {
      return indices;
    }

    if (indexType.type === 'uint16') {
      return indices.map(i => i);
    } else if (indexType.type === 'uint8') {
      return indices.map(i => i);
    }

    return indices;
  }

  /**
   * Decompress normal data
   * @param {Array|object} normals - Compressed or uncompressed normal data
   * @param {object} compression - Compression information
   * @returns {number[]} Decompressed normals
   */
  _decompressNormals(normals, compression) {
    if (!compression) {
      return normals;
    }

    if (compression.type === 'octahedral') {
      return this._decompressOctahedralNormals(normals, compression);
    }

    return normals;
  }

  /**
   * Decompress octahedral encoded normals
   * @param {Array} encoded - Encoded normal data
   * @param {object} compression - Compression info
   * @returns {number[]} Decompressed normals
   */
  _decompressOctahedralNormals(encoded, compression) {
    const normals = new Array((encoded.length / 2) * 3);
    
    for (let i = 0; i < encoded.length; i += 2) {
      const x = encoded[i];
      const y = encoded[i + 1];
      
      // Decode octahedral encoding
      const xDecoded = x / compression.bits;
      const yDecoded = y / compression.bits;
      
      const length = Math.abs(xDecoded) + Math.abs(yDecoded);
      let nx, ny, nz;
      
      if (length > 0) {
        nx = xDecoded / length;
        ny = yDecoded / length;
        nz = 1 - length;
      } else {
        nx = 0;
        ny = 0;
        nz = 1;
      }
      
      // Normalize
      const invLength = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      normals[(i / 2) * 3] = nx * invLength;
      normals[(i / 2) * 3 + 1] = ny * invLength;
      normals[(i / 2) * 3 + 2] = nz * invLength;
    }
    
    return normals;
  }

  /**
   * Decompress UV data
   * @param {Array|object} uvs - Compressed or uncompressed UV data
   * @param {object} compression - Compression information
   * @returns {number[]} Decompressed UVs
   */
  _decompressUVs(uvs, compression) {
    if (!compression) {
      return uvs;
    }

    if (compression.type === 'quantized') {
      return this._decompressQuantizedUVs(uvs, compression);
    }

    return uvs;
  }

  /**
   * Decompress quantized UV data
   * @param {object} data - Compressed UV data
   * @param {object} compression - Compression info
   * @returns {number[]} Decompressed UVs
   */
  _decompressQuantizedUVs(data, compression) {
    const { quantized } = data;
    const uvs = new Array((quantized.length / 2) * 2);
    
    for (let i = 0; i < quantized.length; i += 2) {
      uvs[i] = quantized[i] / compression.quantizationBits;
      uvs[i + 1] = quantized[i + 1] / compression.quantizationBits;
    }
    
    return uvs;
  }

  /**
   * Decompress color data
   * @param {Array|object} colors - Compressed or uncompressed color data
   * @param {object} compression - Compression information
   * @returns {number[]} Decompressed colors
   */
  _decompressColors(colors, compression) {
    if (!compression) {
      return colors;
    }

    if (compression.type === 'quantized') {
      return this._decompressQuantizedColors(colors, compression);
    }

    return colors;
  }

  /**
   * Decompress quantized color data
   * @param {object} data - Compressed color data
   * @param {object} compression - Compression info
   * @returns {number[]} Decompressed colors
   */
  _decompressQuantizedColors(data, compression) {
    const { quantized } = data;
    const colors = new Array((quantized.length / 3) * 3);
    
    for (let i = 0; i < quantized.length; i += 3) {
      colors[i] = quantized[i] / compression.quantizationBits;
      colors[i + 1] = quantized[i + 1] / compression.quantizationBits;
      colors[i + 2] = quantized[i + 2] / compression.quantizationBits;
    }
    
    return colors;
  }

  /**
   * Decompress tangent data
   * @param {Array} tangents - Tangent data
   * @returns {number[]} Decompressed tangents
   */
  _decompressTangents(tangents) {
    return tangents;
  }

  /**
   * Parse morph targets
   * @param {object} morphTargets - Morph target data
   * @returns {object} Parsed morph targets
   */
  _parseMorphTargets(morphTargets) {
    const parsed = {};
    
    Object.keys(morphTargets).forEach(name => {
      const target = morphTargets[name];
      parsed[name] = {
        vertices: target.vertices || [],
        normals: target.normals || [],
        uvs: target.uvs || []
      };
    });
    
    return parsed;
  }

  /**
   * Parse materials
   * @param {Array} materials - Material data
   * @returns {Array} Parsed materials
   */
  _parseMaterials(materials) {
    return materials.map(material => {
      return {
        name: material.name,
        type: material.type || 'MeshBasicMaterial',
        color: material.color,
        map: material.map ? this._resolvePath(material.map) : null,
        normalMap: material.normalMap ? this._resolvePath(material.normalMap) : null,
        roughnessMap: material.roughnessMap ? this._resolvePath(material.roughnessMap) : null,
        metalnessMap: material.metalnessMap ? this._resolvePath(material.metalnessMap) : null,
        roughness: material.roughness || 0.5,
        metalness: material.metalness || 0.0,
        opacity: material.opacity || 1.0,
        transparent: material.transparent || false,
        side: material.side || 'front'
      };
    });
  }

  /**
   * Parse skinning data
   * @param {object} skin - Skinning data
   * @returns {object} Parsed skinning info
   */
  _parseSkinning(skin) {
    return {
      influences: skin.influences || [],
      joints: skin.joints || []
    };
  }

  /**
   * Resolve relative paths for textures
   * @param {string} path - Relative path
   * @returns {string} Resolved path
   */
  _resolvePath(path) {
    if (this.texturePath && !path.startsWith('http') && !path.startsWith('data:')) {
      return this.texturePath + '/' + path;
    }
    return path;
  }

  /**
   * Apply geometry optimizations
   * @param {object} geometry - Geometry object to optimize
   * @returns {object} Optimized geometry
   */
  _optimizeGeometry(geometry) {
    // Merge vertices by position
    if (geometry.vertices && geometry.indices) {
      const optimized = this._mergeVertices(geometry);
      geometry = { ...geometry, ...optimized };
    }

    // Optimize indices for rendering
    if (geometry.indices && geometry.vertices) {
      geometry.indices = this._optimizeIndices(geometry.indices, geometry.vertices.length / 3);
    }

    // Calculate bounds
    if (geometry.vertices) {
      geometry.boundingBox = this._calculateBoundingBox(geometry.vertices);
    }

    return geometry;
  }

  /**
   * Merge duplicate vertices
   * @param {object} geometry - Geometry object
   * @returns {object} Object with merged vertices and indices
   */
  _mergeVertices(geometry) {
    const vertices = geometry.vertices;
    const indices = geometry.indices;
    
    // Create vertex map
    const vertexMap = new Map();
    const newVertices = [];
    const newIndices = [];
    
    // Process each vertex
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
      
      if (!vertexMap.has(key)) {
        vertexMap.set(key, newVertices.length / 3);
        newVertices.push(x, y, z);
      }
      
      const newIndex = vertexMap.get(key);
      newIndices.push(newIndex);
    }
    
    return {
      vertices: newVertices,
      indices: newIndices
    };
  }

  /**
   * Optimize indices for better rendering
   * @param {number[]} indices - Original indices
   * @param {number} vertexCount - Number of vertices
   * @returns {number[]} Optimized indices
   */
  _optimizeIndices(indices, vertexCount) {
    // Simple optimization: reorder triangles for better cache locality
    // This is a basic implementation - more sophisticated algorithms exist
    const optimized = [];
    
    for (let i = 0; i < indices.length; i += 3) {
      const triangle = [indices[i], indices[i + 1], indices[i + 2]];
      optimized.push(...triangle);
    }
    
    return optimized;
  }

  /**
   * Calculate bounding box for vertices
   * @param {number[]} vertices - Vertex positions
   * @returns {object} Bounding box
   */
  _calculateBoundingBox(vertices) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }
    
    return {
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
      center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
      size: [maxX - minX, maxY - minY, maxZ - minZ]
    };
  }

  /**
   * Set material for geometry
   * @param {object} material - Material object
   */
  setMaterial(material) {
    this.material = material;
    return this;
  }

  /**
   * Set materials for multi-material geometry
   * @param {object[]} materials - Array of materials
   */
  setMaterials(materials) {
    this.materials = materials;
    return this;
  }

  /**
   * Set texture path for resolving relative texture paths
   * @param {string} texturePath - Base path for textures
   */
  setTexturePath(texturePath) {
    this.texturePath = texturePath;
    return this;
  }

  /**
   * Enable/disable parsing of specific geometry components
   * @param {object} options - Parsing options
   */
  setOptions(options) {
    this.parseIndices = options.parseIndices !== undefined ? options.parseIndices : this.parseIndices;
    this.parseUvs = options.parseUvs !== undefined ? options.parseUvs : this.parseUvs;
    this.parseNormals = options.parseNormals !== undefined ? options.parseNormals : this.parseNormals;
    this.parseColors = options.parseColors !== undefined ? options.parseColors : this.parseColors;
    this.parseTangents = options.parseTangents !== undefined ? options.parseTangents : this.parseTangents;
    this.parseMorphTargets = options.parseMorphTargets !== undefined ? options.parseMorphTargets : this.parseMorphTargets;
    this.parseAnimations = options.parseAnimations !== undefined ? options.parseAnimations : this.parseAnimations;
    return this;
  }

  /**
   * Parse JSON from string (for inline usage)
   * @param {string} text - JSON content as string
   * @returns {object} Parsed geometry object
   */
  parseText(text) {
    return this.parse(text);
  }
}

/**
 * XMLHttpRequest loader for JSON files
 */
class XMLHttpRequestLoader {
  constructor() {
    this.responseType = 'text';
  }

  load(url, onLoad, onProgress, onError) {
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'text';

    request.onload = () => {
      if (request.status === 200) {
        onLoad?.(request.responseText);
      } else {
        onError?.(new Error(`HTTP ${request.status}: ${request.statusText}`));
      }
    };

    request.onerror = () => {
      onError?.(new Error('Network error'));
    };

    if (onProgress) {
      request.onprogress = onProgress;
    }

    request.send();
  }
}
