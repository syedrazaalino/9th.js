/**
 * HDRRendering TypeScript Definitions
 * Type definitions for the High Dynamic Range Rendering Pipeline
 */

import { WebGLRenderer, WebGLCapabilities } from '../core/WebGLRenderer.js';
import { Scene } from '../core/Scene.js';
import { Camera } from '../core/Camera.js';

export type ToneMappingOperator = 'ACES' | 'Reinhard' | 'Filmic' | 'Uncharted2';

export interface HDRSettings {
    enabled: boolean;
    exposure: number;
    minExposure: number;
    maxExposure: number;
    toneMapping: ToneMappingOperator;
    gamma: number;
    autoExposure: boolean;
    adaptationSpeed: number;
    bloomEnabled: boolean;
    bloomThreshold: number;
    bloomIntensity: number;
}

export interface SkySettings {
    enabled: boolean;
    intensity: number;
    turbidity: number;
    rayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
    sunPosition: { x: number; y: number; z: number };
}

export interface HDRCapabilities {
    floatTextures: boolean;
    halfFloatTextures: boolean;
    floatLinear: boolean;
    halfFloatLinear: boolean;
    colorBufferFloat: boolean;
    colorBufferHalfFloat: boolean;
}

export interface HDRFramebuffer {
    id: string;
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    width: number;
    height: number;
}

export interface HDRTexture {
    url: string;
    width: number;
    height: number;
    data: Float32Array;
    format: string;
}

export interface HDRPerformanceMetrics {
    currentExposure: number;
    averageLuminance: number;
    adaptationBufferSize: number;
    hdrEnabled: boolean;
    toneMapping: ToneMappingOperator;
    bloomEnabled: boolean;
    framebuffers: number;
    shaders: number;
    hdrTextures: number;
}

export interface ToneMappingChangedEvent {
    exposure: number;
}

export interface RenderedEvent {
    performance: any;
    scene: Scene;
    camera: Camera;
}

export interface ContextLostEvent {
    context: WebGLRenderingContext;
}

export interface ContextRestoredEvent {
    context: WebGLRenderingContext;
}

export interface ErrorEvent {
    error: Error;
}

/**
 * HDRRenderer - High Dynamic Range Rendering Pipeline
 * 
 * Extends WebGLRenderer with HDR capabilities including:
 * - HDR framebuffers with floating-point textures
 * - Multiple tone mapping operators (ACES, Reinhard, Filmic, Uncharted2)
 * - Automatic exposure adaptation
 * - Gamma correction
 * - Bloom effects
 * - HDR sky rendering
 */
export declare class HDRRenderer extends WebGLRenderer {
    /**
     * HDR-specific settings
     */
    hdrSettings: HDRSettings;

    /**
     * Sky rendering settings
     */
    skySettings: SkySettings;

    /**
     * WebGL HDR capabilities
     */
    hdrCapabilities: HDRCapabilities;

    /**
     * Float type used for HDR textures
     */
    hdrFloatType: number;

    /**
     * Main HDR framebuffer
     */
    renderTarget: HDRFramebuffer;

    /**
     * Bloom effect framebuffers
     */
    bloomTargets: Array<{
        downsample: HDRFramebuffer;
        upsample: HDRFramebuffer;
        width: number;
        height: number;
    }>;

    /**
     * Adaptation targets for automatic exposure
     */
    adaptationTargets: HDRFramebuffer[];

    /**
     * Current exposure value (updates in real-time with auto exposure)
     */
    currentExposure: number;

    /**
     * Adaptation buffer for smooth exposure changes
     */
    adaptationBuffer: number[];

    /**
     * Size of adaptation buffer
     */
    adaptationBufferSize: number;

    /**
     * Target average luminance for auto exposure
     */
    averageLuminance: number;

    /**
     * HDR shader programs
     */
    shaders: Map<string, string>;

    /**
     * HDR texture cache
     */
    hdrTextures: Map<string, HDRTexture>;

    /**
     * HDR framebuffers
     */
    hdrFramebuffers: Map<string, {
        framebuffer: WebGLFramebuffer;
        texture: WebGLTexture;
        depthBuffer?: WebGLRenderbuffer;
        width: number;
        height: number;
        attachments: Array<{ attachment: number; texture?: WebGLTexture; renderbuffer?: WebGLRenderbuffer }>;
    }>;

    /**
     * Full-screen quad geometry for post-processing
     */
    fullScreenQuad?: {
        positions: Float32Array;
        indices: Uint16Array;
        vbo: WebGLBuffer;
        ibo: WebGLBuffer;
    };

    /**
     * Sky mesh for HDR sky rendering
     */
    skyMesh?: {
        vertices: number[];
        uvs: number[];
        indices: number[];
        render: (renderer: HDRRenderer, camera: Camera, scene: Scene) => void;
    };

    /**
     * Constructor
     * @param canvas - WebGL canvas element
     * @param options - Renderer options
     */
    constructor(canvas: HTMLCanvasElement, options?: any);

    /**
     * Initialize HDR rendering pipeline
     */
    initHDR(): void;

    /**
     * Check for HDR support
     */
    checkHDRSupport(): void;

    /**
     * Setup HDR framebuffers
     */
    setupHDRFramebuffers(): void;

    /**
     * Create HDR framebuffer
     * @param width - Framebuffer width
     * @param height - Framebuffer height
     * @returns HDRFramebuffer object
     */
    createHDRFramebuffer(width: number, height: number): HDRFramebuffer;

    /**
     * Create bloom targets
     * @param width - Screen width
     * @param height - Screen height
     */
    createBloomTargets(width: number, height: number): void;

    /**
     * Create adaptation targets for automatic exposure
     * @param width - Screen width
     * @param height - Screen height
     */
    createAdaptationTargets(width: number, height: number): void;

    /**
     * Compile HDR shaders
     */
    compileHDRShaders(): void;

    /**
     * Compile tone mapping shaders
     */
    compileToneMappingShaders(): void;

    /**
     * Compile adaptation shaders
     */
    compileAdaptationShaders(): void;

    /**
     * Compile bloom shaders
     */
    compileBloomShaders(): void;

    /**
     * Compile sky shaders
     */
    compileSkyShaders(): void;

    /**
     * Compile HDR vertex shader
     */
    compileHDRShader(): void;

    /**
     * Setup event listeners
     */
    setupEventListeners(): void;

    /**
     * Handle window resize
     */
    handleResize(): void;

    /**
     * Render HDR scene
     * @param scene - Scene to render
     * @param camera - Camera to use
     */
    renderHDR(scene: Scene, camera: Camera): void;

    /**
     * Render scene to HDR buffer
     * @param scene - Scene to render
     * @param camera - Camera to use
     */
    renderToHDRBuffer(scene: Scene, camera: Camera): void;

    /**
     * Use HDR shader for rendering
     */
    useHDRShader(): void;

    /**
     * Update automatic exposure
     */
    updateAutomaticExposure(): void;

    /**
     * Calculate average luminance
     * @returns Average luminance value
     */
    calculateAverageLuminance(): number;

    /**
     * Downsample texture
     * @param inputTexture - Input texture
     * @param outputTarget - Output target
     * @param inputWidth - Input texture width
     * @param inputHeight - Input texture height
     */
    downsampleTexture(
        inputTexture: WebGLTexture,
        outputTarget: HDRFramebuffer,
        inputWidth: number,
        inputHeight: number
    ): void;

    /**
     * Process bloom effect
     */
    processBloom(): void;

    /**
     * Single bloom pass
     * @param type - Pass type ('threshold' or 'blur')
     * @param input - Input target
     * @param output - Output target
     */
    bloomPass(
        type: 'threshold' | 'blur',
        input: HDRFramebuffer,
        output: HDRFramebuffer
    ): void;

    /**
     * Apply tone mapping
     */
    applyToneMapping(): void;

    /**
     * Render HDR sky
     * @param scene - Scene to render
     * @param camera - Camera to use
     */
    renderHDRSky(scene: Scene, camera: Camera): void;

    /**
     * Create sky mesh
     */
    createSkyMesh(): void;

    /**
     * Render full-screen quad
     */
    renderFullScreenQuad(): void;

    /**
     * Load HDR texture
     * @param url - Texture URL
     * @returns Texture ID
     */
    loadHDRTexture(url: string): string;

    /**
     * Set HDR settings
     * @param settings - HDR settings to apply
     */
    setHDRSettings(settings: Partial<HDRSettings>): void;

    /**
     * Set sky settings
     * @param settings - Sky settings to apply
     */
    setSkySettings(settings: Partial<SkySettings>): void;

    /**
     * Get HDR performance metrics
     * @returns Performance metrics object
     */
    getHDRPerformance(): HDRPerformanceMetrics;

    /**
     * Dispose HDR resources
     */
    disposeHDR(): void;

    /**
     * Override: Dispose renderer and cleanup resources
     */
    dispose(): void;

    // Event system methods
    on(event: 'toneMappingChanged', callback: (data: ToneMappingChangedEvent) => void): void;
    on(event: 'rendered', callback: (data: RenderedEvent) => void): void;
    on(event: 'contextlost', callback: (data: ContextLostEvent) => void): void;
    on(event: 'contextrestored', callback: (data: ContextRestoredEvent) => void): void;
    on(event: 'error', callback: (data: ErrorEvent) => void): void;

    off(event: 'toneMappingChanged', callback: (data: ToneMappingChangedEvent) => void): void;
    off(event: 'rendered', callback: (data: RenderedEvent) => void): void;
    off(event: 'contextlost', callback: (data: ContextLostEvent) => void): void;
    off(event: 'contextrestored', callback: (data: ContextRestoredEvent) => void): void;
    off(event: 'error', callback: (data: ErrorEvent) => void): void;

    // Inherited from WebGLRenderer
    render(scene: Scene, camera: Camera): void;
    setSize(width: number, height: number): void;
    getContext(): WebGLRenderingContext;
    getCapabilities(): WebGLCapabilities;
    getFeatures(): any;
    getErrors(): Array<{ error: string; stack?: string; timestamp: number }>;
    clearErrors(): void;
    setDebugMode(enabled: boolean): void;
    enable(name: string, value?: boolean): void;
    getPerformance(): {
        frameTime: number;
        renderTime: number;
        drawCalls: number;
        triangles: number;
        vertices: number;
        lastFrameTime: number;
        fps: number;
        memoryUsage: number;
    };
    generateId(): string;
    resize(width: number, height: number): void;
    dispose(): void;
}

// Export types for use in TypeScript projects
export type {
    ToneMappingOperator,
    HDRSettings,
    SkySettings,
    HDRCapabilities,
    HDRFramebuffer,
    HDRTexture,
    HDRPerformanceMetrics,
    ToneMappingChangedEvent,
    RenderedEvent,
    ContextLostEvent,
    ContextRestoredEvent,
    ErrorEvent
};