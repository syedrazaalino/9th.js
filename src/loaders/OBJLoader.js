/**
 * Advanced OBJ Loader with comprehensive OBJ format support
 * Supports vertex positions, normals, UVs, faces, smoothing groups, groups, and objects
 * Includes progress tracking, error handling, and material integration
 */

import { BufferGeometry, VertexAttribute } from '../core/BufferGeometry.js';
import { Mesh } from '../core/Mesh.js';
import { Material } from '../core/Material.js';

export class OBJLoaderProgress {
  constructor() {
    this.listeners = new Map();
    this.currentPhase = 'parsing';
    this.lineNumber = 0;
    this.totalLines = 0;
    this.percentage = 0;
  }

  addListener(key, callback) {
    this.listeners.set(key, callback);
  }

  removeListener(key) {
    this.listeners.delete(key);
  }

  update(phase, lineNumber, totalLines) {
    this.currentPhase = phase;
    this.lineNumber = lineNumber;
    this.totalLines = totalLines;
    this.percentage = totalLines > 0 ? (lineNumber / totalLines) * 100 : 0;

    for (const callback of this.listeners.values()) {
      callback({
        phase: this.currentPhase,
        lineNumber: this.lineNumber,
        totalLines: this.totalLines,
        percentage: this.percentage
      });
    }
  }

  complete() {
    this.percentage = 100;
    for (const callback of this.listeners.values()) {
      callback({
        phase: 'complete',
        lineNumber: this.totalLines,
        totalLines: this.totalLines,
        percentage: 100
      });
    }
  }
}

export class OBJLoader {
  constructor(options = {}) {
    this.manager = options.manager;
    this.debug = options.debug || false;
    this.progressTracker = new OBJLoaderProgress();
    
    // Parser state
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.faces = [];
    this.groups = [];
    this.materials = new Map();
    
    // Current parsing state
    this.currentGroup = {
      name: 'default',
      material: null,
      startFace: 0,
      faceCount: 0
    };
    
    this.currentObject = {
      name: 'default',
      groups: []
    };
    
    // Configuration
    this.computeNormals = options.computeNormals !== undefined ? options.computeNormals : true;
    this.computeBoundingBox = options.computeBoundingBox !== undefined ? options.computeBoundingBox : true;
    this.flipY = options.flipY !== undefined ? options.flipY : false;
    
    // Statistics
    this.stats = {
      vertices: 0,
      faces: 0,
      groups: 0,
      objects: 0,
      parseTime: 0
    };
  }

  /**
   * Load OBJ file from URL
   * @param {string} url - OBJ file URL
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to mesh or group of meshes
   */
  async load(url, options = {}) {
    const startTime = performance.now();
    this._reset();
    
    try {
      const text = await this._loadText(url);
      const result = await this.parse(text, options);
      
      this.stats.parseTime = performance.now() - startTime;
      return result;
      
    } catch (error) {
      console.error(`Failed to load OBJ file: ${url}`, error);
      throw error;
    }
  }

  /**
   * Parse OBJ text content
   * @param {string} text - OBJ file content
   * @param {Object} options - Parse options
   * @returns {Promise} - Promise resolving to parsed geometry
   */
  async parse(text, options = {}) {
    this._reset();
    this._log('Starting OBJ parse...');
    
    const lines = text.split('\n');
    const totalLines = lines.length;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Progress update every 100 lines
      if (i % 100 === 0) {
        this.progressTracker.update('parsing', i, totalLines);
      }
      
      if (line.length === 0 || line.startsWith('#')) {
        continue;
      }
      
      try {
        this._parseLine(line);
      } catch (error) {
        console.warn(`Error parsing line ${i + 1}: ${line}`, error);
        // Continue parsing rather than failing completely
      }
    }
    
    this.progressTracker.update('building', totalLines, totalLines);
    
    // Build geometry
    const geometries = this._buildGeometries();
    
    this.progressTracker.complete();
    this._log('OBJ parse complete', this.stats);
    
    return geometries;
  }

  /**
   * Parse a single line of OBJ data
   * @param {string} line - OBJ line to parse
   * @private
   */
  _parseLine(line) {
    const parts = line.split(/\s+/);
    const keyword = parts[0];
    
    switch (keyword) {
      case 'v': // Vertex position
        this._parseVertex(parts);
        break;
        
      case 'vn': // Vertex normal
        this._parseNormal(parts);
        break;
        
      case 'vt': // Texture coordinate
        this._parseTexCoord(parts);
        break;
        
      case 'f': // Face
        this._parseFace(parts);
        break;
        
      case 'g': // Group
        this._parseGroup(parts);
        break;
        
      case 'o': // Object
        this._parseObject(parts);
        break;
        
      case 's': // Smoothing group
        this._parseSmoothingGroup(parts);
        break;
        
      case 'usemtl': // Use material
        this._parseUseMaterial(parts);
        break;
        
      case 'mtllib': // Material library
        this._parseMaterialLibrary(parts);
        break;
        
      default:
        // Unknown keyword - ignore
        break;
    }
  }

  /**
   * Parse vertex position
   * @param {Array} parts - Line parts
   * @private
   */
  _parseVertex(parts) {
    if (parts.length < 4) {
      throw new Error('Invalid vertex: insufficient coordinates');
    }
    
    const x = parseFloat(parts[1]);
    const y = parseFloat(parts[2]);
    const z = parseFloat(parts[3]);
    
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      throw new Error('Invalid vertex: non-numeric coordinates');
    }
    
    // Optional w coordinate for homogeneous coordinates
    const w = parts[4] ? parseFloat(parts[4]) : 1.0;
    
    this.vertices.push(x, y, z, w);
    this.stats.vertices++;
  }

  /**
   * Parse vertex normal
   * @param {Array} parts - Line parts
   * @private
   */
  _parseNormal(parts) {
    if (parts.length < 4) {
      throw new Error('Invalid normal: insufficient coordinates');
    }
    
    const x = parseFloat(parts[1]);
    const y = parseFloat(parts[2]);
    const z = parseFloat(parts[3]);
    
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      throw new Error('Invalid normal: non-numeric coordinates');
    }
    
    this.normals.push(x, y, z);
  }

  /**
   * Parse texture coordinate
   * @param {Array} parts - Line parts
   * @private
   */
  _parseTexCoord(parts) {
    if (parts.length < 3) {
      throw new Error('Invalid texture coordinate: insufficient values');
    }
    
    const u = parseFloat(parts[1]);
    const v = parts[2] ? parseFloat(parts[2]) : 0;
    const w = parts[3] ? parseFloat(parts[3]) : 0;
    
    if (isNaN(u) || isNaN(v) || isNaN(w)) {
      throw new Error('Invalid texture coordinate: non-numeric values');
    }
    
    // Flip V coordinate if requested
    const vCoord = this.flipY ? 1 - v : v;
    
    this.texCoords.push(u, vCoord, w);
  }

  /**
   * Parse face definition
   * @param {Array} parts - Line parts
   * @private
   */
  _parseFace(parts) {
    if (parts.length < 4) {
      throw new Error('Invalid face: must have at least 3 vertices');
    }
    
    const vertices = [];
    
    for (let i = 1; i < parts.length; i++) {
      const vertexDef = parts[i];
      const indices = this._parseVertexReference(vertexDef);
      vertices.push(indices);
    }
    
    // Create triangles from polygon
    for (let i = 1; i < vertices.length - 1; i++) {
      const face = {
        a: vertices[0],
        b: vertices[i],
        c: vertices[i + 1],
        material: this.currentGroup.material,
        smoothingGroup: this.currentGroup.smoothingGroup || 0
      };
      
      this.faces.push(face);
      this.currentGroup.faceCount++;
      this.stats.faces++;
    }
  }

  /**
   * Parse vertex reference (v, v/vt, v//vn, or v/vt/vn)
   * @param {string} ref - Vertex reference string
   * @returns {Object} - Vertex indices
   * @private
   */
  _parseVertexReference(ref) {
    const parts = ref.split('/');
    
    // Handle negative indices (relative to end)
    const getIndex = (index, max) => {
      if (index < 0) {
        return max + index;
      }
      return index - 1; // OBJ indices are 1-based
    };
    
    const vertexIndex = parts[0] ? parseInt(parts[0]) : 1;
    const texCoordIndex = parts[1] ? parseInt(parts[1]) : 0;
    const normalIndex = parts[2] ? parseInt(parts[2]) : 0;
    
    return {
      vertex: getIndex(vertexIndex, this.vertices.length / 4),
      texCoord: texCoordIndex !== 0 ? getIndex(texCoordIndex, this.texCoords.length / 3) : -1,
      normal: normalIndex !== 0 ? getIndex(normalIndex, this.normals.length / 3) : -1
    };
  }

  /**
   * Parse group definition
   * @param {Array} parts - Line parts
   * @private
   */
  _parseGroup(parts) {
    // End current group
    if (this.currentGroup.faceCount > 0) {
      this.groups.push({ ...this.currentGroup });
    }
    
    // Start new group
    this.currentGroup = {
      name: parts.slice(1).join(' ') || 'default',
      material: this.currentGroup.material,
      smoothingGroup: this.currentGroup.smoothingGroup || 0,
      startFace: this.faces.length,
      faceCount: 0
    };
    
    this.currentObject.groups.push(this.currentGroup.name);
    this.stats.groups++;
  }

  /**
   * Parse object definition
   * @param {Array} parts - Line parts
   * @private
   */
  _parseObject(parts) {
    // End current object
    if (this.currentObject.groups.length > 0) {
      this.objects.push({ ...this.currentObject });
    }
    
    // Start new object
    this.currentObject = {
      name: parts.slice(1).join(' ') || 'default',
      groups: []
    };
    
    this.stats.objects++;
  }

  /**
   * Parse smoothing group
   * @param {Array} parts - Line parts
   * @private
   */
  _parseSmoothingGroup(parts) {
    if (parts.length < 2) {
      return;
    }
    
    const value = parts[1];
    if (value === 'off') {
      this.currentGroup.smoothingGroup = 0;
    } else {
      const group = parseInt(value);
      if (!isNaN(group)) {
        this.currentGroup.smoothingGroup = group;
      }
    }
  }

  /**
   * Parse material usage
   * @param {Array} parts - Line parts
   * @private
   */
  _parseUseMaterial(parts) {
    if (parts.length < 2) {
      return;
    }
    
    this.currentGroup.material = parts[1];
  }

  /**
   * Parse material library reference
   * @param {Array} parts - Line parts
   * @private
   */
  _parseMaterialLibrary(parts) {
    if (parts.length < 2) {
      return;
    }
    
    const libraryPath = parts.slice(1).join(' ');
    this.materialLibraries = this.materialLibraries || [];
    this.materialLibraries.push(libraryPath);
  }

  /**
   * Build geometries from parsed data
   * @returns {Array} - Array of BufferGeometry objects
   * @private
   */
  _buildGeometries() {
    const geometries = [];
    
    // If no groups were defined, create a default group
    if (this.groups.length === 0 && this.faces.length > 0) {
      this.groups.push({
        name: 'default',
        material: null,
        smoothingGroup: 0,
        startFace: 0,
        faceCount: this.faces.length
      });
    }
    
    // Build geometry for each group
    for (const group of this.groups) {
      if (group.faceCount === 0) {
        continue;
      }
      
      const geometry = this._buildGeometry(group);
      geometry.userData.groupName = group.name;
      geometry.userData.material = group.material;
      geometries.push(geometry);
    }
    
    // Build geometries for each object
    for (const object of this.objects) {
      const objectGeometries = [];
      
      for (const groupName of object.groups) {
        const group = this.groups.find(g => g.name === groupName);
        if (group && group.faceCount > 0) {
          const geometry = this._buildGeometry(group);
          geometry.userData.groupName = group.name;
          geometry.userData.material = group.material;
          objectGeometries.push(geometry);
        }
      }
      
      if (objectGeometries.length > 0) {
        geometries.push(...objectGeometries);
      }
    }
    
    return geometries;
  }

  /**
   * Build a single geometry from a group
   * @param {Object} group - Group definition
   * @returns {BufferGeometry} - Built geometry
   * @private
   */
  _buildGeometry(group) {
    const positions = [];
    const normals = [];
    const texCoords = [];
    const indices = [];
    
    let vertexOffset = 0;
    const vertexMap = new Map(); // Map to handle shared vertices
    
    // Process faces in this group
    for (let i = group.startFace; i < group.startFace + group.faceCount; i++) {
      const face = this.faces[i];
      
      // Process triangle vertices
      const triangle = [face.a, face.b, face.c];
      
      for (const vertexRef of triangle) {
        // Create unique vertex key
        const key = `${vertexRef.vertex}_${vertexRef.normal}_${vertexRef.texCoord}`;
        
        let vertexIndex;
        if (vertexMap.has(key)) {
          vertexIndex = vertexMap.get(key);
        } else {
          // Add position
          const vIdx = vertexRef.vertex * 4;
          positions.push(
            this.vertices[vIdx],
            this.vertices[vIdx + 1],
            this.vertices[vIdx + 2]
          );
          
          // Add normal if available
          if (vertexRef.normal >= 0 && vertexRef.normal < this.normals.length / 3) {
            const nIdx = vertexRef.normal * 3;
            normals.push(
              this.normals[nIdx],
              this.normals[nIdx + 1],
              this.normals[nIdx + 2]
            );
          }
          
          // Add texture coordinate if available
          if (vertexRef.texCoord >= 0 && vertexRef.texCoord < this.texCoords.length / 3) {
            const tIdx = vertexRef.texCoord * 3;
            texCoords.push(
              this.texCoords[tIdx],
              this.texCoords[tIdx + 1],
              this.texCoords[tIdx + 2]
            );
          }
          
          vertexIndex = vertexOffset++;
          vertexMap.set(key, vertexIndex);
        }
        
        indices.push(vertexIndex);
      }
    }
    
    // Create BufferGeometry
    const geometry = new BufferGeometry();
    
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    
    if (normals.length > 0) {
      geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    } else if (this.computeNormals) {
      // Compute normals if not provided
      this._computeVertexNormals(geometry, indices);
    }
    
    if (texCoords.length > 0) {
      geometry.setAttribute('uv', new BufferAttribute(new Float32Array(texCoords), 2));
    }
    
    geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
    
    // Compute bounding box if requested
    if (this.computeBoundingBox && positions.length > 0) {
      geometry.computeBoundingBox();
    }
    
    return geometry;
  }

  /**
   * Compute vertex normals for geometry
   * @param {BufferGeometry} geometry - Geometry to compute normals for
   * @param {Array} indices - Vertex indices
   * @private
   */
  _computeVertexNormals(geometry, indices) {
    const positions = geometry.getAttribute('position').array;
    const normals = new Float32Array(positions.length);
    
    // Accumulate face normals
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3;
      const b = indices[i + 1] * 3;
      const c = indices[i + 2] * 3;
      
      const ax = positions[a], ay = positions[a + 1], az = positions[a + 2];
      const bx = positions[b], by = positions[b + 1], bz = positions[b + 2];
      const cx = positions[c], cy = positions[c + 1], cz = positions[c + 2];
      
      // Calculate face normal
      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;
      
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      
      // Add to vertex normals
      normals[a] += nx; normals[a + 1] += ny; normals[a + 2] += nz;
      normals[b] += nx; normals[b + 1] += ny; normals[b + 2] += nz;
      normals[c] += nx; normals[c + 1] += ny; normals[c + 2] += nz;
    }
    
    // Normalize
    for (let i = 0; i < normals.length; i += 3) {
      const nx = normals[i], ny = normals[i + 1], nz = normals[i + 2];
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      
      if (length > 0) {
        normals[i] /= length;
        normals[i + 1] /= length;
        normals[i + 2] /= length;
      }
    }
    
    geometry.setAttribute('normal', new BufferAttribute(normals, 3));
  }

  /**
   * Load text file via XHR
   * @param {string} url - File URL
   * @returns {Promise} - Promise resolving to text content
   * @private
   */
  _loadText(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'text';
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error(`Failed to load file: ${url}`));
      };
      
      xhr.send();
    });
  }

  /**
   * Reset parser state
   * @private
   */
  _reset() {
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    this.faces = [];
    this.groups = [];
    this.objects = [];
    this.materials.clear();
    this.materialLibraries = [];
    
    this.currentGroup = {
      name: 'default',
      material: null,
      smoothingGroup: 0,
      startFace: 0,
      faceCount: 0
    };
    
    this.currentObject = {
      name: 'default',
      groups: []
    };
    
    this.stats = {
      vertices: 0,
      faces: 0,
      groups: 0,
      objects: 0,
      parseTime: 0
    };
  }

  /**
   * Set material library loader (for integrating with MTLLoader)
   * @param {MTLLoader} mtlLoader - Material library loader
   */
  setMaterialLibrary(mtlLoader) {
    this.mtlLoader = mtlLoader;
  }

  /**
   * Get parse statistics
   * @returns {Object} - Parse statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Add progress listener
   * @param {string} key - Listener key
   * @param {Function} callback - Progress callback
   */
  addProgressListener(key, callback) {
    this.progressTracker.addListener(key, callback);
  }

  /**
   * Remove progress listener
   * @param {string} key - Listener key
   */
  removeProgressListener(key) {
    this.progressTracker.removeListener(key);
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {*} data - Optional data
   * @private
   */
  _log(message, data = null) {
    if (this.debug) {
      console.log(`[OBJLoader] ${message}`, data);
    }
  }
}

export default OBJLoader;
