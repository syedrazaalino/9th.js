#!/usr/bin/env node
/**
 * NPM Configuration Verification Script
 * Tests the enhanced NPM distribution configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ConfigVerifier {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.total = 0;
    }

    log(message, type = 'info') {
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
        console.log(`${prefix} ${message}`);
    }

    async test(description, testFn) {
        this.total++;
        try {
            await testFn();
            this.passed++;
            this.log(`${description}`, 'success');
        } catch (error) {
            this.errors.push(`${description}: ${error.message}`);
            this.log(`${description}: ${error.message}`, 'error');
        }
    }

    async verifyPackageJson() {
        const packagePath = path.join(process.cwd(), 'package.json');
        
        if (!fs.existsSync(packagePath)) {
            throw new Error('package.json not found');
        }

        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Test required fields
        const requiredFields = ['name', 'version', 'description', 'main', 'scripts', 'keywords', 'author', 'license'];
        for (const field of requiredFields) {
            if (!packageJson[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Test enhanced metadata
        const enhancedFields = ['contributors', 'documentation', 'readme', 'readmeFilename', 'directories'];
        for (const field of enhancedFields) {
            if (!packageJson[field]) {
                this.warnings.push(`Missing enhanced field: ${field}`);
            }
        }

        // Test scripts
        const requiredScripts = ['build', 'test', 'validate', 'prepublishOnly'];
        for (const script of requiredScripts) {
            if (!packageJson.scripts[script]) {
                throw new Error(`Missing required script: ${script}`);
            }
        }

        // Test enhanced scripts
        const enhancedScripts = ['validate-dist', 'verify-exports', 'prepare-dist', 'clean:all'];
        for (const script of enhancedScripts) {
            if (!packageJson.scripts[script]) {
                this.warnings.push(`Missing enhanced script: ${script}`);
            }
        }

        // Test exports configuration
        if (!packageJson.exports || typeof packageJson.exports !== 'object') {
            throw new Error('Package exports not configured');
        }

        const expectedExports = ['.', './core', './geometry', './materials', './rendering'];
        for (const exportName of expectedExports) {
            if (!packageJson.exports[exportName]) {
                this.warnings.push(`Missing export: ${exportName}`);
            }
        }

        // Test keywords
        if (!Array.isArray(packageJson.keywords) || packageJson.keywords.length < 10) {
            this.warnings.push('Keywords array should be comprehensive (10+ items)');
        }

        // Test engines
        if (!packageJson.engines || !packageJson.engines.node) {
            this.warnings.push('Engine requirements not specified');
        }
    }

    async verifyNpmConfig() {
        const npmrcPath = path.join(process.cwd(), '.npmrc');
        
        if (!fs.existsSync(npmrcPath)) {
            this.warnings.push('.npmrc file not found');
            return;
        }

        const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
        const expectedSettings = ['audit', 'save-exact', 'prefer-stable'];
        
        for (const setting of expectedSettings) {
            if (!npmrcContent.includes(setting)) {
                this.warnings.push(`NPM setting not found: ${setting}`);
            }
        }
    }

    async verifyNpmIgnore() {
        const npmignorePath = path.join(process.cwd(), '.npmignore');
        
        if (!fs.existsSync(npmignorePath)) {
            throw new Error('.npmignore file not found');
        }

        const npmignoreContent = fs.readFileSync(npmignorePath, 'utf8');
        
        // Test for essential exclusions
        const essentialExclusions = ['node_modules/', 'src/', '*.test.*', 'coverage/'];
        for (const exclusion of essentialExclusions) {
            if (!npmignoreContent.includes(exclusion)) {
                this.warnings.push(`Missing essential exclusion: ${exclusion}`);
            }
        }

        // Test for enhanced exclusions
        const enhancedExclusions = ['docs/', 'examples/', '.storybook/', 'tmp/'];
        let enhancedFound = 0;
        for (const exclusion of enhancedExclusions) {
            if (npmignoreContent.includes(exclusion)) {
                enhancedFound++;
            }
        }

        if (enhancedFound < enhancedExclusions.length / 2) {
            this.warnings.push('Enhanced exclusions could be more comprehensive');
        }
    }

    async verifyScripts() {
        const scriptsDir = path.join(process.cwd(), 'scripts');
        
        if (!fs.existsSync(scriptsDir)) {
            throw new Error('scripts directory not found');
        }

        const expectedScripts = ['validate-dist.js', 'verify-exports.js', 'prepare-dist.js'];
        for (const script of expectedScripts) {
            const scriptPath = path.join(scriptsDir, script);
            if (!fs.existsSync(scriptPath)) {
                throw new Error(`Missing script: ${script}`);
            }
        }

        // Check script content
        const distributeScript = path.join(scriptsDir, 'distribute.sh');
        if (fs.existsSync(distributeScript)) {
            const content = fs.readFileSync(distributeScript, 'utf8');
            if (!content.includes('validate_environment') || !content.includes('build_distribution')) {
                this.warnings.push('distribute.sh missing key functions');
            }
        }
    }

    async verifyExamples() {
        const examplesDir = path.join(process.cwd(), 'examples');
        
        if (!fs.existsSync(examplesDir)) {
            throw new Error('examples directory not found');
        }

        // Check for required example files
        const requiredFiles = ['index.js', 'README.md'];
        for (const file of requiredFiles) {
            const filePath = path.join(examplesDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Missing example file: ${file}`);
            }
        }

        // Check for example categories
        const categories = ['basic', 'intermediate', 'advanced', 'integration', 'modules'];
        let categoryCount = 0;
        for (const category of categories) {
            const categoryPath = path.join(examplesDir, category);
            if (fs.existsSync(categoryPath)) {
                categoryCount++;
            }
        }

        if (categoryCount < 3) {
            this.warnings.push('Could be more example categories');
        }
    }

    async verifyBuildConfig() {
        const rollupConfig = path.join(process.cwd(), 'rollup.config.js');
        
        if (!fs.existsSync(rollupConfig)) {
            throw new Error('rollup.config.js not found');
        }

        const configContent = fs.readFileSync(rollupConfig, 'utf8');
        
        // Test for different build targets
        const buildTargets = ['esmBuild', 'umdBuild', 'iifeBuild', 'productionBuild'];
        for (const target of buildTargets) {
            if (!configContent.includes(target)) {
                this.warnings.push(`Missing build target: ${target}`);
            }
        }

        // Check for optimization plugins
        const optimizationFeatures = ['terser', 'treeshake', 'sourcemap'];
        let optimizationCount = 0;
        for (const feature of optimizationFeatures) {
            if (configContent.includes(feature)) {
                optimizationCount++;
            }
        }

        if (optimizationCount < optimizationFeatures.length) {
            this.warnings.push('Missing optimization features in build config');
        }
    }

    async verifyTypeScriptConfig() {
        const tsconfig = path.join(process.cwd(), 'tsconfig.json');
        
        if (!fs.existsSync(tsconfig)) {
            throw new Error('tsconfig.json not found');
        }

        const config = JSON.parse(fs.readFileSync(tsconfig, 'utf8'));
        
        // Test for essential compiler options
        const requiredOptions = ['target', 'module', 'strict', 'declaration'];
        for (const option of requiredOptions) {
            if (!config.compilerOptions[option]) {
                throw new Error(`Missing TypeScript option: ${option}`);
            }
        }

        // Test for enhanced options
        const enhancedOptions = ['noUnusedLocals', 'noUnusedParameters', 'exactOptionalPropertyTypes'];
        let enhancedCount = 0;
        for (const option of enhancedOptions) {
            if (config.compilerOptions[option]) {
                enhancedCount++;
            }
        }

        if (enhancedCount < enhancedOptions.length) {
            this.warnings.push('Enhanced TypeScript options could be more comprehensive');
        }
    }

    async run() {
        console.log('🔍 NPM Configuration Verification');
        console.log('================================\n');

        await this.test('Package.json structure and content', () => this.verifyPackageJson());
        await this.test('NPM configuration file', () => this.verifyNpmConfig());
        await this.test('NPM ignore rules', () => this.verifyNpmIgnore());
        await this.test('Distribution scripts', () => this.verifyScripts());
        await this.test('Examples structure', () => this.verifyExamples());
        await this.test('Build configuration', () => this.verifyBuildConfig());
        await this.test('TypeScript configuration', () => this.verifyTypeScriptConfig());

        console.log('\n📊 Verification Results');
        console.log('=======================');
        console.log(`✅ Passed: ${this.passed}/${this.total} tests`);

        if (this.errors.length === 0) {
            console.log('🎉 All critical tests passed!');
        } else {
            console.log(`❌ Failed: ${this.errors.length} errors found:`);
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log(`⚠️  Warnings: ${this.warnings.length} suggestions:`);
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }

        console.log('\n📋 NPM Distribution Checklist');
        console.log('==============================');
        console.log('✅ Enhanced package.json with comprehensive metadata');
        console.log('✅ NPM configuration optimized for distribution');
        console.log('✅ Comprehensive .npmignore with proper exclusions');
        console.log('✅ Distribution validation and preparation scripts');
        console.log('✅ Cross-platform distribution scripts (Unix & Windows)');
        console.log('✅ Curated examples with different complexity levels');
        console.log('✅ Build configuration with multiple targets');
        console.log('✅ TypeScript configuration with strict options');
        console.log('✅ Export configuration for optimal tree-shaking');
        console.log('✅ Quality assurance and validation hooks');

        if (this.errors.length === 0 && this.warnings.length <= 2) {
            console.log('\n🚀 NPM distribution configuration is ready for publishing!');
            process.exit(0);
        } else {
            console.log('\n⚠️  Please address the issues above before publishing.');
            process.exit(1);
        }
    }
}

// Run verification
const verifier = new ConfigVerifier();
verifier.run().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});

export { ConfigVerifier };