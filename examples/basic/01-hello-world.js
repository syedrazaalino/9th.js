/**
 * Basic Example 01: Hello World
 * Simple scene with a rotating cube
 */

import { Engine, Scene, PerspectiveCamera, BoxGeometry, BasicMaterial, Mesh } from '9th.js';

function createBasicCube() {
    // Get canvas element
    const canvas = document.getElementById('basic-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Create engine and scene
    const engine = new Engine(canvas);
    const scene = new Scene();
    
    // Set up camera
    const camera = new PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
    );
    camera.position.z = 5;
    
    // Create renderer
    const renderer = new Engine.Renderer(canvas);
    
    // Create a basic cube
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new BasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    
    scene.add(cube);
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate the cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        // Render the scene
        renderer.render(scene, camera);
    }
    
    // Handle window resize
    function onWindowResize() {
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.width, canvas.height);
    }
    
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createBasicCube };
}

// Auto-execute if in browser and canvas exists
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('basic-canvas')) {
            createBasicCube();
        }
    });
}