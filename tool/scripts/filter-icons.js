const fs   = require('fs');
const path = require('path');

const whitelist = require('../config/icons.json');

const SRC  = 'node_modules/@tabler/icons/icons/outline';
const DEST = '../icons';

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const all  = fs.readdirSync(SRC).filter(f => f.endsWith('.svg'));
const list = whitelist.length
  ? all.filter(f => whitelist.includes(f.replace('.svg', '')))
  : all;

list.forEach(f => fs.copyFileSync(
  path.join(SRC, f), path.join(DEST, f)
));

console.log(`Copied ${list.length} icons.`);
