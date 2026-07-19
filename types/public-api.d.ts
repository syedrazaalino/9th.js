/**
 * 9th.js public API typings (1.0.0)
 * Hand-maintained surface matching the ESM/UMD builds.
 */

export const VERSION: string;
export const LIBRARY_INFO: {
  name: string;
  version: string;
  description: string;
  homepage: string;
  repository: string;
  keywords: string[];
};

export class Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x?: number, y?: number, z?: number);
  set(x: number, y: number, z: number): this;
  copy(v: { x: number; y: number; z: number }): this;
  clone(): Vector3;
}

export class Object3D {
  uuid: string;
  id: number;
  name: string;
  type: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  parent: Object3D | null;
  children: Object3D[];
  visible: boolean;
  matrix: Float32Array;
  matrixWorld: Float32Array;
  matrixAutoUpdate: boolean;
  userData: Record<string, unknown>;
  add(...objects: Object3D[]): this;
  remove(...objects: Object3D[]): this;
  traverse(callback: (object: Object3D) => void): void;
  updateMatrix(): void;
  updateMatrixWorld(force?: boolean): void;
  lookAt(target: { x: number; y: number; z: number } | number, y?: number, z?: number): this;
  setPosition(x: number, y: number, z: number): this;
  setRotation(x: number, y: number, z: number): this;
  setScale(x: number, y?: number, z?: number): this;
}

export class Scene {
  children: Object3D[];
  background: { r: number; g: number; b: number; a: number };
  fog: { enabled: boolean; color: { r: number; g: number; b: number }; near: number; far: number };
  add(...objects: any[]): any;
  remove(object: any): any;
  traverse(callback: (object: any) => void): void;
  update(deltaTime?: number): void;
}

export class Camera extends Object3D {
  isCamera: boolean;
  fov: number;
  aspect: number;
  near: number;
  far: number;
  projectionMatrix: Float32Array;
  viewMatrix: Float32Array;
  matrixWorldInverse: Float32Array;
  updateProjectionMatrix(): void;
}

export class PerspectiveCamera extends Camera {
  constructor(fov?: number, aspect?: number, near?: number, far?: number);
  setFov(fov: number): this;
  setAspect(aspect: number): this;
}

export class OrthographicCamera extends Camera {
  constructor(left?: number, right?: number, top?: number, bottom?: number, near?: number, far?: number);
}

export class BufferGeometry {
  constructor(gl?: WebGLRenderingContext | null);
  static fromArrays(
    arrays: {
      positions?: Float32Array | number[];
      normals?: Float32Array | number[];
      uvs?: Float32Array | number[];
      indices?: Uint16Array | Uint32Array | number[] | null;
    },
    gl?: WebGLRenderingContext | null
  ): BufferGeometry;
  setAttribute(name: string, array: ArrayLike<number> | { array: ArrayLike<number>; itemSize?: number }, itemSize?: number): this;
  setIndex(indices: ArrayLike<number>): this;
  getAttribute(name: string): any;
  ensureGPU(gl: WebGLRenderingContext): this;
  getVertexCount(): number;
}

export class BoxGeometry {
  constructor(width?: number, height?: number, depth?: number, widthSegments?: number, heightSegments?: number, depthSegments?: number);
  vertices: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  toBufferGeometry(gl?: WebGLRenderingContext | null): BufferGeometry;
}

export class SphereGeometry {
  constructor(radius?: number, widthSegments?: number, heightSegments?: number);
  toBufferGeometry?(gl?: WebGLRenderingContext | null): BufferGeometry;
}

export class PlaneGeometry {
  constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
  toBufferGeometry?(gl?: WebGLRenderingContext | null): BufferGeometry;
}

export class CylinderGeometry {
  constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number);
  toBufferGeometry?(gl?: WebGLRenderingContext | null): BufferGeometry;
}

export class ConeGeometry {
  constructor(radius?: number, height?: number, radialSegments?: number);
  toBufferGeometry?(gl?: WebGLRenderingContext | null): BufferGeometry;
}

export class CircleGeometry {
  constructor(radius?: number, segments?: number);
  toBufferGeometry?(gl?: WebGLRenderingContext | null): BufferGeometry;
}

export class Material {
  apply(gl: WebGLRenderingContext): void;
  initShader?(gl: WebGLRenderingContext): void;
}

export class MeshBasicMaterial extends Material {
  constructor(options?: { color?: string | number | number[]; opacity?: number; transparent?: boolean });
  color: number[];
  opacity: number;
}

export class MeshStandardMaterial extends Material {
  constructor(options?: {
    color?: string | number | number[];
    metalness?: number;
    roughness?: number;
    opacity?: number;
    transparent?: boolean;
  });
  metalness: number;
  roughness: number;
}

export class Mesh extends Object3D {
  constructor(geometry?: any, material?: Material | null, config?: any);
  geometry: BufferGeometry | any;
  material: Material | null;
  isMesh: boolean;
  ensureGeometryReady(gl: WebGLRenderingContext): void;
  render(gl: WebGLRenderingContext, overrideMaterial?: Material | null): void;
}

export class WebGLRenderer {
  constructor(canvas: HTMLCanvasElement | { canvas: HTMLCanvasElement; [key: string]: any }, options?: Record<string, any>);
  gl: WebGLRenderingContext | null;
  canvas: HTMLCanvasElement;
  setSize(width: number, height: number): void;
  setPixelRatio(value: number | boolean): this;
  getPixelRatio(): number;
  setClearColor(color: number | string | { r: number; g: number; b: number; a?: number }, alpha?: number): this;
  render(scene: Scene, camera: Camera): void;
  dispose(): void;
}

export { WebGLRenderer as Renderer };

export class Engine {
  constructor(canvas: HTMLCanvasElement, config?: Record<string, any>);
  start(): void;
  stop(): void;
  getRenderer(): WebGLRenderer;
  getScene(): Scene;
  setCamera(camera: Camera): void;
  getCamera(): Camera | null;
  resize(width: number, height: number): void;
  dispose(): void;
}

export class AmbientLight {
  constructor(color?: number | string, intensity?: number);
  color: any;
  intensity: number;
}

export class DirectionalLight {
  constructor(color?: number | string, intensity?: number);
  position: { x: number; y: number; z: number; set(x: number, y: number, z: number): any };
  intensity: number;
}

export class PointLight {
  constructor(color?: number | string, intensity?: number, distance?: number);
}

export class SpotLight {
  constructor(color?: number | string, intensity?: number, distance?: number, angle?: number);
}

export class OrbitControls {
  constructor(camera: Camera, domElement?: HTMLElement | null);
  enabled: boolean;
  target: { x: number; y: number; z: number };
  update(deltaTime?: number): void;
}

export class GLTFLoader {
  load(url: string, onLoad?: (gltf: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: any) => void): any;
  parse?(data: ArrayBuffer | string, path?: string): any;
}

export class OBJLoader {
  load(url: string, onLoad?: (object: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: any) => void): any;
}

export class TextureLoader {
  load(url: string, onLoad?: (texture: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: any) => void): any;
}

export function createRenderer(canvas: HTMLCanvasElement, options?: Record<string, any>): WebGLRenderer;
export function createScene(): Scene;
export function createCamera(fov?: number, aspect?: number, near?: number, far?: number): PerspectiveCamera;
export function createBasicMesh(geometry: any, material: Material): Mesh;
export function createEngine(canvas: HTMLCanvasElement, options?: Record<string, any>): Engine;

export function isPrimitiveGeometry(geometry: any): boolean;
export function toBufferGeometry(primitive: any, gl?: WebGLRenderingContext | null): BufferGeometry;
export function normalizeGeometry(geometry: any, gl?: WebGLRenderingContext | null): any;

export const config: Record<string, any>;
export function setConfig(newConfig: Record<string, any>): void;
