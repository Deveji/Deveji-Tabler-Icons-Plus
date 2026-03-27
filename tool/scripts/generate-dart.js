const fs   = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../..');
const cssDir  = path.join(__dirname, '../assets/css');

const tablerVersion = getTablerVersion();

// Parse codepoints from CSS files
const outlineIcons = parseCss(path.join(cssDir, 'tabler-icons.css'));
const filledIcons  = parseCss(path.join(cssDir, 'tabler-icons-filled.css'));

const allIcons = {};
outlineIcons.forEach(function(entry) { allIcons[entry[0]] = { cp: entry[1], filled: false }; });
filledIcons.forEach(function(entry) { allIcons[entry[0] + 'Filled'] = { cp: entry[1], filled: true }; });

const iconCount = Object.keys(allIcons).length;
const outlineCount = outlineIcons.length;
const filledCount  = filledIcons.length;

// Generate Dart fields
var fields = Object.entries(allIcons)
  .sort(function(a, b) { return a[0].localeCompare(b[0]); })
  .map(function(entry) {
    var dartName = entry[0];
    var cp = entry[1].cp;
    var filled = entry[1].filled;
    var family = filled ? '_kFontFamFilled' : '_kFontFam';
    return '  /// Tabler icon: "' + dartName + '"\n' +
    '  static const IconData ' + dartName + ' = ' +
    'IconData(0x' + cp + ', fontFamily: ' + family + ', fontPackage: _kFontPkg);';
  }).join('\n\n');

var src = [
  '// GENERATED — do not edit by hand.',
  '// Run: cd tool && npm run build',
  '// Source: @tabler/icons-webfont v' + tablerVersion,
  '// Icons: ' + iconCount + ' (' + outlineCount + ' outline + ' + filledCount + ' filled)',
  '',
  '/// Tabler Icons for Flutter.',
  '///',
  "/// Use these icons with Flutter's [Icon] widget:",
  '///',
  '/// ```dart',
  '/// Icon(TablerIcons.home)',
  '/// Icon(TablerIcons.homeFilled)',
  '/// Icon(TablerIcons.arrowLeft, size: 24, color: Colors.blue)',
  '/// ```',
  '///',
  '/// Browse the full icon set at [tabler.io/icons](https://tabler.io/icons).',
  '///',
  '/// Generated from [@tabler/icons-webfont](https://www.npmjs.com/package/@tabler/icons-webfont) v' + tablerVersion + '.',
  'library;',
  '',
  "import 'package:flutter/widgets.dart';",
  '',
  '/// Identifiers for the icons available in the Tabler Icons font.',
  '///',
  '/// Contains ' + iconCount + ' icons from [Tabler Icons](https://tabler.io/icons) v' + tablerVersion + '.',
  '///',
  '/// Outline icons use the default name (e.g. [home], [star]).',
  '/// Filled variants are suffixed with `Filled` (e.g. [homeFilled], [starFilled]).',
  'class TablerIcons {',
  '  TablerIcons._();',
  "  static const _kFontFam = 'tabler-icons';",
  "  static const _kFontFamFilled = 'tabler-icons-filled';",
  "  static const _kFontPkg = 'tabler_icons_plus';",
  '',
  fields,
  '}',
  '',
].join('\n');

// Write Dart file
fs.writeFileSync(path.join(rootDir, 'lib/tabler_icons_plus.dart'), src);

// Update pubspec.yaml version
if (tablerVersion !== 'unknown') {
  var pubspecPath = path.join(rootDir, 'pubspec.yaml');
  var pubspec = fs.readFileSync(pubspecPath, 'utf8');
  pubspec = pubspec.replace(/^version:\s+.+$/m, 'version: ' + tablerVersion);
  fs.writeFileSync(pubspecPath, pubspec);
  console.log('pubspec.yaml version updated to ' + tablerVersion + '.');
}

// Update README.md badges
var readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  var readme = fs.readFileSync(readmePath, 'utf8');
  var countFormatted = iconCount.toLocaleString('en-US').replace(',', '%2C');
  readme = readme.replace(/@tabler\/icons-v[\d.]+/, '@tabler/icons-v' + tablerVersion);
  readme = readme.replace(/icons-[\d%2C]+-blue/, 'icons-' + countFormatted + '-blue');
  readme = readme.replace(/\d[\d,]+ open-source/, iconCount.toLocaleString('en-US') + ' open-source');
  fs.writeFileSync(readmePath, readme);
  console.log('README.md badges updated.');
}

// Update pubspec.yaml description icon count
var pubspecPath2 = path.join(rootDir, 'pubspec.yaml');
if (fs.existsSync(pubspecPath2)) {
  var pubspec2 = fs.readFileSync(pubspecPath2, 'utf8');
  pubspec2 = pubspec2.replace(/\d[\d,]+ open-source/, iconCount.toLocaleString('en-US') + ' open-source');
  fs.writeFileSync(pubspecPath2, pubspec2);
}

// Update CHANGELOG.md
var changelogPath = path.join(rootDir, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  var prevOutline = 0, prevFilled = 0;
  try {
    var prevData = JSON.parse(fs.readFileSync(path.join(__dirname, '../output/prev-counts.json'), 'utf8'));
    prevOutline = prevData.outline || 0;
    prevFilled = prevData.filled || 0;
  } catch(e) {}

  var prevTotal = prevOutline + prevFilled;
  var newIcons = iconCount - prevTotal;

  if (newIcons > 0) {
    var entry = '## ' + tablerVersion + '\n\n';
    entry += '- Updated to @tabler/icons-webfont v' + tablerVersion + '\n';
    entry += '- ' + iconCount.toLocaleString('en-US') + ' icons (' + outlineCount.toLocaleString('en-US') + ' outline + ' + filledCount.toLocaleString('en-US') + ' filled)\n';
    entry += '- Added ' + newIcons + ' new icons\n';

    var changelog = fs.readFileSync(changelogPath, 'utf8');
    if (changelog.indexOf('## ' + tablerVersion + '\n') === -1) {
      changelog = changelog.replace('# Changelog\n', '# Changelog\n\n' + entry);
      fs.writeFileSync(changelogPath, changelog);
      console.log('CHANGELOG.md updated.');
    }
  }

  // Save current counts for next run
  fs.mkdirSync(path.join(__dirname, '../output'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../output/prev-counts.json'),
    JSON.stringify({ outline: outlineCount, filled: filledCount }));
}

// Format the generated Dart file
var dartFile = path.join(rootDir, 'lib/tabler_icons_plus.dart');
require('child_process').execSync('dart format "' + dartFile + '"', { stdio: 'inherit' });

console.log('Dart class written (' + iconCount + ' icons: ' + outlineCount + ' outline + ' + filledCount + ' filled).');

// --- Helper functions ---

function parseCss(filePath) {
  var css = fs.readFileSync(filePath, 'utf8');
  var regex = /\.ti-([\w-]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)";\s*\}/g;
  var icons = [];
  var match;
  while ((match = regex.exec(css)) !== null) {
    var name = toCamel(match[1]);
    var codepoint = match[2];
    icons.push([name, codepoint]);
  }
  return icons;
}

function toCamel(s) {
  var camel = s.replace(/-([a-z0-9])/g, function(_, c) { return c.toUpperCase(); });
  if (/^[0-9]/.test(camel)) camel = 'icon' + camel;
  if (camel === 'switch') camel = 'switch1';
  return camel;
}

function getTablerVersion() {
  try { return require('../node_modules/@tabler/icons-webfont/package.json').version; }
  catch(e) { return 'unknown'; }
}
