#!/usr/bin/env node
/**
 * Distribution Validation Script
 * Validates the distribution package before publishing
 */

const fs = require('fs');
const path = require('path');

class DistValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredFiles = [
      'dist/index.js',
      'dist/index.d.ts',
      'dist/core/index.js',
      'dist/core/index.d.ts',
      'dist/geometry/index.js',
      'dist/geometry/index.d.ts',
      'dist/materials/index.js',
      'dist/materials/index.d.ts',
      'dist/rendering/index.js',
      'dist/rendering/index.d.ts',
      'dist/animation/index.js',
      'dist/animation/index.d.ts',
      'dist/loaders/index.js',
      'dist/loaders/index.d.ts'
    ];
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  validateFilesExist() {
    this.log('Checking required distribution files...');
    
    this.requiredFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`Missing required file: ${file}`);
      } else {
        const stats = fs.statSync(fullPath);
        if (stats.size === 0) {
          this.warnings.push(`Empty file: ${file}`);
        }
      }
    });
  }

  validatePackageStructure() {
    this.log('Validating package structure...');
    
    // Check if dist directory exists and has structure
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
      this.errors.push('Dist directory does not exist');
      return;
    }

    // Check for main entry points
    const expectedDirs = ['cjs', 'esm', 'umd'];
    expectedDirs.forEach(dir => {
      const dirPath = path.join(distDir, dir);
      if (!fs.existsSync(dirPath)) {
        this.warnings.push(`Missing expected directory: dist/${dir}`);
      }
    });
  }

  validateFileContents() {
    this.log('Validating file contents...');
    
    const indexJs = path.join(process.cwd(), 'dist/index.js');
    if (fs.existsSync(indexJs)) {
      const content = fs.readFileSync(indexJs, 'utf8');
      
      // Check for common issues
      if (content.includes('require("fs")') || content.includes('require("path")')) {
        this.warnings.push('Main entry point contains Node.js specific requires');
      }
      
      if (content.includes('console.log') || content.includes('console.error')) {
        this.warnings.push('Main entry point contains console statements (should be removed in production)');
      }
    }
  }

  validateTypeScriptDeclarations() {
    this.log('Validating TypeScript declarations...');
    
    const typeFiles = this.requiredFiles.filter(file => file.endsWith('.d.ts'));
    
    typeFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Basic syntax check
        if (!content.includes('export') && !content.includes('declare')) {
          this.warnings.push(`Type file appears empty or malformed: ${file}`);
        }
        
        // Check for unresolved imports
        if (content.includes('import("') && content.includes('").')) {
          this.warnings.push(`Type file contains unresolved type imports: ${file}`);
        }
      }
    });
  }

  validateFileSizes() {
    this.log('Checking file sizes...');
    
    const checkSize = (filePath, maxSize) => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        const size = fs.statSync(fullPath).size;
        if (size > maxSize) {
          this.warnings.push(`Large file detected: ${filePath} (${(size / 1024).toFixed(2)}KB)`);
        }
      }
    };
    
    checkSize('dist/index.js', 500 * 1024); // 500KB
    checkSize('dist/index.d.ts', 100 * 1024); // 100KB
  }

  async run() {
    this.log('Starting distribution validation...');
    
    this.validateFilesExist();
    this.validatePackageStructure();
    this.validateFileContents();
    this.validateTypeScriptDeclarations();
    this.validateFileSizes();
    
    // Report results
    console.log('\n=== Validation Results ===');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ All validation checks passed!', 'success');
      process.exit(0);
    }
    
    if (this.errors.length > 0) {
      this.log('\n❌ Errors found:', 'error');
      this.errors.forEach(error => this.log(error, 'error'));
      process.exit(1);
    }
    
    if (this.warnings.length > 0) {
      this.log('\n⚠️ Warnings found:', 'warning');
      this.warnings.forEach(warning => this.log(warning, 'warning'));
      console.log('\n✅ Distribution is valid but has warnings.');
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new DistValidator();
  validator.run().catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = DistValidator;