/**
 * Euler - Euler angles with configurable rotation order
 * Three.js-compatible API
 */
import { Vector3 } from './Vector3.js';
import { Quaternion } from './Quaternion.js';

export const EulerOrder = {
  XYZ: 'XYZ',
  YXZ: 'YXZ',
  ZXY: 'ZXY',
  ZYX: 'ZYX',
  YZX: 'YZX',
  XZY: 'XZY'
};

const VALID_ORDERS = new Set(Object.values(EulerOrder));

export class Euler {
  constructor(x = 0, y = 0, z = 0, order = EulerOrder.XYZ, onChange = null) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = VALID_ORDERS.has(order) ? order : EulerOrder.XYZ;
    this._onChangeCallback = onChange;
    this.isEuler = true;
  }

  get x() { return this._x; }
  set x(value) { this._x = value; this._notify(); }

  get y() { return this._y; }
  set y(value) { this._y = value; this._notify(); }

  get z() { return this._z; }
  set z(value) { this._z = value; this._notify(); }

  get order() { return this._order; }
  set order(value) {
    if (VALID_ORDERS.has(value)) {
      this._order = value;
      this._notify();
    }
  }

  _notify() {
    if (this._onChangeCallback) this._onChangeCallback();
  }

  set(x, y, z, order) {
    this._x = x;
    this._y = y;
    this._z = z;
    if (order !== undefined && VALID_ORDERS.has(order)) {
      this._order = order;
    }
    this._notify();
    return this;
  }

  copy(euler) {
    this._x = euler._x;
    this._y = euler._y;
    this._z = euler._z;
    this._order = euler._order;
    this._notify();
    return this;
  }

  clone() {
    return new Euler(this._x, this._y, this._z, this._order);
  }

  equals(euler, eps = 1e-6) {
    return Math.abs(this._x - euler._x) < eps &&
           Math.abs(this._y - euler._y) < eps &&
           Math.abs(this._z - euler._z) < eps &&
           this._order === euler._order;
  }

  /**
   * Build a quaternion from this Euler (delegates to Quaternion.setFromEuler)
   */
  toQuaternion(target = new Quaternion()) {
    return target.setFromEuler(this, false);
  }

  /**
   * Set Euler angles from a quaternion
   */
  setFromQuaternion(q, order, update = true) {
    // Reuse Quaternion.toEuler() — supports XYZ, YXZ, ZYX
    const v = q.toEuler(order || this._order);
    this._x = v.x;
    this._y = v.y;
    this._z = v.z;
    if (order !== undefined && VALID_ORDERS.has(order)) {
      this._order = order;
    }
    if (update) this._notify();
    return this;
  }

  /**
   * Set Euler angles from a rotation matrix (4x4 column-major).
   * Accepts Matrix4 (with .elements) or raw Float32Array(16).
   */
  setFromRotationMatrix(m, order, update = true) {
    const e = m.elements || m;
    const m11 = e[0], m12 = e[4], m13 = e[8];
    const m21 = e[1], m22 = e[5], m23 = e[9];
    const m31 = e[2], m32 = e[6], m33 = e[10];
    const o = order || this._order;

    let x, y, z;
    if (o === 'XYZ') {
      y = Math.asin(Math.max(-1, Math.min(1, m13)));
      if (Math.abs(m13) < 0.9999999) {
        x = Math.atan2(-m23, m33);
        z = Math.atan2(-m12, m11);
      } else {
        x = Math.atan2(m32, m22);
        z = 0;
      }
    } else if (o === 'YXZ') {
      x = Math.asin(Math.max(-1, Math.min(1, -m23)));
      if (Math.abs(m23) < 0.9999999) {
        y = Math.atan2(m13, m33);
        z = Math.atan2(m21, m22);
      } else {
        y = Math.atan2(-m31, m11);
        z = 0;
      }
    } else if (o === 'ZXY') {
      x = Math.asin(Math.max(-1, Math.min(1, m32)));
      if (Math.abs(m32) < 0.9999999) {
        y = Math.atan2(-m31, m33);
        z = Math.atan2(-m12, m22);
      } else {
        y = 0;
        z = Math.atan2(m21, m11);
      }
    } else if (o === 'ZYX') {
      y = Math.asin(Math.max(-1, Math.min(1, -m31)));
      if (Math.abs(m31) < 0.9999999) {
        x = Math.atan2(m32, m33);
        z = Math.atan2(m21, m11);
      } else {
        x = 0;
        z = Math.atan2(-m12, m22);
      }
    } else if (o === 'YZX') {
      z = Math.asin(Math.max(-1, Math.min(1, m21)));
      if (Math.abs(m21) < 0.9999999) {
        x = Math.atan2(-m23, m22);
        y = Math.atan2(-m31, m11);
      } else {
        x = 0;
        y = Math.atan2(m13, m33);
      }
    } else if (o === 'XZY') {
      z = Math.asin(Math.max(-1, Math.min(1, -m12)));
      if (Math.abs(m12) < 0.9999999) {
        x = Math.atan2(m32, m22);
        y = Math.atan2(m13, m11);
      } else {
        x = Math.atan2(-m23, m33);
        y = 0;
      }
    } else {
      // default XYZ
      y = Math.asin(Math.max(-1, Math.min(1, m13)));
      x = Math.atan2(-m23, m33);
      z = Math.atan2(-m12, m11);
    }

    this._x = x;
    this._y = y;
    this._z = z;
    if (order !== undefined && VALID_ORDERS.has(order)) {
      this._order = order;
    }
    if (update) this._notify();
    return this;
  }

  setFromVector3(v, order) {
    return this.set(v.x, v.y, v.z, order);
  }

  toArray(array = [], offset = 0) {
    array[offset] = this._x;
    array[offset + 1] = this._y;
    array[offset + 2] = this._z;
    array[offset + 3] = this._order;
    return array;
  }

  fromArray(array, offset = 0) {
    this._x = array[offset];
    this._y = array[offset + 1];
    this._z = array[offset + 2];
    const order = array[offset + 3];
    if (order !== undefined && VALID_ORDERS.has(order)) {
      this._order = order;
    }
    this._notify();
    return this;
  }

  toVector3(target = new Vector3()) {
    return target.set(this._x, this._y, this._z);
  }
}
