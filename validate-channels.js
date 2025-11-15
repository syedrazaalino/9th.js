#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ChannelValidator {
  constructor() {
    this.channels = {
      core: 'core-package.json',
      full: 'full-package.json', 
      module: 'module-package.json',
      experimental: 'experimental-package.json'
    };
    
    this.buildScripts = {
      core: 'build-core.js',
      full: 'build-full.js',
      module: 'build-module.js',
      experimental: 'build-experimental.js'
    };
    
    this.results = {
      files: {},
      scripts: {},
      dependencies: {},
      builds: {},
      errors: [],
      warnings: []
    };
  }

  validate() {
    console.log('🔍 Validating 9th.js Release Channel System...\n');
    
    this.validateFiles();
    this.validateScripts();
    this.validateDependencies();
    this.validateBuildSystem();
    
    this.printResults();
    return this.results.errors.length === 0;
  }

  validateFiles() {
    console.log('📁 Validating package files...');
    
    Object.entries(this.channels).forEach(([channel, packageFile]) => {
      const exists = existsSync(packageFile);
      this.results.files[channel] = exists;
      
      if (exists) {
        try {
          const data = JSON.parse(readFileSync(packageFile, 'utf8'));
          const hasValidStructure = this.validatePackageStructure(data, channel);
          this.results.files[`${channel}_valid`] = hasValidStructure;
          
          if (hasValidStructure) {
            console.log(`  ✅ ${channel}: Valid package.json (${data.version})`);
          } else {
            console.log(`  ⚠️  ${channel}: Package.json exists but has issues`);
            this.results.warnings.push(`${channel}: Package structure issues`);
          }
        } catch (error) {
          console.log(`  ❌ ${channel}: Invalid JSON in package.json`);
          this.results.errors.push(`${channel}: Invalid JSON - ${error.message}`);
        }
      } else {
        console.log(`  ❌ ${channel}: Missing ${packageFile}`);
        this.results.errors.push(`${channel}: Missing ${packageFile}`);
      }
    });
    
    console.log('');
  }

  validatePackageStructure(data, channel) {
    const requiredFields = ['name', 'version', 'description', 'scripts'];
    const hasRequired = requiredFields.every(field => data[field]);
    
    if (!hasRequired) {
      this.results.errors.push(`${channel}: Missing required fields`);
      return false;
    }
    
    // Validate build scripts exist
    const buildScript = data.scripts.build || data.scripts['build:channel'];
    if (!buildScript) {
      this.results.warnings.push(`${channel}: No build script found`);
    }
    
    return true;
  }

  validateScripts() {
    console.log('📜 Validating build scripts...');
    
    Object.entries(this.buildScripts).forEach(([channel, scriptFile]) => {
      const exists = existsSync(scriptFile);
      this.results.scripts[channel] = exists;
      
      if (exists) {
        console.log(`  ✅ ${channel}: ${scriptFile} exists`);
      } else {
        console.log(`  ❌ ${channel}: Missing ${scriptFile}`);
        this.results.errors.push(`${channel}: Missing ${scriptFile}`);
      }
    });
    
    console.log('');
  }

  validateDependencies() {
    console.log('📦 Validating dependencies...');
    
    // Check for concurrently in devDependencies
    try {
      const mainPackage = JSON.parse(readFileSync('package.json', 'utf8'));
      const hasConcurrently = mainPackage.devDependencies && 
                             mainPackage.devDependencies.concurrently;
      
      this.results.dependencies.concurrently = hasConcurrently;
      
      if (hasConcurrently) {
        console.log('  ✅ concurrently: Available for parallel builds');
      } else {
        console.log('  ⚠️  concurrently: Missing (recommended for channel:dev:all)');
        this.results.warnings.push('concurrently: Missing from devDependencies');
      }
      
    } catch (error) {
      console.log('  ❌ Could not validate dependencies');
      this.results.errors.push(`Dependencies validation failed: ${error.message}`);
    }
    
    console.log('');
  }

  validateBuildSystem() {
    console.log('🔨 Validating build system...');
    
    // Check main rollup config
    const hasMainRollup = existsSync('rollup.config.js');
    this.results.builds.mainRollup = hasMainRollup;
    
    if (hasMainRollup) {
      console.log('  ✅ rollup.config.js: Main build configuration exists');
    } else {
      console.log('  ❌ rollup.config.js: Missing main build configuration');
      this.results.errors.push('Main rollup configuration missing');
    }
    
    // Check module rollup config
    const hasModuleRollup = existsSync('rollup.module.config.js');
    this.results.builds.moduleRollup = hasModuleRollup;
    
    if (hasModuleRollup) {
      console.log('  ✅ rollup.module.config.js: Module build configuration exists');
    } else {
      console.log('  ❌ rollup.module.config.js: Missing module build configuration');
      this.results.errors.push('Module rollup configuration missing');
    }
    
    // Check TypeScript configs
    const tsConfigs = ['tsconfig.core.json', 'tsconfig.module.json', 'tsconfig.experimental.json'];
    tsConfigs.forEach(config => {
      const exists = existsSync(config);
      this.results.builds[config] = exists;
      
      if (exists) {
        console.log(`  ✅ ${config}: TypeScript configuration exists`);
      } else {
        console.log(`  ⚠️  ${config}: Missing (recommended)`);
        this.results.warnings.push(`${config}: Missing TypeScript configuration`);
      }
    });
    
    console.log('');
  }

  async testBuildCommands() {
    console.log('🧪 Testing build commands...');
    
    const testCommands = [
      'npm run channel:version:list',
      'npm run channel:sync:versions --dry-run --matrix',
    ];
    
    for (const command of testCommands) {
      try {
        console.log(`  🔄 Testing: ${command}`);
        execSync(command, { stdio: 'pipe', timeout: 30000 });
        console.log(`  ✅ ${command}: Success`);
      } catch (error) {
        console.log(`  ❌ ${command}: Failed`);
        this.results.errors.push(`Command failed: ${command} - ${error.message}`);
      }
    }
    
    console.log('');
  }

  printResults() {
    console.log('📊 Validation Results:');
    console.log('═'.repeat(60));
    
    // Files
    console.log('\n📁 Package Files:');
    Object.entries(this.results.files).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}`);
    });
    
    // Scripts
    console.log('\n📜 Build Scripts:');
    Object.entries(this.results.scripts).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}`);
    });
    
    // Dependencies
    console.log('\n📦 Dependencies:');
    Object.entries(this.results.dependencies).forEach(([key, value]) => {
      const status = value ? '✅' : '⚠️';
      console.log(`  ${status} ${key}`);
    });
    
    // Build System
    console.log('\n🔨 Build System:');
    Object.entries(this.results.builds).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`  ${status} ${key}`);
    });
    
    // Summary
    console.log('\n📈 Summary:');
    console.log(`  ✅ Valid: ${this.getValidCount()}`);
    console.log(`  ❌ Errors: ${this.results.errors.length}`);
    console.log(`  ⚠️  Warnings: ${this.results.warnings.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.results.warnings.forEach(warning => {
        console.log(`  • ${warning}`);
      });
    }
    
    console.log('═'.repeat(60));
    
    if (this.results.errors.length === 0) {
      console.log('\n🎉 All release channels are properly configured!');
      console.log('\n📋 Next steps:');
      console.log('  1. Test individual builds: npm run channel:build:core');
      console.log('  2. Sync versions: npm run channel:sync:versions --dry-run');
      console.log('  3. Run full release: npm run channel:release');
    } else {
      console.log('\n❌ Please fix the errors before proceeding.');
      console.log('\n🛠️  Common solutions:');
      console.log('  • Run npm install to ensure all dependencies are installed');
      console.log('  • Check that all package files and build scripts exist');
      console.log('  • Verify TypeScript configurations are correct');
    }
  }

  getValidCount() {
    let validCount = 0;
    
    // Count valid files
    Object.values(this.results.files).forEach(value => {
      if (value === true) validCount++;
    });
    
    // Count valid scripts
    Object.values(this.results.scripts).forEach(value => {
      if (value === true) validCount++;
    });
    
    // Count valid dependencies
    Object.values(this.results.dependencies).forEach(value => {
      if (value === true) validCount++;
    });
    
    // Count valid build configs
    Object.values(this.results.builds).forEach(value => {
      if (value === true) validCount++;
    });
    
    return validCount;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      channels: Object.keys(this.channels),
      validation: this.results,
      system: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch
      }
    };
    
    return report;
  }
}

// CLI interface
const args = process.argv.slice(2);
const validator = new ChannelValidator();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔍 9th.js Release Channel Validator

Usage:
  node validate-channels.js [options]

Options:
  --test-builds    Test basic build commands
  --report         Generate detailed validation report
  --json           Output results in JSON format
  --help, -h       Show this help message

Examples:
  node validate-channels.js
  node validate-channels.js --test-builds --report
  node validate-channels.js --json
  `);
  process.exit(0);
}

async function main() {
  const isValid = validator.validate();
  
  if (args.includes('--test-builds')) {
    await validator.testBuildCommands();
  }
  
  if (args.includes('--report')) {
    const report = validator.generateReport();
    const reportFile = `channel-validation-report-${Date.now()}.json`;
    
    try {
      const fs = await import('fs');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved: ${reportFile}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save report: ${error.message}`);
    }
  }
  
  if (args.includes('--json')) {
    console.log('\n📄 JSON Output:');
    console.log(JSON.stringify(validator.results, null, 2));
  }
  
  if (args.includes('--report')) {
    console.log('\n📄 Validation Report Generated');
  }
  
  process.exit(isValid ? 0 : 1);
}

main().catch((error) => {
  console.error('💥 Validation failed:', error.message);
  process.exit(1);
});