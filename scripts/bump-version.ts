import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const appTsxPath = path.join(projectRoot, 'src', 'App.tsx');

function bumpVersion() {
  // 1. Update package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = packageJson.version;
  const versionParts = oldVersion.split('.').map(Number);
  
  // Increment patch version
  versionParts[2] += 1;
  const newVersion = versionParts.join('.');
  packageJson.version = newVersion;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`Bumping version in package.json: ${oldVersion} -> ${newVersion}`);

  // 2. Update App.tsx
  if (fs.existsSync(appTsxPath)) {
    let appTsx = fs.readFileSync(appTsxPath, 'utf-8');
    const today = new Date().toISOString().split('T')[0];
    
    // Replace vX.X.X-debug | YYYY-MM-DD (global replace for all occurrences)
    const versionRegex = /v\d+\.\d+\.\d+-debug \| \d{4}-\d{2}-\d{2}/g;
    const newVersionString = `v${newVersion}-debug | ${today}`;
    
    if (versionRegex.test(appTsx)) {
      appTsx = appTsx.replace(versionRegex, newVersionString);
      fs.writeFileSync(appTsxPath, appTsx);
      console.log(`Updated App.tsx with version ${newVersionString}`);
    } else {
      console.warn('Could not find version string in App.tsx to update.');
    }
  }
}

bumpVersion();
