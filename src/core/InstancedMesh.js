/**
 * InstancedMesh - Renders many copies of a geometry in a single draw call.
 *
 * Three.js-compatible API:
 *   const inst = new InstancedMesh(geometry, material, count);
 *   inst.setMatrixAt(i, matrix);
 *   inst.setColorAt(i, color);
 *   inst.instanceMatrix.needsUpdate = true;
 *   scene.add(inst);
 *
 * Uses WebGL2 drawArraysInstanced / drawElementsInstanced natively, with an
 * ANGLE_instanced_arrays fallback for WebGL1 contexts.
 */

import { Mesh } from './Mesh.js';
import { Matrix4 } from './math/Matrix4.js';
import { Color } from './math/Color.js';

/**
 * Minimal BufferAttribute — a Three.js-compatible typed-array wrapper.
 * Holds an array, itemSize, count, and a dirty flag (`needsUpdate`).
 */
export class BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    if (!(array instanceof Float32Array) && !Array.isArray(array) && !ArrayBuffer.isView(array)) {
      throw new TypeError('BufferAttribute: array must be a typed array');
    }
    if (Array.isArray(array)) {
      array = new Float32Array(array);
    }
    this.array = array;
    this.itemSize = itemSize;
    this.normalized = normalized;
    this.count = array.length / itemSize;
    this.usage = 35048; // DYNAMIC_DRAW — instances are frequently updated
    this.updateRange = { offset: 0, count: -1 };
    this.version = 0;
    this.name = '';
    this.needsUpdate = true;
    // GL handle cache (populated on first upload)
    this._gl = null;
    this._glBuffer = null;
  }

  setUsage(usage) {
    this.usage = usage;
    return this;
  }

  setValue(index, value) {
    this.array[index] = value;
    return this;
  }

  getX(index) {
    return this.array[index * this.itemSize];
  }

  setX(index, x) {
    this.array[index * this.itemSize] = x;
    return this;
  }

  copyArray(array) {
    this.array.set(array);
    this.count = this.array.length / this.itemSize;
    return this;
  }

  clone() {
    const copy = new BufferAttribute(
      this.array.slice(),
      this.itemSize,
      this.normalized
    );
    copy.usage = this.usage;
    copy.name = this.name;
    copy.updateRange = { ...this.updateRange };
    return copy;
  }
}

const _mat4 = new Matrix4();

/**
 * InstancedMesh class
 */
export class InstancedMesh extends Mesh {
  /**
   * @param {BufferGeometry|object} geometry
   * @param {Material} material
   * @param {number} count - Number of instances
   */
  constructor(geometry, material, count) {
    super(geometry, material);

    this.type = 'InstancedMesh';
    this.isInstancedMesh = true;
    this.isMesh = true;

    count = Math.max(0, Math.floor(Number(count) || 0));
    this.count = count;

    // Per-instance matrix (mat4 = 16 floats per instance)
    const matrixArray = new Float32Array(count * 16);
    // Default to identity matrices so an uninitialized instance renders in place.
    for (let i = 0; i < count; i++) {
      const o = i * 16;
      matrixArray[o + 0] = 1;
      matrixArray[o + 5] = 1;
      matrixArray[o + 10] = 1;
      matrixArray[o + 15] = 1;
    }
    this.instanceMatrix = new BufferAttribute(matrixArray, 16);
    this.instanceMatrix.setUsage(35048); // DYNAMIC_DRAW

    // Per-instance color is created lazily on first setColorAt()
    this.instanceColor = null;

    // Bounding sphere that encompasses all instances (computed lazily)
    this.boundingSphere = null;
    this.instanceBoundingBox = null;
  }

  /* --------------------------------------------------------------------- *
   * Matrix API
   * --------------------------------------------------------------------- */

  /**
   * Copy a per-instance model matrix into the instanceMatrix buffer.
   * @param {number} index - Instance index
   * @param {Matrix4|Float32Array|number[]} matrix - Source matrix
   */
  setMatrixAt(index, matrix) {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`InstancedMesh.setMatrixAt: index ${index} out of range [0, ${this.count})`);
    }

    const offset = index * 16;
    const dst = this.instanceMatrix.array;

    if (matrix && matrix.elements instanceof Float32Array) {
      // Matrix4 instance
      const e = matrix.elements;
      for (let i = 0; i < 16; i++) dst[offset + i] = e[i];
    } else if (matrix && typeof matrix.length === 'number' && matrix.length >= 16) {
      // Array or typed-array of 16 numbers
      for (let i = 0; i < 16; i++) dst[offset + i] = matrix[i];
    } else {
      throw new TypeError('InstancedMesh.setMatrixAt: expected Matrix4 or array of 16 numbers');
    }

    this.instanceMatrix.needsUpdate = true;
    this.boundingSphere = null;
    this.instanceBoundingBox = null;
  }

  /**
   * Read a per-instance model matrix.
   * @param {number} index
   * @param {Matrix4} [target] - Optional Matrix4 to write into
   * @returns {Matrix4}
   */
  getMatrixAt(index, target = new Matrix4()) {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`InstancedMesh.getMatrixAt: index ${index} out of range [0, ${this.count})`);
    }
    const offset = index * 16;
    const e = target.elements;
    const src = this.instanceMatrix.array;
    for (let i = 0; i < 16; i++) e[i] = src[offset + i];
    return target;
  }

  /* --------------------------------------------------------------------- *
   * Color API
   * --------------------------------------------------------------------- */

  /**
   * Lazily allocate the per-instance color attribute and write a color.
   * @param {number} index
   * @param {Color} color
   */
  setColorAt(index, color) {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`InstancedMesh.setColorAt: index ${index} out of range [0, ${this.count})`);
    }
    if (this.instanceColor === null) {
      const colorArray = new Float32Array(this.count * 3);
      // Default to white so unset entries do not darken the mesh
      for (let i = 0; i < this.count; i++) {
        colorArray[i * 3 + 0] = 1;
        colorArray[i * 3 + 1] = 1;
        colorArray[i * 3 + 2] = 1;
      }
      this.instanceColor = new BufferAttribute(colorArray, 3);
      this.instanceColor.setUsage(35048);
    }
    const offset = index * 3;
    const dst = this.instanceColor.array;
    if (color && color.r !== undefined && color.g !== undefined && color.b !== undefined) {
      dst[offset + 0] = color.r;
      dst[offset + 1] = color.g;
      dst[offset + 2] = color.b;
    } else if (color && Array.isArray(color)) {
      dst[offset + 0] = color[0];
      dst[offset + 1] = color[1];
      dst[offset + 2] = color[2];
    } else {
      throw new TypeError('InstancedMesh.setColorAt: expected Color');
    }
    this.instanceColor.needsUpdate = true;
  }

  /**
   * Read a per-instance color.
   * @param {number} index
   * @param {Color} [target]
   * @returns {Color}
   */
  getColorAt(index, target = new Color()) {
    if (index < 0 || index >= this.count) {
      throw new RangeError(`InstancedMesh.getColorAt: index ${index} out of range [0, ${this.count})`);
    }
    if (this.instanceColor === null) {
      return target.set(1, 1, 1);
    }
    const offset = index * 3;
    target.set(
      this.instanceColor.array[offset + 0],
      this.instanceColor.array[offset + 1],
      this.instanceColor.array[offset + 2]
    );
    return target;
  }

  /* --------------------------------------------------------------------- *
   * Disposal
   * --------------------------------------------------------------------- */

  dispose() {
    // Release per-instance GPU buffers
    if (this.instanceMatrix && this.instanceMatrix._glBuffer && this.instanceMatrix._gl) {
      try { this.instanceMatrix._gl.deleteBuffer(this.instanceMatrix._glBuffer); } catch (_) { /* noop */ }
      this.instanceMatrix._glBuffer = null;
    }
    if (this.instanceColor && this.instanceColor._glBuffer && this.instanceColor._gl) {
      try { this.instanceColor._gl.deleteBuffer(this.instanceColor._glBuffer); } catch (_) { /* noop */ }
      this.instanceColor._glBuffer = null;
    }
    // Call parent dispose if present (Mesh doesn't define dispose(), but Object3D.destroy does)
    if (typeof super.dispose === 'function') {
      super.dispose();
    }
  }

  /* --------------------------------------------------------------------- *
   * Raycast (instance-aware)
   * --------------------------------------------------------------------- */

  /**
   * Instance-aware raycast. Tests each instance's bounding sphere against
   * the ray and pushes intersection objects onto `intersects`. Each result
   * carries `instanceId` so callers can identify which instance was hit.
   *
   * @param {{ray: {origin: {x,y,z}, direction: {x,y,z}}}} raycaster
   * @param {Array} intersects - Output array
   */
  raycast(raycaster, intersects) {
    if (!this.visible || this.count === 0) return;
    if (!raycaster || !raycaster.ray) return;

    const ray = raycaster.ray;
    const origin = ray.origin;
    const direction = ray.direction;

    // Base geometry bounding sphere (in local space). We compute it directly
    // from the CPU-side position data so raycast works even before the
    // geometry has been uploaded to the GPU.
    const geometry = this.geometry;
    let baseRadius = 0;
    let baseCenter = { x: 0, y: 0, z: 0 };
    if (geometry) {
      const posAttr = (typeof geometry.getAttribute === 'function')
        ? geometry.getAttribute('position')
        : (geometry.attributes && geometry.attributes.get('position'));
      const posData = posAttr && (posAttr._cpuData || posAttr.array);
      if (posData && posData.length >= 3) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let i = 0; i < posData.length; i += 3) {
          const x = posData[i], y = posData[i + 1], z = posData[i + 2];
          if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
          if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
        }
        baseCenter = {
          x: (minX + maxX) * 0.5,
          y: (minY + maxY) * 0.5,
          z: (minZ + maxZ) * 0.5
        };
        let rSq = 0;
        for (let i = 0; i < posData.length; i += 3) {
          const dx = posData[i] - baseCenter.x;
          const dy = posData[i + 1] - baseCenter.y;
          const dz = posData[i + 2] - baseCenter.z;
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 > rSq) rSq = d2;
        }
        baseRadius = Math.sqrt(rSq);
      } else if (typeof geometry.getBoundingSphere === 'function') {
        // Fallback — may throw if GPU buffers aren't ready; ignore failures.
        try {
          const bs = geometry.getBoundingSphere();
          if (bs && bs.radius) {
            baseRadius = bs.radius;
            baseCenter = bs.center || baseCenter;
          }
        } catch (_) { /* ignore — fall back to point test */ }
      }
    }

    // World matrix of the InstancedMesh itself
    this.updateMatrixWorld();
    const world = this.worldMatrix || this.matrixWorld;

    for (let i = 0; i < this.count; i++) {
      // Per-instance world matrix = parent world * instance matrix
      this.getMatrixAt(i, _mat4);
      const instE = _mat4.elements;

      // Compute instance world translation
      const tx = world[12] + instE[12];
      const ty = world[13] + instE[13];
      const tz = world[14] + instE[14];

      // Approximate instance scale (max axis)
      const sx = Math.hypot(instE[0], instE[1], instE[2]);
      const sy = Math.hypot(instE[4], instE[5], instE[6]);
      const sz = Math.hypot(instE[8], instE[9], instE[10]);
      const maxScale = Math.max(sx, sy, sz);

      // Sphere center in world = base center transformed by instance + parent
      const cx = tx + baseCenter.x * maxScale;
      const cy = ty + baseCenter.y * maxScale;
      const cz = tz + baseCenter.z * maxScale;
      const r = baseRadius * maxScale;

      // Ray-sphere intersection
      const dx = cx - origin.x;
      const dy = cy - origin.y;
      const dz = cz - origin.z;
      const t = dx * direction.x + dy * direction.y + dz * direction.z;
      const r2 = r * r;
      const x0 = dx - t * direction.x;
      const y0 = dy - t * direction.y;
      const z0 = dz - t * direction.z;
      const d2 = x0 * x0 + y0 * y0 + z0 * z0;
      if (d2 > r2) continue;

      const tDelta = Math.sqrt(r2 - d2);
      const tHit = t >= 0 ? (t - tDelta) : (t + tDelta);
      if (tHit < 0) continue;

      intersects.push({
        instanceId: i,
        object: this,
        distance: tHit,
        point: {
          x: origin.x + direction.x * tHit,
          y: origin.y + direction.y * tHit,
          z: origin.z + direction.z * tHit
        }
      });
    }
  }

  /* --------------------------------------------------------------------- *
   * Rendering — overrides Mesh.render() to use instanced draw calls
   * --------------------------------------------------------------------- */

  /**
   * Render all instances in a single draw call.
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl
   * @param {Material} [overrideMaterial]
   */
  render(gl, overrideMaterial = null) {
    if (!this.visible) return;
    if (!this.geometry && !this._rawGeometry) return;
    if (!this.material && !overrideMaterial) return;
    if (this.count <= 0) return;
    if (!gl) return;

    this.ensureGeometryReady(gl);
    this.updateMatrix();

    const material = overrideMaterial || this.material;
    if (!material) return;

    // Lazy-init shader
    if (typeof material.initShader === 'function' &&
        (!material.shader || !material.shader.isReady || !material.shader.isReady())) {
      material.initShader(gl);
    }
    if (!material.shader || !material.shader.isReady()) return;

    material.apply(gl);

    // Matrix uniforms (same flow as Mesh.render)
    const shader = material.shader;
    if (this._camera && this._renderer) {
      const camera = this._camera;
      const modelMatrix = this.worldMatrix || this.matrix || this.localMatrix;
      const viewMatrix = camera.matrixWorldInverse || camera.viewMatrix || camera.matrix;
      const projectionMatrix = camera.projectionMatrix;

      const model = modelMatrix ? (modelMatrix.elements || modelMatrix) : new Float32Array(16);
      const view = viewMatrix ? (viewMatrix.elements || viewMatrix) : new Float32Array(16);
      const proj = projectionMatrix ? (projectionMatrix.elements || projectionMatrix) : new Float32Array(16);

      const modelView = new Float32Array(16);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          modelView[i * 4 + j] = 0;
          for (let k = 0; k < 4; k++) {
            modelView[i * 4 + j] += view[i * 4 + k] * model[k * 4 + j];
          }
        }
      }

      const modelLoc = shader.getUniformLocation('modelMatrix');
      const viewLoc = shader.getUniformLocation('viewMatrix');
      const projLoc = shader.getUniformLocation('projectionMatrix');
      const mvLoc = shader.getUniformLocation('modelViewMatrix');
      if (modelLoc) gl.uniformMatrix4fv(modelLoc, false, model);
      if (viewLoc) gl.uniformMatrix4fv(viewLoc, false, view);
      if (projLoc) gl.uniformMatrix4fv(projLoc, false, proj);
      if (mvLoc) gl.uniformMatrix4fv(mvLoc, false, modelView);
    }

    // Enable geometry vertex attributes
    const program = shader.getProgram ? shader.getProgram() : null;
    this.geometry.enableAttributes(program);

    // Resolve instancing API once per draw call (cached on this._instancingApi).
    const instancingApi = this._cachedInstancingApi &&
      this._cachedInstancingApiGl === gl
      ? this._cachedInstancingApi
      : (this._cachedInstancingApi = this._getInstancingApi(gl), this._cachedInstancingApiGl = gl, this._cachedInstancingApi);

    // Bind per-instance attributes and capture the locations/divisors we used
    // so we can clean them up after the draw call.
    const usedLocations = this._bindInstanceAttributes(gl, program, instancingApi);

    // Determine draw primitives
    const renderGeometry = this.getCurrentLODGeometry ? this.getCurrentLODGeometry() : this.geometry;
    const indexBuffer = renderGeometry.getIndexBuffer ? renderGeometry.getIndexBuffer() : null;
    const vertexCount = renderGeometry.getVertexCount ? renderGeometry.getVertexCount() : 0;

    if (indexBuffer && indexBuffer.getIndexCount && indexBuffer.getIndexCount() > 0) {
      indexBuffer.bind();
      const count = indexBuffer.getIndexCount();
      const indexType = indexBuffer.getIndexType
        ? indexBuffer.getIndexType()
        : (indexBuffer.isUint32 && indexBuffer.isUint32() ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT);
      if (instancingApi.drawElementsInstanced) {
        instancingApi.drawElementsInstanced(gl.TRIANGLES, count, indexType, 0, this.count);
      }
    } else if (vertexCount > 0) {
      if (instancingApi.drawArraysInstanced) {
        instancingApi.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, this.count);
      }
    }

    // Restore divisor to 0 on every attribute we touched
    this._unbindInstanceAttributes(gl, usedLocations, instancingApi);

    // Stats
    this.renderStats.drawCalls++;
    if (indexBuffer && indexBuffer.getIndexCount) {
      this.renderStats.triangles += (indexBuffer.getIndexCount() / 3) * this.count;
    } else if (vertexCount) {
      this.renderStats.triangles += (vertexCount / 3) * this.count;
    }
    this.renderStats.vertices += vertexCount * this.count;
  }

  /**
   * Resolve which instanced-draw API to use.
   * Prefers native WebGL2 methods, falls back to ANGLE_instanced_arrays.
   * @private
   */
  _getInstancingApi(gl) {
    if (typeof gl.drawElementsInstanced === 'function' && typeof gl.vertexAttribDivisor === 'function') {
      return {
        drawElementsInstanced: gl.drawElementsInstanced.bind(gl),
        drawArraysInstanced: gl.drawArraysInstanced.bind(gl),
        vertexAttribDivisor: gl.vertexAttribDivisor.bind(gl)
      };
    }
    const ext = gl.getExtension && gl.getExtension('ANGLE_instanced_arrays');
    if (ext) {
      return {
        drawElementsInstanced: ext.drawElementsInstancedANGLE.bind(ext),
        drawArraysInstanced: ext.drawArraysInstancedANGLE.bind(ext),
        vertexAttribDivisor: ext.vertexAttribDivisorANGLE.bind(ext)
      };
    }
    // No instancing support — silently disable the draw.
    return { drawElementsInstanced: null, drawArraysInstanced: null, vertexAttribDivisor: null };
  }

  /**
   * Upload + bind instanceMatrix (as 4 vec4 columns) and instanceColor.
   * @private
   * @param {WebGLRenderingContext} gl
   * @param {WebGLProgram} program
   * @param {{vertexAttribDivisor: Function|null}} instancingApi
   * @returns {number[]} list of attribute locations whose divisor was set
   */
  _bindInstanceAttributes(gl, program, instancingApi) {
    const usedLocations = [];
    if (!program) return usedLocations;

    const setDivisor = (loc, value) => {
      if (instancingApi.vertexAttribDivisor) instancingApi.vertexAttribDivisor(loc, value);
    };

    // instanceMatrix — mat4 attribute is exposed by GLSL as 4 consecutive
    // vec4 columns. Some drivers report location under `instanceMatrix`,
    // others under `instanceMatrix[0]`/`[1]`/`[2]`/`[3]`.
    let baseLoc = gl.getAttribLocation(program, 'instanceMatrix');
    if (baseLoc < 0) baseLoc = gl.getAttribLocation(program, 'instanceMatrix[0]');
    if (baseLoc >= 0) {
      const loc1 = gl.getAttribLocation(program, 'instanceMatrix[1]');
      const loc2 = gl.getAttribLocation(program, 'instanceMatrix[2]');
      const loc3 = gl.getAttribLocation(program, 'instanceMatrix[3]');
      // If the explicit [1]/[2]/[3] lookups fail, assume consecutive locations.
      const locs = [
        baseLoc,
        loc1 >= 0 ? loc1 : baseLoc + 1,
        loc2 >= 0 ? loc2 : baseLoc + 2,
        loc3 >= 0 ? loc3 : baseLoc + 3
      ];

      this._ensureInstanceBufferGPU(gl, this.instanceMatrix);
      const buffer = this.instanceMatrix._glBuffer;
      if (buffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const stride = 16 * 4; // 16 floats * 4 bytes
        for (let col = 0; col < 4; col++) {
          const loc = locs[col];
          if (loc < 0) continue;
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, stride, col * 16);
          setDivisor(loc, 1);
          usedLocations.push(loc);
        }
      }
    }

    // instanceColor — single vec3 attribute, divisor 1
    if (this.instanceColor) {
      this._ensureInstanceBufferGPU(gl, this.instanceColor);
      const colorBuffer = this.instanceColor._glBuffer;
      const colorLoc = gl.getAttribLocation(program, 'instanceColor');
      if (colorLoc >= 0 && colorBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 12, 0);
        setDivisor(colorLoc, 1);
        usedLocations.push(colorLoc);
      }
    }

    return usedLocations;
  }

  /** Helper: lazily create and upload a per-instance BufferAttribute. */
  _ensureInstanceBufferGPU(gl, attribute) {
    if (attribute._gl === gl && attribute._glBuffer) {
      if (attribute.needsUpdate) {
        gl.bindBuffer(gl.ARRAY_BUFFER, attribute._glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, attribute.array, attribute.usage);
        attribute.needsUpdate = false;
      }
      return;
    }
    const buf = gl.createBuffer();
    if (!buf) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, attribute.array, attribute.usage);
    attribute._gl = gl;
    attribute._glBuffer = buf;
    attribute.needsUpdate = false;
  }

  /** Reset divisor to 0 on every attribute we touched. */
  _unbindInstanceAttributes(gl, usedLocations, instancingApi) {
    if (!instancingApi.vertexAttribDivisor) return;
    for (const loc of usedLocations) {
      instancingApi.vertexAttribDivisor(loc, 0);
    }
  }
}
