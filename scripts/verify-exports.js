#!/usr/bin/env node
/**
 * Export Validation Script
 * Validates that all package.json exports point to existing files
 */

const fs = require('fs');
const path = require('path');

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
      const packagePath = path.join(process.cwd(), 'package.json');
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
  }

  validateExportPath(exportName, exportConfig) {
    const checkPath = (path, type) => {
      if (!path) return;
      
      // Convert package paths to file system paths
      let filePath = path.replace('./', '');
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        if (type === 'required') {
          this.errors.push(`Required export path does not exist: ${exportName} -> ${path}`);
        } else {
          this.warnings.push(`Optional export path does not exist: ${exportName} -> ${path}`);
        }
      } else {
        // Validate file content
        this.validateFileContent(fullPath, exportName);
      }
    };

    if (typeof exportConfig === 'string') {
      checkPath(exportConfig, 'required');
    } else if (typeof exportConfig === 'object' && exportConfig !== null) {
      checkPath(exportConfig.import, 'import');
      checkPath(exportConfig.require, 'require');
      checkPath(exportConfig.types, 'types');
    }
  }

  validateFileContent(filePath, exportName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if it's a valid module
      if (filePath.endsWith('.js')) {
        this.validateJSModule(content, filePath, exportName);
      } else if (filePath.endsWith('.d.ts')) {
        this.validateTypeDeclaration(content, filePath, exportName);
      }
    } catch (error) {
      this.errors.push(`Failed to read export file: ${filePath} - ${error.message}`);
    }
  }

  validateJSModule(content, filePath, exportName) {
    // Basic JavaScript validation
    if (content.trim().length === 0) {
      this.warnings.push(`Empty JavaScript file: ${filePath}`);
      return;
    }

    // Check for syntax errors (basic check)
    if (content.includes('undefined is not defined') || content.includes('ReferenceError')) {
      this.warnings.push(`Potential syntax issues in: ${filePath}`);
    }

    // Check for console statements in production builds
    if (filePath.includes('.min.') && content.includes('console.log')) {
      this.warnings.push(`Console statements in minified file: ${filePath}`);
    }
  }

  validateTypeDeclaration(content, filePath, exportName) {
    // Basic TypeScript declaration validation
    if (content.trim().length === 0) {
      this.errors.push(`Empty TypeScript declaration file: ${filePath}`);
      return;
    }

    // Check for unresolved imports
    const unresolvedImports = content.match(/import\(".*?"\)/g);
    if (unresolvedImports && unresolvedImports.length > 0) {
      this.warnings.push(`Unresolved type imports in: ${filePath}`);
    }

    // Check for proper module declarations
    if (!content.includes('export') && !content.includes('declare')) {
      this.warnings.push(`No exports found in type declaration: ${filePath}`);
    }
  }

  validateConditionalExports() {
    if (!this.packageJson?.exports) return;

    this.log('Validating conditional exports...');
    
    Object.entries(this.packageJson.exports).forEach(([exportName, exportConfig]) => {
      if (typeof exportConfig === 'object' && exportConfig !== null) {
        // Check for both import and require for dual compatibility
        const hasImport = !!exportConfig.import;
        const hasRequire = !!exportConfig.require;
        const hasTypes = !!exportConfig.types;

        if (hasImport && !hasRequire) {
          this.warnings.push(`Export "${exportName}" has import but no require path`);
        }
        
        if (hasRequire && !hasImport) {
          this.warnings.push(`Export "${exportName}" has require but no import path`);
        }

        if (!hasTypes) {
          this.warnings.push(`Export "${exportName}" missing type declarations`);
        }

        // Validate type compatibility
        if (hasTypes) {
          this.validateTypeCompatibility(exportName, exportConfig);
        }
      }
    });
  }

  validateTypeCompatibility(exportName, exportConfig) {
    const typePath = exportConfig.types;
    const importPath = exportConfig.import;
    const requirePath = exportConfig.require;

    // Basic type path validation
    if (typePath && importPath) {
      const typeExt = path.extname(typePath);
      const importExt = path.extname(importPath);
      
      if (typeExt === '.d.ts' && importExt !== '.js') {
        this.warnings.push(`Type declaration mismatch for "${exportName}": .d.ts with non-.js import`);
      }
    }
  }

  async run() {
    this.log('Starting export validation...');
    
    this.loadPackageJson();
    
    if (this.errors.length === 0) {
      this.validateExports();
    }
    
    if (this.errors.length === 0) {
      this.validateConditionalExports();
    }
    
    // Report results
    console.log('\n=== Export Validation Results ===');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('✅ All export validations passed!', 'success');
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
      console.log('\n✅ Exports are valid but have warnings.');
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new ExportValidator();
  validator.run().catch(error => {
    console.error('❌ Export validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = ExportValidator;