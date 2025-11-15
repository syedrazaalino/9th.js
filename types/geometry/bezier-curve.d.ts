/**
 * BezierCurve Type Definitions
 * TypeScript definitions for comprehensive Bezier curve handling
 */

import { Vector2 } from '../core/vector2';
import { Vector3 } from '../core/vector3';
import { BufferGeometry } from '../core/buffer-geometry';

export interface BezierCurveOptions {
    degree?: number;
    weights?: number[];
}

export interface ClosestPointResult {
    parameter: number;
    point: Vector3;
    distance: number;
}

export interface BoundingBox {
    min: Vector3;
    max: Vector3;
}

/**
 * BezierCurve - Comprehensive Bezier curve handling with evaluation, derivatives, and tessellation
 */
export declare class BezierCurve {
    public points: Vector3[];
    public degree: number;
    public weights: number[];
    public isRational: boolean;
    public boundingBox: BoundingBox;

    constructor(points?: Vector3[], degree?: number, weights?: number[]);

    // Evaluation methods
    evaluate(t: number, derivatives?: number): Vector3 | Vector3[];
    
    // Curve operations
    tessellate(segments?: number): BufferGeometry;
    revolve(angle?: number, segments?: number): BufferGeometry;
    extrude(path: BezierCurve, sections?: number, twist?: number): BufferGeometry;
    
    // Curve manipulation
    subdivide(iterations?: number): BezierCurve;
    findClosestPoint(targetPoint: Vector3, iterations?: number): ClosestPointResult;
    
    // Utility methods
    getBoundingBox(): BoundingBox;
    toSpline(): Spline;
    toJSON(): any;
    static fromJSON(data: any): BezierCurve;
    clone(): BezierCurve;
    
    // Static factory methods
    static fromPoints(points: Vector3[], weights?: number[]): BezierCurve;
}