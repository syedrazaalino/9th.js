/**
 * SkeletalAnimation.js - Advanced skeletal animation system for character animation
 * Supports bone hierarchies, skinning matrices, animation clips, and blending
 */

import { Matrix4 } from './math/Matrix4.js';
import { Object3D } from './Object3D.js';

export class Bone extends Object3D {
    /**
     * Create a bone for skeletal animation
     * @param {string} name - Bone name
     * @param {Matrix4} inverseBindMatrix - Inverse bind matrix for skinning
     */
    constructor(name, inverseBindMatrix = null) {
        super();
        this.name = name;
        this.inverseBindMatrix = inverseBindMatrix || new Matrix4();
        this.skinIndex = -1; // Index in skinning array
        this.skinWeight = 1.0; // Weight for this bone's influence
        this.restMatrix = new Matrix4(); // Bind/rest pose matrix
        
        // Animation data
        this.animationMatrix = new Matrix4(); // Current animated transform
        this.worldMatrix = new Matrix4(); // World space transform
        
        // Skinned vertex data
        this.weightedVertices = []; // Vertices influenced by this bone
        this.vertexWeights = []; // Weights for each influenced vertex
    }

    /**
     * Update bone transformation for animation
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update world matrix
        this.updateWorldMatrix();
        
        // Calculate animation matrix (world * inverse bind)
        this.animationMatrix.copy(this.worldMatrix);
        this.animationMatrix.multiply(this.inverseBindMatrix);
        
        // Update skinned vertices if we have any
        if (this.weightedVertices.length > 0) {
            this._updateSkinnedVertices();
        }
    }

    /**
     * Set inverse bind matrix
     * @param {Matrix4} matrix - Inverse bind matrix
     */
    setInverseBindMatrix(matrix) {
        this.inverseBindMatrix.copy(matrix);
    }

    /**
     * Set bind pose (rest matrix)
     * @param {Matrix4} matrix - Bind pose matrix
     */
    setBindPose(matrix) {
        this.restMatrix.copy(matrix);
        this.worldMatrix.copy(matrix);
        this.animationMatrix.copy(matrix);
    }

    /**
     * Add vertex influence for skinning
     * @param {number} vertexIndex - Index of vertex
     * @param {number} weight - Weight of influence [0-1]
     */
    addVertexInfluence(vertexIndex, weight) {
        this.weightedVertices.push(vertexIndex);
        this.vertexWeights.push(weight);
    }

    /**
     * Remove vertex influence
     * @param {number} vertexIndex - Index of vertex
     */
    removeVertexInfluence(vertexIndex) {
        const index = this.weightedVertices.indexOf(vertexIndex);
        if (index !== -1) {
            this.weightedVertices.splice(index, 1);
            this.vertexWeights.splice(index, 1);
        }
    }

    /**
     * Update skinned vertices affected by this bone
     * @private
     */
    _updateSkinnedVertices() {
        // This would be implemented to update vertex positions
        // based on bone transformation and weights
        // Implementation depends on how vertices are stored and updated
    }

    /**
     * Clone this bone
     */
    clone() {
        const cloned = new Bone(this.name, this.inverseBindMatrix.clone());
        cloned.skinIndex = this.skinIndex;
        cloned.skinWeight = this.skinWeight;
        cloned.setBindPose(this.restMatrix);
        
        // Copy vertex influences
        cloned.weightedVertices = [...this.weightedVertices];
        cloned.vertexWeights = [...this.vertexWeights];
        
        return cloned;
    }
}

export class AnimationTrack {
    /**
     * Create an animation track
     * @param {string} property - Property being animated (position, rotation, scale)
     * @param {Array} times - Array of keyframe times
     * @param {Array} values - Array of keyframe values
     * @param {string} interpolation - Interpolation method (linear, cubic, step)
     */
    constructor(property, times, values, interpolation = 'linear') {
        this.property = property;
        this.times = new Float32Array(times);
        this.values = new Float32Array(values);
        this.interpolation = interpolation;
        
        // Pre-computed tangents for cubic interpolation
        this.tangents = null;
        this._isCubic = interpolation === 'cubic';
    }

    /**
     * Get interpolated value at given time
     * @param {number} time - Time to interpolate at
     * @returns {number|Array} Interpolated value
     */
    getValueAtTime(time) {
        if (this.times.length === 0) return 0;
        if (this.times.length === 1) return this.values[0];

        // Find appropriate keyframe segment
        const index = this._findKeyframeIndex(time);
        if (index === -1) {
            // Time is before first keyframe
            return this.values[0];
        }
        if (index >= this.times.length) {
            // Time is after last keyframe
            return this.values[this.values.length - 1];
        }

        // Interpolate between keyframes
        const t0 = this.times[index];
        const t1 = this.times[index + 1];
        const alpha = (time - t0) / (t1 - t0);

        const v0 = this._getValueAtIndex(index);
        const v1 = this._getValueAtIndex(index + 1);

        return this._interpolate(v0, v1, alpha, index);
    }

    /**
     * Find keyframe index for given time
     * @private
     * @param {number} time - Time to find
     * @returns {number} Keyframe index
     */
    _findKeyframeIndex(time) {
        // Handle edge cases
        if (time <= this.times[0]) return -1;
        if (time >= this.times[this.times.length - 1]) return this.times.length;

        // Binary search for efficiency
        let left = 0;
        let right = this.times.length - 1;

        while (right - left > 1) {
            const mid = (left + right) >> 1;
            if (this.times[mid] <= time) {
                left = mid;
            } else {
                right = mid;
            }
        }

        return left;
    }

    /**
     * Get value at specific keyframe index
     * @private
     * @param {number} index - Keyframe index
     * @returns {number|Array} Value at index
     */
    _getValueAtIndex(index) {
        const componentCount = this.values.length / this.times.length;
        const offset = index * componentCount;
        
        if (componentCount === 1) {
            return this.values[offset];
        }
        
        const value = new Array(componentCount);
        for (let i = 0; i < componentCount; i++) {
            value[i] = this.values[offset + i];
        }
        return value;
    }

    /**
     * Interpolate between two values
     * @private
     * @param {number|Array} v0 - Start value
     * @param {number|Array} v1 - End value
     * @param {number} alpha - Interpolation factor [0-1]
     * @param {number} index - Keyframe index for cubic interpolation
     * @returns {number|Array} Interpolated value
     */
    _interpolate(v0, v1, alpha, index) {
        switch (this.interpolation) {
            case 'step':
                return alpha < 0.5 ? v0 : v1;
                
            case 'cubic':
                return this._cubicInterpolate(v0, v1, alpha, index);
                
            case 'linear':
            default:
                if (typeof v0 === 'number') {
                    return v0 + (v1 - v0) * alpha;
                } else {
                    const result = new Array(v0.length);
                    for (let i = 0; i < v0.length; i++) {
                        result[i] = v0[i] + (v1[i] - v0[i]) * alpha;
                    }
                    return result;
                }
        }
    }

    /**
     * Cubic interpolation
     * @private
     * @param {number|Array} v0 - Start value
     * @param {number|Array} v1 - End value
     * @param {number} alpha - Interpolation factor [0-1]
     * @param {number} index - Keyframe index
     * @returns {number|Array} Cubic interpolated value
     */
    _cubicInterpolate(v0, v1, alpha, index) {
        // Simplified cubic Hermite spline
        const alpha2 = alpha * alpha;
        const alpha3 = alpha2 * alpha;

        const h00 = 2 * alpha3 - 3 * alpha2 + 1;
        const h10 = alpha3 - 2 * alpha2 + alpha;
        const h01 = -2 * alpha3 + 3 * alpha2;
        const h11 = alpha3 - alpha2;

        if (typeof v0 === 'number') {
            // For scalar values, use simpler interpolation
            return v0 * h00 + v1 * h01;
        }

        const result = new Array(v0.length);
        for (let i = 0; i < v0.length; i++) {
            result[i] = v0[i] * h00 + v1[i] * h01;
        }
        return result;
    }

    /**
     * Get duration of animation track
     */
    getDuration() {
        return this.times.length > 0 ? this.times[this.times.length - 1] - this.times[0] : 0;
    }
}

export class AnimationClip {
    /**
     * Create an animation clip
     * @param {string} name - Name of the animation
     * @param {number} duration - Duration of the animation in seconds
     * @param {Map<string, AnimationTrack>} tracks - Map of property tracks
     */
    constructor(name, duration, tracks = new Map()) {
        this.name = name;
        this.duration = duration;
        this.tracks = tracks;
        this.loop = false;
        this.fps = 30; // Frames per second for timing
    }

    /**
     * Add animation track
     * @param {string} boneName - Name of bone to animate
     * @param {AnimationTrack} track - Animation track
     */
    addTrack(boneName, track) {
        this.tracks.set(boneName, track);
    }

    /**
     * Get animation track for bone
     * @param {string} boneName - Name of bone
     * @returns {AnimationTrack|null} Animation track
     */
    getTrack(boneName) {
        return this.tracks.get(boneName) || null;
    }

    /**
     * Apply animation to skeleton at given time
     * @param {Map<string, Bone>} skeleton - Map of bones
     * @param {number} time - Time to apply animation at
     * @param {number} timeScale - Time scaling factor
     */
    apply(skeleton, time, timeScale = 1.0) {
        const scaledTime = time * timeScale;
        
        for (const [boneName, track] of this.tracks) {
            const bone = skeleton.get(boneName);
            if (!bone) continue;

            const value = track.getValueAtTime(scaledTime);
            
            // Apply animated value to bone
            if (track.property === 'position' && Array.isArray(value)) {
                bone.setPosition(value[0], value[1], value[2]);
            } else if (track.property === 'rotation' && Array.isArray(value)) {
                bone.setRotation(value[0], value[1], value[2]);
            } else if (track.property === 'scale' && Array.isArray(value)) {
                bone.setScale(value[0], value[1], value[2]);
            } else if (track.property === 'quaternion' && Array.isArray(value)) {
                // Quaternion interpolation would go here
                // This is a simplified version
            }
        }
    }

    /**
     * Clone this animation clip
     */
    clone() {
        const cloned = new AnimationClip(this.name, this.duration);
        cloned.loop = this.loop;
        cloned.fps = this.fps;
        
        // Deep copy tracks
        for (const [boneName, track] of this.tracks) {
            cloned.tracks.set(boneName, new AnimationTrack(
                track.property,
                track.times,
                track.values,
                track.interpolation
            ));
        }
        
        return cloned;
    }

    /**
     * Create simple keyframe animation from transforms
     * @param {string} name - Animation name
     * @param {Array} keyframes - Array of keyframe objects
     * @returns {AnimationClip} Created animation clip
     */
    static createFromKeyframes(name, keyframes) {
        if (keyframes.length === 0) {
            throw new Error('At least one keyframe is required');
        }

        const tracks = new Map();
        const boneNames = Object.keys(keyframes[0].transforms);

        // Group keyframes by property for each bone
        for (const boneName of boneNames) {
            const positionTimes = [];
            const positionValues = [];
            const rotationTimes = [];
            const rotationValues = [];
            const scaleTimes = [];
            const scaleValues = [];

            for (const keyframe of keyframes) {
                const transform = keyframe.transforms[boneName];
                if (!transform) continue;

                if (transform.position) {
                    positionTimes.push(keyframe.time);
                    positionValues.push(...transform.position);
                }

                if (transform.rotation) {
                    rotationTimes.push(keyframe.time);
                    rotationValues.push(...transform.rotation);
                }

                if (transform.scale) {
                    scaleTimes.push(keyframe.time);
                    scaleValues.push(...transform.scale);
                }
            }

            // Create tracks for each property
            if (positionValues.length > 0) {
                tracks.set(`${boneName}.position`, new AnimationTrack('position', positionTimes, positionValues));
            }

            if (rotationValues.length > 0) {
                tracks.set(`${boneName}.rotation`, new AnimationTrack('rotation', rotationTimes, rotationValues));
            }

            if (scaleValues.length > 0) {
                tracks.set(`${boneName}.scale`, new AnimationTrack('scale', scaleTimes, scaleValues));
            }
        }

        const duration = Math.max(...keyframes.map(kf => kf.time));
        return new AnimationClip(name, duration, tracks);
    }
}

export class SkinnedMesh {
    /**
     * Create a skinned mesh for skeletal animation
     * @param {BufferGeometry} geometry - Mesh geometry
     * @param {Map<string, Bone>} skeleton - Map of bones
     */
    constructor(geometry, skeleton) {
        this.geometry = geometry;
        this.skeleton = skeleton;
        
        // Skinning data
        this.skinIndex = null; // Float32Array of bone indices per vertex
        this.skinWeight = null; // Float32Array of weights per vertex
        this.skinMatrices = []; // Array of bone skinning matrices
        
        // Animation state
        this.activeClips = new Map(); // Currently playing animation clips
        this.blendingWeight = 0; // Current blend weight
        this.blendDuration = 0; // Duration of blend transition
        this.blendStartTime = 0; // When blend started
        
        // Skinning matrices buffer for GPU
        this.skinMatrixBuffer = null;
        this.boneCount = 0;
        
        this._initializeSkinning();
    }

    /**
     * Initialize skinning data
     * @private
     */
    _initializeSkinning() {
        const vertexCount = this.geometry.getAttribute('position').count;
        this.boneCount = this.skeleton.size;
        
        // Create skin index and weight arrays
        this.skinIndex = new Float32Array(vertexCount * 4); // Support up to 4 bones per vertex
        this.skinWeight = new Float32Array(vertexCount * 4);
        
        // Initialize with no bone influences
        for (let i = 0; i < this.skinIndex.length; i++) {
            this.skinIndex[i] = -1;
            this.skinWeight[i] = 0;
        }
        
        // Create skin matrices array
        this.skinMatrices = new Array(this.boneCount);
        for (let i = 0; i < this.boneCount; i++) {
            this.skinMatrices[i] = new Matrix4();
        }
        
        // Set skin indices for bones
        let boneIndex = 0;
        for (const [name, bone] of this.skeleton) {
            bone.skinIndex = boneIndex++;
        }
    }

    /**
     * Add vertex influence from bone
     * @param {number} vertexIndex - Index of vertex
     * @param {string} boneName - Name of bone
     * @param {number} weight - Weight of influence [0-1]
     */
    addVertexInfluence(vertexIndex, boneName, weight) {
        const bone = this.skeleton.get(boneName);
        if (!bone) {
            console.warn(`Bone ${boneName} not found in skeleton`);
            return;
        }

        // Find available slot (up to 4 bones per vertex)
        let slotIndex = -1;
        for (let i = 0; i < 4; i++) {
            const index = vertexIndex * 4 + i;
            if (this.skinWeight[index] === 0) {
                slotIndex = i;
                break;
            }
        }

        if (slotIndex === -1) {
            console.warn(`Vertex ${vertexIndex} already has maximum number of bone influences`);
            return;
        }

        const arrayIndex = vertexIndex * 4 + slotIndex;
        this.skinIndex[arrayIndex] = bone.skinIndex;
        this.skinWeight[arrayIndex] = weight;

        // Add to bone's influence list
        bone.addVertexInfluence(vertexIndex, weight);
    }

    /**
     * Update skinning matrices from bone transforms
     */
    updateSkinMatrices() {
        // Update all bones first
        for (const [name, bone] of this.skeleton) {
            bone.update(0); // Update without delta time
        }

        // Calculate skinning matrices
        for (const [name, bone] of this.skeleton) {
            const boneMatrix = bone.animationMatrix;
            const inverseBindMatrix = bone.inverseBindMatrix;
            
            // Skin matrix = Bone world matrix * Inverse bind matrix
            this.skinMatrices[bone.skinIndex].copy(boneMatrix);
            this.skinMatrices[bone.skinIndex].multiply(inverseBindMatrix);
        }
    }

    /**
     * Play animation clip
     * @param {AnimationClip} clip - Animation clip to play
     * @param {number} weight - Weight of this clip [0-1]
     * @param {number} startTime - Start time for the clip
     * @param {number} timeScale - Speed multiplier
     */
    playClip(clip, weight = 1.0, startTime = 0, timeScale = 1.0) {
        this.activeClips.set(clip.name, {
            clip: clip,
            weight: weight,
            time: startTime,
            timeScale: timeScale
        });
        
        // Update skinning matrices after clip change
        this.updateSkinMatrices();
    }

    /**
     * Stop animation clip
     * @param {string} clipName - Name of clip to stop
     */
    stopClip(clipName) {
        this.activeClips.delete(clipName);
        this.updateSkinMatrices();
    }

    /**
     * Stop all animation clips
     */
    stopAllClips() {
        this.activeClips.clear();
        this.updateSkinMatrices();
    }

    /**
     * Blend between animation clips
     * @param {string} fromClip - Name of clip to blend from
     * @param {string} toClip - Name of clip to blend to
     * @param {number} duration - Blend duration in seconds
     */
    blendClips(fromClip, toClip, duration) {
        const fromAnimation = this.activeClips.get(fromClip);
        const toAnimation = this.activeClips.get(toClip);
        
        if (!fromAnimation || !toAnimation) {
            console.warn('Both clips must be playing for blending');
            return;
        }

        // Start blend transition
        this.blendDuration = duration;
        this.blendStartTime = performance.now() / 1000;
        
        // Ensure both clips are playing
        fromAnimation.weight = 1.0;
        toAnimation.weight = 0.0;
    }

    /**
     * Update animation state
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        const currentTime = performance.now() / 1000;
        
        // Handle blending
        if (this.blendDuration > 0) {
            const elapsed = currentTime - this.blendStartTime;
            const progress = Math.min(elapsed / this.blendDuration, 1.0);
            
            // Find first two clips for blending
            const clips = Array.from(this.activeClips.values());
            if (clips.length >= 2) {
                clips[0].weight = 1.0 - progress;
                clips[1].weight = progress;
            }
            
            if (progress >= 1.0) {
                this.blendDuration = 0;
            }
        }

        // Update each playing clip
        for (const [name, animation] of this.activeClips) {
            if (animation.weight > 0) {
                animation.time += deltaTime * animation.timeScale;
                
                // Handle looping
                if (animation.clip.loop) {
                    animation.time = animation.time % animation.clip.duration;
                } else {
                    animation.time = Math.min(animation.time, animation.clip.duration);
                }
                
                // Apply to skeleton
                animation.clip.apply(this.skeleton, animation.time, 1.0);
            }
        }

        // Update skinning matrices
        this.updateSkinMatrices();
    }

    /**
     * Get skin matrix array for GPU
     * @returns {Float32Array} Array of skin matrices
     */
    getSkinMatrixArray() {
        const skinArray = new Float32Array(this.boneCount * 16);
        
        for (let i = 0; i < this.boneCount; i++) {
            const matrix = this.skinMatrices[i];
            for (let j = 0; j < 16; j++) {
                skinArray[i * 16 + j] = matrix.elements[j];
            }
        }
        
        return skinArray;
    }

    /**
     * Calculate vertex normals after skinning
     */
    calculateSkinnedNormals() {
        // Implementation would recalculate normals based on skinned vertex positions
        // This is a placeholder for the actual implementation
        const normalAttribute = this.geometry.getAttribute('normal');
        if (normalAttribute) {
            // Recalculate normals based on new vertex positions
            // This is computationally expensive but necessary for correct lighting
        }
    }

    /**
     * Dispose of skinned mesh and free resources
     */
    dispose() {
        // Clean up bone references
        for (const [name, bone] of this.skeleton) {
            bone.destroy();
        }
        
        // Clear animation data
        this.activeClips.clear();
        this.skinIndex = null;
        this.skinWeight = null;
        this.skinMatrices = [];
        this.skinMatrixBuffer = null;
    }
}

export class SkeletalAnimationSystem {
    /**
     * Create skeletal animation system
     */
    constructor() {
        this.skinnedMeshes = [];
        this.animationLibrary = new Map(); // Name -> AnimationClip
        this.skeletons = new Map(); // Name -> Map of bones
        
        // Global animation settings
        this.playing = true;
        this.timeScale = 1.0;
        this.blendMode = 'cumulative'; // 'cumulative' or 'overwrite'
    }

    /**
     * Add skinned mesh to system
     * @param {SkinnedMesh} skinnedMesh - Skinned mesh to add
     */
    addSkinnedMesh(skinnedMesh) {
        this.skinnedMeshes.push(skinnedMesh);
    }

    /**
     * Remove skinned mesh from system
     * @param {SkinnedMesh} skinnedMesh - Skinned mesh to remove
     */
    removeSkinnedMesh(skinnedMesh) {
        const index = this.skinnedMeshes.indexOf(skinnedMesh);
        if (index !== -1) {
            this.skinnedMeshes.splice(index, 1);
        }
    }

    /**
     * Register animation clip
     * @param {AnimationClip} clip - Animation clip to register
     */
    registerAnimationClip(clip) {
        this.animationLibrary.set(clip.name, clip);
    }

    /**
     * Register skeleton
     * @param {string} name - Name of skeleton
     * @param {Map<string, Bone>} skeleton - Map of bones
     */
    registerSkeleton(name, skeleton) {
        this.skeletons.set(name, skeleton);
    }

    /**
     * Get animation clip by name
     * @param {string} name - Animation clip name
     * @returns {AnimationClip|null} Animation clip
     */
    getAnimationClip(name) {
        return this.animationLibrary.get(name) || null;
    }

    /**
     * Update all animations
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.playing) return;

        const scaledDeltaTime = deltaTime * this.timeScale;
        
        for (const skinnedMesh of this.skinnedMeshes) {
            skinnedMesh.update(scaledDeltaTime);
        }
    }

    /**
     * Play animation on all skinned meshes
     * @param {string} animationName - Name of animation to play
     * @param {number} weight - Weight of animation [0-1]
     * @param {number} timeScale - Speed multiplier
     */
    playAnimation(animationName, weight = 1.0, timeScale = 1.0) {
        const clip = this.getAnimationClip(animationName);
        if (!clip) {
            console.warn(`Animation clip '${animationName}' not found`);
            return;
        }

        for (const skinnedMesh of this.skinnedMeshes) {
            skinnedMesh.playClip(clip, weight, 0, timeScale);
        }
    }

    /**
     * Stop animation on all skinned meshes
     * @param {string} animationName - Name of animation to stop
     */
    stopAnimation(animationName) {
        for (const skinnedMesh of this.skinnedMeshes) {
            skinnedMesh.stopClip(animationName);
        }
    }

    /**
     * Set global time scale
     * @param {number} timeScale - Time scale factor
     */
    setTimeScale(timeScale) {
        this.timeScale = Math.max(0, timeScale);
    }

    /**
     * Set global playback state
     * @param {boolean} playing - Whether animations should play
     */
    setPlaying(playing) {
        this.playing = playing;
    }

    /**
     * Dispose of animation system
     */
    dispose() {
        // Clean up all skinned meshes
        for (const skinnedMesh of this.skinnedMeshes) {
            skinnedMesh.dispose();
        }
        
        this.skinnedMeshes = [];
        this.animationLibrary.clear();
        this.skeletons.clear();
    }
}

export default {
    Bone,
    AnimationTrack,
    AnimationClip,
    SkinnedMesh,
    SkeletalAnimationSystem
};
