/**
 * Advanced Example 01: Performance Monitoring & Optimization
 * Demonstrates FPS monitoring, memory management, and performance optimizations
 */

import { 
    Engine, 
    Scene, 
    PerspectiveCamera, 
    OrbitControls,
    InstancedMesh,
    Matrix4,
    Vector3,
    Color,
    MeshStandardMaterial,
    BoxGeometry,
    SphereGeometry,
    PointLight,
    DirectionalLight,
    AmbientLight
} from '9th.js';

class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.memory = 0;
        this.renderTime = 0;
        this.stats = {
            minFPS: Infinity,
            maxFPS: 0,
            avgFPS: 0,
            totalFrames: 0
        };
        
        this.initializeUI();
    }
    
    initializeUI() {
        // Create performance stats overlay
        this.statsElement = document.createElement('div');
        this.statsElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
            min-width: 200px;
        `;
        document.body.appendChild(this.statsElement);
        
        // Create controls
        this.createControls();
    }
    
    createControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        `;
        
        controlsContainer.innerHTML = `
            <div style="margin-bottom: 10px;">
                <label>Instance Count: <span id="instance-count">1000</span></label>
                <input type="range" id="instance-slider" min="100" max="5000" value="1000" step="100" style="width: 200px;">
            </div>
            <div style="margin-bottom: 10px;">
                <label><input type="checkbox" id="frustum-culling" checked> Frustum Culling</label>
            </div>
            <div style="margin-bottom: 10px;">
                <label><input type="checkbox" id="auto-rotate"> Auto Rotate</label>
            </div>
            <button id="optimize-btn">Optimize Scene</button>
        `;
        
        document.body.appendChild(controlsContainer);
        
        // Wire up controls
        this.setupControlEvents();
    }
    
    setupControlEvents() {
        const instanceSlider = document.getElementById('instance-slider');
        const instanceCount = document.getElementById('instance-count');
        
        instanceSlider.addEventListener('input', (e) => {
            instanceCount.textContent = e.target.value;
            if (this.onInstanceCountChange) {
                this.onInstanceCountChange(parseInt(e.target.value));
            }
        });
        
        document.getElementById('frustum-culling').addEventListener('change', (e) => {
            if (this.onFrustumCullingChange) {
                this.onFrustumCullingChange(e.target.checked);
            }
        });
        
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            if (this.onAutoRotateChange) {
                this.onAutoRotateChange(e.target.checked);
            }
        });
        
        document.getElementById('optimize-btn').addEventListener('click', () => {
            if (this.onOptimizeScene) {
                this.onOptimizeScene();
            }
        });
    }
    
    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        
        this.frameCount++;
        
        if (delta >= 1000) { // Update every second
            this.fps = Math.round((this.frameCount * 1000) / delta);
            
            // Update stats
            this.stats.minFPS = Math.min(this.stats.minFPS, this.fps);
            this.stats.maxFPS = Math.max(this.stats.maxFPS, this.fps);
            this.stats.avgFPS = (this.stats.avgFPS * this.stats.totalFrames + this.fps) / (this.stats.totalFrames + 1);
            this.stats.totalFrames++;
            
            // Get memory usage if available
            if (performance.memory) {
                this.memory = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            }
            
            this.updateDisplay();
            
            this.frameCount = 0;
            this.lastTime = now;
        }
    }
    
    updateDisplay() {
        const displayText = `
FPS: ${this.fps}
Min: ${this.stats.minFPS} | Max: ${this.stats.maxFPS} | Avg: ${this.stats.avgFPS.toFixed(1)}
Memory: ${this.memory}MB
Render Time: ${this.renderTime.toFixed(2)}ms
Objects: ${this.objectCount || 0}
        `.trim();
        
        this.statsElement.textContent = displayText;
    }
    
    startRenderTimer() {
        this.renderStart = performance.now();
    }
    
    endRenderTimer() {
        this.renderTime = performance.now() - this.renderStart;
    }
    
    setObjectCount(count) {
        this.objectCount = count;
    }
    
    dispose() {
        if (this.statsElement && this.statsElement.parentNode) {
            this.statsElement.parentNode.removeChild(this.statsElement);
        }
        
        const controlsContainer = document.querySelector('div[style*="position: fixed"][style*="bottom: 10px"]');
        if (controlsContainer && controlsContainer.parentNode) {
            controlsContainer.parentNode.removeChild(controlsContainer);
        }
    }
}

function createPerformanceDemo() {
    const canvas = document.getElementById('performance-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Initialize engine with performance optimizations
    const engine = new Engine(canvas, {
        antialias: false, // Disable antialias for performance
        powerPreference: 'high-performance',
        alpha: false
    });
    
    const scene = new Scene();
    scene.fog = new Engine.Fog(0x000000, 50, 100);
    
    const camera = new PerspectiveCamera(
        75,
        canvas.width / canvas.height,
        0.1,
        1000
    );
    camera.position.set(0, 20, 30);
    
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    const renderer = new Engine.Renderer(canvas);
    renderer.setSize(canvas.width, canvas.height);
    renderer.shadowMap.enabled = false; // Disable shadows for performance
    renderer.shadowMap.type = engine.PCFSoftShadowMap;
    
    // Setup lighting for visibility
    const ambientLight = new AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    
    const pointLight = new PointLight(0x00ffff, 1, 200);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);
    
    // Performance monitor
    const performanceMonitor = new PerformanceMonitor();
    
    // Scene objects
    let instanceMesh = null;
    let individualObjects = [];
    let autoRotate = false;
    
    function createInstancedMesh(count) {
        // Dispose existing mesh
        if (instanceMesh) {
            scene.remove(instanceMesh);
            instanceMesh.geometry.dispose();
            instanceMesh.material.dispose();
        }
        
        // Create new instanced mesh
        const geometry = new BoxGeometry(0.8, 0.8, 0.8);
        const material = new MeshStandardMaterial({ 
            color: 0x00ff88,
            roughness: 0.4,
            metalness: 0.6
        });
        
        instanceMesh = new InstancedMesh(geometry, material, count);
        instanceMesh.instanceMatrix.setUsage(engine.DynamicDrawUsage);
        
        // Populate instances
        const matrix = new Matrix4();
        const position = new Vector3();
        const quaternion = new engine.Quaternion();
        const scale = new Vector3(1, 1, 1);
        
        for (let i = 0; i < count; i++) {
            position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 30,
                (Math.random() - 0.5) * 60
            );
            
            quaternion.setFromEuler(new engine.Euler(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            ));
            
            matrix.compose(position, quaternion, scale);
            instanceMesh.setMatrixAt(i, matrix);
        }
        
        instanceMesh.instanceMatrix.needsUpdate = true;
        scene.add(instanceMesh);
        
        performanceMonitor.setObjectCount(count);
    }
    
    function createIndividualObjects(count) {
        // Dispose existing objects
        individualObjects.forEach(obj => {
            scene.remove(obj);
            obj.geometry.dispose();
            obj.material.dispose();
        });
        individualObjects = [];
        
        const geometries = [
            new BoxGeometry(0.8, 0.8, 0.8),
            new SphereGeometry(0.4, 16, 12)
        ];
        
        for (let i = 0; i < count; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = new MeshStandardMaterial({ 
                color: Math.random() * 0xffffff,
                roughness: Math.random(),
                metalness: Math.random()
            });
            
            const mesh = new Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 30,
                (Math.random() - 0.5) * 60
            );
            
            mesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            scene.add(mesh);
            individualObjects.push(mesh);
        }
        
        performanceMonitor.setObjectCount(count);
    }
    
    // Performance optimization techniques
    function optimizeScene() {
        // Enable LOD system
        console.log('Applying performance optimizations...');
        
        // Disable unnecessary features
        renderer.shadowMap.enabled = false;
        
        // Optimize materials
        scene.traverse((object) => {
            if (object.isMesh) {
                if (object.material.isMeshStandardMaterial) {
                    object.material.roughness = Math.min(object.material.roughness, 0.8);
                    object.material.metalness = Math.max(object.material.metalness, 0.1);
                }
            }
        });
        
        console.log('Scene optimization completed');
    }
    
    // Control event handlers
    performanceMonitor.onInstanceCountChange = (count) => {
        if (instanceMesh) {
            createInstancedMesh(count);
        } else {
            createIndividualObjects(count);
        }
    };
    
    performanceMonitor.onFrustumCullingChange = (enabled) => {
        scene.traverse((object) => {
            object.frustumCulled = enabled;
        });
    };
    
    performanceMonitor.onAutoRotateChange = (enabled) => {
        autoRotate = enabled;
    };
    
    performanceMonitor.onOptimizeScene = optimizeScene;
    
    // Initialize with instanced mesh
    createInstancedMesh(1000);
    
    // Animation loop with performance monitoring
    const clock = new Engine.Clock();
    
    function animate() {
        performanceMonitor.startRenderTimer();
        
        requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        
        // Animate objects
        if (instanceMesh) {
            // Animate instanced mesh
            const time = clock.getElapsedTime();
            
            for (let i = 0; i < instanceMesh.count; i++) {
                const matrix = new Matrix4();
                instanceMesh.getMatrixAt(i, matrix);
                
                // Apply rotation animation
                const position = new Vector3();
                const quaternion = new engine.Quaternion();
                const scale = new Vector3();
                
                matrix.decompose(position, quaternion, scale);
                
                const euler = new engine.Euler().setFromQuaternion(quaternion);
                euler.x += 0.01;
                euler.y += 0.01;
                
                quaternion.setFromEuler(euler);
                matrix.compose(position, quaternion, scale);
                
                instanceMesh.setMatrixAt(i, matrix);
            }
            instanceMesh.instanceMatrix.needsUpdate = true;
        }
        
        // Animate individual objects
        individualObjects.forEach((mesh, index) => {
            mesh.rotation.x += 0.01;
            mesh.rotation.y += 0.01;
            mesh.position.y += Math.sin(Date.now() * 0.001 + index) * 0.01;
        });
        
        // Auto-rotate camera if enabled
        if (autoRotate) {
            const time = clock.getElapsedTime();
            camera.position.x = Math.cos(time * 0.2) * 30;
            camera.position.z = Math.sin(time * 0.2) * 30;
            camera.lookAt(0, 0, 0);
        }
        
        // Animate point light
        const time = clock.getElapsedTime();
        pointLight.position.x = Math.cos(time) * 20;
        pointLight.position.z = Math.sin(time) * 20;
        pointLight.position.y = 10 + Math.sin(time * 2) * 5;
        
        renderer.render(scene, camera);
        
        performanceMonitor.endRenderTimer();
        performanceMonitor.update();
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
        performanceMonitor,
        createInstancedMesh,
        createIndividualObjects,
        optimizeScene,
        dispose: () => {
            performanceMonitor.dispose();
            // Clean up scene resources
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.geometry.dispose();
                    if (object.material.dispose) {
                        object.material.dispose();
                    }
                }
            });
        }
    };
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createPerformanceDemo, PerformanceMonitor };
}

// Auto-execute if in browser and canvas exists
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('performance-canvas')) {
            createPerformanceDemo();
        }
    });
}