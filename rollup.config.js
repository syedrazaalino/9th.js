import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import filesize from 'rollup-plugin-filesize';
import replace from '@rollup/plugin-replace';

// WebGL compatibility and feature detection
const webglCompatPlugin = replace({
  preventAssignment: true,
  values: {
    __WEBGL_VERSION__: JSON.stringify('2.0'), // Default to WebGL 2.0
    __CANVAS_2D__: JSON.stringify(true),
    __WEBGL1_SUPPORT__: JSON.stringify(true),
    __WEBGL2_SUPPORT__: JSON.stringify(true),
    __FEATURE_DETECTION__: JSON.stringify(true)
  },
  include: '**/*.{js,ts}'
});

// Base plugins for TypeScript compilation with enhanced configuration
const basePlugins = [
  resolve({
    // Enable module federation
    moduleDirectories: ['node_modules'],
    // Prefer ES modules
    preferBuiltins: false,
    // Resolve extensions in order
    extensions: ['.js', '.ts', '.mjs', '.json']
  }),
  commonjs({
    // Enhanced CommonJS handling
    include: /node_modules/,
    extensions: ['.js', '.ts'],
    strictRequires: true,
    transformMixedEsModules: true
  }),
  webglCompatPlugin,
  typescript({
    tsconfig: 'tsconfig.json',
    useTsconfigDeclarationDir: true,
    clean: true,
    // Enhanced TypeScript compilation options
    tsconfigOverride: {
      compilerOptions: {
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        skipLibCheck: true,
        noEmitOnError: false
      }
    },
    // Faster incremental builds
    incremental: true,
    // Verbose output for debugging
    verbose: false,
    // Don't fail on type errors
    check: false
  })
];

// Advanced tree-shaking configuration
const treeShakeConfig = {
  moduleSideEffects: false,
  propertyReadSideEffects: false,
  tryCatchDeoptimization: false,
  unknownGlobalSideEffects: false
};

// Enhanced terser configuration with advanced optimizations
const terserConfig = {
  compress: {
    // Advanced compression options
    drop_console: false, // Keep console for debugging
    drop_debugger: true,
    dead_code: true,
    unused: false, // Less aggressive to avoid issues
    conditionals: true,
    evaluate: true,
    arguments: false, // Less aggressive
    toplevel: false, // Less aggressive
    inline: 1, // Less aggressive inlining
    sequences: true,
    keep_infinity: false,
    if_return: true,
    booleans: true,
    reduce_vars: false, // Less aggressive
    switches: true,
    arrows: true
  },
  mangle: {
    safari10: true,
    reserved: ['VERSION', 'LIBRARY_INFO', 'createRenderer', 'createScene', 'createCamera', 'createBasicMesh'],
    properties: {
      regex: /^_/  // Mangle private properties
    }
  },
  format: {
    safari10: true,
    comments: false
  }
};

// Enhanced visualization plugin for bundle analysis
const bundleAnalyzerPlugin = visualizer({
  filename: 'dist/bundle-analysis.html',
  title: '9th.js Bundle Analysis',
  template: 'treemap',
  gzipSize: true,
  brotliSize: true
});

// Core build configuration (~150KB) - Essential functionality only
const coreBuild = {
  input: {
    core: 'src/index-core.ts',
    renderer: 'src/renderers/index.ts',
    geometry: 'src/geometry/index.js'
  },
  output: {
    dir: 'dist/core',
    format: 'es',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    assetFileNames: '[name]-[hash][extname]'
  },
  plugins: [
    ...basePlugins,
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ],
  treeshake: treeShakeConfig
};

// Full build configuration (~400KB) - Most features
const fullBuild = {
  input: {
    main: 'src/index.ts',
    utils: 'src/utils/index.ts',
    helpers: 'src/helpers/index.ts'
  },
  output: {
    dir: 'dist/full',
    format: 'es',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    assetFileNames: '[name]-[hash][extname]'
  },
  plugins: [
    ...basePlugins,
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ],
  treeshake: treeShakeConfig
};

// Experimental build configuration (~600KB) - Everything including experimental features
const experimentalBuild = {
  input: {
    main: 'src/index.ts',
    experimental: 'src/experimental/index.ts',
    advanced: 'src/advanced/index.ts',
    extras: 'src/extras/index.ts'
  },
  output: {
    dir: 'dist/experimental',
    format: 'es',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: '[name]-[hash].js',
    assetFileNames: '[name]-[hash][extname]'
  },
  plugins: [
    ...basePlugins,
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ],
  treeshake: treeShakeConfig
};

// Enhanced chunk splitting configuration for better caching
const getAdvancedChunkSplitConfig = (target) => {
  const cacheGroups = {
    // Core engine chunks - always cacheable
    core: {
      name: 'core',
      priority: 30,
      test: /[\\/]src[\\/]core[\\/]/,
      reuseExistingChunk: true
    },
    // Geometry primitives - frequently reused
    geometry: {
      name: 'geometry',
      priority: 25,
      test: /[\\/]src[\\/]geometry[\\/]/,
      reuseExistingChunk: true
    },
    // Material system - common dependency
    materials: {
      name: 'materials',
      priority: 25,
      test: /[\\/]src[\\/]materials[\\/]/,
      reuseExistingChunk: true
    },
    // Camera system - frequently used
    cameras: {
      name: 'cameras',
      priority: 20,
      test: /[\\/]src[\\/]cameras[\\/]/,
      reuseExistingChunk: true
    },
    // Lighting system - common dependency
    lights: {
      name: 'lights',
      priority: 20,
      test: /[\\/]src[\\/]lights[\\/]/,
      reuseExistingChunk: true
    },
    // Animation system - optional but cacheable
    animation: {
      name: 'animation',
      priority: 15,
      test: /[\\/]src[\\/]animation[\\/]/,
      reuseExistingChunk: true
    },
    // Loaders - large but cacheable
    loaders: {
      name: 'loaders',
      priority: 10,
      test: /[\\/]src[\\/]loaders[\\/]/,
      reuseExistingChunk: true
    },
    // Particle system - experimental
    particles: {
      name: 'particles',
      priority: 10,
      test: /[\\/]src[\\/]particles[\\/]/,
      reuseExistingChunk: true
    },
    // WebGL utilities - always needed
    webgl: {
      name: 'webgl-utils',
      priority: 25,
      test: /[\\/]src[\\/]core[\\/](WebGL|Shader)/,
      reuseExistingChunk: true
    }
  };

  // Target-specific adjustments
  if (target === 'core') {
    // Limit chunks for core build
    cacheGroups.core.priority = 50;
  } else if (target === 'experimental') {
    // More granular chunks for experimental
    cacheGroups.experimental = {
      name: 'experimental',
      priority: 5,
      test: /[\\/]src[\\/]experimental[\\/]/,
      reuseExistingChunk: true
    };
  }

  return cacheGroups;
};

// Enhanced ES Modules build with advanced chunk splitting
const esmBuild = {
  input: {
    main: 'src/index.ts'
  },
  output: {
    dir: 'dist/esm',
    format: 'es',
    sourcemap: true,
    entryFileNames: '[name].js',
    chunkFileNames: (chunkInfo) => {
      const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '') : 'chunk';
      return '[name]-[hash].js';
    },
    assetFileNames: '[name]-[hash][extname]'
  },
  plugins: [
    ...basePlugins,
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ],
  treeshake: treeShakeConfig,
  manualChunks: (id, { getModuleInfo }) => {
    // Dynamic chunking based on module relationships
    if (id.includes('src/core/')) return 'core';
    if (id.includes('src/geometry/')) return 'geometry';
    if (id.includes('src/materials/')) return 'materials';
    if (id.includes('src/cameras/')) return 'cameras';
    if (id.includes('src/lights/')) return 'lights';
    if (id.includes('src/animation/')) return 'animation';
    if (id.includes('src/loaders/')) return 'loaders';
    if (id.includes('src/particles/')) return 'particles';
    return null;
  }
};

// Enhanced ES Modules Minified build
const esmMinifiedBuild = {
  ...esmBuild,
  output: {
    ...esmBuild.output,
    file: 'dist/9th.esm.min.js',
    // Override to single file for minified build
    entryFileNames: '[name].min.js',
    chunkFileNames: '[name]-[hash].min.js'
  },
  plugins: [
    ...basePlugins,
    terser(terserConfig),
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ]
};

// Enhanced UMD build with WebGL compatibility and global variable configuration
const umdBuild = {
  input: 'src/index.ts',
  output: {
    file: 'dist/umd/9th.umd.js',
    format: 'umd',
    name: '9thJS',
    sourcemap: true,
    exports: 'named',  // Only named exports
    globals: {},
    banner: `/*
 * 9th.js v${process.env.npm_package_version || '0.1.0'}
 * A modern 3D JavaScript library with WebGL 1.0/2.0 support
 * 
 * Usage: const { WebGLRenderer, Scene } = window['9thJS'];
 */`
  },
  plugins: [
    ...basePlugins,
    bundleAnalyzerPlugin
  ],
  onwarn: (warning, warn) => {
    if (warning.code === 'THIS_IS_UNDEFINED') return;
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  }
};

// Enhanced UMD Minified build with advanced WebGL optimizations
const umdMinifiedBuild = {
  ...umdBuild,
  output: {
    ...umdBuild.output,
    file: 'dist/umd/9th.umd.min.js'
  },
  plugins: [
    ...basePlugins,
    terser(terserConfig),
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ]
};

// Enhanced Development UMD build with debugging features
const umdDevBuild = {
  ...umdBuild,
  output: {
    ...umdBuild.output,
    file: 'dist/umd/9th.umd.dev.js'
  },
  plugins: [
    ...basePlugins,
    // Debug plugin for development
    replace({
      preventAssignment: true,
      values: {
        __DEBUG__: JSON.stringify(true),
        __DEV__: JSON.stringify(true)
      }
    }),
    filesize({
      showMinifiedSize: false,
      showGzippedSize: false,
      showBrotiliSize: false
    })
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  }
};

// Enhanced IIFE build with simple usage pattern
const iifeBuild = {
  input: 'src/index.ts',
  output: {
    file: 'dist/iife/9th.iife.js',
    format: 'iife',
    name: 'NinthJS',
    sourcemap: true,
    // Enhanced global configuration
    globals: {
      // WebGL globals
      'WebGLRenderingContext': 'window.WebGLRenderingContext',
      'WebGL2RenderingContext': 'window.WebGL2RenderingContext',
      // Canvas globals
      'HTMLCanvasElement': 'window.HTMLCanvasElement',
      // Performance globals
      'Performance': 'window.performance'
    },
    // Footer with WebGL detection
    banner: `/*
 * 9th.js IIFE Build - WebGL 1.0/2.0 Compatible
 */`,
    footer: `; // End of 9th.js IIFE`
  },
  plugins: [
    ...basePlugins,
    filesize({
      showMinifiedSize: false,
      showGzippedSize: false,
      showBrotiliSize: false
    })
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  }
};

// Enhanced IIFE Minified build
const iifeMinifiedBuild = {
  ...iifeBuild,
  output: {
    ...iifeBuild.output,
    file: 'dist/iife/9th.iife.min.js'
  },
  plugins: [
    ...basePlugins,
    terser(terserConfig),
    bundleAnalyzerPlugin,
    filesize({
      showMinifiedSize: true,
      showGzippedSize: true,
      showBrotiliSize: true
    })
  ]
};

// Import maps configuration for better module loading
const generateImportMap = (buildDir, baseUrl = '.') => {
  return {
    imports: {
      '9th.js': `${baseUrl}/dist/umd/9th.umd.min.js`,
      '9th.js/core': `${baseUrl}/${buildDir}/core/index.js`,
      '9th.js/geometry': `${baseUrl}/${buildDir}/geometry/index.js`,
      '9th.js/materials': `${baseUrl}/${buildDir}/materials/index.js`,
      '9th.js/renderers': `${baseUrl}/${buildDir}/renderers/index.js`,
      '9th.js/animation': `${baseUrl}/${buildDir}/animation/index.js`,
      '9th.js/loaders': `${baseUrl}/${buildDir}/loaders/index.js`,
      '9th.js/particles': `${baseUrl}/${buildDir}/particles/index.js`,
      '9th.js/extras': `${baseUrl}/${buildDir}/extras/index.js`
    }
  };
};

// Export all enhanced builds - simplified for npm publishing
export default [
  // ES Modules builds (main build for npm)
  esmBuild,
  
  // UMD builds (CDN and global usage)
  umdBuild,
  umdMinifiedBuild
];

// Enhanced build metadata for tracking build sizes and features
export const BUILD_METADATA = {
  version: process.env.npm_package_version || '0.1.0',
  builds: {
    core: {
      target: 'dist/core',
      approximateSize: '150KB',
      description: 'Essential 9th.js functionality',
      features: ['Core Engine', 'Basic Geometry', 'Simple Materials', 'WebGL 1.0/2.0']
    },
    full: {
      target: 'dist/full',
      approximateSize: '400KB',
      description: 'Complete 9th.js library',
      features: ['Full Engine', 'All Geometry', 'Advanced Materials', 'Lighting', 'Animation', 'Loaders']
    },
    experimental: {
      target: 'dist/experimental',
      approximateSize: '600KB',
      description: '9th.js with experimental features',
      features: ['Full Features', 'Particle Systems', 'Physics', 'Advanced Shaders', 'Experimental APIs']
    }
  },
  optimization: {
    treeShaking: true,
    chunkSplitting: true,
    minification: 'Terser',
    sourceMaps: true,
    webglCompat: '1.0/2.0',
    advancedCompression: true
  }
};

// Generate import maps for different environments
export const importMaps = {
  development: generateImportMap('dist'),
  production: generateImportMap('dist', '/9th.js'),
  cdn: generateImportMap('dist', 'https://cdn.9thjs.com')
};