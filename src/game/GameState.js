/**
 * @module game/GameState
 * @description Finite-state machine for game logic.
 *
 * This is INTENTIONALLY distinct from `SceneManager`:
 *   - SceneManager manages RENDERING scenes (menu, level1, pause overlay).
 *   - GameState manages logical game phases (idle → running → paused →
 *     gameover) and the events that cause transitions between them.
 *
 * A GameState instance holds:
 *   - a set of named states, each with optional onEnter/onExit/onUpdate hooks
 *   - a set of (from, event) → to transitions
 *   - a current state
 *
 * `handle(event)` looks up the transition for (currentState, event) and,
 * if one exists, fires the current state's onExit, swaps to the new state,
 * and fires the new state's onEnter. By default, handling an event with no
 * matching transition throws; set `allowInvalidTransitions = true` to
 * silently ignore instead.
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

export class GameState {
  /**
   * @param {string} initialState — name of the starting state.
   *     The state need not be pre-registered via addState(); it will be
   *     treated as a state with no hooks until addState() is called for it.
   */
  constructor(initialState) {
    if (!initialState || typeof initialState !== 'string') {
      throw new Error('GameState: initialState (string) is required');
    }
    /** @type {Map<string, {onEnter:Function|null, onExit:Function|null, onUpdate:Function|null}>} */
    this._states = new Map();
    /** @type {Map<string, string>} — key `${from}->${event}` → to */
    this._transitions = new Map();
    /** @type {string} */
    this._current = initialState;

    /** When false, handle() throws on invalid transitions. */
    this._allowInvalidTransitions = false;

    /** @type {Map<string, Function[]>} */
    this._enterCallbacks = new Map();
    /** @type {Map<string, Function[]>} */
    this._exitCallbacks = new Map();
    /** @type {Map<string, Function[]>} */
    this._updateCallbacks = new Map();

    /** Optional context passed to every hook (set via setContext). */
    this._context = undefined;
  }

  /* ----------------------------- state registration ----------------------------- */

  /**
   * Register a named state with optional lifecycle hooks.
   * @param {string} name
   * @param {Object} [hooks]
   * @param {Function} [hooks.onEnter]   — fired when this state becomes active; receives (prevState, context)
   * @param {Function} [hooks.onExit]    — fired when this state is left; receives (nextState, context)
   * @param {Function} [hooks.onUpdate]  — fired every update() while this state is active; receives (dt, context)
   * @returns {GameState} this
   */
  addState(name, hooks = {}) {
    if (!name) throw new Error('GameState.addState: name is required');
    this._states.set(name, {
      onEnter:  typeof hooks.onEnter  === 'function' ? hooks.onEnter  : null,
      onExit:   typeof hooks.onExit   === 'function' ? hooks.onExit   : null,
      onUpdate: typeof hooks.onUpdate === 'function' ? hooks.onUpdate : null
    });
    return this;
  }

  /* ----------------------------- transition registration ----------------------------- */

  /**
   * Register a transition: when in state `from` and `handle(event)` is
   * called, switch to state `to`.
   * @param {string} from
   * @param {string} to
   * @param {string} event
   * @returns {GameState} this
   */
  addTransition(from, to, event) {
    if (!from || !to || !event) {
      throw new Error('GameState.addTransition: from, to, and event are all required');
    }
    this._transitions.set(`${from}->${event}`, to);
    return this;
  }

  /* ----------------------------- queries ----------------------------- */

  /** True if there is a transition out of the current state for `event`. */
  canHandle(event) {
    return this._transitions.has(`${this._current}->${event}`);
  }

  /** Returns the state name that `event` would transition to, or undefined. */
  peekTransition(event) {
    return this._transitions.get(`${this._current}->${event}`);
  }

  /** Current state name. */
  getCurrentState() { return this._current; }

  /** All registered state names. */
  getStates() { return Array.from(this._states.keys()); }

  /** All registered transitions as an array of {from, to, event}. */
  getTransitions() {
    const out = [];
    for (const [key, to] of this._transitions) {
      const idx = key.indexOf('->');
      const from = key.slice(0, idx);
      const event = key.slice(idx + 2);
      out.push({ from, to, event });
    }
    return out;
  }

  /* ----------------------------- event handling ----------------------------- */

  /**
   * Attempt to transition based on `event`.
   *
   * If a matching transition exists:
   *   1. Call the current state's onExit(nextState, context).
   *   2. Call any external onExit(state) callbacks registered for the
   *      current state.
   *   3. Update _current.
   *   4. Call the new state's onEnter(prevState, context).
   *   5. Call any external onEnter(state) callbacks registered for the
   *      new state.
   *   Returns true.
   *
   * If no matching transition exists:
   *   - If `allowInvalidTransitions` is true → return false silently.
   *   - Otherwise → throw an Error.
   *
   * @param {string} event
   * @returns {boolean} true if a transition occurred
   */
  handle(event) {
    const key = `${this._current}->${event}`;
    const to = this._transitions.get(key);
    if (to === undefined) {
      if (this._allowInvalidTransitions) return false;
      throw new Error(`[GameState] No transition from "${this._current}" for event "${event}"`);
    }
    const prev = this._current;
    // No-op if transitioning to the same state? We still fire exit/enter so
    // callers can use self-transitions as "reset" hooks.
    const fromState = this._states.get(prev);
    if (fromState && fromState.onExit) {
      try { fromState.onExit(to, this._context); } catch (e) { console.error(`[GameState] onExit("${prev}") error:`, e); }
    }
    // External onExit callbacks
    this._fireCallbacks(this._exitCallbacks.get(prev), to, prev);

    this._current = to;

    const toState = this._states.get(to);
    if (toState && toState.onEnter) {
      try { toState.onEnter(prev, this._context); } catch (e) { console.error(`[GameState] onEnter("${to}") error:`, e); }
    }
    // External onEnter callbacks
    this._fireCallbacks(this._enterCallbacks.get(to), prev, to);
    return true;
  }

  /**
   * Force a transition to `state` without going through handle()/event
   * lookup. Useful for "reset to idle" type scenarios. Still fires
   * onExit/onEnter hooks.
   */
  forceState(state) {
    if (state === this._current) return this;
    const prev = this._current;
    const fromState = this._states.get(prev);
    if (fromState && fromState.onExit) {
      try { fromState.onExit(state, this._context); } catch (e) { console.error(`[GameState] onExit("${prev}") error:`, e); }
    }
    this._fireCallbacks(this._exitCallbacks.get(prev), state, prev);
    this._current = state;
    const toState = this._states.get(state);
    if (toState && toState.onEnter) {
      try { toState.onEnter(prev, this._context); } catch (e) { console.error(`[GameState] onEnter("${state}") error:`, e); }
    }
    this._fireCallbacks(this._enterCallbacks.get(state), prev, state);
    return this;
  }

  /* ----------------------------- external hooks ----------------------------- */

  /**
   * Register an external callback to fire when `state` is entered.
   * cb receives (prevState, state).
   */
  onEnter(state, cb) { return this._addCb(this._enterCallbacks, state, cb); }

  /**
   * Register an external callback to fire when `state` is exited.
   * cb receives (nextState, state).
   */
  onExit(state, cb) { return this._addCb(this._exitCallbacks, state, cb); }

  /**
   * Register an external callback to fire on every update() while `state`
   * is active. cb receives (dt, state).
   */
  onUpdate(state, cb) { return this._addCb(this._updateCallbacks, state, cb); }

  /* ----------------------------- per-frame update ----------------------------- */

  /**
   * Dispatch a per-frame update to the current state's onUpdate hook
   * (and any registered onUpdate callbacks).
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    const st = this._states.get(this._current);
    if (st && st.onUpdate) {
      try { st.onUpdate(dt, this._context); } catch (e) { console.error(`[GameState] onUpdate("${this._current}") error:`, e); }
    }
    this._fireCallbacks(this._updateCallbacks.get(this._current), dt, this._current);
    return this;
  }

  /* ----------------------------- config ----------------------------- */

  /**
   * When false (default), handle() throws if no matching transition exists.
   * When true, handle() returns false instead of throwing.
   */
  get allowInvalidTransitions() { return this._allowInvalidTransitions; }
  set allowInvalidTransitions(v) { this._allowInvalidTransitions = !!v; }

  /**
   * Attach a context object that will be passed to every hook as the
   * last argument. Useful for sharing a "world" or "game" reference.
   */
  setContext(ctx) { this._context = ctx; return this; }
  get context() { return this._context; }

  /* ----------------------------- internals ----------------------------- */

  _addCb(map, key, cb) {
    if (typeof cb !== 'function') return this;
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(cb);
    return this;
  }

  _fireCallbacks(arr, ...args) {
    if (!arr) return;
    for (let i = 0; i < arr.length; i++) {
      try { arr[i](...args); } catch (e) { console.error('[GameState] callback error:', e); }
    }
  }
}

export default GameState;
