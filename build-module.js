import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Module package configuration - ESM-only optimized builds
const MODULE_CONFIG = {
  name: '9th.js-module',
  version: '0.1.0',
  source: 'src/index.ts',
  output: {
    esm: 'dist/module/esm/index.js',
    esmMin: 'dist/module/esm/index.min.js'
  },
  // All standard modules (no experimental features)
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
    'cameras'
  ]
};

class ModuleBuilder {
  constructor() {
    this.watchMode = process.argv.includes('--watch');
    this.cleanOutput();
  }

  cleanOutput() {
    const outputDirs = [
      'dist/module',
      'dist/module/esm'
    ];

    for (const dir of outputDirs) {
      if (existsSync(dir)) {
        spawn('rm', ['-rf', dir]);
      }
      mkdirSync(dir, { recursive: true });
    }
  }

  async buildESM() {
    console.log('🔨 Building Module ESM...');
    
    const buildArgs = [
      '-c',
      'rollup.module.config.js',
      '--filter', 'esmModule'
    ];

    if (this.watchMode) {
      buildArgs.push('--watch');
    }

    return this.runRollup(buildArgs);
  }

  async buildESMMinified() {
    console.log('🔨 Building Module ESM Minified...');
    
    const buildArgs = [
      '-c',
      'rollup.module.config.js',
      '--filter', 'esmModuleMinified'
    ];

    if (this.watchMode) {
      buildArgs.push('--watch');
    }

    return this.runRollup(buildArgs);
  }

  async buildTypes() {
    console.log('🔨 Building Module TypeScript types...');
    
    const typeArgs = [
      'tsc',
      '--emitDeclarationOnly',
      '--outDir', 'dist/module/esm',
      '--project', 'tsconfig.module.json'
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('npm', typeArgs, { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Module types built successfully');
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
        proc.on('spawn', () => console.log('🔄 Module build started in watch mode'));
      }

      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Module build completed successfully');
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
    console.log('🚀 Starting Module package build...');
    console.log(`📦 Building ${MODULE_CONFIG.name} v${MODULE_CONFIG.version}`);
    console.log(`🎯 ESM-optimized modules: ${MODULE_CONFIG.modules.length} included`);
    
    try {
      await this.buildESM();
      await this.buildESMMinified();
      await this.buildTypes();
      
      console.log('\n🎉 Module build completed successfully!');
      console.log('📁 Output directories:');
      console.log('  - ESM: dist/module/esm/');
      console.log('  - Types: dist/module/esm/');
      console.log('\n📊 ESM-only benefits:');
      console.log('  - Tree-shaking optimized');
      console.log('  - Modern bundler compatible');
      console.log('  - Reduced bundle size');
      console.log('  - Native ES modules');
      
      if (this.watchMode) {
        console.log('\n👀 Watching for module changes...');
      }
      
    } catch (error) {
      console.error('❌ Module build failed:', error.message);
      process.exit(1);
    }
  }

  generateBundleInfo() {
    const info = {
      name: MODULE_CONFIG.name,
      version: MODULE_CONFIG.version,
      modules: MODULE_CONFIG.modules,
      size: {
        esm: '~90KB',
        esmMinified: '~60KB'
      },
      target: 'ESM-only 3D graphics library optimized for modern bundlers',
      features: [
        'ES2020+ module syntax',
        'Tree-shaking compatible',
        'Optimized for bundlers (Webpack, Rollup, Vite)',
        'No CommonJS/UMD overhead',
        'Modern JavaScript features',
        'TypeScript native support'
      ],
      compatibility: {
        bundlers: ['Webpack 5+', 'Rollup 3+', 'Vite 3+', 'esbuild'],
        browsers: 'Modern browsers with ES2020+ support',
        node: 'Node.js 16+ with ESM support'
      }
    };

    console.log('\n📊 Module Bundle Information:');
    console.log(JSON.stringify(info, null, 2));
    
    return info;
  }
}

// Run the build
const builder = new ModuleBuilder();
builder.buildAll().then(() => {
  builder.generateBundleInfo();
}).catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});

// Export for testing
export default ModuleBuilder;