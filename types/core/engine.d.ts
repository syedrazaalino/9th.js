/**
 * Engine Type Definitions
 * Core engine functionality for Ninth.js
 */

import { WebGLRenderer } from './renderer';
import { Scene } from './scene';

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

export interface PerformanceMetrics {
    fps: number;
    renderer: any;
    scene: {
        objects: number;
        cameras: number;
        lights: number;
    };
}

export interface EngineEventData {
    error?: { error: Error };
    width?: number;
    height?: number;
}

/**
 * Engine - Main Ninth.js engine class
 * 
 * Manages the render loop, scene management, and overall application state
 */
export declare class Engine {
    private canvas: HTMLCanvasElement;
    private config: EngineConfig;
    private renderer: WebGLRenderer;
    private scene: Scene;
    private camera: any;
    private isRunning: boolean;
    private animationFrameId: number | null;
    private lastTime: number;
    private frameCount: number;
    private fps: number;
    private eventListeners: Map<string, Function[]>;

    constructor(canvas: HTMLCanvasElement, config?: EngineConfig);

    /**
     * Start the render loop
     */
    start(): void;

    /**
     * Stop the render loop
     */
    stop(): void;

    /**
     * Get the WebGL renderer
     */
    getRenderer(): WebGLRenderer;

    /**
     * Get the current scene
     */
    getScene(): Scene;

    /**
     * Set the active camera
     */
    setCamera(camera: any): void;

    /**
     * Get the active camera
     */
    getCamera(): any;

    /**
     * Resize the engine
     */
    resize(width: number, height: number): void;

    /**
     * Enable/disable features
     */
    enable(feature: string, enabled?: boolean): void;

    /**
     * Set maximum render distance
     */
    setMaxDistance(distance: number): void;

    /**
     * Get performance metrics
     */
    getPerformance(): PerformanceMetrics;

    /**
     * Clear performance metrics
     */
    clearPerformanceMetrics(): void;

    /**
     * Set debug mode
     */
    setDebugMode(enabled: boolean): void;

    /**
     * Pause the engine
     */
    pause(): void;

    /**
     * Resume the engine
     */
    resume(): void;

    /**
     * Check if engine is running
     */
    isEngineRunning(): boolean;

    /**
     * Event system - Add event listener
     */
    on(event: string, callback: Function): void;

    /**
     * Event system - Remove event listener
     */
    off(event: string, callback: Function): void;

    /**
     * Dispose engine and cleanup resources
     */
    dispose(): void;
}