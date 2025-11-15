/**
 * Scene - Container for all 3D objects and scene management
 * Provides scene graph functionality, rendering pipeline, and lifecycle management
 */
import { Object3D } from './Object3D.js';

export class Scene {
    constructor() {
        // Scene graph root
        this.root = new Object3D();
        this.root.name = 'Scene Root';

        // Objects registry
        this.objects = new Map();
        this.objectsByName = new Map();

        // Render pipeline
        this.cameras = [];
        this.activeCamera = null;

        // Lighting
        this.lights = [];

        // Scene properties
        this.background = { r: 0.05, g: 0.05, b: 0.05, a: 1.0 };
        this.ambientLight = { intensity: 0.2, color: { r: 1, g: 1, b: 1 } };
        this.fog = {
            enabled: false,
            color: { r: 0.5, g: 0.5, b: 0.5 },
            near: 10,
            far: 100
        };

        // Animation and physics
        this.clock = { time: 0, deltaTime: 0, lastTime: 0 };
        this.paused = false;

        // Rendering flags
        this.autoUpdate = true;
        this.autoRender = true;

        // Spatial data structures for optimization
        this.quadTree = null; // For 2D spatial partitioning
        this.octree = null;   // For 3D spatial partitioning
        this.spatialOptimization = false;

        // Performance metrics
        this.metrics = {
            renderCalls: 0,
            trianglesRendered: 0,
            objectsVisible: 0,
            updateTime: 0,
            renderTime: 0
        };

        // Event system
        this.eventListeners = new Map();

        // Culling settings
        this.frustumCulling = true;
        this.occlusionCulling = false;
        this.distanceCulling = {
            enabled: false,
            maxDistance: 1000
        };

        this.objectIdCounter = 0;
    }

    /**
     * Add object to scene (Three.js compatible alias)
     */
    add(object, name = null) {
        return this.addObject(object, name);
    }

    /**
     * Add object to scene
     */
    addObject(object, name = null) {
        if (!object) {
            throw new Error('Cannot add null object to scene');
        }

        // Generate ID if not present
        if (!object.id) {
            object.id = ++this.objectIdCounter;
        }

        // Set name
        if (name) {
            object.name = name;
        } else if (!object.name) {
            object.name = `Object_${object.id}`;
        }

        // Add to root if no parent specified
        if (!object.parent) {
            this.root.addChild(object);
        }

        // Register object
        this.objects.set(object.id, object);
        this.objectsByName.set(object.name, object);

        // Notify listeners
        this.emit('objectAdded', { object });

        return object;
    }

    /**
     * Remove object from scene (Three.js compatible alias)
     */
    remove(object) {
        return this.removeObject(object);
    }

    /**
     * Remove object from scene
     */
    removeObject(object) {
        if (!object) {
            return;
        }

        // Remove from parent
        if (object.parent) {
            object.parent.removeChild(object);
        }

        // Unregister
        this.objects.delete(object.id);
        this.objectsByName.delete(object.name);

        // Destroy object
        if (object.destroy) {
        object.destroy();
        }

        // Notify listeners
        this.emit('objectRemoved', { object });
    }

    /**
     * Get object by ID
     */
    getObjectById(id) {
        return this.objects.get(id) || null;
    }

    /**
     * Get object by name
     */
    getObjectByName(name) {
        return this.objectsByName.get(name) || null;
    }

    /**
     * Find objects by type
     */
    getObjectsByType(type) {
        const result = [];
        this.traverse(obj => {
            if (obj instanceof type) {
                result.push(obj);
            }
        });
        return result;
    }

    /**
     * Add camera to scene
     */
    addCamera(camera) {
        if (!this.cameras.includes(camera)) {
            this.cameras.push(camera);
            
            // Set as active camera if this is the first one
            if (!this.activeCamera) {
                this.setActiveCamera(camera);
            }
        }
        return camera;
    }

    /**
     * Remove camera from scene
     */
    removeCamera(camera) {
        const index = this.cameras.indexOf(camera);
        if (index !== -1) {
            this.cameras.splice(index, 1);
            
            // Clear active camera if this was the active one
            if (this.activeCamera === camera) {
                this.activeCamera = this.cameras[0] || null;
            }
        }
        return camera;
    }

    /**
     * Set active camera
     */
    setActiveCamera(camera) {
        if (this.cameras.includes(camera)) {
            this.activeCamera = camera;
            this.emit('activeCameraChanged', { camera });
        }
    }

    /**
     * Add light to scene
     */
    addLight(light) {
        if (!this.lights.includes(light)) {
            this.lights.push(light);
        }
        return light;
    }

    /**
     * Remove light from scene
     */
    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index !== -1) {
            this.lights.splice(index, 1);
        }
        return light;
    }

    /**
     * Traverse scene graph
     */
    traverse(callback, object = this.root) {
        callback(object);
        
        if (object && object.children && Array.isArray(object.children)) {
        for (let child of object.children) {
            this.traverse(callback, child);
            }
        }
    }

    /**
     * Traverse scene graph in reverse order
     */
    traverseReverse(callback, object = this.root) {
        for (let child of object.children) {
            this.traverseReverse(callback, child);
        }
        callback(object);
    }

    /**
     * Update scene (called each frame)
     */
    update(deltaTime) {
        if (this.paused) return;

        const startTime = performance.now();

        // Update clock
        this.clock.deltaTime = deltaTime;
        this.clock.time += deltaTime;

        // Update all objects
        this.traverse(obj => {
            if (obj.active) {
                obj.update(deltaTime);
            }
        });

        // Update lights
        for (let light of this.lights) {
            light.update(deltaTime);
        }

        // Update spatial optimization structures if enabled
        if (this.spatialOptimization) {
            this.updateSpatialData();
        }

        // Reset metrics
        this.metrics.updateTime = performance.now() - startTime;
        this.metrics.renderCalls = 0;
        this.metrics.trianglesRendered = 0;
        this.metrics.objectsVisible = 0;

        // Update animations
        this.updateAnimations(deltaTime);
    }

    /**
     * Render scene
     */
    render() {
        if (!this.activeCamera || this.paused) return;

        const startTime = performance.now();

        // Apply frustum culling if enabled
        let renderableObjects = this.getRenderableObjects();

        // Render all objects
        this.traverseReverse(obj => {
            if (obj.visible && renderableObjects.has(obj.id)) {
                obj.render(this.activeCamera, this);
                this.metrics.objectsVisible++;
            }
        });

        // Update render metrics
        this.metrics.renderTime = performance.now() - startTime;

        // Emit render event
        this.emit('rendered', { metrics: this.metrics });
    }

    /**
     * Get objects visible to active camera
     */
    getRenderableObjects() {
        const renderable = new Set();
        
        if (!this.frustumCulling || !this.activeCamera) {
            // Return all objects if frustum culling is disabled
            this.traverse(obj => {
                if (obj !== this.root && obj.visible) {
                    renderable.add(obj.id);
                }
            });
            return renderable;
        }

        // Apply frustum culling
        const frustum = this.activeCamera.getFrustum();
        
        this.traverse(obj => {
            if (obj === this.root || !obj.visible) return;

            // Distance culling
            if (this.distanceCulling.enabled) {
                const distance = this.activeCamera.getDistanceTo(obj);
                if (distance > this.distanceCulling.maxDistance) {
                    return;
                }
            }

            // Frustum culling
            if (this.isObjectInFrustum(obj, frustum)) {
                renderable.add(obj.id);
            }
        });

        return renderable;
    }

    /**
     * Check if object is in camera frustum
     */
    isObjectInFrustum(object, frustum) {
        // Simple bounding sphere culling - can be enhanced
        const worldPos = object.getWorldPosition();
        const worldScale = object.getWorldScale();
        const radius = Math.max(worldScale.x, worldScale.y, worldScale.z);

        for (let plane of frustum.planes) {
            const distance = this.distanceToPlane(worldPos, plane);
            if (distance < -radius) {
                return false; // Object is behind this plane
            }
        }

        return true;
    }

    /**
     * Calculate distance from point to plane
     */
    distanceToPlane(point, plane) {
        return plane.a * point.x + plane.b * point.y + plane.c * point.z + plane.d;
    }

    /**
     * Update animations
     */
    updateAnimations(deltaTime) {
        // Override in subclass for custom animation system
    }

    /**
     * Update spatial data structures
     */
    updateSpatialData() {
        // Update quadtree/octree for spatial optimization
        // Implementation depends on specific spatial partitioning needs
    }

    /**
     * Set scene background color
     */
    setBackground(color) {
        this.background = { ...color };
    }

    /**
     * Enable/disable fog
     */
    setFog(enabled, color = null, near = null, far = null) {
        this.fog.enabled = enabled;
        if (color) this.fog.color = { ...color };
        if (near !== null) this.fog.near = near;
        if (far !== null) this.fog.far = far;
    }

    /**
     * Set ambient light
     */
    setAmbientLight(intensity, color = { r: 1, g: 1, b: 1 }) {
        this.ambientLight.intensity = intensity;
        this.ambientLight.color = { ...color };
    }

    /**
     * Enable/disable spatial optimization
     */
    setSpatialOptimization(enabled, type = 'quadtree') {
        this.spatialOptimization = enabled;
        this.spatialType = type;
    }

    /**
     * Get scene bounds
     */
    getBounds() {
        let min = { x: Infinity, y: Infinity, z: Infinity };
        let max = { x: -Infinity, y: -Infinity, z: -Infinity };

        this.traverse(obj => {
            if (obj === this.root) return;

            const pos = obj.getWorldPosition();
            const scale = obj.getWorldScale();

            min.x = Math.min(min.x, pos.x - scale.x);
            min.y = Math.min(min.y, pos.y - scale.y);
            min.z = Math.min(min.z, pos.z - scale.z);

            max.x = Math.max(max.x, pos.x + scale.x);
            max.y = Math.max(max.y, pos.y + scale.y);
            max.z = Math.max(max.z, pos.z + scale.z);
        });

        return { min, max, size: { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z } };
    }

    /**
     * Find objects by name pattern
     */
    findByName(pattern) {
        const results = [];
        const regex = new RegExp(pattern, 'i');
        
        this.traverse(obj => {
            if (obj.name && regex.test(obj.name)) {
                results.push(obj);
            }
        });

        return results;
    }

    /**
     * Get all objects in scene
     */
    getAllObjects() {
        const result = [];
        this.traverse(obj => {
            if (obj !== this.root) {
                result.push(obj);
            }
        });
        return result;
    }

    /**
     * Clear scene
     */
    clear() {
        // Remove all objects
        for (let obj of [...this.getAllObjects()]) {
            this.removeObject(obj);
        }

        // Clear arrays
        this.cameras = [];
        this.lights = [];
        this.activeCamera = null;

        // Reset metrics
        this.metrics = {
            renderCalls: 0,
            trianglesRendered: 0,
            objectsVisible: 0,
            updateTime: 0,
            renderTime: 0
        };

        this.emit('sceneCleared');
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data = {}) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            for (let callback of listeners) {
                callback(data);
            }
        }
    }

    /**
     * Pause/unpause scene
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resume scene
     */
    resume() {
        this.paused = false;
        this.clock.lastTime = performance.now();
    }

    /**
     * Dispose scene and clean up resources
     */
    dispose() {
        this.clear();
        this.eventListeners.clear();
    }
}
