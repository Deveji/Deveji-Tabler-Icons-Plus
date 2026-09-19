// Single source of truth for the Tabler webfonts this package ships.
//
// Upstream (@tabler/icons-webfont) publishes one outline font per stroke width
// plus a filled font. Every outline font uses the *same* name -> codepoint map,
// so a stroke width is nothing but a different font family over identical
// codepoints. generate-dart.js fails the build if upstream ever breaks that.
//
// Adding a stroke width upstream ships later means adding one entry here: the
// asset copy and the Dart generation both read this list.

const families = [
  {
    id: 'regular',
    family: 'tabler-icons',
    css: 'tabler-icons.css',
    ttf: 'tabler-icons.ttf',
    kind: 'outline',
    stroke: '2',
    dartClass: 'TablerIcons',
    dartFile: 'lib/src/icons_regular.dart',
    mergesFilled: true,
    doc: 'the Tabler default',
  },
  {
    id: 'light',
    family: 'tabler-icons-300',
    css: 'tabler-icons-300.css',
    ttf: 'tabler-icons-300.ttf',
    kind: 'outline',
    stroke: '1.5',
    dartClass: 'TablerIconsLight',
    dartFile: 'lib/src/icons_light.dart',
    mergesFilled: false,
    doc: 'a lighter line than the default',
  },
  {
    id: 'thin',
    family: 'tabler-icons-200',
    css: 'tabler-icons-200.css',
    ttf: 'tabler-icons-200.ttf',
    kind: 'outline',
    stroke: '1',
    dartClass: 'TablerIconsThin',
    dartFile: 'lib/src/icons_thin.dart',
    mergesFilled: false,
    doc: 'the lightest line Tabler publishes',
  },
  {
    id: 'filled',
    family: 'tabler-icons-filled',
    css: 'tabler-icons-filled.css',
    ttf: 'tabler-icons-filled.ttf',
    kind: 'filled',
    stroke: null,
    // Generated into TablerIcons with a `Filled` suffix rather than its own class.
    dartClass: 'TablerIcons',
    dartFile: 'lib/src/icons_regular.dart',
    mergesFilled: false,
    doc: 'solid icons, which have no stroke variants',
  },
];

const outlines = families.filter((f) => f.kind === 'outline');
const filled = families.find((f) => f.kind === 'filled');
const defaultOutline = outlines.find((f) => f.id === 'regular');

module.exports = { families, outlines, filled, defaultOutline };
