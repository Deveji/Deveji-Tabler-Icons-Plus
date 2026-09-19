// Builds the multi-source fonts in tool/config/fonts.js by merging the upstream
// files, so several stroke widths ship as one font family. Requires Python with
// fontTools; see tool/scripts/merge_fonts.py for why merging is worth it.

const fs    = require('fs');
const path  = require('path');
const { spawnSync } = require('child_process');

const { bundles, defaultOutline, codepointDelta } = require('../config/fonts');
const { parseCss } = require('../config/css');

const rootDir  = path.join(__dirname, '../..');
const cssDir   = path.join(__dirname, '../assets/css');
const fontsDir = path.join(rootDir, 'lib/fonts');
const upstream = path.join(__dirname, '../node_modules/@tabler/icons-webfont/dist/fonts');
const python   = process.env.PYTHON || 'python3';

// Each merged stroke starts at the base of its plane, so the offset follows the
// lowest codepoint upstream actually uses.
const codepoints = parseCss(path.join(cssDir, defaultOutline.css)).map((e) => parseInt(e[1], 16));
const minCodepoint = Math.min.apply(null, codepoints);

const merged = bundles.filter((b) => b.sources.length > 1);
if (!merged.length) {
  console.log('No merged fonts configured; nothing to do.');
  process.exit(0);
}

fs.mkdirSync(fontsDir, { recursive: true });

merged.forEach((bundle) => {
  const base = bundle.sources.find((f) => f.mergeBase);
  if (!base) {
    console.error(`  ${bundle.ttf}: no source marked "mergeBase" to merge the others into.`);
    process.exit(1);
  }

  const args = [
    path.join(__dirname, 'merge_fonts.py'),
    '--base', path.join(upstream, base.source),
    '--out', path.join(fontsDir, bundle.ttf),
  ];
  bundle.sources
    .filter((f) => f !== base)
    .forEach((f) => {
      args.push('--add', `${path.join(upstream, f.source)}:${codepointDelta(f, minCodepoint)}`);
    });

  const result = spawnSync(python, args, { stdio: 'inherit' });
  if (result.error && result.error.code === 'ENOENT') {
    console.error(`  Could not run "${python}". Install Python 3, or set PYTHON=/path/to/python3.`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`  Merging ${bundle.ttf} failed. If fontTools is missing: ${python} -m pip install fonttools`);
    process.exit(result.status || 1);
  }

  const size = (fs.statSync(path.join(fontsDir, bundle.ttf)).size / 1024).toFixed(1);
  const merged = bundle.sources.map((f) => f.id).join(' + ');
  console.log(`  ${bundle.ttf} (${size} KB): ${merged} in one family "${bundle.family}"`);
});
