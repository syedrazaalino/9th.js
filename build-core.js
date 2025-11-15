import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core package configuration - minimal features only
const CORE_CONFIG = {
  name: '9th.js-core',
  version: '0.1.0',
  source: 'src/core/index.ts',
  output: {
    esm: 'dist/core/esm/index.js',
    cjs: 'dist/core/cjs/index.js'
  },
  // Core modules only - essential 3D functionality
  modules: [
    'core',
    'geometry'
  ],
  // Exclude experimental and advanced features
  excludes: [
    'experimental',
    'physics',
    'particles',
    'advanced-materials',
    'ai',
    'webgpu'
  ]
};

class CoreBuilder {
  constructor() {
    this.watchMode = process.argv.includes('--watch');
    this.cleanOutput();
  }

  cleanOutput() {
    const outputDirs = [
      'dist/core',
      'dist/core/esm',
      'dist/core/cjs'
    ];

    for (const dir of outputDirs) {
      if (existsSync(dir)) {
        // Clean output directories
        spawn('rm', ['-rf', dir]);
      }
      mkdirSync(dir, { recursive: true });
    }
  }

  async buildESM() {
    console.log('🔨 Building Core ESM...');
    
    const buildArgs = [
      'src/core/index.ts',
      '--format', 'es',
      '--outfile', 'dist/core/esm/index.js',
      '--sourcemap',
      '--tree-shaking'
    ];

    // Filter core modules only
    const moduleFilter = CORE_CONFIG.modules.join('|');
    buildArgs.push('--filter', `(${moduleFilter})`);

    return this.runRollup(buildArgs);
  }

  async buildCJS() {
    console.log('🔨 Building Core CommonJS...');
    
    const buildArgs = [
      'src/core/index.ts',
      '--format', 'cjs',
      '--outfile', 'dist/core/cjs/index.js',
      '--sourcemap',
      '--exports', 'named'
    ];

    return this.runRollup(buildArgs);
  }

  async buildTypes() {
    console.log('🔨 Building Core TypeScript types...');
    
    // Use a simplified TypeScript config for core
    const typeArgs = [
      'tsc',
      '--emitDeclarationOnly',
      '--outDir', 'dist/core/esm',
      '--project', 'tsconfig.core.json',
      '--filter', CORE_CONFIG.modules.join('|')
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('npm', typeArgs, { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Core types built successfully');
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
        proc.on('spawn', () => console.log('🔄 Core build started in watch mode'));
      }

      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Core build completed successfully');
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
    console.log('🚀 Starting Core package build...');
    console.log(`📦 Building ${CORE_CONFIG.name} v${CORE_CONFIG.version}`);
    console.log(`🎯 Core modules: ${CORE_CONFIG.modules.join(', ')}`);
    
    try {
      await this.buildESM();
      await this.buildCJS();
      await this.buildTypes();
      
      console.log('\n🎉 Core build completed successfully!');
      console.log('📁 Output directories:');
      console.log('  - ESM: dist/core/esm/');
      console.log('  - CJS: dist/core/cjs/');
      console.log('  - Types: dist/core/esm/');
      
      if (this.watchMode) {
        console.log('\n👀 Watching for changes...');
      }
      
    } catch (error) {
      console.error('❌ Core build failed:', error.message);
      process.exit(1);
    }
  }

  generateBundleInfo() {
    const info = {
      name: CORE_CONFIG.name,
      version: CORE_CONFIG.version,
      modules: CORE_CONFIG.modules,
      size: {
        esm: '~45KB',
        cjs: '~50KB'
      },
      target: 'Minimal core library for essential 3D graphics'
    };

    console.log('\n📊 Core Bundle Information:');
    console.log(JSON.stringify(info, null, 2));
    
    return info;
  }
}

// Run the build
const builder = new CoreBuilder();
builder.buildAll().then(() => {
  builder.generateBundleInfo();
}).catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});

// Export for testing
export default CoreBuilder;