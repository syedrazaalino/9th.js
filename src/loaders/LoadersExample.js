/**
 * LoadersExample.js
 * Comprehensive example demonstrating STLLoader, PLYLoader, and EnhancedJSONLoader
 * Shows practical usage patterns, error handling, and optimization techniques
 */

import { STLLoader, PLYLoader, EnhancedJSONLoader } from './index.js';
import { Scene } from '../core/Scene.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { WebGLRenderer } from '../core/WebGLRenderer.js';
import { Mesh } from '../core/Mesh.js';
import { LambertMaterial, BasicMaterial, PhongMaterial } from '../core/Material.js';

export class LoadersExample {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.loaders = {};
        this.isLoading = false;
        this.progressCallbacks = new Map();
        
        this.options = {
            enableControls: options.enableControls !== false,
            showBoundingBoxes: options.showBoundingBoxes || false,
            enableWireframe: options.enableWireframe || false,
            maxFileSize: options.maxFileSize || 50 * 1024 * 1024, // 50MB
            enableWorkers: options.enableWorkers || false,
            cacheEnabled: options.cacheEnabled !== false
        };

        this._init();
    }

    /**
     * Initialize the example scene and loaders
     */
    _init() {
        // Initialize Three.js scene
        this._initScene();
        
        // Initialize all loaders
        this._initLoaders();
        
        // Start render loop
        this._startRenderLoop();
        
        console.log('LoadersExample initialized successfully');
    }

    /**
     * Initialize Three.js scene
     */
    _initScene() {
        // Create scene
        this.scene = new Scene();
        
        // Create camera
        this.camera = new PerspectiveCamera(
            75, 
            this.canvas.clientWidth / this.canvas.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        // Create renderer
        this.renderer = new WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setClearColor(0x2a2a2a);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    /**
     * Initialize all loaders with optimal settings
     */
    _initLoaders() {
        // STL Loader
        this.loaders.stl = new STLLoader();
        this._configureSTLLoader();
        
        // PLY Loader
        this.loaders.ply = new PLYLoader();
        this._configurePLYLoader();
        
        // Enhanced JSON Loader
        this.loaders.json = new EnhancedJSONLoader();
        this._configureJSONLoader();
    }

    /**
     * Configure STL Loader with optimal settings
     */
    _configureSTLLoader() {
        const loader = this.loaders.stl;
        
        // Enable worker for large files
        if (this.options.enableWorkers) {
            loader.setUseWorker(true);
        }
        
        // Set up progress callback
        loader.manager.onProgress = (url, loaded, total) => {
            const percentage = (loaded / total * 100).toFixed(1);
            this._updateProgress(`STL: ${percentage}%`);
        };
    }

    /**
     * Configure PLY Loader with optimal settings
     */
    _configurePLYLoader() {
        const loader = this.loaders.ply;
        
        // Set encoding
        loader.setEncoding('utf-8');
        
        // Enable caching if supported
        if (this.options.cacheEnabled) {
            loader.setCacheEnabled(true);
        }
        
        // Set up progress callback
        loader.manager.onProgress = (url, loaded, total) => {
            const percentage = (loaded / total * 100).toFixed(1);
            this._updateProgress(`PLY: ${percentage}%`);
        };
    }

    /**
     * Configure JSON Loader with comprehensive settings
     */
    _configureJSONLoader() {
        const loader = this.loaders.json;
        
        // Configure parsing options
        loader.setOptions({
            parseIndices: true,
            parseUvs: true,
            parseNormals: true,
            parseColors: true, // Enable for colorful models
            parseTangents: false, // Disable if not needed
            parseMorphTargets: true, // Enable for animated models
            parseAnimations: true // Enable for animated models
        });
        
        // Set texture path if needed
        loader.setTexturePath('./textures/');
        
        // Set up progress callback
        loader.manager.onProgress = (url, loaded, total) => {
            const percentage = (loaded / total * 100).toFixed(1);
            this._updateProgress(`JSON: ${percentage}%`);
        };
    }

    /**
     * Load STL file with comprehensive error handling
     * @param {string} url - URL of STL file
     * @param {object} options - Loading options
     */
    async loadSTL(url, options = {}) {
        return this._loadFile('stl', url, options);
    }

    /**
     * Load PLY file with comprehensive error handling
     * @param {string} url - URL of PLY file
     * @param {object} options - Loading options
     */
    async loadPLY(url, options = {}) {
        return this._loadFile('ply', url, options);
    }

    /**
     * Load JSON file with comprehensive error handling
     * @param {string} url - URL of JSON file
     * @param {object} options - Loading options
     */
    async loadJSON(url, options = {}) {
        return this._loadFile('json', url, options);
    }

    /**
     * Generic file loading method with error handling and optimization
     * @param {string} type - Loader type ('stl', 'ply', 'json')
     * @param {string} url - File URL
     * @param {object} options - Loading options
     */
    async _loadFile(type, url, options = {}) {
        if (this.isLoading) {
            throw new Error('Another file is currently loading. Please wait.');
        }

        this.isLoading = true;
        this._updateProgress('Starting...', 0);

        try {
            // Check file size
            await this._checkFileSize(url);
            
            const loader = this.loaders[type];
            if (!loader) {
                throw new Error(`Unknown loader type: ${type}`);
            }

            // Configure loader based on options
            this._configureLoader(loader, options);

            // Load file
            const result = await this._loadWithLoader(loader, url, options);
            
            // Process result
            const mesh = this._createMesh(result, options);
            
            // Add to scene
            this.scene.add(mesh);
            
            // Add wireframe if requested
            if (options.wireframe) {
                this._addWireframe(mesh);
            }
            
            // Add bounding box if requested
            if (options.showBoundingBox && result.boundingBox) {
                this._addBoundingBox(result.boundingBox);
            }
            
            this._updateProgress('Complete!', 100);
            
            console.log(`Successfully loaded ${type.toUpperCase()} file:`, {
                url,
                result,
                mesh,
                stats: this._getStats(result)
            });
            
            return {
                mesh,
                geometry: result,
                type,
                url
            };
            
        } catch (error) {
            console.error(`Failed to load ${type.toUpperCase()} file:`, error);
            throw error;
        } finally {
            this.isLoading = false;
            setTimeout(() => this._updateProgress('', 0), 2000);
        }
    }

    /**
     * Configure loader based on options
     * @param {object} loader - Loader instance
     * @param {object} options - Loading options
     */
    _configureLoader(loader, options) {
        // Set material
        if (options.material) {
            loader.setMaterial(options.material);
        } else {
            // Default material based on type
            const defaultMaterial = this._getDefaultMaterial(options);
            loader.setMaterial(defaultMaterial);
        }
        
        // Set materials for multi-material support
        if (options.materials) {
            loader.setMaterials(options.materials);
        }
        
        // Configure loader-specific options
        if (loader instanceof STLLoader) {
            loader.setUseWorker(options.useWorker || this.options.enableWorkers);
        } else if (loader instanceof PLYLoader) {
            loader.setEncoding(options.encoding || 'utf-8');
        } else if (loader instanceof EnhancedJSONLoader) {
            if (options.texturePath) {
                loader.setTexturePath(options.texturePath);
            }
            if (options.parseOptions) {
                loader.setOptions(options.parseOptions);
            }
        }
    }

    /**
     * Get default material based on options
     * @param {object} options - Loading options
     * @returns {object} Default material
     */
    _getDefaultMaterial(options) {
        const color = options.color || 0x888888;
        const wireframe = options.wireframe || this.options.enableWireframe;
        
        if (options.materialType === 'basic') {
            return new MeshBasicMaterial({ color, wireframe });
        } else if (options.materialType === 'phong') {
            return new MeshPhongMaterial({ color, wireframe });
        } else {
            return new MeshLambertMaterial({ color, wireframe });
        }
    }

    /**
     * Load file using specified loader
     * @param {object} loader - Loader instance
     * @param {string} url - File URL
     * @param {object} options - Loading options
     * @returns {Promise} Promise resolving to loaded data
     */
    _loadWithLoader(loader, url, options) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            loader.load(url, 
                (result) => {
                    const loadTime = Date.now() - startTime;
                    console.log(`Load completed in ${loadTime}ms`);
                    resolve(result);
                },
                (progress) => {
                    if (options.onProgress) {
                        options.onProgress(progress);
                    }
                },
                (error) => {
                    console.error('Load error:', error);
                    reject(new Error(`Failed to load file: ${error.message}`));
                }
            );
        });
    }

    /**
     * Create Three.js mesh from loaded data
     * @param {object} data - Loaded geometry data
     * @param {object} options - Loading options
     * @returns {object} Three.js mesh
     */
    _createMesh(data, options) {
        // If the data is already a mesh, return it
        if (data.isMesh) {
            return data;
        }
        
        // Create mesh from geometry data
        const geometry = this._createGeometry(data);
        const material = this._getMaterial(data, options);
        
        const mesh = new Mesh(geometry, material);
        
        // Add metadata
        mesh.userData = {
            loaderType: data.type,
            format: data.format,
            vertexCount: data.vertices ? data.vertices.length / 3 : 0,
            triangleCount: data.indices ? data.indices.length / 3 : 0,
            boundingBox: data.boundingBox,
            loadOptions: options
        };
        
        return mesh;
    }

    /**
     * Create Three.js geometry from data
     * @param {object} data - Loaded geometry data
     * @returns {object} Three.js geometry
     */
    _createGeometry(data) {
        // This would create a Three.js BufferGeometry
        // For this example, we'll create a simplified version
        const geometry = {
            attributes: {},
            index: null,
            userData: data
        };
        
        // Add vertex attributes
        if (data.vertices) {
            geometry.attributes.position = {
                array: new Float32Array(data.vertices),
                itemSize: 3
            };
        }
        
        if (data.normals) {
            geometry.attributes.normal = {
                array: new Float32Array(data.normals),
                itemSize: 3
            };
        }
        
        if (data.uvs) {
            geometry.attributes.uv = {
                array: new Float32Array(data.uvs),
                itemSize: 2
            };
        }
        
        if (data.colors) {
            geometry.attributes.color = {
                array: new Float32Array(data.colors),
                itemSize: 3
            };
        }
        
        if (data.indices) {
            geometry.index = {
                array: new Uint32Array(data.indices),
                itemSize: 1
            };
        }
        
        return geometry;
    }

    /**
     * Get material for mesh
     * @param {object} data - Geometry data
     * @param {object} options - Loading options
     * @returns {object} Material
     */
    _getMaterial(data, options) {
        // Check if material was set by loader
        if (data.material) {
            return data.material;
        }
        
        // Check if materials array was set
        if (data.materials && data.materials.length > 0) {
            return data.materials;
        }
        
        // Return default material
        return this._getDefaultMaterial(options);
    }

    /**
     * Add wireframe to mesh
     * @param {object} mesh - Mesh to add wireframe to
     */
    _addWireframe(mesh) {
        const wireframeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.3 
        });
        
        const wireframe = new THREE.Mesh(mesh.geometry, wireframeMaterial);
        wireframe.position.copy(mesh.position);
        wireframe.rotation.copy(mesh.rotation);
        wireframe.scale.copy(mesh.scale);
        
        this.scene.add(wireframe);
    }

    /**
     * Add bounding box visualization
     * @param {object} boundingBox - Bounding box data
     */
    _addBoundingBox(boundingBox) {
        // Create bounding box wireframe
        const boxGeometry = new THREE.BoxGeometry(
            boundingBox.size[0],
            boundingBox.size[1], 
            boundingBox.size[2]
        );
        
        const boxMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });
        
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(
            boundingBox.center[0],
            boundingBox.center[1],
            boundingBox.center[2]
        );
        
        this.scene.add(box);
    }

    /**
     * Check file size before loading
     * @param {string} url - File URL
     */
    async _checkFileSize(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            
            if (contentLength) {
                const sizeInBytes = parseInt(contentLength);
                const sizeInMB = sizeInBytes / (1024 * 1024);
                
                if (sizeInMB > this.options.maxFileSize / (1024 * 1024)) {
                    throw new Error(`File too large: ${sizeInMB.toFixed(1)}MB (max: ${this.options.maxFileSize / (1024 * 1024)}MB)`);
                }
            }
        } catch (error) {
            // Ignore errors from HEAD request - proceed with loading
            console.warn('Could not check file size:', error.message);
        }
    }

    /**
     * Get statistics about loaded geometry
     * @param {object} data - Geometry data
     * @returns {object} Statistics
     */
    _getStats(data) {
        return {
            vertexCount: data.vertices ? data.vertices.length / 3 : 0,
            triangleCount: data.indices ? data.indices.length / 3 : 0,
            hasNormals: !!data.normals,
            hasUVs: !!data.uvs,
            hasColors: !!data.colors,
            hasTangents: !!data.tangents,
            format: data.format,
            sizeInBytes: this._calculateDataSize(data)
        };
    }

    /**
     * Calculate approximate data size
     * @param {object} data - Geometry data
     * @returns {number} Size in bytes
     */
    _calculateDataSize(data) {
        let size = 0;
        
        if (data.vertices) size += data.vertices.length * 4; // Float32
        if (data.normals) size += data.normals.length * 4; // Float32
        if (data.uvs) size += data.uvs.length * 4; // Float32
        if (data.colors) size += data.colors.length * 4; // Float32
        if (data.indices) size += data.indices.length * 4; // Uint32
        
        return size;
    }

    /**
     * Update progress display
     * @param {string} message - Progress message
     * @param {number} percentage - Progress percentage
     */
    _updateProgress(message, percentage) {
        // Emit progress event for UI integration
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('loaderProgress', {
                detail: { message, percentage }
            }));
        }
    }

    /**
     * Start render loop
     */
    _startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }

    /**
     * Clear scene
     */
    clear() {
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            this.scene.remove(object);
            
            // Dispose of geometry and materials
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => mat.dispose());
                } else {
                    object.material.dispose();
                }
            }
        }
    }

    /**
     * Resize renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Dispose of resources
     */
    dispose() {
        this.clear();
        this.renderer.dispose();
        
        // Clear loader caches
        Object.values(this.loaders).forEach(loader => {
            if (loader.textureCache) {
                loader.textureCache.clear();
            }
        });
        
        this.loaders = {};
    }

    /**
     * Get loader instances for external use
     * @returns {object} Loader instances
     */
    getLoaders() {
        return { ...this.loaders };
    }

    /**
     * Enable/disable wireframe mode
     * @param {boolean} enabled - Enable wireframe
     */
    setWireframe(enabled) {
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(mat => {
                        mat.wireframe = enabled;
                    });
                } else {
                    object.material.wireframe = enabled;
                }
            }
        });
    }
}

// Export for use as standalone module
export default LoadersExample;
