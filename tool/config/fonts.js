// Single source of truth for the Tabler webfonts this package ships.
//
// Upstream (@tabler/icons-webfont) publishes one outline font per stroke width
// plus a filled font, and every outline font maps the same icons to the same
// codepoints.
//
// Shipping those as separate font families would make an app pay for strokes it
// never uses: Flutter's icon tree shaker skips any family with no referenced
// icons and bundles it at full size (flutter/flutter#64106). So the outline
// fonts are merged into one family instead, with each extra stroke remapped
// into a private-use plane. One family is referenced whenever the app uses any
// Tabler icon, so it is always subset down to the glyphs actually used.
//
// `plane: null` keeps a font's upstream codepoints. The default stroke and the
// filled font both keep theirs, so no icon that has already shipped changes its
// codePoint.
//
// Adding a stroke width upstream ships later means adding one entry here: asset
// copying, font merging and Dart generation all read this list.

const families = [
  {
    id: 'regular',
    css: 'tabler-icons.css',
    source: 'tabler-icons.ttf', // file name in @tabler/icons-webfont/dist/fonts
    kind: 'outline',
    stroke: '2',
    dartClass: 'TablerIcons',
    dartFile: 'lib/src/icons_regular.dart',
    bundledTtf: 'tabler-icons.ttf', // what lands in lib/fonts
    family: 'tabler-icons', // the family Flutter registers
    plane: null,
    mergeBase: true, // keeps its codepoints; everything else merges into it
    // The default class also carries the filled icons, suffixed with `Filled`.
    mergesFilled: true,
    doc: 'the Tabler default',
  },
  {
    id: 'light',
    css: 'tabler-icons-300.css',
    source: 'tabler-icons-300.ttf',
    kind: 'outline',
    stroke: '1.5',
    dartClass: 'TablerIconsLight',
    dartFile: 'lib/src/icons_light.dart',
    bundledTtf: 'tabler-icons.ttf',
    family: 'tabler-icons',
    plane: 0xf0000, // private-use plane 15
    mergesFilled: false,
    doc: 'a lighter line than the default',
  },
  {
    id: 'thin',
    css: 'tabler-icons-200.css',
    source: 'tabler-icons-200.ttf',
    kind: 'outline',
    stroke: '1',
    dartClass: 'TablerIconsThin',
    dartFile: 'lib/src/icons_thin.dart',
    bundledTtf: 'tabler-icons.ttf',
    family: 'tabler-icons',
    plane: 0x100000, // private-use plane 16
    mergesFilled: false,
    doc: 'the lightest line Tabler publishes',
  },
  {
    id: 'filled',
    css: 'tabler-icons-filled.css',
    source: 'tabler-icons-filled.ttf',
    kind: 'filled',
    stroke: null,
    // Generated into TablerIcons with a `Filled` suffix rather than its own class.
    dartClass: 'TablerIcons',
    dartFile: 'lib/src/icons_regular.dart',
    bundledTtf: 'tabler-icons.ttf',
    family: 'tabler-icons',
    // Filled codepoints do not collide with the outline ones, so they merge in
    // unchanged; merge_fonts.py fails the build if upstream ever changes that.
    // Those that are default ignorable are rescued into plane 15 — see below.
    plane: null,
    mergesFilled: false,
    doc: 'solid icons, which have no stroke variants',
  },
];

// Unicode's "default ignorable" codepoints. HarfBuzz replaces these with an
// invisible glyph while shaping, whatever the font maps them to, so an icon that
// lands on one renders as nothing at all — Flutter draws Icon as text, so this
// hits every app that names it. Upstream assigns icons by walking up from the
// private-use area and runs past its end (U+F8FF) into assigned characters,
// landing on a handful of these.
const defaultIgnorable = [
  [0x00ad, 0x00ad], [0x034f, 0x034f], [0x061c, 0x061c], [0x115f, 0x1160],
  [0x17b4, 0x17b5], [0x180b, 0x180f], [0x200b, 0x200f], [0x202a, 0x202e],
  [0x2060, 0x206f], [0x3164, 0x3164], [0xfe00, 0xfe0f], [0xfeff, 0xfeff],
  [0xffa0, 0xffa0], [0xfff0, 0xfff8], [0x1bca0, 0x1bca3], [0x1d173, 0x1d17a],
  [0xe0000, 0xe0fff],
];

// Where a rescued icon goes: private-use plane 15, above the merged strokes.
// Shifting by a fixed delta rather than packing rescued icons in order keeps
// each one's codepoint stable if upstream ever puts another icon on an ignorable
// codepoint — an icon that has shipped never moves twice.
const rescueDelta = 0xea000;
const rescuePlane = [0xf0000, 0xffffd];

function isDefaultIgnorable(cp) {
  return defaultIgnorable.some((range) => cp >= range[0] && cp <= range[1]);
}

// Only fonts that keep their upstream codepoints (plane === null) can land on an
// ignorable one; a font merged into a plane cannot, because planes 15 and 16 are
// private use end to end.
function rescueCodepoint(cp) {
  if (!isDefaultIgnorable(cp)) return cp;
  var moved = cp + rescueDelta;
  if (moved < rescuePlane[0] || moved > rescuePlane[1]) {
    throw new Error(
      'U+' + cp.toString(16).toUpperCase() + ' rescues to U+' + moved.toString(16).toUpperCase() +
      ', outside private-use plane 15. tool/config/fonts.js needs a different rescueDelta.'
    );
  }
  return moved;
}

const outlines = families.filter((f) => f.kind === 'outline');
const filled = families.find((f) => f.kind === 'filled');
const defaultOutline = outlines.find((f) => f.mergeBase);

// One entry per file in lib/fonts. A bundle with several sources is built by
// merge-fonts.js; a bundle with one source is copied straight from upstream.
const bundles = [];
families.forEach((font) => {
  var bundle = bundles.find((b) => b.ttf === font.bundledTtf);
  if (!bundle) {
    bundle = { ttf: font.bundledTtf, family: font.family, sources: [] };
    bundles.push(bundle);
  }
  bundle.sources.push(font);
});

// How far a font's codepoints move when it is merged. A font with no plane
// keeps its codepoints. Derived from the lowest codepoint in use so a stroke
// lands at the start of its plane, and shared by the merger and the Dart
// generator so the two cannot disagree.
function codepointDelta(font, minCodepoint) {
  return font.plane === null ? 0 : font.plane - minCodepoint;
}

module.exports = {
  families, outlines, filled, defaultOutline, bundles, codepointDelta,
  isDefaultIgnorable, rescueCodepoint,
};
