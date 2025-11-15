/**
 * Core Utilities
 * Common utility functions for type checking, object manipulation, and performance monitoring
 */

// ============================================================================
// Type Checking Utilities
// ============================================================================

/**
 * Get the precise type of a value
 * @param {any} value - Value to check
 * @returns {string} Precise type string
 */
function getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    if (type !== 'object') return type;
    
    // Check for built-in types
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    if (value instanceof Error) return 'error';
    if (value instanceof Array) return 'array';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (value instanceof WeakMap) return 'weakmap';
    if (value instanceof WeakSet) return 'weakset';
    if (value instanceof Promise) return 'promise';
    
    // Check for custom classes
    const constructorName = value.constructor?.name;
    if (constructorName && constructorName !== 'Object') {
        return constructorName.toLowerCase();
    }
    
    return 'object';
}

/**
 * Check if a value is of a specific type
 * @param {any} value - Value to check
 * @param {string} type - Expected type
 * @returns {boolean} True if value is of the specified type
 */
function isType(value, type) {
    return getType(value) === type.toLowerCase();
}

/**
 * Check if value is null or undefined
 * @param {any} value - Value to check
 * @returns {boolean} True if value is null or undefined
 */
function isNullOrUndefined(value) {
    return value === null || value === undefined;
}

/**
 * Check if value is an empty value (null, undefined, empty string, empty array, empty object)
 * @param {any} value - Value to check
 * @returns {boolean} True if value is empty
 */
function isEmpty(value) {
    if (isNullOrUndefined(value)) return true;
    
    const type = getType(value);
    switch (type) {
        case 'string':
        case 'array':
            return value.length === 0;
        case 'object':
            return Object.keys(value).length === 0;
        case 'map':
        case 'set':
            return value.size === 0;
        default:
            return false;
    }
}

/**
 * Check if value is a plain object (not instance of a class)
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a plain object
 */
function isPlainObject(value) {
    if (!value || typeof value !== 'object') return false;
    
    const proto = Object.getPrototypeOf(value);
    if (proto === null) return true; // Object.create(null)
    
    return proto === Object.prototype || 
           proto.constructor === Object;
}

/**
 * Check if value is a function
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a function
 */
function isFunction(value) {
    return typeof value === 'function';
}

/**
 * Check if value is an array
 * @param {any} value - Value to check
 * @returns {boolean} True if value is an array
 */
function isArray(value) {
    return Array.isArray(value);
}

/**
 * Check if value is a number
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a number
 */
function isNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Check if value is a string
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a string
 */
function isString(value) {
    return typeof value === 'string';
}

/**
 * Check if value is a boolean
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a boolean
 */
function isBoolean(value) {
    return typeof value === 'boolean';
}

// ============================================================================
// Object Copying Utilities
// ============================================================================

/**
 * Shallow copy an object or array
 * @param {Object|Array} obj - Object or array to copy
 * @returns {Object|Array} Shallow copy
 */
function shallowCopy(obj) {
    if (isArray(obj)) {
        return [...obj];
    }
    
    if (isPlainObject(obj)) {
        return { ...obj };
    }
    
    // Handle other objects (Date, RegExp, etc.)
    const constructor = obj.constructor;
    return new constructor(obj);
}

/**
 * Deep copy an object with circular reference support
 * @param {any} obj - Object to copy
 * @param {WeakMap} visited - WeakMap to track visited objects
 * @returns {any} Deep copy
 */
function deepCopy(obj, visited = new WeakMap()) {
    // Handle primitive types and null/undefined
    if (!isPlainObject(obj) && !isArray(obj)) {
        return obj;
    }
    
    // Handle circular references
    if (visited.has(obj)) {
        return visited.get(obj);
    }
    
    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    // Handle RegExp
    if (obj instanceof RegExp) {
        return new RegExp(obj.source, obj.flags);
    }
    
    // Handle Set
    if (obj instanceof Set) {
        return new Set(Array.from(obj));
    }
    
    // Handle Map
    if (obj instanceof Map) {
        const copiedMap = new Map();
        visited.set(obj, copiedMap);
        obj.forEach((value, key) => {
            copiedMap.set(key, deepCopy(value, visited));
        });
        return copiedMap;
    }
    
    // Handle Array
    if (isArray(obj)) {
        const copiedArray = [];
        visited.set(obj, copiedArray);
        obj.forEach((item, index) => {
            copiedArray[index] = deepCopy(item, visited);
        });
        return copiedArray;
    }
    
    // Handle plain objects
    if (isPlainObject(obj)) {
        const copiedObj = {};
        visited.set(obj, copiedObj);
        
        Object.keys(obj).forEach(key => {
            copiedObj[key] = deepCopy(obj[key], visited);
        });
        
        return copiedObj;
    }
    
    // Fallback for other objects
    const constructor = obj.constructor;
    const copied = new constructor();
    visited.set(obj, copied);
    
    Object.assign(copied, obj);
    return copied;
}

/**
 * Clone with custom depth control
 * @param {any} obj - Object to copy
 * @param {number} depth - Maximum depth to copy
 * @param {WeakMap} visited - WeakMap to track visited objects
 * @returns {any} Copy with depth control
 */
function cloneWithDepth(obj, depth = Infinity, visited = new WeakMap()) {
    if (depth <= 0 || isNullOrUndefined(obj) || !isPlainObject(obj) && !isArray(obj)) {
        return obj;
    }
    
    if (visited.has(obj)) {
        return visited.get(obj);
    }
    
    if (isArray(obj)) {
        const copiedArray = [];
        visited.set(obj, copiedArray);
        obj.forEach((item, index) => {
            copiedArray[index] = cloneWithDepth(item, depth - 1, visited);
        });
        return copiedArray;
    }
    
    if (isPlainObject(obj)) {
        const copiedObj = {};
        visited.set(obj, copiedObj);
        
        Object.keys(obj).forEach(key => {
            copiedObj[key] = cloneWithDepth(obj[key], depth - 1, visited);
        });
        
        return copiedObj;
    }
    
    return obj;
}

/**
 * Safe property getter with fallback
 * @param {Object} obj - Object to get property from
 * @param {string} path - Property path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if property not found
 * @returns {any} Property value or default
 */
function getSafe(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined || !(key in current)) {
            return defaultValue;
        }
        current = current[key];
    }
    
    return current;
}

/**
 * Safe property setter
 * @param {Object} obj - Object to set property on
 * @param {string} path - Property path
 * @param {any} value - Value to set
 * @returns {Object} Updated object
 */
function setSafe(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return obj;
}

// ============================================================================
// Performance Monitoring Utilities
// ============================================================================

/**
 * Simple performance timer
 */
class PerformanceTimer {
    constructor() {
        this.startTime = 0;
        this.endTime = 0;
        this.running = false;
    }

    /**
     * Start the timer
     * @returns {PerformanceTimer} This timer instance
     */
    start() {
        this.startTime = performance.now();
        this.running = true;
        return this;
    }

    /**
     * Stop the timer
     * @returns {number} Elapsed time in milliseconds
     */
    stop() {
        if (!this.running) return 0;
        
        this.endTime = performance.now();
        this.running = false;
        return this.endTime - this.startTime;
    }

    /**
     * Get current elapsed time without stopping
     * @returns {number} Current elapsed time in milliseconds
     */
    elapsed() {
        if (!this.running) return this.endTime - this.startTime;
        return performance.now() - this.startTime;
    }

    /**
     * Reset the timer
     * @returns {PerformanceTimer} This timer instance
     */
    reset() {
        this.startTime = 0;
        this.endTime = 0;
        this.running = false;
        return this;
    }
}

/**
 * Performance profiler for function calls
 */
class PerformanceProfiler {
    constructor() {
        this.profiles = new Map();
        this.activeTimers = new Map();
    }

    /**
     * Start profiling a function
     * @param {string} name - Profile name
     */
    startProfile(name) {
        const timer = new PerformanceTimer();
        timer.start();
        this.activeTimers.set(name, timer);
    }

    /**
     * End profiling a function
     * @param {string} name - Profile name
     * @returns {number} Execution time in milliseconds
     */
    endProfile(name) {
        const timer = this.activeTimers.get(name);
        if (!timer) return 0;
        
        const duration = timer.stop();
        this.activeTimers.delete(name);
        
        if (!this.profiles.has(name)) {
            this.profiles.set(name, {
                calls: 0,
                totalTime: 0,
                minTime: Infinity,
                maxTime: 0,
                avgTime: 0
            });
        }
        
        const profile = this.profiles.get(name);
        profile.calls++;
        profile.totalTime += duration;
        profile.minTime = Math.min(profile.minTime, duration);
        profile.maxTime = Math.max(profile.maxTime, duration);
        profile.avgTime = profile.totalTime / profile.calls;
        
        return duration;
    }

    /**
     * Profile a function execution
     * @param {string} name - Profile name
     * @param {Function} fn - Function to profile
     * @param {...any} args - Arguments to pass to function
     * @returns {any} Function result
     */
    profileFunction(name, fn, ...args) {
        this.startProfile(name);
        try {
            const result = fn.apply(this, args);
            this.endProfile(name);
            return result;
        } catch (error) {
            this.endProfile(name);
            throw error;
        }
    }

    /**
     * Get all profiles
     * @returns {Object} All profiles
     */
    getProfiles() {
        const result = {};
        this.profiles.forEach((profile, name) => {
            result[name] = { ...profile };
        });
        return result;
    }

    /**
     * Get a specific profile
     * @param {string} name - Profile name
     * @returns {Object|undefined} Profile data
     */
    getProfile(name) {
        return this.profiles.get(name) ? { ...this.profiles.get(name) } : undefined;
    }

    /**
     * Clear all profiles
     */
    clearProfiles() {
        this.profiles.clear();
        this.activeTimers.clear();
    }
}

/**
 * Memory usage monitor
 */
class MemoryMonitor {
    constructor() {
        this.measurements = [];
        this.maxMeasurements = 100;
    }

    /**
     * Get current memory usage (if available)
     * @returns {Object|null} Memory usage information
     */
    getCurrentMemory() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
        }
        return null;
    }

    /**
     * Record memory usage
     * @returns {Object} Memory usage information
     */
    recordMemory() {
        const memory = this.getCurrentMemory();
        if (memory) {
            this.measurements.push(memory);
            if (this.measurements.length > this.maxMeasurements) {
                this.measurements.shift();
            }
        }
        return memory;
    }

    /**
     * Get memory statistics
     * @returns {Object} Memory statistics
     */
    getStats() {
        if (this.measurements.length === 0) {
            return null;
        }
        
        const usedValues = this.measurements.map(m => m.used);
        const totalValues = this.measurements.map(m => m.total);
        
        return {
            count: this.measurements.length,
            used: {
                current: usedValues[usedValues.length - 1],
                min: Math.min(...usedValues),
                max: Math.max(...usedValues),
                avg: usedValues.reduce((a, b) => a + b, 0) / usedValues.length
            },
            total: {
                current: totalValues[totalValues.length - 1],
                min: Math.min(...totalValues),
                max: Math.max(...totalValues),
                avg: totalValues.reduce((a, b) => a + b, 0) / totalValues.length
            }
        };
    }

    /**
     * Clear measurements
     */
    clear() {
        this.measurements = [];
    }
}

// ============================================================================
// General Utility Functions
// ============================================================================

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Memoize function results
 * @param {Function} func - Function to memoize
 * @param {Function} keyGenerator - Optional key generator
 * @returns {Function} Memoized function
 */
function memoize(func, keyGenerator) {
    const cache = new Map();
    
    return function(...args) {
        const key = keyGenerator ? keyGenerator.apply(this, args) : JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Retry a function with exponential backoff
 * @param {Function} func - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
async function retry(func, maxRetries = 3, baseDelay = 100) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await func();
        } catch (error) {
            lastError = error;
            if (i < maxRetries) {
                const delay = baseDelay * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

/**
 * Create a callback that only fires once
 * @param {Function} func - Function to wrap
 * @returns {Function} Once-wrapped function
 */
function once(func) {
    let called = false;
    let result;
    
    return function(...args) {
        if (!called) {
            called = true;
            result = func.apply(this, args);
        }
        return result;
    };
}

/**
 * Compose functions from right to left
 * @param {...Function} funcs - Functions to compose
 * @returns {Function} Composed function
 */
function compose(...funcs) {
    return function(value) {
        return funcs.reduceRight((acc, func) => func(acc), value);
    };
}

/**
 * Pipe functions from left to right
 * @param {...Function} funcs - Functions to pipe
 * @returns {Function} Piped function
 */
function pipe(...funcs) {
    return function(value) {
        return funcs.reduce((acc, func) => func(acc), value);
    };
}

// ============================================================================
// Export all utilities
// ============================================================================

export {
    // Type checking
    getType,
    isType,
    isNullOrUndefined,
    isEmpty,
    isPlainObject,
    isFunction,
    isArray,
    isNumber,
    isString,
    isBoolean,
    
    // Object copying
    shallowCopy,
    deepCopy,
    cloneWithDepth,
    getSafe,
    setSafe,
    
    // Performance monitoring
    PerformanceTimer,
    PerformanceProfiler,
    MemoryMonitor,
    
    // General utilities
    debounce,
    throttle,
    memoize,
    retry,
    once,
    compose,
    pipe
};

// Default export removed for UMD compatibility
// Use named exports instead
