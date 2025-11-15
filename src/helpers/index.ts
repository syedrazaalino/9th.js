/**
 * 9th.js Helpers Module
 * 
 * Contains helper classes and functions that provide common 3D functionality
 */

// Scene helpers
export * from './SceneHelper.js';
export * from './GridHelper.js';
export * from './AxesHelper.js';
export * from './BoxHelper.js';
export * from './LineHelper.js';
export * from './ArrowHelper.js';

// Lighting helpers
export * from './LightHelper.js';
export * from './HemisphereLightHelper.js';
export * from './DirectionalLightHelper.js';
export * from './PointLightHelper.js';
export * from './SpotLightHelper.js';

// Geometry helpers
export * from './WireframeGeometry.js';
export * from './EdgesGeometry.js';
export * from './ParametricGeometry.js';

// Animation helpers
export * from './KeyframeTrackHelper.js';
export * from './AnimationClipHelper.js';
export * from './SkeletonHelper.js';

// Debug helpers
export * from './DebugHelper.js';
export * from './GizmoHelper.js';
export * from './StatsHelper.js';

// Camera helpers
export * from './CameraHelper.js';
export * from './FrustumHelper.js';
export * from './SkyboxHelper.js';

// Material helpers
export * from './MaterialHelper.js';
export * from './TextureHelper.js';

// Physics helpers (if physics module is loaded)
export * from './physics/PhysicsHelper.js';
export * from './physics/ColliderHelper.js';

// Common helper factories
export const createAxesHelper = (size: number = 1) => {
  const AxesHelper = require('./AxesHelper.js').AxesHelper;
  return new AxesHelper(size);
};

export const createGridHelper = (size: number = 10, divisions: number = 10) => {
  const GridHelper = require('./GridHelper.js').GridHelper;
  return new GridHelper(size, divisions);
};

export const createBoxHelper = (object: any) => {
  const BoxHelper = require('./BoxHelper.js').BoxHelper;
  return new BoxHelper(object);
};

export const createWireframeGeometry = (geometry: any) => {
  const WireframeGeometry = require('./WireframeGeometry.js').WireframeGeometry;
  return new WireframeGeometry(geometry);
};

// Helper configuration
export const helperConfig = {
  enabled: true,
  showAxes: false,
  showGrid: false,
  showBounds: false,
  showWireframe: false,
  enableStats: false,
  enableGizmos: true
};

export const setHelperConfig = (config: Partial<typeof helperConfig>) => {
  Object.assign(helperConfig, config);
  
  if (config.showAxes !== undefined) {
    toggleAxesHelper(config.showAxes);
  }
  
  if (config.showGrid !== undefined) {
    toggleGridHelper(config.showGrid);
  }
  
  if (config.enableStats !== undefined) {
    toggleStatsHelper(config.enableStats);
  }
};

// Global helper instances
let globalAxesHelper: any = null;
let globalGridHelper: any = null;
let globalStatsHelper: any = null;

export const toggleAxesHelper = (show: boolean = true) => {
  if (show && !globalAxesHelper) {
    globalAxesHelper = createAxesHelper(5);
    // Add to current scene (would need scene reference)
    console.log('Axes helper enabled');
  } else if (!show && globalAxesHelper) {
    // Remove from scene
    console.log('Axes helper disabled');
    globalAxesHelper = null;
  }
};

export const toggleGridHelper = (show: boolean = true) => {
  if (show && !globalGridHelper) {
    globalGridHelper = createGridHelper(50, 50);
    console.log('Grid helper enabled');
  } else if (!show && globalGridHelper) {
    console.log('Grid helper disabled');
    globalGridHelper = null;
  }
};

export const toggleStatsHelper = (show: boolean = true) => {
  if (show && !globalStatsHelper) {
    globalStatsHelper = require('./StatsHelper.js').StatsHelper;
    console.log('Stats helper enabled');
  } else if (!show && globalStatsHelper) {
    console.log('Stats helper disabled');
    globalStatsHelper = null;
  }
};