/**
 * Extras module
 * Utility classes and helper functions for Ninth.js
 */

// Vector3 utility class
export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  multiplyScalar(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  normalize() {
    const len = this.length();
    if (len > 0) {
      this.multiplyScalar(1 / len);
    }
    return this;
  }

  clone() {
    return new Vec3(this.x, this.y, this.z);
  }

  toVector3() {
    return { x: this.x, y: this.y, z: this.z };
  }
}

// Color utility class
export class Color {
  r;
  g;
  b;

  constructor(r = 1, g = 1, b = 1) {
    this.r = Math.min(Math.max(r, 0), 1);
    this.g = Math.min(Math.max(g, 0), 1);
    this.b = Math.min(Math.max(b, 0), 1);
  }

  set(r, g, b) {
    this.r = Math.min(Math.max(r, 0), 1);
    this.g = Math.min(Math.max(g, 0), 1);
    this.b = Math.min(Math.max(b, 0), 1);
    return this;
  }

  setHex(hex) {
    const r = ((hex >> 16) & 255) / 255;
    const g = ((hex >> 8) & 255) / 255;
    const b = (hex & 255) / 255;
    return this.set(r, g, b);
  }

  multiplyScalar(scalar) {
    this.r *= scalar;
    this.g *= scalar;
    this.b *= scalar;
    return this;
  }

  clone() {
    return new Color(this.r, this.g, this.b);
  }
}

// Animation utilities
export class Animation {
  duration;
  easing;
  onComplete = null;

  constructor(duration, easing = Animation.easeInOutCubic) {
    this.duration = duration;
    this.easing = easing;
  }

  static easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  static easeOutQuad(t) {
    return t * (2 - t);
  }

  static easeInQuad(t) {
    return t * t;
  }
}

// Math utilities
export class MathUtils {
  static clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
  }

  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  static random(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
  }

  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  static normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
}

// Ray casting utilities
export class Ray {
  constructor(origin, direction) {
    this.origin = origin.clone();
    this.direction = direction.clone().normalize();
  }

  at(t) {
    return this.origin.clone().add(this.direction.clone().multiplyScalar(t));
  }
}

// Performance monitoring
export class PerformanceMonitor {
  frameCount = 0;
  lastTime = 0;
  fps = 0;

  update(currentTime) {
    this.frameCount++;
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
}

// Vector3 type definition (inline)
export const Vector3 = Vec3;
