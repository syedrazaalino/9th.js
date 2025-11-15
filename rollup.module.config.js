import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const input = 'src/index.ts';

// Base plugins optimized for ES modules
const baseESMPlugins = [
  resolve({
    extensions: ['.js', '.ts'],
    preferBuiltins: true
  }),
  commonjs(),
  typescript({
    tsconfig: 'tsconfig.module.json',
    useTsconfigDeclarationDir: true,
    clean: true
  })
];

// ES Module build (optimized for bundlers)
const esmModule = {
  input,
  output: {
    file: 'dist/module/esm/index.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'
  },
  plugins: baseESMPlugins,
  external: [],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  }
};

// ES Module Minified build (production)
const esmModuleMinified = {
  input,
  output: {
    file: 'dist/module/esm/index.min.js',
    format: 'es',
    sourcemap: true,
    exports: 'named'
  },
  plugins: [
    ...baseESMPlugins,
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        unused: true,
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        safari10: true,
        comments: false
      }
    })
  ],
  external: [],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
    unknownGlobalSideEffects: false
  }
};

// Export all builds with filtering capability
export default [
  esmModule,
  esmModuleMinified
].filter((config, index, array) => {
  // Filter builds based on command line arguments
  const filters = process.argv.filter(arg => arg.startsWith('--filter'));
  
  if (filters.length === 0) {
    return true; // Include all builds
  }
  
  const buildName = config.output.file.includes('min') ? 'esmModuleMinified' : 'esmModule';
  
  return filters.some(filter => {
    const filterText = filter.replace('--filter', '');
    return buildName.includes(filterText) || 
           config.output.file.includes(filterText);
  });
});