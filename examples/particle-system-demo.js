import { WebGLRenderer, PerspectiveCamera, Scene, BoxGeometry, MeshBasicMaterial, Mesh, AmbientLight, DirectionalLight, OrbitControls } from '../core';
import { ParticleSystem, PointEmitter, SphereEmitter, ConeEmitter, createFireworkSystem, createSmokeSystem, createSparkSystem, createMagicSystem, Presets } from '../particles';

/**
 * Comprehensive particle system demo
 * Demonstrates all particle system features and effects
 */
class ParticleSystemDemo {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.particleSystems = [];
        this.emitters = [];
        this.clock = 0;
        this.time = 0;
        
        this.init();
        this.createScene();
        this.createParticles();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }
    
    init() {
        // Create renderer
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x0a0a0a);
        document.body.appendChild(this.renderer.domElement);
        
        // Create scene
        this.scene = new Scene();
        
        // Create camera
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 20);
        
        // Create controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }
    
    createScene() {
        // Add ambient light
        const ambientLight = new AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
        
        // Add some geometry for reference
        this.addReferenceObjects();
        
        // Add ground plane
        this.addGround();
    }
    
    addReferenceObjects() {
        // Add a cube in the center
        const cubeGeometry = new BoxGeometry(2, 2, 2);
        const cubeMaterial = new MeshBasicMaterial({ color: 0x444444, wireframe: true });
        const cube = new Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(0, 2, 0);
        this.scene.add(cube);
        
        // Add coordinate axes
        this.addAxes();
    }
    
    addAxes() {
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
    }
    
    addGround() {
        const groundGeometry = new BoxGeometry(50, 0.1, 50);
        const groundMaterial = new MeshBasicMaterial({ color: 0x111111 });
        const ground = new Mesh(groundGeometry, groundMaterial);
        ground.position.set(0, -2, 0);
        this.scene.add(ground);
    }
    
    createParticles() {
        // Create different types of particle systems
        
        // 1. Firework system
        this.createFirework();
        
        // 2. Smoke system
        this.createSmoke();
        
        // 3. Spark system
        this.createSparks();
        
        // 4. Magic particle system
        this.createMagicParticles();
        
        // 5. Rain system
        this.createRain();
        
        // 6. Snow system
        this.createSnow();
        
        // 7. Custom particle system
        this.createCustomParticles();
    }
    
    createFirework() {
        const { particleSystem, emitter } = createFireworkSystem({
            maxParticles: 800,
            particleSize: 1.5,
            position: { x: -10, y: 2, z: 0 }
        });
        
        // Position the particle system
        particleSystem.position.set(-10, 2, 0);
        
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        
        // Start emission after a delay
        setTimeout(() => emitter.play(), 2000);
    }
    
    createSmoke() {
        const { particleSystem, emitter } = createSmokeSystem({
            maxParticles: 1500,
            particleSize: 3.0,
            position: { x: 10, y: 0, z: 0 }
        });
        
        particleSystem.position.set(10, 0, 0);
        
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        
        // Continuous emission
        emitter.play();
    }
    
    createSparks() {
        const { particleSystem, emitter } = createSparkSystem({
            maxParticles: 400,
            particleSize: 0.8,
            position: { x: 0, y: 0, z: -5 }
        });
        
        particleSystem.position.set(0, 0, -5);
        
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        
        emitter.play();
    }
    
    createMagicParticles() {
        const { particleSystem, emitter } = createMagicSystem({
            maxParticles: 1200,
            particleSize: 2.0,
            position: { x: 0, y: 4, z: 5 }
        });
        
        particleSystem.position.set(0, 4, 5);
        
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        
        emitter.play();
    }
    
    createRain() {
        const { particleSystem, emitter } = createFromPreset('rain', {
            position: { x: 0, y: 8, z: 0 }
        });
        
        particleSystem.position.set(0, 8, 0);
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        emitter.play();
    }
    
    createSnow() {
        const { particleSystem, emitter } = createFromPreset('snow', {
            position: { x: 5, y: 6, z: -3 }
        });
        
        particleSystem.position.set(5, 6, -3);
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        emitter.play();
    }
    
    createCustomParticles() {
        // Create a custom particle system
        const particleSystem = new ParticleSystem({
            maxParticles: 600,
            particleSize: 2.5,
            blending: 'additive',
            particleSize: 3.0
        });
        
        // Create a custom cone emitter
        const emitter = new ConeEmitter({
            rate: 150,
            particleLifetime: [1, 3],
            initialSpeed: [3, 8],
            initialDirection: { x: 0, y: 1, z: 0 },
            colorStart: { r: 0.3, g: 0.8, b: 1.0 },
            colorEnd: { r: 0.1, g: 0.3, b: 0.8 },
            alphaStart: 1.0,
            alphaEnd: 0.0,
            emissionAngle: 20,
            emissionRadius: 1.0,
            acceleration: { x: 0, y: 2, z: 0 },
            autoplay: true
        });
        
        particleSystem.addEmitter(emitter);
        particleSystem.position.set(-5, 3, 5);
        
        // Apply custom shader
        particleSystem.material.applyShader('magic');
        
        this.scene.add(particleSystem);
        this.particleSystems.push(particleSystem);
        this.emitters.push(emitter);
        
        emitter.play();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.time += deltaTime;
        
        // Update controls
        this.controls.update();
        
        // Update all particle systems
        for (const particleSystem of this.particleSystems) {
            particleSystem.update(deltaTime, this.camera);
        }
        
        // Demonstrate dynamic effects
        this.updateDynamicEffects();
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Update performance stats
        this.updatePerformanceStats();
    }
    
    updateDynamicEffects() {
        // Animate emitter positions
        if (this.emitters.length > 0) {
            const time = this.time;
            
            // Move first firework in a circle
            if (this.particleSystems[0]) {
                const radius = 8;
                const speed = 0.5;
                this.particleSystems[0].position.x = Math.cos(time * speed) * radius;
                this.particleSystems[0].position.z = Math.sin(time * speed) * radius;
            }
            
            // Pulse the magic particles
            if (this.particleSystems[3]) {
                const pulse = Math.sin(time * 2) * 0.5 + 1.5;
                this.particleSystems[3].uniforms.particleSize.value = pulse;
            }
        }
    }
    
    updatePerformanceStats() {
        if (this.time > this.lastStatsUpdate + 1.0) {
            let totalParticles = 0;
            
            for (const system of this.particleSystems) {
                const stats = system.getPerformanceStats();
                totalParticles += stats.activeParticles;
                
                // Log system statistics
                console.log(`System: Active=${stats.activeParticles}, Pool=${stats.poolSize}, FPS=${stats.fps.toFixed(1)}`);
            }
            
            console.log(`Total particles: ${totalParticles}`);
            console.log('---');
            
            this.lastStatsUpdate = this.time;
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Utility methods for controlling the demo
    
    startAllEmitters() {
        for (const emitter of this.emitters) {
            emitter.play();
        }
    }
    
    stopAllEmitters() {
        for (const emitter of this.emitters) {
            emitter.stop();
        }
    }
    
    pauseAllEmitters() {
        for (const emitter of this.emitters) {
            emitter.pause();
        }
    }
    
    clearAllParticles() {
        for (const system of this.particleSystems) {
            system.clearParticles();
        }
    }
    
    setParticleSystemProperty(property, value) {
        for (const system of this.particleSystems) {
            system.setProperties({ [property]: value });
        }
    }
}

// Initialize the demo when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        window.particleSystemDemo = new ParticleSystemDemo();
        
        // Add keyboard controls
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case ' ':
                    event.preventDefault();
                    window.particleSystemDemo.startAllEmitters();
                    break;
                case 'Escape':
                    event.preventDefault();
                    window.particleSystemDemo.stopAllEmitters();
                    break;
                case 'r':
                case 'R':
                    event.preventDefault();
                    window.particleSystemDemo.clearAllParticles();
                    break;
                case 'p':
                case 'P':
                    event.preventDefault();
                    window.particleSystemDemo.pauseAllEmitters();
                    break;
            }
        });
    });
}

export default ParticleSystemDemo;