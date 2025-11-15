/**
 * Module Examples: Using Individual 9th.js Modules
 * Demonstrates how to import and use specific modules independently
 */

import { Engine, Scene } from '9th.js/core';
import { PerspectiveCamera } from '9th.js/cameras';
import { OrbitControls } from '9th.js/controls';
import { BoxGeometry, SphereGeometry, PlaneGeometry } from '9th.js/geometry';
import { MeshStandardMaterial, MeshBasicMaterial, MeshPhongMaterial } from '9th.js/materials';
import { Mesh } from '9th.js/core';
import { AmbientLight, DirectionalLight, PointLight } from '9th.js/lights';
import { TextureLoader, Texture } from '9th.js/textures';
import { GLTFLoader } from '9th.js/loaders';
import { ParticleSystem, ParticleEmitter } from '9th.js/particles';
import { PhysicsSystem } from '9th.js/physics';

/**
 * Example 1: Core Module Usage
 * Basic scene setup using only core modules
 */
function coreModuleExample() {
    const canvas = document.getElementById('core-canvas');
    if (!canvas) return;
    
    const engine = new Engine(canvas);
    const scene = new Scene();
    
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new Engine.Renderer(canvas);
    
    // Create geometry using direct imports
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    
    scene.add(cube);
    
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    
    animate();
    
    return { engine, scene, camera, renderer };
}

/**
 * Example 2: Camera and Controls Module
 * Demonstrating different camera types and control systems
 */
function cameraControlsExample() {
    const canvas = document.getElementById('camera-canvas');
    if (!canvas) return;
    
    const engine = new Engine(canvas);
    const scene = new Scene();
    
    // Multiple camera setup
    const perspectiveCamera = new PerspectiveCamera(75, 1, 0.1, 1000);
    perspectiveCamera.position.set(5, 5, 5);
    perspectiveCamera.lookAt(0, 0, 0);
    
    const renderer = new Engine.Renderer(canvas);
    
    // Add multiple objects to demonstrate camera switching
    const objects = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    
    for (let i = 0; i < 6; i++) {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshStandardMaterial({ color: colors[i] });
        const cube = new Mesh(geometry, material);
        
        const angle = (i / 6) * Math.PI * 2;
        cube.position.x = Math.cos(angle) * 3;
        cube.position.z = Math.sin(angle) * 3;
        cube.position.y = 0;
        
        objects.push(cube);
        scene.add(cube);
    }
    
    // Orbit controls
    const controls = new OrbitControls(perspectiveCamera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    
    // Animation with camera controls
    function animate() {
        requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Animate objects
        objects.forEach((obj, index) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.01;
            obj.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5;
        });
        
        renderer.render(scene, perspectiveCamera);
    }
    
    animate();
    
    // Control interface
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = `
        <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px;">
            <div><strong>Camera Controls Demo</strong></div>
            <button onclick="toggleAutoRotate()">Toggle Auto-Rotate</button>
            <button onclick="resetCamera()">Reset Camera</button>
            <div style="margin-top: 5px;">Drag to rotate, scroll to zoom</div>
        </div>
    `;
    document.body.appendChild(controlsDiv);
    
    // Expose functions to window for button handlers
    window.toggleAutoRotate = () => {
        controls.autoRotate = !controls.autoRotate;
    };
    
    window.resetCamera = () => {
        perspectiveCamera.position.set(5, 5, 5);
        perspectiveCamera.lookAt(0, 0, 0);
        controls.reset();
    };
    
    return { engine, scene, camera: perspectiveCamera, renderer, controls };
}

/**
 * Example 3: Geometry and Materials Module
 * Demonstrating different geometry types and material properties
 */
function geometryMaterialsExample() {
    const canvas = document.getElementById('geometry-canvas');
    if (!canvas) return;
    
    const engine = new Engine(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 10;
    
    const renderer = new Engine.Renderer(canvas);
    
    // Lighting setup
    scene.add(new AmbientLight(0x404040, 0.6));
    
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new PointLight(0xff0000, 1, 100);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);
    
    // Different geometries
    const geometries = [
        new BoxGeometry(1, 1, 1),
        new SphereGeometry(0.6, 32, 16),
        new PlaneGeometry(2, 2),
        new ConeGeometry(0.8, 2, 8),
        new CylinderGeometry(0.5, 0.5, 2, 16),
        new TorusGeometry(0.8, 0.3, 16, 100)
    ];
    
    const materialTypes = [
        new MeshBasicMaterial({ color: 0xff0000 }),
        new MeshStandardMaterial({ 
            color: 0x00ff00, 
            roughness: 0.3, 
            metalness: 0.7 
        }),
        new MeshPhongMaterial({ 
            color: 0x0000ff, 
            shininess: 100,
            specular: 0x111111
        })
    ];
    
    const objects = [];
    
    geometries.forEach((geometry, index) => {
        const material = materialTypes[index % materialTypes.length];
        const mesh = new Mesh(geometry, material);
        
        const angle = (index / geometries.length) * Math.PI * 2;
        mesh.position.x = Math.cos(angle) * 6;
        mesh.position.z = Math.sin(angle) * 6;
        mesh.position.y = 0;
        
        objects.push(mesh);
        scene.add(mesh);
    });
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Animate point light
        pointLight.position.x = Math.cos(Date.now() * 0.001) * 8;
        pointLight.position.z = Math.sin(Date.now() * 0.001) * 8;
        
        // Animate objects
        objects.forEach((obj, index) => {
            obj.rotation.x += 0.01;
            obj.rotation.y += 0.02;
            obj.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5;
        });
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    return { engine, scene, camera, renderer };
}

/**
 * Example 4: Loading Module
 * Demonstrating texture and model loading
 */
function loadingExample() {
    const canvas = document.getElementById('loading-canvas');
    if (!canvas) return;
    
    const engine = new Engine(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 2, 8);
    
    const renderer = new Engine.Renderer(canvas);
    
    // Lighting
    scene.add(new AmbientLight(0x404040, 0.6));
    
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Loaders
    const textureLoader = new TextureLoader();
    const gltfLoader = new GLTFLoader();
    
    // Load texture (with fallback)
    const createTexturedObject = () => {
        const geometry = new BoxGeometry(2, 2, 2);
        
        // Try to load texture
        textureLoader.load(
            '/textures/checkerboard.png',
            (texture) => {
                const material = new MeshStandardMaterial({ 
                    map: texture,
                    roughness: 0.5,
                    metalness: 0.2
                });
                const mesh = new Mesh(geometry, material);
                mesh.position.set(0, 1, 0);
                scene.add(mesh);
            },
            undefined,
            (error) => {
                console.log('Texture loading failed, using fallback');
                const material = new MeshStandardMaterial({ 
                    color: 0x888888,
                    roughness: 0.5,
                    metalness: 0.2
                });
                const mesh = new Mesh(geometry, material);
                mesh.position.set(0, 1, 0);
                scene.add(mesh);
            }
        );
    };
    
    // Create placeholder geometry while loading
    const placeholderGeometry = new SphereGeometry(1, 32, 16);
    const placeholderMaterial = new MeshStandardMaterial({ color: 0x4444aa });
    const placeholder = new Mesh(placeholderGeometry, placeholderMaterial);
    placeholder.position.set(0, 1, 0);
    scene.add(placeholder);
    
    // Simulate GLTF loading
    setTimeout(() => {
        console.log('Simulating GLTF model load...');
        placeholder.material.color.set(0x44aa44);
        placeholder.geometry.dispose();
        placeholder.geometry = new BoxGeometry(2, 3, 1);
    }, 2000);
    
    // Load texture
    createTexturedObject();
    
    // Add ground plane
    const groundGeometry = new PlaneGeometry(10, 10);
    const groundMaterial = new MeshStandardMaterial({ color: 0x808080 });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate placeholder
        if (placeholder) {
            placeholder.rotation.y += 0.02;
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    return { engine, scene, camera, renderer };
}

/**
 * Example 5: Particles Module
 * Demonstrating particle system functionality
 */
function particleExample() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    
    const engine = new Engine(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 10);
    
    const renderer = new Engine.Renderer(canvas);
    
    // Particle system setup
    const particleSystem = new ParticleSystem();
    scene.add(particleSystem);
    
    // Create particle emitter
    const emitter = new ParticleEmitter();
    emitter.setPosition(0, 0, 0);
    emitter.setRate(100); // particles per second
    emitter.setLife(2.0); // seconds
    emitter.setSize(0.1);
    emitter.setVelocity({ x: 0, y: 2, z: 0 });
    emitter.setAcceleration({ x: 0, y: -1, z: 0 });
    
    particleSystem.addEmitter(emitter);
    
    // Animate emitter
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        
        time += 0.016;
        
        // Move emitter in a circle
        emitter.setPosition(
            Math.cos(time) * 3,
            0,
            Math.sin(time) * 3
        );
        
        // Update particle system
        particleSystem.update(0.016);
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    return { engine, scene, camera, renderer, particleSystem, emitter };
}

/**
 * Example 6: Physics Module
 * Demonstrating physics system
 */
function physicsExample() {
    const canvas = document.getElementById('physics-canvas');
    if (!canvas) return;
    
    const engine = new Engine(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 15);
    
    const renderer = new Engine.Renderer(canvas);
    
    // Physics system
    const physicsSystem = new PhysicsSystem();
    physicsSystem.setGravity({ x: 0, y: -9.81, z: 0 });
    scene.add(physicsSystem);
    
    // Ground plane
    const groundGeometry = new PlaneGeometry(10, 10);
    const groundMaterial = new MeshStandardMaterial({ color: 0x808080 });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    
    // Add physics body to ground
    physicsSystem.addStaticBody(ground, { shape: 'plane' });
    
    // Create dynamic objects
    const objects = [];
    for (let i = 0; i < 5; i++) {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshStandardMaterial({ 
            color: Math.random() * 0xffffff 
        });
        const cube = new Mesh(geometry, material);
        
        cube.position.set(
            (Math.random() - 0.5) * 8,
            Math.random() * 5 + 5,
            (Math.random() - 0.5) * 8
        );
        
        scene.add(cube);
        
        // Add physics body
        physicsSystem.addDynamicBody(cube, {
            mass: 1,
            shape: 'box',
            friction: 0.3,
            restitution: 0.6
        });
        
        objects.push(cube);
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Update physics
        physicsSystem.update(1/60);
        
        // Sync mesh positions with physics bodies
        objects.forEach((obj, index) => {
            const body = physicsSystem.getBody(obj);
            if (body) {
                obj.position.copy(body.position);
                obj.quaternion.copy(body.quaternion);
            }
        });
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    return { engine, scene, camera, renderer, physicsSystem };
}

// Module usage examples runner
function runModuleExamples() {
    console.log('Running 9th.js Module Examples...');
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
        // Run examples if their canvases exist
        if (document.getElementById('core-canvas')) {
            coreModuleExample();
        }
        
        if (document.getElementById('camera-canvas')) {
            cameraControlsExample();
        }
        
        if (document.getElementById('geometry-canvas')) {
            geometryMaterialsExample();
        }
        
        if (document.getElementById('loading-canvas')) {
            loadingExample();
        }
        
        if (document.getElementById('particle-canvas')) {
            particleExample();
        }
        
        if (document.getElementById('physics-canvas')) {
            physicsExample();
        }
    });
}

// Export functions for different usage patterns
export {
    coreModuleExample,
    cameraControlsExample,
    geometryMaterialsExample,
    loadingExample,
    particleExample,
    physicsExample,
    runModuleExamples
};

export default runModuleExamples;

// CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        coreModuleExample,
        cameraControlsExample,
        geometryMaterialsExample,
        loadingExample,
        particleExample,
        physicsExample,
        runModuleExamples
    };
}