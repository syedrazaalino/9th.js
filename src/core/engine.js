/**
 * Engine — optional high-level wrapper around WebGLRenderer + Scene + rAF loop
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
    this.renderer = new WebGLRenderer(this.canvas, this.config.renderer || this.config);
    this.scene = new Scene();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.renderLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  renderLoop = (currentTime = 0) => {
    if (!this.isRunning) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.frameCount++;
    if (this.frameCount % 60 === 0 && deltaTime > 0) {
      this.fps = Math.round(1 / deltaTime);
    }

    try {
      if (this.scene && this.scene.update) {
        this.scene.update(deltaTime);
      }
      const camera = this.camera || (this.scene && this.scene.activeCamera);
      if (camera && this.renderer) {
        this.renderer.render(this.scene, camera);
      }
    } catch (error) {
      console.error('Render error:', error);
      this.emit('error', { error });
    }

    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  getRenderer() {
    return this.renderer;
  }

  getScene() {
    return this.scene;
  }

  setCamera(camera) {
    this.camera = camera;
    if (this.scene && this.scene.setActiveCamera) {
      this.scene.setActiveCamera(camera);
    }
  }

  getCamera() {
    return this.camera || (this.scene && this.scene.activeCamera);
  }

  resize(width, height) {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
    const camera = this.getCamera();
    if (camera && camera.aspect !== undefined) {
      camera.aspect = width / height;
      if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();
    }
    this.emit('resized', { width, height });
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    const index = listeners.indexOf(callback);
    if (index !== -1) listeners.splice(index, 1);
  }

  emit(event, data = {}) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  dispose() {
    this.stop();
    if (this.renderer && this.renderer.dispose) this.renderer.dispose();
    if (this.scene && this.scene.dispose) this.scene.dispose();
    this.eventListeners.clear();
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

export default Engine;
