#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find the main entry bundle and CSS file
const assetsDir = path.join(__dirname, '..', 'dist', 'client', 'assets');
const files = fs.readdirSync(assetsDir);

let mainJs = '';
let mainCss = '';

// Find the main index bundle
const indexJsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
const stylesCssFile = files.find(f => f.startsWith('styles-') && f.endsWith('.css'));

if (!indexJsFile) {
  console.error('Error: Could not find main index bundle in dist/client/assets');
  process.exit(1);
}

mainJs = `/assets/${indexJsFile}`;
if (stylesCssFile) {
  mainCss = `/assets/${stylesCssFile}`;
}

// Generate index.html
const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Love Nest Stream</title>
    ${mainCss ? `<link rel="stylesheet" href="${mainCss}">` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="${mainJs}"><\/script>
  </body>
</html>`;

// Write index.html to dist/client
const indexPath = path.join(__dirname, '..', 'dist', 'client', 'index.html');
fs.writeFileSync(indexPath, htmlContent, 'utf-8');

console.log('✓ Generated dist/client/index.html');
console.log(`  Main JS: ${mainJs}`);
console.log(`  Main CSS: ${mainCss}`);
