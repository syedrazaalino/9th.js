import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Version management configuration
const VERSION_CONFIG = {
  channels: {
    core: {
      package: 'core-package.json',
      tag: 'latest-core',
      prerelease: false,
      increment: 'minor' // Core gets conservative updates
    },
    full: {
      package: 'full-package.json',
      tag: 'latest-full',
      prerelease: false,
      increment: 'minor'
    },
    module: {
      package: 'module-package.json',
      tag: 'latest-module',
      prerelease: false,
      increment: 'patch' // Module gets frequent small updates
    },
    experimental: {
      package: 'experimental-package.json',
      tag: 'experimental',
      prerelease: true,
      increment: 'patch',
      preid: 'experimental'
    }
  },
  semantic: {
    core: 'Conservative versioning for stable core features',
    full: 'Standard semantic versioning for complete library',
    module: 'Frequent patches for ESM optimizations',
    experimental: 'Rapid iteration with experimental pre-releases'
  }
};

class VersionManager {
  constructor() {
    this.currentVersion = this.getCurrentVersion();
    this.channel = process.argv[2]; // core, full, module, experimental
    this.bumpType = process.argv[3]; // major, minor, patch
    this.preid = process.argv[4]; // alpha, beta, rc, experimental
  }

  getCurrentVersion() {
    try {
      const mainPackage = JSON.parse(readFileSync('package.json', 'utf8'));
      return mainPackage.version;
    } catch (error) {
      console.error('❌ Could not read current version from package.json');
      return '0.1.0';
    }
  }

  parseVersion(version) {
    const parts = version.split('-');
    const [major, minor, patch] = parts[0].split('.').map(Number);
    const prerelease = parts[1] || null;
    
    return { major, minor, patch, prerelease };
  }

  incrementVersion(currentVersion, bumpType, preid = null) {
    const { major, minor, patch } = this.parseVersion(currentVersion);
    
    let newVersion;
    switch (bumpType) {
      case 'major':
        newVersion = { major: major + 1, minor: 0, patch: 0 };
        break;
      case 'minor':
        newVersion = { major, minor: minor + 1, patch: 0 };
        break;
      case 'patch':
        newVersion = { major, minor, patch: patch + 1 };
        break;
      default:
        throw new Error(`Invalid bump type: ${bumpType}`);
    }

    let versionString = `${newVersion.major}.${newVersion.minor}.${newVersion.patch}`;
    
    if (preid) {
      const prereleaseNumber = this.getPrereleaseNumber(currentVersion, preid);
      versionString += `-${preid}.${prereleaseNumber}`;
    }
    
    return versionString;
  }

  getPrereleaseNumber(currentVersion, preid) {
    const current = this.parseVersion(currentVersion);
    if (current.prerelease && current.prerelease.startsWith(preid)) {
      const [, number] = current.prerelease.split('.');
      return parseInt(number) + 1;
    }
    return 1;
  }

  updatePackageVersion(packagePath, newVersion) {
    try {
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      const oldVersion = packageData.version;
      packageData.version = newVersion;
      
      writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      
      console.log(`📦 ${packagePath}:`);
      console.log(`   ${oldVersion} → ${newVersion}`);
      
      return { oldVersion, newVersion };
    } catch (error) {
      console.error(`❌ Failed to update ${packagePath}:`, error.message);
      throw error;
    }
  }

  createVersionTag(version, channel) {
    const tag = `${channel}-${version}`;
    console.log(`🏷️  Creating git tag: ${tag}`);
    
    try {
      execSync(`git tag -a ${tag} -m "Release ${VERSION_CONFIG.channels[channel].package} v${version}"`);
      console.log(`✅ Git tag created: ${tag}`);
    } catch (error) {
      console.warn(`⚠️  Could not create git tag: ${error.message}`);
    }
    
    return tag;
  }

  publishPackage(packagePath, tag) {
    console.log(`🚀 Publishing ${packagePath} with tag: ${tag}`);
    
    try {
      // Copy package to temp location and publish
      const tempPackage = 'temp-package.json';
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      writeFileSync(tempPackage, JSON.stringify(packageData, null, 2));
      
      // Set npm version temporarily
      execSync(`npm version ${packageData.version} --no-git-tag-version`, { stdio: 'inherit' });
      
      // Publish with specific tag
      execSync(`npm publish --tag ${tag}`, { stdio: 'inherit' });
      
      // Clean up temp file
      execSync('rm temp-package.json');
      
      console.log(`✅ Published successfully with tag: ${tag}`);
      
    } catch (error) {
      console.error(`❌ Failed to publish: ${error.message}`);
      throw error;
    }
  }

  generateChangelog(channel, oldVersion, newVersion) {
    const changes = [
      `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}`,
      '',
      `### Channel: ${channel}`,
      `### Package: ${VERSION_CONFIG.channels[channel].package}`,
      `### Tag: ${VERSION_CONFIG.channels[channel].tag}`,
      '',
      '### Changed',
      `- Updated ${channel} package version from ${oldVersion} to ${newVersion}`,
      '',
      '### Technical Details',
      `- Build target: ${VERSION_CONFIG.channels[channel].incremental}`,
      `- SemVer compliance: ${VERSION_CONFIG.channels[channel].prerelease ? 'Pre-release' : 'Stable'}`,
      ''
    ];

    return changes.join('\n');
  }

  updateChangelog(channel, oldVersion, newVersion) {
    try {
      const changelogPath = 'CHANGELOG.md';
      let changelog = '';
      
      try {
        changelog = readFileSync(changelogPath, 'utf8');
      } catch (error) {
        changelog = '# Changelog\n\n';
      }
      
      const newEntry = this.generateChangelog(channel, oldVersion, newVersion);
      const updatedChangelog = newEntry + '\n' + changelog;
      
      writeFileSync(changelogPath, updatedChangelog);
      console.log(`📝 Changelog updated: ${changelogPath}`);
      
    } catch (error) {
      console.warn(`⚠️  Could not update changelog: ${error.message}`);
    }
  }

  async versionChannel(channel, bumpType = 'patch', preid = null) {
    if (!channel || !VERSION_CONFIG.channels[channel]) {
      console.error('❌ Invalid channel. Available channels:', Object.keys(VERSION_CONFIG.channels));
      process.exit(1);
    }

    console.log(`🔧 Versioning ${channel} channel...`);
    console.log(`📊 Current version: ${this.currentVersion}`);
    
    try {
      const packagePath = VERSION_CONFIG.channels[channel].package;
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      const oldVersion = packageData.version;
      
      let newVersion;
      if (preid) {
        newVersion = this.incrementVersion(oldVersion, bumpType, preid);
      } else {
        newVersion = this.incrementVersion(oldVersion, bumpType);
      }
      
      // Update package version
      const { oldVersion: updatedOldVersion } = this.updatePackageVersion(packagePath, newVersion);
      
      // Create git tag
      const tag = this.createVersionTag(newVersion, channel);
      
      // Update changelog
      this.updateChangelog(channel, oldVersion, newVersion);
      
      // Publish if requested
      if (process.argv.includes('--publish')) {
        this.publishPackage(packagePath, VERSION_CONFIG.channels[channel].tag);
      }
      
      console.log(`\n🎉 ${channel} channel versioned successfully!`);
      console.log(`📦 Package: ${VERSION_CONFIG.channels[channel].package}`);
      console.log(`📋 Tag: ${VERSION_CONFIG.channels[channel].tag}`);
      console.log(`🏷️  Version: ${oldVersion} → ${newVersion}`);
      
      return {
        channel,
        oldVersion,
        newVersion,
        tag,
        package: packagePath
      };
      
    } catch (error) {
      console.error(`❌ Versioning failed:`, error.message);
      process.exit(1);
    }
  }

  showChannelInfo() {
    console.log('📊 Channel Configuration:');
    console.log(JSON.stringify(VERSION_CONFIG, null, 2));
  }

  showCurrentVersions() {
    console.log('📋 Current Channel Versions:');
    
    Object.entries(VERSION_CONFIG.channels).forEach(([channel, config]) => {
      try {
        const packageData = JSON.parse(readFileSync(config.package, 'utf8'));
        console.log(`  ${channel.padEnd(12)}: ${packageData.version} (${config.tag})`);
      } catch (error) {
        console.log(`  ${channel.padEnd(12)}: Not found`);
      }
    });
  }
}

// CLI interface
const manager = new VersionManager();

if (process.argv.includes('--info')) {
  manager.showChannelInfo();
} else if (process.argv.includes('--versions')) {
  manager.showCurrentVersions();
} else if (manager.channel && manager.bumpType) {
  manager.versionChannel(manager.channel, manager.bumpType, manager.preid);
} else {
  console.log(`
🚀 9th.js Version Manager

Usage:
  npm run version:channel <channel> <bump-type> [--publish]
  npm run version:channels [--publish]

Channels:
  core         - Minimal core library (conservative updates)
  full         - Complete library (standard updates)
  module       - ESM-only distribution (frequent patches)
  experimental - Bleeding-edge features (pre-releases)

Bump Types:
  major        - Breaking changes
  minor        - New features (backward compatible)
  patch        - Bug fixes

Pre-release IDs:
  alpha, beta, rc, experimental

Examples:
  npm run version:channel core patch
  npm run version:channel experimental patch alpha --publish
  npm run version:channels --publish
  npm run version:channel full minor

Options:
  --publish    - Automatically publish after versioning
  --info       - Show channel configuration
  --versions   - Show current versions
  `);
}