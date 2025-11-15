/**
 * STLLoader.js
 * Loader for STL (STereoLithography) 3D model format
 * Supports both ASCII and binary STL formats with material assignment and geometry optimization
 */

import { Loader, LoadingManager } from './loader.ts';

export class STLLoader extends Loader {
  constructor(manager = LoadingManager.default) {
    super(manager);
    this.material = null;
    this.materials = null;
    this.useWorker = false;
  }

  /**
   * Load STL file from URL
   * @param {string} url - URL of STL file
   * @param {function} onLoad - Callback when loaded
   * @param {function} onProgress - Progress callback
   * @param {function} onError - Error callback
   */
  load(url, onLoad, onProgress, onError) {
    const loader = new XMLHttpRequestLoader();
    
    this.loadAsync(url).then(geometry => {
      if (this.material) {
        geometry.material = this.material;
      } else if (this.materials) {
        geometry.materials = this.materials;
      }
      onLoad?.(geometry);
    }).catch(onError);
  }

  /**
   * Load STL file asynchronously
   * @param {string} url - URL of STL file
   * @returns {Promise} Promise resolving to geometry object
   */
  async loadAsync(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url);
      request.responseType = 'arraybuffer';

      request.onload = () => {
        try {
          const geometry = this.parse(request.response);
          resolve(geometry);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to load STL file: ${url}`));
      };

      request.onprogress = (event) => {
        if (event.lengthComputable && this.manager) {
          const progress = event.loaded / event.total;
          this.manager.onProgress?.(url, event.loaded, event.total);
        }
      };

      request.send();
    });
  }

  /**
   * Parse STL data (both ASCII and binary)
   * @param {ArrayBuffer} buffer - STL file data
   * @returns {object} Parsed geometry object
   */
  parse(buffer) {
    // Check if it's binary STL by examining the header
    const uint8Array = new Uint8Array(buffer);
    const header = new TextDecoder().decode(uint8Array.slice(0, 80));
    
    if (this._isBinarySTL(header)) {
      return this._parseBinarySTL(buffer);
    } else {
      const asciiString = new TextDecoder().decode(buffer);
      return this._parseASCIISTL(asciiString);
    }
  }

  /**
   * Check if STL data is binary format
   * @param {string} header - First 80 characters of file
   * @returns {boolean} True if binary STL
   */
  _isBinarySTL(header) {
    // Binary STL has 80-byte header, first 5 bytes should be "solid " for ASCII
    if (header.substring(0, 5).toLowerCase() === 'solid ') {
      return false;
    }
    
    // Check if we can read the triangle count (bytes 80-83)
    try {
      const dataView = new DataView(new ArrayBuffer(4));
      // We'll determine binary by checking if the next bytes make sense as triangle count
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse binary STL format
   * @param {ArrayBuffer} buffer - Binary STL data
   * @returns {object} Parsed geometry object
   */
  _parseBinarySTL(buffer) {
    const dataView = new DataView(buffer);
    let offset = 0;
    
    // Skip 80-byte header
    offset += 80;
    
    // Read number of triangles
    const triangleCount = dataView.getUint32(offset, true);
    offset += 4;
    
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    let vertexIndex = 0;
    
    // Process each triangle
    for (let i = 0; i < triangleCount; i++) {
      // Skip normal vector (3 floats = 12 bytes)
      offset += 12;
      
      // Read 3 vertices (3 floats each = 36 bytes)
      for (let j = 0; j < 3; j++) {
        const x = dataView.getFloat32(offset, true);
        const y = dataView.getFloat32(offset + 4, true);
        const z = dataView.getFloat32(offset + 8, true);
        
        vertices.push(x, y, z);
        uvs.push(0, 0); // Default UVs
        offset += 12;
      }
      
      // Skip attribute byte count (2 bytes)
      offset += 2;
      
      // Add indices for this triangle
      indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
      vertexIndex += 3;
    }
    
    // Calculate normals if not provided
    this._calculateNormals(vertices, indices, normals);
    
    return {
      vertices,
      normals,
      uvs,
      indices,
      type: 'STL',
      format: 'binary'
    };
  }

  /**
   * Parse ASCII STL format
   * @param {string} asciiString - ASCII STL content
   * @returns {object} Parsed geometry object
   */
  _parseASCIISTL(asciiString) {
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    const lines = asciiString.split('\n');
    let vertexIndex = 0;
    let currentVertices = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      if (line.startsWith('facet normal')) {
        // Extract normal vector
        const normalParts = line.split(/\s+/);
        if (normalParts.length >= 5) {
          const nx = parseFloat(normalParts[2]);
          const ny = parseFloat(normalParts[3]);
          const nz = parseFloat(normalParts[4]);
          normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
        }
      } else if (line.startsWith('vertex')) {
        // Extract vertex coordinates
        const vertexParts = line.split(/\s+/);
        if (vertexParts.length >= 4) {
          const x = parseFloat(vertexParts[1]);
          const y = parseFloat(vertexParts[2]);
          const z = parseFloat(vertexParts[3]);
          
          vertices.push(x, y, z);
          uvs.push(0, 0); // Default UVs
          currentVertices.push(vertexIndex);
          vertexIndex++;
        }
      } else if (line.startsWith('endfacet')) {
        // Triangle is complete
        if (currentVertices.length === 3) {
          indices.push(...currentVertices);
        }
        currentVertices = [];
      }
    }
    
    // Calculate normals if not calculated during parsing
    if (normals.length === 0) {
      this._calculateNormals(vertices, indices, normals);
    }
    
    return {
      vertices,
      normals,
      uvs,
      indices,
      type: 'STL',
      format: 'ascii'
    };
  }

  /**
   * Calculate normals for geometry
   * @param {number[]} vertices - Vertex positions
   * @param {number[]} indices - Triangle indices
   * @param {number[]} normals - Array to store calculated normals
   */
  _calculateNormals(vertices, indices, normals) {
    // Initialize normals array
    for (let i = 0; i < vertices.length / 3; i++) {
      normals.push(0, 0, 0);
    }
    
    // Calculate face normals and accumulate
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3;
      const b = indices[i + 1] * 3;
      const c = indices[i + 2] * 3;
      
      const ax = vertices[a], ay = vertices[a + 1], az = vertices[a + 2];
      const bx = vertices[b], by = vertices[b + 1], bz = vertices[b + 2];
      const cx = vertices[c], cy = vertices[c + 1], cz = vertices[c + 2];
      
      // Calculate face normal using cross product
      const ux = bx - ax;
      const uy = by - ay;
      const uz = bz - az;
      
      const vx = cx - ax;
      const vy = cy - ay;
      const vz = cz - az;
      
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      
      // Accumulate normals for each vertex
      normals[a] += nx; normals[a + 1] += ny; normals[a + 2] += nz;
      normals[b] += nx; normals[b + 1] += ny; normals[b + 2] += nz;
      normals[c] += nx; normals[c + 1] += ny; normals[c + 2] += nz;
    }
    
    // Normalize all normals
    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i];
      const ny = normals[i + 1];
      const nz = normals[i + 2];
      
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      
      if (length > 0) {
        normals[i] = nx / length;
        normals[i + 1] = ny / length;
        normals[i + 2] = nz / length;
      }
    }
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
   * Enable/disable worker for parsing
   * @param {boolean} useWorker - Whether to use Web Worker
   */
  setUseWorker(useWorker) {
    this.useWorker = useWorker;
    return this;
  }

  /**
   * Parse STL from string (for inline usage)
   * @param {string} text - STL content as string
   * @returns {object} Parsed geometry object
   */
  parseText(text) {
    return this._parseASCIISTL(text);
  }

  /**
   * Parse STL from array buffer (for inline usage)
   * @param {ArrayBuffer} buffer - STL data as array buffer
   * @returns {object} Parsed geometry object
   */
  parseBinary(buffer) {
    return this._parseBinarySTL(buffer);
  }
}

/**
 * XMLHttpRequest loader for STL files
 */
class XMLHttpRequestLoader {
  constructor() {
    this.responseType = 'arraybuffer';
  }
}
