const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * how to use!
 * node prerelease.js next will add "-prelease.1" to the version for the first prerelease version
 * node prerelease.js next will increment the prerelease number by 1 (e.g. "-prelease.2") thereafter
 * node prerelease.js complete will remove the "-prelease" suffix and number from the version
 */

const TS_packages = [
  '.',
  'types',
  'frontend',
  'backend',
  'backend/packages/Scheduler',
  'backend/packages/Upgrade',
  'clientlibs/js',
];

function updatePackageJsonVersion(pkgPath, updateVersionFn) {
  const packageJsonPath = path.join(__dirname, pkgPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    console.log(`Reading ${packageJsonPath}`);
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const newVersion = updateVersionFn(packageJson.version);
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated ${pkgPath}/package.json to version ${newVersion}`);
  } else {
    console.log(`File not found: ${packageJsonPath}`);
  }
}

function updatePomXmlVersion(pkgPath, updateVersionFn) {
  const pomXmlPath = path.join(__dirname, pkgPath, 'pom.xml');
  let updatedVersion = '';
  if (fs.existsSync(pomXmlPath)) {
    console.log(`Reading ${pomXmlPath}`);
    let pomXml = fs.readFileSync(pomXmlPath, 'utf8');
    let versionFound = false;
    pomXml = pomXml.replace(/<version>(.*?)<\/version>/, (match, version) => {
      if (!versionFound) {
        updatedVersion = updateVersionFn(version);
        versionFound = true;
        return `<version>${updatedVersion}</version>`;
      }
      return match;
    });
    fs.writeFileSync(pomXmlPath, pomXml);
    // Execute mvn versions:set -DnewVersion= version
    execSync(`mvn versions:set -DnewVersion=${updatedVersion}`, {
      cwd: path.join(__dirname, pkgPath),
      stdio: 'inherit',
    });
    console.log(`Updated ${pkgPath}/pom.xml to new version`);
  } else {
    console.log(`File not found: ${pomXmlPath}`);
  }
}

function runNpmInstall(pkgPath) {
  const packageJsonPath = path.join(__dirname, pkgPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    console.log(`Running npm install in ${pkgPath}`);
    execSync('npm install', { cwd: path.join(__dirname, pkgPath), stdio: 'inherit' });
  } else {
    console.log(`File not found: ${packageJsonPath}`);
  }
}

function updateVersions(action) {
  console.log(`Starting ${action} version update...`);
  TS_packages.forEach((pkgPath) => {
    updatePackageJsonVersion(pkgPath, (version) => {
      if (action === 'next') {
        if (version.includes('prerelease')) {
          const parts = version.split('-prerelease.');
          const prereleaseNumber = parseInt(parts[1], 10) + 1;
          return `${parts[0]}-prerelease.${prereleaseNumber}`;
        } else {
          return `${version}-prerelease.1`;
        }
      } else if (action === 'complete') {
        return version.split('-prerelease')[0];
      }
    });
  });

  updatePomXmlVersion('clientlibs/java', (version) => {
    if (action === 'next') {
      if (version.includes('prerelease')) {
        const parts = version.split('-prerelease.');
        const prereleaseNumber = parseInt(parts[1], 10) + 1;
        return `${parts[0]}-prerelease.${prereleaseNumber}`;
      } else {
        return `${version}-prerelease.1`;
      }
    } else if (action === 'complete') {
      return version.split('-prerelease')[0];
    }
  });

  // Run npm install once per package after all updates
  TS_packages.forEach(runNpmInstall);

  console.log(`Finished ${action} version update.`);
}

// Get the action from the command line arguments
const action = process.argv[2];
if (!action || (action !== 'next' && action !== 'complete')) {
  console.error('Invalid action. Use "next" to add prerelease or "complete" to remove it.');
  process.exit(1);
}

updateVersions(action);
