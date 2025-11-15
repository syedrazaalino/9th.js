/**
 * Geometry Primitives Type Definitions
 * Basic 3D geometry shapes
 */

import { BufferGeometry } from '../core/buffer-geometry';

export interface GeometryOptions {
    width?: number;
    height?: number;
    depth?: number;
    widthSegments?: number;
    heightSegments?: number;
    depthSegments?: number;
    radius?: number;
    segments?: number;
    thetaStart?: number;
    thetaLength?: number;
    phiStart?: number;
    phiLength?: number;
}

/**
 * BoxGeometry - Rectangular box geometry
 */
export declare class BoxGeometry extends BufferGeometry {
    public parameters: {
        width: number;
        height: number;
        depth: number;
        widthSegments: number;
        heightSegments: number;
        depthSegments: number;
    };

    constructor(
        width?: number,
        height?: number,
        depth?: number,
        widthSegments?: number,
        heightSegments?: number,
        depthSegments?: number
    );

    static fromJSON(data: any): BoxGeometry;
}

/**
 * SphereGeometry - Spherical geometry
 */
export declare class SphereGeometry extends BufferGeometry {
    public parameters: {
        radius: number;
        widthSegments: number;
        heightSegments: number;
        phiStart: number;
        phiLength: number;
        thetaStart: number;
        thetaLength: number;
    };

    constructor(
        radius?: number,
        widthSegments?: number,
        heightSegments?: number,
        phiStart?: number,
        phiLength?: number,
        thetaStart?: number,
        thetaLength?: number
    );

    static fromJSON(data: any): SphereGeometry;
}

/**
 * CircleGeometry - Circular geometry (flat disc)
 */
export declare class CircleGeometry extends BufferGeometry {
    public parameters: {
        radius: number;
        segments: number;
        thetaStart: number;
        thetaLength: number;
    };

    constructor(
        radius?: number,
        segments?: number,
        thetaStart?: number,
        thetaLength?: number
    );

    static fromJSON(data: any): CircleGeometry;
}

/**
 * ConeGeometry - Conical geometry
 */
export declare class ConeGeometry extends BufferGeometry {
    public parameters: {
        radius: number;
        height: number;
        radialSegments: number;
        heightSegments: number;
        openEnded: boolean;
        thetaStart: number;
        thetaLength: number;
    };

    constructor(
        radius?: number,
        height?: number,
        radialSegments?: number,
        heightSegments?: number,
        openEnded?: boolean,
        thetaStart?: number,
        thetaLength?: number
    );

    static fromJSON(data: any): ConeGeometry;
}

/**
 * CylinderGeometry - Cylindrical geometry
 */
export declare class CylinderGeometry extends BufferGeometry {
    public parameters: {
        radiusTop: number;
        radiusBottom: number;
        height: number;
        radialSegments: number;
        heightSegments: number;
        openEnded: boolean;
        thetaStart: number;
        thetaLength: number;
    };

    constructor(
        radiusTop?: number,
        radiusBottom?: number,
        height?: number,
        radialSegments?: number,
        heightSegments?: number,
        openEnded?: boolean,
        thetaStart?: number,
        thetaLength?: number
    );

    static fromJSON(data: any): CylinderGeometry;
}

/**
 * PlaneGeometry - Planar geometry (2D plane)
 */
export declare class PlaneGeometry extends BufferGeometry {
    public parameters: {
        width: number;
        height: number;
        widthSegments: number;
        heightSegments: number;
    };

    constructor(
        width?: number,
        height?: number,
        widthSegments?: number,
        heightSegments?: number
    );

    static fromJSON(data: any): PlaneGeometry;
}

// Geometry utilities namespace
export declare namespace Geometries {
    function createBox(width: number, height: number, depth: number): BoxGeometry;
    function createSphere(radius: number): SphereGeometry;
    function createCircle(radius: number): CircleGeometry;
    function createCone(radius: number, height: number): ConeGeometry;
    function createCylinder(radiusTop: number, radiusBottom: number, height: number): CylinderGeometry;
    function createPlane(width: number, height: number): PlaneGeometry;
    function createPlaneBuffer(width: number, height: number, widthSegments: number, heightSegments: number): PlaneGeometry;
    function createCircleBuffer(radius: number, segments: number): CircleGeometry;
    function createSphereBuffer(
        radius: number,
        widthSegments: number,
        heightSegments: number
    ): SphereGeometry;
    function createBoxBuffer(
        width: number,
        height: number,
        depth: number,
        widthSegments: number,
        heightSegments: number,
        depthSegments: number
    ): BoxGeometry;
}