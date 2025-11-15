/**
 * Object3D - Base class for all 3D objects with transformation capabilities
 * Provides position, rotation, scale, and matrix operations
 */
export class Object3D {
    constructor() {
        // Position, Rotation, Scale (TRS)
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 }; // in radians
        this.scale = { x: 1, y: 1, z: 1 };

        // Transformation matrices
        this.localMatrix = this.createIdentityMatrix();
        this.worldMatrix = this.createIdentityMatrix();
        this.localMatrixDirty = true;
        this.worldMatrixDirty = true;

        // Hierarchy
        this.parent = null;
        this.children = [];

        // Rendering
        this.visible = true;
        this.renderOrder = 0;

        // Lifecycle
        this.active = true;
        this.userData = {};
    }

    /**
     * Set position
     */
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        this.markMatrixDirty();
        return this;
    }

    /**
     * Set rotation (in radians)
     */
    setRotation(x, y, z) {
        this.rotation.x = x;
        this.rotation.y = y;
        this.rotation.z = z;
        this.markMatrixDirty();
        return this;
    }

    /**
     * Set scale
     */
    setScale(x, y, z) {
        this.scale.x = x;
        this.scale.y = y;
        this.scale.z = z;
        this.markMatrixDirty();
        return this;
    }

    /**
     * Move object by given vector
     */
    translate(x, y, z) {
        this.position.x += x;
        this.position.y += y;
        this.position.z += z;
        this.markMatrixDirty();
        return this;
    }

    /**
     * Rotate object by given angles (radians)
     */
    rotate(x, y, z) {
        this.rotation.x += x;
        this.rotation.y += y;
        this.rotation.z += z;
        this.markMatrixDirty();
        return this;
    }

    /**
     * Scale object by given factors
     */
    scaleBy(x, y, z) {
        this.scale.x *= x;
        this.scale.y *= y;
        this.scale.z *= z;
        this.markMatrixDirty();
        return this;
    }

    /**
     * Mark matrices as needing update
     */
    markMatrixDirty() {
        this.localMatrixDirty = true;
        this.worldMatrixDirty = true;
        
        // Mark children as needing world matrix update
        for (let child of this.children) {
            if (child && child.markMatrixDirty) {
                child.markMatrixDirty();
            }
        }
    }

    /**
     * Update transformation matrices
     */
    updateMatrix() {
        // Update local matrix if dirty
        if (this.localMatrixDirty) {
            this.updateLocalMatrix();
            this.localMatrixDirty = false;
        }

        // Update world matrix if dirty
        if (this.worldMatrixDirty) {
            this.updateWorldMatrix();
            this.worldMatrixDirty = false;
        }
    }

    /**
     * Update local transformation matrix
     */
    updateLocalMatrix() {
        this.localMatrix = this.composeTRS(this.position, this.rotation, this.scale);
    }

    /**
     * Update world transformation matrix
     */
    updateWorldMatrix() {
        if (this.parent) {
            // World matrix = Parent world matrix * Local matrix
            this.worldMatrix = this.multiplyMatrices(this.parent.worldMatrix, this.localMatrix);
        } else {
            // Root object - world matrix = local matrix
            this.worldMatrix = this.localMatrix;
        }
    }

    /**
     * Compose TRS (Translation, Rotation, Scale) into transformation matrix
     */
    composeTRS(position, rotation, scale) {
        const matrix = this.createIdentityMatrix();

        // Translation
        matrix[12] = position.x;
        matrix[13] = position.y;
        matrix[14] = position.z;

        // Apply rotation and scale to the upper-left 3x3 matrix
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);
        const cosZ = Math.cos(rotation.z);
        const sinZ = Math.sin(rotation.z);

        // Combined rotation matrix (Z * Y * X)
        matrix[0] = cosZ * cosY * scale.x;
        matrix[1] = cosZ * sinY * sinX * scale.x - sinZ * cosX * scale.x;
        matrix[2] = cosZ * sinY * cosX * scale.x + sinZ * sinX * scale.x;

        matrix[4] = sinZ * cosY * scale.y;
        matrix[5] = sinZ * sinY * sinX * scale.y + cosZ * cosX * scale.y;
        matrix[6] = sinZ * sinY * cosX * scale.y - cosZ * sinX * scale.y;

        matrix[8] = -sinY * scale.z;
        matrix[9] = cosY * sinX * scale.z;
        matrix[10] = cosY * cosX * scale.z;

        return matrix;
    }

    /**
     * Matrix multiplication (4x4)
     */
    multiplyMatrices(a, b) {
        const result = new Float32Array(16);

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 
                    a[i * 4 + 0] * b[0 * 4 + j] +
                    a[i * 4 + 1] * b[1 * 4 + j] +
                    a[i * 4 + 2] * b[2 * 4 + j] +
                    a[i * 4 + 3] * b[3 * 4 + j];
            }
        }

        return result;
    }

    /**
     * Create identity matrix
     */
    createIdentityMatrix() {
        const matrix = new Float32Array(16);
        matrix[0] = 1;
        matrix[5] = 1;
        matrix[10] = 1;
        matrix[15] = 1;
        return matrix;
    }

    /**
     * Add child object
     */
    addChild(child) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        
        child.parent = this;
        this.children.push(child);
        if (child.markMatrixDirty) {
            child.markMatrixDirty();
        }
        return this;
    }

    /**
     * Remove child object
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
            if (child.markMatrixDirty) {
                child.markMatrixDirty();
            }
        }
        return this;
    }

    /**
     * Get world position
     */
    getWorldPosition() {
        this.updateMatrix();
        
        return {
            x: this.worldMatrix[12],
            y: this.worldMatrix[13],
            z: this.worldMatrix[14]
        };
    }

    /**
     * Get world scale
     */
    getWorldScale() {
        this.updateMatrix();
        
        // Extract scale from world matrix
        const sx = Math.sqrt(
            this.worldMatrix[0] * this.worldMatrix[0] +
            this.worldMatrix[1] * this.worldMatrix[1] +
            this.worldMatrix[2] * this.worldMatrix[2]
        );
        
        const sy = Math.sqrt(
            this.worldMatrix[4] * this.worldMatrix[4] +
            this.worldMatrix[5] * this.worldMatrix[5] +
            this.worldMatrix[6] * this.worldMatrix[6]
        );
        
        const sz = Math.sqrt(
            this.worldMatrix[8] * this.worldMatrix[8] +
            this.worldMatrix[9] * this.worldMatrix[9] +
            this.worldMatrix[10] * this.worldMatrix[10]
        );
        
        return { x: sx, y: sy, z: sz };
    }

    /**
     * Get world forward direction (-Z axis)
     */
    getWorldForward() {
        this.updateMatrix();
        
        return {
            x: -this.worldMatrix[2],
            y: -this.worldMatrix[6],
            z: -this.worldMatrix[10]
        };
    }

    /**
     * Get world up direction (Y axis)
     */
    getWorldUp() {
        this.updateMatrix();
        
        return {
            x: this.worldMatrix[1],
            y: this.worldMatrix[5],
            z: this.worldMatrix[9]
        };
    }

    /**
     * Get world right direction (X axis)
     */
    getWorldRight() {
        this.updateMatrix();
        
        return {
            x: this.worldMatrix[0],
            y: this.worldMatrix[4],
            z: this.worldMatrix[8]
        };
    }

    /**
     * Update lifecycle - called each frame
     */
    update(deltaTime) {
        // Override in subclasses
        for (let child of this.children) {
            child.update(deltaTime);
        }
    }

    /**
     * Render lifecycle - called each frame when visible
     */
    render() {
        // Override in subclasses
        for (let child of this.children) {
            if (child.visible) {
                child.render();
            }
        }
    }

    /**
     * Destroy object and clean up
     */
    destroy() {
        // Remove from parent
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Recursively destroy children
        for (let child of [...this.children]) {
            child.destroy();
        }

        // Clear references
        this.children = [];
        this.parent = null;
    }

    /**
     * Look at target position
     */
    lookAt(target, up = { x: 0, y: 1, z: 0 }) {
        const pos = this.getWorldPosition();
        const direction = {
            x: target.x - pos.x,
            y: target.y - pos.y,
            z: target.z - pos.z
        };

        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.y /= length;
            direction.z /= length;
        }

        // Calculate rotation from direction and up vector
        // This is a simplified lookAt - in practice you'd use a proper lookAt matrix
        this.rotation.y = Math.atan2(direction.x, -direction.z);
        this.rotation.x = Math.asin(-direction.y);

        this.markMatrixDirty();
        return this;
    }
}
