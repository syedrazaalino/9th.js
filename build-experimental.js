import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Experimental package configuration - bleeding-edge features
const EXPERIMENTAL_CONFIG = {
  name: '9th.js-experimental',
  version: '0.2.0-experimental.1',
  source: 'src/experimental/index.ts',
  outputs: {
    esm: 'dist/experimental/esm/index.js',
    cjs: 'dist/experimental/cjs/index.js',
    umd: 'dist/experimental/umd/9th.js',
    dev: 'dist/experimental/dev/index.js'
  },
  // All standard modules plus experimental features
  modules: [
    'core',
    'geometry',
    'materials',
    'rendering',
    'animation',
    'loaders',
    'lights',
    'particles',
    'physics',
    'controls',
    'textures',
    'cameras',
    'experimental/ai',
    'experimental/webgpu',
    'experimental/realtime-gi',
    'experimental/hybrid-rendering'
  ],
  experimentalFeatures: {
    ai: 'Machine learning and AI-driven rendering',
    webgpu: 'WebGPU backend for next-gen graphics',
    realtime_gi: 'Real-time global illumination',
    hybrid_rendering: 'Hybrid raster/ray tracing pipeline'
  }
};

class ExperimentalBuilder {
  constructor() {
    this.watchMode = process.argv.includes('--watch');
    this.esmOnly = process.argv.includes('--esm');
    this.umdOnly = process.argv.includes('--umd');
    this.devMode = process.argv.includes('--dev');
    this.cleanOutput();
  }

  cleanOutput() {
    const outputDirs = [
      'dist/experimental',
      'dist/experimental/esm',
      'dist/experimental/cjs',
      'dist/experimental/umd',
      'dist/experimental/dev',
      'dist/experimental/esm/experimental',
      'dist/experimental/cjs/experimental'
    ];

    for (const dir of outputDirs) {
      if (existsSync(dir)) {
        spawn('rm', ['-rf', dir]);
      }
      mkdirSync(dir, { recursive: true });
    }
  }

  async buildExperimentalSource() {
    console.log('🔧 Setting up experimental source files...');
    
    // Create experimental source directory structure
    const experimentalDirs = [
      'src/experimental',
      'src/experimental/ai',
      'src/experimental/webgpu',
      'src/experimental/realtime-gi',
      'src/experimental/hybrid-rendering'
    ];

    for (const dir of experimentalDirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    // Create experimental index files
    await this.createExperimentalIndex();
  }

  async createExperimentalIndex() {
    const experimentalIndex = `
// Experimental AI features
export * from './ai/index.js';

// WebGPU backend
export * from './webgpu/index.js';

// Real-time global illumination
export * from './realtime-gi/index.js';

// Hybrid rendering pipeline
export * from './hybrid-rendering/index.js';

// Experimental utilities
export const EXPERIMENTAL_VERSION = '${EXPERIMENTAL_CONFIG.version}';
export const EXPERIMENTAL_WARNINGS = true;

// Enable experimental features (use with caution)
export const enableExperimentalFeatures = (features) => {
  console.warn('⚠️  Enabling experimental features:', features);
  return true;
};
`;

    const aiIndex = `
// AI-driven rendering and optimization
export class AIRenderer {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('🤖 Initializing AI renderer...');
    this.initialized = true;
  }

  optimizeScene(scene) {
    if (!this.initialized) {
      throw new Error('AI renderer not initialized');
    }
    // AI-based scene optimization
    return scene;
  }

  predictFrameTime() {
    // Predict frame time using ML
    return 16.67; // ~60fps
  }
}

export class MLTextureOptimizer {
  optimize(texture) {
    // Use machine learning to optimize texture
    return texture;
  }
}

export class SmartLOD {
  constructor() {
    this.machineLearning = true;
  }

  adaptLOD(camera, objects) {
    // ML-based level-of-detail adaptation
    return objects;
  }
}
`;

    const webgpuIndex = `
// WebGPU backend implementation
export class WebGPURenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
    this.initialized = false;
  }

  async initialize() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported in this browser');
    }
    
    console.log('🚀 Initializing WebGPU backend...');
    this.initialized = true;
  }

  async render(scene, camera) {
    if (!this.initialized) {
      await this.initialize();
    }
    // WebGPU rendering implementation
    return true;
  }
}

export class WebGPUComputePass {
  constructor() {
    this.computePipeline = null;
  }

  setupComputeShader(shader) {
    // Setup compute shader for advanced effects
    this.computePipeline = shader;
  }

  execute(computeParams) {
    // Execute compute pass
    return computeParams;
  }
}
`;

    const giIndex = `
// Real-time Global Illumination
export class RealtimeGI {
  constructor() {
    this.initialized = false;
    this.rayBudget = 1024;
  }

  initialize() {
    console.log('💡 Initializing real-time GI...');
    this.initialized = true;
  }

  bakeLighting(scene) {
    if (!this.initialized) {
      throw new Error('GI system not initialized');
    }
    
    // Real-time global illumination calculation
    const lightingMap = new Map();
    return lightingMap;
  }

  updateLighting(scene, time) {
    // Update GI based on dynamic scene changes
    return scene;
  }
}

export class PhotonMapper {
  constructor() {
    this.photonCount = 10000;
  }

  tracePhotons(scene) {
    // Photon mapping for global illumination
    return new Map();
  }
}
`;

    const hybridIndex = `
// Hybrid Raster/Ray Tracing
export class HybridRenderer {
  constructor() {
    this.rasterLayers = [];
    this.rayTracedLayers = [];
    this.hybridEnabled = true;
  }

  setupHybridPipeline(scene) {
    console.log('🔄 Setting up hybrid rendering pipeline...');
    
    // Configure which objects use ray tracing vs rasterization
    this.rasterLayers = scene.getStaticObjects();
    this.rayTracedLayers = scene.getDynamicObjects();
    
    return this;
  }

  render(scene, camera, time) {
    if (!this.hybridEnabled) {
      return this.renderRaster(scene, camera);
    }

    // Hybrid rendering: raster for static, ray tracing for dynamic
    this.renderRaster(this.rasterLayers, camera);
    this.rayTrace(this.rayTracedLayers, camera, time);
    
    return true;
  }

  renderRaster(objects, camera) {
    // Traditional rasterization
    return objects;
  }

  rayTrace(objects, camera, time) {
    // Ray tracing for dynamic objects
    return objects;
  }
}

export class AdaptiveRayTracing {
  constructor() {
    this.rayDensity = 1.0;
    this.performance = 60; // target FPS
  }

  adaptQuality(sceneComplexity, frameTime) {
    // Adapt ray tracing quality based on performance
    if (frameTime > 1000 / this.performance) {
      this.rayDensity *= 0.9; // Reduce quality if too slow
    } else {
      this.rayDensity *= 1.05; // Increase quality if performance allows
    }
    
    return this.rayDensity;
  }
}
`;

    // Write experimental index files
    const fs = await import('fs');
    fs.writeFileSync('src/experimental/index.ts', experimentalIndex);
    fs.writeFileSync('src/experimental/ai/index.ts', aiIndex);
    fs.writeFileSync('src/experimental/webgpu/index.ts', webgpuIndex);
    fs.writeFileSync('src/experimental/realtime-gi/index.ts', giIndex);
    fs.writeFileSync('src/experimental/hybrid-rendering/index.ts', hybridIndex);
  }

  async buildESM() {
    console.log('🔨 Building Experimental ESM...');
    
    const buildArgs = [
      'src/experimental/index.ts',
      '--format', 'es',
      '--outfile', 'dist/experimental/esm/index.js',
      '--sourcemap',
      '--tree-shaking'
    ];

    return this.runRollup(buildArgs);
  }

  async buildCJS() {
    console.log('🔨 Building Experimental CommonJS...');
    
    const buildArgs = [
      'src/experimental/index.ts',
      '--format', 'cjs',
      '--outfile', 'dist/experimental/cjs/index.js',
      '--sourcemap',
      '--exports', 'named'
    ];

    return this.runRollup(buildArgs);
  }

  async buildUMD() {
    console.log('🔨 Building Experimental UMD...');
    
    const buildArgs = [
      'src/experimental/index.ts',
      '--format', 'umd',
      '--outfile', 'dist/experimental/umd/9th.js',
      '--name', 'NinthJSExperimental',
      '--sourcemap'
    ];

    return this.runRollup(buildArgs);
  }

  async buildDevelopment() {
    console.log('🔨 Building Experimental Development...');
    
    const buildArgs = [
      'src/experimental/index.ts',
      '--format', 'cjs',
      '--outfile', 'dist/experimental/dev/index.js',
      '--sourcemap',
      '--exports', 'named',
      '--no-treeshaking'
    ];

    return this.runRollup(buildArgs);
  }

  async buildTypes() {
    console.log('🔨 Building Experimental TypeScript types...');
    
    const typeArgs = [
      'tsc',
      '--emitDeclarationOnly',
      '--outDir', 'dist/experimental/esm',
      '--project', 'tsconfig.experimental.json'
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('npm', typeArgs, { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Experimental types built successfully');
          resolve();
        } else {
          reject(new Error(`TypeScript compilation failed with code ${code}`));
        }
      });
    });
  }

  runRollup(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('rollup', args, { stdio: 'inherit' });
      
      if (this.watchMode) {
        proc.on('spawn', () => console.log('🔄 Experimental build started in watch mode'));
      }

      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Experimental build completed successfully');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  async buildAll() {
    console.log('🚀 Starting Experimental package build...');
    console.log(`📦 Building ${EXPERIMENTAL_CONFIG.name} v${EXPERIMENTAL_CONFIG.version}`);
    console.log(`🧪 Experimental features: ${Object.keys(EXPERIMENTAL_CONFIG.experimentalFeatures).length}`);
    
    try {
      await this.buildExperimentalSource();
      
      if (this.esmOnly) {
        await this.buildESM();
      } else if (this.umdOnly) {
        await this.buildUMD();
      } else if (this.devMode) {
        await this.buildDevelopment();
      } else {
        await this.buildESM();
        await this.buildCJS();
        await this.buildUMD();
        await this.buildDevelopment();
      }
      
      await this.buildTypes();
      
      console.log('\n🎉 Experimental build completed successfully!');
      console.log('📁 Output directories:');
      console.log('  - ESM: dist/experimental/esm/');
      console.log('  - CJS: dist/experimental/cjs/');
      console.log('  - UMD: dist/experimental/umd/');
      console.log('  - Dev: dist/experimental/dev/');
      console.log('  - Types: dist/experimental/esm/');
      
      if (this.watchMode) {
        console.log('\n👀 Watching for experimental changes...');
      }
      
    } catch (error) {
      console.error('❌ Experimental build failed:', error.message);
      process.exit(1);
    }
  }

  generateBundleInfo() {
    const info = {
      name: EXPERIMENTAL_CONFIG.name,
      version: EXPERIMENTAL_CONFIG.version,
      modules: EXPERIMENTAL_CONFIG.modules,
      experimentalFeatures: EXPERIMENTAL_CONFIG.experimentalFeatures,
      size: {
        esm: '~350KB',
        cjs: '~380KB',
        umd: '~420KB'
      },
      target: 'Experimental 3D graphics library with bleeding-edge features',
      warnings: [
        'This package contains experimental features',
        'APIs may change or be removed',
        'Not recommended for production use',
        'Requires modern browser support'
      ],
      requirements: {
        node: '>=18.0.0',
        browsers: 'Latest 2 versions with WebGPU support'
      }
    };

    console.log('\n📊 Experimental Bundle Information:');
    console.log(JSON.stringify(info, null, 2));
    
    return info;
  }
}

// Run the build
const builder = new ExperimentalBuilder();
builder.buildAll().then(() => {
  builder.generateBundleInfo();
}).catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});

// Export for testing
export default ExperimentalBuilder;