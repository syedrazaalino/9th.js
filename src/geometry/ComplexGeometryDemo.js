/**
 * Complex Geometry Demo
 * Demonstrates all complex geometry modules: BezierCurve, Spline, ParametricSurface, NURBSSurface
 */

import { Vector2 } from '../core/math/Vector2.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Matrix4 } from '../core/math/Matrix4.js';
import { BezierCurve } from './BezierCurve.js';
import { Spline } from './Spline.js';
import { ParametricSurface } from './ParametricSurface.js';
import { NURBSSurface } from './NURBSSurface.js';

export class ComplexGeometryDemo {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = [];
        this.time = 0;
    }

    // Initialize Three.js components for demo
    initThree() {
        // This would typically be done with actual Three.js initialization
        // For demo purposes, we'll simulate the structure
        console.log('Initializing Three.js components...');
        console.log('- Scene setup');
        console.log('- Camera configuration');
        console.log('- Renderer initialization');
        console.log('- Lighting setup');
    }

    // Demo 1: Bezier Curves
    demoBezierCurves() {
        console.log('\n=== Bezier Curve Demo ===');

        // Create cubic Bezier curve
        const controlPoints = [
            new Vector3(-2, 0, 0),
            new Vector3(-1, 2, 0),
            new Vector3(1, -2, 0),
            new Vector3(2, 0, 0)
        ];

        const bezier = new BezierCurve(controlPoints);

        // Demonstrate evaluation
        console.log('Curve evaluation:');
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const point = bezier.evaluate(t);
            console.log(`t=${t.toFixed(1)}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
        }

        // Generate tessellated geometry
        const curveGeometry = bezier.tessellate(50);
        console.log(`Generated curve with ${curveGeometry.getAttribute('position').count} vertices`);

        // Demonstrate derivatives
        console.log('\nDerivatives at t=0.5:');
        const derivatives = bezier.evaluate(0.5, 2);
        console.log(`Position: (${derivatives[0].x.toFixed(2)}, ${derivatives[0].y.toFixed(2)}, ${derivatives[0].z.toFixed(2)})`);
        console.log(`1st derivative: (${derivatives[1].x.toFixed(2)}, ${derivatives[1].y.toFixed(2)}, ${derivatives[1].z.toFixed(2)})`);

        // Surface of revolution
        console.log('\nSurface of revolution:');
        const revolveGeometry = bezier.revolve(Math.PI * 2, 20);
        console.log(`Generated surface with ${revolveGeometry.getAttribute('position').count} vertices`);

        // Find closest point
        const testPoint = new Vector3(0, 1, 0);
        const closest = bezier.findClosestPoint(testPoint);
        console.log(`\nClosest point to (0,1,0):`);
        console.log(`Parameter: ${closest.parameter.toFixed(3)}`);
        console.log(`Point: (${closest.point.x.toFixed(2)}, ${closest.point.y.toFixed(2)}, ${closest.point.z.toFixed(2)})`);
        console.log(`Distance: ${closest.distance.toFixed(3)}`);

        this.objects.push({ type: 'bezier', object: bezier, geometry: curveGeometry });
    }

    // Demo 2: Splines
    demoSplines() {
        console.log('\n=== Spline Demo ===');

        // Create spline control points
        const points = [
            new Vector3(-3, 0, 0),
            new Vector3(-1, 1, 0),
            new Vector3(1, -1, 0),
            new Vector3(3, 0, 0),
            new Vector3(4, 1, 0),
            new Vector3(5, 0, 0)
        ];

        // Test different spline types
        const splineTypes = ['linear', 'quadratic', 'cubic', 'catmull-rom', 'hermite'];

        for (const type of splineTypes) {
            console.log(`\n${type.toUpperCase()} Spline:`);
            const spline = new Spline(points, type);

            // Evaluate at various points
            for (let i = 0; i <= 5; i++) {
                const t = i / 5;
                const point = spline.evaluate(t);
                console.log(`t=${t.toFixed(1)}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
            }

            // Generate tessellation
            const geometry = spline.tessellate(30);
            console.log(`Generated ${geometry.getAttribute('position').count} vertices`);

            this.objects.push({ type: `spline_${type}`, object: spline, geometry });
        }

        // Demonstrate Hermite spline with custom tangents
        console.log('\nHermite Spline with custom tangents:');
        const hermiteSpline = new Spline(points.slice(0, 3), 'hermite', 0.5);
        hermiteSpline.tangents = [
            new Vector3(1, 0, 0),
            new Vector3(0, 1, 0),
            new Vector3(1, 1, 0)
        ];

        const hermiteGeometry = hermiteSpline.tessellate(20);
        console.log(`Hermite spline generated ${hermiteGeometry.getAttribute('position').count} vertices`);
        this.objects.push({ type: 'hermite', object: hermiteSpline, geometry: hermiteGeometry });
    }

    // Demo 3: Parametric Surfaces
    demoParametricSurfaces() {
        console.log('\n=== Parametric Surface Demo ===');

        // Sphere surface
        console.log('\nSphere Surface:');
        const sphere = ParametricSurface.createSphere(1);
        const sphereGeometry = sphere.tessellate(30, 20);
        console.log(`Generated ${sphereGeometry.getAttribute('position').count} vertices`);
        console.log(`Surface area: ${sphere.computeArea().toFixed(2)}`);

        // Torus surface
        console.log('\nTorus Surface:');
        const torus = ParametricSurface.createTorus(2, 0.5);
        const torusGeometry = torus.tessellate(40, 30);
        console.log(`Generated ${torusGeometry.getAttribute('position').count} vertices`);

        // Klein bottle
        console.log('\nKlein Bottle:');
        const klein = ParametricSurface.createKleinBottle();
        const kleinGeometry = klein.tessellate(25, 15);
        console.log(`Generated ${kleinGeometry.getAttribute('position').count} vertices`);

        // Custom parametric surface
        console.log('\nCustom Parametric Surface:');
        const customSurface = new ParametricSurface(
            (u, v) => {
                const x = Math.cos(u) * (2 + Math.cos(u * 2) * Math.sin(v * 4));
                const y = Math.sin(u) * (2 + Math.cos(u * 2) * Math.sin(v * 4));
                const z = Math.sin(v * 4) * Math.sin(u * 2);
                return new Vector3(x, y, z);
            },
            [0, 2 * Math.PI],
            [0, Math.PI]
        );

        // Evaluate surface properties
        const point = customSurface.evaluate(Math.PI, Math.PI / 2);
        const normal = customSurface.computeNormal(Math.PI, Math.PI / 2);
        const curvatures = customSurface.computeCurvatures(Math.PI, Math.PI / 2);

        console.log(`Point at (π, π/2): (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
        console.log(`Normal: (${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)})`);
        console.log(`Gaussian curvature: ${curvatures.K.toFixed(3)}`);
        console.log(`Mean curvature: ${curvatures.H.toFixed(3)}`);

        // Tessellation
        const customGeometry = customSurface.tessellate(25, 15);
        console.log(`Custom surface generated ${customGeometry.getAttribute('position').count} vertices`);

        // Ray intersection
        const rayOrigin = new Vector3(0, 0, 3);
        const rayDirection = new Vector3(0, 0, -1);
        const intersections = customSurface.intersectWithRay(rayOrigin, rayDirection);
        console.log(`Ray intersections: ${intersections.length}`);

        this.objects.push(
            { type: 'sphere', object: sphere, geometry: sphereGeometry },
            { type: 'torus', object: torus, geometry: torusGeometry },
            { type: 'klein', object: klein, geometry: kleinGeometry },
            { type: 'custom_surface', object: customSurface, geometry: customGeometry }
        );
    }

    // Demo 4: NURBS Surfaces
    demoNURBSSurfaces() {
        console.log('\n=== NURBS Surface Demo ===');

        // Create NURBS control points
        const createControlGrid = (uCount, vCount, scale = 1) => {
            const controlPoints = [];
            for (let v = 0; v < vCount; v++) {
                const row = [];
                for (let u = 0; u < uCount; u++) {
                    const x = (u / (uCount - 1) - 0.5) * 4 * scale;
                    const y = (v / (vCount - 1) - 0.5) * 4 * scale;
                    const z = Math.sin(x * 0.5) * Math.cos(y * 0.5) * scale;
                    row.push(new Vector3(x, y, z));
                }
                controlPoints.push(row);
            }
            return controlPoints;
        };

        // Create NURBS plane
        console.log('\nNURBS Plane:');
        const planePoints = createControlGrid(4, 4);
        const plane = new NURBSSurface(planePoints, null, null, 1, 1);
        const planeGeometry = plane.tessellate(20, 20);
        console.log(`Generated ${planeGeometry.getAttribute('position').count} vertices`);

        // Create NURBS sphere
        console.log('\nNURBS Sphere:');
        const sphere = NURBSSurface.createSphere(1, 8, 6);
        const sphereGeometry = sphere.tessellate(15, 12);
        console.log(`Generated ${sphereGeometry.getAttribute('position').count} vertices`);

        // Create NURBS torus
        console.log('\nNURBS Torus:');
        const torus = NURBSSurface.createTorus(2, 0.5, 6, 6);
        const torusGeometry = torus.tessellate(12, 10);
        console.log(`Generated ${torusGeometry.getAttribute('position').count} vertices`);

        // Complex NURBS surface
        console.log('\nComplex NURBS Surface:');
        const complexPoints = createControlGrid(5, 5, 1.5);
        const complex = new NURBSSurface(complexPoints);
        const complexGeometry = complex.tessellate(25, 20);
        console.log(`Generated ${complexGeometry.getAttribute('position').count} vertices`);

        // Evaluate NURBS surface properties
        const point = complex.evaluate(0.5, 0.5);
        const normal = complex.computeNormal(0.5, 0.5);
        console.log(`Point at (0.5, 0.5): (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
        console.log(`Normal: (${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)})`);

        // Surface manipulation
        console.log('\nSurface Manipulation:');
        const trimmed = complex.trim([0.25, 0.75], [0.25, 0.75]);
        console.log('Created trimmed surface');

        const withKnot = complex.insertKnot('u', 0.5);
        console.log('Inserted knot at u=0.5');

        const matrix = new Matrix4();
        matrix.setPosition(2, 0, 0);
        const transformed = complex.transform(matrix);
        console.log('Applied transformation');

        // Rational NURBS surface
        console.log('\nRational NURBS Surface:');
        const rationalPoints = createControlGrid(4, 4, 1);
        const weights = [];
        for (let v = 0; v < 4; v++) {
            const row = [];
            for (let u = 0; u < 4; u++) {
                const distance = Math.sqrt(
                    Math.pow(u - 1.5, 2) + Math.pow(v - 1.5, 2)
                );
                row.push(Math.max(0.5, 1.0 - distance * 0.3));
            }
            weights.push(row);
        }

        const rational = new NURBSSurface(rationalPoints, null, null, 3, 3, weights);
        const rationalGeometry = rational.tessellate(15, 15);
        console.log(`Rational NURBS generated ${rationalGeometry.getAttribute('position').count} vertices`);

        this.objects.push(
            { type: 'nurbs_plane', object: plane, geometry: planeGeometry },
            { type: 'nurbs_sphere', object: sphere, geometry: sphereGeometry },
            { type: 'nurbs_torus', object: torus, geometry: torusGeometry },
            { type: 'nurbs_complex', object: complex, geometry: complexGeometry },
            { type: 'nurbs_rational', object: rational, geometry: rationalGeometry }
        );
    }

    // Demo 5: Advanced Operations
    demoAdvancedOperations() {
        console.log('\n=== Advanced Operations Demo ===');

        // Convert between curve types
        const points = [
            new Vector3(0, 0, 0),
            new Vector3(1, 2, 0),
            new Vector3(2, 1, 0),
            new Vector3(3, 0, 0)
        ];

        console.log('\nCurve Type Conversion:');
        const bezier = new BezierCurve(points);
        console.log('Created Bezier curve');

        const spline = bezier.toSpline();
        console.log('Converted to Spline');

        const bezier2 = spline.toBezier();
        console.log('Converted back to Bezier');

        // Surface sweeping
        console.log('\nSurface Sweeping:');
        const path = new Spline([
            new Vector3(0, 0, 0),
            new Vector3(0, 0, 1),
            new Vector3(0, 0, 2)
        ], 'cubic');

        const profile = new BezierCurve([
            new Vector3(0.1, 0, 0),
            new Vector3(0.2, 0, 0),
            new Vector3(0.2, 0, 0),
            new Vector3(0.1, 0, 0)
        ]);

        const swept = path.sweep(profile, 20);
        console.log(`Swept surface generated ${swept.getAttribute('position').count} vertices`);

        // Extrusion
        console.log('\nCurve Extrusion:');
        const extrudePath = new Spline([
            new Vector3(0, 0, 0),
            new Vector3(1, 1, 1),
            new Vector3(2, 0, 2)
        ], 'cubic');

        const extruded = extrudePath.extrude(bezier, 15, Math.PI); // Twist extrude
        console.log(`Extruded surface generated ${extruded.getAttribute('position').count} vertices`);

        this.objects.push(
            { type: 'swept', object: { path, profile }, geometry: swept },
            { type: 'extruded', object: { extrudePath, profile }, geometry: extruded }
        );
    }

    // Run all demos
    runAllDemos() {
        console.log('=== Complex Geometry System Demo ===');
        console.log('Demonstrating Bezier curves, splines, parametric surfaces, and NURBS surfaces\n');

        this.initThree();
        this.demoBezierCurves();
        this.demoSplines();
        this.demoParametricSurfaces();
        this.demoNURBSSurfaces();
        this.demoAdvancedOperations();

        console.log('\n=== Demo Summary ===');
        console.log(`Total objects created: ${this.objects.length}`);
        console.log('Object types:');
        this.objects.forEach((obj, index) => {
            console.log(`  ${index + 1}. ${obj.type}`);
        });

        console.log('\nAll geometries are ready for rendering!');
        return this.objects;
    }

    // Animation loop for interactive demo
    animate() {
        this.time += 0.01;
        
        // Animate some objects for demonstration
        this.objects.forEach((obj, index) => {
            if (obj.type.includes('bezier') || obj.type.includes('spline')) {
                // Animate curves by adjusting evaluation parameter
                const animationProgress = (Math.sin(this.time + index) + 1) * 0.5;
                const point = obj.object.evaluate(animationProgress);
                // This would typically update object positions in the 3D scene
                console.log(`Animating ${obj.type}: point at ${animationProgress.toFixed(2)} = (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
            }
        });

        // Continue animation
        setTimeout(() => this.animate(), 100); // 10 FPS animation
    }

    // Interactive demo for browser
    startInteractiveDemo() {
        console.log('Starting interactive demo...');
        this.animate();
    }
}

// Export demo runner
export function runComplexGeometryDemo() {
    const demo = new ComplexGeometryDemo();
    return demo.runAllDemos();
}

// Export individual demo functions
export {
    ComplexGeometryDemo as ComplexGeometryDemo,
    runComplexGeometryDemo
};

// Example usage:
// import { runComplexGeometryDemo } from './geometry/ComplexGeometryDemo.js';
// runComplexGeometryDemo();
