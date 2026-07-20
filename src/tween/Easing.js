/**
 * @module Easing
 * @description 40+ easing functions for tween animations.
 *
 * Each easing category exports an object with `.In(t)`, `.Out(t)`, `.InOut(t)`
 * methods (where `t` is normalized progress in [0,1]).
 *
 * Categories:
 *   - Linear (callable function AND object with In/Out/InOut/None)
 *   - Quadratic, Cubic, Quartic, Quintic
 *   - Sinusoidal, Exponential, Circular
 *   - Elastic (with amplitude/period)
 *   - Back (with overshoot)
 *   - Bounce
 *   - Step (discrete steps)
 *   - Smooth (smoothstep family)
 *
 * Aliases (GSAP-style):
 *   - Sine -> Sinusoidal, Expo -> Exponential, Circ -> Circular
 *   - Quad -> Quadratic, Quart -> Quartic, Quint -> Quintic
 *   - Power0 -> Linear, Power1 -> Quadratic, ..., Power4 -> Quintic
 *   - None -> Linear
 *
 * Factory functions:
 *   - Bezier(p1x, p1y, p2x, p2y) -> cubic-bezier easing function
 *   - RoughEase({strength, points, randomize, clamp}) -> rough/jittery easing
 *   - SlowMo(linearRatio, power, ease) -> slow-mo easing
 *   - Steps(count) -> discrete-step easing object
 *   - Elastic.config(amp, period) -> custom Elastic
 *   - Back.config(overshoot) -> custom Back
 *
 * Registry:
 *   - Easing.get('Cubic.InOut') -> function
 *   - Easing.get('Linear') -> function
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

const PI = Math.PI;
const HALF_PI = PI / 2;
const TWO_PI = PI * 2;

/* -------------------------------------------------------------- *
 * Linear
 * -------------------------------------------------------------- */
const Linear = (t) => t;
Linear.In = (t) => t;
Linear.Out = (t) => t;
Linear.InOut = (t) => t;
Linear.None = (t) => t;

/* -------------------------------------------------------------- *
 * Quadratic
 * -------------------------------------------------------------- */
const Quadratic = {
  In: (t) => t * t,
  Out: (t) => t * (2 - t),
  InOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
};

/* -------------------------------------------------------------- *
 * Cubic
 * -------------------------------------------------------------- */
const Cubic = {
  In: (t) => t * t * t,
  Out: (t) => 1 - Math.pow(1 - t, 3),
  InOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
};

/* -------------------------------------------------------------- *
 * Quartic
 * -------------------------------------------------------------- */
const Quartic = {
  In: (t) => Math.pow(t, 4),
  Out: (t) => 1 - Math.pow(1 - t, 4),
  InOut: (t) => (t < 0.5 ? 8 * Math.pow(t, 4) : 1 - Math.pow(-2 * t + 2, 4) / 2)
};

/* -------------------------------------------------------------- *
 * Quintic
 * -------------------------------------------------------------- */
const Quintic = {
  In: (t) => Math.pow(t, 5),
  Out: (t) => 1 - Math.pow(1 - t, 5),
  InOut: (t) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2)
};

/* -------------------------------------------------------------- *
 * Sinusoidal
 * -------------------------------------------------------------- */
const Sinusoidal = {
  In: (t) => 1 - Math.cos(t * HALF_PI),
  Out: (t) => Math.sin(t * HALF_PI),
  InOut: (t) => -(Math.cos(PI * t) - 1) / 2
};

/* -------------------------------------------------------------- *
 * Exponential
 * -------------------------------------------------------------- */
const Exponential = {
  In: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  Out: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  InOut: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? 0.5 * Math.pow(2, 20 * t - 10)
      : 0.5 * (2 - Math.pow(2, -20 * t + 10));
  }
};

/* -------------------------------------------------------------- *
 * Circular
 * -------------------------------------------------------------- */
const Circular = {
  In: (t) => 1 - Math.sqrt(1 - t * t),
  Out: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  InOut: (t) =>
    t < 0.5
      ? 0.5 * (1 - Math.sqrt(1 - 4 * t * t))
      : 0.5 * (1 + Math.sqrt(1 - Math.pow(-2 * t + 2, 2)))
};

/* -------------------------------------------------------------- *
 * Elastic (amplitude + period)
 * -------------------------------------------------------------- */
const _elasticIn = (t, a = 1, p = 0.3) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const s = p / 4;
  return -(a * Math.pow(2, 10 * (t - 1)) * Math.sin(((t - 1) - s) * TWO_PI / p));
};

const _elasticOut = (t, a = 1, p = 0.3) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const s = p / 4;
  return a * Math.pow(2, -10 * t) * Math.sin((t - s) * TWO_PI / p) + 1;
};

const _elasticInOut = (t, a = 1, p = 0.45) => {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const s = p / 4;
  if (t < 0.5) {
    return -0.5 * (a * Math.pow(2, 10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - s) * TWO_PI / p));
  }
  return a * Math.pow(2, -10 * (2 * t - 1)) * Math.sin(((2 * t - 1) - s) * TWO_PI / p) * 0.5 + 1;
};

const Elastic = {
  In: (t) => _elasticIn(t),
  Out: (t) => _elasticOut(t),
  InOut: (t) => _elasticInOut(t),
  /**
   * Configure custom amplitude and period.
   * @param {number} amplitude
   * @param {number} period
   * @returns {{In, Out, InOut}}
   */
  config: (amplitude = 1, period = 0.3) => ({
    In: (t) => _elasticIn(t, amplitude, period),
    Out: (t) => _elasticOut(t, amplitude, period),
    InOut: (t) => _elasticInOut(t, amplitude, period === 0.3 ? 0.45 : period)
  }),
  /** Same as Elastic.config — GSAP-style alias. */
  with: (amplitude = 1, period = 0.3) => Elastic.config(amplitude, period)
};

/* -------------------------------------------------------------- *
 * Back (overshoot)
 * -------------------------------------------------------------- */
const BACK_DEFAULT = 1.70158;

const _backIn = (t, s = BACK_DEFAULT) => (s + 1) * t * t * t - s * t * t;
const _backOut = (t, s = BACK_DEFAULT) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const _backInOut = (t, s = BACK_DEFAULT) => {
  const c2 = s * 1.525;
  return t < 0.5
    ? 0.5 * (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2))
    : 0.5 * (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2);
};

const Back = {
  In: (t) => _backIn(t),
  Out: (t) => _backOut(t),
  InOut: (t) => _backInOut(t),
  /**
   * Configure custom overshoot.
   * @param {number} overshoot
   * @returns {{In, Out, InOut}}
   */
  config: (overshoot = BACK_DEFAULT) => ({
    In: (t) => _backIn(t, overshoot),
    Out: (t) => _backOut(t, overshoot),
    InOut: (t) => _backInOut(t, overshoot)
  })
};

/* -------------------------------------------------------------- *
 * Bounce
 * -------------------------------------------------------------- */
const _bounceOut = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    t -= 1.5 / d1;
    return n1 * t * t + 0.75;
  }
  if (t < 2.5 / d1) {
    t -= 2.25 / d1;
    return n1 * t * t + 0.9375;
  }
  t -= 2.625 / d1;
  return n1 * t * t + 0.984375;
};

const Bounce = {
  In: (t) => 1 - _bounceOut(1 - t),
  Out: (t) => _bounceOut(t),
  InOut: (t) =>
    t < 0.5
      ? 0.5 * (1 - _bounceOut(1 - 2 * t))
      : 0.5 * _bounceOut(2 * t - 1) + 0.5
};

/* -------------------------------------------------------------- *
 * Step (discrete steps)
 * -------------------------------------------------------------- */
const Step = {
  In: (t) => Math.floor(t) ,
  Out: (t) => 1 - Math.floor(1 - t) ,
  InOut: (t) =>
    t < 0.5
      ? Math.floor(t * 2) / 2
      : 1 - Math.floor((1 - t) * 2) / 2,
  /**
   * Configure number of discrete steps.
   * @param {number} steps
   * @returns {{In, Out, InOut}}
   */
  config: (steps = 1) => {
    const s = Math.max(1, steps | 0);
    return {
      In: (t) => Math.floor(t * s) / s,
      Out: (t) => 1 - Math.floor((1 - t) * s) / s,
      InOut: (t) =>
        t < 0.5
          ? Math.floor(t * 2 * s) / (2 * s)
          : 1 - Math.floor((1 - t) * 2 * s) / (2 * s)
    };
  }
};

/* -------------------------------------------------------------- *
 * Smooth (smoothstep / smootherstep)
 * -------------------------------------------------------------- */
const _smoothstep = (t) => t * t * (3 - 2 * t);
const _smootherstep = (t) => t * t * t * (t * (6 * t - 15) + 10);

const Smooth = {
  In: (t) => _smoothstep(t),
  Out: (t) => 1 - _smoothstep(1 - t),
  InOut: (t) => _smootherstep(t)
};

/* -------------------------------------------------------------- *
 * Sine Wave (oscillates — useful for UI wobble)
 * -------------------------------------------------------------- */
const SineWave = {
  In: (t) => Math.sin(t * HALF_PI),
  Out: (t) => Math.sin(t * HALF_PI),
  InOut: (t) => Math.sin(t * PI)
};

/* -------------------------------------------------------------- *
 * Rough (random jitter — RoughEase)
 * -------------------------------------------------------------- */
/**
 * Create a RoughEase easing function. The result has the standard
 * In/Out/InOut surface and is also callable.
 * @param {Object} [opts]
 * @param {number} [opts.strength=1]   - magnitude of jitter (0-1)
 * @param {number} [opts.points=20]    - number of jitter points
 * @param {boolean} [opts.randomize=true] - re-randomize each call
 * @param {boolean} [opts.clamp=false] - clamp output to [0,1]
 * @returns {Function} easing function with In/Out/InOut attached
 */
function RoughEase(opts = {}) {
  const strength = opts.strength != null ? opts.strength : 1;
  const points = opts.points != null ? opts.points : 20;
  const randomize = opts.randomize !== false;
  const clamp = !!opts.clamp;

  // Pre-generate random offsets
  let randomTable = new Float32Array(points + 1);
  for (let i = 0; i <= points; i++) {
    randomTable[i] = Math.random();
  }

  const sample = (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const x = t * points;
    const i0 = Math.floor(x);
    const frac = x - i0;
    const r0 = randomTable[i0] || 0.5;
    const r1 = randomTable[i0 + 1] || 0.5;
    const baseLinear = t;
    const jitter = (r0 + (r1 - r0) * frac) - 0.5;
    let value = baseLinear + jitter * strength;
    if (clamp) value = Math.max(0, Math.min(1, value));
    return value;
  };

  const fn = (t) => sample(t);
  fn.In = (t) => sample(t);
  fn.Out = (t) => 1 - sample(1 - t);
  fn.InOut = (t) => (t < 0.5 ? sample(t * 2) * 0.5 : 1 - sample((1 - t) * 2) * 0.5);

  fn.tabled = randomTable;
  fn.reseed = () => {
    for (let i = 0; i <= points; i++) randomTable[i] = Math.random();
    return fn;
  };
  if (!randomize) {
    // Fixed seed for deterministic easing
    let seed = 0;
    for (let i = 0; i <= points; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      randomTable[i] = seed / 233280;
    }
  }
  return fn;
}

/* -------------------------------------------------------------- *
 * SlowMo (slow start, fast middle, slow end)
 * -------------------------------------------------------------- */
/**
 * Create a SlowMo easing function.
 * @param {number} [linearRatio=0.7] - portion that is linear (0-1)
 * @param {number} [power=0.7]       - power of the dip
 * @param {boolean} [ease=true]      - whether to apply Y in/out easing
 * @returns {Function} easing function with In/Out/InOut attached
 */
function SlowMo(linearRatio = 0.7, power = 0.7, ease = true) {
  const ramp = (linearRatio < 1) ? 0.5 * (1 - linearRatio) : 0;
  const pow = Math.max(0, power);

  const sample = (t) => {
    if (t < ramp) {
      // ease in
      const p = ramp === 0 ? 0 : t / ramp;
      const eased = ease ? _smootherstep(p) : p;
      return eased * ramp * pow;
    }
    if (t > 1 - ramp) {
      // ease out
      const p = ramp === 0 ? 1 : (t - (1 - ramp)) / ramp;
      const eased = ease ? _smootherstep(p) : p;
      return 1 - ramp * pow + eased * ramp * pow;
    }
    // linear middle
    const midStart = ramp * pow;
    const midEnd = 1 - ramp * pow;
    const midWidth = 1 - 2 * ramp;
    const p = midWidth === 0 ? 0 : (t - ramp) / midWidth;
    return midStart + (midEnd - midStart) * p;
  };

  const fn = (t) => sample(t);
  fn.In = (t) => sample(t);
  fn.Out = (t) => 1 - sample(1 - t);
  fn.InOut = (t) => (t < 0.5 ? sample(t * 2) * 0.5 : 1 - sample((1 - t) * 2) * 0.5);
  return fn;
}

/* -------------------------------------------------------------- *
 * Bezier (cubic-bezier)
 * -------------------------------------------------------------- */
/**
 * Create a cubic-bezier easing function (CSS cubic-bezier style).
 * Control points P0=(0,0) and P3=(1,1) are implied.
 * @param {number} p1x
 * @param {number} p1y
 * @param {number} p2x
 * @param {number} p2y
 * @returns {Function} easing function with In/Out/InOut attached
 */
function Bezier(p1x = 0.25, p1y = 0.1, p2x = 0.75, p2y = 0.9) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleCurveY = (t) => ((ay * t + by) * t + cy) * t;
  const sampleCurveDerivativeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

  const solveCurveX = (x, epsilon) => {
    let t2 = x;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < epsilon) return t2;
      const d = sampleCurveDerivativeX(t2);
      if (Math.abs(d) < 1e-6) break;
      t2 = t2 - x2 / d;
    }
    // Bisection fallback
    let lo = 0, hi = 1;
    t2 = x;
    while (lo < hi) {
      const x2 = sampleCurveX(t2);
      if (Math.abs(x2 - x) < epsilon) return t2;
      if (x > x2) lo = t2;
      else hi = t2;
      t2 = (lo + hi) * 0.5;
    }
    return t2;
  };

  const fn = (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleCurveY(solveCurveX(x, 1e-6));
  };
  fn.In = fn;
  fn.Out = fn;
  fn.InOut = fn;
  fn.controlPoints = [p1x, p1y, p2x, p2y];
  return fn;
}

/* -------------------------------------------------------------- *
 * Steps (alias for Step.config)
 * -------------------------------------------------------------- */
const Steps = (count = 1) => Step.config(count);

/* -------------------------------------------------------------- *
 * Registry: Easing.get(name)
 * -------------------------------------------------------------- */
/**
 * Look up an easing function by name.
 * Examples:
 *   Easing.get('Linear')         -> Linear (function)
 *   Easing.get('Linear.None')    -> Linear.None
 *   Easing.get('Cubic.InOut')    -> Cubic.InOut
 *   Easing.get('Bounce.Out')     -> Bounce.Out
 *   Easing.get('Quad')           -> Quadratic.InOut (default variant)
 * @param {string} name
 * @returns {Function|null}
 */
function getEasing(name) {
  if (typeof name === 'function') return name;
  if (typeof name !== 'string') return null;
  const parts = name.split('.');
  const category = Easing[parts[0]];
  if (!category) return null;
  if (parts.length === 1) {
    if (typeof category === 'function') return category;
    if (typeof category === 'object') {
      return category.InOut || category.In || category.None || null;
    }
    return null;
  }
  const variant = category[parts[1]];
  return typeof variant === 'function' ? variant : null;
}

/* -------------------------------------------------------------- *
 * Default Easing object
 * -------------------------------------------------------------- */
const Easing = {
  // Primary categories
  Linear,
  Quadratic,
  Cubic,
  Quartic,
  Quintic,
  Sinusoidal,
  Exponential,
  Circular,
  Elastic,
  Back,
  Bounce,
  Step,
  Smooth,
  SineWave,

  // GSAP-style aliases
  Sine: Sinusoidal,
  Expo: Exponential,
  Circ: Circular,
  Quad: Quadratic,
  Quart: Quartic,
  Quint: Quintic,
  Power0: Linear,
  Power1: Quadratic,
  Power2: Cubic,
  Power3: Quartic,
  Power4: Quintic,
  None: Linear,

  // Factories
  Bezier,
  RoughEase,
  SlowMo,
  Steps,

  // Registry
  get: getEasing,

  /**
   * Get all available easing names (for inspection / debug).
   * @returns {string[]}
   */
  names() {
    return Object.keys(Easing).filter((k) => typeof Easing[k] !== 'function' || Easing[k].In);
  }
};

export default Easing;

// Named exports
export {
  Linear,
  Quadratic,
  Cubic,
  Quartic,
  Quintic,
  Sinusoidal,
  Exponential,
  Circular,
  Elastic,
  Back,
  Bounce,
  Step,
  Smooth,
  SineWave,
  Bezier,
  RoughEase,
  SlowMo,
  Steps,
  getEasing
};
