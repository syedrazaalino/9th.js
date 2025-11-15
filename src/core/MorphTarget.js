/**
 * MorphTarget.js - Advanced vertex morphing system for character animation
 * Supports multiple morph targets, blending, and GPU-accelerated morphing
 */

import { Matrix4 } from './math/Matrix4.js';
import { BufferGeometry } from './BufferGeometry.js';

export class MorphTarget {
    /**
     * Create a morph target
     * @param {string} name - Name of the morph target
     * @param {Float32Array|Array} positions - Morph target vertex positions
     * @param {Float32Array|Array} normals - Morph target vertex normals (optional)
     * @param {Float32Array|Array} tangents - Morph target vertex tangents (optional)
     */
    constructor(name, positions, normals = null, tangents = null) {
        this.name = name;
        this.positions = new Float32Array(positions);
        this.normals = normals ? new Float32Array(normals) : null;
        this.tangents = tangents ? new Float32Array(tangents) : null;
        
        // Bounding box for frustum culling
        this.boundingBox = this._calculateBoundingBox();
        
        // CPU-side temporary arrays for blending
        this._tempPositions = null;
        this._tempNormals = null;
        this._tempTangents = null;
    }

    /**
     * Calculate bounding box of the morph target
     * @private
     */
    _calculateBoundingBox() {
        const positions = this.positions;
        const boundingBox = {
            min: { x: Infinity, y: Infinity, z: Infinity },
            max: { x: -Infinity, y: -Infinity, z: -Infinity }
        };

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            boundingBox.min.x = Math.min(boundingBox.min.x, x);
            boundingBox.min.y = Math.min(boundingBox.min.y, y);
            boundingBox.min.z = Math.min(boundingBox.min.z, z);

            boundingBox.max.x = Math.max(boundingBox.max.x, x);
            boundingBox.max.y = Math.max(boundingBox.max.y, y);
            boundingBox.max.z = Math.max(boundingBox.max.z, z);
        }

        return boundingBox;
    }

    /**
     * Get vertex count
     */
    getVertexCount() {
        return this.positions.length / 3;
    }

    /**
     * Get morph target by name from array
     * @param {Array<MorphTarget>} morphTargets - Array of morph targets
     * @param {string} name - Name to search for
     */
    static findByName(morphTargets, name) {
        return morphTargets.find(target => target.name === name);
    }

    /**
     * Create morph target from geometry delta
     * @param {BufferGeometry} baseGeometry - Base geometry
     * @param {BufferGeometry} targetGeometry - Target geometry
     * @param {string} name - Name for the morph target
     */
    static createFromGeometry(baseGeometry, targetGeometry, name) {
        const basePositions = baseGeometry.getAttribute('position');
        const targetPositions = targetGeometry.getAttribute('position');
        
        if (basePositions.count !== targetPositions.count) {
            throw new Error('Geometry vertex counts must match for morph target creation');
        }

        const positions = new Float32Array(basePositions.array.length);
        for (let i = 0; i < positions.length; i++) {
            positions[i] = targetPositions.array[i] - basePositions.array[i];
        }

        let normals = null;
        let tangents = null;

        if (baseGeometry.hasAttribute('normal') && targetGeometry.hasAttribute('normal')) {
            const baseNormals = baseGeometry.getAttribute('normal');
            const targetNormals = targetGeometry.getAttribute('normal');
            normals = new Float32Array(baseNormals.array.length);
            
            for (let i = 0; i < normals.length; i++) {
                normals[i] = targetNormals.array[i] - baseNormals.array[i];
            }
        }

        if (baseGeometry.hasAttribute('tangent') && targetGeometry.hasAttribute('tangent')) {
            const baseTangents = baseGeometry.getAttribute('tangent');
            const targetTangents = targetGeometry.getAttribute('tangent');
            tangents = new Float32Array(baseTangents.array.length);
            
            for (let i = 0; i < tangents.length; i++) {
                tangents[i] = targetTangents.array[i] - baseTangents.array[i];
            }
        }

        return new MorphTarget(name, positions, normals, tangents);
    }
}

export class MorphTargetManager {
    /**
     * Manages morph targets for a mesh
     * @param {BufferGeometry} geometry - Base geometry
     */
    constructor(geometry) {
        this.geometry = geometry;
        this.morphTargets = [];
        this.influences = []; // Float32Array of influence weights [0-1]
        this.activeInfluences = 0;
        
        // GPU buffers for morphing
        this.morphPositionBuffer = null;
        this.morphNormalBuffer = null;
        this.morphTangentBuffer = null;
        
        // Cached blends for performance
        this._cachedBlend = null;
        this._cacheValid = false;
        this._lastInfluenceCount = 0;
    }

    /**
     * Add a morph target
     * @param {MorphTarget} morphTarget - Morph target to add
     * @param {number} influence - Initial influence [0-1]
     */
    addMorphTarget(morphTarget, influence = 0) {
        this.morphTargets.push(morphTarget);
        this.influences.push(influence);
        this.activeInfluences++;
        
        // Initialize GPU buffers if needed
        this._ensureMorphBuffers();
        
        // Invalidate cache
        this._cacheValid = false;
        
        return this.morphTargets.length - 1; // Return index
    }

    /**
     * Remove morph target by index
     * @param {number} index - Index of morph target to remove
     */
    removeMorphTarget(index) {
        if (index >= 0 && index < this.morphTargets.length) {
            this.morphTargets.splice(index, 1);
            this.influences.splice(index, 1);
            this.activeInfluences--;
            
            // Invalidate cache
            this._cacheValid = false;
        }
    }

    /**
     * Remove morph target by name
     * @param {string} name - Name of morph target to remove
     */
    removeMorphTargetByName(name) {
        const index = this.morphTargets.findIndex(target => target.name === name);
        if (index !== -1) {
            this.removeMorphTarget(index);
        }
    }

    /**
     * Set morph target influence
     * @param {number} index - Morph target index
     * @param {number} influence - Influence weight [0-1]
     */
    setMorphTargetInfluence(index, influence) {
        if (index >= 0 && index < this.influences.length) {
            this.influences[index] = Math.max(0, Math.min(1, influence));
            this._cacheValid = false;
        }
    }

    /**
     * Get morph target influence
     * @param {number} index - Morph target index
     */
    getMorphTargetInfluence(index) {
        return index >= 0 && index < this.influences.length ? this.influences[index] : 0;
    }

    /**
     * Set morph target influence by name
     * @param {string} name - Morph target name
     * @param {number} influence - Influence weight [0-1]
     */
    setMorphTargetInfluenceByName(name, influence) {
        const index = this.morphTargets.findIndex(target => target.name === name);
        if (index !== -1) {
            this.setMorphTargetInfluence(index, influence);
        }
    }

    /**
     * Get morph target influence by name
     * @param {string} name - Morph target name
     */
    getMorphTargetInfluenceByName(name) {
        const index = this.morphTargets.findIndex(target => target.name === name);
        return this.getMorphTargetInfluence(index);
    }

    /**
     * Blend all morph targets and apply to geometry
     * @param {BufferGeometry} targetGeometry - Geometry to apply morphing to
     * @param {boolean} updateGPU - Update GPU buffers
     */
    blendMorphTargets(targetGeometry = this.geometry, updateGPU = false) {
        // Check if we need to recalculate
        if (!this._cacheValid && this.hasActiveInfluences()) {
            this._blendMorphTargetsInternal(targetGeometry);
            this._cacheValid = true;
        }
        
        // Update GPU buffers if requested
        if (updateGPU) {
            this._updateMorphBuffers(targetGeometry);
        }
    }

    /**
     * Internal morph target blending
     * @private
     * @param {BufferGeometry} targetGeometry - Geometry to blend to
     */
    _blendMorphTargetsInternal(targetGeometry) {
        const basePositions = this.geometry.getAttribute('position');
        const baseNormals = this.geometry.getAttribute('normal');
        
        if (!basePositions) return;

        const vertexCount = basePositions.count;
        const positionArray = basePositions.array;
        const normalArray = baseNormals ? baseNormals.array : null;

        // Reset to base positions
        if (!this._cachedBlend || this._cachedBlend.length !== positionArray.length) {
            this._cachedBlend = new Float32Array(positionArray);
        } else {
            this._cachedBlend.set(positionArray);
        }

        // Apply morph targets
        for (let i = 0; i < this.morphTargets.length; i++) {
            const influence = this.influences[i];
            if (influence === 0) continue;

            const morphTarget = this.morphTargets[i];
            const morphPositions = morphTarget.positions;
            const morphNormals = morphTarget.normals;

            // Blend positions
            for (let j = 0; j < morphPositions.length; j++) {
                this._cachedBlend[j] += morphPositions[j] * influence;
            }

            // Blend normals if available
            if (normalArray && morphNormals) {
                for (let j = 0; j < morphNormals.length; j++) {
                    // Note: In a real implementation, you'd want to normalize blended normals
                    // This is simplified for performance
                }
            }
        }

        // Apply blended data to target geometry
        targetGeometry.setAttribute('position', this._cachedBlend);
        
        // Update normals if we blended them
        if (normalArray && this._hasNormalMorphing()) {
            targetGeometry.setAttribute('normal', this._blendNormals());
        }
    }

    /**
     * Check if any morph targets have active influence
     */
    hasActiveInfluences() {
        return this.influences.some(influence => influence > 0);
    }

    /**
     * Reset all morph target influences to zero
     */
    resetInfluences() {
        for (let i = 0; i < this.influences.length; i++) {
            this.influences[i] = 0;
        }
        this._cacheValid = false;
    }

    /**
     * Set all influences simultaneously with normalization
     * @param {Array<number>} influences - Array of influence values
     * @param {boolean} normalize - Whether to normalize influences
     */
    setInfluences(influences, normalize = false) {
        if (influences.length !== this.influences.length) {
            throw new Error('Influence array length must match morph target count');
        }

        if (normalize) {
            // Normalize influences to sum to 1
            const sum = influences.reduce((acc, val) => acc + val, 0);
            if (sum > 0) {
                influences = influences.map(val => val / sum);
            }
        }

        for (let i = 0; i < this.influences.length; i++) {
            this.influences[i] = Math.max(0, Math.min(1, influences[i]));
        }
        
        this._cacheValid = false;
    }

    /**
     * Get total influence weight (sum of all influences)
     */
    getTotalInfluence() {
        return this.influences.reduce((acc, val) => acc + val, 0);
    }

    /**
     * Ensure morph buffers are created for GPU rendering
     * @private
     */
    _ensureMorphBuffers() {
        if (!this.geometry || !this.geometry.gl) return;

        const gl = this.geometry.gl;
        const vertexCount = this.geometry.getAttribute('position').count;

        // Create morph position buffer if we have position morph targets
        const hasPositionMorphs = this.morphTargets.some(target => target.positions);
        if (hasPositionMorphs && !this.morphPositionBuffer) {
            this.morphPositionBuffer = gl.createBuffer();
        }

        // Create morph normal buffer if we have normal morph targets
        const hasNormalMorphs = this.morphTargets.some(target => target.normals);
        if (hasNormalMorphs && !this.morphNormalBuffer) {
            this.morphNormalBuffer = gl.createBuffer();
        }

        // Create morph tangent buffer if we have tangent morph targets
        const hasTangentMorphs = this.morphTargets.some(target => target.tangents);
        if (hasTangentMorphs && !this.morphTangentBuffer) {
            this.morphTangentBuffer = gl.createBuffer();
        }
    }

    /**
     * Update GPU morph buffers
     * @private
     * @param {BufferGeometry} geometry - Geometry to update buffers for
     */
    _updateMorphBuffers(geometry) {
        if (!geometry || !geometry.gl || !this.hasActiveInfluences()) return;

        const gl = geometry.gl;
        const positionAttribute = geometry.getAttribute('position');
        const normalAttribute = geometry.getAttribute('normal');

        // Update morph position buffer
        if (this.morphPositionBuffer && positionAttribute) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.morphPositionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._getMorphedPositions(), gl.DYNAMIC_DRAW);
        }

        // Update morph normal buffer
        if (this.morphNormalBuffer && normalAttribute) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.morphNormalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._getMorphedNormals(), gl.DYNAMIC_DRAW);
        }

        // Update morph tangent buffer
        if (this.morphTangentBuffer && geometry.hasAttribute('tangent')) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.morphTangentBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this._getMorphedTangents(), gl.DYNAMIC_DRAW);
        }
    }

    /**
     * Get morphed positions for GPU buffer
     * @private
     */
    _getMorphedPositions() {
        if (!this._cachedBlend) {
            this._blendMorphTargetsInternal(this.geometry);
        }
        return this._cachedBlend.subarray(0, this.geometry.getAttribute('position').array.length);
    }

    /**
     * Get morphed normals for GPU buffer
     * @private
     */
    _getMorphedNormals() {
        // Implementation would blend normals similar to positions
        // This is a placeholder for the actual implementation
        return new Float32Array(0);
    }

    /**
     * Get morphed tangents for GPU buffer
     * @private
     */
    _getMorphedTangents() {
        // Implementation would blend tangents similar to positions
        // This is a placeholder for the actual implementation
        return new Float32Array(0);
    }

    /**
     * Check if any morph targets modify normals
     * @private
     */
    _hasNormalMorphing() {
        return this.morphTargets.some(target => target.normals);
    }

    /**
     * Get bounding box including all active morph targets
     */
    getBoundingBox() {
        const baseBox = this.geometry.boundingBox;
        if (!this.hasActiveInfluences()) return baseBox;

        const morphedBox = {
            min: { ...baseBox.min },
            max: { ...baseBox.max }
        };

        // Expand bounding box based on active morph targets
        for (let i = 0; i < this.morphTargets.length; i++) {
            const influence = this.influences[i];
            if (influence === 0) continue;

            const morphBox = this.morphTargets[i].boundingBox;
            
            morphedBox.min.x = Math.min(morphedBox.min.x, morphBox.min.x * influence);
            morphedBox.min.y = Math.min(morphedBox.min.y, morphBox.min.y * influence);
            morphedBox.min.z = Math.min(morphedBox.min.z, morphBox.min.z * influence);
            
            morphedBox.max.x = Math.max(morphedBox.max.x, morphBox.max.x * influence);
            morphedBox.max.y = Math.max(morphedBox.max.y, morphBox.max.y * influence);
            morphedBox.max.z = Math.max(morphedBox.max.z, morphBox.max.z * influence);
        }

        return morphedBox;
    }

    /**
     * Dispose of morph target manager and free resources
     */
    dispose() {
        const gl = this.geometry.gl;
        if (gl) {
            if (this.morphPositionBuffer) gl.deleteBuffer(this.morphPositionBuffer);
            if (this.morphNormalBuffer) gl.deleteBuffer(this.morphNormalBuffer);
            if (this.morphTangentBuffer) gl.deleteBuffer(this.morphTangentBuffer);
        }

        this.morphTargets = [];
        this.influences = [];
        this.morphPositionBuffer = null;
        this.morphNormalBuffer = null;
        this.morphTangentBuffer = null;
        this._cachedBlend = null;
    }
}

export default {
    MorphTarget,
    MorphTargetManager
};
