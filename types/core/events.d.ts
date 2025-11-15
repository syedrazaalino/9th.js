/**
 * Events Type Definitions
 * Event system for Ninth.js
 */

export interface EventListener {
    (event: any): void;
}

export interface EventMap {
    [key: string]: any;
}

/**
 * EventEmitter - Event system implementation
 */
export declare class EventEmitter {
    private listeners: Map<string, EventListener[]>;
    private onceListeners: Map<string, EventListener[]>;
    private maxListeners: number;

    constructor();

    /**
     * Add event listener
     */
    on(event: string, listener: EventListener): EventEmitter;

    /**
     * Add event listener for one-time event
     */
    once(event: string, listener: EventListener): EventEmitter;

    /**
     * Add event listener at the beginning
     */
    prependListener(event: string, listener: EventListener): EventEmitter;

    /**
     * Add one-time event listener at the beginning
     */
    prependOnceListener(event: string, listener: EventListener): EventEmitter;

    /**
     * Remove event listener
     */
    off(event: string, listener: EventListener): EventEmitter;

    /**
     * Remove all listeners for event
     */
    removeAllListeners(event?: string): EventEmitter;

    /**
     * Remove all listeners
     */
    removeListeners(): EventEmitter;

    /**
     * Remove specific listener
     */
    removeListener(event: string, listener: EventListener): EventEmitter;

    /**
     * Emit event
     */
    emit(event: string, ...args: any[]): boolean;

    /**
     * Check if event has listeners
     */
    hasListeners(event: string): boolean;

    /**
     * Get listener count
     */
    listenerCount(event: string): number;

    /**
     * Get all event names
     */
    eventNames(): string[];

    /**
     * Get listeners for event
     */
    getListeners(event: string): EventListener[];

    /**
     * Set maximum listener count
     */
    setMaxListeners(n: number): EventEmitter;

    /**
     * Get maximum listener count
     */
    getMaxListeners(): number;

    /**
     * Get raw listeners
     */
    rawListeners(event: string): EventListener[];

    /**
     * Get listener array
     */
    getListenerArray(event: string): EventListener[];
}

/**
 * EventSystem - Global event management
 */
export declare class EventSystem {
    private emitters: Map<string, EventEmitter>;
    private globalEmitter: EventEmitter;

    constructor();

    /**
     * Get emitter for channel
     */
    getEmitter(channel: string): EventEmitter;

    /**
     * Remove emitter
     */
    removeEmitter(channel: string): void;

    /**
     * Clear all emitters
     */
    clearEmitters(): void;

    /**
     * Get global emitter
     */
    getGlobalEmitter(): EventEmitter;

    /**
     * Check if channel exists
     */
    hasChannel(channel: string): boolean;

    /**
     * Get all channels
     */
    getChannels(): string[];

    /**
     * Set global event filter
     */
    setGlobalFilter(filter: (event: string) => boolean): void;

    /**
     * Enable/disable events for channel
     */
    setChannelEnabled(channel: string, enabled: boolean): void;

    /**
     * Get channel statistics
     */
    getChannelStats(channel: string): {
        listenerCount: number;
        eventNames: string[];
        isEnabled: boolean;
    };

    /**
     * Debug channel
     */
    debugChannel(channel: string): void;
}

// Event type constants
export declare namespace Events {
    const UPDATE: string;
    const RENDER: string;
    const RESIZE: string;
    const ERROR: string;
    const LOADING: string;
    const LOADED: string;
    const PROGRESS: string;
    const COMPLETE: string;
    const START: string;
    const STOP: string;
    const PAUSE: string;
    const RESUME: string;
    const DISPOSE: string;
}

// Predefined event types for Ninth.js
export interface CoreEventMap extends EventMap {
    update: { deltaTime: number };
    render: { scene: any; camera: any; renderer: any };
    resize: { width: number; height: number };
    error: { error: Error };
    loading: { resource: string };
    loaded: { resource: string; data: any };
    progress: { loaded: number; total: number };
    complete: { result: any };
    start: {};
    stop: {};
    pause: {};
    resume: {};
    dispose: {};
}