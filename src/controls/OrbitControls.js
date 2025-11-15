/**
 * @class OrbitControls
 * @description Smooth camera controls with zoom, pan, and rotation capabilities
 * @author 9th.js Team
 * @version 1.0.0
 */

export class OrbitControls {
    constructor(camera, domElement = null) {
        // Camera and DOM element
        this.camera = camera;
        this.domElement = domElement;
        
        // Control state
        this.enabled = true;
        this.target = { x: 0, y: 0, z: 0 };
        
        // Rotation settings
        this.rotateSpeed = 1.0;
        this.rotateVelocity = { x: 0, y: 0 };
        this.rotateFriction = 0.85;
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians
        
        // Zoom settings
        this.zoomSpeed = 1.0;
        this.zoomVelocity = 0;
        this.zoomFriction = 0.8;
        this.minDistance = 0;
        this.maxDistance = Infinity;
        this.minZoom = 0;
        this.maxZoom = Infinity;
        
        // Pan settings
        this.panSpeed = 1.0;
        this.panVelocity = { x: 0, y: 0 };
        this.panFriction = 0.85;
        
        // Damping settings
        this.enableDamping = true;
        this.dampingFactor = 0.25;
        
        // Input state
        this.state = 'NONE';
        this.pointer = { x: 0, y: 0 };
        this.previousPointer = { x: 0, y: 0 };
        this.startPointer = { x: 0, y: 0 };
        
        // Mouse/touch input
        this.mouseButtons = {
            LEFT: 'ROTATE',
            MIDDLE: 'DOLLY',
            RIGHT: 'PAN'
        };
        
        this.touches = {
            ONE: 'ROTATE',
            TWO: 'DOLLY_PAN'
        };
        
        // Event callbacks
        this.events = {
            change: [],
            start: [],
            end: [],
            update: []
        };
        
        // Animation
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per round
        this.autoRotateDelay = 0;
        
        // Constraints
        this.enablePan = true;
        this.enableRotate = true;
        this.enableZoom = true;
        this.enableDamping = true;
        
        // Performance
        this.updateOnNextFrame = false;
        this.needsUpdate = true;
        
        // Event listeners
        this._onContextMenu = this._onContextMenu.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        
        // Initialize
        this.connect();
        
        // Set initial target to camera position if not set
        if (this.target.x === 0 && this.target.y === 0 && this.target.z === 0) {
            const cameraPos = this.camera.getWorldPosition();
            this.target = { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z };
        }
    }
    
    /**
     * Connect event listeners
     */
    connect() {
        if (!this.domElement) return;
        
        this.domElement.addEventListener('contextmenu', this._onContextMenu, false);
        this.domElement.addEventListener('mousedown', this._onMouseDown, false);
        this.domElement.addEventListener('wheel', this._onWheel, { passive: false });
        this.domElement.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.domElement.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.domElement.addEventListener('touchend', this._onTouchEnd, false);
        
        document.addEventListener('mousemove', this._onMouseMove, false);
        document.addEventListener('mouseup', this._onMouseUp, false);
        document.addEventListener('keydown', this._onKeyDown, false);
        
        // Set initial target distance
        this._updateDistance();
    }
    
    /**
     * Disconnect event listeners
     */
    disconnect() {
        if (!this.domElement) return;
        
        this.domElement.removeEventListener('contextmenu', this._onContextMenu, false);
        this.domElement.removeEventListener('mousedown', this._onMouseDown, false);
        this.domElement.removeEventListener('wheel', this._onWheel, false);
        this.domElement.removeEventListener('touchstart', this._onTouchStart, false);
        this.domElement.removeEventListener('touchmove', this._onTouchMove, false);
        this.domElement.removeEventListener('touchend', this._onTouchEnd, false);
        
        document.removeEventListener('mousemove', this._onMouseMove, false);
        document.removeEventListener('mouseup', this._onMouseUp, false);
        document.removeEventListener('keydown', this._onKeyDown, false);
    }
    
    /**
     * Dispose controls
     */
    dispose() {
        this.disconnect();
        this.events.change.length = 0;
        this.events.start.length = 0;
        this.events.end.length = 0;
        this.events.update.length = 0;
    }
    
    /**
     * Set camera
     */
    setCamera(camera) {
        this.camera = camera;
        this.needsUpdate = true;
    }
    
    /**
     * Set target
     */
    setTarget(x, y, z) {
        this.target.x = x;
        this.target.y = y;
        this.target.z = z;
        this.needsUpdate = true;
    }
    
    /**
     * Get target
     */
    getTarget() {
        return { x: this.target.x, y: this.target.y, z: this.target.z };
    }
    
    /**
     * Update controls (called in animation loop)
     */
    update(deltaTime = 0.016) {
        if (!this.enabled) return false;
        
        let changed = false;
        const cameraPos = this.camera.getWorldPosition();
        
        // Auto rotation
        if (this.autoRotate) {
            const offset = this._getAutoRotationOffset(deltaTime);
            if (offset.x !== 0 || offset.y !== 0) {
                this._rotate(offset.x, offset.y);
                changed = true;
            }
        }
        
        // Apply velocity-based damping
        if (this.enableDamping) {
            // Rotation velocity
            if (Math.abs(this.rotateVelocity.x) > 0.0001 || Math.abs(this.rotateVelocity.y) > 0.0001) {
                this._rotate(this.rotateVelocity.x, this.rotateVelocity.y);
                this.rotateVelocity.x *= this.rotateFriction;
                this.rotateVelocity.y *= this.rotateFriction;
                changed = true;
            }
            
            // Zoom velocity
            if (Math.abs(this.zoomVelocity) > 0.0001) {
                this._zoom(this.zoomVelocity);
                this.zoomVelocity *= this.zoomFriction;
                changed = true;
            }
            
            // Pan velocity
            if (Math.abs(this.panVelocity.x) > 0.0001 || Math.abs(this.panVelocity.y) > 0.0001) {
                this._pan(this.panVelocity.x, this.panVelocity.y);
                this.panVelocity.x *= this.panFriction;
                this.panVelocity.y *= this.panFriction;
                changed = true;
            }
        } else {
            // Reset velocities if damping is disabled
            this.rotateVelocity.x = 0;
            this.rotateVelocity.y = 0;
            this.zoomVelocity = 0;
            this.panVelocity.x = 0;
            this.panVelocity.y = 0;
        }
        
        // Check if we need to update
        if (this.needsUpdate || changed) {
            this._applyConstraints();
            this._updateCamera();
            this._emitEvent('change');
            this._emitEvent('update');
            this.needsUpdate = false;
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle mouse down event
     */
    _onMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        this.domElement.focus();
        
        this.pointer.x = event.clientX;
        this.pointer.y = event.clientY;
        this.startPointer.x = event.clientX;
        this.startPointer.y = event.clientY;
        
        switch (event.button) {
            case 0: // Left
                if (this.mouseButtons.LEFT === 'ROTATE' && this.enableRotate) {
                    this.state = 'ROTATE';
                } else if (this.mouseButtons.LEFT === 'PAN' && this.enablePan) {
                    this.state = 'PAN';
                }
                break;
            case 1: // Middle
                if (this.mouseButtons.MIDDLE === 'DOLLY' && this.enableZoom) {
                    this.state = 'DOLLY';
                }
                break;
            case 2: // Right
                if (this.mouseButtons.RIGHT === 'PAN' && this.enablePan) {
                    this.state = 'PAN';
                } else if (this.mouseButtons.RIGHT === 'ROTATE' && this.enableRotate) {
                    this.state = 'ROTATE';
                }
                break;
        }
        
        if (this.state !== 'NONE') {
            this._emitEvent('start');
        }
    }
    
    /**
     * Handle mouse move event
     */
    _onMouseMove(event) {
        if (!this.enabled || this.state === 'NONE') return;
        
        const deltaX = event.clientX - this.pointer.x;
        const deltaY = event.clientY - this.pointer.y;
        
        this.pointer.x = event.clientX;
        this.pointer.y = event.clientY;
        
        switch (this.state) {
            case 'ROTATE':
                if (this.enableRotate) {
                    this._rotate(deltaX * this.rotateSpeed * 0.002, deltaY * this.rotateSpeed * 0.002);
                }
                break;
            case 'DOLLY':
                if (this.enableZoom) {
                    this._zoom(deltaY * this.zoomSpeed * 0.001);
                }
                break;
            case 'PAN':
                if (this.enablePan) {
                    this._pan(deltaX * this.panSpeed * 0.002, -deltaY * this.panSpeed * 0.002);
                }
                break;
        }
    }
    
    /**
     * Handle mouse up event
     */
    _onMouseUp() {
        if (this.state !== 'NONE') {
            this.state = 'NONE';
            this._emitEvent('end');
        }
    }
    
    /**
     * Handle mouse wheel event
     */
    _onWheel(event) {
        if (!this.enabled || !this.enableZoom) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const delta = event.deltaY;
        this._zoom(delta * this.zoomSpeed * 0.001);
    }
    
    /**
     * Handle context menu event
     */
    _onContextMenu(event) {
        if (!this.enabled) return;
        event.preventDefault();
    }
    
    /**
     * Handle touch start event
     */
    _onTouchStart(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        this.pointer.x = event.touches[0].clientX;
        this.pointer.y = event.touches[0].clientY;
        this.startPointer.x = event.touches[0].clientX;
        this.startPointer.y = event.touches[0].clientY;
        
        switch (event.touches.length) {
            case 1: // One finger
                if (this.touches.ONE === 'ROTATE' && this.enableRotate) {
                    this.state = 'TOUCH_ROTATE';
                } else if (this.touches.ONE === 'PAN' && this.enablePan) {
                    this.state = 'TOUCH_PAN';
                }
                break;
            case 2: // Two fingers
                if (this.touches.TWO === 'DOLLY_PAN') {
                    this.state = 'TOUCH_DOLLY_PAN';
                    this._handleTouchStartDolly(event);
                }
                break;
        }
        
        if (this.state !== 'NONE') {
            this._emitEvent('start');
        }
    }
    
    /**
     * Handle touch move event
     */
    _onTouchMove(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        switch (event.touches.length) {
            case 1: // One finger
                if (this.state === 'TOUCH_ROTATE' && this.enableRotate) {
                    this._handleTouchMoveRotate(event);
                } else if (this.state === 'TOUCH_PAN' && this.enablePan) {
                    this._handleTouchMovePan(event);
                }
                break;
            case 2: // Two fingers
                if (this.state === 'TOUCH_DOLLY_PAN') {
                    this._handleTouchMoveDollyPan(event);
                }
                break;
        }
    }
    
    /**
     * Handle touch end event
     */
    _onTouchEnd() {
        if (this.state !== 'NONE') {
            this.state = 'NONE';
            this._emitEvent('end');
        }
    }
    
    /**
     * Handle key down event
     */
    _onKeyDown(event) {
        if (!this.enabled) return;
        
        let handled = false;
        
        switch (event.code) {
            case 'ArrowUp':
                if (this.enablePan) {
                    this._pan(0, this.panSpeed * 0.1);
                    handled = true;
                }
                break;
            case 'ArrowDown':
                if (this.enablePan) {
                    this._pan(0, -this.panSpeed * 0.1);
                    handled = true;
                }
                break;
            case 'ArrowLeft':
                if (this.enablePan) {
                    this._pan(this.panSpeed * 0.1, 0);
                    handled = true;
                }
                break;
            case 'ArrowRight':
                if (this.enablePan) {
                    this._pan(-this.panSpeed * 0.1, 0);
                    handled = true;
                }
                break;
        }
        
        if (handled) {
            event.preventDefault();
        }
    }
    
    /**
     * Rotate camera
     */
    _rotate(deltaX, deltaY) {
        const cameraPos = this.camera.getWorldPosition();
        const spherical = this._getSpherical(cameraPos, this.target);
        
        // Apply rotation
        spherical.theta -= deltaX;
        spherical.phi -= deltaY;
        
        // Apply constraints
        spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, spherical.phi));
        
        // Apply rotation with damping
        if (this.enableDamping) {
            this.rotateVelocity.x = deltaX;
            this.rotateVelocity.y = deltaY;
        }
        
        // Update target
        const newPos = this._setSpherical(spherical, this.target);
        this.camera.setPosition(newPos.x, newPos.y, newPos.z);
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);
        
        this.needsUpdate = true;
    }
    
    /**
     * Zoom camera
     */
    _zoom(delta) {
        let scale = Math.pow(0.95, delta * this.zoomSpeed);
        
        const cameraPos = this.camera.getWorldPosition();
        const distance = this._getDistance(cameraPos, this.target);
        
        // Apply zoom constraints
        if (this.enableDamping) {
            this.zoomVelocity = delta * this.zoomSpeed * 0.01;
        } else {
            const newDistance = distance * scale;
            
            if (newDistance < this.minDistance || newDistance > this.maxDistance) {
                return;
            }
            
            const direction = {
                x: (cameraPos.x - this.target.x) / distance,
                y: (cameraPos.y - this.target.y) / distance,
                z: (cameraPos.z - this.target.z) / distance
            };
            
            const newPos = {
                x: this.target.x + direction.x * newDistance,
                y: this.target.y + direction.y * newDistance,
                z: this.target.z + direction.z * newDistance
            };
            
            this.camera.setPosition(newPos.x, newPos.y, newPos.z);
            this.camera.lookAt(this.target.x, this.target.y, this.target.z);
            
            this.needsUpdate = true;
        }
    }
    
    /**
     * Pan camera
     */
    _pan(deltaX, deltaY) {
        const cameraPos = this.camera.getWorldPosition();
        const distance = this._getDistance(cameraPos, this.target);
        
        // Calculate pan offset
        const panOffset = this._getPanOffset(deltaX, deltaY, distance);
        
        // Apply pan
        this.target.x += panOffset.x;
        this.target.y += panOffset.y;
        this.target.z += panOffset.z;
        
        // Move camera to maintain same relative position
        this.camera.translate(panOffset.x, panOffset.y, panOffset.z);
        
        // Apply pan with damping
        if (this.enableDamping) {
            this.panVelocity.x = deltaX;
            this.panVelocity.y = deltaY;
        }
        
        this.needsUpdate = true;
    }
    
    /**
     * Handle touch rotate
     */
    _handleTouchMoveRotate(event) {
        const deltaX = event.touches[0].clientX - this.pointer.x;
        const deltaY = event.touches[0].clientY - this.pointer.y;
        
        this.pointer.x = event.touches[0].clientX;
        this.pointer.y = event.touches[0].clientY;
        
        this._rotate(deltaX * this.rotateSpeed * 0.002, deltaY * this.rotateSpeed * 0.002);
    }
    
    /**
     * Handle touch pan
     */
    _handleTouchMovePan(event) {
        const deltaX = event.touches[0].clientX - this.pointer.x;
        const deltaY = event.touches[0].clientY - this.pointer.y;
        
        this.pointer.x = event.touches[0].clientX;
        this.pointer.y = event.touches[0].clientY;
        
        this._pan(deltaX * this.panSpeed * 0.002, -deltaY * this.panSpeed * 0.002);
    }
    
    /**
     * Handle touch dolly start
     */
    _handleTouchStartDolly(event) {
        this._handleTouchStartDollyPan(event);
    }
    
    /**
     * Handle touch dolly pan
     */
    _handleTouchStartDollyPan(event) {
        this._startDistance = this._getDistance(this.camera.getWorldPosition(), this.target);
    }
    
    /**
     * Handle touch move dolly pan
     */
    _handleTouchMoveDollyPan(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.touches.length === 2) {
            // Dolly
            this._handleTouchMoveDolly(event);
            // Pan
            this._handleTouchMovePan(event);
        }
    }
    
    /**
     * Handle touch move dolly
     */
    _handleTouchMoveDolly(event) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this._startDistance) {
            const delta = (this._startDistance - distance) / 200;
            this._zoom(delta * this.zoomSpeed);
        }
    }
    
    /**
     * Get spherical coordinates from position and target
     */
    _getSpherical(position, target) {
        const offset = {
            x: position.x - target.x,
            y: position.y - target.y,
            z: position.z - target.z
        };
        
        const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y + offset.z * offset.z);
        const theta = Math.atan2(offset.x, offset.z);
        const phi = Math.acos(offset.y / distance);
        
        return { radius: distance, theta: theta, phi: phi };
    }
    
    /**
     * Set position from spherical coordinates
     */
    _setSpherical(spherical, target) {
        const offset = {
            x: spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
            y: spherical.radius * Math.cos(spherical.phi),
            z: spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
        };
        
        return {
            x: target.x + offset.x,
            y: target.y + offset.y,
            z: target.z + offset.z
        };
    }
    
    /**
     * Get distance between two points
     */
    _getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Get pan offset
     */
    _getPanOffset(deltaX, deltaY, distance) {
        const offset = {};
        
        // Calculate offset in camera space
        offset.x = deltaX * distance * 2 / window.innerHeight;
        offset.y = deltaY * distance * 2 / window.innerHeight;
        offset.z = 0;
        
        // Transform to world space
        const cameraQuat = this.camera.getWorldQuaternion ? this.camera.getWorldQuaternion() : { x: 0, y: 0, z: 0, w: 1 };
        
        // Apply camera rotation (simplified - in real implementation, use proper quaternion math)
        const cos = Math.cos(cameraQuat.y || 0);
        const sin = Math.sin(cameraQuat.y || 0);
        
        return {
            x: offset.x * cos + offset.z * sin,
            y: offset.y,
            z: -offset.x * sin + offset.z * cos
        };
    }
    
    /**
     * Get auto rotation offset
     */
    _getAutoRotationOffset(deltaTime) {
        if (this.autoRotateDelay > 0) {
            this.autoRotateDelay -= deltaTime;
            return { x: 0, y: 0 };
        }
        
        return {
            x: 0,
            y: this.autoRotateSpeed * deltaTime * 0.001
        };
    }
    
    /**
     * Apply constraints
     */
    _applyConstraints() {
        const cameraPos = this.camera.getWorldPosition();
        const distance = this._getDistance(cameraPos, this.target);
        
        // Distance constraints
        if (distance < this.minDistance) {
            const direction = {
                x: (cameraPos.x - this.target.x) / distance,
                y: (cameraPos.y - this.target.y) / distance,
                z: (cameraPos.z - this.target.z) / distance
            };
            
            const newPos = {
                x: this.target.x + direction.x * this.minDistance,
                y: this.target.y + direction.y * this.minDistance,
                z: this.target.z + direction.z * this.minDistance
            };
            
            this.camera.setPosition(newPos.x, newPos.y, newPos.z);
        } else if (distance > this.maxDistance) {
            const direction = {
                x: (cameraPos.x - this.target.x) / distance,
                y: (cameraPos.y - this.target.y) / distance,
                z: (cameraPos.z - this.target.z) / distance
            };
            
            const newPos = {
                x: this.target.x + direction.x * this.maxDistance,
                y: this.target.y + direction.y * this.maxDistance,
                z: this.target.z + direction.z * this.maxDistance
            };
            
            this.camera.setPosition(newPos.x, newPos.y, newPos.z);
        }
    }
    
    /**
     * Update camera
     */
    _updateCamera() {
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);
    }
    
    /**
     * Update distance
     */
    _updateDistance() {
        const cameraPos = this.camera.getWorldPosition();
        this.distance = this._getDistance(cameraPos, this.target);
    }
    
    /**
     * Emit event
     */
    _emitEvent(type) {
        for (let callback of this.events[type]) {
            callback();
        }
    }
    
    /**
     * Add event listener
     */
    addEventListener(type, callback) {
        if (this.events[type]) {
            this.events[type].push(callback);
        }
    }
    
    /**
     * Remove event listener
     */
    removeEventListener(type, callback) {
        if (this.events[type]) {
            const index = this.events[type].indexOf(callback);
            if (index !== -1) {
                this.events[type].splice(index, 1);
            }
        }
    }
    
    /**
     * Set control enabled state
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        return this;
    }
    
    /**
     * Enable auto rotation
     */
    setAutoRotation(enabled, speed = 2.0, delay = 0) {
        this.autoRotate = enabled;
        this.autoRotateSpeed = speed;
        this.autoRotateDelay = delay;
        return this;
    }
    
    /**
     * Set rotation constraints
     */
    setRotationConstraints(minPolarAngle = 0, maxPolarAngle = Math.PI) {
        this.minPolarAngle = minPolarAngle;
        this.maxPolarAngle = maxPolarAngle;
        return this;
    }
    
    /**
     * Set zoom constraints
     */
    setZoomConstraints(minDistance = 0, maxDistance = Infinity, minZoom = 0, maxZoom = Infinity) {
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        return this;
    }
    
    /**
     * Set pan constraints
     */
    setPanConstraints(enablePan = true, speed = 1.0) {
        this.enablePan = enablePan;
        this.panSpeed = speed;
        return this;
    }
    
    /**
     * Set damping
     */
    setDamping(enabled = true, factor = 0.25) {
        this.enableDamping = enabled;
        this.dampingFactor = factor;
        return this;
    }
    
    /**
     * Reset controls to initial state
     */
    reset() {
        this.target = { x: 0, y: 0, z: 0 };
        this.rotateVelocity = { x: 0, y: 0 };
        this.zoomVelocity = 0;
        this.panVelocity = { x: 0, y: 0 };
        this.autoRotate = false;
        this.needsUpdate = true;
        return this;
    }
    
    /**
     * Save current state
     */
    saveState() {
        this._savedState = {
            target: { ...this.target },
            cameraPosition: this.camera.getWorldPosition(),
            cameraQuaternion: this.camera.getWorldQuaternion ? this.camera.getWorldQuaternion() : { x: 0, y: 0, z: 0, w: 1 }
        };
        return this;
    }
    
    /**
     * Restore saved state
     */
    restoreState() {
        if (!this._savedState) return this;
        
        this.target = { ...this._savedState.target };
        this.camera.setPosition(
            this._savedState.cameraPosition.x,
            this._savedState.cameraPosition.y,
            this._savedState.cameraPosition.z
        );
        this.camera.lookAt(this.target.x, this.target.y, this.target.z);
        
        this.needsUpdate = true;
        return this;
    }
}
