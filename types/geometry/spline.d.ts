/**
 * Spline Type Definitions
 * TypeScript definitions for comprehensive cubic spline handling
 */

import { Vector2 } from '../core/vector2';
import { Vector3 } from '../core/vector3';
import { BufferGeometry } from '../core/buffer-geometry';

export type SplineType = 'linear' | 'quadratic' | 'cubic' | 'catmull-rom' | 'hermite' | 'b-spline';

export interface SplineOptions {
    type?: SplineType;
    tension?: number;
    closed?: boolean;
}

export interface SplinePathPoint {
    parameter: number | [number, number];
    point: Vector3;
    normal: Vector3;
    tangent?: Vector3;
}

export interface BoundingBox {
    min: Vector3;
    max: Vector3;
}

/**
 * Spline - Comprehensive cubic spline handling with various spline types
 */
export declare class Spline {
    public points: Vector3[];
    public type: SplineType;
    public tension: number;
    public closed: boolean;
    public controlPoints: Vector3[];
    public knots: number[];
    public tangents?: Vector3[];
    public boundingBox: BoundingBox;

    constructor(points?: Vector3[], type?: SplineType, tension?: number, closed?: boolean);

    // Evaluation methods
    evaluate(t: number, derivatives?: number): Vector3 | Vector3[];
    
    // Surface generation
    tessellate(segments?: number): BufferGeometry;
    sweep(profileCurve: BezierCurve | Spline, steps?: number, twist?: number): BufferGeometry;
    
    // Point manipulation
    addPoint(point: Vector3, index?: number): void;
    removePoint(index: number): void;
    
    // Utility methods
    getBoundingBox(): BoundingBox;
    toBezier(): BezierCurve;
    toJSON(): any;
    static fromJSON(data: any): Spline;
    clone(): Spline;
    
    // Static factory methods
    static fromBezier(bezierCurve: BezierCurve): Spline;
}

/**
 * BezierCurve - Import for reference in Sweep method
 */
export declare class BezierCurve {
    evaluate(t: number, derivatives?: number): Vector3 | Vector3[];
}