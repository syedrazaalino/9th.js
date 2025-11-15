/**
 * Loader Type Definitions
 * Base loader system for file loading
 */

export interface LoaderOptions {
    crossOrigin?: string;
    withCredentials?: boolean;
    path?: string;
    manager?: any;
    useWorker?: boolean;
    workerTaskLimit?: number;
}

export interface LoadingManager {
    onStart?: (url: string, loaded: number, total: number) => void;
    onLoad?: () => void;
    onProgress?: (url: string, loaded: number, total: number) => void;
    onError?: (url: string) => void;
}

export interface LoaderResult {
    success: boolean;
    data?: any;
    error?: Error;
    url?: string;
}

export interface LoaderCallbacks {
    onLoad?: (data: any) => void;
    onProgress?: (progress: number) => void;
    onError?: (error: Error) => void;
}

/**
 * Loader - Base class for all loaders
 */
export declare class Loader {
    public manager: any;
    public crossOrigin: string;
    public withCredentials: boolean;
    public path: string;
    public useWorker: boolean;
    public workerTaskLimit: number;

    constructor(manager?: any);

    /**
     * Load resource
     */
    load(url: string, onLoad?: (data: any) => void, onProgress?: (progress: number) => void, onError?: (error: Error) => void): void;

    /**
     * Parse loaded data
     */
    parse(data: any): any;

    /**
     * Set cross origin
     */
    setCrossOrigin(crossOrigin: string): Loader;

    /**
     * Set with credentials
     */
    setWithCredentials(withCredentials: boolean): Loader;

    /**
     * Set loading manager
     */
    setManager(manager: any): Loader;

    /**
     * Set resource path
     */
    setPath(path: string): Loader;

    /**
     * Set worker options
     */
    setWorkerOptions(useWorker?: boolean, taskLimit?: number): Loader;

    /**
     * Create URL from path
     */
    extractUrlBase(url: string): string;

    /**
     * Initialize loader
     */
    init(): void;

    /**
     * Create XHR loader
     */
    createXHR(): XMLHttpRequest;

    /**
     * Create loader URL
     */
    createLoaderURL(url: string, callback: (url: string) => void): void;
}

/**
 * LoadingManager - Global loading management
 */
export declare class LoadingManager {
    public onStart: (url: string, loaded: number, total: number) => void;
    public onLoad: () => void;
    public onProgress: (url: string, loaded: number, total: number) => void;
    public onError: (url: string) => void;
    public onStartMultiple: (event: any) => void;
    public onLoadMultiple: (event: any) => void;
    public onProgressMultiple: (event: any) => void;
    public onErrorMultiple: (event: any) => void;
    public defaultHandler: (event: any) => void;
    public URL: any;
    public crossOrigin: string;
    public withCredentials: boolean;
    public path: string;

    constructor(onLoad?: () => void, onProgress?: (event: any) => void, onError?: (url: string) => void);

    /**
     * Start loading
     */
    startLoading(): void;

    /**
     * Finish loading
     */
    finishLoading(): void;

    /**
     * Update loading progress
     */
    updateProgress(loaded: number, total: number): void;

    /**
     * Add loading item
     */
    addLoading(): number;

    /**
     * Remove loading item
     */
    removeLoading(): number;

    /**
     * Get loading count
     */
    getLoadingCount(): number;

    /**
     * Set cross origin
     */
    setCrossOrigin(crossOrigin: string): void;

    /**
     * Set URL modifier
     */
    setURLModifier(callback: (url: string) => string): void;

    /**
     * Resolve URL
     */
    resolveURL(url: string): string;
}

/**
 * FileLoader - Generic file loader
 */
export declare class FileLoader extends Loader {
    public mimeType: { [key: string]: string };

    constructor(manager?: any);

    /**
     * Load binary file
     */
    load(url: string, onLoad?: (data: ArrayBuffer) => void, onProgress?: (progress: number) => void, onError?: (error: Error) => void): void;

    /**
     * Load text file
     */
    loadText(url: string, onLoad?: (text: string) => void, onProgress?: (progress: number) => void, onError?: (error: Error) => void): void;

    /**
     * Load JSON file
     */
    loadJSON(url: string, onLoad?: (json: any) => void, onProgress?: (progress: number) => void, onError?: (error: Error) => void): void;

    /**
     * Set MIME type
     */
    setMimeType(mimeType: string): FileLoader;

    /**
     * Load response as
     */
    loadResponseType(url: string, responseType: string, onLoad?: (data: any) => void, onProgress?: (progress: number) => void, onError?: (error: Error) => void): void;
}