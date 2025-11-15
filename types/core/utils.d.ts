/**
 * Utils Type Definitions
 * Utility functions and helpers
 */

export interface MathUtils {
    clamp(value: number, min: number, max: number): number;
    lerp(a: number, b: number, t: number): number;
    interpolate(a: number, b: number, t: number): number;
    smoothstep(x: number, min: number, max: number): number;
    smootherstep(x: number, min: number, max: number): number;
    mapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number;
    randFloat(min: number, max: number): number;
    randFloatSpread(range: number): number;
    degToRad(degree: number): number;
    radToDeg(radians: number): number;
    isPowerOfTwo(value: number): boolean;
    nextPowerOfTwo(value: number): number;
    floorPowerOfTwo(value: number): number;
    ceilPowerOfTwo(value: number): number;
    floatToHalf(float: number): number;
    halfToFloat(half: number): number;
}

export interface StringUtils {
    generateUUID(): string;
    capitalize(str: string): string;
    camelCase(str: string): string;
    kebabCase(str: string): string;
    snakeCase(str: string): string;
    toTitleCase(str: string): string;
    trim(str: string): string;
    padStart(str: string, length: number, char?: string): string;
    padEnd(str: string, length: number, char?: string): string;
    truncate(str: string, length: number, suffix?: string): string;
    escapeHtml(str: string): string;
    unescapeHtml(str: string): string;
    escapeRegex(str: string): string;
    formatBytes(bytes: number, decimals?: number): string;
    formatTime(seconds: number): string;
}

export interface ArrayUtils {
    shuffle<T>(array: T[]): T[];
    random<T>(array: T[]): T | undefined;
    sample<T>(array: T[], count: number): T[];
    unique<T>(array: T[]): T[];
    remove<T>(array: T[], item: T): T[];
    flatten<T>(array: T[][]): T[];
    chunk<T>(array: T[], size: number): T[][];
    range(start: number, end: number, step?: number): number[];
    compact<T>(array: (T | null | undefined)[]): T[];
    groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] };
    findIndex<T>(array: T[], predicate: (item: T) => boolean): number;
    binarySearch<T>(array: T[], target: T): number;
}

export interface ObjectUtils {
    isEmpty(obj: any): boolean;
    cloneDeep(obj: any): any;
    merge(target: any, ...sources: any[]): any;
    pick(obj: any, keys: string[]): any;
    omit(obj: any, keys: string[]): any;
    get(obj: any, path: string): any;
    set(obj: any, path: string, value: any): any;
    has(obj: any, path: string): boolean;
    keys(obj: any): string[];
    values(obj: any): any[];
    entries(obj: any): [string, any][];
    invert(obj: any): any;
    mapValues(obj: any, fn: (value: any, key: string) => any): any;
    mapKeys(obj: any, fn: (key: string) => string): any;
    filter(obj: any, fn: (value: any, key: string) => boolean): any;
    every(obj: any, fn: (value: any, key: string) => boolean): boolean;
    some(obj: any, fn: (value: any, key: string) => boolean): boolean;
    findKey(obj: any, fn: (value: any, key: string) => boolean): string | null;
}

export interface ColorUtils {
    hexToRGB(hex: number): { r: number; g: number; b: number };
    rgbToHex(r: number, g: number, b: number): number;
    hexToHSL(hex: number): { h: number; s: number; l: number };
    hslToHex(h: number, s: number, l: number): number;
    rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number };
    hslToRGB(h: number, s: number, l: number): { r: number; g: number; b: number };
    rgbToString(r: number, g: number, b: number): string;
    parseColor(color: string | number): { r: number; g: number; b: number };
    luminance(r: number, g: number, b: number): number;
    contrast(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number;
    mix(color1: string | number, color2: string | number, t: number): string;
    lighten(color: string | number, amount: number): string;
    darken(color: string | number, amount: number): string;
    saturate(color: string | number, amount: number): string;
    desaturate(color: string | number, amount: number): string;
}

export interface ValidationUtils {
    isNumber(value: any): boolean;
    isString(value: any): boolean;
    isBoolean(value: any): boolean;
    isArray(value: any): boolean;
    isObject(value: any): boolean;
    isFunction(value: any): boolean;
    isNull(value: any): boolean;
    isUndefined(value: any): boolean;
    isEmpty(value: any): boolean;
    isEmail(email: string): boolean;
    isURL(url: string): boolean;
    isHexColor(color: string): boolean;
    isRGBColor(color: string): boolean;
    isHSLColor(color: string): boolean;
    isVector2(value: any): boolean;
    isVector3(value: any): boolean;
    isVector4(value: any): boolean;
    isMatrix3(value: any): boolean;
    isMatrix4(value: any): boolean;
    isQuaternion(value: any): boolean;
    isColor(value: any): boolean;
}

/**
 * Utils - Collection of utility functions
 */
export declare class Utils {
    static math: MathUtils;
    static string: StringUtils;
    static array: ArrayUtils;
    static object: ObjectUtils;
    static color: ColorUtils;
    static validation: ValidationUtils;

    /**
     * Debounce function calls
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number,
        immediate?: boolean
    ): (...args: Parameters<T>) => void;

    /**
     * Throttle function calls
     */
    static throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void;

    /**
     * Create a memoized function
     */
    static memoize<T extends (...args: any[]) => any>(
        func: T,
        resolver?: (...args: Parameters<T>) => any
    ): (...args: Parameters<T>) => ReturnType<T>;

    /**
     * Create a timeout promise
     */
    static delay(ms: number): Promise<void>;

    /**
     * Retry function with exponential backoff
     */
    static retry<T>(
        fn: () => Promise<T>,
        retries: number,
        delay?: number
    ): Promise<T>;

    /**
     * Create a simple event bus
     */
    static createEventBus(): {
        on: (event: string, callback: Function) => void;
        off: (event: string, callback: Function) => void;
        emit: (event: string, ...args: any[]) => void;
    };

    /**
     * Measure execution time
     */
    static measureTime<T>(fn: () => T): { result: T; time: number };

    /**
     * Convert degrees to radians
     */
    static degToRad(degrees: number): number;

    /**
     * Convert radians to degrees
     */
    static radToDeg(radians: number): number;

    /**
     * Clamp value between min and max
     */
    static clamp(value: number, min: number, max: number): number;

    /**
     * Linear interpolation
     */
    static lerp(start: number, end: number, factor: number): number;

    /**
     * Smooth step interpolation
     */
    static smoothstep(x: number, min: number, max: number): number;

    /**
     * Generate UUID
     */
    static generateUUID(): string;

    /**
     * Deep clone object
     */
    static deepClone<T>(obj: T): T;

    /**
     * Merge objects
     */
    static merge(target: any, ...sources: any[]): any;

    /**
     * Check if value is power of two
     */
    static isPowerOfTwo(value: number): boolean;

    /**
     * Get next power of two
     */
    static nextPowerOfTwo(value: number): number;
}

export default Utils;