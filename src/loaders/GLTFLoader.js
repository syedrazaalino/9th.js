/**
 * GLTFLoader.js - Comprehensive GLTF 2.0 loader with animations
 * Supports both JSON (.gltf) and binary (.glb) formats
 * Includes scene hierarchy, mesh data, materials, animations, cameras, lights, and skinned meshes
 */

import { Loader, LoadingManager } from './loader.ts';
import { Object3D } from '../core/Object3D.js';
import { Mesh, MeshConfig } from '../core/Mesh.js';
import { BufferGeometry, VertexAttribute } from '../core/BufferGeometry.js';
import { AnimationMixer } from '../animation/AnimationMixer.js';
import { AnimationClip } from '../animation/AnimationClip.js';
import { VectorKeyframeTrack, QuaternionKeyframeTrack, NumberKeyframeTrack } from '../animation/KeyframeTrack.js';
import { MeshStandardMaterial } from '../materials/MeshStandardMaterial.js';
import { MeshPhongMaterial } from '../materials/MeshPhongMaterial.js';
import { MeshBasicMaterial } from '../materials/MeshBasicMaterial.js';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera.js';
import { DirectionalLight } from '../lights/DirectionalLight.js';
import { PointLight } from '../lights/PointLight.js';
import { SpotLight } from '../lights/SpotLight.js';
import { AmbientLight } from '../lights/AmbientLight.js';
import { TextureLoader } from './TextureLoader.js';

/**
 * GLTF Loader configuration
 */
export class GLTFLoaderConfig {
    constructor() {
        this.crossOrigin = 'anonymous';
        this.withCredentials = false;
        this.flipY = true;
        this.parseBinary = true;
        this.animations = true;
        this.materials = true;
        this.cameras = true;
        this.lights = true;
        this.skins = true;
        this.extras = true;
    }
}

/**
 * GLTF asset container
 */
export class GLTFAsset {
    constructor() {
        this.scene = null;
        this.scenes = [];
        this.nodes = [];
        this.meshes = [];
        this.materials = [];
        this.textures = [];
        this.images = [];
        this.animations = [];
        this.cameras = [];
        this.lights = [];
        this.skins = [];
        this.buffers = [];
        this.bufferViews = [];
        this.accessors = [];
        this.asset = null;
        this.extras = {};
    }
}

/**
 * GLTF 2.0 Loader
 */
export class GLTFLoader extends Loader {
    constructor(manager = LoadingManager.default) {
        super(manager);
        this.config = new GLTFLoaderConfig();
        this.textureLoader = new TextureLoader(manager);
        this.parsing = false;
        this.json = null;
        this.bin = null;
        this.bufferCache = new Map();
        this.urlCache = new Map();
        this.textureCache = new Map();
        this.materialCache = new Map();
        this.nodeCache = new Map();
        
        // Extension support
        this.extensions = {};
        this.registerExtension('KHR_materials_pbrSpecularGlossiness', this._loadSpecularGlossinessExtension.bind(this));
        this.registerExtension('KHR_materials_unlit', this._loadUnlitExtension.bind(this));
        this.registerExtension('KHR_texture_transform', this._loadTextureTransformExtension.bind(this));
        this.registerExtension('KHR_materials_clearcoat', this._loadClearcoatExtension.bind(this));
    }

    /**
     * Register GLTF extension handler
     */
    registerExtension(name, handler) {
        this.extensions[name] = handler;
    }

    /**
     * Load GLTF file (JSON or GLB)
     */
    load(url, onLoad, onProgress, onError) {
        this.setPath(this._extractBasePath(url));
        
        if (url.toLowerCase().endsWith('.glb')) {
            this._loadGLB(url, onLoad, onProgress, onError);
        } else {
            this._loadGLTF(url, onLoad, onProgress, onError);
        }
    }

    /**
     * Parse GLTF JSON string
     */
    parse(gltfJSON, onLoad, onError) {
        try {
            this.json = typeof gltfJSON === 'string' ? JSON.parse(gltfJSON) : gltfJSON;
            this._parseGltf(onLoad, onError);
        } catch (error) {
            onError?.(error);
        }
    }

    /**
     * Parse GLB binary data
     */
    parseBinary(glbData, onLoad, onError) {
        try {
            const glb = this._parseGLB(glbData);
            this.json = glb.json;
            this.bin = glb.bin;
            this._parseGltf(onLoad, onError);
        } catch (error) {
            onError?.(error);
        }
    }

    /**
     * Load GLTF JSON format
     */
    _loadGLTF(url, onLoad, onProgress, onError) {
        this.manager.itemStart(url);
        
        fetch(url, {
            crossOrigin: this.crossOrigin,
            withCredentials: this.withCredentials
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(gltf => {
            this.json = gltf;
            this._parseGltf(onLoad, onError);
            this.manager.itemEnd(url);
        })
        .catch(error => {
            this.manager.itemError(url);
            onError?.(error);
        });
    }

    /**
     * Load GLB binary format
     */
    _loadGLB(url, onLoad, onProgress, onError) {
        this.manager.itemStart(url);
        
        fetch(url, {
            crossOrigin: this.crossOrigin,
            withCredentials: this.withCredentials
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            return response.arrayBuffer();
        })
        .then(buffer => {
            this.parseBinary(buffer, onLoad, onError);
            this.manager.itemEnd(url);
        })
        .catch(error => {
            this.manager.itemError(url);
            onError?.(error);
        });
    }

    /**
     * Parse GLTF data
     */
    async _parseGltf(onLoad, onError) {
        try {
            this.parsing = true;
            const asset = new GLTFAsset();
            
            // Validate GLTF version
            if (this.json.asset?.version !== '2.0') {
                throw new Error('Only GLTF 2.0 is supported');
            }

            asset.asset = this.json.asset;
            
            // Load external resources
            await this._loadExternalResources();
            
            // Parse all components
            this._parseAsset(asset);
            this._parseScenes(asset);
            this._parseNodes(asset);
            this._parseMeshes(asset);
            this._parseMaterials(asset);
            this._parseTextures(asset);
            this._parseImages(asset);
            this._parseAccessors(asset);
            this._parseBufferViews(asset);
            this._parseBuffers(asset);
            this._parseAnimations(asset);
            this._parseCameras(asset);
            this._parseLights(asset);
            this._parseSkins(asset);
            this._parseExtras(asset);

            this.parsing = false;
            onLoad?.(asset);
        } catch (error) {
            this.parsing = false;
            onError?.(error);
        }
    }

    /**
     * Load external resources (buffers, images)
     */
    async _loadExternalResources() {
        const promises = [];
        
        // Load external buffers
        if (this.json.buffers) {
            this.json.buffers.forEach((buffer, index) => {
                if (buffer.uri && !this._isDataUri(buffer.uri)) {
                    promises.push(this._loadBuffer(buffer.uri, index));
                }
            });
        }
        
        // Load external images
        if (this.json.images) {
            this.json.images.forEach((image, index) => {
                if (image.uri && !this._isDataUri(image.uri)) {
                    promises.push(this._loadImage(image.uri, index));
                }
            });
        }
        
        await Promise.all(promises);
    }

    /**
     * Load external buffer
     */
    _loadBuffer(uri, index) {
        const url = this.basePath + uri;
        this.manager.itemStart(url);
        
        return fetch(url, {
            crossOrigin: this.crossOrigin,
            withCredentials: this.withCredentials
        })
        .then(response => {
            if (!response.ok) throw new Error(`Failed to load buffer: ${response.statusText}`);
            return response.arrayBuffer();
        })
        .then(buffer => {
            this.bufferCache.set(index, new Uint8Array(buffer));
            this.manager.itemEnd(url);
        })
        .catch(error => {
            this.manager.itemError(url);
            throw error;
        });
    }

    /**
     * Load external image
     */
    _loadImage(uri, index) {
        const url = this.basePath + uri;
        this.manager.itemStart(url);
        
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, texture => {
                this.textureCache.set(index, texture);
                this.manager.itemEnd(url);
                resolve(texture);
            }, progress => {
                // Progress callback
            }, error => {
                this.manager.itemError(url);
                reject(error);
            });
        });
    }

    /**
     * Parse GLB binary format
     */
    _parseGLB(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        const magic = dataView.getUint32(0, true);
        
        if (magic !== 0x46546C67) { // 'glTF'
            throw new Error('Invalid GLB magic number');
        }
        
        const version = dataView.getUint32(4, true);
        if (version !== 2) {
            throw new Error('Unsupported GLB version');
        }
        
        const length = dataView.getUint32(8, true);
        let offset = 12;
        let json = null;
        let bin = null;
        
        while (offset < length) {
            const chunkLength = dataView.getUint32(offset, true);
            const chunkType = dataView.getUint32(offset + 4, true);
            const chunkData = new Uint8Array(arrayBuffer, offset + 8, chunkLength);
            
            if (chunkType === 0x4E4F534A) { // JSON chunk
                json = JSON.parse(new TextDecoder().decode(chunkData));
            } else if (chunkType === 0x004E4942) { // BIN chunk
                bin = chunkData;
            }
            
            offset += 8 + chunkLength;
        }
        
        if (!json) {
            throw new Error('GLB file missing JSON chunk');
        }
        
        return { json, bin };
    }

    /**
     * Parse asset metadata
     */
    _parseAsset(asset) {
        if (this.json.asset) {
            asset.asset = {
                version: this.json.asset.version,
                generator: this.json.asset.generator,
                copyright: this.json.asset.copyright,
                extensions: this.json.asset.extensions
            };
        }
    }

    /**
     * Parse scenes
     */
    _parseScenes(asset) {
        if (this.json.scenes) {
            this.json.scenes.forEach((sceneData, index) => {
                const scene = new Object3D();
                scene.name = sceneData.name || `Scene_${index}`;
                scene.extras = sceneData.extras || {};
                
                asset.scenes.push(scene);
                if (!asset.scene && index === (this.json.scene || 0)) {
                    asset.scene = scene;
                }
            });
        }
    }

    /**
     * Parse nodes
     */
    _parseNodes(asset) {
        if (!this.json.nodes) return;
        
        this.json.nodes.forEach((nodeData, index) => {
            const node = new Object3D();
            node.name = nodeData.name || `Node_${index}`;
            
            // Transform
            if (nodeData.matrix) {
                this._setMatrixFromArray(node, nodeData.matrix);
            } else {
                if (nodeData.translation) node.position = { x: nodeData.translation[0], y: nodeData.translation[1], z: nodeData.translation[2] };
                if (nodeData.rotation) {
                    node.rotation = { x: nodeData.rotation[0], y: nodeData.rotation[1], z: nodeData.rotation[2] };
                    node.rotation.w = nodeData.rotation[3];
                }
                if (nodeData.scale) node.scale = { x: nodeData.scale[0], y: nodeData.scale[1], z: nodeData.scale[2] };
            }
            
            // Hierarchy
            if (nodeData.children) {
                node.children = nodeData.children.map(childIndex => 
                    asset.nodes[childIndex]
                ).filter(child => child !== undefined);
            }
            
            node.extras = nodeData.extras || {};
            asset.nodes.push(node);
        });
    }

    /**
     * Parse meshes
     */
    _parseMeshes(asset) {
        if (!this.json.meshes) return;
        
        this.json.meshes.forEach((meshData, index) => {
            const mesh = this._createMeshFromData(meshData);
            mesh.name = meshData.name || `Mesh_${index}`;
            mesh.extras = meshData.extras || {};
            asset.meshes.push(mesh);
        });
    }

    /**
     * Create mesh from GLTF mesh data
     */
    _createMeshFromData(meshData) {
        const mesh = new Mesh();
        
        // Parse primitives
        if (meshData.primitives) {
            mesh.primitives = meshData.primitives.map(primitiveData => {
                const geometry = this._createGeometryFromPrimitive(primitiveData);
                const material = this._getMaterial(primitiveData.material);
                
                return {
                    geometry,
                    material,
                    mode: primitiveData.mode || 4, // TRIANGLES
                    indices: primitiveData.indices
                };
            });
        }
        
        // Parse morph targets
        if (meshData.weights) {
            mesh.weights = meshData.weights;
        }
        
        if (meshData.extras?.targetNames) {
            mesh.morphTargetNames = meshData.extras.targetNames;
        }
        
        return mesh;
    }

    /**
     * Create geometry from primitive
     */
    _createGeometryFromPrimitive(primitiveData) {
        const geometry = new BufferGeometry();
        
        // Parse attributes
        if (primitiveData.attributes) {
            Object.entries(primitiveData.attributes).forEach(([attrName, accessorIndex]) => {
                const accessor = this.json.accessors[accessorIndex];
                const bufferView = this.json.bufferViews[accessor.bufferView];
                
                const attribute = this._createVertexAttribute(attrName, accessor, bufferView);
                geometry.setAttribute(attrName, attribute);
            });
        }
        
        // Parse indices
        if (primitiveData.indices !== undefined) {
            const accessor = this.json.accessors[primitiveData.indices];
            const bufferView = this.json.bufferViews[accessor.bufferView];
            const indices = this._getAccessorData(accessor, bufferView);
            geometry.setIndex(indices);
        }
        
        return geometry;
    }

    /**
     * Create vertex attribute
     */
    _createVertexAttribute(attrName, accessor, bufferView) {
        const data = this._getAccessorData(accessor, bufferView);
        const componentType = this._getComponentType(accessor.componentType);
        const normalized = accessor.normalized || false;
        
        const attribute = new VertexAttribute(
            attrName,
            accessor.type === 'VEC2' ? 2 :
            accessor.type === 'VEC3' ? 3 :
            accessor.type === 'VEC4' ? 4 : 1,
            componentType,
            normalized
        );
        
        attribute.array = data;
        return attribute;
    }

    /**
     * Get data from accessor
     */
    _getAccessorData(accessor, bufferView) {
        const bufferIndex = bufferView.buffer;
        let bufferData = this.bufferCache.get(bufferIndex);
        
        if (!bufferData && this.bin) {
            bufferData = this.bin;
        }
        
        if (!bufferData) {
            throw new Error(`Buffer ${bufferIndex} not loaded`);
        }
        
        const byteOffset = bufferView.byteOffset + (accessor.byteOffset || 0);
        const byteLength = accessor.count * this._getComponentSize(accessor.componentType) * 
                          (accessor.type === 'SCALAR' ? 1 :
                           accessor.type === 'VEC2' ? 2 :
                           accessor.type === 'VEC3' ? 3 : 4);
        
        const typedArray = this._createTypedArray(
            accessor.componentType,
            bufferData.buffer,
            bufferData.byteOffset + byteOffset,
            accessor.count * this._getComponentCount(accessor.type)
        );
        
        return typedArray;
    }

    /**
     * Parse materials
     */
    _parseMaterials(asset) {
        if (!this.json.materials) return;
        
        this.json.materials.forEach((materialData, index) => {
            const material = this._createMaterialFromData(materialData);
            material.name = materialData.name || `Material_${index}`;
            material.extras = materialData.extras || {};
            asset.materials.push(material);
            this.materialCache.set(index, material);
        });
    }

    /**
     * Create material from GLTF material data
     */
    _createMaterialFromData(materialData) {
        let material;
        
        // Handle PBR materials
        if (materialData.pbrMetallicRoughness) {
            material = new MeshStandardMaterial({
                color: materialData.pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1],
                metalness: materialData.pbrMetallicRoughness.metallicFactor || 0,
                roughness: materialData.pbrMetallicRoughness.roughnessFactor || 1,
                opacity: materialData.pbrMetallicRoughness.baseColorFactor?.[3] || 1,
                transparent: (materialData.pbrMetallicRoughness.baseColorFactor?.[3] || 1) < 1
            });
            
            // Textures
            if (materialData.pbrMetallicRoughness.baseColorTexture) {
                const texture = this._getTexture(materialData.pbrMetallicRoughness.baseColorTexture.index);
                material.map = texture;
            }
            
            if (materialData.pbrMetallicRoughness.metallicRoughnessTexture) {
                const texture = this._getTexture(materialData.pbrMetallicRoughness.metallicRoughnessTexture.index);
                material.metalnessMap = texture;
                material.roughnessMap = texture;
            }
        } else if (materialData.extensions?.KHR_materials_pbrSpecularGlossiness) {
            // Specular-Glossiness workflow
            const sg = materialData.extensions.KHR_materials_pbrSpecularGlossiness;
            material = new MeshStandardMaterial({
                color: sg.diffuseFactor || [1, 1, 1, 1],
                metalness: 0,
                roughness: 1 - (sg.glossinessFactor || 1),
                opacity: sg.diffuseFactor?.[3] || 1,
                transparent: (sg.diffuseFactor?.[3] || 1) < 1
            });
        } else {
            // Fallback material
            material = new MeshBasicMaterial({ color: [0.8, 0.8, 0.8] });
        }
        
        // Normal map
        if (materialData.normalTexture) {
            const texture = this._getTexture(materialData.normalTexture.index);
            material.normalMap = texture;
            if (materialData.normalTexture.scale) {
                material.normalScale = [materialData.normalTexture.scale, materialData.normalTexture.scale];
            }
        }
        
        // Emissive map
        if (materialData.emissiveTexture) {
            const texture = this._getTexture(materialData.emissiveTexture.index);
            material.emissiveMap = texture;
            material.emissive = materialData.emissiveFactor || [0, 0, 0];
        }
        
        // Occlusion map
        if (materialData.occlusionTexture) {
            const texture = this._getTexture(materialData.occlusionTexture.index);
            material.aoMap = texture;
        }
        
        // Alpha mode
        if (materialData.alphaMode) {
            switch (materialData.alphaMode) {
                case 'BLEND':
                    material.transparent = true;
                    break;
                case 'MASK':
                    material.alphaTest = materialData.alphaCutoff || 0.5;
                    break;
            }
        }
        
        // Double sided
        material.side = materialData.doubleSided ? 2 : 0; // THREE.DoubleSide : THREE.FrontSide
        
        return material;
    }

    /**
     * Parse textures
     */
    _parseTextures(asset) {
        if (!this.json.textures) return;
        
        this.json.textures.forEach((textureData, index) => {
            let texture = null;
            
            if (textureData.source !== undefined) {
                texture = this._getTexture(textureData.source);
            }
            
            asset.textures.push(texture);
        });
    }

    /**
     * Parse images
     */
    _parseImages(asset) {
        if (!this.json.images) return;
        
        this.json.images.forEach((imageData, index) => {
            let image = null;
            
            if (imageData.uri) {
                if (this._isDataUri(imageData.uri)) {
                    image = this._loadDataUri(imageData.uri);
                } else if (this.textureCache.has(index)) {
                    image = this.textureCache.get(index);
                }
            }
            
            asset.images.push(image);
        });
    }

    /**
     * Parse accessors
     */
    _parseAccessors(asset) {
        if (!this.json.accessors) return;
        
        this.json.accessors.forEach(accessorData => {
            const accessor = {
                componentType: accessorData.componentType,
                count: accessorData.count,
                type: accessorData.type,
                byteOffset: accessorData.byteOffset || 0,
                byteStride: accessorData.byteStride,
                normalized: accessorData.normalized || false,
                min: accessorData.min,
                max: accessorData.max,
                sparse: accessorData.sparse
            };
            
            asset.accessors.push(accessor);
        });
    }

    /**
     * Parse buffer views
     */
    _parseBufferViews(asset) {
        if (!this.json.bufferViews) return;
        
        this.json.bufferViews.forEach(bufferViewData => {
            const bufferView = {
                buffer: bufferViewData.buffer,
                byteOffset: bufferViewData.byteOffset || 0,
                byteLength: bufferViewData.byteLength,
                byteStride: bufferViewData.byteStride,
                target: bufferViewData.target
            };
            
            asset.bufferViews.push(bufferView);
        });
    }

    /**
     * Parse buffers
     */
    _parseBuffers(asset) {
        if (!this.json.buffers) return;
        
        this.json.buffers.forEach(bufferData => {
            const buffer = {
                uri: bufferData.uri,
                byteLength: bufferData.byteLength,
                data: bufferData.uri ? null : this.bin
            };
            
            asset.buffers.push(buffer);
        });
    }

    /**
     * Parse animations
     */
    _parseAnimations(asset) {
        if (!this.json.animations || !this.config.animations) return;
        
        this.json.animations.forEach((animationData, index) => {
            const clip = this._createAnimationClip(animationData);
            clip.name = animationData.name || `Animation_${index}`;
            asset.animations.push(clip);
        });
    }

    /**
     * Create animation clip from GLTF animation data
     */
    _createAnimationClip(animationData) {
        const tracks = [];
        
        if (animationData.channels) {
            animationData.channels.forEach((channel, index) => {
                const sampler = animationData.samplers[channel.sampler];
                const targetNode = this.json.nodes[channel.target.node];
                
                if (!sampler || !targetNode) return;
                
                const times = this._getAnimationInput(sampler.input);
                const values = this._getAnimationOutput(sampler.output);
                
                let track;
                const path = channel.target.path;
                
                if (path === 'translation') {
                    track = new VectorKeyframeTrack(targetNode.name || `Node_${channel.target.node}`, times, values);
                } else if (path === 'rotation') {
                    track = new QuaternionKeyframeTrack(targetNode.name || `Node_${channel.target.node}`, times, values);
                } else if (path === 'scale') {
                    track = new VectorKeyframeTrack(targetNode.name || `Node_${channel.target.node}`, times, values);
                } else if (path === 'weights') {
                    track = new NumberKeyframeTrack(targetNode.name || `Node_${channel.target.node}`, times, values);
                }
                
                if (track) {
                    tracks.push(track);
                }
            });
        }
        
        return new AnimationClip(animationData.name || `Animation_${index}`, -1, tracks);
    }

    /**
     * Get animation input (times)
     */
    _getAnimationInput(accessorIndex) {
        const accessor = this.json.accessors[accessorIndex];
        const bufferView = this.json.bufferViews[accessor.bufferView];
        return this._getAccessorData(accessor, bufferView);
    }

    /**
     * Get animation output (values)
     */
    _getAnimationOutput(accessorIndex) {
        const accessor = this.json.accessors[accessorIndex];
        const bufferView = this.json.bufferViews[accessor.bufferView];
        return this._getAccessorData(accessor, bufferView);
    }

    /**
     * Parse cameras
     */
    _parseCameras(asset) {
        if (!this.json.cameras || !this.config.cameras) return;
        
        this.json.cameras.forEach((cameraData, index) => {
            let camera = null;
            
            if (cameraData.type === 'perspective') {
                camera = new PerspectiveCamera();
                camera.fov = cameraData.perspective.yfov * 180 / Math.PI;
                camera.aspect = cameraData.perspective.aspectRatio || 1;
                camera.near = cameraData.perspective.znear;
                camera.far = cameraData.perspective.zfar;
            } else if (cameraData.type === 'orthographic') {
                // Orthographic camera would need to be implemented
                console.warn('Orthographic cameras are not yet implemented');
            }
            
            if (camera) {
                camera.name = cameraData.name || `Camera_${index}`;
                asset.cameras.push(camera);
            }
        });
    }

    /**
     * Parse lights
     */
    _parseLights(asset) {
        if (!this.json.extensions || !this.json.extensions.KHR_lights_punctual || !this.config.lights) return;
        
        const lights = this.json.extensions.KHR_lights_punctual.lights;
        
        lights.forEach((lightData, index) => {
            let light = null;
            
            if (lightData.type === 'directional') {
                light = new DirectionalLight();
                light.intensity = lightData.intensity || 1;
            } else if (lightData.type === 'point') {
                light = new PointLight();
                light.intensity = lightData.intensity || 1;
                light.distance = lightData.range || 0;
            } else if (lightData.type === 'spot') {
                light = new SpotLight();
                light.intensity = lightData.intensity || 1;
                light.distance = lightData.range || 0;
                light.angle = (lightData.spot?.innerConeAngle || 0) * Math.PI / 180;
                light.penumbra = lightData.spot?.outerConeAngle || 0;
            } else if (lightData.type === 'ambient') {
                light = new AmbientLight();
                light.intensity = lightData.intensity || 1;
            }
            
            if (light) {
                light.name = lightData.name || `Light_${index}`;
                if (lightData.color) {
                    light.color = { r: lightData.color[0], g: lightData.color[1], b: lightData.color[2] };
                }
                asset.lights.push(light);
            }
        });
    }

    /**
     * Parse skins (skinned meshes)
     */
    _parseSkins(asset) {
        if (!this.json.skins || !this.config.skins) return;
        
        this.json.skins.forEach((skinData, index) => {
            const skin = {
                name: skinData.name || `Skin_${index}`,
                skeleton: skinData.skeleton,
                joints: skinData.joints,
                inverseBindMatrices: skinData.inverseBindMatrices
            };
            
            asset.skins.push(skin);
        });
    }

    /**
     * Parse extras
     */
    _parseExtras(asset) {
        if (!this.config.extras) return;
        
        asset.extras = this.json.extras || {};
    }

    /**
     * Utility methods
     */
    
    _setMatrixFromArray(object, array) {
        const matrix = new Float32Array(array);
        // Implement matrix decomposition if needed
        // For now, we'll skip full matrix support
    }
    
    _getMaterial(index) {
        if (index === undefined || index === null) return null;
        return this.materialCache.get(index) || new MeshBasicMaterial({ color: [0.8, 0.8, 0.8] });
    }
    
    _getTexture(index) {
        if (index === undefined || index === null) return null;
        const assetTextures = this.json.textures;
        if (!assetTextures) return null;
        
        const textureData = assetTextures[index];
        if (!textureData) return null;
        
        return this.textureCache.get(textureData.source) || null;
    }
    
    _getComponentType(componentType) {
        switch (componentType) {
            case 5120: return WebGLRenderingContext.BYTE;
            case 5121: return WebGLRenderingContext.UNSIGNED_BYTE;
            case 5122: return WebGLRenderingContext.SHORT;
            case 5123: return WebGLRenderingContext.UNSIGNED_SHORT;
            case 5125: return WebGLRenderingContext.UNSIGNED_INT;
            case 5126: return WebGLRenderingContext.FLOAT;
            default: return WebGLRenderingContext.FLOAT;
        }
    }
    
    _getComponentSize(componentType) {
        switch (componentType) {
            case 5120: return 1; // BYTE
            case 5121: return 1; // UNSIGNED_BYTE
            case 5122: return 2; // SHORT
            case 5123: return 2; // UNSIGNED_SHORT
            case 5125: return 4; // UNSIGNED_INT
            case 5126: return 4; // FLOAT
            default: return 4;
        }
    }
    
    _getComponentCount(type) {
        switch (type) {
            case 'SCALAR': return 1;
            case 'VEC2': return 2;
            case 'VEC3': return 3;
            case 'VEC4': return 4;
            case 'MAT2': return 4;
            case 'MAT3': return 9;
            case 'MAT4': return 16;
            default: return 1;
        }
    }
    
    _createTypedArray(componentType, buffer, byteOffset, length) {
        switch (componentType) {
            case 5120: return new Int8Array(buffer, byteOffset, length);
            case 5121: return new Uint8Array(buffer, byteOffset, length);
            case 5122: return new Int16Array(buffer, byteOffset, length);
            case 5123: return new Uint16Array(buffer, byteOffset, length);
            case 5125: return new Uint32Array(buffer, byteOffset, length);
            case 5126: return new Float32Array(buffer, byteOffset, length);
            default: return new Float32Array(buffer, byteOffset, length);
        }
    }
    
    _isDataUri(uri) {
        return uri.startsWith('data:');
    }
    
    _loadDataUri(uri) {
        // Parse data URI to extract image data
        const matches = uri.match(/^data:(.+?);base64,(.*)$/);
        if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const binaryData = atob(base64Data);
            const arrayBuffer = new ArrayBuffer(binaryData.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < binaryData.length; i++) {
                uint8Array[i] = binaryData.charCodeAt(i);
            }
            
            return arrayBuffer;
        }
        return null;
    }
    
    _extractBasePath(url) {
        const lastSlash = url.lastIndexOf('/');
        return lastSlash !== -1 ? url.substring(0, lastSlash + 1) : '';
    }

    /**
     * Extension handlers
     */
    
    _loadSpecularGlossinessExtension(extensionData, material) {
        if (extensionData.diffuseTexture) {
            material.map = this._getTexture(extensionData.diffuseTexture.index);
        }
        if (extensionData.specularGlossinessTexture) {
            material.specularMap = this._getTexture(extensionData.specularGlossinessTexture.index);
        }
        if (extensionData.glossinessFactor !== undefined) {
            material.glossiness = extensionData.glossinessFactor;
        }
    }
    
    _loadUnlitExtension(extensionData, material) {
        material.emissive = material.color || [1, 1, 1];
        material.emissiveIntensity = 1;
    }
    
    _loadTextureTransformExtension(extensionData, texture) {
        // Apply UV transform to texture
        if (extensionData.offset) {
            texture.offset = extensionData.offset;
        }
        if (extensionData.rotation) {
            texture.rotation = extensionData.rotation;
        }
        if (extensionData.scale) {
            texture.repeat = extensionData.scale;
        }
    }
    
    _loadClearcoatExtension(extensionData, material) {
        if (extensionData.clearcoatFactor !== undefined) {
            material.clearcoat = extensionData.clearcoatFactor;
        }
        if (extensionData.clearcoatRoughnessFactor !== undefined) {
            material.clearcoatRoughness = extensionData.clearcoatRoughnessFactor;
        }
        if (extensionData.clearcoatTexture) {
            material.clearcoatMap = this._getTexture(extensionData.clearcoatTexture.index);
        }
        if (extensionData.clearcoatRoughnessTexture) {
            material.clearcoatRoughnessMap = this._getTexture(extensionData.clearcoatRoughnessTexture.index);
        }
    }
}
