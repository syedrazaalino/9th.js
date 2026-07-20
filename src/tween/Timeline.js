/**
 * @module Timeline
 * @description Sequence multiple tweens. A Timeline IS a Tween (extends it),
 * so it can itself be added to other timelines, paused, repeated, etc.
 *
 * Position syntax (GSAP-like):
 *   - number              — absolute time (ms)
 *   - '+=N' / '-=N'       — relative to end of previous tween
 *   - '<'                 — start of previous tween
 *   - '>'                 — end of previous tween
 *   - '<+N' / '<-N'       — relative to start of previous
 *   - '>+N' / '>-N'       — relative to end of previous
 *
 * Bare integers (e.g. `200`, `0`) are interpreted as milliseconds.
 * Bare decimals (e.g. `0.5`, `-0.5`) are interpreted as seconds.
 * Values with `ms` or `s` suffix are explicit.
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

import { Tween } from './Tween.js';
import Easing, { Linear } from './Easing.js';

/* -------------------------------------------------------------- *
 * Time parsing helpers
 * -------------------------------------------------------------- */

/**
 * Parse a time value into milliseconds.
 *  - number: integer -> ms, decimal -> seconds (GSAP convention)
 *  - "200"  -> 200 ms
 *  - "0.5"  -> 500 ms (decimal = seconds)
 *  - "200ms" -> 200 ms
 *  - "0.5s" -> 500 ms
 * @param {number|string} value
 * @returns {number}
 */
function parseTime(value) {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value;
    return value * 1000;
  }
  if (typeof value !== 'string') return 0;
  const trimmed = value.trim();
  if (trimmed.endsWith('ms')) return parseFloat(trimmed) || 0;
  if (trimmed.endsWith('s')) return (parseFloat(trimmed) || 0) * 1000;
  const num = parseFloat(trimmed);
  if (isNaN(num)) return 0;
  if (Number.isInteger(num)) return num;
  return num * 1000;
}

/**
 * Strip a leading +/- sign and return { sign, rest }.
 */
function splitSign(str) {
  if (str.startsWith('+')) return { sign: 1, rest: str.slice(1) };
  if (str.startsWith('-')) return { sign: -1, rest: str.slice(1) };
  return { sign: 1, rest: str };
}

/* -------------------------------------------------------------- *
 * Timeline
 * -------------------------------------------------------------- */
export class Timeline extends Tween {
  constructor(target = {}) {
    super(target);

    /** @type {{tween: Tween, startTime: number, _started: boolean}[]} */
    this._children = [];
    this._lastStart = 0;        // start time of most recently added child
    this._lastEnd = 0;          // end time of most recently added child
    this._timeScale = 1;
    this._totalDuration = 0;
    this._lastTime = 0;
    this._isTimeline = true;
  }

  /* ----------------------------- position parsing ----------------------------- */

  /**
   * Parse a position spec into an absolute time (ms) relative to the
   * timeline's start.
   * @param {number|string|undefined} position
   * @returns {number}
   */
  _parsePosition(position) {
    if (position === undefined || position === null) {
      return this._lastEnd; // default: end of previous
    }
    if (typeof position === 'number') {
      return parseTime(position);
    }
    const trimmed = String(position).trim();

    if (trimmed === '<') return this._lastStart;
    if (trimmed === '>') return this._lastEnd;

    // Relative to start of previous: '<+N', '<-N', '<+=N', '<-=N'
    if (trimmed.startsWith('<')) {
      const { sign, rest } = splitSign(trimmed.slice(1));
      // rest may start with '=' (e.g. '<+=200')
      const value = rest.startsWith('=') ? rest.slice(1) : rest;
      if (value === '' || value == null) return this._lastStart;
      return this._lastStart + sign * parseTime(value);
    }

    // Relative to end of previous: '>+N', '>-N', '>+=N', '>-=N'
    if (trimmed.startsWith('>')) {
      const { sign, rest } = splitSign(trimmed.slice(1));
      const value = rest.startsWith('=') ? rest.slice(1) : rest;
      if (value === '' || value == null) return this._lastEnd;
      return this._lastEnd + sign * parseTime(value);
    }

    // Relative to end of previous (no anchor): '+=N', '-=N', '+N', '-N'
    if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
      const { sign, rest } = splitSign(trimmed);
      const value = rest.startsWith('=') ? rest.slice(1) : rest;
      if (value === '' || value == null) return this._lastEnd;
      return this._lastEnd + sign * parseTime(value);
    }

    // Absolute time
    return parseTime(trimmed);
  }

  /* ----------------------------- add ----------------------------- */

  /**
   * Add a tween at the given position.
   * @param {Tween} tween
   * @param {number|string} [position] — defaults to '>' (end of previous)
   * @returns {Timeline} this (for chaining)
   */
  add(tween, position) {
    const startTime = Math.max(0, this._parsePosition(position));

    // Mark as a timeline child so it integrates with the global ticker only
    // when the timeline says so.
    tween._isTimelineChild = true;
    tween._timelineParent = this;

    const child = {
      tween,
      startTime,
      _started: false,
      _completed: false
    };
    this._children.push(child);

    // Track last start / last end
    this._lastStart = startTime;
    const childDuration = tween.totalDuration();
    this._lastEnd = startTime + (childDuration === Infinity ? tween._duration : childDuration);

    // Update total duration
    if (childDuration === Infinity) {
      this._totalDuration = Infinity;
    } else if (this._totalDuration !== Infinity) {
      this._totalDuration = Math.max(this._totalDuration, this._lastEnd);
    }

    return this;
  }

  /**
   * Shorthand: create a `to` tween on the target and add it.
   * @param {Object} target
   * @param {Object} props
   * @param {number} duration
   * @param {number|string} [position]
   * @returns {Timeline} this
   */
  to(target, props, duration, position) {
    const t = new Tween(target).to(props, duration);
    this.add(t, position);
    return this;
  }

  /**
   * Shorthand: create a `from` tween on the target and add it.
   */
  from(target, props, duration, position) {
    const t = new Tween(target).from(props, duration);
    this.add(t, position);
    return this;
  }

  /**
   * Shorthand: create a `fromTo` tween on the target and add it.
   */
  fromTo(target, fromProps, toProps, duration, position) {
    const t = new Tween(target).fromTo(fromProps, toProps, duration);
    this.add(t, position);
    return this;
  }

  /**
   * Schedule a callback at a specific time.
   * @param {Function} callback
   * @param {number|string} [position]
   * @returns {Timeline} this
   */
  call(callback, position) {
    const t = new Tween({}).to({}, 0).onStart(callback);
    this.add(t, position);
    return this;
  }

  /* ----------------------------- playback control ----------------------------- */

  /**
   * Set the global time scale for this timeline (1 = normal, 0.5 = half speed).
   * @param {number} factor
   * @returns {Timeline} this
   */
  timeScale(factor) {
    this._timeScale = factor;
    return this;
  }

  /**
   * Seek to a specific time. Does not fire callbacks (use update() for that).
   * @param {number} time — milliseconds
   * @returns {Timeline} this
   */
  seek(time) {
    // Force-update the timeline to the given time, ignoring normal flow.
    if (!this._isPlaying) {
      this._isPlaying = true;
    }
    this._updateInternal(time, true);
    return this;
  }

  /**
   * Total duration of the timeline in ms.
   * @returns {number}
   */
  duration() {
    return this._totalDuration;
  }

  /**
   * Current progress 0..1 (or beyond if repeating).
   * @returns {number}
   */
  progress() {
    if (this._totalDuration === 0 || this._totalDuration === Infinity) return 0;
    if (this._startTime === undefined || this._startTime === null) return 0;
    const elapsed = this._lastTime - this._startTime;
    return Math.max(0, Math.min(1, elapsed / this._totalDuration));
  }

  /* ----------------------------- pause / resume ----------------------------- */

  pause() {
    super.pause();
    // Pause all playing children
    for (const child of this._children) {
      if (child.tween._isPlaying) child.tween.pause();
    }
    return this;
  }

  resume() {
    super.resume();
    for (const child of this._children) {
      if (child.tween._isPaused) child.tween.resume();
    }
    return this;
  }

  stop() {
    super.stop();
    for (const child of this._children) {
      if (child.tween._isPlaying) child.tween.stop();
    }
    return this;
  }

  /* ----------------------------- start / update ----------------------------- */

  start(time) {
    // Reset children state
    for (const child of this._children) {
      child._started = false;
      child._completed = false;
      child.tween._isPlaying = false;
      child.tween._isComplete = false;
    }
    // Call super.start to set _startTime
    super.start(time);
    return this;
  }

  /**
   * Per-frame update. Iterates children, starting them at their scheduled
   * times and updating them.
   * @param {number} time — absolute time in ms
   * @param {number} [deltaTime=0]
   * @returns {boolean} true if still active, false if complete
   */
  update(time, deltaTime = 0) {
    return this._updateInternal(time, false, deltaTime);
  }

  _updateInternal(time, isSeek = false, deltaTime = 0) {
    if (!this._isPlaying && !isSeek) return false;
    if (this._isPaused && !isSeek) return true;
    if (time < this._startTime) {
      this._lastTime = time;
      return true;
    }

    this._lastTime = time;

    // Fire onStart once
    if (!this._onStartCallbackFired) {
      if (this._onStartCallback) {
        try { this._onStartCallback(this.target); } catch (e) { console.error(e); }
      }
      this._onStartCallbackFired = true;
    }

    let allComplete = true;
    let anyPlaying = false;

    for (const child of this._children) {
      const childAbsoluteStart = this._startTime + child.startTime;

      if (time >= childAbsoluteStart && !child._started) {
        // Start the child now
        child.tween.start(childAbsoluteStart);
        child._started = true;
      }

      if (child._started && !child._completed) {
        if (child.tween._isPlaying || isSeek) {
          const active = child.tween.update(time, deltaTime);
          if (active) anyPlaying = true;
          if (!active) {
            child._completed = true;
          } else if (child.tween._repeat === Infinity) {
            // Never completes
            allComplete = false;
          }
        }
      }

      if (!child._completed) allComplete = false;
    }

    // onUpdate callback
    if (this._onUpdateCallback) {
      try { this._onUpdateCallback(this.progress(), this.target, deltaTime); } catch (e) { console.error(e); }
    }

    // Check completion against total duration
    const elapsed = time - this._startTime;
    const total = this._totalDuration;

    if (total !== Infinity && elapsed >= total && allComplete) {
      // Timeline complete
      if (this._repeat > 0) {
        if (this._onRepeatCallback) {
          try { this._onRepeatCallback(this.target); } catch (e) { console.error(e); }
        }
        if (this._repeat !== Infinity) this._repeat--;
        // Restart all children
        for (const child of this._children) {
          child._started = false;
          child._completed = false;
        }
        this._startTime = time + this._repeatDelayTime;
        if (this._yoyo) {
          // Reverse the order of children for yoyo
          this._children.reverse();
        }
        return true;
      } else {
        if (this._onCompleteCallback) {
          try { this._onCompleteCallback(this.target); } catch (e) { console.error(e); }
        }
        this._isComplete = true;
        this._isPlaying = false;
        return false;
      }
    }

    return true;
  }

  /* ----------------------------- totalDuration ----------------------------- */

  totalDuration() {
    return this._totalDuration;
  }
}

export default Timeline;
