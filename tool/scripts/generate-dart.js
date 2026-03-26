const fs   = require('fs');
const path = require('path');
const map  = require('../output/TablerIcons.json');

const toCamel = s => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const tablerVersion = getTablerVersion();
const iconCount = Object.keys(map).length;

// Renames for Dart reserved keywords
const dartRenames = {
  'switch': 'switch1',
};

function safeName(name) {
  const camel = toCamel(name);
  return dartRenames[camel] || camel;
}

const fields = Object.entries(map)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, cp]) =>
    `  static const IconData ${safeName(name)} = ` +
    `IconData(0x${cp.toString(16)}, fontFamily: _kFontFam, fontPackage: _kFontPkg);`
  ).join('\n');

const src = `// GENERATED — do not edit by hand.
// Run: cd tool && npm run build
// Source: @tabler/icons v${tablerVersion}
// Icons: ${iconCount}

/// Tabler Icons for Flutter.
///
/// Use these icons with Flutter's [Icon] widget:
///
/// \`\`\`dart
/// Icon(TablerIcons.home)
/// Icon(TablerIcons.arrowLeft, size: 24, color: Colors.blue)
/// \`\`\`
///
/// Browse the full icon set at [tabler.io/icons](https://tabler.io/icons).
///
/// Generated from [@tabler/icons](https://www.npmjs.com/package/@tabler/icons) v${tablerVersion}.
library;

import 'package:flutter/widgets.dart';

/// Identifiers for the icons available in the Tabler Icons font.
///
/// Contains ${iconCount} icons from [Tabler Icons](https://tabler.io/icons) v${tablerVersion}.
///
/// {@tool snippet}
/// \`\`\`dart
/// Icon(TablerIcons.home)
/// \`\`\`
/// {@end-tool}
class TablerIcons {
  TablerIcons._();
  static const _kFontFam = 'TablerIcons';
  static const _kFontPkg = 'tabler_icons_plus';

${fields}
}
`;

const rootDir = path.join(__dirname, '../..');

// Write Dart file to lib/
fs.writeFileSync(path.join(rootDir, 'lib/tabler_icons_plus.dart'), src);

// Copy TTF to lib/fonts/
const fontsDir = path.join(rootDir, 'lib/fonts');
fs.mkdirSync(fontsDir, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, '../output/TablerIcons.ttf'),
  path.join(fontsDir, 'TablerIcons.ttf')
);

// Update pubspec.yaml version to match @tabler/icons version
if (tablerVersion !== 'unknown') {
  const pubspecPath = path.join(rootDir, 'pubspec.yaml');
  let pubspec = fs.readFileSync(pubspecPath, 'utf8');
  pubspec = pubspec.replace(/^version:\s+.+$/m, `version: ${tablerVersion}`);
  fs.writeFileSync(pubspecPath, pubspec);
  console.log(`pubspec.yaml version updated to ${tablerVersion}.`);
}

// Update README.md badges with current version and icon count
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  const countFormatted = iconCount.toLocaleString('en-US').replace(',', '%2C');
  readme = readme.replace(
    /@tabler\/icons-v[\d.]+/,
    `@tabler/icons-v${tablerVersion}`
  );
  readme = readme.replace(
    /icons-[\d%2C]+-blue/,
    `icons-${countFormatted}-blue`
  );
  const countDisplay = iconCount.toLocaleString('en-US');
  readme = readme.replace(
    /\d[\d,]+ open-source/,
    `${countDisplay} open-source`
  );
  fs.writeFileSync(readmePath, readme);
  console.log('README.md badges updated.');
}

// Update pubspec.yaml description with current icon count
const pubspecPath2 = path.join(rootDir, 'pubspec.yaml');
if (fs.existsSync(pubspecPath2)) {
  let pubspec2 = fs.readFileSync(pubspecPath2, 'utf8');
  pubspec2 = pubspec2.replace(
    /\d[\d,]+ open-source/,
    `${iconCount.toLocaleString('en-US')} open-source`
  );
  fs.writeFileSync(pubspecPath2, pubspec2);
}

// Format the generated Dart file
const dartFile = path.join(rootDir, 'lib/tabler_icons_plus.dart');
require('child_process').execSync(`dart format "${dartFile}"`, { stdio: 'inherit' });

console.log(`Dart class written (${iconCount} icons).`);
console.log('TTF copied to lib/fonts/.');

function getTablerVersion() {
  try { return require('../node_modules/@tabler/icons/package.json').version; }
  catch { return 'unknown'; }
}
