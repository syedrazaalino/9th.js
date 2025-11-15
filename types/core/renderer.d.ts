/**
 * WebGL Renderer Type Definitions
 * Core rendering functionality
 */

import { Scene } from './scene';
import { Camera } from './camera';

export interface WebGLRendererOptions {
    antialias?: boolean;
    alpha?: boolean;
    depth?: boolean;
    stencil?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    failIfMajorPerformanceCaveat?: boolean;
    preserveDrawingBuffer?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
}

export interface WebGLCapabilities {
    maxTextures: number;
    maxTextureSize: number;
    maxVertexAttribs: number;
    maxUniformVectors: number;
    maxVaryingVectors: number;
    supportsDepthTexture: boolean;
    supportsFloatTextures: boolean;
    supportsHalfFloatTextures: boolean;
    maxRenderbufferSize: number;
    maxVertexTextureImageUnits: number;
    textureCompressionSupport: {
        s3tc: boolean;
        etc1: boolean;
        etc2: boolean;
        astc: boolean;
    };
    webgl2: boolean;
    shaderPrecisionSupport: {
        highp: boolean;
        mediump: boolean;
        lowp: boolean;
    };
}

export interface WebGLError {
    error: string;
    stack?: string;
    timestamp: number;
}

export interface RendererPerformance {
    frameTime: number;
    renderTime: number;
    drawCalls: number;
    triangles: number;
    vertices: number;
    lastFrameTime: number;
    fps: number;
    memoryUsage: number;
}

/**
 * WebGLRenderer - Core WebGL rendering functionality
 */
export declare class WebGLRenderer {
    public canvas: HTMLCanvasElement;
    public context: WebGLRenderingContext;
    public options: WebGLRendererOptions;
    public maxDistance: number;
    public debugging: boolean;

    constructor(canvas: HTMLCanvasElement, options?: WebGLRendererOptions);

    /**
     * Initialize the renderer
     */
    init(): void;

    /**
     * Render a scene
     */
    render(scene: Scene, camera: Camera): void;

    /**
     * Set renderer size
     */
    setSize(width: number, height: number): void;

    /**
     * Get WebGL context
     */
    getContext(): WebGLRenderingContext;

    /**
     * Get renderer capabilities
     */
    getCapabilities(): WebGLCapabilities;

    /**
     * Get available features
     */
    getFeatures(): any;

    /**
     * Get any WebGL errors
     */
    getErrors(): WebGLError[];

    /**
     * Clear all accumulated errors
     */
    clearErrors(): void;

    /**
     * Set debug mode
     */
    setDebugMode(enabled: boolean): void;

    /**
     * Enable or disable a feature
     */
    enable(name: string, value?: boolean): void;

    /**
     * Get performance metrics
     */
    getPerformance(): RendererPerformance;

    /**
     * Generate a unique ID
     */
    generateId(): string;

    /**
     * Resize the renderer
     */
    resize(width: number, height: number): void;

    /**
     * Dispose renderer and cleanup resources
     */
    dispose(): void;
}