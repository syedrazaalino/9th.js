/**
 * @module Tween
 * @description Core Tween class — animates properties of any target object.
 *
 * Inspired by GSAP / tween.js / anime.js. Designed to integrate with 9th.js:
 *   - Vector3 / Color / Quaternion properties are interpolated using their
 *     native `.lerp()` / `.slerp()` methods (no manual x/y/z work required).
 *   - Nested paths like `material.color.r` are supported via dotted keys.
 *   - Relative values (`"+=10"`, `"-=5"`) and unit strings (`"10px"`) work.
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

import Easing, { Linear } from './Easing.js';
import { Vector3 } from '../core/math/Vector3.js';
import { Color } from '../core/math/Color.js';
import { Quaternion } from '../core/math/Quaternion.js';
import { Euler } from '../core/math/Euler.js';

/* -------------------------------------------------------------- *
 * Helpers
 * -------------------------------------------------------------- */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const UNIT_RE = /^(-?\d*\.?\d+)([a-z%]*)$/i;
const RELATIVE_RE = /^([+\-])=(.+)$/;

/**
 * Resolve a dotted path on a target.
 * @param {Object} target
 * @param {string} path
 * @returns {{obj: Object, key: string}}
 */
function resolvePath(target, path) {
  if (path.indexOf('.') === -1) {
    return { obj: target, key: path };
  }
  const parts = path.split('.');
  let obj = target;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj == null) return { obj: null, key: parts[parts.length - 1] };
    obj = obj[parts[i]];
  }
  return { obj, key: parts[parts.length - 1] };
}

/**
 * Detect the type of a value for interpolation purposes.
 * @param {*} value
 * @returns {string}
 */
function detectType(value) {
  if (value === null || value === undefined) return 'literal';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'literal';
  if (Quaternion && value instanceof Quaternion) return 'quaternion';
  if (Color && value instanceof Color) return 'color';
  if (Vector3 && value instanceof Vector3) return 'vector3';
  if (Euler && value instanceof Euler) return 'vector3';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'string') {
    if (HEX_RE.test(value)) return 'colorString';
    const m = value.match(UNIT_RE);
    if (m) return 'unitString';
    return 'literal';
  }
  // Duck-typing fallbacks
  if (value.isQuaternion === true) return 'quaternion';
  if (value.isColor === true || (value.r !== undefined && value.g !== undefined && value.b !== undefined && value.a === undefined && typeof value.r === 'number')) return 'color';
  if (value.isVector3 === true) return 'vector3';
  if (value.isEuler === true) return 'vector3';
  if (
    typeof value === 'object' &&
    value.x !== undefined && value.y !== undefined && value.z !== undefined &&
    value.w === undefined && typeof value.x === 'number'
  ) return 'vector3';
  if (
    typeof value === 'object' &&
    value.x !== undefined && value.y !== undefined && value.z !== undefined &&
    value.w !== undefined && typeof value.w === 'number'
  ) return 'quaternion';
  if (
    typeof value === 'object' &&
    value.r !== undefined && value.g !== undefined && value.b !== undefined &&
    typeof value.r === 'number'
  ) return 'color';
  return 'literal';
}

/**
 * Parse a hex color string into {r,g,b} (0-1 range).
 */
function hexToRGB(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const v = parseInt(h, 16);
  return {
    r: ((v >> 16) & 255) / 255,
    g: ((v >> 8) & 255) / 255,
    b: (v & 255) / 255
  };
}

function rgbToHex(r, g, b) {
  const ri = Math.max(0, Math.min(255, Math.round(r * 255)));
  const gi = Math.max(0, Math.min(255, Math.round(g * 255)));
  const bi = Math.max(0, Math.min(255, Math.round(b * 255)));
  return '#' + ((1 << 24) + (ri << 16) + (gi << 8) + bi).toString(16).slice(1);
}

/**
 * Resolve a value spec (which may be relative like "+=10") against
 * a current numeric value.
 */
function resolveRelative(spec, current) {
  if (typeof spec === 'string') {
    const m = spec.match(RELATIVE_RE);
    if (m) {
      const sign = m[1];
      const n = parseFloat(m[2]);
      return sign === '+' ? current + n : current - n;
    }
    // unit string: keep unit, just use number
    const um = spec.match(UNIT_RE);
    if (um) return parseFloat(um[1]);
    // hex color string
    if (HEX_RE.test(spec)) return spec;
    const parsed = parseFloat(spec);
    if (!isNaN(parsed)) return parsed;
    return spec;
  }
  return spec;
}

/* -------------------------------------------------------------- *
 * Tween
 * -------------------------------------------------------------- */
export class Tween {
  /**
   * @param {Object} target — the object whose properties will be animated
   */
  constructor(target) {
    this.target = target;
    this._valuesStart = {};        // resolved start values
    this._valuesEnd = {};          // resolved end values
    this._valueTypes = {};         // type per property
    this._valueMeta = {};          // extra info per property (unit, etc.)
    this._rawEnd = {};             // raw end spec (before relative resolution)
    this._rawStart = null;         // raw start spec (for from/fromTo)
    this._direction = 'to';        // 'to' | 'from' | 'fromTo'

    this._duration = 1000;
    this._easingFunction = Linear;
    this._delayTime = 0;
    this._repeat = 0;
    this._repeatDelayTime = 0;
    this._yoyo = false;

    this._isPlaying = false;
    _initState(this);

    this._onStartCallback = null;
    this._onStartCallbackFired = false;
    this._onUpdateCallback = null;
    this._onCompleteCallback = null;
    this._onRepeatCallback = null;
    this._onReverseCompleteCallback = null;

    this._chainedTweens = [];
    this._isTimelineChild = false;
    this._isComplete = false;
    this._timelineParent = null;
  }

  /* ----------------------------- setters ----------------------------- */

  /**
   * Animate TO the given props (from current values).
   * @param {Object} props
   * @param {number} duration — milliseconds
   */
  to(props, duration) {
    if (duration !== undefined) this._duration = duration;
    this._direction = 'to';
    this._rawEnd = { ...this._rawEnd, ...props };
    return this;
  }

  /**
   * Animate FROM the given props (to current values).
   */
  from(props, duration) {
    if (duration !== undefined) this._duration = duration;
    this._direction = 'from';
    this._rawStart = { ...(this._rawStart || {}), ...props };
    return this;
  }

  /**
   * Animate from explicit start props to explicit end props.
   */
  fromTo(fromProps, toProps, duration) {
    if (duration !== undefined) this._duration = duration;
    this._direction = 'fromTo';
    this._rawStart = { ...(this._rawStart || {}), ...fromProps };
    this._rawEnd = { ...this._rawEnd, ...toProps };
    return this;
  }

  /**
   * Set the easing function. Accepts a callable or an object with `.InOut`
   * (or `.In`/`.None`) — e.g., `Easing.Cubic.InOut` or `Easing.Linear`.
   */
  easing(fn) {
    if (typeof fn === 'function') {
      this._easingFunction = fn;
    } else if (fn && typeof fn === 'object') {
      this._easingFunction = fn.InOut || fn.In || fn.None || fn.Out || Linear;
    }
    return this;
  }

  delay(ms) { this._delayTime = ms; return this; }
  repeat(count) { this._repeat = count; return this; }
  yoyo(bool) { this._yoyo = !!bool; return this; }
  repeatDelay(ms) { this._repeatDelayTime = ms; return this; }

  onStart(cb) { this._onStartCallback = cb; return this; }
  onUpdate(cb) { this._onUpdateCallback = cb; return this; }
  onComplete(cb) { this._onCompleteCallback = cb; return this; }
  onRepeat(cb) { this._onRepeatCallback = cb; return this; }
  onReverseComplete(cb) { this._onReverseCompleteCallback = cb; return this; }

  /* ----------------------------- lifecycle ----------------------------- */

  /**
   * Start the tween at the given absolute time (ms). Defaults to now.
   * @param {number} [time]
   * @param {boolean} [preserveStart=false] — if true, do not re-snapshot
   *   start values from the target (used internally by restart() to keep
   *   the original start values intact).
   */
  start(time, preserveStart = false) {
    this._isPlaying = true;
    this._isPaused = false;
    this._isComplete = false;
    this._onStartCallbackFired = false;
    this._startTime = (time !== undefined ? time : _now()) + this._delayTime;
    this._pausedAt = 0;
    this._pausedDuration = 0;
    this._reversed = false;

    if (!preserveStart || !this._originalValuesStart) {
      // Snapshot current target values for each animated property
      this._snapshotStartValues();

      // Resolve end values (handles relative values)
      this._resolveEndValues();

      // Save the original start values so restart() can restore them
      if (!this._originalValuesStart) {
        this._originalValuesStart = this._cloneValuesMap(this._valuesStart);
        this._originalValueTypes = { ...this._valueTypes };
        this._originalValueMeta = { ...this._valueMeta };
        this._originalValuesEnd = this._cloneValuesMap(this._valuesEnd);
      }
    } else {
      // Restore from saved originals
      this._valuesStart = this._cloneValuesMap(this._originalValuesStart);
      this._valuesEnd = this._cloneValuesMap(this._originalValuesEnd);
      this._valueTypes = { ...this._originalValueTypes };
      this._valueMeta = { ...this._originalValueMeta };
    }

    // For `from` / `fromTo`, write the start values to the target immediately
    if (this._direction === 'from' || this._direction === 'fromTo') {
      this._applyStaticValues(this._valuesStart);
    }

    return this;
  }

  /**
   * Restart the tween from its original start state.
   * @param {number} [time]
   */
  restart(time) {
    this.stop();

    // If we have original start values, write them back to the target so the
    // next start() call snapshots the original (pre-tween) state.
    if (this._originalValuesStart) {
      this._applyStaticValues(this._originalValuesStart);
    }

    // Re-run start with preserved originals so we don't re-snapshot the
    // (now-restored) target.
    const startTime = time !== undefined ? time : _now();
    this._isComplete = false;
    this._isPlaying = true;
    this._isPaused = false;
    this._onStartCallbackFired = false;
    this._startTime = startTime + this._delayTime;
    this._pausedAt = 0;
    this._pausedDuration = 0;
    this._reversed = false;

    // Use the saved originals
    this._valuesStart = this._cloneValuesMap(this._originalValuesStart);
    this._valuesEnd = this._cloneValuesMap(this._originalValuesEnd);
    this._valueTypes = { ...(this._originalValueTypes || this._valueTypes) };
    this._valueMeta = { ...(this._originalValueMeta || this._valueMeta) };

    // For `from` / `fromTo`, write the start values to the target immediately
    if (this._direction === 'from' || this._direction === 'fromTo') {
      this._applyStaticValues(this._valuesStart);
    }

    return this;
  }

  /**
   * Deep-clone a values map (so restarts don't share mutable references).
   */
  _cloneValuesMap(map) {
    if (!map) return map;
    const out = {};
    for (const k in map) {
      const v = map[k];
      if (v && typeof v === 'object' && typeof v.clone === 'function') {
        out[k] = v.clone();
      } else if (Array.isArray(v)) {
        out[k] = v.slice();
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  /**
   * Pause the tween.
   * @param {number} [time] — virtual time at which the pause takes effect.
   *   If omitted, uses real time (performance.now()).
   */
  pause(time) {
    if (!this._isPlaying || this._isPaused) return this;
    this._isPaused = true;
    this._pausedAt = time !== undefined ? time : _now();
    return this;
  }

  /**
   * Resume the tween.
   * @param {number} [time] — virtual time at which the resume takes effect.
   *   If omitted, uses real time (performance.now()).
   */
  resume(time) {
    if (!this._isPaused) return this;
    this._isPaused = false;
    const now = time !== undefined ? time : _now();
    const pausedFor = now - this._pausedAt;
    if (pausedFor > 0) {
      this._pausedDuration += pausedFor;
      this._startTime += pausedFor;
    }
    return this;
  }

  stop() {
    this._isPlaying = false;
    this._isComplete = true;
    return this;
  }

  /**
   * Per-frame update.
   * @param {number} time — absolute time in ms
   * @param {number} [deltaTime=0] — frame delta in seconds (informational)
   * @returns {boolean} true if still active, false if complete
   */
  update(time, deltaTime = 0) {
    if (!this._isPlaying) return false;
    if (this._isPaused) return true;
    if (time < this._startTime) return true;

    // Fire onStart once
    if (!this._onStartCallbackFired) {
      if (this._onStartCallback) {
        try { this._onStartCallback(this.target); } catch (e) { console.error(e); }
      }
      this._onStartCallbackFired = true;
    }

    let elapsed = (time - this._startTime) / this._duration;
    if (elapsed < 0) elapsed = 0;
    if (elapsed > 1) elapsed = 1;

    // Note: yoyo is implemented by swapping start/end values at each iteration
    // boundary (see the repeat-handling block below). We do NOT reverse the
    // easing input here — that would double-reverse the value.
    const input = elapsed;

    // Apply easing
    let eased;
    try {
      eased = this._easingFunction(input);
    } catch (e) {
      eased = input;
    }

    // Interpolate
    this._applyInterpolated(this._valuesEnd, eased, this._valuesStart);

    if (this._onUpdateCallback) {
      try { this._onUpdateCallback(eased, this.target, deltaTime); } catch (e) { console.error(e); }
    }

    if (elapsed >= 1) {
      // Iteration complete
      if (this._repeat > 0) {
        // Repeat handling
        if (this._onRepeatCallback) {
          try { this._onRepeatCallback(this.target); } catch (e) { console.error(e); }
        }
        if (this._repeat !== Infinity) this._repeat--;
        this._reversed = this._yoyo ? !this._reversed : false;
        // Reset start time for next iteration (with repeatDelay)
        this._startTime = time + this._repeatDelayTime;
        if (this._yoyo) {
          // Yoyo: swap start and end values for the next iteration so the
          // value animates back toward the original start.
          const tmp = this._valuesStart;
          this._valuesStart = this._valuesEnd;
          this._valuesEnd = tmp;
        } else {
          // Non-yoyo repeat: re-snapshot current target values as the new
          // start, so the next iteration animates from the (now-reached)
          // end value back to the same end value. In most cases this is a
          // no-op visually, but it keeps start/end in sync if the target
          // was modified externally.
          // (Skip re-snapshot — keep original start/end so the value
          // jumps back to the start. This matches GSAP semantics where
          // repeat restarts from the original start.)
        }
        return true;
      } else {
        // All iterations complete
        if (this._yoyo && this._reversed && this._onReverseCompleteCallback) {
          try { this._onReverseCompleteCallback(this.target); } catch (e) { console.error(e); }
        } else if (this._onCompleteCallback) {
          try { this._onCompleteCallback(this.target); } catch (e) { console.error(e); }
        }
        this._isComplete = true;
        this._isPlaying = false;
        // Trigger chained tweens
        for (let i = 0; i < this._chainedTweens.length; i++) {
          this._chainedTweens[i].start(time);
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Total duration including all repeats and delays.
   * @returns {number}
   */
  totalDuration() {
    if (this._repeat === Infinity) return Infinity;
    const oneIter = this._duration + this._repeatDelayTime;
    return this._delayTime + this._duration + this._repeat * oneIter;
  }

  /**
   * Add a chained tween that starts when this one completes.
   * (Not in the public spec, but useful internally.)
   */
  chain(...tweens) {
    this._chainedTweens = tweens;
    return this;
  }

  /* ----------------------------- internals ----------------------------- */

  /**
   * Snapshot current values on the target for each animated property.
   * Also detect types.
   */
  _snapshotStartValues() {
    const start = {};
    const types = {};
    const meta = {};

    const endKeys = Object.keys(this._rawEnd);
    const startKeys = this._rawStart ? Object.keys(this._rawStart) : [];

    // For `to`: start = current target value
    // For `from`: start = rawStart; end = current target value (resolved later)
    // For `fromTo`: start = rawStart; end = rawEnd

    const allKeys = new Set([...endKeys, ...startKeys]);

    for (const key of allKeys) {
      const { obj, key: propKey } = resolvePath(this.target, key);
      if (!obj) continue;

      let startVal;
      if (this._rawStart && key in this._rawStart) {
        startVal = this._rawStart[key];
        // Resolve relative spec against current value if needed
        const currentVal = obj[propKey];
        startVal = _coerceValue(startVal, currentVal);
      } else {
        startVal = obj[propKey];
      }

      // For `from`: also set the end to the current value (snapshot)
      if (this._direction === 'from' && !(key in this._rawEnd)) {
        // No explicit end; use current value as the end
        // (will be set in _resolveEndValues via snapshot)
      }

      // Determine type based on startVal and endVal
      const endSpec = this._rawEnd[key];
      const endVal = _coerceValue(endSpec, startVal);
      const type = _resolveType(startVal, endVal);

      start[key] = _cloneValue(startVal, type);
      types[key] = type;

      // Capture unit metadata for string types
      if (type === 'unitString' && typeof endVal === 'string') {
        const m = endVal.match(UNIT_RE);
        if (m) meta[key] = { unit: m[2] || (typeof startVal === 'string' ? (startVal.match(UNIT_RE) || [])[2] || '' : '') };
      } else if (type === 'unitString' && typeof startVal === 'string') {
        const m = startVal.match(UNIT_RE);
        if (m) meta[key] = { unit: m[2] || '' };
      }
    }

    this._valuesStart = start;
    this._valueTypes = types;
    this._valueMeta = meta;

    // For `from`: the end values are the current target values (snapshot)
    if (this._direction === 'from') {
      const end = {};
      const endTypes = {};
      for (const key of Object.keys(this._rawEnd).length ? Object.keys(this._rawEnd) : Object.keys(this._rawStart || {})) {
        const { obj, key: propKey } = resolvePath(this.target, key);
        if (!obj) continue;
        const currentVal = obj[propKey];
        const startVal = this._valuesStart[key];
        const type = _resolveType(startVal, currentVal);
        end[key] = _cloneValue(currentVal, type);
        endTypes[key] = type;
      }
      // If `from` props has keys not in `rawEnd`, snapshot current as end
      const allKeys = new Set([
        ...Object.keys(this._rawStart || {}),
        ...Object.keys(this._rawEnd)
      ]);
      for (const key of allKeys) {
        if (key in end) continue;
        const { obj, key: propKey } = resolvePath(this.target, key);
        if (!obj) continue;
        const currentVal = obj[propKey];
        const startVal = this._valuesStart[key];
        const type = _resolveType(startVal, currentVal);
        end[key] = _cloneValue(currentVal, type);
        endTypes[key] = type;
      }
      this._valuesEnd = end;
      this._valueTypes = { ...this._valueTypes, ...endTypes };
    }
  }

  /**
   * Resolve end values (handles relative values like "+=10").
   */
  _resolveEndValues() {
    if (this._direction === 'from') {
      // End values are the snapshot of current target values (already set)
      return;
    }

    const end = {};
    const types = {};

    for (const key of Object.keys(this._rawEnd)) {
      const spec = this._rawEnd[key];
      const startVal = this._valuesStart[key];
      const resolved = _coerceValue(spec, startVal);

      const { obj, key: propKey } = resolvePath(this.target, key);
      const currentVal = obj ? obj[propKey] : undefined;
      const type = _resolveType(startVal, resolved);

      end[key] = _cloneValue(resolved, type);
      types[key] = type;

      // Update unit meta if not already set
      if (type === 'unitString' && !this._valueMeta[key]) {
        const m = (typeof resolved === 'string' ? resolved : (typeof currentVal === 'string' ? currentVal : '')).match(UNIT_RE);
        if (m) this._valueMeta[key] = { unit: m[2] || '' };
      }
    }

    this._valuesEnd = end;
    this._valueTypes = { ...this._valueTypes, ...types };
  }

  /**
   * Apply interpolated values to the target.
   * @param {Object} targetValues - the end values
   * @param {number} t - eased progress (0-1)
   * @param {Object} [startValues] - the start values (defaults to this._valuesStart)
   */
  _applyInterpolated(targetValues, t, startValues) {
    const start = startValues || this._valuesStart;
    for (const key in targetValues) {
      const s = start[key];
      const e = targetValues[key];
      const type = this._valueTypes[key];
      const v = _interpolate(s, e, t, type, this._valueMeta[key]);
      _writeValue(this.target, key, v, type, this._valueMeta[key]);
    }
  }

  /**
   * Direct write of static values to the target (used by `from`/`fromTo` to
   * set start values).
   */
  _applyStaticValues(values) {
    for (const key in values) {
      const v = values[key];
      const type = this._valueTypes[key];
      _writeValue(this.target, key, v, type, this._valueMeta[key]);
    }
  }
}

/* -------------------------------------------------------------- *
 * Module-private helpers
 * -------------------------------------------------------------- */
function _initState(tween) {
  tween._isPaused = false;
  tween._startTime = 0;
  tween._pausedAt = 0;
  tween._pausedDuration = 0;
  tween._reversed = false;
}

function _now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Coerce a value spec into an actual end value.
 * Handles relative specs (+=, -=) against a current value.
 */
function _coerceValue(spec, currentValue) {
  if (typeof spec === 'string') {
    // Relative numeric
    const m = spec.match(RELATIVE_RE);
    if (m) {
      const sign = m[1];
      const n = parseFloat(m[2]);
      if (typeof currentValue === 'number') {
        return sign === '+' ? currentValue + n : currentValue - n;
      }
      // For Color / Vector3 / etc., we can't add easily; return as-is
      return spec;
    }
    // Hex color string -> leave as string (will be parsed at interpolate time)
    if (HEX_RE.test(spec)) return spec;
    // Unit string
    const um = spec.match(UNIT_RE);
    if (um) return spec;
    // Try to parse as number
    const parsed = parseFloat(spec);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
    return spec;
  }
  return spec;
}

/**
 * Resolve the type given start and end values.
 * Prefers the more specific type. Color object > colorString (so the
 * underlying Color instance gets mutated in place via .copy()).
 */
function _resolveType(startVal, endVal) {
  const t1 = detectType(startVal);
  const t2 = detectType(endVal);

  // Prefer Color object over hex string (mutate Color in place)
  if (t1 === 'color' || t2 === 'color') return 'color';
  if (t1 === 'colorString' || t2 === 'colorString') return 'colorString';

  // Prefer Vector3 over plain object/array
  if (t1 === 'vector3' || t2 === 'vector3') return 'vector3';
  if (t1 === 'quaternion' || t2 === 'quaternion') return 'quaternion';
  if (t1 === 'array' || t2 === 'array') return 'array';
  if (t1 === 'unitString' || t2 === 'unitString') return 'unitString';

  // Both are numbers or literals
  if (t1 === 'number' || t2 === 'number') return 'number';
  return t1 !== 'literal' ? t1 : t2;
}

/**
 * Clone a value for storage (so we don't mutate the original target object's
 * nested objects).
 */
function _cloneValue(value, type) {
  switch (type) {
    case 'number':
      return value;
    case 'literal':
      return value;
    case 'unitString':
      return typeof value === 'string' ? value : String(value);
    case 'colorString':
      return typeof value === 'string' ? value : rgbToHex(value.r, value.g, value.b);
    case 'color':
      if (Color && value instanceof Color) return value.clone();
      if (typeof value === 'string') {
        const rgb = hexToRGB(value);
        return Color ? new Color(rgb.r, rgb.g, rgb.b) : { r: rgb.r, g: rgb.g, b: rgb.b };
      }
      if (value && typeof value === 'object' && 'r' in value) {
        return Color ? new Color(value.r, value.g, value.b) : { r: value.r, g: value.g, b: value.b };
      }
      return value;
    case 'vector3':
      if (Vector3 && value instanceof Vector3) return value.clone();
      if (Euler && value instanceof Euler) {
        return Vector3 ? new Vector3(value.x, value.y, value.z) : { x: value.x, y: value.y, z: value.z };
      }
      if (value && typeof value === 'object' && 'x' in value) {
        return Vector3 ? new Vector3(value.x, value.y, value.z) : { x: value.x, y: value.y, z: value.z };
      }
      return value;
    case 'quaternion':
      if (Quaternion && value instanceof Quaternion) return value.clone();
      if (value && typeof value === 'object' && 'x' in value && 'w' in value) {
        return Quaternion ? new Quaternion(value.x, value.y, value.z, value.w) : { x: value.x, y: value.y, z: value.z, w: value.w };
      }
      return value;
    case 'array':
      return Array.isArray(value) ? value.slice() : value;
    default:
      return value;
  }
}

/**
 * Interpolate between start and end values.
 */
function _interpolate(start, end, t, type, meta) {
  switch (type) {
    case 'number':
      return start + (end - start) * t;
    case 'unitString': {
      const sNum = parseFloat((typeof start === 'string' ? start : String(start)).match(UNIT_RE)[1]);
      const eNum = parseFloat((typeof end === 'string' ? end : String(end)).match(UNIT_RE)[1]);
      const unit = (meta && meta.unit) || '';
      return (sNum + (eNum - sNum) * t) + unit;
    }
    case 'colorString': {
      const sRGB = typeof start === 'string' ? hexToRGB(start) : { r: start.r, g: start.g, b: start.b };
      const eRGB = typeof end === 'string' ? hexToRGB(end) : { r: end.r, g: end.g, b: end.b };
      const r = sRGB.r + (eRGB.r - sRGB.r) * t;
      const g = sRGB.g + (eRGB.g - sRGB.g) * t;
      const b = sRGB.b + (eRGB.b - sRGB.b) * t;
      return rgbToHex(r, g, b);
    }
    case 'color': {
      // Use Color.lerp if available
      if (Color) {
        const s = start instanceof Color ? start.clone() : new Color(start.r, start.g, start.b);
        const e = end instanceof Color ? end : new Color(end.r, end.g, end.b);
        return s.lerp(e, t);
      }
      return {
        r: start.r + (end.r - start.r) * t,
        g: start.g + (end.g - start.g) * t,
        b: start.b + (end.b - start.b) * t
      };
    }
    case 'vector3': {
      // Use Vector3.lerp if available
      if (Vector3 && start instanceof Vector3 && end instanceof Vector3) {
        return start.clone().lerp(end, t);
      }
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t
      };
    }
    case 'quaternion': {
      // Use Quaternion.slerp
      if (Quaternion && start instanceof Quaternion && end instanceof Quaternion) {
        return start.clone().slerp(end, t);
      }
      // Fallback: linear interp (not ideal but works for degenerate cases)
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
        w: start.w + (end.w - start.w) * t
      };
    }
    case 'array': {
      const result = new Array(start.length);
      for (let i = 0; i < start.length; i++) {
        result[i] = start[i] + (end[i] - start[i]) * t;
      }
      return result;
    }
    case 'literal':
    default:
      return t < 1 ? start : end;
  }
}

/**
 * Write an interpolated value back to the target.
 */
function _writeValue(target, key, value, type, meta) {
  const { obj, key: propKey } = resolvePath(target, key);
  if (!obj) return;

  switch (type) {
    case 'number':
      obj[propKey] = value;
      break;
    case 'unitString':
      obj[propKey] = value; // string with unit
      break;
    case 'colorString':
      obj[propKey] = value; // hex string
      break;
    case 'color':
      // If the target property is a Color, mutate it in place
      if (Color && obj[propKey] instanceof Color) {
        obj[propKey].copy(value);
      } else if (obj[propKey] && typeof obj[propKey] === 'object' && 'r' in obj[propKey]) {
        obj[propKey].r = value.r;
        obj[propKey].g = value.g;
        obj[propKey].b = value.b;
      } else {
        obj[propKey] = value;
      }
      break;
    case 'vector3':
      if (Vector3 && obj[propKey] instanceof Vector3) {
        obj[propKey].copy(value);
      } else if (Euler && obj[propKey] instanceof Euler) {
        obj[propKey].x = value.x;
        obj[propKey].y = value.y;
        obj[propKey].z = value.z;
      } else if (obj[propKey] && typeof obj[propKey] === 'object' && 'x' in obj[propKey]) {
        obj[propKey].x = value.x;
        obj[propKey].y = value.y;
        obj[propKey].z = value.z;
      } else {
        obj[propKey] = value;
      }
      break;
    case 'quaternion':
      if (Quaternion && obj[propKey] instanceof Quaternion) {
        obj[propKey].copy(value);
      } else if (obj[propKey] && typeof obj[propKey] === 'object' && 'x' in obj[propKey] && 'w' in obj[propKey]) {
        obj[propKey].x = value.x;
        obj[propKey].y = value.y;
        obj[propKey].z = value.z;
        obj[propKey].w = value.w;
      } else {
        obj[propKey] = value;
      }
      break;
    case 'array':
      if (Array.isArray(obj[propKey])) {
        for (let i = 0; i < value.length; i++) obj[propKey][i] = value[i];
      } else {
        obj[propKey] = value;
      }
      break;
    default:
      obj[propKey] = value;
  }
}

export default Tween;
