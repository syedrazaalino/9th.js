/**
 * Color Type Definitions
 * Color representation and manipulation
 */

export type ColorRepresentation = string | number;

/**
 * Color - RGB color representation
 */
export declare class Color {
    public r: number;
    public g: number;
    public b: number;

    constructor(color?: ColorRepresentation);

    /**
     * Set color from hex string or number
     */
    set(color: ColorRepresentation): Color;

    /**
     * Set RGB components directly
     */
    setRGB(r: number, g: number, b: number): Color;

    /**
     * Set HSL components
     */
    setHSL(h: number, s: number, l: number): Color;

    /**
     * Set from hex string
     */
    setHex(hex: number): Color;

    /**
     * Set from CSS color string
     */
    setStyle(style: string): Color;

    /**
     * Set from color name
     */
    setColorName(colorName: string): Color;

    /**
     * Copy color from another color
     */
    copy(source: Color): Color;

    /**
     * Clone color
     */
    clone(): Color;

    /**
     * Get color as hex number
     */
    getHex(): number;

    /**
     * Get color as hex string
     */
    getHexString(): string;

    /**
     * Get color as CSS string
     */
    getStyle(): string;

    /**
     * Get color as HSL
     */
    getHSL(): { h: number; s: number; l: number };

    /**
     * Convert to HSL and return array
     */
    getHSLArray(): number[];

    /**
     * Get luminance
     */
    getLuminance(): number;

    /**
     * Get brightness
     */
    getBrightness(): number;

    /**
     * Add color
     */
    add(color: Color): Color;

    /**
     * Add colors and store result
     */
    addColors(color1: Color, color2: Color): Color;

    /**
     * Add scalar to color
     */
    addScalar(s: number): Color;

    /**
     * Subtract color
     */
    sub(color: Color): Color;

    /**
     * Subtract colors and store result
     */
    subColors(color1: Color, color2: Color): Color;

    /**
     * Multiply by color
     */
    multiply(color: Color): Color;

    /**
     * Multiply colors and store result
     */
    multiplyColors(color1: Color, color2: Color): Color;

    /**
     * Multiply by scalar
     */
    multiplyScalar(s: number): Color;

    /**
     * Divide by color
     */
    divide(color: Color): Color;

    /**
     * Divide colors and store result
     */
    divideColors(color1: Color, color2: Color): Color;

    /**
     * Divide by scalar
     */
    divideScalar(s: number): Color;

    /**
     * Lerp towards target color
     */
    lerp(color: Color, alpha: number): Color;

    /**
     * Linear interpolation between colors
     */
    lerpColors(color1: Color, color2: Color, alpha: number): Color;

    /**
     * Check if colors are equal
     */
    equals(color: Color): boolean;

    /**
     * Convert to array
     */
    toArray(): number[];

    /**
     * Convert to array (fixed length)
     */
    toArray3(): [number, number, number];

    /**
     * Set from array
     */
    fromArray(array: number[], offset?: number): Color;

    /**
     * Offset color
     */
    offsetHSL(h: number, s: number, l: number): Color;

    /**
     * Add color to this color
     */
    addColor(color: Color): Color;

    /**
     * Subtract color from this color
     */
    subColor(color: Color): Color;

    /**
     * Convert to linear space
     */
    convertLinearToSRGB(): Color;

    /**
     * Convert to sRGB space
     */
    convertSRGBToLinear(): Color;

    /**
     * Convert to XYZ color space
     */
    convertXYZtoSRGB(): Color;

    /**
     * Convert from XYZ color space
     */
    convertSRGBToXYZ(): Color;

    /**
     * Convert to HSL
     */
    convertHSLtoRGB(): Color;

    /**
     * Convert from HSL
     */
    convertRGBtoHSL(): Color;

    /**
     * Get approximate gamma correction
     */
    getGamma(): number;

    /**
     * Set approximate gamma correction
     */
    setGamma(gamma: number): Color;

    /**
     * Check if color represents black
     */
    isBlack(): boolean;

    /**
     * Set color using cosine palette
     */
    setCosinePalette(t: number, hueOffset: number, hueDelay: number, saturation: number, lightness: number): Color;

    /**
     * Set color using 3D noise
     */
    setNoise(noise: number): Color;
}

// Static color constants
export declare namespace Color {
    const WHITE: Color;
    const BLACK: Color;
    const RED: Color;
    const GREEN: Color;
    const BLUE: Color;
    const CYAN: Color;
    const MAGENTA: Color;
    const YELLOW: Color;
}

// Color conversion utilities
export declare namespace ColorUtils {
    function hexToRGB(hex: number): { r: number; g: number; b: number };
    function rgbToHex(r: number, g: number, b: number): number;
    function hexToHSL(hex: number): { h: number; s: number; l: number };
    function hslToHex(h: number, s: number, l: number): number;
    function rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number };
    function hslToRGB(h: number, s: number, l: number): { r: number; g: number; b: number };
    function rgbToString(r: number, g: number, b: number): string;
    function parseColor(color: ColorRepresentation): { r: number; g: number; b: number };
}