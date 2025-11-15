/**
 * Mesh Type Definitions
 * 3D mesh objects and geometry
 */

import { Vector3 } from './math/vector3';
import { Matrix4 } from './math/matrix4';
import { BufferGeometry } from './buffer-geometry';
import { Material } from './material';

export interface MeshGeometry {
    vertices: Float32Array;
    indices?: Uint16Array | Uint32Array;
    normals?: Float32Array;
    uvs?: Float32Array;
    colors?: Float32Array;
    tangents?: Float32Array;
    bones?: Float32Array;
    weights?: Float32Array;
}

export interface MeshConfig {
    visible?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
    frustumCulled?: boolean;
    renderOrder?: number;
    layer?: number;
    name?: string;
}

export interface LODLevel {
    distance: number;
    geometry: BufferGeometry;
    material?: Material;
}

/**
 * Mesh - 3D geometric object
 */
export declare class Mesh {
    public position: Vector3;
    public rotation: Vector3;
    public scale: Vector3;
    public visible: boolean;
    public castShadow: boolean;
    public receiveShadow: boolean;
    public frustumCulled: boolean;
    public renderOrder: number;
    public layer: number;
    public name: string;
    public geometry: BufferGeometry;
    public material: Material;
    public matrix: Matrix4;
    public matrixWorld: Matrix4;
    public parent: any;
    public children: Mesh[];
    public boundingBox: { min: Vector3; max: Vector3 };
    public boundingSphere: { center: Vector3; radius: number };

    constructor(geometry: BufferGeometry, material?: Material);

    /**
     * Set mesh position
     */
    setPosition(x: number, y: number, z: number): void;

    /**
     * Set mesh rotation
     */
    setRotation(x: number, y: number, z: number): void;

    /**
     * Set mesh scale
     */
    setScale(x: number, y: number, z: number): void;

    /**
     * Get mesh position
     */
    getPosition(): Vector3;

    /**
     * Get mesh rotation
     */
    getRotation(): Vector3;

    /**
     * Get mesh scale
     */
    getScale(): Vector3;

    /**
     * Update mesh transform
     */
    updateMatrix(): void;

    /**
     * Update world transform
     */
    updateMatrixWorld(): void;

    /**
     * Get world position
     */
    getWorldPosition(): Vector3;

    /**
     * Get world rotation
     */
    getWorldRotation(): Vector3;

    /**
     * Get world scale
     */
    getWorldScale(): Vector3;

    /**
     * Add child mesh
     */
    add(child: Mesh): void;

    /**
     * Remove child mesh
     */
    remove(child: Mesh): void;

    /**
     * Get children count
     */
    getChildrenCount(): number;

    /**
     * Set material
     */
    setMaterial(material: Material): void;

    /**
     * Get material
     */
    getMaterial(): Material;

    /**
     * Set geometry
     */
    setGeometry(geometry: BufferGeometry): void;

    /**
     * Get geometry
     */
    getGeometry(): BufferGeometry;

    /**
     * Check if mesh is visible
     */
    isVisible(): boolean;

    /**
     * Set visibility
     */
    setVisible(visible: boolean): void;

    /**
     * Compute bounding box
     */
    computeBoundingBox(): void;

    /**
     * Compute bounding sphere
     */
    computeBoundingSphere(): void;

    /**
     * Dispose mesh and cleanup resources
     */
    dispose(): void;

    /**
     * Clone mesh
     */
    clone(): Mesh;

    /**
     * Copy mesh properties
     */
    copy(source: Mesh): Mesh;
}

// Legacy mesh class for backward compatibility
export declare class LegacyMesh {
    public position: Vector3;
    public rotation: Vector3;
    public scale: Vector3;
    public visible: boolean;

    constructor(geometry: MeshGeometry);

    getGeometry(): MeshGeometry;
    setPosition(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setScale(x: number, y: number, z: number): void;
    dispose(): void;
}