/**
 * Loader + controls smoke tests (no network / no WebGL)
 */
import { GLTFLoader } from '../../../src/loaders/GLTFLoader.js';
import { OBJLoader } from '../../../src/loaders/OBJLoader.js';
import { TextureLoader } from '../../../src/loaders/TextureLoader.js';
import { OrbitControls } from '../../../src/controls/OrbitControls.js';
import { PerspectiveCamera } from '../../../src/cameras/PerspectiveCamera.js';
import { AnimationMixer } from '../../../src/animation/index.js';

describe('Loaders export surface', () => {
  test('GLTFLoader constructs', () => {
    const loader = new GLTFLoader();
    expect(loader).toBeDefined();
    expect(typeof loader.load === 'function' || typeof loader.parse === 'function').toBe(true);
  });

  test('OBJLoader constructs', () => {
    expect(new OBJLoader()).toBeDefined();
  });

  test('TextureLoader constructs', () => {
    expect(new TextureLoader()).toBeDefined();
  });
});

describe('OrbitControls', () => {
  test('binds to PerspectiveCamera', () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 2, 5);
    const controls = new OrbitControls(camera, null);
    expect(controls.camera).toBe(camera);
    expect(typeof controls.update).toBe('function');
    controls.update(0.016);
  });
});

describe('Animation', () => {
  test('AnimationMixer is available', () => {
    expect(AnimationMixer).toBeDefined();
  });
});
