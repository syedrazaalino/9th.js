/**
 * Object3D - Base class for all 3D objects with transformation capabilities
 * Three.js-compatible position/rotation/scale Vector3 + Quaternion API
 */
import { Vector3 } from './math/Vector3.js';
import { Quaternion } from './math/Quaternion.js';
import { Euler, EulerOrder } from './math/Euler.js';

/**
 * Vector3 that notifies owner when mutated
 */
class ObservableVector3 extends Vector3 {
  constructor(x = 0, y = 0, z = 0, onChange = null) {
    super(x, y, z);
    this._onChangeCallback = onChange;
  }

  _notify() {
    if (this._onChangeCallback) this._onChangeCallback();
  }

  set(x, y, z) {
    super.set(x, y, z);
    this._notify();
    return this;
  }

  copy(v) {
    super.copy(v);
    this._notify();
    return this;
  }

  add(v) {
    super.add(v);
    this._notify();
    return this;
  }

  sub(v) {
    super.sub(v);
    this._notify();
    return this;
  }

  multiplyScalar(s) {
    super.multiplyScalar(s);
    this._notify();
    return this;
  }

  addScalar(s) {
    super.addScalar(s);
    this._notify();
    return this;
  }

  subScalar(s) {
    super.subScalar(s);
    this._notify();
    return this;
  }

  divideScalar(s) {
    super.divideScalar(s);
    this._notify();
    return this;
  }

  multiply(v) {
    super.multiply(v);
    this._notify();
    return this;
  }

  divide(v) {
    super.divide(v);
    this._notify();
    return this;
  }

  min(v) {
    super.min(v);
    this._notify();
    return this;
  }

  max(v) {
    super.max(v);
    this._notify();
    return this;
  }

  clamp(min, max) {
    super.clamp(min, max);
    this._notify();
    return this;
  }

  negate() {
    super.negate();
    this._notify();
    return this;
  }

  normalize() {
    super.normalize();
    this._notify();
    return this;
  }

  lerp(v, alpha) {
    super.lerp(v, alpha);
    this._notify();
    return this;
  }

  fromArray(array, offset = 0) {
    this.x = array[offset];
    this.y = array[offset + 1];
    this.z = array[offset + 2];
    this._notify();
    return this;
  }
}

export class Object3D {
  constructor() {
    this.uuid = Object3D._generateUUID();
    this.id = Object3D._idCounter++;
    this.name = '';
    this.type = 'Object3D';

    const onChange = () => this.markMatrixDirty();

    this.position = new ObservableVector3(0, 0, 0, onChange);
    this.rotation = new Euler(0, 0, 0, EulerOrder.XYZ, onChange);
    this.quaternion = new Quaternion(0, 0, 0, 1, onChange);
    this.scale = new ObservableVector3(1, 1, 1, onChange);

    // Keep rotation (Euler) and quaternion in sync
    this._onRotationChange = () => {
      this.quaternion.setFromEuler(this.rotation, false);
      this.markMatrixDirty();
    };
    this._onQuaternionChange = () => {
      this.rotation.setFromQuaternion(this.quaternion, false);
      this.markMatrixDirty();
    };
    this.rotation._onChangeCallback = this._onRotationChange;
    this.quaternion._onChangeCallback = this._onQuaternionChange;

    this.matrix = this.createIdentityMatrix();
    this.matrixWorld = this.createIdentityMatrix();
    this.localMatrix = this.matrix;
    this.worldMatrix = this.matrixWorld;
    this.matrixAutoUpdate = true;
    this.matrixWorldNeedsUpdate = true;
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.useQuaternion = false; // when true, composeTRS uses quaternion instead of Euler

    this.parent = null;
    this.children = [];

    this.visible = true;
    this.renderOrder = 0;
    this.frustumCulled = true;
    this.castShadow = false;
    this.receiveShadow = false;

    this.active = true;
    this.userData = {};
  }

  static _idCounter = 0;

  static _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  setPosition(x, y, z) {
    this.position.set(x, y, z);
    return this;
  }

  setRotation(x, y, z) {
    this.rotation.set(x, y, z);
    return this;
  }

  setScale(x, y, z) {
    if (y === undefined && z === undefined) {
      this.scale.set(x, x, x);
    } else {
      this.scale.set(x, y, z);
    }
    return this;
  }

  translate(x, y, z) {
    this.position.x += x;
    this.position.y += y;
    this.position.z += z;
    this.markMatrixDirty();
    return this;
  }

  rotate(x, y, z) {
    this.rotation.x += x;
    this.rotation.y += y;
    this.rotation.z += z;
    this.markMatrixDirty();
    return this;
  }

  scaleBy(x, y, z) {
    this.scale.x *= x;
    this.scale.y *= y;
    this.scale.z *= z;
    this.markMatrixDirty();
    return this;
  }

  markMatrixDirty() {
    this.localMatrixDirty = true;
    this.worldMatrixDirty = true;
    this.matrixWorldNeedsUpdate = true;

    for (const child of this.children) {
      if (child && child.markMatrixDirty) {
        child.markMatrixDirty();
      }
    }
  }

  updateMatrix() {
    if (this.matrixAutoUpdate && this.localMatrixDirty) {
      this.updateLocalMatrix();
      this.localMatrixDirty = false;
    }

    if (this.worldMatrixDirty || this.matrixWorldNeedsUpdate) {
      this.updateWorldMatrix();
      this.worldMatrixDirty = false;
      this.matrixWorldNeedsUpdate = false;
    }
  }

  updateMatrixWorld(force = false) {
    if (this.matrixAutoUpdate) {
      if (this.localMatrixDirty) {
        this.updateLocalMatrix();
        this.localMatrixDirty = false;
      }
    }

    if (this.matrixWorldNeedsUpdate || this.worldMatrixDirty || force) {
      this.updateWorldMatrix();
      this.worldMatrixDirty = false;
      this.matrixWorldNeedsUpdate = false;
    }

    for (const child of this.children) {
      if (child.updateMatrixWorld) {
        child.updateMatrixWorld(force);
      }
    }
  }

  updateLocalMatrix() {
    this.localMatrix = this.composeTRS(this.position, this.rotation, this.scale);
    this.matrix = this.localMatrix;
  }

  updateWorldMatrix() {
    if (this.parent) {
      if (this.parent.updateMatrix) this.parent.updateMatrix();
      this.worldMatrix = this.multiplyMatrices(this.parent.worldMatrix || this.parent.matrixWorld, this.localMatrix);
    } else {
      this.worldMatrix = this.localMatrix;
    }
    this.matrixWorld = this.worldMatrix;
  }

  composeTRS(position, rotation, scale) {
    const matrix = this.createIdentityMatrix();

    matrix[12] = position.x;
    matrix[13] = position.y;
    matrix[14] = position.z;

    let r00, r01, r02, r10, r11, r12, r20, r21, r22;

    if (this.useQuaternion || (rotation instanceof Quaternion)) {
      const q = (rotation instanceof Quaternion) ? rotation : this.quaternion;
      const x = q.x, y = q.y, z = q.z, w = q.w;
      const x2 = x + x, y2 = y + y, z2 = z + z;
      const xx = x * x2, xy = x * y2, xz = x * z2;
      const yy = y * y2, yz = y * z2, zz = z * z2;
      const wx = w * x2, wy = w * y2, wz = w * z2;
      r00 = 1 - (yy + zz);
      r01 = xy - wz;
      r02 = xz + wy;
      r10 = xy + wz;
      r11 = 1 - (xx + zz);
      r12 = yz - wx;
      r20 = xz - wy;
      r21 = yz + wx;
      r22 = 1 - (xx + yy);
    } else if (rotation && rotation.isEuler) {
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const cosZ = Math.cos(rotation.z);
      const sinZ = Math.sin(rotation.z);
      // Default XYZ order
      r00 = cosZ * cosY;
      r01 = cosZ * sinY * sinX - sinZ * cosX;
      r02 = cosZ * sinY * cosX + sinZ * sinX;
      r10 = sinZ * cosY;
      r11 = sinZ * sinY * sinX + cosZ * cosX;
      r12 = sinZ * sinY * cosX - cosZ * sinX;
      r20 = -sinY;
      r21 = cosY * sinX;
      r22 = cosY * cosX;
    } else {
      // Plain Euler XYZ (legacy fallback)
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);
      const cosZ = Math.cos(rotation.z);
      const sinZ = Math.sin(rotation.z);
      r00 = cosZ * cosY;
      r01 = cosZ * sinY * sinX - sinZ * cosX;
      r02 = cosZ * sinY * cosX + sinZ * sinX;
      r10 = sinZ * cosY;
      r11 = sinZ * sinY * sinX + cosZ * cosX;
      r12 = sinZ * sinY * cosX - cosZ * sinX;
      r20 = -sinY;
      r21 = cosY * sinX;
      r22 = cosY * cosX;
    }

    matrix[0]  = r00 * scale.x;
    matrix[1]  = r01 * scale.x;
    matrix[2]  = r02 * scale.x;
    matrix[4]  = r10 * scale.y;
    matrix[5]  = r11 * scale.y;
    matrix[6]  = r12 * scale.y;
    matrix[8]  = r20 * scale.z;
    matrix[9]  = r21 * scale.z;
    matrix[10] = r22 * scale.z;

    return matrix;
  }

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

  createIdentityMatrix() {
    const matrix = new Float32Array(16);
    matrix[0] = 1;
    matrix[5] = 1;
    matrix[10] = 1;
    matrix[15] = 1;
    return matrix;
  }

  /**
   * Three.js-compatible add
   */
  add(...objects) {
    for (const object of objects) {
      this.addChild(object);
    }
    return this;
  }

  remove(...objects) {
    for (const object of objects) {
      this.removeChild(object);
    }
    return this;
  }

  addChild(child) {
    if (!child) return this;
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

  clear() {
    for (const child of [...this.children]) {
      this.removeChild(child);
    }
    return this;
  }

  getObjectByName(name) {
    if (this.name === name) return this;
    for (const child of this.children) {
      const found = child.getObjectByName ? child.getObjectByName(name) : null;
      if (found) return found;
    }
    return null;
  }

  getObjectById(id) {
    if (this.id === id) return this;
    for (const child of this.children) {
      const found = child.getObjectById ? child.getObjectById(id) : null;
      if (found) return found;
    }
    return null;
  }

  traverse(callback) {
    callback(this);
    for (const child of this.children) {
      if (child.traverse) child.traverse(callback);
      else callback(child);
    }
  }

  traverseVisible(callback) {
    if (!this.visible) return;
    callback(this);
    for (const child of this.children) {
      if (child.traverseVisible) child.traverseVisible(callback);
      else if (child.visible !== false) callback(child);
    }
  }

  getWorldPosition(target = new Vector3()) {
    this.updateMatrixWorld();
    target.set(this.worldMatrix[12], this.worldMatrix[13], this.worldMatrix[14]);
    return target;
  }

  getWorldScale(target = new Vector3()) {
    this.updateMatrixWorld();

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

    return target.set(sx, sy, sz);
  }

  getWorldForward(target = new Vector3()) {
    this.updateMatrixWorld();
    return target.set(-this.worldMatrix[2], -this.worldMatrix[6], -this.worldMatrix[10]);
  }

  getWorldUp(target = new Vector3()) {
    this.updateMatrixWorld();
    return target.set(this.worldMatrix[1], this.worldMatrix[5], this.worldMatrix[9]);
  }

  getWorldRight(target = new Vector3()) {
    this.updateMatrixWorld();
    return target.set(this.worldMatrix[0], this.worldMatrix[4], this.worldMatrix[8]);
  }

  getWorldQuaternion(target = new Quaternion()) {
    this.updateMatrixWorld();
    return target.setFromRotationMatrix(this.worldMatrix);
  }

  update(deltaTime) {
    for (const child of this.children) {
      if (child.update) child.update(deltaTime);
    }
  }

  render() {
    for (const child of this.children) {
      if (child.visible && child.render) {
        child.render();
      }
    }
  }

  destroy() {
    if (this.parent) {
      this.parent.removeChild(this);
    }

    for (const child of [...this.children]) {
      if (child.destroy) child.destroy();
    }

    this.children = [];
    this.parent = null;
  }

  lookAt(target, up = { x: 0, y: 1, z: 0 }) {
    const targetPos = target.x !== undefined
      ? target
      : { x: arguments[0], y: arguments[1], z: arguments[2] };

    const pos = this.getWorldPosition();
    const direction = {
      x: targetPos.x - pos.x,
      y: targetPos.y - pos.y,
      z: targetPos.z - pos.z
    };

    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.y /= length;
      direction.z /= length;
    }

    // Full look-at with up vector (no roll loss)
    const forward = direction;
    const upVec = { x: up.x, y: up.y, z: up.z };
    // right = up cross forward
    let rightX = upVec.y * forward.z - upVec.z * forward.y;
    let rightY = upVec.z * forward.x - upVec.x * forward.z;
    let rightZ = upVec.x * forward.y - upVec.y * forward.x;
    const rightLen = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ);
    if (rightLen > 1e-6) {
      rightX /= rightLen; rightY /= rightLen; rightZ /= rightLen;
    } else {
      // forward is parallel to up; pick alternate up
      rightX = 1; rightY = 0; rightZ = 0;
    }
    // recomputed up = forward cross right
    const upX = forward.y * rightZ - forward.z * rightY;
    const upY = forward.z * rightX - forward.x * rightZ;
    const upZ = forward.x * rightY - forward.y * rightX;

    // Build rotation matrix (column-major, Three.js convention: -Z forward)
    // columns: right, up, -forward
    const m = new Float32Array(16);
    m[0] = rightX; m[1] = rightY; m[2] = rightZ; m[3] = 0;
    m[4] = upX;   m[5] = upY;   m[6] = upZ;   m[7] = 0;
    m[8] = -forward.x; m[9] = -forward.y; m[10] = -forward.z; m[11] = 0;
    m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;

    if (this.useQuaternion) {
      this.quaternion.setFromRotationMatrix(m);
    } else {
      this.quaternion.setFromRotationMatrix(m);
      this.rotation.setFromQuaternion(this.quaternion);
    }

    this.markMatrixDirty();
    return this;
  }

  clone(recursive = true) {
    const cloned = new this.constructor();
    cloned.copy(this, recursive);
    return cloned;
  }

  copy(source, recursive = true) {
    this.name = source.name;
    this.position.copy(source.position);
    this.rotation.copy(source.rotation);
    this.scale.copy(source.scale);
    this.visible = source.visible;
    this.userData = { ...source.userData };

    if (recursive) {
      for (const child of source.children) {
        this.add(child.clone ? child.clone(true) : child);
      }
    }

    return this;
  }
}

export { ObservableVector3 };
