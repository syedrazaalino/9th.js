/**
 * @module tween
 * @description Tween & Timeline animation system for 9th.js.
 *
 * Exports:
 *   - Tween     — core tween class
 *   - Timeline  — sequence multiple tweens (extends Tween)
 *   - Easing    — 40+ easing functions + factories + registry
 *   - Ticker    — global rAF-based ticker (Ticker.shared singleton)
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

import { Tween } from './Tween.js';
import { Timeline } from './Timeline.js';
import Easing, { Linear } from './Easing.js';

/* -------------------------------------------------------------- *
 * Ticker
 * -------------------------------------------------------------- */

/**
 * Auto-detect the best available rAF-like API.
 * Falls back to setInterval simulation in headless / non-browser envs.
 */
const _hasRAF = (typeof requestAnimationFrame === 'function');
const _hasCAF = (typeof cancelAnimationFrame === 'function');

function _now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * @class Ticker
 * @description Global animation ticker. Calls registered callbacks every
 * frame with (deltaTime, elapsedTime) — both in seconds.
 *
 * Usage:
 *   import { Ticker } from '9th.js';
 *   Ticker.shared.add((dt, elapsed) => {
 *     tween.update(performance.now());
 *   });
 *
 *   // Or create a dedicated ticker:
 *   const ticker = new Ticker();
 *   ticker.add(cb);
 *   ticker.start();
 */
export class Ticker {
  constructor() {
    /** @type {Array<(deltaTime:number, elapsedTime:number) => void>} */
    this._callbacks = [];
    /** Global time multiplier. */
    this.timeScale = 1;
    this._running = false;
    this._lastTime = 0;
    this._elapsedTime = 0; // accumulated elapsed (seconds)
    this._rafId = null;
    this._intervalId = null;
    this._boundTick = this._tick.bind(this);
    this._maxDelta = 0.1; // cap deltaTime to avoid huge jumps (10 frames)
  }

  /**
   * Singleton instance shared across the application.
   */
  static get shared() {
    if (!Ticker._shared) {
      Ticker._shared = new Ticker();
    }
    return Ticker._shared;
  }

  /**
   * Add a per-frame callback.
   * @param {(deltaTime:number, elapsedTime:number) => void} callback
   * @returns {Ticker} this
   */
  add(callback) {
    if (typeof callback !== 'function') return this;
    this._callbacks.push(callback);
    if (!this._running) this.start();
    return this;
  }

  /**
   * Remove a previously-added callback.
   * @param {Function} callback
   * @returns {Ticker} this
   */
  remove(callback) {
    const i = this._callbacks.indexOf(callback);
    if (i !== -1) this._callbacks.splice(i, 1);
    if (this._callbacks.length === 0 && this._running) {
      // Auto-stop when no callbacks remain (saves CPU)
      this.stop();
    }
    return this;
  }

  /**
   * Start the ticker. No-op if already running.
   * @returns {Ticker} this
   */
  start() {
    if (this._running) return this;
    this._running = true;
    this._lastTime = _now();
    this._scheduleNext();
    return this;
  }

  /**
   * Stop the ticker.
   * @returns {Ticker} this
   */
  stop() {
    this._running = false;
    this._cancelScheduled();
    return this;
  }

  /**
   * Clear all callbacks.
   * @returns {Ticker} this
   */
  clear() {
    this._callbacks.length = 0;
    if (this._running) this.stop();
    return this;
  }

  /**
   * Number of registered callbacks.
   */
  get count() {
    return this._callbacks.length;
  }

  /**
   * Whether the ticker is currently running.
   */
  get running() {
    return this._running;
  }

  /**
   * Total elapsed time in seconds since the ticker started (accumulated).
   */
  get elapsedTime() {
    return this._elapsedTime;
  }

  /* ----------------------------- internals ----------------------------- */

  _scheduleNext() {
    if (_hasRAF) {
      this._rafId = requestAnimationFrame(this._boundTick);
    } else {
      // ~60fps fallback
      this._intervalId = setInterval(this._boundTick, 16);
    }
  }

  _cancelScheduled() {
    if (this._rafId != null && _hasCAF) {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
    if (this._intervalId != null) {
      clearInterval(this._intervalId);
    }
    this._intervalId = null;
  }

  _tick() {
    if (!this._running) return;
    const now = _now();
    let deltaMs = now - this._lastTime;
    this._lastTime = now;

    // Apply timeScale and clamp
    deltaMs *= this.timeScale;
    if (deltaMs > this._maxDelta * 1000) deltaMs = this._maxDelta * 1000;
    if (deltaMs < 0) deltaMs = 0;

    const deltaSec = deltaMs / 1000;
    this._elapsedTime += deltaSec;

    // Iterate over a copy in case callbacks add/remove themselves
    const callbacks = this._callbacks.slice();
    for (let i = 0; i < callbacks.length; i++) {
      const cb = callbacks[i];
      try {
        cb(deltaSec, this._elapsedTime);
      } catch (err) {
        console.error('[Ticker] callback error:', err);
      }
    }

    if (this._running) this._scheduleNext();
  }
}

// Initialize the shared singleton lazily on first access.
Ticker._shared = null;

/* -------------------------------------------------------------- *
 * Exports
 * -------------------------------------------------------------- */

export { Tween, Timeline, Easing, Linear };

export default {
  Tween,
  Timeline,
  Easing,
  Ticker
};
