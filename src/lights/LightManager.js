/**
 * LightManager class
 * Central manager for efficient light management and rendering
 */

import { Light } from './Light.js';
import { LightGroup } from './LightGroup.js';
import { LightUniforms } from './LightUniforms.js';
import { LightType, requiresShadows, getMaxShadowResolution } from './LightTypes.js';

export class LightManager {
  constructor(options = {}) {
    this.id = LightManager._generateId();
    this.type = 'LightManager';
    
    // Configuration
    this.options = {
      maxLights: options.maxLights || 8,
      maxShadowMaps: options.maxShadowMaps || 4,
      shadowEnabled: options.shadowEnabled !== false,
      autoUpdate: options.autoUpdate !== false,
      frustumCulling: options.frustumCulling !== false,
      frustumCullingDistance: options.frustumCullingDistance || 100
    };
    
    // Light collections
    this.lights = [];
    this.groups = [];
    this.rootGroup = new LightGroup('Root');
    this.groups.push(this.rootGroup);
    
    // Performance tracking
    this.stats = {
      totalLights: 0,
      shadowCasters: 0,
      activeLights: 0,
      frustumCulled: 0,
      frameCount: 0,
      lastUpdate: performance.now()
    };
    
    // Light culling and optimization
    this.frustum = null;
    this.cullingDistance = this.options.frustumCullingDistance;
    
    // Uniform management
    this.uniforms = new LightUniforms(this.options.maxLights);
    this.uniformArray = new Array(this.options.maxLights).fill(null);
    
    // Shadow management
    this.shadowRenderer = null;
    this.shadowMaps = new Map();
    
    // Light events
    this.events = new Map();
    
    // Performance monitoring
    this.performance = {
      updateTime: 0,
      renderTime: 0,
      cullTime: 0
    };
    
    this._needsUpdate = true;
  }
  
  /**
   * Generate unique ID for manager instances
   */
  static _generateId() {
    return LightManager._idCounter++;
  }
  
  /**
   * Initialize static counter
   */
  static _idCounter = 1;
  
  /**
   * Add a light to the manager
   */
  addLight(light, group = null) {
    if (!light) return null;
    
    if (group) {
      group.add(light);
    } else {
      this.rootGroup.add(light);
    }
    
    this.lights.push(light);
    this._markDirty();
    
    // Fire add event
    this._fireEvent('lightAdded', { light });
    
    return light;
  }
  
  /**
   * Remove a light from the manager
   */
  removeLight(light) {
    const index = this.lights.indexOf(light);
    if (index === -1) return false;
    
    // Remove from groups
    this.groups.forEach(group => {
      group.remove(light);
    });
    
    this.lights.splice(index, 1);
    this._markDirty();
    
    // Fire remove event
    this._fireEvent('lightRemoved', { light });
    
    return true;
  }
  
  /**
   * Create and add a new light
   */
  createLight(type, options = {}) {
    let light;
    
    switch (type) {
      case LightType.AMBIENT:
        light = new AmbientLight(options.intensity, options.color);
        break;
      case LightType.DIRECTIONAL:
        light = new DirectionalLight(options.intensity, options.color, options.direction);
        break;
      case LightType.POINT:
        light = new PointLight(options.intensity, options.color, options.position, options.distance, options.decay);
        break;
      case LightType.SPOT:
        light = new SpotLight(options.intensity, options.color, options.position, options.target, options.angle, options.penumbra);
        break;
      case LightType.HEMISPHERE:
        light = new HemisphereLight(options.intensity, options.color, options.groundColor);
        break;
      case LightType.RECT_AREA:
        light = new RectAreaLight(options.intensity, options.color, options.width, options.height);
        break;
      case LightType.VOLUME:
        light = new VolumeLight(options.intensity, options.color, options.volumeSize, options.scattering);
        break;
      default:
        console.warn(`LightManager: Unknown light type ${type}`);
        return null;
    }
    
    return this.addLight(light);
  }
  
  /**
   * Add a light group
   */
  addGroup(group) {
    if (!group || group.type !== 'LightGroup') {
      console.warn('LightManager.addGroup: Object is not a LightGroup');
      return null;
    }
    
    this.groups.push(group);
    this._markDirty();
    
    // Fire add event
    this._fireEvent('groupAdded', { group });
    
    return group;
  }
  
  /**
   * Remove a light group
   */
  removeGroup(group) {
    const index = this.groups.indexOf(group);
    if (index === -1) return false;
    
    this.groups.splice(index, 1);
    this._markDirty();
    
    // Fire remove event
    this._fireEvent('groupRemoved', { group });
    
    return true;
  }
  
  /**
   * Get all lights of a specific type
   */
  getLightsByType(type) {
    return this.lights.filter(light => light.type === type);
  }
  
  /**
   * Get all shadow-casting lights
   */
  getShadowCasters() {
    return this.lights.filter(light => light.castShadow && requiresShadows(light.type));
  }
  
  /**
   * Get active lights (visible and within culling distance)
   */
  getActiveLights(camera = null) {
    let activeLights = this.lights.filter(light => {
      return light.visible;
    });
    
    // Apply frustum culling if enabled
    if (this.options.frustumCulling && camera && this.frustum) {
      activeLights = this._applyFrustumCulling(activeLights, camera);
    }
    
    return activeLights;
  }
  
  /**
   * Apply frustum culling to lights
   */
  _applyFrustumCulling(lights, camera) {
    const startTime = performance.now();
    let culledCount = 0;
    
    const culledLights = lights.filter(light => {
      // Skip non-position lights (ambient, hemisphere)
      if (!light.position) {
        return true;
      }
      
      const lightPos = light.position;
      const distance = this._getDistanceToCamera(lightPos, camera);
      
      // Cull if too far away
      if (distance > this.cullingDistance) {
        culledCount++;
        return false;
      }
      
      // Check frustum intersection if camera has frustum
      if (camera.frustum && !camera.frustum.intersectsPoint(lightPos)) {
        culledCount++;
        return false;
      }
      
      return true;
    });
    
    this.stats.frustumCulled = culledCount;
    this.performance.cullTime = performance.now() - startTime;
    
    return culledLights;
  }
  
  /**
   * Calculate distance from camera to point
   */
  _getDistanceToCamera(position, camera) {
    const cameraPos = camera.getWorldPosition();
    const dx = position.x - cameraPos.x;
    const dy = position.y - cameraPos.y;
    const dz = position.z - cameraPos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Update all lights and groups
   */
  update(deltaTime = 0, camera = null) {
    const startTime = performance.now();
    
    // Update all groups
    this.groups.forEach(group => {
      if (group.enabled && group.visible) {
        group.update(deltaTime);
      }
    });
    
    // Get active lights
    const activeLights = this.getActiveLights(camera);
    this.stats.activeLights = activeLights.length;
    
    // Update light arrays and uniforms
    if (this._needsUpdate || this.uniforms.dirty) {
      this._updateLightArrays(activeLights);
      this.uniforms.updateFromLights(activeLights);
      this._needsUpdate = false;
    }
    
    this.performance.updateTime = performance.now() - startTime;
    
    // Update stats
    this._updateStats();
    
    // Fire update event
    this._fireEvent('updated', {
      deltaTime,
      activeLights: activeLights.length,
      performance: this.performance
    });
  }
  
  /**
   * Update light arrays for rendering
   */
  _updateLightArrays(activeLights) {
    // Clear uniform array
    this.uniformArray.fill(null);
    
    // Update stats
    this.stats.totalLights = this.lights.length;
    this.stats.shadowCasters = this.getShadowCasters().length;
    
    // Populate uniform array
    let lightIndex = 0;
    activeLights.forEach(light => {
      if (lightIndex < this.options.maxLights) {
        this.uniformArray[lightIndex] = light;
        lightIndex++;
      }
    });
    
    // Set uniform counts
    this.uniforms.directionalCount = this.getLightsByType(LightType.DIRECTIONAL).length;
    this.uniforms.pointCount = this.getLightsByType(LightType.POINT).length;
    this.uniforms.spotCount = this.getLightsByType(LightType.SPOT).length;
  }
  
  /**
   * Update performance statistics
   */
  _updateStats() {
    this.stats.frameCount++;
    this.stats.lastUpdate = performance.now();
  }
  
  /**
   * Get performance statistics
   */
  getStats() {
    return { ...this.stats, ...this.performance };
  }
  
  /**
   * Set frustum for culling
   */
  setFrustum(frustum) {
    this.frustum = frustum;
  }
  
  /**
   * Set culling distance
   */
  setCullingDistance(distance) {
    this.cullingDistance = distance;
  }
  
  /**
   * Enable or disable shadows
   */
  setShadowEnabled(enabled) {
    this.options.shadowEnabled = enabled;
    this._markDirty();
  }
  
  /**
   * Enable or disable frustum culling
   */
  setFrustumCulling(enabled) {
    this.options.frustumCulling = enabled;
  }
  
  /**
   * Set performance monitoring
   */
  setPerformanceMonitoring(enabled) {
    this.options.performanceMonitoring = enabled;
  }
  
  /**
   * Find lights matching a predicate
   */
  findLights(predicate) {
    return this.lights.filter(predicate);
  }
  
  /**
   * Get lights within a radius of a position
   */
  getLightsInRadius(center, radius) {
    return this.lights.filter(light => {
      if (!light.position) return false;
      
      const dx = light.position.x - center.x;
      const dy = light.position.y - center.y;
      const dz = light.position.z - center.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      return distance <= radius;
    });
  }
  
  /**
   * Optimize lights for rendering
   */
  optimizeLights(performanceBudget = 'medium') {
    let maxActiveLights, shadowBudget;
    
    switch (performanceBudget) {
      case 'low':
        maxActiveLights = 4;
        shadowBudget = 2;
        break;
      case 'high':
        maxActiveLights = 16;
        shadowBudget = 8;
        break;
      case 'ultra':
        maxActiveLights = 32;
        shadowBudget = 16;
        break;
      default: // medium
        maxActiveLights = 8;
        shadowBudget = 4;
    }
    
    // Sort lights by importance (distance, intensity, shadow casting)
    const activeLights = this.getActiveLights();
    const sortedLights = activeLights.sort((a, b) => {
      // Priority: shadow casters > high intensity > low intensity
      const aShadow = a.castShadow ? 1 : 0;
      const bShadow = b.castShadow ? 1 : 0;
      
      if (aShadow !== bShadow) return bShadow - aShadow;
      
      return b.intensity - a.intensity;
    });
    
    // Limit active lights
    this.options.maxLights = Math.min(maxActiveLights, sortedLights.length);
    
    // Update light array
    this._updateLightArrays(sortedLights.slice(0, this.options.maxLights));
    
    // Update shadow budget
    const shadowCasters = this.getShadowCasters();
    shadowCasters.forEach((light, index) => {
      light.castShadow = index < shadowBudget;
    });
  }
  
  /**
   * Clear all lights and groups
   */
  clear() {
    // Dispose all lights
    this.lights.forEach(light => {
      if (light.dispose) {
        light.dispose();
      }
    });
    
    // Dispose all groups
    this.groups.forEach(group => {
      if (group.dispose) {
        group.dispose();
      }
    });
    
    // Reset collections
    this.lights = [];
    this.groups = [this.rootGroup];
    this.rootGroup.clear();
    
    // Clear uniforms
    this.uniforms.clear();
    this.uniformArray.fill(null);
    
    this._markDirty();
  }
  
  /**
   * Mark manager as needing update
   */
  _markDirty() {
    this._needsUpdate = true;
  }
  
  /**
   * Add event listener
   */
  addEventListener(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(event, callback) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Fire event
   */
  _fireEvent(event, data) {
    if (!this.events.has(event)) return;
    
    const listeners = this.events.get(event);
    listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('LightManager: Error in event callback:', error);
      }
    });
  }
  
  /**
   * Clone the light manager
   */
  clone() {
    const manager = new LightManager({
      maxLights: this.options.maxLights,
      maxShadowMaps: this.options.maxShadowMaps,
      shadowEnabled: this.options.shadowEnabled,
      autoUpdate: this.options.autoUpdate,
      frustumCulling: this.options.frustumCulling,
      frustumCullingDistance: this.options.frustumCullingDistance
    });
    
    // Clone groups and lights
    this.groups.forEach(group => {
      const clonedGroup = group.clone();
      manager.addGroup(clonedGroup);
    });
    
    return manager;
  }
  
  /**
   * Dispose manager resources
   */
  dispose() {
    this.clear();
    this.events.clear();
    this.shadowMaps.clear();
    
    // Dispose uniforms
    if (this.uniforms.dispose) {
      this.uniforms.dispose();
    }
  }
}
