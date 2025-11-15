/**
 * Material Type Definitions
 * Material system for rendering
 */

export interface MaterialOptions {
    transparent?: boolean;
    opacity?: number;
    visible?: boolean;
    side?: 'front' | 'back' | 'double';
    depthTest?: boolean;
    depthWrite?: boolean;
    depthFunc?: number;
    blending?: number;
    blendSrc?: number;
    blendDst?: number;
    blendEquation?: number;
    polygonOffset?: boolean;
    polygonOffsetFactor?: number;
    polygonOffsetUnits?: number;
    alphaTest?: number;
    premultipliedAlpha?: boolean;
    dithering?: boolean;
}

/**
 * Material - Base material class
 */
export declare class Material {
    public id: string;
    public name: string;
    public type: string;
    public transparent: boolean;
    public opacity: number;
    public visible: boolean;
    public side: 'front' | 'back' | 'double';
    public depthTest: boolean;
    public depthWrite: boolean;
    public depthFunc: number;
    public blending: number;
    public blendSrc: number;
    public blendDst: number;
    public blendEquation: number;
    public polygonOffset: boolean;
    public polygonOffsetFactor: number;
    public polygonOffsetUnits: number;
    public alphaTest: number;
    public premultipliedAlpha: boolean;
    public dithering: boolean;
    public uuid: string;
    public version: number;

    constructor(options?: MaterialOptions);

    /**
     * Set material visibility
     */
    setVisible(visible: boolean): void;

    /**
     * Check if material is transparent
     */
    isTransparent(): boolean;

    /**
     * Set transparency
     */
    setTransparent(transparent: boolean): void;

    /**
     * Set opacity
     */
    setOpacity(opacity: number): void;

    /**
     * Set side (front, back, or double)
     */
    setSide(side: 'front' | 'back' | 'double'): void;

    /**
     * Enable or disable depth testing
     */
    setDepthTest(test: boolean): void;

    /**
     * Enable or disable depth writing
     */
    setDepthWrite(write: boolean): void;

    /**
     * Clone material
     */
    clone(): Material;

    /**
     * Copy material properties
     */
    copy(source: Material): Material;

    /**
     * Dispose material and cleanup resources
     */
    dispose(): void;

    /**
     * Set material as needs update
     */
    needsUpdate(): void;
}

/**
 * Basic Material - Simple unlit material
 */
export declare class BasicMaterial extends Material {
    public color: string | number;
    public map: any;
    public alphaMap: any;
    public wireframe: boolean;

    constructor(options?: MaterialOptions & {
        color?: string | number;
        map?: any;
        alphaMap?: any;
        wireframe?: boolean;
    });

    setColor(color: string | number): void;
    setMap(map: any): void;
    setAlphaMap(alphaMap: any): void;
    setWireframe(wireframe: boolean): void;
}

/**
 * Lambert Material - Diffuse lighting material
 */
export declare class LambertMaterial extends Material {
    public color: string | number;
    public map: any;
    public normalMap: any;
    public normalScale: { x: number; y: number };
    public alphaMap: any;
    public emissive: string | number;
    public emissiveIntensity: number;
    public wireframe: boolean;

    constructor(options?: MaterialOptions & {
        color?: string | number;
        map?: any;
        normalMap?: any;
        normalScale?: { x: number; y: number };
        alphaMap?: any;
        emissive?: string | number;
        emissiveIntensity?: number;
        wireframe?: boolean;
    });

    setColor(color: string | number): void;
    setEmissive(emissive: string | number): void;
    setEmissiveIntensity(intensity: number): void;
    setWireframe(wireframe: boolean): void;
}

/**
 * Phong Material - Specular lighting material
 */
export declare class PhongMaterial extends Material {
    public color: string | number;
    public map: any;
    public normalMap: any;
    public normalScale: { x: number; y: number };
    public alphaMap: any;
    public emissive: string | number;
    public emissiveIntensity: number;
    public specular: string | number;
    public shininess: number;
    public wireframe: boolean;

    constructor(options?: MaterialOptions & {
        color?: string | number;
        map?: any;
        normalMap?: any;
        normalScale?: { x: number; y: number };
        alphaMap?: any;
        emissive?: string | number;
        emissiveIntensity?: number;
        specular?: string | number;
        shininess?: number;
        wireframe?: boolean;
    });

    setColor(color: string | number): void;
    setSpecular(specular: string | number): void;
    setShininess(shininess: number): void;
    setEmissive(emissive: string | number): void;
    setEmissiveIntensity(intensity: number): void;
    setWireframe(wireframe: boolean): void;
}

/**
 * Standard Material - PBR material
 */
export declare class StandardMaterial extends Material {
    public color: string | number;
    public map: any;
    public normalMap: any;
    public normalScale: { x: number; y: number };
    public roughnessMap: any;
    public metalnessMap: any;
    public alphaMap: any;
    public emissive: string | number;
    public emissiveIntensity: number;
    public roughness: number;
    public metalness: number;
    public envMap: any;
    public envMapIntensity: number;
    public wireframe: boolean;

    constructor(options?: MaterialOptions & {
        color?: string | number;
        map?: any;
        normalMap?: any;
        normalScale?: { x: number; y: number };
        roughnessMap?: any;
        metalnessMap?: any;
        alphaMap?: any;
        emissive?: string | number;
        emissiveIntensity?: number;
        roughness?: number;
        metalness?: number;
        envMap?: any;
        envMapIntensity?: number;
        wireframe?: boolean;
    });

    setColor(color: string | number): void;
    setRoughness(roughness: number): void;
    setMetalness(metalness: number): void;
    setEnvMapIntensity(intensity: number): void;
    setEmissive(emissive: string | number): void;
    setEmissiveIntensity(intensity: number): void;
    setWireframe(wireframe: boolean): void;
}