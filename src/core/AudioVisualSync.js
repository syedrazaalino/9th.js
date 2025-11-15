/**
 * AudioVisualSync.js - Advanced Audio/Visual Synchronization System
 * Integrates Web Audio API with real-time visual effects
 */

import { Material } from './Material.js';
import { Mesh } from './Mesh.js';
import { Shader } from './Shader.js';

/**
 * AudioVisualSync - Main class for audio-visual synchronization
 */
export class AudioVisualSync {
    constructor() {
        // Web Audio API components
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.gainNode = null;
        
        // Audio analysis data
        this.frequencyData = new Uint8Array(512);
        this.frequencyDataLow = new Uint8Array(256);
        this.frequencyDataMid = new Uint8Array(256);
        this.frequencyDataHigh = new Uint8Array(256);
        this.timeDomainData = new Uint8Array(512);
        this.volumeHistory = [];
        
        // Beat detection
        this.beatHistory = [];
        this.isBeat = false;
        this.beatThreshold = 1.3;
        this.beatHoldTime = 0;
        this.beatCooldown = 0;
        
        // Visualization data
        this.visualData = {
            bass: 0,
            mid: 0,
            treble: 0,
            volume: 0,
            spectralCentroid: 0,
            spectralRolloff: 0,
            energy: 0,
            zeroCrossingRate: 0
        };
        
        // Registered visual objects
        this.visualObjects = [];
        this.audioReactiveMaterials = [];
        
        // Configuration
        this.config = {
            fftSize: 1024,
            smoothingTimeConstant: 0.8,
            beatDetectionSensitivity: 1.3,
            minBeatInterval: 200, // milliseconds
            spectralAnalysisBands: {
                bass: [20, 250],
                mid: [250, 4000],
                high: [4000, 20000]
            }
        };
        
        // Initialization
        this.initialize();
    }
    
    /**
     * Initialize the audio system
     */
    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            
            // Connect the audio graph
            this.gainNode.connect(this.analyser);
            
            // Initialize data arrays
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDomainData = new Uint8Array(this.analyser.fftSize);
            
            console.log('AudioVisualSync initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AudioVisualSync:', error);
        }
    }
    
    /**
     * Load audio from file input or URL
     * @param {string|File} source - Audio file path or File object
     */
    async loadAudio(source) {
        try {
            if (!this.audioContext) {
                throw new Error('Audio context not initialized');
            }
            
            let audioBuffer;
            
            if (source instanceof File) {
                const arrayBuffer = await source.arrayBuffer();
                audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            } else {
                const response = await fetch(source);
                const arrayBuffer = await response.arrayBuffer();
                audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            }
            
            // Create buffer source
            if (this.source) {
                this.source.disconnect();
            }
            
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = audioBuffer;
            this.source.connect(this.gainNode);
            
            return audioBuffer;
        } catch (error) {
            console.error('Failed to load audio:', error);
            throw error;
        }
    }
    
    /**
     * Start audio playback
     */
    async playAudio() {
        if (this.source && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        if (this.source) {
            this.source.start();
        }
    }
    
    /**
     * Stop audio playback
     */
    stopAudio() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
    }
    
    /**
     * Set master volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
    
    /**
     * Analyze audio data and update visual data
     * Call this method once per frame
     */
    update() {
        if (!this.analyser) return;
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeDomainData);
        
        // Update frequency band data
        this.updateFrequencyBands();
        
        // Calculate visual metrics
        this.calculateVisualMetrics();
        
        // Detect beats
        this.detectBeats();
        
        // Update registered visual objects
        this.updateVisualObjects();
    }
    
    /**
     * Update frequency band analysis
     */
    updateFrequencyBands() {
        const lowEnd = Math.floor((this.config.spectralAnalysisBands.bass[0] / this.audioContext.sampleRate) * this.frequencyData.length * 2);
        const midEnd = Math.floor((this.config.spectralAnalysisBands.mid[1] / this.audioContext.sampleRate) * this.frequencyData.length * 2);
        const highEnd = this.frequencyData.length;
        
        // Calculate bass (low frequencies)
        let bassSum = 0;
        for (let i = lowEnd; i < midEnd / 2; i++) {
            bassSum += this.frequencyData[i];
        }
        this.visualData.bass = bassSum / ((midEnd / 2) - lowEnd) / 255;
        
        // Calculate mid frequencies
        let midSum = 0;
        for (let i = midEnd / 2; i < highEnd / 2; i++) {
            midSum += this.frequencyData[i];
        }
        this.visualData.mid = midSum / ((highEnd / 2) - (midEnd / 2)) / 255;
        
        // Calculate treble (high frequencies)
        let highSum = 0;
        for (let i = highEnd / 2; i < highEnd; i++) {
            highSum += this.frequencyData[i];
        }
        this.visualData.treble = highSum / ((highEnd) - (highEnd / 2)) / 255;
    }
    
    /**
     * Calculate advanced visual metrics
     */
    calculateVisualMetrics() {
        // Overall volume
        let volumeSum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            volumeSum += this.frequencyData[i];
        }
        this.visualData.volume = (volumeSum / this.frequencyData.length) / 255;
        
        // Store volume history for beat detection
        this.volumeHistory.push(this.visualData.volume);
        if (this.volumeHistory.length > 43) {
            this.volumeHistory.shift();
        }
        
        // Spectral centroid
        let weightedSum = 0;
        let magnitudeSum = 0;
        const nyquist = this.audioContext.sampleRate / 2;
        const binWidth = nyquist / this.frequencyData.length;
        
        for (let i = 0; i < this.frequencyData.length; i++) {
            const frequency = i * binWidth;
            const magnitude = this.frequencyData[i];
            weightedSum += frequency * magnitude;
            magnitudeSum += magnitude;
        }
        
        this.visualData.spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum / nyquist : 0;
        
        // Zero crossing rate for timbre analysis
        let zeroCrossings = 0;
        for (let i = 1; i < this.timeDomainData.length; i++) {
            const current = this.timeDomainData[i] - 128;
            const previous = this.timeDomainData[i - 1] - 128;
            if ((current >= 0 && previous < 0) || (current < 0 && previous >= 0)) {
                zeroCrossings++;
            }
        }
        this.visualData.zeroCrossingRate = zeroCrossings / this.timeDomainData.length;
    }
    
    /**
     * Detect beats using adaptive thresholding
     */
    detectBeats() {
        if (this.volumeHistory.length < 43) return;
        
        const currentVolume = this.visualData.volume;
        
        // Calculate average volume over recent history
        let sum = 0;
        for (let i = 1; i < this.volumeHistory.length; i++) {
            sum += this.volumeHistory[i];
        }
        const average = sum / (this.volumeHistory.length - 1);
        
        // Calculate variance
        let variance = 0;
        for (let i = 1; i < this.volumeHistory.length; i++) {
            variance += Math.pow(this.volumeHistory[i] - average, 2);
        }
        variance /= (this.volumeHistory.length - 1);
        
        // Adaptive threshold
        const threshold = average + (this.beatThreshold * Math.sqrt(variance));
        
        // Beat detection with cooldown
        if (this.beatCooldown <= 0 && currentVolume > threshold) {
            this.isBeat = true;
            this.beatHistory.push(Date.now());
            this.beatCooldown = this.config.minBeatInterval;
            
            // Trigger beat callbacks
            this.triggerBeatCallbacks();
        } else {
            this.isBeat = false;
        }
        
        // Update cooldown timer
        if (this.beatCooldown > 0) {
            this.beatCooldown -= 1000 / 60; // Assuming 60fps
        }
    }
    
    /**
     * Trigger registered beat callbacks
     */
    triggerBeatCallbacks() {
        this.visualObjects.forEach(obj => {
            if (obj.onBeat) {
                obj.onBeat(this.visualData);
            }
        });
    }
    
    /**
     * Register a visual object for audio reactive updates
     * @param {Object} visualObject - Object with update method
     */
    registerVisualObject(visualObject) {
        this.visualObjects.push(visualObject);
    }
    
    /**
     * Unregister a visual object
     * @param {Object} visualObject - Object to unregister
     */
    unregisterVisualObject(visualObject) {
        const index = this.visualObjects.indexOf(visualObject);
        if (index > -1) {
            this.visualObjects.splice(index, 1);
        }
    }
    
    /**
     * Register an audio-reactive material
     * @param {Material} material - Material to make audio-reactive
     */
    registerAudioReactiveMaterial(material) {
        if (material instanceof Material) {
            this.audioReactiveMaterials.push(material);
        }
    }
    
    /**
     * Update all registered visual objects
     */
    updateVisualObjects() {
        this.visualObjects.forEach(obj => {
            if (obj.update && typeof obj.update === 'function') {
                obj.update(this.visualData, this.isBeat);
            }
        });
        
        // Update audio-reactive materials
        this.audioReactiveMaterials.forEach(material => {
            if (material.updateFromAudio) {
                material.updateFromAudio(this.visualData, this.isBeat);
            }
        });
    }
    
    /**
     * Get current visual data
     * @returns {Object} Current visual metrics
     */
    getVisualData() {
        return { ...this.visualData };
    }
    
    /**
     * Check if a beat was detected in the current frame
     * @returns {boolean} True if beat detected
     */
    wasBeat() {
        return this.isBeat;
    }
    
    /**
     * Get frequency spectrum data
     * @returns {Uint8Array} Frequency spectrum data
     */
    getFrequencyData() {
        return this.frequencyData;
    }
    
    /**
     * Get time domain data (waveform)
     * @returns {Uint8Array} Time domain data
     */
    getTimeDomainData() {
        return this.timeDomainData;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stopAudio();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.visualObjects = [];
        this.audioReactiveMaterials = [];
    }
}

/**
 * AudioReactiveMaterial - Material that responds to audio data
 */
export class AudioReactiveMaterial extends Material {
    constructor(shader = null) {
        super(shader);
        
        // Audio-reactive properties
        this.audioProperties = {
            intensity: 1.0,
            frequency: 0.0,
            colorShift: 0.0,
            glowIntensity: 0.0,
            distortion: 0.0
        };
        
        // Shader uniforms for audio reactivity
        this.shader.uniforms = {
            ...this.shader.uniforms,
            audioIntensity: { value: 0.0 },
            audioFrequency: { value: 0.0 },
            audioVolume: { value: 0.0 },
            audioBeat: { value: 0.0 },
            audioSpectrum: { value: new Array(64).fill(0.0) }
        };
    }
    
    /**
     * Update material properties based on audio data
     * @param {Object} audioData - Current audio analysis data
     * @param {boolean} isBeat - Whether a beat was detected
     */
    updateFromAudio(audioData, isBeat = false) {
        // Update shader uniforms
        this.shader.uniforms.audioIntensity.value = audioData.volume;
        this.shader.uniforms.audioFrequency.value = audioData.spectralCentroid;
        this.shader.uniforms.audioVolume.value = audioData.volume;
        this.shader.uniforms.audioBeat.value = isBeat ? 1.0 : 0.0;
        
        // Update audio spectrum (downsample if needed)
        const spectrum = audioData.frequencyData || audioData.bass;
        if (Array.isArray(spectrum)) {
            const spectrumLength = this.shader.uniforms.audioSpectrum.value.length;
            const step = Math.max(1, Math.floor(spectrum.length / spectrumLength));
            
            for (let i = 0; i < spectrumLength; i++) {
                const index = i * step;
                this.shader.uniforms.audioSpectrum.value[i] = 
                    spectrum[index] / 255; // Normalize to 0-1
            }
        }
        
        // Update material properties
        this.audioProperties.intensity = audioData.volume;
        this.audioProperties.frequency = audioData.spectralCentroid;
        this.audioProperties.glowIntensity = isBeat ? Math.max(0.5, audioData.volume) : audioData.volume * 0.3;
        
        // Trigger material update if needed
        if (this.onAudioUpdate) {
            this.onAudioUpdate(audioData, isBeat);
        }
    }
    
    /**
     * Set callback for audio updates
     * @param {Function} callback - Function to call when audio updates
     */
    setAudioUpdateCallback(callback) {
        this.onAudioUpdate = callback;
    }
}

/**
 * BeatReactive - Mixin for beat-reactive objects
 */
export class BeatReactive {
    constructor() {
        this.beatCallbacks = [];
        this.beatSensitivity = 1.0;
        this.beatCooldown = 0;
    }
    
    /**
     * Add callback to be triggered on beats
     * @param {Function} callback - Function to call on beat
     */
    addBeatCallback(callback) {
        this.beatCallbacks.push(callback);
    }
    
    /**
     * Update method called by AudioVisualSync
     * @param {Object} audioData - Current audio data
     * @param {boolean} isBeat - Whether beat was detected
     */
    update(audioData, isBeat) {
        if (isBeat && this.beatCooldown <= 0) {
            this.triggerBeatCallbacks(audioData);
            this.beatCooldown = 100; // Cooldown in frames
        }
        
        if (this.beatCooldown > 0) {
            this.beatCooldown--;
        }
    }
    
    /**
     * Trigger all registered beat callbacks
     * @param {Object} audioData - Current audio data
     */
    triggerBeatCallbacks(audioData) {
        this.beatCallbacks.forEach(callback => {
            try {
                callback(audioData);
            } catch (error) {
                console.error('Beat callback error:', error);
            }
        });
    }
}

/**
 * FrequencyVisualizer - Utility class for creating frequency visualizations
 */
export class FrequencyVisualizer {
    /**
     * Create a frequency spectrum visualization mesh
     * @param {number} bars - Number of frequency bars
     * @param {number} width - Width of the visualization
     * @param {number} height - Height of the visualization
     * @returns {Object} Visualization object with update method
     */
    static createSpectrumBars(bars = 64, width = 10, height = 10) {
        const geometry = new Array(bars).fill(null).map(() => ({
            height: 0.1,
            targetHeight: 0.1
        }));
        
        const visualization = {
            type: 'spectrum',
            bars: geometry,
            update: (audioData) => {
                const spectrum = audioData.frequencyData || [];
                const barStep = Math.max(1, Math.floor(spectrum.length / bars));
                
                for (let i = 0; i < bars; i++) {
                    const spectrumIndex = i * barStep;
                    const normalizedValue = spectrum[spectrumIndex] / 255;
                    visualization.bars[i].targetHeight = normalizedValue * height;
                }
                
                // Smooth animation
                for (let bar of visualization.bars) {
                    bar.height += (bar.targetHeight - bar.height) * 0.3;
                }
            },
            getGeometry: () => visualization.bars
        };
        
        return visualization;
    }
    
    /**
     * Create a circular frequency visualization
     * @param {number} segments - Number of segments
     * @param {number} radius - Base radius
     * @returns {Object} Circular visualization object
     */
    static createCircularVisualization(segments = 64, radius = 5) {
        const angles = new Array(segments).fill(0).map((_, i) => (i / segments) * Math.PI * 2);
        const radii = new Array(segments).fill(radius);
        
        return {
            type: 'circular',
            angles: angles,
            radii: radii,
            targetRadii: radii.slice(),
            update: (audioData) => {
                const spectrum = audioData.frequencyData || [];
                const segmentStep = Math.max(1, Math.floor(spectrum.length / segments));
                
                for (let i = 0; i < segments; i++) {
                    const spectrumIndex = i * segmentStep;
                    const normalizedValue = spectrum[spectrumIndex] / 255;
                    visualization.targetRadii[i] = radius + (normalizedValue * radius * 2);
                }
                
                // Smooth animation
                for (let i = 0; i < segments; i++) {
                    visualization.radii[i] += (visualization.targetRadii[i] - visualization.radii[i]) * 0.4;
                }
            }
        };
    }
}

// Export the main AudioVisualSync class
export default AudioVisualSync;
