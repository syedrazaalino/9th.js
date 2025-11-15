/**
 * EnvironmentMapping.js TypeScript Declarations
 * Advanced Environment Mapping System with real-time reflection probes and SSR
 */

export interface ReflectionProbeOptions {
    size?: number;
    updateInterval?: number;
    influenceRadius?: number;
    boxSize?: [number, number, number];
    parallaxCorrection?: boolean;
    priority?: number;
    updateDistance?: number;
    resolution?: number;
    nearPlane?: number;
    farPlane?: number;
    compression?: 'none' | 'bc1' | 'bc3';
    mipmap?: boolean;
    maxMipLevel?: number;
    renderCallback?: (scene: any, camera: any, probe: ReflectionProbe, faceIndex: number) => void;
}

export interface ScreenSpaceReflectionOptions {
    enabled?: boolean;
    quality?: 'low' | 'medium' | 'high';
    maxSteps?: number;
    maxDistance?: number;
    stepSize?: number;
    bias?: number;
    downsampleFactor?: number;
    halfResolution?: boolean;
    thickness?: number;
    smoothness?: number;
    enableFallBack?: boolean;
    fallbackProbe?: ReflectionProbe | null;
}

export interface EnvironmentMappingOptions {
    enableSSR?: boolean;
    maxProbes?: number;
    maxSSRRes?: number;
    enableCulling?: boolean;
    lodLevels?: number;
    frustumCulling?: boolean;
    distanceCulling?: boolean;
    priorityCulling?: boolean;
}

export interface ProbeMetrics {
    totalProbes: number;
    activeProbes: number;
    ssrEnabled: boolean;
    memoryUsage: number;
    renderTime: number;
}

export interface SceneRegion {
    center: [number, number, number];
    size: [number, number, number];
    meshes: any[];
    meshCount: number;
    reflectivity: number;
}

export interface ReflectionData {
    type: 'ssr' | 'probe' | 'cubemap' | 'parallax';
    data: any;
    probe?: ReflectionProbe;
}

/**
 * ReflectionProbe - Real-time reflection probe for local environment mapping
 */
export class ReflectionProbe {
    gl: WebGLRenderingContext;
    position: [number, number, number];
    id: string;
    size: number;
    cubemap: CubeTexture | null;
    active: boolean;
    updateInterval: number;
    lastUpdate: number;
    influenceRadius: number;
    boxSize: [number, number, number];
    parallaxCorrection: boolean;
    priority: number;
    updateDistance: number;
    resolution: number;
    nearPlane: number;
    farPlane: number;
    compression: 'none' | 'bc1' | 'bc3';
    mipmap: boolean;
    maxMipLevel: number;
    renderCallback?: (scene: any, camera: any, probe: ReflectionProbe, faceIndex: number) => void;
    
    constructor(gl: WebGLRenderingContext, position: [number, number, number], options?: ReflectionProbeOptions);
    
    init(): void;
    generateId(): string;
    setPosition(position: [number, number, number]): void;
    shouldUpdate(cameraPosition: [number, number, number], currentTime: number): boolean;
    getDistance(position: [number, number, number]): number;
    needsRender(targetPosition: [number, number, number]): boolean;
    dispose(): void;
}

/**
 * ScreenSpaceReflection - Advanced screen space reflection system
 */
export class ScreenSpaceReflection {
    gl: WebGLRenderingContext;
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    maxSteps: number;
    maxDistance: number;
    stepSize: number;
    bias: number;
    downsampleFactor: number;
    halfResolution: boolean;
    thickness: number;
    smoothness: number;
    enableFallBack: boolean;
    fallbackProbe: ReflectionProbe | null;
    ssrShader: WebGLProgram | null;
    combineShader: WebGLProgram | null;
    blurShader: WebGLProgram | null;
    normalTarget: any;
    depthTarget: any;
    ssrTarget: any;
    tempTarget: any;
    gBuffer: {
        position: any;
        normal: any;
        albedo: any;
        roughness: any;
        metalness: any;
        depth: any;
    };
    
    constructor(gl: WebGLRenderingContext, options?: ScreenSpaceReflectionOptions);
    
    getQualitySetting(setting: string, defaultValue: number): number;
    init(): void;
    createRenderTargets(): void;
    getWidth(): number;
    getHeight(): number;
    getFormatForBuffer(bufferType: string): number;
    createRenderTarget(options: { width: number; height: number; format: number }): any;
    createShaderPrograms(): void;
    createSSRShader(): WebGLProgram | null;
    createCombineShader(): WebGLProgram | null;
    createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null;
    renderGBuffer(scene: any, camera: any): void;
    renderSSR(camera: any): any;
    setSSRUniforms(camera: any): void;
    applyBlur(): void;
    renderFullScreenQuad(): void;
    dispose(): void;
}

/**
 * EnvironmentMapping - Main environment mapping system
 */
export class EnvironmentMapping {
    gl: WebGLRenderingContext;
    probes: ReflectionProbe[];
    activeProbes: ReflectionProbe[];
    probeManager: ProbeManager | null;
    ssr: ScreenSpaceReflection | null;
    enableSSR: boolean;
    reflectionTypes: {
        SSR: string;
        PROBE: string;
        CUBEMAP: string;
        PARALLAX: string;
    };
    maxProbes: number;
    maxSSRRes: number;
    enableCulling: boolean;
    lodLevels: number;
    frustumCulling: boolean;
    distanceCulling: boolean;
    priorityCulling: boolean;
    defaultEnvironment: any;
    
    constructor(gl: WebGLRenderingContext, options?: EnvironmentMappingOptions);
    
    init(): void;
    addProbe(position: [number, number, number], options?: ReflectionProbeOptions): ReflectionProbe;
    removeProbe(probe: ReflectionProbe): void;
    autoPlaceProbes(environmentMeshes: any[], options?: { maxProbes?: number; regionSize?: number; minDistance?: number }): number;
    analyzeRegions(meshes: any[], regionSize: number): SceneRegion[];
    calculateSceneBounds(meshes: any[]): { min: [number, number, number]; max: [number, number, number]; size: [number, number, number] };
    findRegionForMesh(mesh: any, regions: SceneRegion[], regionSize: number): SceneRegion | null;
    isPointInRegion(point: [number, number, number], region: SceneRegion): boolean;
    getMeshReflectivity(mesh: any): number;
    updateActiveProbes(camera: any, currentTime?: number): void;
    isProbeInFrustum(probe: ReflectionProbe, camera: any): boolean;
    getReflection(surfacePosition: [number, number, number], surfaceNormal: [number, number, number], viewDirection: [number, number, number], material: any): ReflectionData | null;
    shouldUseSSR(position: [number, number, number], normal: [number, number, number], material: any): boolean;
    findNearestProbe(position: [number, number, number]): ReflectionProbe | null;
    renderProbes(scene: any, camera: any, currentTime?: number): void;
    renderProbe(probe: ReflectionProbe, scene: any, camera: any): void;
    renderSceneToProbeFace(scene: any, camera: any, probe: ReflectionProbe, faceIndex: number): void;
    applyParallaxCorrection(probe: ReflectionProbe): void;
    setDefaultEnvironment(environmentMap: any): void;
    setFeatureEnabled(feature: string, enabled: boolean): void;
    getMetrics(): ProbeMetrics;
    estimateMemoryUsage(): number;
    estimateRenderTime(): number;
    dispose(): void;
}

/**
 * ProbeManager - Advanced probe management and optimization
 */
declare class ProbeManager {
    gl: WebGLRenderingContext;
    options: any;
    lodLevels: number;
    lodDistances: number[];
    lodResolutions: number[];
    enableClustering: boolean;
    enableInstancing: boolean;
    enableTemporalSmoothing: boolean;
    renderStats: {
        totalRenders: number;
        totalTime: number;
        averageTime: number;
    };
    
    constructor(gl: WebGLRenderingContext, options?: any);
    
    createLODProbe(position: [number, number, number], cameraDistance: number): ReflectionProbe;
    getLODLevel(distance: number): number;
    clusterProbes(probes: ReflectionProbe[], threshold?: number): any[];
    updateClusterAverage(cluster: any): void;
    getDistance(pos1: [number, number, number], pos2: [number, number, number]): number;
    enableTemporalSmoothing(probe: ReflectionProbe, smoothingFactor?: number): void;
    applyTemporalSmoothing(probe: ReflectionProbe, currentCubemap: any, currentTime: number): any;
    getPerformanceStats(): any;
    calculateAverageLOD(): number;
    dispose(): void;
}

// Import types from other modules
import { CubeTexture } from './CubeTexture.js';
import { EnvironmentMap } from './EnvironmentMap.js';

// Export main class and types
export { ReflectionProbe, ScreenSpaceReflection, EnvironmentMapping };
export default EnvironmentMapping;