/**
 * @module game/GameLoop
 * @description Fixed-timestep game loop with accumulator (for stable physics).
 *
 * The canonical fixed-timestep pattern, as described by Glenn Fiedler in
 * "Fix Your Timestep!":
 *
 *   1. Each animation frame, measure the wall-clock delta since the last
 *      frame (clamped to `maxFrameDelta` to prevent the "spiral of death"
 *      when the simulation can't keep up with real time).
 *
 *   2. Add the delta to an accumulator.
 *
 *   3. While the accumulator is >= `fixedTimestep` (default 1/60 s),
 *      call `fixedUpdate(fixedTimestep)` and subtract fixedTimestep from
 *      the accumulator. This is the "physics step" — always called with
 *      a constant dt, so simulations are deterministic regardless of
 *      display refresh rate (60 Hz, 120 Hz, 144 Hz, etc.).
 *
 *   4. Call `update(deltaTime)` once per frame for non-physics logic
 *      (animations, input, AI) using the actual frame delta.
 *
 *   5. Compute the interpolation alpha = accumulator / fixedTimestep
 *      (0..1) and call `render(alpha)`. This lets the renderer interpolate
 *      between the previous and current physics state for smooth motion.
 *
 * Headless support: if `requestAnimationFrame` is unavailable (Node.js
 * without a DOM shim), the loop falls back to `setTimeout` at ~60 Hz.
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

const _hasRAF = typeof requestAnimationFrame === 'function';
const _hasCAF = typeof cancelAnimationFrame === 'function';

function _now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export class GameLoop {
  /**
   * @param {Object} [options]
   * @param {Function} [options.fixedUpdate] — called at fixed 60 Hz with (dt in seconds)
   * @param {Function} [options.update]      — called every frame with (dt in seconds)
   * @param {Function} [options.render]      — called every frame with (alpha 0..1) for state interpolation
   * @param {number}   [options.fixedTimestep=1/60] — fixed step in SECONDS (or pass Hz > 1 to setFixedTimestep)
   * @param {number}   [options.maxFrameDelta=0.25] — clamp per-frame delta to this many seconds
   */
  constructor(options = {}) {
    const {
      fixedUpdate = null,
      update = null,
      render = null,
      fixedTimestep = 1 / 60,
      maxFrameDelta = 0.25
    } = options;

    this._fixedUpdate = (typeof fixedUpdate === 'function') ? fixedUpdate : null;
    this._update = (typeof update === 'function') ? update : null;
    this._render = (typeof render === 'function') ? render : null;
    this._maxFrameDelta = Math.max(0.001, maxFrameDelta);

    // Accept either Hz (>1) or seconds (<=1)
    this._fixedTimestep = this._normalizeTimestep(fixedTimestep);

    /** Global time-scale multiplier (1.0 = real time, 0.5 = slow-mo, 2.0 = fast-forward). */
    this.timeScale = 1.0;

    this._accumulator = 0;
    this._running = false;
    this._paused = false;
    this._lastTime = 0;
    this._rafId = null;
    this._timeoutId = null;
    this._boundTick = this._tick.bind(this);

    /** @type {Array<(dt:number, alpha:number) => void>} */
    this._frameCallbacks = [];

    this._fpsAccumTime = 0;
    this._fpsAccumFrames = 0;

    /** Live stats (read-only — updated every frame). */
    this.stats = {
      fps: 0,
      fixedSteps: 0,
      frameTime: 0,        // seconds (delta of last frame)
      lastFrame: 0         // ms timestamp of last tick
    };
  }

  /* ----------------------------- config ----------------------------- */

  /**
   * Set the fixed timestep.
   * @param {number} hz_or_seconds — if > 1, interpreted as Hz (e.g. 60 → 1/60 s);
   *     if <= 1, interpreted as seconds (e.g. 1/60 → 0.0166... s).
   * @returns {GameLoop} this
   */
  setFixedTimestep(hz_or_seconds) {
    this._fixedTimestep = this._normalizeTimestep(hz_or_seconds);
    // Reset the accumulator so we don't suddenly process a huge backlog
    this._accumulator = 0;
    return this;
  }

  _normalizeTimestep(v) {
    if (typeof v !== 'number' || v <= 0) return 1 / 60;
    return (v > 1) ? 1 / v : v;
  }

  /** Fixed timestep in seconds. */
  get fixedTimestep() { return this._fixedTimestep; }
  /** Fixed step rate in Hz. */
  get fixedHz() { return 1 / this._fixedTimestep; }
  /** Max delta clamp in seconds. */
  get maxFrameDelta() { return this._maxFrameDelta; }
  set maxFrameDelta(v) { this._maxFrameDelta = Math.max(0.001, v); }

  /* ----------------------------- frame hooks ----------------------------- */

  /**
   * Register a custom per-frame callback. cb receives (dt, alpha) in
   * seconds and 0..1 respectively. Called AFTER update/render, so it can
   * be used for things like input polling or stats gathering.
   */
  onFrame(cb) {
    if (typeof cb === 'function') this._frameCallbacks.push(cb);
    return this;
  }

  /* ----------------------------- lifecycle ----------------------------- */

  /** Start the loop. No-op if already running. */
  start() {
    if (this._running) return this;
    this._running = true;
    this._paused = false;
    this._lastTime = _now();
    this._accumulator = 0;
    this._fpsAccumTime = 0;
    this._fpsAccumFrames = 0;
    this._scheduleNext();
    return this;
  }

  /** Stop the loop and cancel the pending rAF/timeout. */
  stop() {
    this._running = false;
    this._paused = false;
    this._cancelScheduled();
    return this;
  }

  /**
   * Pause the loop (stop running fixedUpdate/update/render, but keep the
   * rAF cycle alive so resume() can pick up immediately).
   */
  pause() {
    if (!this._running || this._paused) return this;
    this._paused = true;
    // Drop the accumulator so resume() doesn't try to "catch up" with
    // a huge backlog after a long pause.
    this._accumulator = 0;
    return this;
  }

  /** Resume from a paused state. */
  resume() {
    if (!this._paused) return this;
    this._paused = false;
    this._lastTime = _now();
    return this;
  }

  get running() { return this._running && !this._paused; }
  get paused() { return this._paused; }

  /** Remove all frame callbacks and stop the loop. */
  dispose() {
    this.stop();
    this._frameCallbacks.length = 0;
    this._fixedUpdate = null;
    this._update = null;
    this._render = null;
  }

  /* ----------------------------- internals ----------------------------- */

  _scheduleNext() {
    if (_hasRAF) {
      this._rafId = requestAnimationFrame(this._boundTick);
    } else {
      // ~60 fps fallback
      this._timeoutId = setTimeout(this._boundTick, 16);
    }
  }

  _cancelScheduled() {
    if (this._rafId != null && _hasCAF) {
      try { cancelAnimationFrame(this._rafId); } catch (_) { /* ignore */ }
    }
    this._rafId = null;
    if (this._timeoutId != null) {
      clearTimeout(this._timeoutId);
    }
    this._timeoutId = null;
  }

  _tick() {
    if (!this._running) return;
    const now = _now();

    // Frame delta in seconds
    let frameDelta = (now - this._lastTime) / 1000;
    this._lastTime = now;

    // Clamp to prevent spiral of death
    if (frameDelta > this._maxFrameDelta) frameDelta = this._maxFrameDelta;
    if (frameDelta < 0) frameDelta = 0;

    // Apply time scale (slow-mo / fast-forward)
    const scaledDelta = frameDelta * this.timeScale;

    this.stats.frameTime = frameDelta;
    this.stats.lastFrame = now;

    // FPS tracking (updated every ~0.5s for stability)
    this._fpsAccumTime += frameDelta;
    this._fpsAccumFrames++;
    if (this._fpsAccumTime >= 0.5) {
      this.stats.fps = this._fpsAccumFrames / this._fpsAccumTime;
      this._fpsAccumTime = 0;
      this._fpsAccumFrames = 0;
    }

    if (!this._paused) {
      // Fixed-timestep accumulator
      this._accumulator += scaledDelta;
      let steps = 0;
      // Hard cap on number of fixed steps per frame — prevents the
      // spiral of death if fixedUpdate is slower than real time.
      const maxSteps = Math.ceil(this._maxFrameDelta / this._fixedTimestep) + 1;
      this.stats.fixedSteps = 0;

      while (this._accumulator >= this._fixedTimestep && steps < maxSteps) {
        if (this._fixedUpdate) {
          try { this._fixedUpdate(this._fixedTimestep); } catch (e) { console.error('[GameLoop] fixedUpdate error:', e); }
        }
        this._accumulator -= this._fixedTimestep;
        steps++;
        this.stats.fixedSteps++;
      }
      // If we hit the step cap, drop the remaining accumulator — better
      // to slow the simulation than to spiral to a halt.
      if (steps >= maxSteps) this._accumulator = 0;

      // Per-frame update (uses actual frame delta, NOT the fixed step)
      if (this._update) {
        try { this._update(scaledDelta); } catch (e) { console.error('[GameLoop] update error:', e); }
      }

      // Interpolation alpha for the renderer
      const alpha = this._fixedTimestep > 0
        ? Math.min(1, this._accumulator / this._fixedTimestep)
        : 0;

      if (this._render) {
        try { this._render(alpha); } catch (e) { console.error('[GameLoop] render error:', e); }
      }

      // Custom frame hooks
      for (let i = 0; i < this._frameCallbacks.length; i++) {
        try { this._frameCallbacks[i](scaledDelta, alpha); } catch (e) { console.error('[GameLoop] frame callback error:', e); }
      }
    }

    if (this._running) this._scheduleNext();
  }
}

export default GameLoop;
