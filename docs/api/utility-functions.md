# Utility Functions Reference

Ninth.js provides a comprehensive set of utility functions for type checking, object manipulation, performance monitoring, and general programming tasks. This document covers all utility functions and classes.

## Type Checking Utilities

### `getType(value)`

Get the precise type of a value, including support for built-in and custom objects.

**Parameters:**
- `value` (any): Value to check

**Returns:** string - Precise type string

**Example:**
```javascript
getType(null);                    // 'null'
getType(undefined);               // 'undefined'
getType(42);                      // 'number'
getType('hello');                 // 'string'
getType(true);                    // 'boolean'
getType([]);                      // 'array'
getType({});                      // 'object'
getType(new Date());              // 'date'
getType(/regex/);                 // 'regexp'
getType(new Set());               // 'set'
getType(new Map());               // 'map'
```

### `isType(value, type)`

Check if a value is of a specific type.

**Parameters:**
- `value` (any): Value to check
- `type` (string): Expected type

**Returns:** boolean - True if value is of the specified type

**Example:**
```javascript
isType(42, 'number');             // true
isType('hello', 'string');        // true
isType([], 'array');              // true
isType({}, 'object');             // true
isType(null, 'null');             // true
```

### `isNullOrUndefined(value)`

Check if value is null or undefined.

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is null or undefined

**Example:**
```javascript
isNullOrUndefined(null);          // true
isNullOrUndefined(undefined);     // true
isNullOrUndefined(0);             // false
isNullOrUndefined('');            // false
isNullOrUndefined(false);         // false
```

### `isEmpty(value)`

Check if value is an empty value (null, undefined, empty string, array, or object).

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is empty

**Example:**
```javascript
isEmpty(null);                    // true
isEmpty(undefined);               // true
isEmpty('');                      // true
isEmpty([]);                      // true
isEmpty({});                      // true
isEmpty(new Set());               // true
isEmpty('hello');                 // false
isEmpty([1, 2]);                  // false
```

### `isPlainObject(value)`

Check if value is a plain object (not instance of a class).

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is a plain object

**Example:**
```javascript
isPlainObject({});                // true
isPlainObject({a: 1});            // true
class MyClass {}
isPlainObject(new MyClass());     // false
isPlainObject([]);                // false
isPlainObject(new Date());        // false
```

### `isFunction(value)`

Check if value is a function.

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is a function

**Example:**
```javascript
isFunction(() => {});             // true
isFunction(function() {});        // true
isFunction(async function() {});  // true
isFunction(42);                   // false
isFunction('hello');              // false
```

### `isArray(value)`

Check if value is an array.

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is an array

**Example:**
```javascript
isArray([]);                      // true
isArray([1, 2, 3]);               // true
isArray('hello');                 // false
isArray({length: 2});             // false
```

### `isNumber(value)`

Check if value is a number (not NaN or Infinity).

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is a valid number

**Example:**
```javascript
isNumber(42);                     // true
isNumber(3.14);                   // true
isNumber(-5);                     // true
isNumber(NaN);                    // false
isNumber(Infinity);               // false
isNumber('42');                   // false
```

### `isString(value)`

Check if value is a string.

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is a string

**Example:**
```javascript
isString('hello');                // true
isString("world");                // true
isString('');                     // true
isString(42);                     // false
isString([]);                     // false
```

### `isBoolean(value)`

Check if value is a boolean.

**Parameters:**
- `value` (any): Value to check

**Returns:** boolean - True if value is a boolean

**Example:**
```javascript
isBoolean(true);                  // true
isBoolean(false);                 // true
isBoolean(1);                     // false
isBoolean('true');                // false
```

## Object Copying Utilities

### `shallowCopy(obj)`

Create a shallow copy of an object or array.

**Parameters:**
- `obj` (Object|Array): Object or array to copy

**Returns:** Object|Array - Shallow copy

**Example:**
```javascript
const original = { a: 1, b: { c: 2 } };
const copy = shallowCopy(original);
copy.a = 2;
console.log(original.a);          // 1 (unchanged)
console.log(copy.a);              // 2

// Nested objects are still references
copy.b.c = 3;
console.log(original.b.c);        // 3 (changed!)
```

### `deepCopy(obj, visited)`

Create a deep copy with circular reference support.

**Parameters:**
- `obj` (any): Object to copy
- `visited` (WeakMap, optional): WeakMap to track visited objects

**Returns:** any - Deep copy

**Example:**
```javascript
const original = {
    a: 1,
    b: { c: 2, d: [3, 4] },
    e: new Date('2023-01-01')
};

const copy = deepCopy(original);
copy.b.c = 5;
console.log(original.b.c);        // 2 (unchanged)
console.log(copy.b.c);            // 5

// Handles circular references
const obj1 = { name: 'obj1' };
obj1.self = obj1;
const copy1 = deepCopy(obj1);
console.log(copy1.self === copy1); // true (circular reference preserved)
```

### `cloneWithDepth(obj, depth, visited)`

Clone with custom depth control for performance optimization.

**Parameters:**
- `obj` (any): Object to copy
- `depth` (number, optional): Maximum depth to copy (default: Infinity)
- `visited` (WeakMap, optional): WeakMap to track visited objects

**Returns:** any - Copy with depth control

**Example:**
```javascript
const data = {
    level1: {
        level2: {
            level3: {
                value: 'deep'
            }
        }
    }
};

// Copy only first 2 levels
const shallowCopy = cloneWithDepth(data, 2);
console.log(shallowCopy.level1.level2 === data.level1.level2); // true (same reference)
```

### `getSafe(obj, path, defaultValue)`

Get a nested property safely with fallback.

**Parameters:**
- `obj` (Object): Object to get property from
- `path` (string): Property path (e.g., 'user.profile.name')
- `defaultValue` (any, optional): Default value if property not found

**Returns:** any - Property value or default

**Example:**
```javascript
const user = {
    profile: {
        name: 'John',
        settings: {
            theme: 'dark'
        }
    }
};

getSafe(user, 'profile.name', 'Unknown');        // 'John'
getSafe(user, 'profile.settings.theme', 'light'); // 'dark'
getSafe(user, 'profile.email', 'no-email');      // 'no-email' (doesn't exist)
getSafe(null, 'profile.name', 'fallback');       // 'fallback' (null object)
```

### `setSafe(obj, path, value)`

Set a nested property safely, creating intermediate objects as needed.

**Parameters:**
- `obj` (Object): Object to set property on
- `path` (string): Property path
- `value` (any): Value to set

**Returns:** Object - Updated object

**Example:**
```javascript
const obj = {};
setSafe(obj, 'user.profile.name', 'John');
console.log(obj); // { user: { profile: { name: 'John' } } }

setSafe(obj, 'settings.theme', 'dark');
console.log(obj.settings.theme); // 'dark'
```

## Performance Monitoring Utilities

### PerformanceTimer Class

Simple performance timer for measuring execution time.

**Constructor:**
```javascript
const timer = new PerformanceTimer();
```

**Methods:**

#### `start()`

Start the timer.

**Returns:** PerformanceTimer - This timer instance

**Example:**
```javascript
const timer = new PerformanceTimer();
timer.start();
// Code to measure...
const duration = timer.stop();
console.log(`Execution time: ${duration}ms`);
```

#### `stop()`

Stop the timer and return elapsed time.

**Returns:** number - Elapsed time in milliseconds

**Example:**
```javascript
const timer = new PerformanceTimer();
timer.start();
someFunction();
const elapsed = timer.stop();
console.log(`Function took ${elapsed}ms`);
```

#### `elapsed()`

Get current elapsed time without stopping.

**Returns:** number - Current elapsed time in milliseconds

**Example:**
```javascript
timer.start();
setTimeout(() => {
    console.log(`Elapsed so far: ${timer.elapsed()}ms`);
}, 100);
```

#### `reset()`

Reset the timer.

**Returns:** PerformanceTimer - This timer instance

**Example:**
```javascript
timer.reset().start(); // Reset and start in one call
```

### PerformanceProfiler Class

Advanced profiler for tracking function call performance.

**Constructor:**
```javascript
const profiler = new PerformanceProfiler();
```

**Methods:**

#### `startProfile(name)`

Start profiling a function.

**Parameters:**
- `name` (string): Profile name

**Example:**
```javascript
profiler.startProfile('render');
```

#### `endProfile(name)`

End profiling and record results.

**Parameters:**
- `name` (string): Profile name

**Returns:** number - Execution time in milliseconds

**Example:**
```javascript
// Auto-profiled version
const result = profiler.profileFunction('render', renderScene, sceneData);
```

#### `profileFunction(name, fn, ...args)`

Profile a function execution.

**Parameters:**
- `name` (string): Profile name
- `fn` (Function): Function to profile
- `...args` (any): Arguments to pass to function

**Returns:** any - Function result

**Example:**
```javascript
const profiler = new PerformanceProfiler();

// Profile a function
const result = profiler.profileFunction('calculatePhysics', calculatePhysics, worldData, deltaTime);

// Get profile results
console.log(profiler.getProfile('calculatePhysics'));
// {
//   calls: 1,
//   totalTime: 15.2,
//   minTime: 15.2,
//   maxTime: 15.2,
//   avgTime: 15.2
// }
```

#### `getProfiles()`

Get all profiles.

**Returns:** Object - All profiles

**Example:**
```javascript
console.log(profiler.getProfiles());
```

#### `getProfile(name)`

Get a specific profile.

**Parameters:**
- `name` (string): Profile name

**Returns:** Object|undefined - Profile data

**Example:**
```javascript
const physicsProfile = profiler.getProfile('calculatePhysics');
```

#### `clearProfiles()`

Clear all profiles.

**Example:**
```javascript
profiler.clearProfiles();
```

### MemoryMonitor Class

Memory usage monitoring for performance optimization.

**Constructor:**
```javascript
const memoryMonitor = new MemoryMonitor();
```

**Methods:**

#### `getCurrentMemory()`

Get current memory usage (if available).

**Returns:** Object|null - Memory usage information

**Example:**
```javascript
const memory = memoryMonitor.getCurrentMemory();
if (memory) {
    console.log(`Used: ${(memory.used / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total: ${(memory.total / 1024 / 1024).toFixed(2)}MB`);
}
```

#### `recordMemory()`

Record current memory usage for statistics.

**Returns:** Object - Memory usage information

**Example:**
```javascript
function trackMemory() {
    memoryMonitor.recordMemory();
}

// Call periodically
setInterval(trackMemory, 1000);
```

#### `getStats()`

Get memory usage statistics.

**Returns:** Object|null - Memory statistics

**Example:**
```javascript
const stats = memoryMonitor.getStats();
if (stats) {
    console.log(`Memory usage: ${stats.used.current / 1024 / 1024}MB`);
    console.log(`Peak usage: ${stats.used.max / 1024 / 1024}MB`);
    console.log(`Average usage: ${stats.used.avg / 1024 / 1024}MB`);
}
```

#### `clear()`

Clear all measurements.

**Example:**
```javascript
memoryMonitor.clear();
```

## General Utility Functions

### `debounce(func, delay)`

Create a debounced function that delays execution until after a wait period.

**Parameters:**
- `func` (Function): Function to debounce
- `delay` (number): Delay in milliseconds

**Returns:** Function - Debounced function

**Example:**
```javascript
const debouncedResize = debounce(() => {
    console.log('Window resized');
}, 250);

window.addEventListener('resize', debouncedResize);
// Will only execute once, 250ms after the last resize event
```

### `throttle(func, limit)`

Create a throttled function that executes at most once per limit period.

**Parameters:**
- `func` (Function): Function to throttle
- `limit` (number): Limit in milliseconds

**Returns:** Function - Throttled function

**Example:**
```javascript
const throttledScroll = throttle(() => {
    console.log('Scroll event');
}, 100);

window.addEventListener('scroll', throttledScroll);
// Will execute at most once every 100ms
```

### `memoize(func, keyGenerator)`

Create a memoized function that caches results.

**Parameters:**
- `func` (Function): Function to memoize
- `keyGenerator` (Function, optional): Custom key generator

**Returns:** Function - Memoized function

**Example:**
```javascript
// Simple memoization
const expensiveCalculation = memoize((n) => {
    console.log('Calculating...', n);
    return n * n;
});

console.log(expensiveCalculation(5)); // Calculates and returns 25
console.log(expensiveCalculation(5)); // Returns cached result (no calculation)
console.log(expensiveCalculation(6)); // Calculates and returns 36

// Custom key generator
const fibonacci = memoize((n) => {
    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}, (n) => `fib-${n}`);
```

### `retry(func, maxRetries, baseDelay)`

Retry a function with exponential backoff.

**Parameters:**
- `func` (Function): Function to retry
- `maxRetries` (number, optional): Maximum number of retries (default: 3)
- `baseDelay` (number, optional): Base delay in milliseconds (default: 100)

**Returns:** Promise - Promise that resolves with function result

**Example:**
```javascript
const fetchWithRetry = () => retry(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
}, 3, 200);

fetchWithRetry()
    .then(data => console.log('Data:', data))
    .catch(error => console.error('Failed after retries:', error));
```

### `once(func)`

Create a function that can only be called once.

**Parameters:**
- `func` (Function): Function to wrap

**Returns:** Function - Once-wrapped function

**Example:**
```javascript
const init = once(() => {
    console.log('Initialization done');
});

init(); // Logs: 'Initialization done'
init(); // Does nothing
init(); // Does nothing
```

### `compose(...funcs)`

Compose functions from right to left.

**Parameters:**
- `...funcs` (Function): Functions to compose

**Returns:** Function - Composed function

**Example:**
```javascript
const add = (x) => x + 1;
const multiply = (x) => x * 2;
const toString = (x) => String(x);

const composed = compose(toString, multiply, add);

console.log(composed(5)); // 12 ( ((5 + 1) * 2).toString() )
```

### `pipe(...funcs)`

Pipe functions from left to right.

**Parameters:**
- `...funcs` (Function): Functions to pipe

**Returns:** Function - Piped function

**Example:**
```javascript
const add = (x) => x + 1;
const multiply = (x) => x * 2;
const toString = (x) => String(x);

const piped = pipe(add, multiply, toString);

console.log(piped(5)); // 12 ( ((5 + 1) * 2).toString() )
```

## Usage Patterns

### Type Safety Validation

```javascript
function createUser(data) {
    // Validate input
    if (!isPlainObject(data)) {
        throw new Error('User data must be an object');
    }
    
    if (!isString(data.name) || isEmpty(data.name)) {
        throw new Error('User name is required and must be a string');
    }
    
    if (!isNumber(data.age) || data.age < 0 || data.age > 150) {
        throw new Error('User age must be a valid number between 0 and 150');
    }
    
    return {
        name: data.name,
        age: data.age,
        createdAt: new Date()
    };
}
```

### Deep Object Updates

```javascript
function updateNestedObject(original, updates) {
    const copy = deepCopy(original);
    
    Object.keys(updates).forEach(key => {
        if (isPlainObject(updates[key]) && isPlainObject(copy[key])) {
            copy[key] = updateNestedObject(copy[key], updates[key]);
        } else {
            copy[key] = updates[key];
        }
    });
    
    return copy;
}
```

### Performance Profiling

```javascript
class PerformanceTracker {
    constructor() {
        this.profiler = new PerformanceProfiler();
        this.memoryMonitor = new MemoryMonitor();
    }
    
    profileOperation(name, operation) {
        // Start memory tracking
        const memoryBefore = this.memoryMonitor.getCurrentMemory();
        
        // Profile operation
        const result = this.profiler.profileFunction(name, operation);
        
        // Record memory after
        const memoryAfter = this.memoryMonitor.recordMemory();
        
        return {
            result,
            profile: this.profiler.getProfile(name),
            memory: {
                before: memoryBefore,
                after: memoryAfter
            }
        };
    }
    
    getReport() {
        return {
            profiles: this.profiler.getProfiles(),
            memoryStats: this.memoryMonitor.getStats()
        };
    }
}
```

### Safe Configuration Loading

```javascript
class ConfigLoader {
    static load(configPath) {
        return retry(async () => {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const config = await response.json();
            
            // Validate config structure
            if (!isPlainObject(config)) {
                throw new Error('Config must be an object');
            }
            
            return config;
        }, 3, 500);
    }
    
    static validateRequired(config, requiredKeys) {
        const missing = requiredKeys.filter(key => !getSafe(config, key));
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }
        return true;
    }
}
```

### Efficient Event Handling

```javascript
class OptimizedEventHandler {
    constructor() {
        this.debouncedHandlers = new Map();
        this.throttledHandlers = new Map();
    }
    
    debounce(key, func, delay) {
        if (this.debouncedHandlers.has(key)) {
            return this.debouncedHandlers.get(key);
        }
        
        const debounced = debounce(func, delay);
        this.debouncedHandlers.set(key, debounced);
        return debounced;
    }
    
    throttle(key, func, limit) {
        if (this.throttledHandlers.has(key)) {
            return this.throttledHandlers.get(key);
        }
        
        const throttled = throttle(func, limit);
        this.throttledHandlers.set(key, throttled);
        return throttled;
    }
    
    memoizeResult(key, func) {
        const memoized = memoize(func);
        return memoized;
    }
}
```

### Memory-Efficient Data Processing

```javascript
function processLargeDataset(data, batchSize = 1000) {
    const timer = new PerformanceTimer();
    timer.start();
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // Process batch
        processBatch(batch);
        
        // Allow garbage collection between batches
        if (i % (batchSize * 10) === 0) {
            global.gc && global.gc();
        }
    }
    
    const duration = timer.stop();
    console.log(`Processed ${data.length} items in ${duration}ms`);
}

function processBatch(batch) {
    // Process items in batch
    batch.forEach(item => {
        // Heavy processing
        transformItem(item);
    });
}
```

The utility functions in Ninth.js provide a comprehensive toolkit for building robust, performant applications with excellent developer experience.