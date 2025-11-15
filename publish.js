#!/usr/bin/env node

/**
 * NPM Package Publisher
 * 
 * This script provides an interactive interface for publishing packages
 * with proper semantic versioning and tag management.
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const ask = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

async function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    throw new Error('Could not read package.json');
  }
}

async function verifyPackage() {
  log('🔍 Verifying package before publishing...', colors.cyan);
  
  try {
    // Run verification script
    execSync('node verify-build.js', { stdio: 'inherit' });
    log('✅ Package verification passed', colors.green);
  } catch (error) {
    log('❌ Package verification failed', colors.red);
    log('Please fix the issues and try again', colors.yellow);
    process.exit(1);
  }
}

async function publishPackage(versionType, tag = null) {
  log(`🚀 Publishing package as ${versionType}...`, colors.cyan);
  
  try {
    // Build the package
    log('📦 Building package...', colors.yellow);
    execSync('npm run build', { stdio: 'inherit' });
    
    // Run tests
    log('🧪 Running tests...', colors.yellow);
    execSync('npm test', { stdio: 'inherit' });
    
    // Version and publish
    log(`📝 Creating ${versionType} release...`, colors.yellow);
    execSync(`npm version ${versionType}`, { stdio: 'inherit' });
    
    // Get the new version
    const newVersion = await getCurrentVersion();
    
    // Publish to npm
    log(`📤 Publishing version ${newVersion}...`, colors.yellow);
    if (tag) {
      execSync(`npm publish --tag ${tag}`, { stdio: 'inherit' });
    } else {
      execSync('npm publish', { stdio: 'inherit' });
    }
    
    log(`🎉 Successfully published version ${newVersion}!`, colors.green);
    
    if (tag) {
      log(`📦 Published to @${tag} tag`, colors.blue);
    }
    
  } catch (error) {
    log('❌ Publishing failed', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

async function runSemanticRelease() {
  log('🤖 Running semantic-release...', colors.cyan);
  
  try {
    execSync('npx semantic-release', { stdio: 'inherit' });
    log('🎉 Semantic release completed!', colors.green);
  } catch (error) {
    log('❌ Semantic release failed', colors.red);
    process.exit(1);
  }
}

async function main() {
  log('🚀 NPM Package Publisher', colors.cyan);
  log('=' .repeat(30), colors.cyan);
  
  const currentVersion = await getCurrentVersion();
  log(`Current version: ${currentVersion}`, colors.blue);
  
  log('\nPublishing options:', colors.cyan);
  log('1. Patch release (1.0.1)', colors.yellow);
  log('2. Minor release (1.1.0)', colors.yellow);
  log('3. Major release (2.0.0)', colors.yellow);
  log('4. Alpha release', colors.yellow);
  log('5. Beta release', colors.yellow);
  log('6. Release candidate (RC)', colors.yellow);
  log('7. Semantic release (auto-detect)', colors.yellow);
  
  const answer = await ask('\nSelect an option (1-7): ');
  
  switch (answer.trim()) {
    case '1':
      await verifyPackage();
      await publishPackage('patch');
      break;
    case '2':
      await verifyPackage();
      await publishPackage('minor');
      break;
    case '3':
      await verifyPackage();
      await publishPackage('major');
      break;
    case '4':
      await verifyPackage();
      await publishPackage('prerelease --preid=alpha', 'alpha');
      break;
    case '5':
      await verifyPackage();
      await publishPackage('prerelease --preid=beta', 'beta');
      break;
    case '6':
      await verifyPackage();
      await publishPackage('prerelease --preid=rc', 'next');
      break;
    case '7':
      await verifyPackage();
      await runSemanticRelease();
      break;
    default:
      log('Invalid option', colors.red);
      process.exit(1);
  }
  
  rl.close();
}

if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Publisher failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}