/**
 * PLYLoader.js
 * Loader for PLY (Polygon File Format) 3D model format
 * Supports ASCII and binary PLY with comprehensive property parsing and material assignment
 */

import { Loader, LoadingManager } from './loader.ts';

export class PLYLoader extends Loader {
  constructor(manager = LoadingManager.default) {
    super(manager);
    this.material = null;
    this.materials = null;
    this.useWorker = false;
    this.encoding = 'utf-8';
  }

  /**
   * Load PLY file from URL
   * @param {string} url - URL of PLY file
   * @param {function} onLoad - Callback when loaded
   * @param {function} onProgress - Progress callback
   * @param {function} onError - Error callback
   */
  load(url, onLoad, onProgress, onError) {
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
   * Load PLY file asynchronously
   * @param {string} url - URL of PLY file
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
        reject(new Error(`Failed to load PLY file: ${url}`));
      };

      request.onprogress = (event) => {
        if (event.lengthComputable && this.manager) {
          this.manager.onProgress?.(url, event.loaded, event.total);
        }
      };

      request.send();
    });
  }

  /**
   * Parse PLY data (both ASCII and binary)
   * @param {ArrayBuffer} buffer - PLY file data
   * @returns {object} Parsed geometry object
   */
  parse(buffer) {
    const decoder = new TextDecoder(this.encoding);
    const headerText = decoder.decode(new Uint8Array(buffer.slice(0, 1024)));
    
    const headerEnd = headerText.indexOf('end_header');
    if (headerEnd === -1) {
      throw new Error('Invalid PLY file: end_header not found');
    }

    const header = decoder.decode(new Uint8Array(buffer.slice(0, headerEnd + 10)));
    const headerLines = header.split('\n');
    
    const headerInfo = this._parseHeader(headerLines);
    
    let offset = headerEnd + 11; // Skip "end_header\n"
    
    if (headerInfo.format === 'ascii') {
      const asciiString = decoder.decode(new Uint8Array(buffer.slice(offset)));
      return this._parseASCIIPLY(asciiString, headerInfo);
    } else {
      return this._parseBinaryPLY(buffer, headerInfo, offset);
    }
  }

  /**
   * Parse PLY header information
   * @param {string[]} headerLines - Header lines from PLY file
   * @returns {object} Header information
   */
  _parseHeader(headerLines) {
    const header = {
      format: '',
      vertexCount: 0,
      faceCount: 0,
      vertexProperties: [],
      faceProperties: []
    };

    for (let i = 0; i < headerLines.length; i++) {
      const line = headerLines[i].trim();
      
      if (line.startsWith('format')) {
        const parts = line.split(/\s+/);
        header.format = parts[1];
        header.encoding = parts[2] || 'binary_little_endian';
      } else if (line.startsWith('element vertex')) {
        const parts = line.split(/\s+/);
        header.vertexCount = parseInt(parts[2]);
      } else if (line.startsWith('element face')) {
        const parts = line.split(/\s+/);
        header.faceCount = parseInt(parts[2]);
      } else if (line.startsWith('property') && !line.includes('face')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          header.vertexProperties.push({
            type: parts[1],
            name: parts[2],
            list: parts.length > 3
          });
        }
      } else if (line.startsWith('property') && line.includes('face')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          header.faceProperties.push({
            type: parts[1],
            name: parts[2],
            list: parts.length > 3
          });
        }
      } else if (line === 'end_header') {
        break;
      }
    }

    return header;
  }

  /**
   * Parse ASCII PLY format
   * @param {string} asciiString - ASCII PLY content
   * @param {object} headerInfo - Parsed header information
   * @returns {object} Parsed geometry object
   */
  _parseASCIIPLY(asciiString, headerInfo) {
    const lines = asciiString.split('\n');
    let lineIndex = 0;
    
    const vertices = [];
    const normals = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    const vertexData = {};
    
    // Initialize vertex data storage
    headerInfo.vertexProperties.forEach(prop => {
      vertexData[prop.name] = [];
    });

    // Parse vertices
    for (let i = 0; i < headerInfo.vertexCount; i++) {
      const vertexLine = lines[lineIndex++].trim();
      const values = vertexLine.split(/\s+/);
      
      headerInfo.vertexProperties.forEach((prop, propIndex) => {
        const value = this._parsePropertyValue(prop.type, values[propIndex]);
        vertexData[prop.name].push(value);
        
        // Store common properties in dedicated arrays
        if (prop.name === 'x' || prop.name === 'y' || prop.name === 'z') {
          vertices.push(value);
        } else if (prop.name === 'nx' || prop.name === 'ny' || prop.name === 'nz') {
          normals.push(value);
        } else if (prop.name === 's' || prop.name === 't') {
          uvs.push(value);
        } else if (prop.name === 'red' || prop.name === 'green' || prop.name === 'blue') {
          colors.push(value / 255); // Normalize to 0-1 range
        }
      });
    }

    // Parse faces
    for (let i = 0; i < headerInfo.faceCount; i++) {
      const faceLine = lines[lineIndex++].trim();
      const values = faceLine.split(/\s+/);
      
      if (values.length > 0) {
        const vertexCount = parseInt(values[0]);
        const faceIndices = values.slice(1, vertexCount + 1).map(v => parseInt(v));
        
        // Triangulate faces if they have more than 3 vertices
        if (vertexCount === 3) {
          indices.push(...faceIndices);
        } else if (vertexCount > 3) {
          // Simple fan triangulation
          for (let j = 1; j < vertexCount - 1; j++) {
            indices.push(faceIndices[0], faceIndices[j], faceIndices[j + 1]);
          }
        }
      }
    }

    // Generate default UVs if none provided
    if (uvs.length === 0) {
      for (let i = 0; i < vertices.length / 3; i++) {
        uvs.push(0, 0);
      }
    }

    // Calculate normals if not provided
    if (normals.length === 0) {
      this._calculateNormals(vertices, indices, normals);
    }

    return {
      vertices,
      normals,
      uvs,
      colors: colors.length > 0 ? colors : undefined,
      indices,
      properties: vertexData,
      type: 'PLY',
      format: headerInfo.format,
      vertexCount: headerInfo.vertexCount,
      faceCount: headerInfo.faceCount
    };
  }

  /**
   * Parse binary PLY format
   * @param {ArrayBuffer} buffer - Binary PLY data
   * @param {object} headerInfo - Parsed header information
   * @param {number} offset - Starting offset in buffer
   * @returns {object} Parsed geometry object
   */
  _parseBinaryPLY(buffer, headerInfo, offset) {
    const dataView = new DataView(buffer);
    const isLittleEndian = headerInfo.encoding.includes('little');
    
    const vertices = [];
    const normals = [];
    const uvs = [];
    const colors = [];
    const indices = [];
    const vertexData = {};
    
    // Initialize vertex data storage
    headerInfo.vertexProperties.forEach(prop => {
      vertexData[prop.name] = [];
    });

    // Parse vertices
    for (let i = 0; i < headerInfo.vertexCount; i++) {
      headerInfo.vertexProperties.forEach(prop => {
        const value = this._readBinaryProperty(dataView, offset, prop.type, isLittleEndian);
        offset += this._getPropertySize(prop.type);
        
        vertexData[prop.name].push(value);
        
        // Store common properties in dedicated arrays
        if (prop.name === 'x' || prop.name === 'y' || prop.name === 'z') {
          vertices.push(value);
        } else if (prop.name === 'nx' || prop.name === 'ny' || prop.name === 'nz') {
          normals.push(value);
        } else if (prop.name === 's' || prop.name === 't') {
          uvs.push(value);
        } else if (prop.name === 'red' || prop.name === 'green' || prop.name === 'blue') {
          colors.push(value / 255); // Normalize to 0-1 range
        }
      });
    }

    // Parse faces
    for (let i = 0; i < headerInfo.faceCount; i++) {
      // Read vertex count for this face (uint8)
      const vertexCount = dataView.getUint8(offset++);
      
      const faceIndices = [];
      for (let j = 0; j < vertexCount; j++) {
        faceIndices.push(dataView.getUint32(offset, isLittleEndian));
        offset += 4;
      }
      
      // Triangulate faces if they have more than 3 vertices
      if (vertexCount === 3) {
        indices.push(...faceIndices);
      } else if (vertexCount > 3) {
        // Simple fan triangulation
        for (let j = 1; j < vertexCount - 1; j++) {
          indices.push(faceIndices[0], faceIndices[j], faceIndices[j + 1]);
        }
      }
    }

    // Generate default UVs if none provided
    if (uvs.length === 0) {
      for (let i = 0; i < vertices.length / 3; i++) {
        uvs.push(0, 0);
      }
    }

    // Calculate normals if not provided
    if (normals.length === 0) {
      this._calculateNormals(vertices, indices, normals);
    }

    return {
      vertices,
      normals,
      uvs,
      colors: colors.length > 0 ? colors : undefined,
      indices,
      properties: vertexData,
      type: 'PLY',
      format: headerInfo.format,
      vertexCount: headerInfo.vertexCount,
      faceCount: headerInfo.faceCount
    };
  }

  /**
   * Parse property value based on type
   * @param {string} type - Property type
   * @param {string} value - String value to parse
   * @returns {number} Parsed numeric value
   */
  _parsePropertyValue(type, value) {
    switch (type) {
      case 'char':
      case 'int8':
        return parseInt(value);
      case 'uchar':
      case 'uint8':
        return parseInt(value);
      case 'short':
      case 'int16':
        return parseInt(value);
      case 'ushort':
      case 'uint16':
        return parseInt(value);
      case 'int':
      case 'int32':
        return parseInt(value);
      case 'uint':
      case 'uint32':
        return parseInt(value);
      case 'float':
      case 'float32':
        return parseFloat(value);
      case 'double':
      case 'float64':
        return parseFloat(value);
      default:
        return parseFloat(value);
    }
  }

  /**
   * Read binary property value
   * @param {DataView} dataView - Data view of buffer
   * @param {number} offset - Offset to read from
   * @param {string} type - Property type
   * @param {boolean} littleEndian - Whether to use little endian
   * @returns {number} Read value
   */
  _readBinaryProperty(dataView, offset, type, littleEndian) {
    switch (type) {
      case 'char':
      case 'int8':
        return dataView.getInt8(offset);
      case 'uchar':
      case 'uint8':
        return dataView.getUint8(offset);
      case 'short':
      case 'int16':
        return dataView.getInt16(offset, littleEndian);
      case 'ushort':
      case 'uint16':
        return dataView.getUint16(offset, littleEndian);
      case 'int':
      case 'int32':
        return dataView.getInt32(offset, littleEndian);
      case 'uint':
      case 'uint32':
        return dataView.getUint32(offset, littleEndian);
      case 'float':
      case 'float32':
        return dataView.getFloat32(offset, littleEndian);
      case 'double':
      case 'float64':
        return dataView.getFloat64(offset, littleEndian);
      default:
        return dataView.getFloat32(offset, littleEndian);
    }
  }

  /**
   * Get size of property type in bytes
   * @param {string} type - Property type
   * @returns {number} Size in bytes
   */
  _getPropertySize(type) {
    switch (type) {
      case 'char':
      case 'int8':
      case 'uchar':
      case 'uint8':
        return 1;
      case 'short':
      case 'int16':
      case 'ushort':
      case 'uint16':
        return 2;
      case 'int':
      case 'int32':
      case 'uint':
      case 'uint32':
      case 'float':
      case 'float32':
        return 4;
      case 'double':
      case 'float64':
        return 8;
      default:
        return 4;
    }
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
   * Set text encoding
   * @param {string} encoding - Text encoding
   */
  setEncoding(encoding) {
    this.encoding = encoding;
    return this;
  }

  /**
   * Parse PLY from string (for inline usage)
   * @param {string} text - PLY content as string
   * @returns {object} Parsed geometry object
   */
  parseText(text) {
    const headerEnd = text.indexOf('end_header');
    if (headerEnd === -1) {
      throw new Error('Invalid PLY file: end_header not found');
    }

    const header = text.substring(0, headerEnd + 10);
    const headerLines = header.split('\n');
    const headerInfo = this._parseHeader(headerLines);
    
    const content = text.substring(headerEnd + 11);
    return this._parseASCIIPLY(content, headerInfo);
  }
}
