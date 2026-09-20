const fs   = require('fs');
const path = require('path');

const { families, bundles } = require('../config/fonts');

const rootDir  = path.join(__dirname, '../..');
const fontsDir = path.join(rootDir, 'lib/fonts');
const cssDir   = path.join(__dirname, '../assets/css');
const webfont  = 'node_modules/@tabler/icons-webfont/dist';

fs.mkdirSync(fontsDir, { recursive: true });
fs.mkdirSync(cssDir, { recursive: true });

const files = {};
families.forEach((font) => {
  files[`${webfont}/${font.css}`] = `${cssDir}/${font.css}`;
});

// Fonts built from several upstream files are produced by merge-fonts.js; the
// rest are copied through untouched.
bundles
  .filter((bundle) => bundle.sources.length === 1)
  .forEach((bundle) => {
    files[`${webfont}/fonts/${bundle.sources[0].source}`] = `${fontsDir}/${bundle.ttf}`;
  });

Object.entries(files).forEach(([src, dest]) => {
  if (!fs.existsSync(src)) {
    console.error(`  MISSING upstream asset: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`  ${path.basename(dest)} (${size} KB)`);
});

// Report any font upstream ships that this package does not handle yet, so a
// new stroke width does not sit unnoticed in node_modules for months.
const known = new Set(families.map((f) => f.source));
const shipped = fs.readdirSync(`${webfont}/fonts`).filter((f) => f.endsWith('.ttf'));
const unhandled = shipped.filter((f) => !known.has(f));
if (unhandled.length) {
  console.log(`::warning::@tabler/icons-webfont ships font(s) this package does not generate: ${unhandled.join(', ')}. Add them to tool/config/fonts.js.`);
}

const version = require('../node_modules/@tabler/icons-webfont/package.json').version;
console.log(`Assets copied from @tabler/icons-webfont v${version} (${families.length} families).`);
