const fs   = require('fs');
const path = require('path');

const whitelist = require('../config/icons.json');

const SRC_OUTLINE = 'node_modules/@tabler/icons/icons/outline';
const SRC_FILLED  = 'node_modules/@tabler/icons/icons/filled';
const DEST = '../icons';

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

function filterAndCopy(srcDir, suffix) {
  const all = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));
  const list = whitelist.length
    ? all.filter(f => whitelist.includes(f.replace('.svg', '')))
    : all;

  list.forEach(f => {
    const destName = suffix ? f.replace('.svg', `${suffix}.svg`) : f;
    fs.copyFileSync(path.join(srcDir, f), path.join(DEST, destName));
  });

  return list.length;
}

const outlineCount = filterAndCopy(SRC_OUTLINE, '');
const filledCount  = filterAndCopy(SRC_FILLED, '-filled');

console.log(`Copied ${outlineCount} outline + ${filledCount} filled = ${outlineCount + filledCount} icons.`);
