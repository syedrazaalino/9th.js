/**
 * Core Event System
 * A high-performance event handling system with bubbling, delegation, and optimization
 */

class EventEmitter {
    constructor() {
        this.events = new Map();
        this.maxListeners = 10;
        this.onceListeners = new WeakMap();
    }

    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function
     * @param {Object} options - Options { once, capture, passive, onceCapture }
     * @returns {Function} Unsubscribe function
     */
    on(event, listener, options = {}) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        
        const listeners = this.events.get(event);
        
        if (listeners.size >= this.maxListeners) {
            console.warn(`Max listeners exceeded for event "${event}". Consider increasing maxListeners.`);
        }

        const wrapper = this._createListenerWrapper(listener, options, event);
        listeners.add(wrapper);

        // Return unsubscribe function
        return () => this.off(event, wrapper);
    }

    /**
     * Add a one-time event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event handler function
     * @param {Object} options - Options
     * @returns {Function} Unsubscribe function
     */
    once(event, listener, options = {}) {
        const unsubscribe = this.on(event, listener, { ...options, once: true });
        return unsubscribe;
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} listener - Event handler to remove
     */
    off(event, listener) {
        if (!this.events.has(event)) return;

        const listeners = this.events.get(event);
        listeners.forEach(wrapper => {
            if (wrapper.originalListener === listener) {
                listeners.delete(wrapper);
            }
        });

        if (listeners.size === 0) {
            this.events.delete(event);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to listeners
     */
    emit(event, ...args) {
        if (!this.events.has(event)) return false;

        const listeners = Array.from(this.events.get(event));
        
        // Execute listeners in reverse order (LIFO)
        for (let i = listeners.length - 1; i >= 0; i--) {
            const listener = listeners[i];
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        }

        // Remove once listeners
        const currentListeners = this.events.get(event);
        if (currentListeners) {
            currentListeners.forEach(wrapper => {
                if (wrapper.options.once) {
                    currentListeners.delete(wrapper);
                }
            });
            
            if (currentListeners.size === 0) {
                this.events.delete(event);
            }
        }

        return true;
    }

    /**
     * Create a listener wrapper with options support
     * @private
     */
    _createListenerWrapper(listener, options, event) {
        const wrapper = function(...args) {
            if (options.capture && !args[0]?.eventPhase) {
                // Handle capture phase events
                const eventObj = args[0];
                if (eventObj && typeof eventObj.preventDefault === 'function') {
                    Object.defineProperty(eventObj, 'eventPhase', { value: 1 });
                }
            }
            
            const result = listener.apply(this, args);
            
            if (options.passive && args[0]?.preventDefault) {
                // Prevent default for passive events if needed
                if (options.passive !== true && result === false) {
                    args[0].preventDefault();
                }
            }
            
            return result;
        };

        wrapper.originalListener = listener;
        wrapper.options = options;
        return wrapper;
    }

    /**
     * Get all event names
     * @returns {Array<string>} Array of event names
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Get listener count for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.events.has(event) ? this.events.get(event).size : 0;
    }

    /**
     * Get all listeners for an event
     * @param {string} event - Event name
     * @returns {Array<Function>} Array of listener functions
     */
    listeners(event) {
        if (!this.events.has(event)) return [];
        return Array.from(this.events.get(event)).map(wrapper => wrapper.originalListener);
    }

    /**
     * Remove all listeners for an event or all events
     * @param {string} [event] - Optional event name
     */
    removeAllListeners(event) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    /**
     * Set maximum listener count
     * @param {number} n - Maximum number of listeners
     */
    setMaxListeners(n) {
        this.maxListeners = n;
    }
}

/**
 * DOM Event Manager with Bubbling and Delegation
 */
class DOMEventManager extends EventEmitter {
    constructor(target = null) {
        super();
        this.target = target || document;
        this.delegatedEvents = new Map();
        this.bubbleCapture = new Map();
    }

    /**
     * Add event listener with bubbling support
     * @param {string} type - Event type
     * @param {Function} listener - Event listener
     * @param {Object} options - Options { capture, passive, once }
     * @returns {Function} Unsubscribe function
     */
    addEventListener(type, listener, options = {}) {
        const wrapper = (event) => this._handleEvent(type, event, listener, options);
        
        this.target.addEventListener(type, wrapper, options);
        
        return () => this.removeEventListener(type, wrapper, options);
    }

    /**
     * Remove event listener
     * @param {string} type - Event type
     * @param {Function} listener - Event listener
     * @param {Object} options - Options
     */
    removeEventListener(type, listener, options = {}) {
        this.target.removeEventListener(type, listener, options);
    }

    /**
     * Add event delegation for dynamic content
     * @param {string} selector - CSS selector for delegated target
     * @param {string} type - Event type
     * @param {Function} listener - Event listener
     * @param {Object} options - Options
     * @returns {Function} Unsubscribe function
     */
    delegate(selector, type, listener, options = {}) {
        const delegationKey = `${selector}:${type}`;
        
        if (!this.delegatedEvents.has(delegationKey)) {
            const handler = (event) => this._handleDelegation(selector, type, event);
            this.target.addEventListener(type, handler, options);
            this.delegatedEvents.set(delegationKey, handler);
        }

        const listeners = this.delegatedEvents.get(`${selector}:${type}:listeners`) || new Set();
        listeners.add(listener);
        this.delegatedEvents.set(`${selector}:${type}:listeners`, listeners);

        return () => this.undelegate(selector, type, listener);
    }

    /**
     * Remove event delegation
     * @param {string} selector - CSS selector
     * @param {string} type - Event type
     * @param {Function} listener - Event listener
     */
    undelegate(selector, type, listener) {
        const delegationKey = `${selector}:${type}`;
        const listeners = this.delegatedEvents.get(`${delegationKey}:listeners`);
        
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                const handler = this.delegatedEvents.get(delegationKey);
                if (handler) {
                    this.target.removeEventListener(type, handler);
                    this.delegatedEvents.delete(delegationKey);
                    this.delegatedEvents.delete(`${delegationKey}:listeners`);
                }
            }
        }
    }

    /**
     * Handle delegated events
     * @private
     */
    _handleDelegation(selector, type, event) {
        const listeners = this.delegatedEvents.get(`${selector}:${type}:listeners`);
        if (!listeners) return;

        const target = event.target.closest(selector);
        if (!target) return;

        const customEvent = {
            ...event,
            delegateTarget: target,
            currentTarget: target
        };

        listeners.forEach(listener => {
            try {
                listener.call(target, customEvent);
            } catch (error) {
                console.error(`Error in delegated event listener:`, error);
            }
        });
    }

    /**
     * Handle event with bubbling
     * @private
     */
    _handleEvent(type, event, listener, options) {
        const customEvent = {
            ...event,
            type,
            currentTarget: event.currentTarget,
            target: event.target
        };

        try {
            // Capture phase
            if (options.capture && event.eventPhase === 1) {
                listener.call(event.currentTarget, customEvent);
            }
            
            // Target phase
            if (event.target === event.currentTarget) {
                if (!options.capture) {
                    listener.call(event.currentTarget, customEvent);
                }
            }
            
            // Bubble phase
            if (!options.capture && event.eventPhase === 3) {
                listener.call(event.currentTarget, customEvent);
            }
        } catch (error) {
            console.error(`Error in event listener:`, error);
        }
    }

    /**
     * Enable event bubbling for custom events
     * @param {EventTarget} target - Event target
     * @param {string} eventName - Event name
     */
    enableBubbling(target, eventName) {
        if (!this.bubbleCapture.has(eventName)) {
            this.bubbleCapture.set(eventName, new Set());
        }
        
        const bubbleHandlers = this.bubbleCapture.get(eventName);
        bubbleHandlers.add(target);
    }

    /**
     * Disable event bubbling for custom events
     * @param {EventTarget} target - Event target
     * @param {string} eventName - Event name
     */
    disableBubbling(target, eventName) {
        const bubbleHandlers = this.bubbleCapture.get(eventName);
        if (bubbleHandlers) {
            bubbleHandlers.delete(target);
            if (bubbleHandlers.size === 0) {
                this.bubbleCapture.delete(eventName);
            }
        }
    }
}

/**
 * Event Pool for Performance Optimization
 */
class EventPool {
    constructor(size = 100) {
        this.size = size;
        this.pool = [];
        this.inUse = new WeakMap();
        
        // Pre-populate the pool
        for (let i = 0; i < size; i++) {
            this.pool.push({});
        }
    }

    /**
     * Get an event object from pool
     * @returns {Object} Event object
     */
    acquire() {
        if (this.pool.length > 0) {
            const event = this.pool.pop();
            this.inUse.set(event, true);
            return event;
        }
        
        // Create new event if pool is empty
        const event = {};
        this.inUse.set(event, true);
        return event;
    }

    /**
     * Release an event object back to pool
     * @param {Object} event - Event object to release
     */
    release(event) {
        if (this.inUse.get(event)) {
            // Clear event properties
            Object.keys(event).forEach(key => {
                delete event[key];
            });
            
            this.inUse.delete(event);
            
            if (this.pool.length < this.size) {
                this.pool.push(event);
            }
        }
    }

    /**
     * Clear the entire pool
     */
    clear() {
        this.pool = [];
        this.inUse = new WeakMap();
    }
}

/**
 * Performance-optimized Event Bus
 */
class EventBus extends EventEmitter {
    constructor() {
        super();
        this.eventPool = new EventPool(50);
        this.metrics = {
            eventsEmitted: 0,
            listenersInvoked: 0,
            errors: 0
        };
        this.enableMetrics = false;
    }

    /**
     * Emit event with performance metrics
     * @param {string} event - Event name
     * @param {...any} args - Arguments
     * @returns {boolean} Success status
     */
    emit(event, ...args) {
        const startTime = this.enableMetrics ? performance.now() : 0;
        
        // Create pooled event object for better performance
        const eventObj = this.enableMetrics ? this.eventPool.acquire() : {};
        eventObj.type = event;
        eventObj.timestamp = Date.now();
        eventObj.args = args;
        
        const result = super.emit(event, eventObj, ...args);
        
        if (this.enableMetrics) {
            const endTime = performance.now();
            this.metrics.eventsEmitted++;
            this.metrics.executionTime = (this.metrics.executionTime || 0) + (endTime - startTime);
            this.eventPool.release(eventObj);
        }
        
        return result;
    }

    /**
     * Enable performance metrics
     */
    enableMetrics() {
        this.enableMetrics = true;
    }

    /**
     * Disable performance metrics
     */
    disableMetrics() {
        this.enableMetrics = false;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            averageExecutionTime: this.metrics.eventsEmitted > 0 
                ? this.metrics.executionTime / this.metrics.eventsEmitted 
                : 0
        };
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.metrics = {
            eventsEmitted: 0,
            listenersInvoked: 0,
            errors: 0,
            executionTime: 0
        };
    }
}

// Export all components
export {
    EventEmitter,
    DOMEventManager,
    EventPool,
    EventBus
};

// Default export for convenience
export default EventBus;
