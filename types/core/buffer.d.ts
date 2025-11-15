/**
 * Buffer Type Definitions
 * WebGL buffer management
 */

export interface BufferAttributeOptions {
    itemSize: number;
    normalized?: boolean;
    dynamic?: boolean;
    usage?: number;
}

/**
 * Buffer - WebGL buffer wrapper
 */
export declare class Buffer {
    public id: string;
    public uuid: string;
    public name: string;
    public type: string;
    public array: any;
    public itemSize: number;
    public count: number;
    public usage: number;
    public normalized: boolean;
    public dynamic: boolean;
    public isBufferAttribute: boolean;

    constructor(array: any, itemSize: number, usage?: number);

    /**
     * Set buffer usage hint
     */
    setUsage(usage: number): void;

    /**
     * Copy buffer from another buffer
     */
    copy(source: Buffer): Buffer;

    /**
     * Copy array into buffer
     */
    copyArray(array: any): Buffer;

    /**
     * Copy typed array
     */
    copyAt(index1: number, array: Buffer, index2: number): Buffer;

    /**
     * Copy array with offset
     */
    setArray(array: any): Buffer;

    /**
     * Get array
     */
    getArray(): any;

    /**
     * Get item at index
     */
    getItem(index: number): any;

    /**
     * Set item at index
     */
    setItem(index: number, item: any): void;

    /**
     * Set sub array
     */
    setSubArray(index: number, array: any): Buffer;

    /**
     * Check if buffer needs update
     */
    needsUpdate(): void;

    /**
     * Mark buffer as updated
     */
    updateFromArray(): void;

    /**
     * Get dynamic usage
     */
    getDynamicUsage(): boolean;

    /**
     * Clone buffer
     */
    clone(): Buffer;

    /**
     * Dispose buffer
     */
    dispose(): void;
}

/**
 * BufferAttribute - Specialized buffer for attributes
 */
export declare class BufferAttribute extends Buffer {
    constructor(array: any, itemSize: number, normalized?: boolean);
    
    /**
     * Get X component at index
     */
    getX(index: number): number;

    /**
     * Get Y component at index
     */
    getY(index: number): number;

    /**
     * Get Z component at index
     */
    getZ(index: number): number;

    /**
     * Get W component at index
     */
    getW(index: number): number;

    /**
     * Set X component at index
     */
    setX(index: number, x: number): BufferAttribute;

    /**
     * Set Y component at index
     */
    setY(index: number, y: number): BufferAttribute;

    /**
     * Set Z component at index
     */
    setZ(index: number, z: number): BufferAttribute;

    /**
     * Set W component at index
     */
    setW(index: number, w: number): BufferAttribute;

    /**
     * Set XY components at index
     */
    setXY(index: number, x: number, y: number): BufferAttribute;

    /**
     * Set XYZ components at index
     */
    setXYZ(index: number, x: number, y: number, z: number): BufferAttribute;

    /**
     * Set XYZW components at index
     */
    setXYZW(index: number, x: number, y: number, z: number, w: number): BufferAttribute;

    /**
     * Get array as Float32Array
     */
    getArray(): Float32Array;

    /**
     * Set array from Float32Array
     */
    setArray(array: Float32Array): BufferAttribute;
}

// Static constants
export declare namespace BufferAttribute {
    const DefaultUsage: number;
    const StaticDrawUsage: number;
    const DynamicDrawUsage: number;
    const StreamDrawUsage: number;
    const StaticReadUsage: number;
    const DynamicReadUsage: number;
    const StreamReadUsage: number;
    const StaticCopyUsage: number;
    const DynamicCopyUsage: number;
    const StreamCopyUsage: number;
}