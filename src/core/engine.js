/**
 * Engine module
 * Core engine functionality for Ninth.js
 * (Full feature set — JS build of the original Engine)
 */

import { WebGLRenderer } from './WebGLRenderer.js';
import { Scene } from './Scene.js';

export class Engine {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.config = {
      antialias: true,
      alpha: false,
      depth: true,
      stencil: false,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false,
      preserveDrawingBuffer: false,
      renderer: {},
      ...config
    };

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.isRunning = false;
    this.animationFrameId = null;
    this.lastTime = 0;
    this.frameCount = 0;
    this.fps = 60;
    this.eventListeners = new Map();

    this.initialize();
  }

  initialize() {
    try {
      this.renderer = new WebGLRenderer(this.canvas, this.config.renderer);
      this.scene = new Scene();

      console.log('Ninth.js Engine initialized successfully');
      console.log('WebGL Info:', this.renderer.getCapabilities());
    } catch (error) {
      console.error('Failed to initialize Engine:', error);
      throw error;
    }
  }

  /**
   * Start the render loop
   */
  start() {
    if (this.isRunning) {
      console.warn('Engine is already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();

    console.log('Engine render loop started');
    this.renderLoop();
  }

  /**
   * Stop the render loop
   */
  stop() {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('Engine render loop stopped');
  }

  /**
   * Main render loop
   */
  renderLoop = (currentTime = 0) => {
    if (!this.isRunning) {
      return;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / (currentTime - (this.lastTime - 1000)));
    }

    try {
      this.scene.update(deltaTime);

      if (this.camera && this.scene.activeCamera) {
        this.renderer.render(this.scene, this.camera);
      } else if (this.scene.activeCamera) {
        this.renderer.render(this.scene, this.scene.activeCamera);
      } else if (this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.error('Render error:', error);
      this.handleError(error);
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Handle engine errors
   */
  handleError(error) {
    console.error('Engine Error:', error);

    this.emit('error', { error });

    if (this.shouldStopOnError(error)) {
      this.stop();
    }
  }

  /**
   * Determine if engine should stop on this error
   */
  shouldStopOnError(error) {
    if (error.message && error.message.includes('context')) {
      return true;
    }

    if (error.message && error.message.includes('WebGL')) {
      return true;
    }

    return false;
  }

  /**
   * Get the WebGL renderer
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Get the current scene
   */
  getScene() {
    return this.scene;
  }

  /**
   * Set the active camera
   */
  setCamera(camera) {
    this.camera = camera;
    if (this.scene) {
      this.scene.setActiveCamera(camera);
    }
  }

  /**
   * Get the active camera
   */
  getCamera() {
    return this.camera || (this.scene && this.scene.activeCamera);
  }

  /**
   * Resize the engine
   */
  resize(width, height) {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }

    const camera = this.getCamera();
    if (camera && camera.aspect !== undefined) {
      camera.aspect = width / height;
      if (camera.updateProjectionMatrix) {
        camera.updateProjectionMatrix();
      }
    }

    this.emit('resized', { width, height });
  }

  /**
   * Enable/disable features
   */
  enable(feature, enabled = true) {
    switch (feature) {
      case 'frustum_culling':
        this.renderer.enable('frustum_culling', enabled);
        break;
      case 'distance_culling':
        this.renderer.enable('distance_culling', enabled);
        break;
      case 'occlusion_culling':
        this.renderer.enable('occlusion_culling', enabled);
        break;
      case 'pixel_ratio':
        this.renderer.enable('pixel_ratio', enabled);
        break;
      default:
        console.warn(`Unknown feature: ${feature}`);
    }
  }

  /**
   * Set maximum render distance
   */
  setMaxDistance(distance) {
    this.renderer.maxDistance = distance;
  }

  /**
   * Get performance metrics
   */
  getPerformance() {
    return {
      fps: this.fps,
      renderer: this.renderer.getPerformance(),
      scene: {
        objects: this.scene.getAllObjects().length,
        cameras: this.scene.cameras.length,
        lights: this.scene.lights.length
      }
    };
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics() {
    this.renderer.clearErrors();
    this.fps = 0;
    this.frameCount = 0;
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled) {
    this.renderer.setDebugMode(enabled);
    if (enabled) {
      console.log('Engine debug mode enabled');
    }
  }

  /**
   * Pause the engine
   */
  pause() {
    this.scene.pause();
    console.log('Engine paused');
  }

  /**
   * Resume the engine
   */
  resume() {
    this.scene.resume();
    console.log('Engine resumed');
  }

  /**
   * Check if engine is running
   */
  isEngineRunning() {
    return this.isRunning;
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data = {}) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Dispose engine and cleanup resources
   */
  dispose() {
    console.log('Disposing Engine...');

    this.stop();

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.scene) {
      this.scene.dispose();
    }

    this.eventListeners.clear();

    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    console.log('Engine disposed');
  }
}

export default Engine;
