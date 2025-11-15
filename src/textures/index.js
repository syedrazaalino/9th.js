/**
 * Textures module index
 * Exports the main Texture class and utilities
 */

import { Texture } from './Texture.js';

/**
 * Utility functions for texture operations
 */
export const TextureUtils = {
    /**
     * Create a texture from canvas element
     */
    fromCanvas(canvas, options = {}) {
        return Texture.fromData(canvas, options);
    },
    
    /**
     * Create texture from video element
     */
    fromVideo(video, options = {}) {
        return Texture.fromData(video, options);
    },
    
    /**
     * Generate a checkerboard texture
     */
    generateCheckerboard(size = 256, colors = ['#ffffff', '#000000'], squares = 8) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const squareSize = size / squares;
        
        for (let y = 0; y < squares; y++) {
            for (let x = 0; x < squares; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? colors[0] : colors[1];
                ctx.fillRect(x * squareSize, y * squareSize, squareSize, squareSize);
            }
        }
        
        return Texture.fromData(canvas);
    },
    
    /**
     * Generate a gradient texture
     */
    generateGradient(width = 256, height = 256, colors = ['#ff0000', '#0000ff']) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        return Texture.fromData(canvas);
    },
    
    /**
     * Generate a noise texture
     */
    generateNoise(width = 256, height = 256, amplitude = 128) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.floor(Math.random() * amplitude);
            imageData.data[i] = noise;     // R
            imageData.data[i + 1] = noise; // G
            imageData.data[i + 2] = noise; // B
            imageData.data[i + 3] = 255;   // A
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return Texture.fromData(canvas);
    },
    
    /**
     * Create a solid color texture
     */
    generateSolidColor(width = 1, height = 1, color = '#ffffff') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        return Texture.fromData(canvas);
    },
    
    /**
     * Preload multiple textures
     */
    async preloadTextures(urls, onProgress = null) {
        const promises = urls.map(async (url, index) => {
            try {
                const texture = await Texture.load(url);
                if (onProgress) {
                    onProgress(index + 1, urls.length, texture);
                }
                return texture;
            } catch (error) {
                console.error(`Failed to load texture: ${url}`, error);
                if (onProgress) {
                    onProgress(index + 1, urls.length, null, error);
                }
                return null;
            }
        });
        
        return Promise.all(promises);
    },
    
    /**
     * Check if WebGL supports texture format
     */
    isFormatSupported(gl, format, type) {
        return Texture.isFormatSupported(gl, format, type);
    },
    
    /**
     * Get maximum texture size supported by WebGL
     */
    getMaxTextureSize(gl) {
        return Texture.getMaxTextureSize(gl);
    },
    
    /**
     * Detect image format from filename
     */
    detectFormat(filename) {
        return Texture.detectImageFormat(filename);
    }
};
