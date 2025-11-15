# Core Event System and Utilities

This module provides a high-performance event system and comprehensive utility functions for JavaScript applications.

## Event System (`Events.js`)

### EventEmitter

A robust event emitter with advanced features:

```javascript
import { EventEmitter } from './src/core/Events.js';

const emitter = new EventEmitter();

// Add listener
const unsubscribe = emitter.on('user:login', (user) => {
    console.log('User logged in:', user.name);
});

// Add one-time listener
emitter.once('user:logout', (user) => {
    console.log('User logged out');
});

// Emit event
emitter.emit('user:login', { name: 'John', id: 123 });

// Remove listener
unsubscribe();
```

**Features:**
- Automatic memory cleanup for one-time listeners
- Maximum listener warnings
- Error handling with try-catch
- LIFO execution order (last registered fires first)
- Returns unsubscribe functions for easy cleanup

### DOMEventManager

DOM-specific event handling with bubbling and delegation:

```javascript
import { DOMEventManager } from './src/core/Events.js';

const manager = new DOMEventManager(document.body);

// Add event listener
manager.addEventListener('click', (event) => {
    console.log('Element clicked:', event.target);
});

// Event delegation for dynamic content
manager.delegate('.button', 'click', (event) => {
    console.log('Button clicked:', event.delegateTarget);
});

// Enable bubbling for custom events
manager.enableBubbling(customElement, 'data:updated');
```

**Features:**
- Event bubbling support
- Event delegation for better performance
- Capture and passive event options
- Custom event bubbling

### EventBus

High-performance event bus with metrics:

```javascript
import { EventBus } from './src/core/Events.js';

const bus = new EventBus();

// Enable performance metrics
bus.enableMetrics();

// Use like EventEmitter
bus.on('data:received', (data) => {
    processData(data);
});

// Get performance metrics
const metrics = bus.getMetrics();
console.log('Average execution time:', metrics.averageExecutionTime);
```

**Features:**
- Object pooling for better performance
- Performance metrics tracking
- All EventEmitter features

### EventPool

Object pooling for performance optimization:

```javascript
import { EventPool } from './src/core/Events.js';

const pool = new EventPool(100);

// Get event object from pool
const event = pool.acquire();
event.type = 'custom';
event.data = { /* ... */ };

// Use event

// Release back to pool
pool.release(event);
```

## Utility Functions (`Utils.js`)

### Type Checking

Comprehensive type checking utilities:

```javascript
import { 
    getType, 
    isArray, 
    isPlainObject, 
    isEmpty 
} from './src/core/Utils.js';

// Get precise type
console.log(getType(new Date())); // 'date'
console.log(getType(/regex/));    // 'regexp'
console.log(getType([1, 2, 3]));  // 'array'

// Type checking
isArray([1, 2, 3]);        // true
isPlainObject({ a: 1 });   // true
isEmpty('');               // true
isEmpty(null);             // true
isEmpty({});               // true
```

### Object Copying

Safe and efficient object copying:

```javascript
import { 
    shallowCopy, 
    deepCopy, 
    cloneWithDepth 
} from './src/core/Utils.js';

// Shallow copy
const shallow = shallowCopy(obj);

// Deep copy with circular reference support
const deep = deepCopy(obj);

// Copy with depth control
const shallowDeep = cloneWithDepth(obj, 2);

// Safe property access
const userName = getSafe(user, 'profile.name', 'Anonymous');

// Safe property setting
setSafe(config, 'database.host', 'localhost');
```

### Performance Monitoring

Built-in performance monitoring tools:

```javascript
import { 
    PerformanceTimer, 
    PerformanceProfiler, 
    MemoryMonitor 
} from './src/core/Utils.js';

// Simple timer
const timer = new PerformanceTimer();
timer.start();
// ... do work
const elapsed = timer.stop(); // milliseconds

// Function profiling
const profiler = new PerformanceProfiler();
profiler.startProfile('data-processing');
processLargeDataset();
const time = profiler.endProfile('data-processing');

// Get detailed statistics
const stats = profiler.getProfiles();
console.log('Average execution time:', stats['data-processing'].avgTime);

// Memory monitoring
const memoryMonitor = new MemoryMonitor();
memoryMonitor.recordMemory();
const memoryStats = memoryMonitor.getStats();
console.log('Memory usage:', memoryStats);
```

### General Utilities

Common utility functions:

```javascript
import { 
    debounce, 
    throttle, 
    memoize, 
    retry 
} from './src/core/Utils.js';

// Debounce - delay function execution
const debouncedSearch = debounce(searchAPI, 300);
input.addEventListener('input', debouncedSearch);

// Throttle - limit function execution rate
const throttledScroll = throttle(handleScroll, 100);
window.addEventListener('scroll', throttledScroll);

// Memoize - cache function results
const memoizedFibonacci = memoize(function fibonacci(n) {
    return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);
});

// Retry with exponential backoff
const result = await retry(async () => {
    return await fetchData();
}, 3, 100); // 3 retries, 100ms base delay
```

## Performance Optimizations

### Event System
- **Object Pooling**: Reuses event objects to reduce garbage collection
- **WeakMap for Once Listeners**: Automatic cleanup of one-time listeners
- **Set Data Structure**: O(1) lookup for listener management
- **Lazy Evaluation**: Listeners only processed when events are emitted

### Utilities
- **Circular Reference Handling**: Deep copy supports circular object references
- **Memory Monitoring**: Track memory usage patterns
- **Performance Profiling**: Detailed execution time statistics
- **Debouncing/Throttling**: Reduce function call frequency

### Best Practices

1. **Use delegation for dynamic content**:
   ```javascript
   manager.delegate('.dynamic-item', 'click', handler);
   ```

2. **Always cleanup listeners**:
   ```javascript
   const unsubscribe = emitter.on('event', handler);
   // Later
   unsubscribe(); // or emitter.off('event', handler);
   ```

3. **Use shallow copy when possible**:
   ```javascript
   const copy = shallowCopy(original); // Faster than deepCopy
   ```

4. **Monitor performance in production**:
   ```javascript
   bus.enableMetrics();
   // Check metrics periodically
   ```

5. **Use appropriate data structures**:
   ```javascript
   isArray(items) ? items.forEach(...) : /* handle non-array */
   ```

## API Reference

### EventEmitter Methods
- `on(event, listener, options)` - Add event listener
- `once(event, listener, options)` - Add one-time listener
- `off(event, listener)` - Remove event listener
- `emit(event, ...args)` - Emit event
- `eventNames()` - Get all event names
- `listenerCount(event)` - Get listener count
- `listeners(event)` - Get all listeners
- `removeAllListeners(event)` - Remove all listeners
- `setMaxListeners(n)` - Set max listener count

### Utility Functions
- Type checking: `getType()`, `isType()`, `isArray()`, etc.
- Object copying: `shallowCopy()`, `deepCopy()`, `cloneWithDepth()`
- Safe access: `getSafe()`, `setSafe()`
- Performance: `PerformanceTimer`, `PerformanceProfiler`, `MemoryMonitor`
- General: `debounce()`, `throttle()`, `memoize()`, `retry()`

## Import Examples

```javascript
// Import everything
import Core from './src/core/index.js';

// Import specific features
import { EventEmitter, PerformanceTimer } from './src/core/Events.js';
import { deepCopy, debounce } from './src/core/Utils.js';

// Import utilities
import { PerformanceProfiler } from './src/core/Utils.js';
```

This implementation provides a production-ready foundation for event handling and common utility operations with a focus on performance and developer experience.