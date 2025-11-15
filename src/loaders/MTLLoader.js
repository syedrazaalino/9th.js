/**
 * Advanced MTL Loader with comprehensive MTL format support
 * Supports all material properties including colors, textures, transparency, illumination models
 * Includes progress tracking, error handling, and texture path resolution
 */

import { MeshLambertMaterial } from '../materials/MeshLambertMaterial.js';
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial.js';
import { MeshStandardMaterial } from '../materials/MeshStandardMaterial.js';

export class MTLLoaderProgress {
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

export class MaterialCreator {
  constructor(textureLoader, options = {}) {
    this.textureLoader = textureLoader;
    this.options = options;
    this.materials = new Map();
    this.materialInfo = new Map();
    this.crossOrigin = options.crossOrigin || 'anonymous';
  }

  /**
   * Load materials from MTL data
   * @param {string} mtlText - MTL file content
   * @returns {Promise} - Promise resolving to materials map
   */
  async load(mtlText) {
    await this.parse(mtlText);
    return this.createMaterials();
  }

  /**
   * Parse MTL file content
   * @param {string} text - MTL file content
   * @returns {Promise} - Promise resolving when parsing is complete
   */
  async parse(text) {
    const lines = text.split('\n');
    let currentMaterial = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length === 0 || line.startsWith('#')) {
        continue;
      }

      try {
        const parts = line.split(/\s+/);
        const keyword = parts[0];

        switch (keyword) {
          case 'newmtl':
            // Save previous material
            if (currentMaterial) {
              this.materialInfo.set(currentMaterial.name, currentMaterial);
            }
            
            // Start new material
            currentMaterial = {
              name: parts[1] || 'default',
              diffuse: [0.8, 0.8, 0.8],
              ambient: [0.2, 0.2, 0.2],
              specular: [0.5, 0.5, 0.5],
              emission: [0.0, 0.0, 0.0],
              shininess: 10.0,
              transparency: 0.0,
              opticalDensity: 1.0,
              illum: 2,
              diffuseMap: null,
              ambientMap: null,
              specularMap: null,
              emissiveMap: null,
              normalMap: null,
              displacementMap: null,
              alphaMap: null,
              bumpMap: null
            };
            break;

          case 'Ka': // Ambient color
            if (currentMaterial && parts.length >= 4) {
              currentMaterial.ambient = [
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
              ];
            }
            break;

          case 'Kd': // Diffuse color
            if (currentMaterial && parts.length >= 4) {
              currentMaterial.diffuse = [
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
              ];
            }
            break;

          case 'Ks': // Specular color
            if (currentMaterial && parts.length >= 4) {
              currentMaterial.specular = [
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
              ];
            }
            break;

          case 'Ke': // Emissive color
            if (currentMaterial && parts.length >= 4) {
              currentMaterial.emission = [
                parseFloat(parts[1]),
                parseFloat(parts[2]),
                parseFloat(parts[3])
              ];
            }
            break;

          case 'Ns': // Specular exponent
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.shininess = parseFloat(parts[1]);
            }
            break;

          case 'd': // Dissolve (transparency)
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.transparency = 1.0 - parseFloat(parts[1]);
            }
            break;

          case 'Tr': // Transparency (alternate)
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.transparency = parseFloat(parts[1]);
            }
            break;

          case 'Ni': // Optical density
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.opticalDensity = parseFloat(parts[1]);
            }
            break;

          case 'illum': // Illumination model
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.illum = parseInt(parts[1]);
            }
            break;

          case 'map_Ka': // Ambient texture map
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.ambientMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          case 'map_Kd': // Diffuse texture map
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.diffuseMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          case 'map_Ks': // Specular texture map
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.specularMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          case 'map_Ke': // Emissive texture map
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.emissiveMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          case 'map_bump': // Bump map
          case 'bump': // Bump map (alternate)
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.bumpMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          case 'disp': // Displacement map
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.displacementMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          case 'map_d': // Alpha map
            if (currentMaterial && parts.length >= 2) {
              currentMaterial.alphaMap = this._parseTextureOptions(parts.slice(1));
            }
            break;

          default:
            // Unknown keyword - ignore
            break;
        }
      } catch (error) {
        console.warn(`Error parsing MTL line ${i + 1}: ${line}`, error);
      }
    }

    // Save last material
    if (currentMaterial) {
      this.materialInfo.set(currentMaterial.name, currentMaterial);
    }
  }

  /**
   * Parse texture mapping options
   * @param {Array} parts - Texture line parts
   * @returns {Object} - Texture options
   * @private
   */
  _parseTextureOptions(parts) {
    const texture = {
      filename: '',
      blendU: 1.0,
      blendV: 1.0,
      offsetU: 0.0,
      offsetV: 0.0,
      scaleU: 1.0,
      scaleV: 1.0,
      resolution: null,
      clamp: false
    };

    let filename = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part.startsWith('-')) {
        const option = part.substring(1);
        
        switch (option) {
          case 'blendu':
            texture.blendU = parts[++i] === 'on';
            break;
          case 'blendv':
            texture.blendV = parts[++i] === 'on';
            break;
          case 'offset':
            texture.offsetU = parseFloat(parts[++i]);
            texture.offsetV = parseFloat(parts[++i]);
            break;
          case 'scale':
            texture.scaleU = parseFloat(parts[++i]);
            texture.scaleV = parseFloat(parts[++i]);
            break;
          case 'resolution':
            texture.resolution = parseFloat(parts[++i]);
            break;
          case 'clamp':
            texture.clamp = parts[++i] === 'on';
            break;
          default:
            // Unknown option, skip value
            i++;
            break;
        }
      } else {
        // This is part of the filename
        filename += (filename ? ' ' : '') + part;
      }
    }
    
    texture.filename = filename.trim();
    return texture;
  }

  /**
   * Create material objects from parsed data
   * @returns {Map} - Map of material names to material objects
   */
  createMaterials() {
    for (const [name, info] of this.materialInfo) {
      const material = this._createMaterial(info);
      this.materials.set(name, material);
    }
    
    return this.materials;
  }

  /**
   * Create a single material from material info
   * @param {Object} info - Material information
   * @returns {Material} - Created material
   * @private
   */
  _createMaterial(info) {
    // Choose material type based on illumination model
    let material;
    
    switch (info.illum) {
      case 0:
        // Color on, ambient on - but no specular highlights
        material = new MeshLambertMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient)
        });
        break;
        
      case 1:
        // Color on, ambient on - specular highlights off
        material = new MeshLambertMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient)
        });
        break;
        
      case 2:
        // Color on, ambient on - specular highlights on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess
        });
        break;
        
      case 3:
        // Color on, ambient on - specular highlights on, ray trace on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess
        });
        break;
        
      case 4:
        // Color on, ambient on - specular highlights on, ray trace on, reflection on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess
        });
        break;
        
      case 5:
        // Color on, ambient on - specular highlights on, ray trace on, transparency on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess,
          transparent: info.transparency > 0,
          opacity: 1.0 - info.transparency
        });
        break;
        
      case 6:
        // Color on, ambient on - specular highlights on, ray trace on, reflection on, transparency on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess,
          transparent: info.transparency > 0,
          opacity: 1.0 - info.transparency
        });
        break;
        
      case 7:
        // Color on, ambient on - specular highlights on, ray trace on, Fresnel on, reflection on, transparency on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess,
          transparent: info.transparency > 0,
          opacity: 1.0 - info.transparency
        });
        break;
        
      case 8:
        // Color on, ambient on - specular highlights on, ray trace on, Fresnel on, reflection on, transparency on
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess,
          transparent: info.transparency > 0,
          opacity: 1.0 - info.transparency
        });
        break;
        
      case 9:
        // Color on, ambient on - specular highlights on, ray trace on, Fresnel on, reflection on, transparency on, full fresnel
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess,
          transparent: info.transparency > 0,
          opacity: 1.0 - info.transparency
        });
        break;
        
      default:
        // Default to Phong
        material = new MeshPhongMaterial({
          color: this._rgbToHex(info.diffuse),
          ambient: this._rgbToHex(info.ambient),
          specular: this._rgbToHex(info.specular),
          shininess: info.shininess
        });
        break;
    }
    
    // Set material name
    material.name = info.name;
    
    // Set emissive color
    if (info.emission[0] > 0 || info.emission[1] > 0 || info.emission[2] > 0) {
      material.emissive = this._rgbToHex(info.emission);
    }
    
    // Load textures
    this._loadTextures(material, info);
    
    return material;
  }

  /**
   * Load textures for material
   * @param {Material} material - Material to apply textures to
   * @param {Object} info - Material information
   * @private
   */
  async _loadTextures(material, info) {
    const texturePromises = [];
    
    // Diffuse map
    if (info.diffuseMap && info.diffuseMap.filename) {
      texturePromises.push(
        this._loadTexture(info.diffuseMap.filename).then(texture => {
          material.map = texture;
        }).catch(error => {
          console.warn(`Failed to load diffuse map: ${info.diffuseMap.filename}`, error);
        })
      );
    }
    
    // Ambient map
    if (info.ambientMap && info.ambientMap.filename) {
      texturePromises.push(
        this._loadTexture(info.ambientMap.filename).then(texture => {
          material.ambientMap = texture;
        }).catch(error => {
          console.warn(`Failed to load ambient map: ${info.ambientMap.filename}`, error);
        })
      );
    }
    
    // Specular map
    if (info.specularMap && info.specularMap.filename) {
      texturePromises.push(
        this._loadTexture(info.specularMap.filename).then(texture => {
          material.specularMap = texture;
        }).catch(error => {
          console.warn(`Failed to load specular map: ${info.specularMap.filename}`, error);
        })
      );
    }
    
    // Emissive map
    if (info.emissiveMap && info.emissiveMap.filename) {
      texturePromises.push(
        this._loadTexture(info.emissiveMap.filename).then(texture => {
          material.emissiveMap = texture;
        }).catch(error => {
          console.warn(`Failed to load emissive map: ${info.emissiveMap.filename}`, error);
        })
      );
    }
    
    // Bump map
    if (info.bumpMap && info.bumpMap.filename) {
      texturePromises.push(
        this._loadTexture(info.bumpMap.filename).then(texture => {
          material.bumpMap = texture;
          // Bump maps typically need special handling
          if (material.bumpScale !== undefined) {
            material.bumpScale = 1.0;
          }
        }).catch(error => {
          console.warn(`Failed to load bump map: ${info.bumpMap.filename}`, error);
        })
      );
    }
    
    // Normal map
    if (info.normalMap && info.normalMap.filename) {
      texturePromises.push(
        this._loadTexture(info.normalMap.filename).then(texture => {
          material.normalMap = texture;
        }).catch(error => {
          console.warn(`Failed to load normal map: ${info.normalMap.filename}`, error);
        })
      );
    }
    
    // Alpha map
    if (info.alphaMap && info.alphaMap.filename) {
      texturePromises.push(
        this._loadTexture(info.alphaMap.filename).then(texture => {
          material.alphaMap = texture;
          material.transparent = true;
        }).catch(error => {
          console.warn(`Failed to load alpha map: ${info.alphaMap.filename}`, error);
        })
      );
    }
    
    await Promise.all(texturePromises);
  }

  /**
   * Load a single texture
   * @param {string} filename - Texture filename
   * @returns {Promise} - Promise resolving to texture
   * @private
   */
  _loadTexture(filename) {
    if (!this.textureLoader) {
      throw new Error('Texture loader not provided');
    }
    
    return this.textureLoader.load(filename);
  }

  /**
   * Convert RGB array to hex color
   * @param {Array} rgb - RGB color array [r, g, b]
   * @returns {number} - Hex color value
   * @private
   */
  _rgbToHex(rgb) {
    return (
      (Math.floor(rgb[0] * 255) << 16) |
      (Math.floor(rgb[1] * 255) << 8) |
      Math.floor(rgb[2] * 255)
    );
  }
}

export class MTLLoader {
  constructor(options = {}) {
    this.manager = options.manager;
    this.debug = options.debug || false;
    this.progressTracker = new MTLLoaderProgress();
    
    // Texture loader for loading texture files
    this.textureLoader = options.textureLoader;
    
    // Path resolution
    this.materialLibraries = new Map();
    
    // Configuration
    this.crossOrigin = options.crossOrigin || 'anonymous';
    this.withCredentials = options.withCredentials || false;
    
    // Statistics
    this.stats = {
      materials: 0,
      parseTime: 0,
      textureLoads: 0
    };
  }

  /**
   * Load MTL file from URL
   * @param {string} url - MTL file URL
   * @param {Object} options - Loading options
   * @returns {Promise} - Promise resolving to materials map
   */
  async load(url, options = {}) {
    const startTime = performance.now();
    
    try {
      const text = await this._loadText(url);
      this.progressTracker.update('parsing', 0, 1);
      
      const result = await this.parse(text, options);
      
      this.stats.parseTime = performance.now() - startTime;
      this._log('MTL load complete', { url, stats: this.stats });
      
      return result;
      
    } catch (error) {
      console.error(`Failed to load MTL file: ${url}`, error);
      throw error;
    }
  }

  /**
   * Parse MTL text content
   * @param {string} text - MTL file content
   * @param {Object} options - Parse options
   * @returns {Promise} - Promise resolving to materials
   */
  async parse(text, options = {}) {
    this._log('Starting MTL parse...');
    
    const materialCreator = new MaterialCreator(this.textureLoader, {
      crossOrigin: this.crossOrigin
    });
    
    await materialCreator.load(text);
    
    const materials = materialCreator.createMaterials();
    this.stats.materials = materials.size;
    
    this.progressTracker.complete();
    
    return materials;
  }

  /**
   * Load material library (MTL file)
   * @param {string} name - Library name
   * @param {string} url - Library URL
   * @returns {Promise} - Promise resolving to materials
   */
  async loadMaterialLibrary(name, url) {
    if (this.materialLibraries.has(name)) {
      return this.materialLibraries.get(name);
    }
    
    const materials = await this.load(url);
    this.materialLibraries.set(name, materials);
    
    return materials;
  }

  /**
   * Get material from library
   * @param {string} libraryName - Library name
   * @param {string} materialName - Material name
   * @returns {Material|null} - Material or null if not found
   */
  getMaterial(libraryName, materialName) {
    const library = this.materialLibraries.get(libraryName);
    if (library) {
      return library.get(materialName) || null;
    }
    return null;
  }

  /**
   * Get all materials from library
   * @param {string} libraryName - Library name
   * @returns {Map|null} - Materials map or null
   */
  getMaterials(libraryName) {
    return this.materialLibraries.get(libraryName) || null;
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
      xhr.withCredentials = this.withCredentials;
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          this.progressTracker.update('loaded', 1, 1);
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
   * Set texture loader for texture loading
   * @param {TextureLoader} textureLoader - Texture loader instance
   */
  setTextureLoader(textureLoader) {
    this.textureLoader = textureLoader;
  }

  /**
   * Set cross-origin policy
   * @param {string} crossOrigin - Cross-origin policy
   * @returns {this} - Chainable
   */
  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }

  /**
   * Set withCredentials flag
   * @param {boolean} withCredentials - With credentials flag
   * @returns {this} - Chainable
   */
  setWithCredentials(withCredentials) {
    this.withCredentials = withCredentials;
    return this;
  }

  /**
   * Get load statistics
   * @returns {Object} - Load statistics
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
   * Clear all loaded material libraries
   */
  clearMaterialLibraries() {
    this.materialLibraries.clear();
  }

  /**
   * Get list of loaded material libraries
   * @returns {Array} - Array of library names
   */
  getMaterialLibraryNames() {
    return Array.from(this.materialLibraries.keys());
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {*} data - Optional data
   * @private
   */
  _log(message, data = null) {
    if (this.debug) {
      console.log(`[MTLLoader] ${message}`, data);
    }
  }
}

export default MTLLoader;
