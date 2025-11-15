/**
 * @class Color
 * @description Color class with comprehensive operations and multiple color space support
 * @author 9th.js Team
 * @version 1.0.0
 */
export class Color {
    constructor(r = 1, g = 1, b = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    /**
     * Set color components
     */
    set(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }

    /**
     * Copy color from another color
     */
    copy(c) {
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        return this;
    }

    /**
     * Clone color
     */
    clone() {
        return new Color(this.r, this.g, this.b);
    }

    /**
     * Set from hex string
     */
    setHex(hex) {
        hex = hex.replace('#', '');
        
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        
        const value = parseInt(hex, 16);
        this.r = (value >> 16 & 255) / 255;
        this.g = (value >> 8 & 255) / 255;
        this.b = (value & 255) / 255;
        
        return this;
    }

    /**
     * Set from RGB values (0-1 range)
     */
    setRGB(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }

    /**
     * Set from RGB values (0-255 range)
     */
    setRGBInt(r, g, b) {
        this.r = r / 255;
        this.g = g / 255;
        this.b = b / 255;
        return this;
    }

    /**
     * Set from HSL values
     */
    setHSL(h, s, l) {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        this.r = r;
        this.g = g;
        this.b = b;
        
        return this;
    }

    /**
     * Set from HSV values
     */
    setHSV(h, s, v) {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        let r, g, b;
        
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        
        this.r = r;
        this.g = g;
        this.b = b;
        
        return this;
    }

    /**
     * Get HSL values
     */
    getHSL() {
        const r = this.r, g = this.g, b = this.b;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2;
        
        if (max === min) {
            return { h: 0, s: 0, l: lightness };
        }
        
        const delta = max - min;
        const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        let hue;
        
        switch (max) {
            case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: hue = (b - r) / delta + 2; break;
            case b: hue = (r - g) / delta + 4; break;
            default: hue = 0;
        }
        
        hue /= 6;
        
        return { h: hue, s: saturation, l: lightness };
    }

    /**
     * Get HSV values
     */
    getHSV() {
        const r = this.r, g = this.g, b = this.b;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        const value = max;
        const saturation = max === 0 ? 0 : delta / max;
        let hue = 0;
        
        if (delta !== 0) {
            switch (max) {
                case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
                case g: hue = (b - r) / delta + 2; break;
                case b: hue = (r - g) / delta + 4; break;
            }
            hue /= 6;
        }
        
        return { h: hue, s: saturation, v: value };
    }

    /**
     * Convert to hex string
     */
    getHex() {
        const r = Math.round(this.r * 255);
        const g = Math.round(this.g * 255);
        const b = Math.round(this.b * 255);
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Convert to hex string (uppercase)
     */
    getHexString() {
        return this.getHex().toUpperCase();
    }

    /**
     * Convert to RGB array (0-1 range)
     */
    toArray() {
        return [this.r, this.g, this.b];
    }

    /**
     * Convert to RGB array with offset
     */
    toArrayWithOffset(array, offset = 0) {
        array[offset] = this.r;
        array[offset + 1] = this.g;
        array[offset + 2] = this.b;
        return array;
    }

    /**
     * Convert to RGB array (0-255 range)
     */
    toArrayInt() {
        return [
            Math.round(this.r * 255),
            Math.round(this.g * 255),
            Math.round(this.b * 255)
        ];
    }

    /**
     * Set from array
     */
    fromArray(array, offset = 0) {
        this.r = array[offset];
        this.g = array[offset + 1];
        this.b = array[offset + 2];
        return this;
    }

    /**
     * Add color
     */
    add(c) {
        this.r += c.r;
        this.g += c.g;
        this.b += c.b;
        return this;
    }

    /**
     * Add colors and return new color
     */
    addColors(a, b) {
        this.r = a.r + b.r;
        this.g = a.g + b.g;
        this.b = a.b + b.b;
        return this;
    }

    /**
     * Subtract color
     */
    sub(c) {
        this.r -= c.r;
        this.g -= c.g;
        this.b -= c.b;
        return this;
    }

    /**
     * Subtract colors and return new color
     */
    subColors(a, b) {
        this.r = a.r - b.r;
        this.g = a.g - b.g;
        this.b = a.b - b.b;
        return this;
    }

    /**
     * Multiply by scalar
     */
    multiplyScalar(s) {
        this.r *= s;
        this.g *= s;
        this.b *= s;
        return this;
    }

    /**
     * Multiply by color (component-wise)
     */
    multiply(c) {
        this.r *= c.r;
        this.g *= c.g;
        this.b *= c.b;
        return this;
    }

    /**
     * Divide by scalar
     */
    divideScalar(s) {
        if (s !== 0) {
            this.r /= s;
            this.g /= s;
            this.b /= s;
        } else {
            this.set(0, 0, 0);
        }
        return this;
    }

    /**
     * Divide by color (component-wise)
     */
    divide(c) {
        if (c.r !== 0 && c.g !== 0 && c.b !== 0) {
            this.r /= c.r;
            this.g /= c.g;
            this.b /= c.b;
        }
        return this;
    }

    /**
     * Lerp (linear interpolation)
     */
    lerp(c, alpha) {
        this.r += (c.r - this.r) * alpha;
        this.g += (c.g - this.g) * alpha;
        this.b += (c.b - this.b) * alpha;
        return this;
    }

    /**
     * Lerp colors
     */
    lerpColors(a, b, alpha) {
        this.r = a.r + (b.r - a.r) * alpha;
        this.g = a.g + (b.g - a.g) * alpha;
        this.b = a.b + (b.b - a.b) * alpha;
        return this;
    }

    /**
     * Lerp in HSL space (preserves saturation and lightness better)
     */
    lerpHSL(c, alpha) {
        const hsl1 = this.getHSL();
        const hsl2 = c.getHSL();
        
        // Handle hue wrapping
        let h1 = hsl1.h, h2 = hsl2.h;
        if (h2 > h1 + 0.5) h1 += 1;
        if (h1 > h2 + 0.5) h2 += 1;
        
        const h = (h1 + (h2 - h1) * alpha) % 1;
        const s = hsl1.s + (hsl2.s - hsl1.s) * alpha;
        const l = hsl1.l + (hsl2.l - hsl1.l) * alpha;
        
        this.setHSL(h, s, l);
        return this;
    }

    /**
     * Apply gamma correction
     */
    gammaCorrect() {
        this.r = Math.pow(this.r, 2.2);
        this.g = Math.pow(this.g, 2.2);
        this.b = Math.pow(this.b, 2.2);
        return this;
    }

    /**
     * Inverse gamma correction
     */
    convertGammaToLinear() {
        this.r = Math.pow(this.r, 2.2);
        this.g = Math.pow(this.g, 2.2);
        this.b = Math.pow(this.b, 2.2);
        return this;
    }

    /**
     * Apply linear to gamma correction
     */
    convertLinearToGamma() {
        this.r = Math.pow(this.r, 1.0 / 2.2);
        this.g = Math.pow(this.g, 1.0 / 2.2);
        this.b = Math.pow(this.b, 1.0 / 2.2);
        return this;
    }

    /**
     * Clamp color values to [0, 1] range
     */
    clamp() {
        this.r = Math.max(0, Math.min(1, this.r));
        this.g = Math.max(0, Math.min(1, this.g));
        this.b = Math.max(0, Math.min(1, this.b));
        return this;
    }

    /**
     * Clamp to min/max range
     */
    clampScalar(min, max) {
        this.r = Math.max(min, Math.min(max, this.r));
        this.g = Math.max(min, Math.min(max, this.g));
        this.b = Math.max(min, Math.min(max, this.b));
        return this;
    }

    /**
     * Get brightness (luminance)
     */
    getLuminance() {
        return 0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b;
    }

    /**
     * Convert to grayscale
     */
    toGrayscale() {
        const luminance = this.getLuminance();
        this.set(luminance, luminance, luminance);
        return this;
    }

    /**
     * Apply sepia filter
     */
    sepia(amount = 1) {
        const r = this.r;
        const g = this.g;
        const b = this.b;
        
        this.r = (r * (1 - amount)) + (r * 0.393 + g * 0.769 + b * 0.189) * amount;
        this.g = (g * (1 - amount)) + (r * 0.349 + g * 0.686 + b * 0.168) * amount;
        this.b = (b * (1 - amount)) + (r * 0.272 + g * 0.534 + b * 0.131) * amount;
        
        return this.clamp();
    }

    /**
     * Invert color
     */
    invert() {
        this.r = 1 - this.r;
        this.g = 1 - this.g;
        this.b = 1 - this.b;
        return this;
    }

    /**
     * Convert to CMYK (approximate)
     */
    toCMYK() {
        const r = this.r, g = this.g, b = this.b;
        const k = 1 - Math.max(r, g, b);
        const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
        const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
        const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
        
        return { c, m, y, k };
    }

    /**
     * Set from CMYK
     */
    setCMYK(c, m, y, k) {
        this.r = (1 - c) * (1 - k);
        this.g = (1 - m) * (1 - k);
        this.b = (1 - y) * (1 - k);
        return this;
    }

    /**
     * Check if color equals another color (with tolerance)
     */
    equals(c, tolerance = 1e-6) {
        return Math.abs(this.r - c.r) < tolerance && 
               Math.abs(this.g - c.g) < tolerance && 
               Math.abs(this.b - c.b) < tolerance;
    }

    /**
     * Get color distance to another color
     */
    distanceTo(c) {
        const dr = this.r - c.r;
        const dg = this.g - c.g;
        const db = this.b - c.b;
        return Math.hypot(dr, dg, db);
    }

    /**
     * Get squared distance to another color
     */
    distanceToSquared(c) {
        const dr = this.r - c.r;
        const dg = this.g - c.g;
        const db = this.b - c.b;
        return dr * dr + dg * dg + db * db;
    }

    /**
     * Get string representation
     */
    toString() {
        return `Color(${this.r.toFixed(3)}, ${this.g.toFixed(3)}, ${this.b.toFixed(3)})`;
    }

    /**
     * Get CSS color string
     */
    toCSS() {
        const r = Math.round(this.r * 255);
        const g = Math.round(this.g * 255);
        const b = Math.round(this.b * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Get hex color string
     */
    toHex() {
        return this.getHex();
    }

    /**
     * Static methods
     */

    /**
     * Create from hex string
     */
    static fromHex(hex) {
        return new Color().setHex(hex);
    }

    /**
     * Create from RGB values
     */
    static fromRGB(r, g, b) {
        return new Color(r, g, b);
    }

    /**
     * Create from HSL values
     */
    static fromHSL(h, s, l) {
        return new Color().setHSL(h, s, l);
    }

    /**
     * Create from HSV values
     */
    static fromHSV(h, s, v) {
        return new Color().setHSV(h, s, v);
    }

    /**
     * Create from CMYK values
     */
    static fromCMYK(c, m, y, k) {
        return new Color().setCMYK(c, m, y, k);
    }

    /**
     * Create random color
     */
    static random() {
        return new Color(Math.random(), Math.random(), Math.random());
    }

    /**
     * Create random color in HSL space
     */
    static randomHSL() {
        return new Color().setHSL(Math.random(), 1, 0.5);
    }

    /**
     * Linear interpolation between two colors
     */
    static lerp(a, b, alpha) {
        return new Color(
            a.r + (b.r - a.r) * alpha,
            a.g + (b.g - a.g) * alpha,
            a.b + (b.b - a.b) * alpha
        );
    }

    /**
     * Check if two colors are equal
     */
    static equals(a, b, tolerance = 1e-6) {
        return a.equals(b, tolerance);
    }

    /**
     * Get distance between two colors
     */
    static distance(a, b) {
        return a.distanceTo(b);
    }

    /**
     * HSL color space conversions
     */
    static hslToRgb(h, s, l) {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [r, g, b];
    }

    static rgbToHsl(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2;
        
        if (max === min) {
            return [0, 0, lightness];
        }
        
        const delta = max - min;
        const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        let hue;
        
        switch (max) {
            case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: hue = (b - r) / delta + 2; break;
            case b: hue = (r - g) / delta + 4; break;
            default: hue = 0;
        }
        
        hue /= 6;
        
        return [hue, saturation, lightness];
    }

    /**
     * HSV color space conversions
     */
    static hsvToRgb(h, s, v) {
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        let r, g, b;
        
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        
        return [r, g, b];
    }

    static rgbToHsv(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        const value = max;
        const saturation = max === 0 ? 0 : delta / max;
        let hue = 0;
        
        if (delta !== 0) {
            switch (max) {
                case r: hue = (g - b) / delta + (g < b ? 6 : 0); break;
                case g: hue = (b - r) / delta + 2; break;
                case b: hue = (r - g) / delta + 4; break;
            }
            hue /= 6;
        }
        
        return [hue, saturation, value];
    }

    /**
     * Preset color constants
     */
    static get black() {
        return new Color(0, 0, 0);
    }

    static get white() {
        return new Color(1, 1, 1);
    }

    static get red() {
        return new Color(1, 0, 0);
    }

    static get green() {
        return new Color(0, 1, 0);
    }

    static get blue() {
        return new Color(0, 0, 1);
    }

    static get yellow() {
        return new Color(1, 1, 0);
    }

    static get magenta() {
        return new Color(1, 0, 1);
    }

    static get cyan() {
        return new Color(0, 1, 1);
    }

    static get gray() {
        return new Color(0.5, 0.5, 0.5);
    }

    static get darkGray() {
        return new Color(0.25, 0.25, 0.25);
    }

    static get lightGray() {
        return new Color(0.75, 0.75, 0.75);
    }

    static get orange() {
        return new Color(1, 0.5, 0);
    }

    static get purple() {
        return new Color(0.5, 0, 0.5);
    }

    static get brown() {
        return new Color(0.6, 0.3, 0.1);
    }

    static get pink() {
        return new Color(1, 0.75, 0.8);
    }

    static get lime() {
        return new Color(0.75, 1, 0);
    }

    static get navy() {
        return new Color(0, 0, 0.5);
    }

    static get teal() {
        return new Color(0, 0.5, 0.5);
    }

    static get olive() {
        return new Color(0.5, 0.5, 0);
    }
}
