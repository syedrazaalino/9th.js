/**
 * Engine module
 * Core engine functionality for Ninth.js
 */

import { WebGLRenderer } from './WebGLRenderer.js';
import { Scene } from './Scene.js';

export interface EngineConfig {
  antialias?: boolean;
  alpha?: boolean;
  depth?: boolean;
  stencil?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  failIfMajorPerformanceCaveat?: boolean;
  preserveDrawingBuffer?: boolean;
  renderer?: Partial<WebGLRenderer['options']>;
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private config: EngineConfig;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: any; // Will be Camera type when available
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;

  constructor(canvas: HTMLCanvasElement, config: EngineConfig = {}) {
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
    
    this.initialize();
  }

  private initialize(): void {
    try {
      // Initialize WebGL Renderer
      this.renderer = new WebGLRenderer(this.canvas, this.config.renderer);
      
      // Initialize Scene
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
  public start(): void {
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
  public stop(): void {
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
  private renderLoop = (currentTime: number = 0): void => {
    if (!this.isRunning) {
      return;
    }

    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / (currentTime - (this.lastTime - 1000)));
    }

    try {
      // Update scene
      this.scene.update(deltaTime);
      
      // Render scene if camera is available
      if (this.camera && this.scene.activeCamera) {
        this.renderer.render(this.scene, this.camera);
      } else if (this.scene.activeCamera) {
        this.renderer.render(this.scene, this.scene.activeCamera);
      }
    } catch (error) {
      console.error('Render error:', error);
      this.handleError(error as Error);
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Handle engine errors
   */
  private handleError(error: Error): void {
    console.error('Engine Error:', error);
    
    // Emit error event
    this.emit('error', { error });
    
    // Optionally stop engine on critical errors
    if (this.shouldStopOnError(error)) {
      this.stop();
    }
  }

  /**
   * Determine if engine should stop on this error
   */
  private shouldStopOnError(error: Error): boolean {
    // Stop on context loss
    if (error.message.includes('context')) {
      return true;
    }
    
    // Stop on WebGL errors
    if (error.message.includes('WebGL')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get the WebGL renderer
   */
  public getRenderer(): WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the current scene
   */
  public getScene(): Scene {
    return this.scene;
  }

  /**
   * Set the active camera
   */
  public setCamera(camera: any): void {
    this.camera = camera;
    if (this.scene) {
      this.scene.setActiveCamera(camera);
    }
  }

  /**
   * Get the active camera
   */
  public getCamera(): any {
    return this.camera || this.scene?.activeCamera;
  }

  /**
   * Resize the engine
   */
  public resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
    
    // Update camera aspect ratio if available
    const camera = this.getCamera();
    if (camera && camera.aspect !== undefined) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    
    this.emit('resized', { width, height });
  }

  /**
   * Enable/disable features
   */
  public enable(feature: string, enabled: boolean = true): void {
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
  public setMaxDistance(distance: number): void {
    this.renderer.maxDistance = distance;
  }

  /**
   * Get performance metrics
   */
  public getPerformance(): any {
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
  public clearPerformanceMetrics(): void {
    this.renderer.clearErrors();
    this.fps = 0;
    this.frameCount = 0;
  }

  /**
   * Set debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.renderer.setDebugMode(enabled);
    if (enabled) {
      console.log('Engine debug mode enabled');
    }
  }

  /**
   * Pause the engine
   */
  public pause(): void {
    this.scene.pause();
    console.log('Engine paused');
  }

  /**
   * Resume the engine
   */
  public resume(): void {
    this.scene.resume();
    console.log('Engine resumed');
  }

  /**
   * Check if engine is running
   */
  public isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Event system
   */
  private eventListeners: Map<string, Function[]> = new Map();

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any = {}): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
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
  public dispose(): void {
    console.log('Disposing Engine...');
    
    // Stop render loop
    this.stop();
    
    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Clear scene
    if (this.scene) {
      this.scene.dispose();
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear references
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    
    console.log('Engine disposed');
  }
}