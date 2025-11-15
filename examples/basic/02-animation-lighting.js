/**
 * Basic Example 02: Animation and Lighting
 * Adding lights and basic animation to the scene
 */

import { 
    Engine, 
    Scene, 
    PerspectiveCamera, 
    BoxGeometry, 
    BasicMaterial, 
    Mesh,
    AmbientLight,
    DirectionalLight,
    PointLight
} from '9th.js';

function createAnimatedScene() {
    const canvas = document.getElementById('animated-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const engine = new Engine(canvas);
    const scene = new Scene();
    
    // Set up camera
    const camera = new PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
    );
    camera.position.set(0, 2, 8);
    
    // Create renderer
    const renderer = new Engine.Renderer(canvas);
    
    // Add lights
    const ambientLight = new AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new PointLight(0xff0000, 1, 100);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);
    
    // Create multiple cubes with different materials
    const cubes = [];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    
    for (let i = 0; i < 6; i++) {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new BasicMaterial({ color: colors[i] });
        const cube = new Mesh(geometry, material);
        
        // Position cubes in a circle
        const angle = (i / 6) * Math.PI * 2;
        cube.position.x = Math.cos(angle) * 3;
        cube.position.z = Math.sin(angle) * 3;
        cube.position.y = 0;
        
        cubes.push(cube);
        scene.add(cube);
    }
    
    // Animation variables
    let time = 0;
    const lightSpeed = 0.02;
    const cubeRotationSpeed = 0.02;
    const cubeBobSpeed = 0.05;
    
    function animate() {
        requestAnimationFrame(animate);
        
        time += 0.016; // Assuming ~60fps
        
        // Animate point light
        pointLight.position.x = Math.cos(time * lightSpeed) * 8;
        pointLight.position.z = Math.sin(time * lightSpeed) * 8;
        pointLight.position.y = Math.sin(time * lightSpeed * 2) * 3 + 3;
        
        // Animate cubes
        cubes.forEach((cube, index) => {
            const offset = (index / cubes.length) * Math.PI * 2;
            
            // Rotation
            cube.rotation.x += cubeRotationSpeed;
            cube.rotation.y += cubeRotationSpeed;
            
            // Bobbing motion
            cube.position.y = Math.sin(time * cubeBobSpeed + offset) * 0.5;
            
            // Scale pulsing
            const scale = 1 + Math.sin(time * 0.5 + offset) * 0.2;
            cube.scale.setScalar(scale);
        });
        
        // Rotate camera around the scene
        camera.position.x = Math.cos(time * 0.3) * 8;
        camera.position.z = Math.sin(time * 0.3) * 8;
        camera.lookAt(0, 0, 0);
        
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
    
    return {
        scene,
        camera,
        renderer,
        cubes
    };
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createAnimatedScene };
}

// Auto-execute if in browser and canvas exists
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('animated-canvas')) {
            createAnimatedScene();
        }
    });
}