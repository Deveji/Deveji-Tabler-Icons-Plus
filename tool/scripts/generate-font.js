const fs = require('fs');
const { generateFonts, FontAssetType, OtherAssetType } = require('fantasticon');

fs.mkdirSync('./output', { recursive: true });

// Save previous map before overwrite — used by generate-dart.js for changelog
const prevMap = loadExistingCodepoints();
fs.writeFileSync('./output/TablerIcons.prev.json', JSON.stringify(prevMap));

generateFonts({
  inputDir:   '../icons',
  outputDir:  './output',
  name:       'TablerIcons',
  fontTypes:  [FontAssetType.TTF],
  assetTypes: [OtherAssetType.JSON],
  fontHeight: 1000,
  normalize:  true,
  round:      10e12,
  descent:    0,
  codepoints: loadExistingCodepoints(),
}).then(({ assetsIn }) => {
  console.log(`Font generated from ${assetsIn} icons.`);
});

// Reuse codepoints across runs so existing Flutter code
// doesn't break when you add new icons.
function loadExistingCodepoints() {
  try { return require('../output/TablerIcons.json'); }
  catch { return {}; }
}
