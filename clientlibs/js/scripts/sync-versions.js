#!/usr/bin/env node

/**
 * Synchronize version numbers across all specialized package.json files
 * to match the main package.json version.
 */

const fs = require('fs');
const path = require('path');

// Read the main package.json version
const mainPackagePath = path.join(__dirname, '..', 'package.json');
const mainPackage = JSON.parse(fs.readFileSync(mainPackagePath, 'utf8'));
const mainVersion = mainPackage.version;

console.log(`\nSynchronizing version to: ${mainVersion}\n`);

// List of specialized packages to update
const packages = ['full-browser', 'full-node', 'lite'];

let allSuccess = true;

packages.forEach(pkgName => {
  try {
    const pkgPath = path.join(__dirname, '..', 'packages', pkgName, 'package.json');

    // Check if file exists
    if (!fs.existsSync(pkgPath)) {
      console.error(`❌ Package not found: ${pkgName} at ${pkgPath}`);
      allSuccess = false;
      return;
    }

    // Read, update, and write back
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const oldVersion = pkg.version;
    pkg.version = mainVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

    console.log(`✓ ${pkgName}: ${oldVersion} → ${mainVersion}`);
  } catch (error) {
    console.error(`❌ Error updating ${pkgName}:`, error.message);
    allSuccess = false;
  }
});

console.log('');

if (allSuccess) {
  console.log('✅ All package versions synchronized successfully!\n');
  process.exit(0);
} else {
  console.error('❌ Some packages failed to sync. Please check the errors above.\n');
  process.exit(1);
}
