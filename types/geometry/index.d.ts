/**
 * Geometry Module Type Definitions
 * 3D geometry primitives and utilities
 */

// Re-export all geometry types
export * from './primitives';
export * from './box-geometry';
export * from './sphere-geometry';
export * from './circle-geometry';
export * from './cone-geometry';
export * from './cylinder-geometry';
export * from './plane-geometry';
export * from './geometry-utils';

// Complex geometry types
export * from './bezier-curve';
export * from './spline';
export * from './parametric-surface';
export * from './nurbs-surface';

// Ambient type declarations
declare global {
    interface Window {
        geometry: {
            BoxGeometry: typeof import('./primitives').BoxGeometry;
            SphereGeometry: typeof import('./primitives').SphereGeometry;
            CircleGeometry: typeof import('./primitives').CircleGeometry;
            ConeGeometry: typeof import('./primitives').ConeGeometry;
            CylinderGeometry: typeof import('./primitives').CylinderGeometry;
            PlaneGeometry: typeof import('./primitives').PlaneGeometry;
            BezierCurve: typeof import('./bezier-curve').BezierCurve;
            Spline: typeof import('./spline').Spline;
            ParametricSurface: typeof import('./parametric-surface').ParametricSurface;
            NURBSSurface: typeof import('./nurbs-surface').NURBSSurface;
        };
    }
}

export {};