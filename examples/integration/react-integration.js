/**
 * Integration Example 01: React Integration
 * Demonstrates how to integrate 9th.js with React applications
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
    Engine, 
    Scene, 
    PerspectiveCamera, 
    OrbitControls,
    MeshStandardMaterial,
    BoxGeometry,
    SphereGeometry,
    Mesh,
    PointLight,
    DirectionalLight,
    AmbientLight
} from '9th.js';

// React hook for 9th.js scene management
function useNinthScene(canvasRef, options = {}) {
    const [scene, setScene] = useState(null);
    const [camera, setCamera] = useState(null);
    const [renderer, setRenderer] = useState(null);
    const [controls, setControls] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const engineRef = useRef(null);
    const animationFrameRef = useRef(null);
    const clockRef = useRef(null);
    
    const initializeScene = useCallback(() => {
        if (!canvasRef.current) return;
        
        try {
            const canvas = canvasRef.current;
            const engine = new Engine(canvas, options);
            engineRef.current = engine;
            
            const scene = new Scene();
            const camera = new PerspectiveCamera(
                75,
                canvas.width / canvas.height,
                0.1,
                1000
            );
            
            camera.position.set(5, 3, 8);
            
            const renderer = new Engine.Renderer(canvas);
            const controls = new OrbitControls(camera, canvas);
            controls.enableDamping = true;
            
            // Setup lighting
            scene.add(new AmbientLight(0x404040, 0.4));
            
            const directionalLight = new DirectionalLight(0xffffff, 1);
            directionalLight.position.set(10, 10, 5);
            scene.add(directionalLight);
            
            const pointLight = new PointLight(0x2196f3, 1, 100);
            pointLight.position.set(0, 5, 0);
            scene.add(pointLight);
            
            setScene(scene);
            setCamera(camera);
            setRenderer(renderer);
            setControls(controls);
            
            clockRef.current = new Engine.Clock();
            
            setIsInitialized(true);
            
            return { engine, scene, camera, renderer, controls };
        } catch (error) {
            console.error('Failed to initialize 9th.js scene:', error);
            return null;
        }
    }, [canvasRef, options]);
    
    const startAnimation = useCallback(() => {
        if (!scene || !camera || !renderer) return;
        
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            
            if (controls) {
                controls.update();
            }
            
            renderer.render(scene, camera);
        };
        
        animate();
    }, [scene, camera, renderer, controls]);
    
    const stopAnimation = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);
    
    const resize = useCallback(() => {
        if (!canvasRef.current || !camera || !renderer) return;
        
        const canvas = canvasRef.current;
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.width, canvas.height);
    }, [canvasRef, camera, renderer]);
    
    useEffect(() => {
        const sceneData = initializeScene();
        
        return () => {
            stopAnimation();
            if (engineRef.current) {
                engineRef.current.dispose();
            }
        };
    }, [initializeScene, stopAnimation]);
    
    useEffect(() => {
        if (isInitialized) {
            startAnimation();
        }
        
        return () => {
            stopAnimation();
        };
    }, [isInitialized, startAnimation, stopAnimation]);
    
    // Auto-resize on window resize
    useEffect(() => {
        const handleResize = () => resize();
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [resize]);
    
    return {
        scene,
        camera,
        renderer,
        controls,
        isInitialized,
        engine: engineRef.current,
        resize,
        startAnimation,
        stopAnimation
    };
}

// React component for basic 3D scene
function BasicScene() {
    const canvasRef = useRef(null);
    const [sceneObjects, setSceneObjects] = useState([]);
    
    const {
        scene,
        isInitialized,
        resize
    } = useNinthScene(canvasRef, {
        antialias: true,
        alpha: true
    });
    
    const addObject = useCallback((type) => {
        if (!scene) return;
        
        let geometry, material, mesh;
        
        switch (type) {
            case 'cube':
                geometry = new BoxGeometry(1, 1, 1);
                material = new MeshStandardMaterial({ color: 0x00ff00 });
                break;
            case 'sphere':
                geometry = new SphereGeometry(0.5, 32, 16);
                material = new MeshStandardMaterial({ color: 0xff0000 });
                break;
            default:
                return;
        }
        
        mesh = new Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 10,
            Math.random() * 5 + 1,
            (Math.random() - 0.5) * 10
        );
        
        scene.add(mesh);
        setSceneObjects(prev => [...prev, mesh]);
    }, [scene]);
    
    const clearScene = useCallback(() => {
        if (!scene) return;
        
        sceneObjects.forEach(obj => {
            scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        
        setSceneObjects([]);
    }, [scene, sceneObjects]);
    
    if (!isInitialized) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '400px' 
            }}>
                <div>Loading 3D Scene...</div>
            </div>
        );
    }
    
    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
                marginBottom: '20px', 
                display: 'flex', 
                gap: '10px',
                justifyContent: 'center'
            }}>
                <button onClick={() => addObject('cube')}>
                    Add Cube
                </button>
                <button onClick={() => addObject('sphere')}>
                    Add Sphere
                </button>
                <button onClick={clearScene}>
                    Clear Scene
                </button>
            </div>
            
            <div style={{ position: 'relative' }}>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    style={{
                        width: '100%',
                        height: '400px',
                        border: '1px solid #ccc',
                        borderRadius: '8px'
                    }}
                />
                
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px'
                }}>
                    <div>Objects: {sceneObjects.length}</div>
                    <div>Canvas: 800x400</div>
                </div>
            </div>
        </div>
    );
}

// React component with custom hooks for advanced features
function AdvancedScene() {
    const canvasRef = useRef(null);
    const animationSpeedRef = useRef(1);
    const [isAnimating, setIsAnimating] = useState(true);
    
    const {
        scene,
        camera,
        renderer,
        controls,
        isInitialized,
        engine
    } = useNinthScene(canvasRef, {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    
    // Add custom animation loop
    useEffect(() => {
        if (!scene || !renderer || !camera || !isAnimating) return;
        
        const objects = [];
        let lastTime = 0;
        
        // Create animated objects
        for (let i = 0; i < 20; i++) {
            const geometry = new BoxGeometry(0.5, 0.5, 0.5);
            const material = new MeshStandardMaterial({ 
                color: Math.random() * 0xffffff 
            });
            const mesh = new Mesh(geometry, material);
            
            mesh.position.set(
                (Math.random() - 0.5) * 15,
                Math.random() * 10 + 1,
                (Math.random() - 0.5) * 15
            );
            
            mesh.userData = {
                velocity: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                rotationSpeed: {
                    x: Math.random() * 0.01,
                    y: Math.random() * 0.01,
                    z: Math.random() * 0.01
                }
            };
            
            scene.add(mesh);
            objects.push(mesh);
        }
        
        const animate = (time) => {
            if (!isAnimating) return;
            
            const deltaTime = (time - lastTime) * animationSpeedRef.current;
            lastTime = time;
            
            objects.forEach((mesh, index) => {
                // Update position
                mesh.position.x += mesh.userData.velocity.x * deltaTime;
                mesh.position.y += mesh.userData.velocity.y * deltaTime;
                mesh.position.z += mesh.userData.velocity.z * deltaTime;
                
                // Update rotation
                mesh.rotation.x += mesh.userData.rotationSpeed.x * deltaTime;
                mesh.rotation.y += mesh.userData.rotationSpeed.y * deltaTime;
                mesh.rotation.z += mesh.userData.rotationSpeed.z * deltaTime;
                
                // Boundary checking
                if (Math.abs(mesh.position.x) > 7.5) mesh.userData.velocity.x *= -1;
                if (mesh.position.y < 0.5 || mesh.position.y > 10) mesh.userData.velocity.y *= -1;
                if (Math.abs(mesh.position.z) > 7.5) mesh.userData.velocity.z *= -1;
            });
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
        
        return () => {
            objects.forEach(obj => {
                scene.remove(obj);
                obj.geometry.dispose();
                obj.material.dispose();
            });
        };
    }, [scene, renderer, camera, isAnimating]);
    
    const toggleAnimation = () => {
        setIsAnimating(prev => !prev);
    };
    
    const changeSpeed = (speed) => {
        animationSpeedRef.current = speed;
    };
    
    if (!isInitialized) {
        return <div style={{ padding: '20px' }}>Loading Advanced 3D Scene...</div>;
    }
    
    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: '20px auto' }}>
            <div style={{ 
                marginBottom: '15px', 
                display: 'flex', 
                gap: '10px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button onClick={toggleAnimation}>
                    {isAnimating ? 'Pause' : 'Resume'}
                </button>
                <button onClick={() => changeSpeed(0.5)}>
                    0.5x Speed
                </button>
                <button onClick={() => changeSpeed(1)}>
                    Normal Speed
                </button>
                <button onClick={() => changeSpeed(2)}>
                    2x Speed
                </button>
            </div>
            
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                style={{
                    width: '100%',
                    height: '400px',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                }}
            />
            
            <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '5px',
                fontSize: '12px',
                textAlign: 'center'
            }}>
                <strong>React + 9th.js Integration Demo</strong>
                <br />
                {isAnimating ? '🟢 Animation Running' : '⏸️ Animation Paused'} | 
                Speed: {animationSpeedRef.current}x | 
                Objects: 20
            </div>
        </div>
    );
}

// React application wrapper
function App() {
    return (
        <div style={{ 
            fontFamily: 'Arial, sans-serif', 
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
                9th.js React Integration Examples
            </h1>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>Basic Scene Management</h2>
                <BasicScene />
            </div>
            
            <div style={{ marginBottom: '40px' }}>
                <h2>Advanced Animation & Controls</h2>
                <AdvancedScene />
            </div>
            
            <div style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginTop: '30px'
            }}>
                <h3>Integration Features</h3>
                <ul>
                    <li>React hooks for scene management</li>
                    <li>Automatic canvas handling and resizing</li>
                    <li>Performance optimizations</li>
                    <li>Custom animation loops</li>
                    <li>Component-based architecture</li>
                    <li>Event handling integration</li>
                </ul>
                
                <h4>Installation</h4>
                <pre style={{ 
                    background: '#e9ecef', 
                    padding: '10px', 
                    borderRadius: '4px',
                    overflow: 'auto'
                }}>
{`npm install 9th.js react react-dom
// Import in your component:
import { useNinthScene, BasicScene, AdvancedScene } from './examples/integration/react-integration.js'`}
                </pre>
            </div>
        </div>
    );
}

// Export for different usage patterns
export default App;
export { useNinthScene, BasicScene, AdvancedScene };

// Also export as CommonJS for non-ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        useNinthScene,
        BasicScene,
        AdvancedScene,
        default: App
    };
}