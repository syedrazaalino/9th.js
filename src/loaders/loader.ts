/**
 * Loaders module
 * Asset loading utilities for 3D models, textures, and other resources
 */

// LoaderOptions and LoadProgress interfaces removed for UMD build

export class Loader {
  basePath;
  crossOrigin;
  withCredentials;
  manager;

  constructor(manager = LoadingManager.default) {
    this.manager = manager;
    this.basePath = '';
    this.crossOrigin = 'anonymous';
    this.withCredentials = false;
  }

  load(
    url,
    onLoad,
    onProgress,
    onError
  ) {
    this.manager.itemStart(url);
    
    // Simulate loading (this would be implemented with actual HTTP requests)
    setTimeout(() => {
      this.manager.itemEnd(url);
      if (onLoad) onLoad(null); // Mock loaded object
    }, 100);
  }

  setCrossOrigin(crossOrigin) {
    this.crossOrigin = crossOrigin;
    return this;
  }

  setWithCredentials(value) {
    this.withCredentials = value;
    return this;
  }

  setPath(path) {
    this.basePath = path;
    return this;
  }
}

export class LoadingManager {
  static default = new LoadingManager();
  onLoad= null;
  onProgress= null;
  onError= null;

  loading = new Set();

  constructor() {}

  itemStart(url) {
    this.loading.add(url);
  }

  itemEnd(url) {
    this.loading.delete(url);
    
    if (this.loading.size === 0) {
      if (this.onLoad) this.onLoad();
    }
  }

  itemError(url) {
    this.loading.delete(url);
    if (this.onError) this.onError(url);
  }
}

export class TextureLoader extends Loader {
  textureCache ;

  load(
    url,
    onLoad,
    onProgress,
    onError
  ) {
    if (this.textureCache.has(url)) {
      if (onLoad) onLoad(this.textureCache.get(url));
      return;
    }

    super.load(url, (texture) => {
      this.textureCache.set(url, texture);
      if (onLoad) onLoad(texture);
    }, onProgress, onError);
  }
}

export class JSONLoader extends Loader {
  load(
    url,
    onLoad,
    onProgress,
    onError
  ) {
    super.load(url, (data) => {
      try {
        const jsonData = JSON.parse(data);
        if (onLoad) onLoad(jsonData);
      } catch (error) {
        if (onError) onError(error);
      }
    }, onProgress, onError);
  }
}
