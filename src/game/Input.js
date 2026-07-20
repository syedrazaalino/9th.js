/**
 * @module game/Input
 * @description Unified input system for 9th.js — keyboard, mouse, touch,
 * gamepad, and pointer lock in one cohesive API.
 *
 * Design notes
 * ------------
 * - All key/button queries use the **standard W3C code names** that
 *   `KeyboardEvent.code` produces: 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space',
 *   'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft',
 *   'ShiftRight', 'ControlLeft', 'ControlRight', 'Digit0', 'Digit1', ...
 *   This is layout-independent (so WASD works on AZERTY keyboards too,
 *   since 'KeyW' is always the physical key in the W row/column-2 slot).
 *
 * - Per-frame state tracking uses THREE sets per device:
 *     * down         — currently held
 *     * justPressed  — became down during this frame (cleared on next update())
 *     * justReleased — became up during this frame (cleared on next update())
 *   Call `input.update()` ONCE per frame, BEFORE your game logic reads the
 *   just-pressed / just-released flags.
 *
 * - The class is **headless-safe**: in Node.js (no window/document/navigator)
 *   it instantiates cleanly with empty state and silently no-ops on all DOM
 *   operations. This lets unit tests construct an Input without polyfills.
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

/* ----------------------------- environment ----------------------------- */

const HAS_WINDOW = typeof window !== 'undefined';
const HAS_DOCUMENT = typeof document !== 'undefined';
const HAS_NAVIGATOR = typeof navigator !== 'undefined';

function _now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/* ----------------------------- constants ----------------------------- */

/**
 * Standard W3C mouse button indices.
 */
export const MOUSE_BUTTONS = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2
};
// Also expose as bare constants for convenience
export const MOUSE_LEFT = 0;
export const MOUSE_MIDDLE = 1;
export const MOUSE_RIGHT = 2;

/**
 * Standard W3C gamepad button name → button-index mapping.
 * Index 6 (LT) and 7 (RT) are analog triggers, also represented in
 * `getGamepadState().triggers` as a 0..1 float.
 */
export const GAMEPAD_BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  Back: 8,
  Start: 9,
  LS: 10,
  RS: 11,
  Up: 12,
  Down: 13,
  Left: 14,
  Right: 15
};

const GAMEPAD_BUTTON_NAMES = Object.keys(GAMEPAD_BUTTONS); // 16 names
const GAMEPAD_BUTTON_COUNT = 16;

/* ----------------------------- class ----------------------------- */

export class Input {
  /**
   * @param {Object} [options]
   * @param {HTMLElement|Window} [options.target=window] — element to attach
   *     mouse / touch / pointer-lock listeners to (typically a canvas).
   * @param {boolean} [options.pointerLock=false] — if true, the manager is
   *     considered pointer-lock-aware; callers still need to call
   *     requestPointerLock() from a user gesture (browser requirement).
   * @param {boolean} [options.preventDefault=true] — swallow default browser
   *     behavior for keys / wheel / touch on the target so the game gets
   *     clean input (no scrolling, no context menu, etc.).
   * @param {number} [options.gamepadDeadzone=0.1] — analog-stick deadzone.
   */
  constructor(options = {}) {
    const {
      target = null,
      pointerLock = false,
      preventDefault = true,
      gamepadDeadzone = 0.1
    } = options;

    this._target = target || (HAS_WINDOW ? window : null);
    this._pointerLockEnabled = !!pointerLock;
    this._preventDefault = !!preventDefault;
    this._gamepadDeadzone = gamepadDeadzone;

    /* ---- Keyboard ---- */
    this._keysDown = new Set();
    this._keysJustPressed = new Set();
    this._keysJustReleased = new Set();
    this._keyDownOnceFired = new Set(); // tracks keys whose onKeyDownOnce already fired
    this._keyDownCallbacks = new Map(); // code -> Array<cb>
    this._keyUpCallbacks = new Map(); //   code -> Array<cb>
    this._keyDownOnceCallbacks = new Map(); // code -> Array<cb>

    /* ---- Mouse ---- */
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    this._mouseDown = new Set();
    this._mouseJustPressed = new Set();
    this._mouseJustReleased = new Set();
    this._mouseDownCallbacks = [];
    this._mouseUpCallbacks = [];
    this._mouseMoveCallbacks = [];
    this._wheelCallbacks = [];
    this._contextMenuCallbacks = [];

    /* ---- Touch ---- */
    this.touches = []; // [{id, x, y, startX, startY}]
    this._touchStartCallbacks = [];
    this._touchMoveCallbacks = [];
    this._touchEndCallbacks = [];
    this._lastTouchDistance = 0;
    this._pinchScale = 1;

    /* ---- Gamepad ---- */
    this._prevGamepadButtons = []; // per-index: Array<bool>
    this._gamepadConnectCallbacks = [];
    this._gamepadDisconnectCallbacks = [];
    this._gamepadButtonCallbacks = new Map(); // buttonName -> Array<cb>
    this._knownGamepads = new Set();

    /* ---- Pointer lock ---- */
    this.isPointerLocked = false;
    this._pointerLockChangeCallbacks = [];

    /* ---- Bound handlers (for removeEventListener) ---- */
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onGamepadConnected = this._onGamepadConnected.bind(this);
    this._onGamepadDisconnected = this._onGamepadDisconnected.bind(this);

    this._disposed = false;
    this._attachListeners();
  }

  /* ================================================================== */
  /*                              Keyboard                              */
  /* ================================================================== */

  /** True while `code` is currently held down. */
  isKeyDown(code) { return this._keysDown.has(code); }
  /** True only on the frame `code` transitioned from up → down. */
  isKeyJustPressed(code) { return this._keysJustPressed.has(code); }
  /** True only on the frame `code` transitioned from down → up. */
  isKeyJustReleased(code) { return this._keysJustReleased.has(code); }

  /**
   * Register a callback that fires every frame the key is held down.
   * (Fires on every keydown event — the browser auto-repeats keydown
   * while a key is held, so this matches "while-held" semantics.)
   */
  onKeyDown(code, cb) { return this._addCb(this._keyDownCallbacks, code, cb); }
  /** Alias of `onKeyDown`. */
  onKeyPress(code, cb) { return this.onKeyDown(code, cb); }
  /** Register a callback that fires when the key is released. */
  onKeyUp(code, cb) { return this._addCb(this._keyUpCallbacks, code, cb); }
  /**
   * Register a callback that fires ONCE per key press (on the initial
   * keydown, not on auto-repeat).
   */
  onKeyDownOnce(code, cb) { return this._addCb(this._keyDownOnceCallbacks, code, cb); }

  /* ================================================================== */
  /*                               Mouse                                */
  /* ================================================================== */

  isMouseDown(button = 0) { return this._mouseDown.has(button); }
  isMouseJustPressed(button = 0) { return this._mouseJustPressed.has(button); }
  isMouseJustReleased(button = 0) { return this._mouseJustReleased.has(button); }

  /** cb receives (event, button) */
  onMouseDown(cb) { this._mouseDownCallbacks.push(cb); return this; }
  /** cb receives (event, button) */
  onMouseUp(cb) { this._mouseUpCallbacks.push(cb); return this; }
  /** cb receives (deltaX, deltaY, event) — deltas are per-event, not per-frame. */
  onMouseMove(cb) { this._mouseMoveCallbacks.push(cb); return this; }
  /** cb receives (deltaY, event). */
  onWheel(cb) { this._wheelCallbacks.push(cb); return this; }
  /** cb receives (event). Return false from cb to allow default menu. */
  onContextMenu(cb) { this._contextMenuCallbacks.push(cb); return this; }

  /* ================================================================== */
  /*                               Touch                                */
  /* ================================================================== */

  /** cb receives (touches, event) where touches is the live this.touches array. */
  onTouchStart(cb) { this._touchStartCallbacks.push(cb); return this; }
  onTouchMove(cb) { this._touchMoveCallbacks.push(cb); return this; }
  onTouchEnd(cb) { this._touchEndCallbacks.push(cb); return this; }

  /**
   * Returns the pinch scale factor relative to the last frame.
   *   > 1  → fingers spreading apart (zoom in)
   *   < 1  → fingers coming together (zoom out)
   *   1    → no pinch / fewer than 2 touches
   *
   * Computed from the first two active touches.
   */
  getPinchScale() { return this._pinchScale; }

  /* ================================================================== */
  /*                              Gamepad                               */
  /* ================================================================== */

  /** cb receives (gamepad, event). */
  onGamepadConnect(cb) { this._gamepadConnectCallbacks.push(cb); return this; }
  /** cb receives (gamepad, event). */
  onGamepadDisconnect(cb) { this._gamepadDisconnectCallbacks.push(cb); return this; }

  /**
   * Register a callback that fires once per press of a named gamepad button.
   * Button names: 'A','B','X','Y','LB','RB','LT','RT','Start','Back',
   *               'LS','RS','Up','Down','Left','Right'
   * cb receives (buttonName, gamepad).
   */
  onGamepadButton(buttonName, cb) {
    if (!(buttonName in GAMEPAD_BUTTONS)) {
      console.warn(`[Input] Unknown gamepad button name: ${buttonName}`);
      return this;
    }
    return this._addCb(this._gamepadButtonCallbacks, buttonName, cb);
  }

  /**
   * Polls navigator.getGamepads() and returns the state for the given index.
   * @returns {{connected:boolean, id:string, buttons:boolean[],
   *            axes:number[], triggers:{left:number, right:number}} | null}
   */
  getGamepadState(index = 0) {
    if (!HAS_NAVIGATOR || typeof navigator.getGamepads !== 'function') return null;
    const pads = navigator.getGamepads();
    const gp = pads && pads[index];
    if (!gp) return null;

    const buttons = new Array(GAMEPAD_BUTTON_COUNT).fill(false);
    if (gp.buttons) {
      const n = Math.min(GAMEPAD_BUTTON_COUNT, gp.buttons.length);
      for (let i = 0; i < n; i++) {
        const b = gp.buttons[i];
        buttons[i] = !!(b && (b.pressed || (typeof b.value === 'number' && b.value > 0.5)));
      }
    }

    const rawAxes = gp.axes || [];
    const axes = new Array(rawAxes.length);
    const dz = this._gamepadDeadzone;
    for (let i = 0; i < rawAxes.length; i++) {
      const v = rawAxes[i] || 0;
      if (Math.abs(v) < dz) {
        axes[i] = 0;
      } else {
        // Rescale past the deadzone so the stick ramps smoothly from 0 → 1
        const sign = v < 0 ? -1 : 1;
        axes[i] = sign * (Math.abs(v) - dz) / (1 - dz);
      }
    }

    // Analog triggers (always 0..1, NOT deadzoned here — caller can decide)
    const triggers = {
      left:  (gp.buttons && gp.buttons[6]) ? (gp.buttons[6].value || 0) : 0,
      right: (gp.buttons && gp.buttons[7]) ? (gp.buttons[7].value || 0) : 0
    };

    return {
      connected: !!gp.connected,
      id: gp.id || '',
      buttons,
      axes,
      triggers
    };
  }

  /** Current deadzone threshold applied to analog axes. */
  get gamepadDeadzone() { return this._gamepadDeadzone; }
  set gamepadDeadzone(v) { this._gamepadDeadzone = Math.max(0, Math.min(1, v)); }

  /* ================================================================== */
  /*                           Pointer lock                             */
  /* ================================================================== */

  /** Request pointer lock on the target element. Must be called from a user gesture. */
  requestPointerLock() {
    if (this._target && typeof this._target.requestPointerLock === 'function') {
      try { this._target.requestPointerLock(); } catch (_) { /* ignore */ }
    } else if (HAS_DOCUMENT && typeof document.body !== 'undefined' &&
               typeof document.body.requestPointerLock === 'function') {
      try { document.body.requestPointerLock(); } catch (_) { /* ignore */ }
    }
    return this;
  }

  exitPointerLock() {
    if (HAS_DOCUMENT && typeof document.exitPointerLock === 'function') {
      try { document.exitPointerLock(); } catch (_) { /* ignore */ }
    }
    return this;
  }

  /** cb receives (isLocked, event). */
  onPointerLockChange(cb) { this._pointerLockChangeCallbacks.push(cb); return this; }

  /* ================================================================== */
  /*                       Per-frame state flush                        */
  /* ================================================================== */

  /**
   * Call once per frame (BEFORE reading just-pressed / just-released
   * flags in your game logic, AFTER event handlers have run).
   *
   * - Clears the justPressed / justReleased sets from the previous frame.
   * - Polls gamepads (the W3C Gamepad API requires polling; events only
   *   fire for connect/disconnect, not for button presses).
   * - Resets per-frame accumulators (mouseDelta, wheelDelta, pinchScale).
   */
  update() {
    // Flush one-frame flags
    this._keysJustPressed.clear();
    this._keysJustReleased.clear();
    this._mouseJustPressed.clear();
    this._mouseJustReleased.clear();

    // Poll gamepads (fires onGamepadButton callbacks on rising edges)
    this._pollGamepads();

    // Reset per-frame accumulators
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    this._pinchScale = 1;
  }

  /* ================================================================== */
  /*                             Dispose                                */
  /* ================================================================== */

  /** Remove all DOM listeners and free internal state. */
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._detachListeners();

    this._keysDown.clear();
    this._keysJustPressed.clear();
    this._keysJustReleased.clear();
    this._keyDownOnceFired.clear();
    this._keyDownCallbacks.clear();
    this._keyUpCallbacks.clear();
    this._keyDownOnceCallbacks.clear();

    this._mouseDown.clear();
    this._mouseJustPressed.clear();
    this._mouseJustReleased.clear();
    this._mouseDownCallbacks.length = 0;
    this._mouseUpCallbacks.length = 0;
    this._mouseMoveCallbacks.length = 0;
    this._wheelCallbacks.length = 0;
    this._contextMenuCallbacks.length = 0;

    this.touches.length = 0;
    this._touchStartCallbacks.length = 0;
    this._touchMoveCallbacks.length = 0;
    this._touchEndCallbacks.length = 0;

    this._prevGamepadButtons.length = 0;
    this._gamepadConnectCallbacks.length = 0;
    this._gamepadDisconnectCallbacks.length = 0;
    this._gamepadButtonCallbacks.clear();
    this._knownGamepads.clear();

    this._pointerLockChangeCallbacks.length = 0;
  }

  /* ================================================================== */
  /*                            Internals                               */
  /* ================================================================== */

  _addCb(map, key, cb) {
    if (typeof cb !== 'function') return this;
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(cb);
    return this;
  }

  _fireCbs(arr, ...args) {
    if (!arr) return;
    for (let i = 0; i < arr.length; i++) {
      try { arr[i](...args); } catch (err) { console.error('[Input] callback error:', err); }
    }
  }

  _attachListeners() {
    if (!HAS_WINDOW) return;
    const tgt = this._target;

    // Keyboard: attach to window so we get keys even when the canvas isn't focused
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    // Mouse: attach to the target (canvas), but listen for mouseup on window
    // so we catch releases that happen off-canvas.
    const mouseTarget = (tgt && typeof tgt.addEventListener === 'function') ? tgt : window;
    mouseTarget.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    mouseTarget.addEventListener('mousemove', this._onMouseMove);
    mouseTarget.addEventListener('wheel', this._onWheel, { passive: false });
    mouseTarget.addEventListener('contextmenu', this._onContextMenu);

    // Touch: only on a real element target (not window)
    if (tgt && typeof tgt.addEventListener === 'function' && tgt !== window) {
      tgt.addEventListener('touchstart', this._onTouchStart, { passive: false });
      tgt.addEventListener('touchmove', this._onTouchMove, { passive: false });
      tgt.addEventListener('touchend', this._onTouchEnd, { passive: false });
      tgt.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    }

    if (HAS_DOCUMENT) {
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
      document.addEventListener('mozpointerlockchange', this._onPointerLockChange);
      document.addEventListener('webkitpointerlockchange', this._onPointerLockChange);
    }

    window.addEventListener('gamepadconnected', this._onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this._onGamepadDisconnected);
  }

  _detachListeners() {
    if (!HAS_WINDOW) return;
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('gamepadconnected', this._onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this._onGamepadDisconnected);

    const tgt = this._target;
    if (tgt && typeof tgt.removeEventListener === 'function') {
      tgt.removeEventListener('mousedown', this._onMouseDown);
      tgt.removeEventListener('mousemove', this._onMouseMove);
      tgt.removeEventListener('wheel', this._onWheel);
      tgt.removeEventListener('contextmenu', this._onContextMenu);
      tgt.removeEventListener('touchstart', this._onTouchStart);
      tgt.removeEventListener('touchmove', this._onTouchMove);
      tgt.removeEventListener('touchend', this._onTouchEnd);
      tgt.removeEventListener('touchcancel', this._onTouchEnd);
    }
    if (HAS_DOCUMENT) {
      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
      document.removeEventListener('mozpointerlockchange', this._onPointerLockChange);
      document.removeEventListener('webkitpointerlockchange', this._onPointerLockChange);
    }
  }

  /* ----------- keyboard handlers ----------- */

  _onKeyDown(e) {
    const code = e.code;
    if (!code) return;
    if (!this._keysDown.has(code)) {
      // Transition up → down: mark as justPressed, fire onKeyDown +
      // onKeyDownOnce (only if it hasn't fired for this press yet).
      this._keysJustPressed.add(code);
      this._fireCbs(this._keyDownCallbacks.get(code), e, code);
      if (!this._keyDownOnceFired.has(code)) {
        this._keyDownOnceFired.add(code);
        this._fireCbs(this._keyDownOnceCallbacks.get(code), e, code);
      }
    }
    this._keysDown.add(code);

    if (this._preventDefault) {
      try { e.preventDefault(); } catch (_) { /* ignore */ }
    }
  }

  _onKeyUp(e) {
    const code = e.code;
    if (!code) return;
    if (this._keysDown.has(code)) {
      this._keysJustReleased.add(code);
      this._fireCbs(this._keyUpCallbacks.get(code), e, code);
    }
    this._keysDown.delete(code);
    this._keyDownOnceFired.delete(code);
  }

  _onBlur() {
    // When the window loses focus, treat all keys / mouse buttons as released
    // so the player doesn't get "stuck key" bugs after alt-tabbing.
    for (const code of this._keysDown) this._keysJustReleased.add(code);
    this._keysDown.clear();
    this._keyDownOnceFired.clear();
    for (const btn of this._mouseDown) this._mouseJustReleased.add(btn);
    this._mouseDown.clear();
  }

  /* ----------- mouse handlers ----------- */

  _onMouseDown(e) {
    const btn = e.button;
    if (!this._mouseDown.has(btn)) this._mouseJustPressed.add(btn);
    this._mouseDown.add(btn);
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this._fireCbs(this._mouseDownCallbacks, e, btn);
  }

  _onMouseUp(e) {
    const btn = e.button;
    if (this._mouseDown.has(btn)) this._mouseJustReleased.add(btn);
    this._mouseDown.delete(btn);
    this._fireCbs(this._mouseUpCallbacks, e, btn);
  }

  _onMouseMove(e) {
    let dx, dy;
    if (this.isPointerLocked && typeof e.movementX === 'number') {
      // Pointer-lock: movementX/Y are the per-event deltas
      dx = e.movementX;
      dy = e.movementY;
    } else {
      dx = e.clientX - this.mouseX;
      dy = e.clientY - this.mouseY;
    }
    this.mouseDeltaX += dx;
    this.mouseDeltaY += dy;
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    for (let i = 0; i < this._mouseMoveCallbacks.length; i++) {
      try { this._mouseMoveCallbacks[i](dx, dy, e); } catch (err) { console.error('[Input] mousemove callback error:', err); }
    }
  }

  _onWheel(e) {
    if (this._preventDefault) {
      try { e.preventDefault(); } catch (_) { /* ignore */ }
    }
    this.wheelDelta += e.deltaY;
    for (let i = 0; i < this._wheelCallbacks.length; i++) {
      try { this._wheelCallbacks[i](e.deltaY, e); } catch (err) { console.error('[Input] wheel callback error:', err); }
    }
  }

  _onContextMenu(e) {
    let allowDefault = true;
    for (let i = 0; i < this._contextMenuCallbacks.length; i++) {
      try {
        const r = this._contextMenuCallbacks[i](e);
        if (r !== false) allowDefault = false;
      } catch (err) { console.error('[Input] contextmenu callback error:', err); }
    }
    // If any callback is registered and didn't explicitly return false,
    // suppress the browser's context menu (game-style behavior).
    if (this._contextMenuCallbacks.length > 0 && !allowDefault) {
      try { e.preventDefault(); } catch (_) { /* ignore */ }
    } else if (this._preventDefault && this._contextMenuCallbacks.length === 0) {
      // Also suppress if user opted into preventDefault globally
      try { e.preventDefault(); } catch (_) { /* ignore */ }
    }
  }

  /* ----------- touch handlers ----------- */

  _onTouchStart(e) {
    if (this._preventDefault) { try { e.preventDefault(); } catch (_) {} }
    const changed = e.changedTouches;
    for (let i = 0; i < changed.length; i++) {
      const t = changed[i];
      if (this.touches.length >= 10) break;
      this.touches.push({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        startX: t.clientX,
        startY: t.clientY
      });
    }
    this._refreshPinchDistance();
    for (let i = 0; i < this._touchStartCallbacks.length; i++) {
      try { this._touchStartCallbacks[i](this.touches, e); } catch (err) { console.error('[Input] touchstart callback error:', err); }
    }
  }

  _onTouchMove(e) {
    if (this._preventDefault) { try { e.preventDefault(); } catch (_) {} }
    const changed = e.changedTouches;
    for (let i = 0; i < changed.length; i++) {
      const t = changed[i];
      const touch = this._findTouch(t.identifier);
      if (touch) {
        touch.x = t.clientX;
        touch.y = t.clientY;
      }
    }
    this._updatePinchScale();
    for (let i = 0; i < this._touchMoveCallbacks.length; i++) {
      try { this._touchMoveCallbacks[i](this.touches, e); } catch (err) { console.error('[Input] touchmove callback error:', err); }
    }
  }

  _onTouchEnd(e) {
    const changed = e.changedTouches;
    for (let i = 0; i < changed.length; i++) {
      const t = changed[i];
      const idx = this._findTouchIndex(t.identifier);
      if (idx !== -1) this.touches.splice(idx, 1);
    }
    this._refreshPinchDistance();
    for (let i = 0; i < this._touchEndCallbacks.length; i++) {
      try { this._touchEndCallbacks[i](this.touches, e); } catch (err) { console.error('[Input] touchend callback error:', err); }
    }
  }

  _findTouch(id) {
    for (let i = 0; i < this.touches.length; i++) {
      if (this.touches[i].id === id) return this.touches[i];
    }
    return null;
  }

  _findTouchIndex(id) {
    for (let i = 0; i < this.touches.length; i++) {
      if (this.touches[i].id === id) return i;
    }
    return -1;
  }

  /** Recompute the baseline pinch distance (called on touch start / end). */
  _refreshPinchDistance() {
    if (this.touches.length >= 2) {
      const a = this.touches[0];
      const b = this.touches[1];
      this._lastTouchDistance = Math.hypot(b.x - a.x, b.y - a.y);
    } else {
      this._lastTouchDistance = 0;
    }
  }

  /** Compute the per-frame pinch scale from the new touch positions. */
  _updatePinchScale() {
    if (this.touches.length >= 2 && this._lastTouchDistance > 0) {
      const a = this.touches[0];
      const b = this.touches[1];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      this._pinchScale = dist / this._lastTouchDistance;
      this._lastTouchDistance = dist;
    } else {
      this._pinchScale = 1;
    }
  }

  /* ----------- pointer lock handler ----------- */

  _onPointerLockChange(e) {
    if (HAS_DOCUMENT) {
      const el = document.pointerLockElement ||
                 document.mozPointerLockElement ||
                 document.webkitPointerLockElement;
      this.isPointerLocked = !!el && (!this._target || el === this._target || el === document.body);
      // Be lenient: if document.pointerLockElement is set to anything,
      // treat it as locked (caller can compare to target if needed).
      if (!this.isPointerLocked && el) this.isPointerLocked = true;
    }
    for (let i = 0; i < this._pointerLockChangeCallbacks.length; i++) {
      try { this._pointerLockChangeCallbacks[i](this.isPointerLocked, e); } catch (err) { console.error('[Input] pointerlockchange callback error:', err); }
    }
  }

  /* ----------- gamepad handlers ----------- */

  _onGamepadConnected(e) {
    if (!e || !e.gamepad) return;
    this._knownGamepads.add(e.gamepad.index);
    for (let i = 0; i < this._gamepadConnectCallbacks.length; i++) {
      try { this._gamepadConnectCallbacks[i](e.gamepad, e); } catch (err) { console.error('[Input] gamepadconnected callback error:', err); }
    }
  }

  _onGamepadDisconnected(e) {
    if (!e || !e.gamepad) return;
    this._knownGamepads.delete(e.gamepad.index);
    this._prevGamepadButtons[e.gamepad.index] = null;
    for (let i = 0; i < this._gamepadDisconnectCallbacks.length; i++) {
      try { this._gamepadDisconnectCallbacks[i](e.gamepad, e); } catch (err) { console.error('[Input] gamepaddisconnected callback error:', err); }
    }
  }

  /**
   * Polls navigator.getGamepads() once per frame and fires button callbacks
   * on rising edges. This is the ONLY way to read button presses — the W3C
   * Gamepad API does not emit per-button events.
   */
  _pollGamepads() {
    if (!HAS_NAVIGATOR || typeof navigator.getGamepads !== 'function') return;
    const pads = navigator.getGamepads();
    if (!pads) return;

    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      if (!gp) continue;

      const prev = this._prevGamepadButtons[i] || new Array(GAMEPAD_BUTTON_COUNT).fill(false);
      const curr = new Array(GAMEPAD_BUTTON_COUNT).fill(false);
      if (gp.buttons) {
        const n = Math.min(GAMEPAD_BUTTON_COUNT, gp.buttons.length);
        for (let b = 0; b < n; b++) {
          const btn = gp.buttons[b];
          curr[b] = !!(btn && (btn.pressed || (typeof btn.value === 'number' && btn.value > 0.5)));
        }
      }
      // Rising edge: fire onGamepadButton callbacks
      for (let b = 0; b < GAMEPAD_BUTTON_COUNT; b++) {
        if (curr[b] && !prev[b]) {
          const name = GAMEPAD_BUTTON_NAMES[b];
          if (!name) continue;
          const arr = this._gamepadButtonCallbacks.get(name);
          if (arr) {
            for (let k = 0; k < arr.length; k++) {
              try { arr[k](name, gp); } catch (err) { console.error('[Input] gamepad button callback error:', err); }
            }
          }
        }
      }
      this._prevGamepadButtons[i] = curr;

      // If we never got a gamepadconnected event for this pad (common in
      // browsers that only fire it after the user presses a button), fire
      // it now so consumers learn about the gamepad.
      if (!this._knownGamepads.has(gp.index)) {
        this._knownGamepads.add(gp.index);
        for (let k = 0; k < this._gamepadConnectCallbacks.length; k++) {
          try { this._gamepadConnectCallbacks[k](gp); } catch (err) { console.error('[Input] gamepadconnected callback error:', err); }
        }
      }
    }
  }
}

export default Input;
