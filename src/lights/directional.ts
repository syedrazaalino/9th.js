/**
 * Lights module
 * Lighting systems for 3D scenes
 */

import { Vector3 } from '../extras/helpers.ts';

export class AmbientLight {
  constructor(intensity = 0.5, color = '#ffffff') {
    this.intensity = intensity;
    this.color = color;
    this.castShadow = false;
  }

  render() {
    console.log(`Rendering ambient light: ${this.color}, intensity: ${this.intensity}`);
  }

  dispose() {
    // Cleanup light resources
  }
}

export class DirectionalLight {
  constructor(intensity = 1, color = '#ffffff', direction = { x: -1, y: -1, z: -1 }) {
    this.intensity = intensity;
    this.color = color;
    this.castShadow = true;
    this.direction = direction;
  }

  setDirection(x, y, z) {
    this.direction.x = x;
    this.direction.y = y;
    this.direction.z = z;
  }

  render() {
    console.log(`Rendering directional light: ${this.color}, intensity: ${this.intensity}`);
  }

  dispose() {
    // Cleanup light resources
  }
}

export class PointLight {
  constructor(intensity = 1, color = '#ffffff', position = { x: 0, y: 0, z: 0 }, distance = 0, decay = 1) {
    this.intensity = intensity;
    this.color = color;
    this.castShadow = true;
    this.position = position;
    this.distance = distance;
    this.decay = decay;
  }

  setPosition(x, y, z) {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
  }

  render() {
    console.log(`Rendering point light: ${this.color}, intensity: ${this.intensity}`);
  }

  dispose() {
    // Cleanup light resources
  }
}

export class SpotLight extends PointLight {
  constructor(intensity = 1, color = '#ffffff', position = { x: 0, y: 0, z: 0 }, target = { x: 0, y: 0, z: 0 }, angle = Math.PI / 6, penumbra = 0.3) {
    super(intensity, color, position);
    this.angle = angle;
    this.penumbra = penumbra;
    this.target = target;
  }

  setTarget(x, y, z) {
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
  }
}
