/**
 * @module game/SceneManager
 * @description Scene stack with transitions, overlays, and loading screens.
 *
 * Features
 * --------
 *  - `add(name, scene)` / `remove(name)` — register/unregister scenes
 *  - `switchTo(name)` — replace the active scene (clears the stack)
 *  - `push(name)` — push a scene on top (e.g. pause overlay)
 *  - `pop()` — pop the top scene and resume the one beneath
 *  - `transition(name, { fadeOut, fadeIn, onFadeOut, onFadeIn })` —
 *    smooth cross-fade using the existing Tween system
 *  - `update(dt)` / `render(renderer, camera)` — dispatch to the active scene(s)
 *
 * Scene lifecycle hooks (any of these are optional):
 *   scene.onEnter()
 *   scene.onExit()
 *   scene.onUpdate(dt)
 *   scene.onRender(renderer, camera)        // or scene.render(renderer, camera)
 *   scene.onPause()                          // when another scene is pushed on top
 *   scene.onResume()                         // when the scene above is popped
 *
 * Rendering: all scenes in the stack are rendered bottom-up, so overlay
 * scenes (pause menus, HUDs) draw on top of the underlying scene. Only the
 * TOP scene's onUpdate is called each frame — lower scenes are "paused".
 *
 * @author 9th.js Team
 * @version 1.0.0
 */

import { Tween } from '../tween/Tween.js';

export class SceneManager {
  constructor() {
    /** @type {Map<string, object>} name -> Scene */
    this._scenes = new Map();
    /** @type {Array<{name:string, scene:object}>} */
    this._stack = [];

    // Fade overlay state (0 = fully transparent, 1 = fully opaque)
    this._fadeOpacity = 0;
    this._transitioning = false;
    /** @type {Tween|null} */
    this._activeTween = null;

    // Virtual clock (ms). Transitions are driven by `update(dt)` calls,
    // NOT by real wall-clock time — so a paused game loop pauses scene
    // transitions too, and unit tests can advance time deterministically.
    this._virtualTime = 0;

    // Optional application-supplied overlay renderer: cb(opacity)
    // If set, SceneManager will call it during render() with the current
    // fade opacity so the application can draw the fade quad itself.
    this._fadeOverlayRenderer = null;
  }

  /* ----------------------------- registration ----------------------------- */

  /**
   * Register a scene instance under the given name.
   * @param {string} name
   * @param {object} scene — any object with the optional lifecycle hooks
   * @returns {SceneManager} this
   */
  add(name, scene) {
    if (!name) throw new Error('SceneManager.add: name is required');
    if (!scene) throw new Error('SceneManager.add: scene is required');
    this._scenes.set(name, scene);
    return this;
  }

  /**
   * Unregister a scene. If it is currently in the stack, it is popped
   * (with onExit fired).
   */
  remove(name) {
    this._scenes.delete(name);
    // Remove from anywhere in the stack
    for (let i = this._stack.length - 1; i >= 0; i--) {
      if (this._stack[i].name === name) {
        const removed = this._stack.splice(i, 1)[0];
        this._callHook(removed.scene, 'onExit');
        // If we removed the top, resume the new top
        if (i === this._stack.length) {
          const newTop = this._stack[this._stack.length - 1];
          if (newTop) this._callHook(newTop.scene, 'onResume');
        }
      }
    }
    return this;
  }

  /** True if a scene is registered under `name`. */
  has(name) { return this._scenes.has(name); }

  /** Get a registered scene by name (or undefined). */
  get(name) { return this._scenes.get(name); }

  /* ----------------------------- stack ops ----------------------------- */

  /**
   * Replace the entire stack with a single scene.
   * Calls onExit on every popped scene, onEnter on the new one.
   */
  switchTo(name) {
    if (this._transitioning) {
      console.warn('[SceneManager] switchTo ignored — transition in progress');
      return this;
    }
    const scene = this._scenes.get(name);
    if (!scene) throw new Error(`SceneManager.switchTo: unknown scene "${name}"`);

    while (this._stack.length > 0) {
      const top = this._stack.pop();
      this._callHook(top.scene, 'onExit');
    }
    this._stack.push({ name, scene });
    this._callHook(scene, 'onEnter');
    return this;
  }

  /**
   * Push a scene on top of the current one. The current top is paused.
   * Useful for overlay screens (pause menu, inventory, dialog).
   */
  push(name) {
    if (this._transitioning) {
      console.warn('[SceneManager] push ignored — transition in progress');
      return this;
    }
    const scene = this._scenes.get(name);
    if (!scene) throw new Error(`SceneManager.push: unknown scene "${name}"`);

    if (this._stack.length > 0) {
      const top = this._stack[this._stack.length - 1];
      this._callHook(top.scene, 'onPause');
    }
    this._stack.push({ name, scene });
    this._callHook(scene, 'onEnter');
    return this;
  }

  /**
   * Pop the top scene. Calls onExit on the popped scene and onResume on the
   * newly-exposed top. Returns the popped entry (or null if stack was empty).
   */
  pop() {
    if (this._transitioning) {
      console.warn('[SceneManager] pop ignored — transition in progress');
      return null;
    }
    if (this._stack.length === 0) return null;
    const removed = this._stack.pop();
    this._callHook(removed.scene, 'onExit');
    if (this._stack.length > 0) {
      const top = this._stack[this._stack.length - 1];
      this._callHook(top.scene, 'onResume');
    }
    return removed;
  }

  /* ----------------------------- transitions ----------------------------- */

  /**
   * Smoothly transition to a new scene using a fade overlay:
   *
   *   1. Fade out (overlay alpha 0 → 1) over `fadeOut` ms.
   *   2. Swap scenes (pops the whole stack, pushes the new one).
   *   3. Call onFadeOut() (e.g. to do async loading).
   *   4. Fade back in (overlay alpha 1 → 0) over `fadeIn` ms.
   *   5. Call onFadeIn() when fully visible again.
   *
   * The fade overlay is driven by the existing Tween system, so it
   * integrates with the rest of 9th.js animation. Call `update(dt)` every
   * frame while a transition is running.
   *
   * @param {string} name — target scene name
   * @param {Object} [options]
   * @param {number} [options.fadeOut=300]
   * @param {number} [options.fadeIn=300]
   * @param {Function} [options.onFadeOut] — called after fadeOut, before swap
   * @param {Function} [options.onFadeIn]  — called after fadeIn completes
   */
  transition(name, options = {}) {
    const { fadeOut = 300, fadeIn = 300, onFadeOut, onFadeIn } = options;
    if (this._transitioning) {
      console.warn('[SceneManager] transition ignored — already transitioning');
      return this;
    }
    const scene = this._scenes.get(name);
    if (!scene) throw new Error(`SceneManager.transition: unknown scene "${name}"`);

    this._transitioning = true;
    const overlay = { opacity: 0 };

    // ---- Fade out ----
    const fadeOutTween = new Tween(overlay)
      .to({ opacity: 1 }, Math.max(0, fadeOut))
      .onUpdate(() => { this._fadeOpacity = overlay.opacity; })
      .onComplete(() => {
        // Swap: pop everything, push new scene
        while (this._stack.length > 0) {
          const top = this._stack.pop();
          this._callHook(top.scene, 'onExit');
        }
        this._stack.push({ name, scene });
        this._callHook(scene, 'onEnter');

        if (typeof onFadeOut === 'function') {
          try { onFadeOut(); } catch (e) { console.error('[SceneManager] onFadeOut error:', e); }
        }

        // ---- Fade back in ----
        const fadeInTween = new Tween(overlay)
          .to({ opacity: 0 }, Math.max(0, fadeIn))
          .onUpdate(() => { this._fadeOpacity = overlay.opacity; })
          .onComplete(() => {
            this._fadeOpacity = 0;
            this._transitioning = false;
            this._activeTween = null;
            if (typeof onFadeIn === 'function') {
              try { onFadeIn(); } catch (e) { console.error('[SceneManager] onFadeIn error:', e); }
            }
          });
        fadeInTween.start(this._virtualTime);
        this._activeTween = fadeInTween;
      });

    fadeOutTween.start(this._virtualTime);
    this._activeTween = fadeOutTween;
    return this;
  }

  /* ----------------------------- queries ----------------------------- */

  /** Current top scene (or null if stack is empty). */
  getActive() {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1].scene : null;
  }

  /** Name of the current top scene (or null). */
  getActiveName() {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1].name : null;
  }

  /** Snapshot of the entire stack: [{name, scene}, ...]. */
  getStack() {
    return this._stack.map(s => ({ name: s.name, scene: s.scene }));
  }

  /** Depth of the stack. */
  get depth() { return this._stack.length; }

  /** True while a transition is in progress. */
  get transitioning() { return this._transitioning; }

  /** Current fade-overlay opacity (0..1). Use this to draw the fade quad in your render code. */
  get fadeOpacity() { return this._fadeOpacity; }

  /**
   * Optional: provide a callback that renders the fade overlay.
   * If set, SceneManager.render() will invoke it with the current opacity
   * so the application can draw the fullscreen quad using its own renderer.
   *
   * @param {(opacity:number) => void} cb
   */
  setFadeOverlayRenderer(cb) {
    this._fadeOverlayRenderer = (typeof cb === 'function') ? cb : null;
    return this;
  }

  /* ----------------------------- dispatch ----------------------------- */

  /**
   * Per-frame update. Advances the active transition tween (if any) and
   * calls onUpdate(dt) on the top scene only (lower scenes are paused).
   * @param {number} dt — delta time in seconds
   */
  update(dt) {
    // Advance the virtual clock by dt (seconds → ms)
    const dtMs = (typeof dt === 'number' && dt >= 0) ? dt * 1000 : 16;
    this._virtualTime += dtMs;

    if (this._activeTween) {
      // Tween.update expects (absoluteTimeMs, deltaMs) — both virtual.
      try {
        const stillRunning = this._activeTween.update(this._virtualTime, dtMs);
        if (!stillRunning) {
          // Tween completed; the onComplete handler has already run and
          // cleared _transitioning / _activeTween (or chained to a new tween).
          if (this._activeTween && !this._activeTween._isPlaying) {
            this._activeTween = null;
          }
        }
      } catch (e) {
        console.error('[SceneManager] tween update error:', e);
        this._activeTween = null;
        this._transitioning = false;
        this._fadeOpacity = 0;
      }
    }

    const active = this.getActive();
    if (active) {
      this._callHook(active, 'onUpdate', dt);
    }
    return this;
  }

  /**
   * Render all scenes in stack order (bottom-up so overlays appear on top).
   * Then, if a fade overlay renderer has been configured, draw the fade quad.
   */
  render(renderer, camera) {
    for (let i = 0; i < this._stack.length; i++) {
      const s = this._stack[i].scene;
      // Prefer onRender; fall back to scene.render for Three.js parity
      if (typeof s.onRender === 'function') {
        try { s.onRender(renderer, camera); } catch (e) { console.error('[SceneManager] onRender error:', e); }
      } else if (typeof s.render === 'function') {
        try { s.render(renderer, camera); } catch (e) { console.error('[SceneManager] render error:', e); }
      }
    }
    if (this._fadeOverlayRenderer && this._fadeOpacity > 0) {
      try { this._fadeOverlayRenderer(this._fadeOpacity); } catch (e) { console.error('[SceneManager] fade overlay render error:', e); }
    }
    return this;
  }

  /* ----------------------------- internals ----------------------------- */

  _callHook(scene, hookName, ...args) {
    if (!scene) return;
    const fn = scene[hookName];
    if (typeof fn === 'function') {
      try { fn.apply(scene, args); } catch (e) { console.error(`[SceneManager] ${hookName} error:`, e); }
    }
  }
}

export default SceneManager;
