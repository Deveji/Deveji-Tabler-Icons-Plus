const fs = require('fs');

// Upstream's stylesheets are the source of truth for icon names and codepoints:
// `.ti-home:before { content: "\ea8c"; }`
function parseCss(filePath) {
  var css = fs.readFileSync(filePath, 'utf8');
  var regex = /\.ti-([\w-]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)";\s*\}/g;
  var icons = [];
  var match;
  while ((match = regex.exec(css)) !== null) {
    icons.push([toCamel(match[1]), match[2]]);
  }
  return icons;
}

function toCamel(s) {
  var camel = s.replace(/-([a-z0-9])/g, function(_, c) { return c.toUpperCase(); });
  if (/^[0-9]/.test(camel)) camel = 'icon' + camel;
  if (camel === 'switch') camel = 'switch1';
  return camel;
}

module.exports = { parseCss, toCamel };
