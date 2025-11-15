/**
 * TypeScript declarations for CubeTexture and EnvironmentMap classes
 */

export interface CubeTextureOptions {
  size?: number;
  format?: number;
  internalFormat?: number;
  type?: number;
  wrapS?: number;
  wrapT?: number;
  minFilter?: number;
  magFilter?: number;
  generateMipmaps?: boolean;
  flipY?: boolean;
  encoding?: string;
  mapping?: string;
}

export interface EnvironmentMapOptions {
  type?: 'default' | 'irradiance' | 'reflection';
  intensity?: number;
  encoding?: string;
  mapping?: string;
  toneMapping?: 'linear' | 'reinhard' | 'aces' | 'film' | 'photographic';
  exposure?: number;
  irradianceSize?: number;
  maxPrefilterRays?: number;
  roughnessLevels?: number[];
  roughnessBias?: number;
  sampleCount?: number;
  filterSize?: number;
}

export interface PMREMGeneratorOptions {
  resolution?: number;
  sampleCount?: number;
  maxPrefilterRays?: number;
}

export interface MockHDRData {
  width: number;
  height: number;
  data: Array<[number, number, number]>;
}

export interface EnvironmentMapInfo {
  id: string;
  type: string;
  hasCubemap: boolean;
  hasIrradiance: boolean;
  hasPrefilter: boolean;
  hasPMREM: boolean;
  roughnessLevels: number[];
  intensity: number;
  toneMapping: string;
  exposure: number;
}

export interface SkyboxMaterial {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
}

export interface PBRMaterial {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, any>;
}

export declare class CubeTexture {
  readonly id: string;
  readonly size: number;
  readonly format: number;
  readonly internalFormat: number;
  readonly type: number;
  readonly wrapS: number;
  readonly wrapT: number;
  readonly minFilter: number;
  readonly magFilter: number;
  readonly generateMipmaps: boolean;
  readonly isLoaded: boolean;
  readonly isDirty: boolean;
  readonly flipY: boolean;
  readonly encoding: string;
  readonly mapping: string;
  readonly texture: WebGLTexture | null;
  faces: Record<number, any>;

  constructor(gl: WebGLRenderingContext, options?: CubeTextureOptions);

  bind(textureUnit?: number): void;
  updateParameters(): void;
  allocateStorage(): void;
  setFaceData(face: string | number, data: any, width?: number, height?: number): void;
  getFaceTarget(faceName: string): number;
  setFaces(facesData: Record<string, any>): void;
  generateMipmap(): void;
  upload(): void;
  sample(direction: number[]): number[];
  static fromEquirectangular(gl: WebGLRenderingContext, equirectangularTexture: any, resolution?: number): CubeTexture;
  static fromImages(gl: WebGLRenderingContext, images: any[], options?: CubeTextureOptions): CubeTexture;
  static fromSingleImage(gl: WebGLRenderingContext, image: any, options?: CubeTextureOptions): CubeTexture;
  dispose(): void;
  getInfo(): Record<string, any>;
  clone(): CubeTexture;
}

export declare class PMREMGenerator {
  readonly resolution: number;
  readonly sampleCount: number;
  readonly maxPrefilterRays: number;
  renderTargets: Array<{
    framebuffer: WebGLFramebuffer | null;
    texture: WebGLTexture | null;
    size: number;
    level: number;
  }>;
  coneGeometry: WebGLBuffer | null;

  constructor(gl: WebGLRenderingContext, options?: PMREMGeneratorOptions);

  prefilter(cubemap: CubeTexture, renderTarget: any): void;
  createRenderTarget(): {
    framebuffer: WebGLFramebuffer | null;
    texture: WebGLTexture | null;
    size: number;
  };
  dispose(): void;
}

export declare class EnvironmentMap {
  readonly id: string;
  readonly type: string;
  readonly intensity: number;
  readonly encoding: string;
  readonly mapping: string;
  readonly toneMapping: string;
  readonly exposure: number;
  readonly roughnessLevels: number[];
  readonly sampleCount: number;
  readonly filterSize: number;
  readonly roughnessBias: number;

  cubemap: CubeTexture | null;
  equirectangular: any;
  prefiltered: any;
  pmremGenerator: PMREMGenerator | null;
  pmremRenderTarget: any;
  irradiance: CubeTexture | null;
  readonly irradianceSize: number;
  prefilterMap: Map<number, CubeTexture> | null;
  hdrData: MockHDRData | null;

  constructor(gl: WebGLRenderingContext, options?: EnvironmentMapOptions);

  setCubemap(cubemap: CubeTexture): void;
  setFromEquirectangular(equirectangularTexture: any, options?: Record<string, any>): void;
  loadHDR(hdrData: MockHDRData, options?: Record<string, any>): void;
  processHDRData(hdrData: MockHDRData, options?: Record<string, any>): any;
  applyToneMapping(data: Array<[number, number, number]>, toneMapping: string): Array<[number, number, number]>;
  reinhardToneMapping(data: Array<[number, number, number]>): Array<[number, number, number]>;
  acesToneMapping(data: Array<[number, number, number]>): Array<[number, number, number]>;
  filmicToneMapping(data: Array<[number, number, number]>): Array<[number, number, number]>;
  photographicToneMapping(data: Array<[number, number, number]>): Array<[number, number, number]>;
  applyExposure(data: Array<[number, number, number]>, exposure: number): Array<[number, number, number]>;
  updateDerivedMaps(): void;
  generateIrradianceMap(): void;
  generatePrefilterMap(): void;
  prefilterCubemap(roughness: number): CubeTexture;
  generatePMREM(): void;
  getEnvironmentMap(roughness?: number, type?: 'irradiance' | 'reflection' | 'pmrem'): CubeTexture | any;
  createSkyboxMaterial(shaderOptions?: Record<string, any>): SkyboxMaterial;
  createPBRMaterial(shaderOptions?: Record<string, any>): PBRMaterial;
  dispose(): void;
  getInfo(): EnvironmentMapInfo;
}
