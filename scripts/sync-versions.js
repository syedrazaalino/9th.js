import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VersionSync {
  constructor() {
    this.channels = {
      core: 'core-package.json',
      full: 'full-package.json',
      module: 'module-package.json',
      experimental: 'experimental-package.json'
    };
    
    this.mainPackagePath = 'package.json';
    this.mainVersion = this.getMainVersion();
  }

  getMainVersion() {
    try {
      const mainPackage = JSON.parse(readFileSync(this.mainPackagePath, 'utf8'));
      return mainPackage.version;
    } catch (error) {
      console.error('❌ Could not read main package.json version:', error.message);
      return '0.1.0';
    }
  }

  getChannelVersion(channel) {
    try {
      const packagePath = this.channels[channel];
      if (!existsSync(packagePath)) {
        console.warn(`⚠️  ${packagePath} not found for channel: ${channel}`);
        return null;
      }
      
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      return packageData.version;
    } catch (error) {
      console.error(`❌ Could not read ${channel} package version:`, error.message);
      return null;
    }
  }

  updateChannelVersion(channel, version) {
    try {
      const packagePath = this.channels[channel];
      if (!existsSync(packagePath)) {
        console.warn(`⚠️  ${packagePath} not found for channel: ${channel}`);
        return false;
      }
      
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      const oldVersion = packageData.version;
      packageData.version = version;
      
      writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      
      console.log(`📦 ${channel}: ${oldVersion} → ${version}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update ${channel} version:`, error.message);
      return false;
    }
  }

  syncVersions(options = {}) {
    const { 
      strategy = 'conservative', // conservative, aggressive, experimental
      updateExperimental = false,
      dryRun = false 
    } = options;

    console.log('🔄 Syncing channel versions...');
    console.log(`📋 Main package version: ${this.mainVersion}`);
    console.log(`🎯 Strategy: ${strategy}`);
    console.log(`🔍 Dry run: ${dryRun ? 'Yes' : 'No'}`);
    console.log('');

    const syncStrategies = {
      conservative: {
        core: 'patch',      // Core: Conservative updates
        full: 'minor',      // Full: Standard updates
        module: 'patch',    // Module: Frequent small updates
        experimental: updateExperimental ? 'minor' : 'keep' // Experimental: Optional updates
      },
      aggressive: {
        core: 'minor',      // Core: More frequent updates
        full: 'minor',      // Full: Regular updates
        module: 'patch',    // Module: Frequent updates
        experimental: updateExperimental ? 'patch' : 'keep' // Experimental: Regular updates
      },
      experimental: {
        core: 'patch',      // Core: Conservative
        full: 'patch',      // Full: Stable
        module: 'patch',    // Module: Quick fixes
        experimental: 'minor' // Experimental: Aggressive updates
      }
    };

    const strategyMap = syncStrategies[strategy] || syncStrategies.conservative;
    const results = [];

    Object.entries(this.channels).forEach(([channel, packagePath]) => {
      const currentVersion = this.getChannelVersion(channel);
      if (!currentVersion) {
        results.push({ channel, status: 'failed', error: 'Package not found' });
        return;
      }

      const bumpType = strategyMap[channel];
      if (bumpType === 'keep') {
        console.log(`⏭️  ${channel}: Keeping current version (${currentVersion})`);
        results.push({ channel, status: 'skipped', reason: 'keep version' });
        return;
      }

      if (dryRun) {
        const newVersion = this.bumpVersion(currentVersion, bumpType);
        console.log(`🔍 ${channel}: ${currentVersion} → ${newVersion} (${bumpType}) [DRY RUN]`);
        results.push({ channel, status: 'preview', from: currentVersion, to: newVersion });
        return;
      }

      const newVersion = this.bumpVersion(currentVersion, bumpType);
      const success = this.updateChannelVersion(channel, newVersion);
      
      if (success) {
        results.push({ channel, status: 'updated', from: currentVersion, to: newVersion });
      } else {
        results.push({ channel, status: 'failed', error: 'Update failed' });
      }
    });

    this.printResults(results);
    return results;
  }

  bumpVersion(version, bumpType) {
    const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
    
    switch (bumpType) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        return version;
    }
  }

  printResults(results) {
    console.log('\n📊 Sync Results:');
    console.log('═'.repeat(50));
    
    const summary = {
      updated: 0,
      skipped: 0,
      failed: 0,
      preview: 0
    };

    results.forEach(result => {
      summary[result.status] = (summary[result.status] || 0) + 1;
      
      const statusSymbol = {
        updated: '✅',
        skipped: '⏭️ ',
        failed: '❌',
        preview: '🔍'
      }[result.status] || '❓';

      console.log(`${statusSymbol} ${result.channel.padEnd(8)}: ${result.status}`);
      
      if (result.from && result.to) {
        console.log(`   ${result.from} → ${result.to}`);
      }
      
      if (result.reason) {
        console.log(`   Reason: ${result.reason}`);
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('═'.repeat(50));
    console.log(`📈 Summary: ${summary.updated} updated, ${summary.skipped} skipped, ${summary.failed} failed, ${summary.preview} preview`);
  }

  showVersionMatrix() {
    console.log('📋 Channel Version Matrix:');
    console.log('═'.repeat(60));
    console.log(`${'Channel'.padEnd(12)} | ${'Version'.padEnd(15)} | ${'Package'.padEnd(20)} | ${'Status'}`);
    console.log('─'.repeat(60));

    Object.entries(this.channels).forEach(([channel, packagePath]) => {
      const version = this.getChannelVersion(channel);
      const status = existsSync(packagePath) ? '✅ Found' : '❌ Missing';
      console.log(`${channel.padEnd(12)} | ${(version || 'N/A').padEnd(15)} | ${packagePath.padEnd(20)} | ${status}`);
    });

    console.log('─'.repeat(60));
    console.log(`Main: ${this.mainVersion}`);
    console.log('═'.repeat(60));
  }
}

// CLI interface
const args = process.argv.slice(2);
const sync = new VersionSync();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔄 Version Sync Utility

Usage:
  npm run channel:sync:versions [options]

Options:
  --strategy <conservative|aggressive|experimental>
    conservative: Core=patch, Full=minor, Module=patch, Experimental=keep
    aggressive: Core=minor, Full=minor, Module=patch, Experimental=keep
    experimental: Core=patch, Full=patch, Module=patch, Experimental=minor
  
  --update-experimental
    Include experimental channel in versioning updates
  
  --dry-run
    Preview changes without applying them
  
  --matrix
    Show version matrix without syncing
  
  --help, -h
    Show this help message

Examples:
  npm run channel:sync:versions
  npm run channel:sync:versions --strategy aggressive
  npm run channel:sync:versions --strategy experimental --update-experimental
  npm run channel:sync:versions --dry-run
  `);
  process.exit(0);
}

if (args.includes('--matrix')) {
  sync.showVersionMatrix();
  process.exit(0);
}

const strategy = args.find(arg => ['conservative', 'aggressive', 'experimental'].includes(arg)) || 'conservative';
const updateExperimental = args.includes('--update-experimental');
const dryRun = args.includes('--dry-run');

sync.syncVersions({
  strategy,
  updateExperimental,
  dryRun
}).then((results) => {
  const failed = results.filter(r => r.status === 'failed');
  if (failed.length > 0) {
    console.log(`\n⚠️  ${failed.length} channel(s) failed to sync`);
    process.exit(1);
  } else {
    console.log('\n✅ All channels synced successfully');
  }
}).catch((error) => {
  console.error('💥 Version sync failed:', error.message);
  process.exit(1);
});