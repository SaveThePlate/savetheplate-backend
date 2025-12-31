#!/usr/bin/env node

/**
 * Script to fix absolute imports (src/) to relative imports in compiled JavaScript files
 * This is needed because Node.js doesn't understand TypeScript path aliases at runtime
 */

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Get the directory of the current file relative to dist/
  const distPath = path.resolve(__dirname, 'dist');
  const fileDir = path.dirname(filePath);
  const relativePath = path.relative(fileDir, distPath);

  // Replace 'src/' imports with relative paths
  // Pattern: require('src/...') or from 'src/...'
  const patterns = [
    // require('src/...')
    {
      regex: /require\(['"]src\/([^'"]+)['"]\)/g,
      replace: (match, importPath) => {
        const targetPath = path.join(distPath, importPath);
        const relative = path.relative(fileDir, targetPath).replace(/\\/g, '/');
        // Ensure relative path starts with ./
        const relativePath = relative.startsWith('.') ? relative : './' + relative;
        modified = true;
        return `require('${relativePath}')`;
      }
    },
    // from 'src/...'
    {
      regex: /from ['"]src\/([^'"]+)['"]/g,
      replace: (match, importPath) => {
        const targetPath = path.join(distPath, importPath);
        const relative = path.relative(fileDir, targetPath).replace(/\\/g, '/');
        // Ensure relative path starts with ./
        const relativePath = relative.startsWith('.') ? relative : './' + relative;
        modified = true;
        return `from '${relativePath}'`;
      }
    }
  ];

  for (const pattern of patterns) {
    content = content.replace(pattern.regex, pattern.replace);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports in: ${path.relative(distPath, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js') && !file.endsWith('.d.ts')) {
      fixImportsInFile(filePath);
    }
  }
}

const distDir = path.join(__dirname, 'dist');

// Wait a bit for nest build to finish creating dist/
let retries = 10;
while (!fs.existsSync(distDir) && retries > 0) {
  require('child_process').execSync('sleep 0.1', { stdio: 'ignore' });
  retries--;
}

if (fs.existsSync(distDir)) {
  console.log('Fixing imports in compiled files...');
  walkDir(distDir);
  console.log('Done!');
} else {
  console.error('dist/ directory not found. Please build the project first.');
  process.exit(1);
}

