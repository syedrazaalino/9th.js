/**
 * MorphTarget Type Definitions
 * Morph target animation system for vertex morphing
 */

import { BufferAttribute } from './buffer';

export interface MorphTarget {
    name: string;
    infomations: {
        position: Float32Array | BufferAttribute;
        normal: Float32Array | BufferAttribute;
        uv: Float32Array | BufferAttribute;
    };
    vertexCount: number;
    material: any;
    morphTargets: boolean;
    morphNormalsRelative: boolean;
    morphTargetsRelative: boolean;
    morphAttributes: { [key: string]: BufferAttribute[] };
    morphTargetsList: { [key: string]: number };
    morphTargetInfluences: number[];
    morphTargetDictionary: { [key: string]: number };
}

export interface MorphTargetOptions {
    morphTargets?: boolean;
    morphNormals?: boolean;
    morphAttributes?: any;
    morphTargetsList?: { [key: string]: number };
    morphTargetInfluences?: number[];
    morphTargetDictionary?: { [key: string]: number };
}

export interface MorphAttribute {
    name: string;
    items: number;
    itemSize: number;
}

export interface MorphTargetsBufferGeometry {
    addGroup(groupStart: number, verticesCount: number, materialIndex: number): void;
    clearGroups(): void;
    getGroup(groupIndex: number): { start: number; count: number; materialIndex: number };
    getGroups(): { start: number; count: number; materialIndex: number }[];
    setIndex(index: BufferAttribute | null): BufferGeometry;
    getIndex(): BufferAttribute | null;
    setAttribute(name: string, attribute: BufferAttribute): BufferGeometry;
    deleteAttribute(name: string): BufferGeometry;
    getAttribute(name: string): BufferAttribute | undefined;
    hasAttribute(name: string): boolean;
    addMorphTargets(geometry: any, influences?: number[]): BufferGeometry;
    addMorphNormals(geometry: any, influences?: number[]): BufferGeometry;
}

export interface MorphAttributes {
    position?: BufferAttribute[];
    normal?: BufferAttribute[];
    color?: BufferAttribute[];
    uv?: BufferAttribute[];
    uv2?: BufferAttribute[];
    [key: string]: BufferAttribute[] | undefined;
}

export interface MorphTargetCompute {
    computeBufferGeometry(geometry: any): any;
    computeNormal(geometry: any): Float32Array;
    computeVertexNormals(geometry: any): void;
}

export interface MorphTargetMaterial {
    morphTargets: boolean;
    morphNormals: boolean;
    morphTargetsRelative: boolean;
    morphNormalsRelative: boolean;
    morphAttributes: MorphAttributes;
    setTargets(targets: MorphAttributes): void;
    updateMorphTargets(): void;
}

export interface MorphTargetGeometry {
    morphAttributes: MorphAttributes;
    morphTargetsRelative: boolean;
    addMorphAttributes(attributes: MorphAttributes, relative?: boolean): void;
    removeMorphAttributes(): void;
    getMorphAttribute(name: string): BufferAttribute[] | undefined;
    getMorphAttributes(): MorphAttributes;
    updateMorphAttributes(): void;
}

/**
 * MorphTarget - Vertex morphing system
 */
export declare class MorphTarget {
    public name: string;
    public infomations: {
        position: Float32Array | BufferAttribute;
        normal: Float32Array | BufferAttribute;
        uv: Float32Array | BufferAttribute;
    };
    public vertexCount: number;
    public morphAttributes: { [key: string]: BufferAttribute[] };
    public morphTargetsList: { [key: string]: number };
    public morphTargetInfluences: number[];
    public morphTargetDictionary: { [key: string]: number };
    public relative: boolean;

    constructor(target: MorphTarget, options?: MorphTargetOptions);

    /**
     * Get morph target by name
     */
    getMorphTarget(name: string): BufferAttribute | null;

    /**
     * Get morph target by index
     */
    getMorphTargetByIndex(index: number): BufferAttribute | null;

    /**
     * Add morph target
     */
    addMorphTarget(name: string, attribute: BufferAttribute): void;

    /**
     * Remove morph target
     */
    removeMorphTarget(name: string): void;

    /**
     * Clear all morph targets
     */
    clearMorphTargets(): void;

    /**
     * Get morph attribute count
     */
    getMorphAttributeCount(): number;

    /**
     * Get morph attribute names
     */
    getMorphAttributeNames(): string[];

    /**
     * Get morph target influence
     */
    getMorphTargetInfluence(index: number): number;

    /**
     * Set morph target influence
     */
    setMorphTargetInfluence(index: number, influence: number): void;

    /**
     * Set morph target influences
     */
    setMorphTargetInfluences(influences: number[]): void;

    /**
     * Get morph target influences
     */
    getMorphTargetInfluences(): number[];

    /**
     * Check if morph target exists
     */
    hasMorphTarget(name: string): boolean;

    /**
     * Get morph target dictionary
     */
    getMorphTargetDictionary(): { [key: string]: number };

    /**
     * Update morph targets
     */
    updateMorphTargets(): void;

    /**
     * Compute morph target
     */
    computeMorphTarget(): void;

    /**
     * Reset morph targets
     */
    resetMorphTargets(): void;

    /**
     * Clone morph target
     */
    clone(): MorphTarget;

    /**
     * Copy morph target
     */
    copy(source: MorphTarget): MorphTarget;

    /**
     * Dispose morph target
     */
    dispose(): void;
}

/**
 * MorphTargetSystem - Morph target management system
 */
export declare class MorphTargetSystem {
    public targets: MorphTarget[];
    public activeTargets: MorphTarget[];
    public enabled: boolean;

    constructor();

    /**
     * Add morph target
     */
    addTarget(target: MorphTarget): void;

    /**
     * Remove morph target
     */
    removeTarget(target: MorphTarget): void;

    /**
     * Clear all targets
     */
    clearTargets(): void;

    /**
     * Get all targets
     */
    getTargets(): MorphTarget[];

    /**
     * Get active targets
     */
    getActiveTargets(): MorphTarget[];

    /**
     * Update morph targets
     */
    update(): void;

    /**
     * Reset morph targets
     */
    reset(): void;

    /**
     * Set enabled state
     */
    setEnabled(enabled: boolean): void;

    /**
     * Get enabled state
     */
    getEnabled(): boolean;

    /**
     * Dispose all targets
     */
    dispose(): void;
}

/**
 * MorphTargetBuilder - Utility for creating morph targets
 */
export declare class MorphTargetBuilder {
    constructor(geometry: any);

    /**
     * Add morph target from geometry
     */
    addMorphTarget(name: string, geometry: any, weight?: number): void;

    /**
     * Add morph normal target
     */
    addMorphNormalTarget(name: string, geometry: any, weight?: number): void;

    /**
     * Create morph targets from multiple geometries
     */
    createMorphTargets(name: string, geometries: any[], weights?: number[]): void;

    /**
     * Compute morph targets from difference
     */
    computeMorphTarget(sourceGeometry: any, targetGeometry: any, name: string, weight?: number): void;

    /**
     * Build morph targets
     */
    build(): { [key: string]: number };

    /**
     * Get result
     */
    getResult(): MorphTarget;

    /**
     * Dispose
     */
    dispose(): void;
}

/**
 * MorphTargetUtils - Utility functions for morph targets
 */
export declare namespace MorphTargetUtils {
    /**
     * Compute morph target from base and target geometry
     */
    function computeMorphTarget(
        baseGeometry: any,
        targetGeometry: any,
        name: string
    ): BufferAttribute;

    /**
     * Compute morph normals
     */
    function computeMorphNormals(baseGeometry: any, targetGeometry: any): BufferAttribute;

    /**
     * Validate morph target data
     */
    function validateMorphTarget(baseGeometry: any, targetGeometry: any): boolean;

    /**
     * Blend morph targets
     */
    function blendMorphTargets(targets: BufferAttribute[], influences: number[]): Float32Array;

    /**
     * Normalize morph target influences
     */
    function normalizeInfluences(influences: number[]): number[];

    /**
     * Create morph target influence map
     */
    function createInfluenceMap(names: string[]): { [key: string]: number };
}

export default MorphTarget;