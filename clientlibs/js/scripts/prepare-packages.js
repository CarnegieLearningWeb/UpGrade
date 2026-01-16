#!/usr/bin/env node

/**
 * Prepares specialized packages for publishing by copying the appropriate
 * dist files into each package directory.
 */

const fs = require('fs');
const path = require('path');

// Helper to recursively copy directory
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Helper to remove directory recursively
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

console.log('\n📦 Preparing packages for publishing...\n');

const packages = [
  { name: 'full-browser', bundle: 'browser' },
  { name: 'full-node', bundle: 'node' },
  { name: 'lite', bundle: 'lite' }
];

let allSuccess = true;

packages.forEach(({ name, bundle }) => {
  try {
    const packageDir = path.join(__dirname, '..', 'packages', name);
    const distSrc = path.join(__dirname, '..', 'dist', bundle);
    const distDest = path.join(packageDir, 'dist', bundle);

    // Check if source dist exists
    if (!fs.existsSync(distSrc)) {
      console.error(`❌ ${name}: Source bundle not found at ${distSrc}`);
      console.error(`   Run 'npm run build' first to generate bundles.`);
      allSuccess = false;
      return;
    }

    // Remove old dist if exists (cleanup from previous prepare)
    const packageDistRoot = path.join(packageDir, 'dist');
    removeDir(packageDistRoot);

    // Copy the bundle
    copyDir(distSrc, distDest);

    const fileCount = fs.readdirSync(distDest).length;
    console.log(`✓ ${name}: Copied ${fileCount} files from ${bundle} bundle`);
  } catch (error) {
    console.error(`❌ Error preparing ${name}:`, error.message);
    allSuccess = false;
  }
});

console.log('');

if (allSuccess) {
  console.log('✅ All packages prepared successfully!\n');
  process.exit(0);
} else {
  console.error('❌ Some packages failed to prepare. Please check the errors above.\n');
  process.exit(1);
}
