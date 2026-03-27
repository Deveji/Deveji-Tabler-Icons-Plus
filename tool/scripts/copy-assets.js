const fs   = require('fs');
const path = require('path');

const rootDir  = path.join(__dirname, '../..');
const fontsDir = path.join(rootDir, 'lib/fonts');
const cssDir   = path.join(__dirname, '../assets/css');
const webfont  = 'node_modules/@tabler/icons-webfont/dist';

fs.mkdirSync(fontsDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });

const files = {
  [`${webfont}/fonts/tabler-icons.ttf`]:        `${fontsDir}/tabler-icons.ttf`,
  [`${webfont}/fonts/tabler-icons-filled.ttf`]:  `${fontsDir}/tabler-icons-filled.ttf`,
  [`${webfont}/tabler-icons.css`]:               `${cssDir}/tabler-icons.css`,
  [`${webfont}/tabler-icons-filled.css`]:         `${cssDir}/tabler-icons-filled.css`,
};

Object.entries(files).forEach(([src, dest]) => {
  fs.copyFileSync(src, dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  ${path.basename(dest)} (${size} KB)`);
});

const version = require('../node_modules/@tabler/icons-webfont/package.json').version;
console.log(`Assets copied from @tabler/icons-webfont v${version}.`);
