/**
 * Intermediate Example 01: Loading 3D Models
 * Demonstrates loading external 3D models with textures and materials
 */

import { 
    Engine, 
    Scene, 
    PerspectiveCamera, 
    OrbitControls,
    MeshStandardMaterial,
    PointLight,
    DirectionalLight,
    GLTFLoader,
    TextureLoader,
    Mesh,
    SphereGeometry,
    BoxGeometry,
    PlaneGeometry
} from '9th.js';

function createModelLoaderDemo() {
    const canvas = document.getElementById('model-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const engine = new Engine(canvas);
    const scene = new Scene();
    
    // Set up camera with controls
    const camera = new PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
    );
    camera.position.set(5, 3, 8);
    
    // Add orbit controls for camera interaction
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Create renderer
    const renderer = new Engine.Renderer(canvas);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = engine.PCFSoftShadowMap;
    
    // Add lighting setup
    scene.add(new Engine.AmbientLight(0x404040, 0.4));
    
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    const pointLight = new PointLight(0x2196f3, 1, 100);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);
    
    // Create ground plane
    const groundGeometry = new PlaneGeometry(20, 20);
    const groundMaterial = new MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Create loaders
    const gltfLoader = new GLTFLoader();
    const textureLoader = new TextureLoader();
    
    // Example 1: Load a texture
    function loadTextureExample() {
        textureLoader.load(
            // Replace with actual texture URL
            '/textures/wood-texture.jpg',
            (texture) => {
                const geometry = new BoxGeometry(2, 2, 2);
                const material = new MeshStandardMaterial({ 
                    map: texture,
                    roughness: 0.7,
                    metalness: 0.1
                });
                const box = new Mesh(geometry, material);
                box.position.set(-3, 1, 0);
                box.castShadow = true;
                scene.add(box);
            },
            undefined,
            (error) => {
                console.warn('Texture loading failed:', error);
                // Fallback to solid color
                const geometry = new BoxGeometry(2, 2, 2);
                const material = new MeshStandardMaterial({ color: 0x8b4513 });
                const box = new Mesh(geometry, material);
                box.position.set(-3, 1, 0);
                scene.add(box);
            }
        );
    }
    
    // Example 2: Create procedural geometry
    function createProceduralGeometry() {
        const geometry = new SphereGeometry(1, 32, 16);
        const material = new MeshStandardMaterial({ 
            color: 0xff6b6b,
            roughness: 0.3,
            metalness: 0.8
        });
        const sphere = new Mesh(geometry, material);
        sphere.position.set(3, 1, 0);
        sphere.castShadow = true;
        scene.add(sphere);
        return sphere;
    }
    
    // Example 3: Animation system
    const animatedObjects = [];
    
    function addAnimatedObject() {
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshStandardMaterial({ 
            color: Math.random() * 0xffffff,
            roughness: 0.5,
            metalness: 0.5
        });
        const mesh = new Mesh(geometry, material);
        mesh.position.set(
            (Math.random() - 0.5) * 10,
            Math.random() * 3 + 1,
            (Math.random() - 0.5) * 10
        );
        mesh.castShadow = true;
        scene.add(mesh);
        
        animatedObjects.push({
            mesh,
            originalPosition: mesh.position.clone(),
            velocity: new Engine.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            ),
            rotationSpeed: new Engine.Vector3(
                Math.random() * 0.02,
                Math.random() * 0.02,
                Math.random() * 0.02
            )
        });
    }
    
    // Add some animated objects
    for (let i = 0; i < 5; i++) {
        addAnimatedObject();
    }
    
    // Example 4: Loading GLTF model (placeholder)
    function loadGLTFModel() {
        gltfLoader.load(
            // Replace with actual GLTF model URL
            '/models/scene.gltf',
            (gltf) => {
                const model = gltf.scene;
                model.position.set(0, 0, -5);
                scene.add(model);
                console.log('GLTF model loaded successfully');
            },
            (progress) => {
                console.log('Loading model:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.warn('GLTF loading failed:', error);
                // Create a placeholder model
                const placeholder = createPlaceholderModel();
                placeholder.position.set(0, 0, -5);
                scene.add(placeholder);
            }
        );
    }
    
    function createPlaceholderModel() {
        const group = new Engine.Group();
        
        // Create a simple house structure
        const baseGeometry = new BoxGeometry(3, 2, 2);
        const baseMaterial = new MeshStandardMaterial({ color: 0x8B4513 });
        const base = new Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        group.add(base);
        
        const roofGeometry = new ConeGeometry(2.2, 1.5, 4);
        const roofMaterial = new MeshStandardMaterial({ color: 0x8B0000 });
        const roof = new Mesh(roofGeometry, roofMaterial);
        roof.position.y = 2.75;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        return group;
    }
    
    // Load examples
    loadTextureExample();
    const mainSphere = createProceduralGeometry();
    loadGLTFModel();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Animate main sphere
        mainSphere.rotation.x += 0.01;
        mainSphere.rotation.y += 0.01;
        mainSphere.position.y = Math.sin(Date.now() * 0.001) * 0.5 + 2;
        
        // Animate point light
        pointLight.position.x = Math.cos(Date.now() * 0.001) * 5;
        pointLight.position.z = Math.sin(Date.now() * 0.001) * 5;
        
        // Animate objects
        animatedObjects.forEach(obj => {
            const { mesh, velocity, rotationSpeed } = obj;
            
            mesh.position.add(velocity);
            mesh.rotation.x += rotationSpeed.x;
            mesh.rotation.y += rotationSpeed.y;
            mesh.rotation.z += rotationSpeed.z;
            
            // Boundary checking
            if (Math.abs(mesh.position.x) > 10) velocity.x *= -1;
            if (mesh.position.y < 0.5 || mesh.position.y > 5) velocity.y *= -1;
            if (Math.abs(mesh.position.z) > 10) velocity.z *= -1;
        });
        
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
        controls,
        addAnimatedObject
    };
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createModelLoaderDemo };
}

// Auto-execute if in browser and canvas exists
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('model-canvas')) {
            createModelLoaderDemo();
        }
    });
}