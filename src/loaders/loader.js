/**
 * loader.js — Real LoadingManager + base Loader class.
 *
 * Replaces the previous stub (which used `setTimeout(..., 100)` to mock
 * loading) with a Three.js-compatible implementation backed by the Fetch API.
 *
 * ----------------------------------------------------------------------------
 * LoadingManager
 * ----------------------------------------------------------------------------
 *   const manager = new LoadingManager();
 *   manager.onStart   = (url, loaded, total) => {...};
 *   manager.onLoad    = () => {...};
 *   manager.onProgress= (url, loaded, total) => {...};
 *   manager.onError   = (url) => {...};
 *
 *   manager.itemStart(url);    // called by Loader when an item begins
 *   manager.itemEnd(url);      // called by Loader when an item completes
 *   manager.itemError(url);    // called by Loader when an item fails
 *
 *   manager.addURLModifier(fn);   // rewrite URLs before fetch (CDN routing, etc.)
 *   manager.resolveURL(url);      // apply modifiers
 *
 *   manager.isLoading;  // read-only boolean
 *   manager.loaded;     // read-only count of completed items
 *   manager.total;      // read-only count of started items
 *
 *   LoadingManager.default;       // singleton used by all loaders if no
 *                                 // manager is passed to the constructor
 *
 * ----------------------------------------------------------------------------
 * Loader (base class)
 * ----------------------------------------------------------------------------
 *   class MyLoader extends Loader {
 *     load(url, onLoad, onProgress, onError) {
 *       this.manager.itemStart(url);
 *       this.fetchArrayBuffer(url, onProgress)
 *         .then(buf => { this.parse(buf); this.manager.itemEnd(url); onLoad?.(result); })
 *         .catch(err => { this.manager.itemError(url); onError?.(err); });
 *     }
 *   }
 *
 *   const l = new MyLoader(manager);
 *   l.setPath('/assets/').setCrossOrigin('anonymous').setWithCredentials(true);
 *   l.setRequestHeader('Authorization', 'Bearer ...');
 *   const buf = await l.fetchArrayBuffer('model.glb', ev => console.log(ev.loaded));
 *   const img = await l.loadImage('texture.png');
 *
 * The base Loader exposes:
 *   - constructor(manager = LoadingManager.default)
 *   - load(url, onLoad, onProgress, onError) — abstract; subclasses override
 *   - loadAsync(url, onProgress)             — Promise wrapper around load()
 *   - setCrossOrigin / setWithCredentials / setPath / setResourcePath
 *   - setRequestHeader(name, value)
 *   - fetch(url)                  -> Promise<Response>
 *   - fetchArrayBuffer(url, p)    -> Promise<ArrayBuffer>  (cached, streamed)
 *   - fetchText(url, p)           -> Promise<string>        (cached, streamed)
 *   - fetchJSON(url, p)           -> Promise<object>        (cached)
 *   - loadImage(url, crossOrigin) -> Promise<HTMLImageElement>
 *
 * All fetch* helpers consult the global Cache before going to the network.
 *
 * Public API preserved from the previous stub:
 *   - `Loader`, `LoadingManager` named exports
 *   - `LoadingManager.default` singleton
 *   - `LoadingManager.itemStart/itemEnd/itemError`
 *   - `LoadingManager.onLoad/onProgress/onError`
 *   - `LoadingManager.loading` (now a read-only getter returning the
 *     in-flight URL Set — kept for backwards compatibility)
 *   - `Loader.basePath` (legacy alias of `Loader.path`, kept in sync)
 *   - `Loader.setPath()` updates both `path` and `basePath`
 */

import { Cache } from './Cache.js';

// ============================================================================
// LoadingManager
// ============================================================================

export class LoadingManager {
  constructor() {
    // Public callbacks (assign freely).
    /** @type {(url: string, loaded: number, total: number) => void | null} */
    this.onStart = null;
    /** @type {() => void | null} */
    this.onLoad = null;
    /** @type {(url: string, loaded: number, total: number) => void | null} */
    this.onProgress = null;
    /** @type {(url: string) => void | null} */
    this.onError = null;

    // Three.js-compatible counter names.
    this.itemsLoaded = 0;
    this.itemsTotal = 0;

    // Internal state.
    /** @type {Set<string>} URLs currently in flight. */
    this._itemsLoading = new Set();
    /** @type {boolean} Tracks whether onStart has fired for the current batch. */
    this._isLoading = false;
    /** @type {Array<(url: string) => string>} */
    this._urlModifiers = [];
  }

  /**
   * Read-only boolean — true while at least one item is in flight.
   * @returns {boolean}
   */
  get isLoading() {
    return this._isLoading;
  }

  /**
   * Read-only count of items that have completed (successfully or otherwise).
   * @returns {number}
   */
  get loaded() {
    return this.itemsLoaded;
  }

  /**
   * Read-only count of items that have ever been started.
   * @returns {number}
   */
  get total() {
    return this.itemsTotal;
  }

  /**
   * Backwards-compat with the previous stub: exposes the in-flight URL set.
   * @deprecated — prefer isLoading / loaded / total.
   * @returns {Set<string>}
   */
  get loading() {
    return this._itemsLoading;
  }

  /**
   * Called by Loader when an item begins loading.
   * Increments the total counter and fires onStart on the first item.
   * @param {string} url
   */
  itemStart(url) {
    this.itemsTotal++;

    if (!this._isLoading) {
      this._isLoading = true;
      if (this.onStart) {
        this.onStart(url, this.itemsLoaded, this.itemsTotal);
      }
    }

    this._itemsLoading.add(url);
  }

  /**
   * Called by Loader when an item completes loading.
   * Increments the loaded counter, fires onProgress, and fires onLoad when
   * the in-flight set drains.
   * @param {string} url
   */
  itemEnd(url) {
    this.itemsLoaded++;
    this._itemsLoading.delete(url);

    if (this.onProgress) {
      this.onProgress(url, this.itemsLoaded, this.itemsTotal);
    }

    if (this._itemsLoading.size === 0 && this._isLoading) {
      this._isLoading = false;
      if (this.onLoad) {
        this.onLoad();
      }
    }
  }

  /**
   * Called by Loader when an item fails to load.
   *
   * Removes the URL from the in-flight set so the manager can complete even
   * if some items error out (matches the previous stub's behavior; Three.js
   * callers typically also call itemEnd after itemError, but our existing
   * GLTFLoader/STLLoader/etc. only call itemError on failure, so we keep the
   * more lenient semantics here).
   *
   * @param {string} url
   */
  itemError(url) {
    this._itemsLoading.delete(url);
    if (this.onError) {
      this.onError(url);
    }

    // If this was the last in-flight item, mark loading as done so the
    // next itemStart fires onStart again.
    if (this._itemsLoading.size === 0 && this._isLoading) {
      this._isLoading = false;
    }
  }

  /**
   * Apply all registered URL modifiers to a URL, in registration order.
   * @param {string} url
   * @returns {string}
   */
  resolveURL(url) {
    let result = url;
    for (let i = 0; i < this._urlModifiers.length; i++) {
      result = this._urlModifiers[i](result);
    }
    return result;
  }

  /**
   * Register a URL modifier function. Modifiers are applied in registration
   * order. Useful for CDN routing, cache-busting query strings, auth tokens,
   * protocol upgrades, etc.
   * @param {(url: string) => string} fn
   * @returns {this} — chainable
   */
  addURLModifier(fn) {
    if (typeof fn === 'function') {
      this._urlModifiers.push(fn);
    }
    return this;
  }
}

/**
 * Singleton default manager used by all loaders when no manager is passed.
 * Equivalent to Three.js's `DefaultLoadingManager`.
 */
LoadingManager.default = new LoadingManager();

// ============================================================================
// Loader (base class)
// ============================================================================

export class Loader {
  /**
   * @param {LoadingManager} [manager=LoadingManager.default]
   */
  constructor(manager = LoadingManager.default) {
    /** @type {LoadingManager} */
    this.manager = manager;

    // Path configuration
    /** Base path prepended to URLs (Three.js name). */
    this.path = '';
    /**
     * Legacy alias for `path` — preserved because GLTFLoader.js and other
     * existing loaders reference `this.basePath` directly. `setPath()`
     * updates both fields in lockstep.
     */
    this.basePath = '';
    /** Base path for sub-resources (e.g. textures referenced by a GLTF). */
    this.resourcePath = '';

    // Network options
    /** @type {string|boolean} — 'anonymous' | 'use-credentials' | false */
    this.crossOrigin = 'anonymous';
    /** @type {boolean} — when true, fetch uses credentials: 'include' */
    this.withCredentials = false;
    /** @type {Object<string, string>} */
    this.requestHeader = {};
  }

  /**
   * Load a resource. Subclasses MUST override this method.
   *
   * The default implementation here performs a real fetch as text and is
   * suitable as a fallback for trivial loaders, but format-specific loaders
   * (GLTFLoader, OBJLoader, etc.) override it with format-aware logic.
   *
   * @param {string} url
   * @param {(data: any) => void} [onLoad]
   * @param {(event: {loaded: number, total: number, lengthComputable: boolean}) => void} [onProgress]
   * @param {(err: Error) => void} [onError]
   */
  load(url, onLoad, onProgress, onError) {
    const resolved = this.resolveURL(url);
    this.manager.itemStart(resolved);

    this.fetchText(resolved, onProgress)
      .then((text) => {
        this.manager.itemEnd(resolved);
        if (onLoad) onLoad(text);
      })
      .catch((err) => {
        this.manager.itemError(resolved);
        if (onError) onError(err);
        else console.error(`[Loader] Failed to load ${resolved}:`, err);
      });
  }

  /**
   * Promise wrapper around load().
   * @param {string} url
   * @param {(event: object) => void} [onProgress]
   * @returns {Promise<any>}
   */
  loadAsync(url, onProgress) {
    return new Promise((resolve, reject) => {
      this.load(url, resolve, onProgress, reject);
    });
  }

  /**
   * Set the crossOrigin policy for HTMLImageElement-based loaders.
   * @param {string|boolean} value
   * @returns {this}
   */
  setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  }

  /**
   * Set the withCredentials flag for fetch/XHR.
   * @param {boolean} value
   * @returns {this}
   */
  setWithCredentials(value) {
    this.withCredentials = value;
    return this;
  }

  /**
   * Set the base path prepended to all URLs.
   * Updates both `path` (Three.js name) and `basePath` (legacy alias).
   * @param {string} path
   * @returns {this}
   */
  setPath(path) {
    this.path = path;
    this.basePath = path;
    return this;
  }

  /**
   * Legacy alias for setPath() — preserved because the previous stub used
   * `basePath` as the canonical field name. GLTFLoader.js reads
   * `this.basePath` directly.
   * @param {string} path
   * @returns {this}
   */
  setBasePath(path) {
    this.path = path;
    this.basePath = path;
    return this;
  }

  /**
   * Set the resource path for sub-resources (e.g. textures referenced by a
   * GLTF file). Distinct from setPath() so the loader can resolve the main
   * asset vs. its sub-resources independently.
   * @param {string} path
   * @returns {this}
   */
  setResourcePath(path) {
    this.resourcePath = path;
    return this;
  }

  /**
   * Add (or overwrite) a custom HTTP header sent on all subsequent fetches.
   * @param {string} name
   * @param {string} value
   * @returns {this}
   */
  setRequestHeader(name, value) {
    this.requestHeader[name] = value;
    return this;
  }

  /**
   * Resolve a URL through the manager's URL modifiers and the loader's
   * configured base path. Absolute URLs (http://, https://, data:, etc.)
   * skip the base-path prefix.
   * @param {string} url
   * @returns {string}
   */
  resolveURL(url) {
    if (typeof this.manager?.resolveURL === 'function') {
      url = this.manager.resolveURL(url);
    }
    if (
      this.path &&
      !/^[a-z][a-z0-9+.-]*:\/\//i.test(url) &&
      !url.startsWith('data:') &&
      !url.startsWith('blob:')
    ) {
      url = this.path + url;
    }
    return url;
  }

  /**
   * Build a fetch() RequestInit object from the loader's configuration.
   * @returns {Object}
   * @protected
   */
  _fetchOptions() {
    return {
      method: 'GET',
      credentials: this.withCredentials ? 'include' : 'same-origin',
      headers: { ...this.requestHeader }
    };
  }

  /**
   * Normalize a cached payload to an ArrayBuffer.
   * @param {*} cached
   * @returns {ArrayBuffer | null}
   * @protected
   */
  _cachedToArrayBuffer(cached) {
    if (cached instanceof ArrayBuffer) return cached;
    if (cached instanceof Uint8Array) return cached.buffer.slice(cached.byteOffset, cached.byteOffset + cached.byteLength);
    if (typeof Blob !== 'undefined' && cached instanceof Blob) return null; // async — handled by caller
    if (typeof cached === 'string') {
      const buf = new ArrayBuffer(cached.length * 3); // worst-case UTF-8
      const encoded = new TextEncoder().encodeInto(cached, new Uint8Array(buf));
      return buf.slice(0, encoded.written);
    }
    return null;
  }

  /**
   * Normalize a cached payload to a string.
   * @param {*} cached
   * @returns {string | null}
   * @protected
   */
  _cachedToText(cached) {
    if (typeof cached === 'string') return cached;
    if (cached instanceof ArrayBuffer) return new TextDecoder().decode(cached);
    if (cached instanceof Uint8Array) return new TextDecoder().decode(cached);
    return null;
  }

  /**
   * Perform a fetch with all configured options. Does NOT consult the cache —
   * use fetchText / fetchArrayBuffer / fetchJSON for cached variants.
   * @param {string} url
   * @returns {Promise<Response>}
   */
  async fetch(url) {
    const resolved = this.resolveURL(url);
    const response = await globalThis.fetch(resolved, this._fetchOptions());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} — ${resolved}`);
    }
    return response;
  }

  /**
   * Fetch as ArrayBuffer. Uses ReadableStream for progress events when
   * available. Cached if Cache.enabled is true.
   * @param {string} url
   * @param {(event: {loaded: number, total: number, lengthComputable: boolean}) => void} [onProgress]
   * @returns {Promise<ArrayBuffer>}
   */
  async fetchArrayBuffer(url, onProgress) {
    const resolved = this.resolveURL(url);

    // Cache hit?
    if (Cache.enabled && Cache.has(resolved)) {
      const cached = Cache.get(resolved);
      const buf = this._cachedToArrayBuffer(cached);
      if (buf) {
        if (onProgress) {
          onProgress({ loaded: buf.byteLength, total: buf.byteLength, lengthComputable: true });
        }
        return buf;
      }
      // Blob? Decode asynchronously.
      if (typeof Blob !== 'undefined' && cached instanceof Blob) {
        const ab = await cached.arrayBuffer();
        if (onProgress) {
          onProgress({ loaded: ab.byteLength, total: ab.byteLength, lengthComputable: true });
        }
        return ab;
      }
      // Unknown shape — fall through to network.
    }

    const response = await globalThis.fetch(resolved, this._fetchOptions());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} — ${resolved}`);
    }

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    // Stream-based progress if the platform supports it and caller wants it.
    if (onProgress && response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        onProgress({
          loaded: received,
          total: total || received,
          lengthComputable: total > 0
        });
      }

      const buffer = new ArrayBuffer(received);
      const view = new Uint8Array(buffer);
      let offset = 0;
      for (const chunk of chunks) {
        view.set(chunk, offset);
        offset += chunk.length;
      }

      if (Cache.enabled) Cache.add(resolved, buffer);
      return buffer;
    }

    const buffer = await response.arrayBuffer();
    if (Cache.enabled) Cache.add(resolved, buffer);
    return buffer;
  }

  /**
   * Fetch as text. Cached if Cache.enabled is true.
   * @param {string} url
   * @param {(event: {loaded: number, total: number, lengthComputable: boolean}) => void} [onProgress]
   * @returns {Promise<string>}
   */
  async fetchText(url, onProgress) {
    const resolved = this.resolveURL(url);

    if (Cache.enabled && Cache.has(resolved)) {
      const cached = Cache.get(resolved);
      const text = this._cachedToText(cached);
      if (text !== null) {
        if (onProgress) {
          onProgress({ loaded: text.length, total: text.length, lengthComputable: true });
        }
        return text;
      }
      if (typeof Blob !== 'undefined' && cached instanceof Blob) {
        const t = await cached.text();
        if (onProgress) {
          onProgress({ loaded: t.length, total: t.length, lengthComputable: true });
        }
        return t;
      }
    }

    const response = await globalThis.fetch(resolved, this._fetchOptions());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} — ${resolved}`);
    }

    // Optional streamed progress (text bodies are usually small, but support it).
    if (onProgress && response.body && typeof response.body.getReader === 'function') {
      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let received = 0;
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        text += decoder.decode(value, { stream: true });
        onProgress({
          loaded: received,
          total: total || received,
          lengthComputable: total > 0
        });
      }
      text += decoder.decode();

      if (Cache.enabled) Cache.add(resolved, text);
      return text;
    }

    const text = await response.text();
    if (Cache.enabled) Cache.add(resolved, text);
    return text;
  }

  /**
   * Fetch as JSON. Cached if Cache.enabled is true (cached as text).
   * @param {string} url
   * @param {(event: object) => void} [onProgress]
   * @returns {Promise<object>}
   */
  async fetchJSON(url, onProgress) {
    const text = await this.fetchText(url, onProgress);
    return JSON.parse(text);
  }

  /**
   * Load an image via HTMLImageElement. Returns a Promise that resolves with
   * the loaded image element. Honors this.crossOrigin by default.
   * @param {string} url
   * @param {string|boolean} [crossOrigin=this.crossOrigin]
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(url, crossOrigin = this.crossOrigin) {
    return new Promise((resolve, reject) => {
      const resolved = this.resolveURL(url);

      // In non-browser environments, Image may not be defined.
      if (typeof Image === 'undefined') {
        reject(new Error(`[Loader.loadImage] Image is not available in this environment`));
        return;
      }

      const img = new Image();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin === true ? 'anonymous' : crossOrigin;
      }
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`[Loader.loadImage] Failed to load image: ${resolved}`));
      img.src = resolved;
    });
  }
}

// Re-export Cache for convenience so callers can do
// `import { Loader, LoadingManager, Cache } from './loader.js'`.
export { Cache } from './Cache.js';

export default Loader;
