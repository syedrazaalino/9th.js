# Events Reference

The Ninth.js library provides a comprehensive, high-performance event system with bubbling, delegation, and optimization features. This document covers all event-related classes and functionality.

## EventEmitter Class

The base EventEmitter class provides core event handling functionality with support for multiple listener options and performance optimizations.

### Constructor

```javascript
const emitter = new EventEmitter();
```

### Methods

#### `on(event, listener, options)`

Add an event listener to the specified event.

**Parameters:**
- `event` (string): Event name
- `listener` (Function): Event handler function
- `options` (Object, optional): Listener options
  - `once` (boolean): Fire only once (default: false)
  - `capture` (boolean): Capture phase listener (default: false)
  - `passive` (boolean): Passive listener for performance (default: false)

**Returns:** Function - Unsubscribe function

**Example:**
```javascript
const unsubscribe = emitter.on('click', (data) => {
    console.log('Button clicked:', data);
});

// Unsubscribe later
unsubscribe();
```

#### `once(event, listener, options)`

Add a one-time event listener that automatically removes itself after firing.

**Parameters:**
- `event` (string): Event name
- `listener` (Function): Event handler function
- `options` (Object, optional): Listener options

**Returns:** Function - Unsubscribe function

**Example:**
```javascript
emitter.once('load', (data) => {
    console.log('Loaded:', data);
});
```

#### `off(event, listener)`

Remove an event listener.

**Parameters:**
- `event` (string): Event name
- `listener` (Function): Event handler to remove

**Example:**
```javascript
const handler = (data) => console.log(data);
emitter.on('update', handler);
emitter.off('update', handler);
```

#### `emit(event, ...args)`

Emit an event to all registered listeners.

**Parameters:**
- `event` (string): Event name
- `...args` (any): Arguments to pass to listeners

**Returns:** boolean - True if event had listeners

**Example:**
```javascript
emitter.emit('update', { x: 10, y: 20 });
emitter.emit('complete', 'Task finished');
```

#### `eventNames()`

Get all registered event names.

**Returns:** Array<string> - Array of event names

**Example:**
```javascript
emitter.on('start', () => {});
emitter.on('end', () => {});
console.log(emitter.eventNames()); // ['start', 'end']
```

#### `listenerCount(event)`

Get the number of listeners for an event.

**Parameters:**
- `event` (string): Event name

**Returns:** number - Number of listeners

**Example:**
```javascript
emitter.on('click', () => {});
emitter.on('click', () => {});
console.log(emitter.listenerCount('click')); // 2
```

#### `listeners(event)`

Get all listeners for an event.

**Parameters:**
- `event` (string): Event name

**Returns:** Array<Function> - Array of listener functions

**Example:**
```javascript
const handlers = [() => {}, () => {}];
handlers.forEach(handler => emitter.on('event', handler));
console.log(emitter.listeners('event')); // [handler1, handler2]
```

#### `removeAllListeners(event)`

Remove all listeners for a specific event or all events.

**Parameters:**
- `event` (string, optional): Specific event name. If omitted, removes all listeners.

**Example:**
```javascript
// Remove all listeners for 'click'
emitter.removeAllListeners('click');

// Remove all listeners for all events
emitter.removeAllListeners();
```

#### `setMaxListeners(n)`

Set the maximum number of listeners for events.

**Parameters:**
- `n` (number): Maximum number of listeners

**Example:**
```javascript
emitter.setMaxListeners(20); // Allow up to 20 listeners per event
```

## DOMEventManager Class

Extends EventEmitter to provide DOM event handling with bubbling and delegation support.

### Constructor

```javascript
const domManager = new DOMEventManager(targetElement);
```

**Parameters:**
- `target` (EventTarget, optional): DOM element to attach listeners to (default: document)

### Methods

#### `addEventListener(type, listener, options)`

Add a DOM event listener with enhanced bubbling support.

**Parameters:**
- `type` (string): Event type (e.g., 'click', 'mousemove')
- `listener` (Function): Event listener function
- `options` (Object, optional): Options { capture, passive, once }

**Returns:** Function - Unsubscribe function

**Example:**
```javascript
const unsubscribe = domManager.addEventListener('click', (event) => {
    console.log('Element clicked:', event.target);
});
```

#### `removeEventListener(type, listener, options)`

Remove a DOM event listener.

**Parameters:**
- `type` (string): Event type
- `listener` (Function): Event listener
- `options` (Object, optional): Options

**Example:**
```javascript
const handler = (event) => console.log(event);
domManager.addEventListener('click', handler);
domManager.removeEventListener('click', handler);
```

#### `delegate(selector, type, listener, options)`

Add event delegation for dynamic content.

**Parameters:**
- `selector` (string): CSS selector for delegated target
- `type` (string): Event type
- `listener` (Function): Event listener
- `options` (Object, optional): Options

**Returns:** Function - Unsubscribe function

**Example:**
```javascript
// Delegate click events for all buttons
const unsubscribe = domManager.delegate('button', 'click', (event) => {
    console.log('Button clicked:', event.target);
});
```

#### `undelegate(selector, type, listener)`

Remove event delegation.

**Parameters:**
- `selector` (string): CSS selector
- `type` (string): Event type
- `listener` (Function): Event listener

**Example:**
```javascript
const handler = (event) => console.log(event);
domManager.delegate('button', 'click', handler);
// Later...
domManager.undelegate('button', 'click', handler);
```

#### `enableBubbling(target, eventName)`

Enable event bubbling for custom events.

**Parameters:**
- `target` (EventTarget): Event target
- `eventName` (string): Event name

**Example:**
```javascript
domManager.enableBubbling(document.body, 'custom-event');
```

#### `disableBubbling(target, eventName)`

Disable event bubbling for custom events.

**Parameters:**
- `target` (EventTarget): Event target
- `eventName` (string): Event name

**Example:**
```javascript
domManager.disableBubbling(document.body, 'custom-event');
```

## EventPool Class

Performance-optimized event object pooling system for high-frequency events.

### Constructor

```javascript
const pool = new EventPool(size);
```

**Parameters:**
- `size` (number): Maximum number of event objects to pool (default: 100)

### Methods

#### `acquire()`

Get an event object from the pool.

**Returns:** Object - Reusable event object

**Example:**
```javascript
const eventObj = pool.acquire();
eventObj.type = 'update';
eventObj.data = { x: 10 };
// Use event...
pool.release(eventObj);
```

#### `release(event)`

Release an event object back to the pool.

**Parameters:**
- `event` (Object): Event object to release

**Example:**
```javascript
pool.release(eventObj);
```

#### `clear()`

Clear the entire pool.

**Example:**
```javascript
pool.clear();
```

## EventBus Class

High-performance event bus with metrics and optimization features.

### Constructor

```javascript
const eventBus = new EventBus();
```

### Methods

#### `emit(event, ...args)`

Emit event with performance metrics.

**Parameters:**
- `event` (string): Event name
- `...args` (any): Arguments to pass to listeners

**Returns:** boolean - Success status

**Example:**
```javascript
eventBus.emit('update', { frame: 1, delta: 16.67 });
```

#### `enableMetrics()`

Enable performance metrics collection.

**Example:**
```javascript
eventBus.enableMetrics();
```

#### `disableMetrics()`

Disable performance metrics collection.

**Example:**
```javascript
eventBus.disableMetrics();
```

#### `getMetrics()`

Get performance metrics.

**Returns:** Object - Performance metrics object

**Example:**
```javascript
console.log(eventBus.getMetrics());
// {
//   eventsEmitted: 100,
//   listenersInvoked: 250,
//   errors: 0,
//   executionTime: 15.5,
//   averageExecutionTime: 0.155
// }
```

#### `resetMetrics()`

Reset all performance metrics.

**Example:**
```javascript
eventBus.resetMetrics();
```

## Event System Patterns

### Pub/Sub Pattern

```javascript
// Create event bus for application-wide events
const appEvents = new EventBus();

// Subscribe to events
const unsubscribe = appEvents.on('user-login', (user) => {
    console.log('User logged in:', user.name);
});

// Publish events
appEvents.emit('user-login', { name: 'John', id: 123 });
```

### Event Delegation for Dynamic Content

```javascript
const domEvents = new DOMEventManager(document.body);

// Delegate click handling for dynamic buttons
domEvents.delegate('.dynamic-button', 'click', (event) => {
    console.log('Button clicked:', event.target.dataset.action);
});

// Dynamic content will automatically have click handlers
document.body.innerHTML = '<button class="dynamic-button" data-action="save">Save</button>';
```

### Event Bubbling

```javascript
const container = document.getElementById('container');
const domEvents = new DOMEventManager(container);

// Enable bubbling for custom events
domEvents.enableBubbling(container, 'data-loaded');

// Add listener to parent
domEvents.addEventListener('data-loaded', (event) => {
    console.log('Data loaded:', event.detail);
});

// Emit from child element
const child = document.createElement('div');
container.appendChild(child);
// The event will bubble up to the container
```

### One-Time Setup

```javascript
const emitter = new EventEmitter();

// Initialize scene once
emitter.once('scene-initialized', () => {
    console.log('Scene is ready for interaction');
});

// Trigger initialization
emitter.emit('scene-initialized');
```

### Error Handling in Event Listeners

```javascript
const emitter = new EventEmitter();

// Add listener with error handling
emitter.on('update', (data) => {
    try {
        processData(data);
    } catch (error) {
        console.error('Update failed:', error);
        emitter.emit('update-error', error);
    }
});

// Error handler
emitter.on('update-error', (error) => {
    console.error('Application error:', error);
});
```

## Performance Best Practices

### Use Event Pooling for High-Frequency Events

```javascript
const eventPool = new EventPool(200);
const eventBus = new EventBus();

function emitUpdate() {
    const event = eventPool.acquire();
    event.type = 'update';
    event.data = getUpdateData();
    
    eventBus.emit('update', event);
    
    eventPool.release(event);
}
```

### Debounce High-Frequency Events

```javascript
const emitter = new EventEmitter();

// Debounce window resize events
const debouncedResize = debounce(() => {
    emitter.emit('resize', {
        width: window.innerWidth,
        height: window.innerHeight
    });
}, 100);

window.addEventListener('resize', debouncedResize);
```

### Monitor Event Performance

```javascript
const eventBus = new EventBus();
eventBus.enableMetrics();

// Emit events
eventBus.emit('start-animation');
eventBus.emit('update-scene');
eventBus.emit('render-frame');

// Check performance
setTimeout(() => {
    console.log(eventBus.getMetrics());
}, 1000);
```

### Limit Listener Count

```javascript
const emitter = new EventEmitter();

// Set appropriate max listeners
emitter.setMaxListeners(10);

// Monitor listener count
emitter.on('click', handler1);
emitter.on('click', handler2);
console.log(emitter.listenerCount('click')); // 2
```

## Event Types in Ninth.js

### Scene Events

```javascript
scene.on('object-added', (object) => {
    console.log('Object added to scene:', object.name);
});

scene.on('object-removed', (object) => {
    console.log('Object removed from scene:', object.name);
});

scene.on('cameras-changed', () => {
    console.log('Active camera changed');
});
```

### Renderer Events

```javascript
renderer.on('frame-start', (timestamp) => {
    // Called at start of each frame
});

renderer.on('frame-end', (stats) => {
    // Called at end of each frame
    console.log('Frame stats:', stats);
});

renderer.on('context-lost', () => {
    console.log('WebGL context lost');
});
```

### Material Events

```javascript
material.on('property-changed', (property, oldValue, newValue) => {
    console.log(`Material.${property} changed from ${oldValue} to ${newValue}`);
});

material.on('compile-start', (renderer) => {
    console.log('Material compilation started');
});
```

## Integration with Third-Party Libraries

### React Integration

```javascript
import { useEffect, useRef } from 'react';
import { EventBus } from 'ninthjs';

function MyComponent() {
    const eventBusRef = useRef(new EventBus());
    
    useEffect(() => {
        const eventBus = eventBusRef.current;
        
        const unsubscribe = eventBus.on('data-updated', (data) => {
            // React state update
        });
        
        return unsubscribe;
    }, []);
}
```

### Vue.js Integration

```javascript
import { EventBus } from 'ninthjs';

export default {
    data() {
        return {
            eventBus: new EventBus()
        };
    },
    
    mounted() {
        this.eventBus.on('update', this.handleUpdate);
    },
    
    beforeUnmount() {
        this.eventBus.removeAllListeners();
    },
    
    methods: {
        handleUpdate(data) {
            // Handle update
        }
    }
};
```

## Memory Management

### Proper Cleanup

```javascript
class MyClass {
    constructor() {
        this.eventBus = new EventBus();
        this.unsubscribe = null;
    }
    
    setup() {
        this.unsubscribe = this.eventBus.on('update', this.handleUpdate);
    }
    
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.eventBus.removeAllListeners();
    }
    
    handleUpdate(data) {
        // Event handler
    }
}
```

### Avoiding Memory Leaks

```javascript
// Good: Store unsubscribe function
const unsubscribe = emitter.on('event', handler);

// Later when done
unsubscribe();

// Bad: No way to remove the listener
emitter.on('event', handler); // Memory leak!
```

The Ninth.js event system provides a robust foundation for building reactive applications with excellent performance characteristics and developer ergonomics.