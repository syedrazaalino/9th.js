/**
 * Apply scene lights to MeshStandardMaterial-compatible uniforms
 */

/**
 * Collect lights from scene.lights and scene graph
 * @param {import('../core/Scene.js').Scene} scene
 * @returns {Array}
 */
export function collectSceneLights(scene) {
  const lights = [];
  const seen = new Set();

  const push = (light) => {
    if (!light || seen.has(light)) return;
    if (light.isLight || light.type === 'AmbientLight' || light.type === 'DirectionalLight' ||
        light.type === 'PointLight' || light.type === 'SpotLight') {
      seen.add(light);
      lights.push(light);
    }
  };

  if (scene.lights && Array.isArray(scene.lights)) {
    scene.lights.forEach(push);
  }

  if (scene.traverse) {
    scene.traverse((obj) => push(obj));
  } else if (scene.root && scene.root.traverse) {
    scene.root.traverse((obj) => push(obj));
  }

  return lights;
}

function colorToRgb(color, intensity = 1) {
  let r = 1, g = 1, b = 1;
  if (!color) {
    // keep defaults
  } else if (typeof color.r === 'number') {
    r = color.r; g = color.g; b = color.b;
  } else if (Array.isArray(color)) {
    r = color[0]; g = color[1]; b = color[2];
  }
  return [r * intensity, g * intensity, b * intensity];
}

function vec3From(obj, fallback = [0, 1, 0]) {
  if (!obj) return fallback.slice();
  if (typeof obj.x === 'number') return [obj.x, obj.y, obj.z];
  if (Array.isArray(obj)) return [obj[0], obj[1], obj[2]];
  return fallback.slice();
}

/**
 * Upload MeshStandardMaterial light uniforms
 * @param {WebGLRenderingContext} gl
 * @param {object} shader - Shader with getUniformLocation
 * @param {Array} lights
 * @param {object} camera
 */
export function applyStandardMaterialLights(gl, shader, lights = [], camera = null) {
  if (!gl || !shader || !shader.getUniformLocation) return;

  let ambient = [0.05, 0.05, 0.05];
  const lightColors = [];
  const lightPositions = [];
  const lightDistances = [];
  const lightDecays = [];

  for (const light of lights) {
    if (!light || light.visible === false) continue;

    if (light.type === 'AmbientLight' || light.isAmbientLight) {
      const rgb = colorToRgb(light.color, light.intensity ?? 1);
      ambient = [
        ambient[0] + rgb[0],
        ambient[1] + rgb[1],
        ambient[2] + rgb[2]
      ];
      continue;
    }

    if (lightColors.length >= 8) continue;

    const rgb = colorToRgb(light.color, light.intensity ?? 1);

    if (light.type === 'DirectionalLight' || light.isDirectionalLight) {
      // Shader: lightDir = normalize(-uLightPosition) when distance <= 0
      // Store light direction (from light toward scene) in uLightPosition
      let dir = vec3From(light.direction, [-1, -1, -1]);
      if (light.position && light.target) {
        const px = light.position.x ?? 0, py = light.position.y ?? 0, pz = light.position.z ?? 0;
        const tx = light.target.x ?? 0, ty = light.target.y ?? 0, tz = light.target.z ?? 0;
        dir = [tx - px, ty - py, tz - pz];
        const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
        dir = [dir[0] / len, dir[1] / len, dir[2] / len];
      }
      lightColors.push(...rgb);
      lightPositions.push(dir[0], dir[1], dir[2]);
      lightDistances.push(0);
      lightDecays.push(1);
    } else if (light.type === 'PointLight' || light.isPointLight) {
      const pos = vec3From(light.position, [0, 5, 0]);
      lightColors.push(...rgb);
      lightPositions.push(pos[0], pos[1], pos[2]);
      lightDistances.push(light.distance > 0 ? light.distance : 100);
      lightDecays.push(light.decay ?? 1);
    } else if (light.type === 'SpotLight' || light.isSpotLight) {
      // Approximate as point for now
      const pos = vec3From(light.position, [0, 5, 0]);
      lightColors.push(...rgb);
      lightPositions.push(pos[0], pos[1], pos[2]);
      lightDistances.push(light.distance > 0 ? light.distance : 50);
      lightDecays.push(light.decay ?? 1);
    }
  }

  const count = lightDistances.length;

  const set3 = (name, arr) => {
    const loc = shader.getUniformLocation(name);
    if (loc !== null && loc !== -1) gl.uniform3fv(loc, arr);
  };
  const set1f = (name, arr) => {
    const loc = shader.getUniformLocation(name);
    if (loc !== null && loc !== -1) gl.uniform1fv(loc, arr);
  };
  const set1i = (name, value) => {
    const loc = shader.getUniformLocation(name);
    if (loc !== null && loc !== -1) gl.uniform1i(loc, value);
  };

  set3('uAmbientLightColor', new Float32Array(ambient));
  set1i('uLightCount', count);

  if (count > 0) {
    // Pad arrays to 8 lights for fixed-size uniforms
    while (lightColors.length < 24) lightColors.push(0);
    while (lightPositions.length < 24) lightPositions.push(0);
    while (lightDistances.length < 8) lightDistances.push(0);
    while (lightDecays.length < 8) lightDecays.push(1);

    set3('uLightColor', new Float32Array(lightColors.slice(0, 24)));
    set3('uLightPosition', new Float32Array(lightPositions.slice(0, 24)));
    set1f('uLightDistance', new Float32Array(lightDistances.slice(0, 8)));
    set1f('uLightDecay', new Float32Array(lightDecays.slice(0, 8)));
  }

  if (camera) {
    const pos = camera.getWorldPosition
      ? camera.getWorldPosition()
      : (camera.position || { x: 0, y: 0, z: 0 });
    set3('uCameraPosition', new Float32Array([pos.x || 0, pos.y || 0, pos.z || 0]));
  }
}

/**
 * Compute 3x3 normal matrix from 4x4 model-view matrix
 * @param {Float32Array|number[]} modelView
 * @returns {Float32Array}
 */
export function computeNormalMatrix(modelView) {
  const m = modelView;
  // Upper-left 3x3
  const a00 = m[0], a01 = m[1], a02 = m[2];
  const a10 = m[4], a11 = m[5], a12 = m[6];
  const a20 = m[8], a21 = m[9], a22 = m[10];

  const det =
    a00 * (a11 * a22 - a12 * a21) -
    a01 * (a10 * a22 - a12 * a20) +
    a02 * (a10 * a21 - a11 * a20);

  const invDet = det !== 0 ? 1 / det : 0;

  // Inverse-transpose of 3x3
  return new Float32Array([
    (a11 * a22 - a12 * a21) * invDet,
    (a02 * a21 - a01 * a22) * invDet,
    (a01 * a12 - a02 * a11) * invDet,
    (a12 * a20 - a10 * a22) * invDet,
    (a00 * a22 - a02 * a20) * invDet,
    (a02 * a10 - a00 * a12) * invDet,
    (a10 * a21 - a11 * a20) * invDet,
    (a01 * a20 - a00 * a21) * invDet,
    (a00 * a11 - a01 * a10) * invDet
  ]);
}
