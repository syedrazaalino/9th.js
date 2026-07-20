/**
 * Cache.js — Global response cache shared across all Loader instances.
 *
 * Three.js-compatible API surface. Enabled by default; mutable at runtime.
 *
 *   import { Cache } from '9th.js';
 *
 *   Cache.enabled = true;           // turn caching on/off globally
 *   Cache.add('/foo.json', data);
 *   const cached = Cache.get('/foo.json');
 *   Cache.remove('/foo.json');
 *   Cache.clear();
 *
 * Used internally by Loader.fetchText / fetchArrayBuffer / fetchJSON to avoid
 * re-fetching the same URL during a single session. Different payload types
 * (string, ArrayBuffer, Blob, Response, parsed JSON, etc.) can all live in
 * the same cache; the fetch* helpers normalize on the way out.
 */

export class Cache {
  /**
   * Set to false to disable caching globally. When disabled, the fetch*
   * helpers bypass the cache entirely (no reads, no writes).
   * @type {boolean}
   */
  static enabled = true;

  /**
   * Internal map: URL -> cached payload.
   * Payload type is whatever the fetch* helper decided to store — typically
   * a string (for text/JSON) or an ArrayBuffer (for binary).
   * @type {Map<string, any>}
   */
  static files = new Map();

  /**
   * Add an item to the cache. Overwrites any existing entry for the same URL.
   * @param {string} url - Cache key (URL).
   * @param {*} data - Cached payload.
   * @returns {this} — chainable (for parity with Map.set-style APIs)
   */
  static add(url, data) {
    Cache.files.set(url, data);
    return Cache;
  }

  /**
   * Retrieve an item from the cache, or undefined if not present.
   * @param {string} url
   * @returns {*} The cached payload, or undefined.
   */
  static get(url) {
    return Cache.files.get(url);
  }

  /**
   * Returns true if the cache contains an entry for the given URL.
   * @param {string} url
   * @returns {boolean}
   */
  static has(url) {
    return Cache.files.has(url);
  }

  /**
   * Remove a single entry from the cache.
   * @param {string} url
   * @returns {boolean} true if an entry was removed, false otherwise.
   */
  static remove(url) {
    return Cache.files.delete(url);
  }

  /**
   * Clear the entire cache.
   * @returns {this} — chainable
   */
  static clear() {
    Cache.files.clear();
    return Cache;
  }
}

export default Cache;
