#!/usr/bin/env node
/**
 * Export Validation Script
 * Validates that all package.json exports point to existing files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = path.resolve(__dirname, '..');

class ExportValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.packageJson = null;
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  loadPackageJson() {
    try {
      const packagePath = path.join(cwd, 'package.json');
      const content = fs.readFileSync(packagePath, 'utf8');
      this.packageJson = JSON.parse(content);
    } catch (error) {
      this.errors.push('Failed to read package.json: ' + error.message);
    }
  }

  validateExports() {
    if (!this.packageJson?.exports) {
      this.errors.push('No exports defined in package.json');
      return;
    }

    this.log('Validating package exports...');

    Object.entries(this.packageJson.exports).forEach(([exportName, exportConfig]) => {
      this.validateExportPath(exportName, exportConfig);
    });

    // Also validate main/module/types
    ['main', 'module', 'types'].forEach((field) => {
      const value = this.packageJson[field];
      if (!value) return;
      const fullPath = path.join(cwd, value);
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`package.json "${field}" points to missing file: ${value}`);
      } else {
        this.log(`OK ${field} -> ${value}`);
      }
    });
  }

  validateExportPath(exportName, exportConfig) {
    const checkFile = (filePath, type) => {
      if (!filePath || filePath === './package.json') return;

      let relative = filePath.replace(/^\.\//, '');
      const fullPath = path.join(cwd, relative);

      if (!fs.existsSync(fullPath)) {
        if (type === 'types' || type === 'import' || type === 'default' || type === 'required') {
          this.errors.push(`Export path does not exist: ${exportName} [${type}] -> ${filePath}`);
        } else {
          this.warnings.push(`Optional export path does not exist: ${exportName} -> ${filePath}`);
        }
      } else {
        this.log(`OK ${exportName} [${type}] -> ${filePath}`);
      }
    };

    if (typeof exportConfig === 'string') {
      checkFile(exportConfig, 'required');
    } else if (typeof exportConfig === 'object' && exportConfig !== null) {
      checkFile(exportConfig.types, 'types');
      checkFile(exportConfig.import, 'import');
      checkFile(exportConfig.require, 'require');
      checkFile(exportConfig.default, 'default');
    }
  }

  async run() {
    this.log('Starting export validation...');
    this.loadPackageJson();

    if (this.errors.length === 0) {
      this.validateExports();
    }

    console.log('\n=== Export Validation Results ===');

    if (this.errors.length > 0) {
      this.log('\nErrors found:', 'error');
      this.errors.forEach((error) => this.log(error, 'error'));
      process.exit(1);
    }

    if (this.warnings.length > 0) {
      this.warnings.forEach((warning) => this.log(warning, 'warning'));
    }

    this.log('All required export paths exist.');
    process.exit(0);
  }
}

const validator = new ExportValidator();
validator.run().catch((error) => {
  console.error('Export validation failed:', error);
  process.exit(1);
});
