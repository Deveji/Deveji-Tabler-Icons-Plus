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
    plane: null,
    mergesFilled: false,
    doc: 'solid icons, which have no stroke variants',
  },
];

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

module.exports = { families, outlines, filled, defaultOutline, bundles, codepointDelta };
