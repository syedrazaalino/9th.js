/**
 * LightGroup class
 * Manages collections of lights for efficient organization and rendering
 */

import { Light } from './Light.js';
import { LightType } from './LightTypes.js';

export class LightGroup {
  constructor(name = 'LightGroup') {
    this.id = LightGroup._generateId();
    this.name = name;
    this.type = 'LightGroup';
    
    // Light collections
    this.lights = [];
    this.children = [];
    
    // Performance optimization
    this._dirty = true;
    this._cache = {
      ambientLights: [],
      directionalLights: [],
      pointLights: [],
      spotLights: [],
      hemisphereLights: [],
      rectAreaLights: [],
      volumeLights: [],
      shadowsEnabled: false,
      shadowCasters: [],
      totalCount: 0
    };
    
    // Transformations
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.scale = { x: 1, y: 1, z: 1 };
    
    // Visibility
    this.visible = true;
    this.enabled = true;
    
    // Render optimization
    this.renderOrder = 0;
    this.frustumCulled = true;
  }
  
  /**
   * Generate unique ID for group instances
   */
  static _generateId() {
    return LightGroup._idCounter++;
  }
  
  /**
   * Initialize static counter
   */
  static _idCounter = 1;
  
  /**
   * Add a light to the group
   */
  add(light) {
    if (!light) return this;
    
    if (light.type === 'LightGroup') {
      return this.addChild(light);
    }
    
    if (!light.isLight && !(light instanceof Light)) {
      console.warn('LightGroup.add: Object is not a Light');
      return this;
    }
    
    const index = this.lights.indexOf(light);
    if (index !== -1) {
      console.warn('LightGroup.add: Light already in group');
      return this;
    }
    
    this.lights.push(light);
    this._markDirty();
    
    // Add to parent if it has one
    if (light.parent && light.parent !== this) {
      light.parent.remove(light);
    }
    light.parent = this;
    
    return this;
  }
  
  /**
   * Remove a light from the group
   */
  remove(light) {
    const index = this.lights.indexOf(light);
    if (index === -1) return this;
    
    this.lights.splice(index, 1);
    this._markDirty();
    
    if (light.parent === this) {
      light.parent = null;
    }
    
    return this;
  }
  
  /**
   * Add a child LightGroup
   */
  addChild(child) {
    if (!child || child === this) return this;
    
    if (child.type !== 'LightGroup') {
      console.warn('LightGroup.addChild: Object is not a LightGroup');
      return this;
    }
    
    const index = this.children.indexOf(child);
    if (index !== -1) {
      console.warn('LightGroup.addChild: Child already in group');
      return this;
    }
    
    this.children.push(child);
    this._markDirty();
    
    // Update parent references
    if (child.parent && child.parent !== this) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    
    return this;
  }
  
  /**
   * Remove a child LightGroup
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index === -1) return this;
    
    this.children.splice(index, 1);
    this._markDirty();
    
    if (child.parent === this) {
      child.parent = null;
    }
    
    return this;
  }
  
  /**
   * Get lights by type
   */
  getLightsByType(type) {
    this._updateCache();
    return this._cache[type.toLowerCase() + 's'] || [];
  }
  
  /**
   * Get all ambient lights
   */
  getAmbientLights() {
    this._updateCache();
    return this._cache.ambientLights;
  }
  
  /**
   * Get all directional lights
   */
  getDirectionalLights() {
    this._updateCache();
    return this._cache.directionalLights;
  }
  
  /**
   * Get all point lights
   */
  getPointLights() {
    this._updateCache();
    return this._cache.pointLights;
  }
  
  /**
   * Get all spot lights
   */
  getSpotLights() {
    this._updateCache();
    return this._cache.spotLights;
  }
  
  /**
   * Get all hemisphere lights
   */
  getHemisphereLights() {
    this._updateCache();
    return this._cache.hemisphereLights;
  }
  
  /**
   * Get all shadow-casting lights
   */
  getShadowCasters() {
    this._updateCache();
    return this._cache.shadowCasters;
  }
  
  /**
   * Check if any lights in the group cast shadows
   */
  hasShadows() {
    this._updateCache();
    return this._cache.shadowsEnabled;
  }
  
  /**
   * Get total number of lights
   */
  getLightCount() {
    this._updateCache();
    return this._cache.totalCount;
  }
  
  /**
   * Set visibility of the group
   */
  setVisible(visible) {
    this.visible = visible;
    this._markDirty();
  }
  
  /**
   * Enable or disable the group
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this._markDirty();
  }
  
  /**
   * Clear all lights from the group
   */
  clear() {
    // Remove from parent references
    this.lights.forEach(light => {
      if (light.parent === this) {
        light.parent = null;
      }
    });
    
    this.children.forEach(child => {
      if (child.parent === this) {
        child.parent = null;
      }
    });
    
    this.lights = [];
    this.children = [];
    this._markDirty();
  }
  
  /**
   * Find lights matching a predicate
   */
  findLights(predicate) {
    return this.lights.filter(predicate);
  }
  
  /**
   * Recursively find lights in group and children
   */
  findLightsRecursive(predicate) {
    const results = [];
    
    // Check current lights
    results.push(...this.findLights(predicate));
    
    // Check children
    this.children.forEach(child => {
      if (child.type === 'LightGroup') {
        results.push(...child.findLightsRecursive(predicate));
      }
    });
    
    return results;
  }
  
  /**
   * Get world position
   */
  getWorldPosition() {
    return { ...this.position };
  }
  
  /**
   * Update cache (performance optimization)
   */
  _updateCache() {
    if (!this._dirty) return;
    
    // Reset cache
    this._cache = {
      ambientLights: [],
      directionalLights: [],
      pointLights: [],
      spotLights: [],
      hemisphereLights: [],
      rectAreaLights: [],
      volumeLights: [],
      shadowsEnabled: false,
      shadowCasters: [],
      totalCount: 0
    };
    
    // Categorize lights
    this.lights.forEach(light => {
      if (!light.visible) return;
      
      const type = light.type;
      this._cache.totalCount++;
      
      switch (type) {
        case LightType.AMBIENT:
          this._cache.ambientLights.push(light);
          break;
        case LightType.DIRECTIONAL:
          this._cache.directionalLights.push(light);
          if (light.castShadow) {
            this._cache.shadowsEnabled = true;
            this._cache.shadowCasters.push(light);
          }
          break;
        case LightType.POINT:
          this._cache.pointLights.push(light);
          if (light.castShadow) {
            this._cache.shadowsEnabled = true;
            this._cache.shadowCasters.push(light);
          }
          break;
        case LightType.SPOT:
          this._cache.spotLights.push(light);
          if (light.castShadow) {
            this._cache.shadowsEnabled = true;
            this._cache.shadowCasters.push(light);
          }
          break;
        case LightType.HEMISPHERE:
          this._cache.hemisphereLights.push(light);
          break;
        case LightType.RECT_AREA:
          this._cache.rectAreaLights.push(light);
          break;
        case LightType.VOLUME:
          this._cache.volumeLights.push(light);
          break;
      }
    });
    
    // Include children's lights
    this.children.forEach(child => {
      if (child.type === 'LightGroup' && child.enabled && child.visible) {
        child._updateCache();
        
        // Merge child's cache into parent's
        Object.keys(child._cache).forEach(key => {
          if (Array.isArray(child._cache[key])) {
            this._cache[key].push(...child._cache[key]);
          } else {
            this._cache[key] = this._cache[key] || child._cache[key];
          }
        });
      }
    });
    
    this._dirty = false;
  }
  
  /**
   * Mark group as needing cache update
   */
  _markDirty() {
    this._dirty = true;
    
    // Mark parent groups as dirty if this group has a parent
    if (this.parent) {
      this.parent._markDirty();
    }
  }
  
  /**
   * Update all lights in the group
   */
  update(deltaTime = 0) {
    if (!this.enabled || !this.visible) return;
    
    // Update direct lights
    this.lights.forEach(light => {
      if (light.visible) {
        light.update(deltaTime);
      }
    });
    
    // Update children
    this.children.forEach(child => {
      if (child.type === 'LightGroup' && child.enabled) {
        child.update(deltaTime);
      }
    });
  }
  
  /**
   * Clone the light group
   */
  clone() {
    const group = new LightGroup(this.name);
    group.position = { ...this.position };
    group.rotation = { ...this.rotation };
    group.scale = { ...this.scale };
    group.visible = this.visible;
    group.enabled = this.enabled;
    group.renderOrder = this.renderOrder;
    group.frustumCulled = this.frustumCulled;
    
    // Clone lights
    this.lights.forEach(light => {
      const clonedLight = light.clone();
      group.add(clonedLight);
    });
    
    // Clone children
    this.children.forEach(child => {
      const clonedChild = child.clone();
      group.addChild(clonedChild);
    });
    
    return group;
  }
  
  /**
   * Dispose group resources
   */
  dispose() {
    // Dispose all lights
    this.lights.forEach(light => {
      if (light.dispose) {
        light.dispose();
      }
    });
    
    // Dispose children
    this.children.forEach(child => {
      if (child.dispose) {
        child.dispose();
      }
    });
    
    this.clear();
  }
}
