#!/usr/bin/env node
/**
 * Distribution Preparation Script
 * Prepares the distribution package with additional files and optimizations
 */

const fs = require('fs');
const path = require('path');

class DistPreparator {
  constructor() {
    this.distDir = path.join(process.cwd(), 'dist');
    this.srcDir = path.join(process.cwd(), 'src');
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} ${message}`);
  }

  async prepare() {
    this.log('Starting distribution preparation...');
    
    try {
      await this.ensureDistDirectory();
      await this.copyPackageFiles();
      await this.createIndexFiles();
      await this.generateReadme();
      await this.validateStructure();
      
      this.log('Distribution preparation completed successfully!', 'success');
    } catch (error) {
      this.log(`Distribution preparation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async ensureDistDirectory() {
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }
  }

  async copyPackageFiles() {
    this.log('Copying package files to dist...');
    
    // Copy package.json to dist for reference
    const srcPackageJson = path.join(process.cwd(), 'package.json');
    const distPackageJson = path.join(this.distDir, 'package.json');
    
    if (fs.existsSync(srcPackageJson)) {
      let packageContent = JSON.parse(fs.readFileSync(srcPackageJson, 'utf8'));
      
      // Remove unnecessary fields for dist package.json
      delete packageContent.devDependencies;
      delete packageContent.scripts;
      delete packageContent.bundledDependencies;
      delete packageContent.optionalDependencies;
      
      // Keep only essential files pattern for dist
      packageContent.files = [
        '*.js',
        '*.d.ts',
        'cjs/',
        'esm/',
        'umd/',
        'README.md'
      ];
      
      fs.writeFileSync(distPackageJson, JSON.stringify(packageContent, null, 2));
    }

    // Copy LICENSE to dist
    const srcLicense = path.join(process.cwd(), 'LICENSE');
    const distLicense = path.join(this.distDir, 'LICENSE');
    if (fs.existsSync(srcLicense)) {
      fs.copyFileSync(srcLicense, distLicense);
    }
  }

  async createIndexFiles() {
    this.log('Creating additional index files...');
    
    // Create a comprehensive index file for browser usage
    const browserIndexContent = `/**
 * Ninth.js - Browser Distribution
 * 
 * This file provides browser-ready access to Ninth.js functionality.
 * Include this script in your HTML to use Ninth.js globally.
 * 
 * @version ${this.getVersion()}
 * @license MIT
 */

(function(global) {
  'use strict';
  
  // Store original require if it exists
  var previousRequire = global.require;
  
  // Create a module-like environment for browser
  function browserRequire(modulePath) {
    // Convert module paths to global references
    switch(modulePath) {
      case '9th.js':
      case './':
      case '.':
        return global.NinthJS;
      case './core':
        return global.NinthJS?.Core || {};
      case './geometry':
        return global.NinthJS?.Geometry || {};
      case './materials':
        return global.NinthJS?.Materials || {};
      case './rendering':
        return global.NinthJS?.Rendering || {};
      case './animation':
        return global.NinthJS?.Animation || {};
      case './loaders':
        return global.NinthJS?.Loaders || {};
      case './cameras':
        return global.NinthJS?.Cameras || {};
      case './lights':
        return global.NinthJS?.Lights || {};
      case './controls':
        return global.NinthJS?.Controls || {};
      case './particles':
        return global.NinthJS?.Particles || {};
      case './physics':
        return global.NinthJS?.Physics || {};
      case './textures':
        return global.NinthJS?.Textures || {};
      default:
        console.warn('Module not found in browser context:', modulePath);
        return {};
    }
  }
  
  // Attach to global scope
  global.require = browserRequire;
  global.NinthJS = global.NinthJS || {};
  
  // Restore original require
  global.require = previousRequire;
  
})(typeof window !== 'undefined' ? window : global);
`;
    
    const browserIndexPath = path.join(this.distDir, 'browser.js');
    fs.writeFileSync(browserIndexPath, browserIndexContent);

    // Create a UMD wrapper template
    const umdTemplate = `/**
 * Ninth.js UMD Distribution
 * 
 * @version ${this.getVersion()}
 * @license MIT
 * 
 * Usage:
 * - Browser: <script src="ninth.umd.js"></script>
 * - CommonJS: const NinthJS = require('ninth.js');
 * - AMD: define(['ninth.js'], function(NinthJS) { ... });
 * - ES6: import * as NinthJS from 'ninth.js';
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory();
  } else {
    // Browser globals
    root.NinthJS = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';
  
  // This will be replaced with actual UMD build
  var NinthJS = {};
  
  return NinthJS;
}));
`;
    
    const umdTemplatePath = path.join(this.distDir, 'umd-template.js');
    fs.writeFileSync(umdTemplatePath, umdTemplate);
  }

  async generateReadme() {
    this.log('Generating distribution README...');
    
    const distReadmeContent = `# Ninth.js Distribution

This directory contains the built distribution files for Ninth.js.

## Files

- \`index.js\` - Main CommonJS entry point
- \`index.d.ts\` - TypeScript type definitions
- \`cjs/\` - CommonJS modules
- \`esm/\` - ES Modules
- \`umd/\` - Universal Module Definition (browser + Node.js)
- \`browser.js\` - Browser-specific entry point
- \`package.json\` - Package metadata

## Usage

### Node.js (CommonJS)
\`\`\`javascript
const NinthJS = require('9th.js');
const { Engine, Scene } = NinthJS;
\`\`\`

### ES6 Modules
\`\`\`javascript
import { Engine, Scene } from '9th.js';
\`\`\`

### Browser (UMD)
\`\`\`html
<script src="9th.umd.min.js"></script>
<script>
  const engine = new NinthJS.Engine(canvas);
</script>
\`\`\`

## Version
Built from source version: ${this.getVersion()}

## License
MIT - See LICENSE file for details
`;
    
    const distReadmePath = path.join(this.distDir, 'README.md');
    fs.writeFileSync(distReadmePath, distReadmeContent);
  }

  async validateStructure() {
    this.log('Validating distribution structure...');
    
    const requiredStructure = [
      'index.js',
      'index.d.ts',
      'package.json',
      'LICENSE',
      'README.md'
    ];

    const missingFiles = [];
    
    requiredStructure.forEach(file => {
      const filePath = path.join(this.distDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });

    if (missingFiles.length > 0) {
      this.log(`Missing required files: ${missingFiles.join(', ')}`, 'warning');
    } else {
      this.log('Distribution structure is complete');
    }
  }

  getVersion() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      return packageJson.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }
}

// Run preparation
if (require.main === module) {
  const preparator = new DistPreparator();
  preparator.prepare().catch(error => {
    console.error('❌ Distribution preparation failed with error:', error);
    process.exit(1);
  });
}

module.exports = DistPreparator;