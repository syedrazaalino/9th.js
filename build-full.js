import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Full package configuration - complete library with all features
const FULL_CONFIG = {
  name: '9th.js-full',
  version: '0.1.0',
  source: 'src/index.ts',
  outputs: {
    esm: 'dist/full/esm/index.js',
    cjs: 'dist/full/cjs/index.js',
    umd: 'dist/full/umd/9th.js',
    dev: 'dist/full/dev/index.js'
  },
  // All modules included
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

class FullBuilder {
  constructor() {
    this.watchMode = process.argv.includes('--watch');
    this.esmOnly = process.argv.includes('--esm');
    this.umdOnly = process.argv.includes('--umd');
    this.cleanOutput();
  }

  cleanOutput() {
    const outputDirs = [
      'dist/full',
      'dist/full/esm',
      'dist/full/cjs',
      'dist/full/umd',
      'dist/full/dev'
    ];

    for (const dir of outputDirs) {
      if (existsSync(dir)) {
        spawn('rm', ['-rf', dir]);
      }
      mkdirSync(dir, { recursive: true });
    }
  }

  async buildESM() {
    console.log('🔨 Building Full ESM...');
    
    const buildArgs = [
      'src/index.ts',
      '--format', 'es',
      '--outfile', 'dist/full/esm/index.js',
      '--sourcemap',
      '--tree-shaking'
    ];

    return this.runRollup(buildArgs);
  }

  async buildCJS() {
    console.log('🔨 Building Full CommonJS...');
    
    const buildArgs = [
      'src/index.ts',
      '--format', 'cjs',
      '--outfile', 'dist/full/cjs/index.js',
      '--sourcemap',
      '--exports', 'named'
    ];

    return this.runRollup(buildArgs);
  }

  async buildUMD() {
    console.log('🔨 Building Full UMD...');
    
    const buildArgs = [
      'src/index.ts',
      '--format', 'umd',
      '--outfile', 'dist/full/umd/9th.js',
      '--name', 'NinthJS',
      '--sourcemap'
    ];

    return this.runRollup(buildArgs);
  }

  async buildDevelopment() {
    console.log('🔨 Building Full Development...');
    
    const buildArgs = [
      'src/index.ts',
      '--format', 'cjs',
      '--outfile', 'dist/full/dev/index.js',
      '--sourcemap',
      '--exports', 'named',
      '--no-treeshaking'
    ];

    return this.runRollup(buildArgs);
  }

  async buildMinified() {
    console.log('🔨 Building Full Minified...');
    
    const formats = ['es', 'cjs', 'umd'];
    const promises = formats.map(format => this.buildMinifiedFormat(format));
    
    return Promise.all(promises);
  }

  async buildMinifiedFormat(format) {
    const outputMap = {
      es: 'dist/full/esm/index.min.js',
      cjs: 'dist/full/cjs/index.min.js',
      umd: 'dist/full/umd/9th.min.js'
    };

    const buildArgs = [
      'src/index.ts',
      '--format', format,
      '--outfile', outputMap[format],
      '--sourcemap',
      '--minify'
    ];

    if (format === 'umd') {
      buildArgs.push('--name', 'NinthJS');
    }

    return this.runRollup(buildArgs);
  }

  async buildTypes() {
    console.log('🔨 Building Full TypeScript types...');
    
    const typeArgs = [
      'tsc',
      '--emitDeclarationOnly',
      '--outDir', 'dist/full/esm',
      '--project', 'tsconfig.json'
    ];

    return new Promise((resolve, reject) => {
      const proc = spawn('npm', typeArgs, { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Full types built successfully');
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
        proc.on('spawn', () => console.log('🔄 Full build started in watch mode'));
      }

      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Full build completed successfully');
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
    console.log('🚀 Starting Full package build...');
    console.log(`📦 Building ${FULL_CONFIG.name} v${FULL_CONFIG.version}`);
    console.log(`🎯 All modules: ${FULL_CONFIG.modules.length} included`);
    
    try {
      if (this.esmOnly) {
        await this.buildESM();
      } else if (this.umdOnly) {
        await this.buildUMD();
      } else {
        await this.buildESM();
        await this.buildCJS();
        await this.buildUMD();
        await this.buildDevelopment();
        await this.buildMinified();
      }
      
      await this.buildTypes();
      
      console.log('\n🎉 Full build completed successfully!');
      console.log('📁 Output directories:');
      console.log('  - ESM: dist/full/esm/');
      console.log('  - CJS: dist/full/cjs/');
      console.log('  - UMD: dist/full/umd/');
      console.log('  - Dev: dist/full/dev/');
      console.log('  - Types: dist/full/esm/');
      
      if (this.watchMode) {
        console.log('\n👀 Watching for changes...');
      }
      
    } catch (error) {
      console.error('❌ Full build failed:', error.message);
      process.exit(1);
    }
  }

  generateBundleInfo() {
    const info = {
      name: FULL_CONFIG.name,
      version: FULL_CONFIG.version,
      modules: FULL_CONFIG.modules,
      size: {
        esm: '~180KB',
        cjs: '~200KB',
        umd: '~250KB',
        minified: {
          esm: '~120KB',
          cjs: '~135KB',
          umd: '~170KB'
        }
      },
      target: 'Complete 3D graphics library with all features',
      features: [
        'Core 3D rendering engine',
        'Complete geometry system',
        'Advanced materials and shaders',
        'Animation system',
        'Model loaders (GLTF, OBJ, STL, etc.)',
        'Lighting system',
        'Particle systems',
        'Physics integration',
        'Camera controls',
        'Texture management'
      ]
    };

    console.log('\n📊 Full Bundle Information:');
    console.log(JSON.stringify(info, null, 2));
    
    return info;
  }
}

// Run the build
const builder = new FullBuilder();
builder.buildAll().then(() => {
  builder.generateBundleInfo();
}).catch((error) => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});

// Export for testing
export default FullBuilder;