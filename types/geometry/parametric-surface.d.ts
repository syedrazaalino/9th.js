/**
 * ParametricSurface Type Definitions
 * TypeScript definitions for comprehensive parametric surface handling
 */

import { Vector2 } from '../core/vector2';
import { Vector3 } from '../core/vector3';
import { BufferGeometry } from '../core/buffer-geometry';

export type SurfaceFunction = (u: number, v: number, derivatives?: number) => Vector3 | any;

export interface ParametricSurfaceOptions {
    uSegments?: number;
    vSegments?: number;
    precompute?: boolean;
}

export interface TangentSpace {
    position: Vector3;
    normal: Vector3;
    tangentU: Vector3;
    tangentV: Vector3;
}

export interface SurfaceCurvatures {
    K: number;    // Gaussian curvature
    H: number;    // Mean curvature
    k1: number;   // Principal curvature 1
    k2: number;   // Principal curvature 2
    normal: Vector3;
}

export interface SurfaceIntersection {
    parameter: [number, number];
    point: Vector3;
    distance: number;
    normal: Vector3;
}

export interface SurfacePathPoint {
    parameter: [number, number];
    point: Vector3;
    normal: Vector3;
    tangent: Vector3;
}

export interface BoundingBox {
    min: Vector3;
    max: Vector3;
}

/**
 * ParametricSurface - Comprehensive parametric surface handling
 */
export declare class ParametricSurface {
    public surfaceFunction: SurfaceFunction;
    public uRange: [number, number];
    public vRange: [number, number];
    public uSegments: number;
    public vSegments: number;
    public options: ParametricSurfaceOptions;
    public boundingBox: BoundingBox;

    constructor(surfaceFunction: SurfaceFunction, uRange?: [number, number], vRange?: [number, number], options?: ParametricSurfaceOptions);

    // Main evaluation methods
    evaluate(u: number, v: number, derivatives?: number): Vector3 | any;
    
    // Derivative and geometric computations
    computePartialDerivatives(u: number, v: number, maxOrder?: number): any;
    computeNormal(u: number, v: number): Vector3;
    computeTangentSpace(u: number, v: number): TangentSpace;
    computeCurvatures(u: number, v: number): SurfaceCurvatures;
    
    // Tessellation methods
    tessellate(uSegments?: number, vSegments?: number): BufferGeometry;
    tessellateAdaptive(maxError?: number, maxSegments?: number): BufferGeometry;
    
    // Geometric properties
    computeArea(samples?: number): number;
    computeVolume(samples?: number): number;
    
    // Intersection and sampling
    intersectWithRay(origin: Vector3, direction: Vector3, maxDistance?: number): SurfaceIntersection[];
    sampleAlongParameter(direction?: 'u' | 'v', samples?: number): SurfacePathPoint[];
    
    // Utility methods
    getBoundingBox(): BoundingBox;
    toJSON(): any;
    static fromJSON(data: any): ParametricSurface;
    clone(): ParametricSurface;
    
    // Static factory methods for common surfaces
    static createSphere(radius?: number, uRange?: [number, number], vRange?: [number, number]): ParametricSurface;
    static createTorus(R?: number, r?: number, uRange?: [number, number], vRange?: [number, number]): ParametricSurface;
    static createPlane(width?: number, height?: number, uRange?: [number, number], vRange?: [number, number]): ParametricSurface;
    static createCylinder(radius?: number, height?: number, uRange?: [number, number], vRange?: [number, number]): ParametricSurface;
    static createKleinBottle(uRange?: [number, number], vRange?: [number, number]): ParametricSurface;
}