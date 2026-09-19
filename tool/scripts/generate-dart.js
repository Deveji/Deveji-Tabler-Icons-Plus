const fs   = require('fs');
const path = require('path');

const { families, outlines, filled, defaultOutline } = require('../config/fonts');

const rootDir = path.join(__dirname, '../..');
const cssDir  = path.join(__dirname, '../assets/css');

const tablerVersion = getTablerVersion();

// Parse codepoints from every CSS file: name -> codepoint, per font family.
const maps = {};
families.forEach(function(font) {
  maps[font.id] = parseCss(path.join(cssDir, font.css));
});

const outlineIcons = maps[defaultOutline.id];
const filledIcons  = maps[filled.id];

// The stroke API hands out one name per icon and swaps only the font family, so
// every outline font has to agree with the default on names and codepoints.
// Upstream has always generated them from one source; fail loudly if that ends.
outlines.forEach(function(font) {
  if (font.id === defaultOutline.id) return;
  var diff = diffMaps(outlineIcons, maps[font.id]);
  if (diff) {
    throw new Error(
      'Codepoint mismatch between ' + defaultOutline.family + ' and ' + font.family + ': ' + diff +
      '. The per-stroke classes assume identical codepoints; tool/config/fonts.js needs revisiting.'
    );
  }
});

const outlineCount = outlineIcons.length;
const filledCount  = filledIcons.length;
const iconCount    = outlineCount + filledCount;

// One Dart file per outline stroke; the default one also carries the filled icons.
outlines.forEach(function(font) {
  var entries = outlineIcons.map(function(e) {
    return { name: e[0], cp: e[1], fam: '_kFontFam' };
  });
  if (font.mergesFilled) {
    filledIcons.forEach(function(e) {
      entries.push({ name: e[0] + 'Filled', cp: e[1], fam: '_kFontFamFilled' });
    });
  }
  entries.sort(function(a, b) { return a.name.localeCompare(b.name); });

  var fields = entries.map(function(e) {
    return '  /// Tabler icon: "' + e.name + '"\n' +
      '  static const IconData ' + e.name + ' = ' +
      'IconData(0x' + e.cp + ', fontFamily: ' + e.fam + ', fontPackage: _kFontPkg);';
  }).join('\n\n');

  var famConsts = ["  static const _kFontFam = '" + font.family + "';"];
  if (font.mergesFilled) {
    famConsts.push("  static const _kFontFamFilled = '" + filled.family + "';");
  }
  famConsts.push("  static const _kFontPkg = 'tabler_icons_plus';");

  fs.mkdirSync(path.join(rootDir, path.dirname(font.dartFile)), { recursive: true });
  fs.writeFileSync(path.join(rootDir, font.dartFile), [
    '// GENERATED — do not edit by hand.',
    '// Run: cd tool && npm run build',
    '// Source: @tabler/icons-webfont v' + tablerVersion + ' (' + font.css + ')',
    '',
    "import 'package:flutter/widgets.dart';",
    '',
    classDoc(font, entries.length),
    '@staticIconProvider',
    'abstract final class ' + font.dartClass + ' {',
    famConsts.join('\n'),
    '',
    fields,
    '}',
    '',
  ].join('\n'));
});

// Barrel library: the public import path, re-exporting one class per stroke.
fs.writeFileSync(path.join(rootDir, 'lib/tabler_icons_plus.dart'), [
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
  '/// Icon(TablerIcons.home)       // outline, stroke 2 (the Tabler default)',
  '/// Icon(TablerIconsLight.home)  // outline, stroke 1.5',
  '/// Icon(TablerIconsThin.home)   // outline, stroke 1',
  '/// Icon(TablerIcons.homeFilled) // filled',
  '/// ```',
  '///',
  '/// Every stroke class carries the same ' + outlineCount.toLocaleString('en-US') + ' outline names, so switching stroke',
  '/// width is a matter of switching class. All of them are `const`, which keeps',
  "/// Flutter's `--tree-shake-icons` working in release builds.",
  '///',
  '/// Browse the full icon set at [tabler.io/icons](https://tabler.io/icons).',
  '///',
  '/// Generated from [@tabler/icons-webfont](https://www.npmjs.com/package/@tabler/icons-webfont) v' + tablerVersion + '.',
  'library;',
  '',
  outlines.map(function(f) { return "export '" + f.dartFile.replace(/^lib\//, '') + "';"; }).join('\n'),
  '',
].join('\n'));

// Update pubspec.yaml version. Never walk it backwards: a hand-published patch
// release (3.47.1) must survive a regeneration against the same upstream tag.
if (tablerVersion !== 'unknown') {
  var pubspecPath = path.join(rootDir, 'pubspec.yaml');
  var pubspec = fs.readFileSync(pubspecPath, 'utf8');
  var current = (pubspec.match(/^version:\s+(.+)$/m) || [])[1];
  if (!current || compareVersions(tablerVersion, current.trim()) > 0) {
    pubspec = pubspec.replace(/^version:\s+.+$/m, 'version: ' + tablerVersion);
    fs.writeFileSync(pubspecPath, pubspec);
    console.log('pubspec.yaml version updated to ' + tablerVersion + '.');
  } else {
    console.log('pubspec.yaml version kept at ' + current.trim() + ' (>= upstream v' + tablerVersion + ').');
  }
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

// Update CHANGELOG.md (async — fetch release notes from GitHub)
updateChangelog().then(function() {
  // Format the generated Dart files after changelog is done
  require('child_process').execSync('dart format "' + path.join(rootDir, 'lib') + '"', { stdio: 'inherit' });

  console.log('Dart written (' + iconCount + ' icons: ' + outlineCount + ' outline + ' + filledCount + ' filled).');
  outlines.forEach(function(f) {
    console.log('  ' + f.dartClass + ' — stroke ' + f.stroke + ' (' + f.family + ')' +
      (f.mergesFilled ? ' + ' + filledCount + ' filled' : ''));
  });
});

async function updateChangelog() {
  var changelogPath = path.join(rootDir, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) return;

  var changelog = fs.readFileSync(changelogPath, 'utf8');
  if (changelog.indexOf('## ' + tablerVersion + '\n') !== -1) {
    // Already has this version
    saveCounts();
    return;
  }

  var prevOutline = 0, prevFilled = 0;
  try {
    var prevData = JSON.parse(fs.readFileSync(path.join(__dirname, '../output/prev-counts.json'), 'utf8'));
    prevOutline = prevData.outline || 0;
    prevFilled = prevData.filled || 0;
  } catch(e) {}

  var prevTotal = prevOutline + prevFilled;
  var newIcons = iconCount - prevTotal;

  // Fetch release notes from Tabler GitHub
  var releaseNotes = await fetchReleaseNotes(tablerVersion);

  var entry = '## ' + tablerVersion + '\n\n';
  entry += '- ' + iconCount.toLocaleString('en-US') + ' icons (' + outlineCount.toLocaleString('en-US') + ' outline + ' + filledCount.toLocaleString('en-US') + ' filled)\n';
  if (newIcons > 0) {
    entry += '- Added ' + newIcons + ' new icons\n';
  }
  if (releaseNotes) {
    entry += '\n### Tabler Icons release notes\n\n' + releaseNotes + '\n';
  }

  changelog = changelog.replace('# Changelog\n', '# Changelog\n\n' + entry);
  fs.writeFileSync(changelogPath, changelog);
  console.log('CHANGELOG.md updated with release notes.');

  saveCounts();
}

function saveCounts() {
  fs.mkdirSync(path.join(__dirname, '../output'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../output/prev-counts.json'),
    JSON.stringify({ outline: outlineCount, filled: filledCount }));
}

async function fetchReleaseNotes(version) {
  try {
    var https = require('https');
    var url = 'https://api.github.com/repos/tabler/tabler-icons/releases/tags/v' + version;

    var body = await new Promise(function(resolve, reject) {
      https.get(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'tabler-icons-plus-pipeline',
        },
      }, function(res) {
        var chunks = [];
        res.on('data', function(c) { chunks.push(c); });
        res.on('end', function() { resolve(Buffer.concat(chunks).toString()); });
      }).on('error', reject);
    });

    var json = JSON.parse(body);
    var notes = (json.body || '').trim();
    if (!notes) return null;

    // Clean up: remove image tags, normalize line endings
    notes = notes.replace(/\r\n/g, '\n');
    notes = notes.replace(/<img[^>]*\/?>/gi, '');
    return notes.trim() || null;
  } catch(e) {
    console.log('Could not fetch release notes: ' + e.message);
    return null;
  }
}

// --- Helper functions ---

function classDoc(font, count) {
  var lines = [
    '/// Identifiers for the icons available in the Tabler Icons font' +
      (font.stroke ? ', at stroke width ' + font.stroke : '') + '.',
    '///',
    '/// Contains ' + count.toLocaleString('en-US') + ' icons from [Tabler Icons](https://tabler.io/icons) v' + tablerVersion + '.',
    '///',
  ];
  if (font.mergesFilled) {
    lines.push(
      '/// Outline icons use the default name (e.g. [home], [star]).',
      '/// Filled variants are suffixed with `Filled` (e.g. [homeFilled], [starFilled]).',
      '///',
      '/// Lighter outlines live in `TablerIconsLight` (stroke 1.5) and',
      '/// `TablerIconsThin` (stroke 1) under the same names.'
    );
  } else {
    lines.push(
      '/// Drawn with ' + font.doc + '. The names match `TablerIcons` exactly, so',
      '/// swapping the class swaps the stroke width:',
      '///',
      '/// ```dart',
      '/// Icon(TablerIcons.home)  // stroke 2',
      '/// Icon(' + font.dartClass + '.home)  // stroke ' + font.stroke,
      '/// ```',
      '///',
      '/// Filled icons have no stroke variants — they live on `TablerIcons` only.'
    );
  }
  return lines.join('\n');
}

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

// Returns a human-readable description of the first difference, or null.
function diffMaps(a, b) {
  if (a.length !== b.length) return a.length + ' vs ' + b.length + ' icons';
  var byName = {};
  a.forEach(function(e) { byName[e[0]] = e[1]; });
  for (var i = 0; i < b.length; i++) {
    var name = b[i][0], cp = b[i][1];
    if (!(name in byName)) return 'only one font has "' + name + '"';
    if (byName[name].toLowerCase() !== cp.toLowerCase()) {
      return '"' + name + '" is 0x' + byName[name] + ' vs 0x' + cp;
    }
  }
  return null;
}

function compareVersions(a, b) {
  var pa = String(a).split('.').map(Number);
  var pb = String(b).split('.').map(Number);
  for (var i = 0; i < 3; i++) {
    var da = pa[i] || 0, db = pb[i] || 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
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
