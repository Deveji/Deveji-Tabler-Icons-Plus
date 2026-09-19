"""Merge Tabler's outline stroke fonts into a single font.

Upstream publishes one font per stroke width, all mapping the same icons to the
same codepoints. Bundling them as three font families means Flutter's icon tree
shaker skips any family an app never references and ships it whole (~1.8 MB
each, flutter/flutter#64106).

Merging them into one family removes that failure mode: the font is referenced
whenever the app uses any Tabler icon, so it is always subset down to the glyphs
actually used, and an unused stroke costs nothing.

The base font keeps its codepoints untouched, so icons that already shipped keep
their values. Each additional stroke is remapped into a private-use plane.

  usage: merge_fonts.py --base BASE.ttf --add FONT.ttf:DELTA ... --out OUT.ttf

Codepoint deltas are computed by the caller (tool/config/fonts.js) so the Dart
generator and this script cannot disagree about where a stroke landed.
"""

import argparse
import sys

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._c_m_a_p import CmapSubtable


MAX_CODEPOINT = 0x10FFFD


def parse_add(value):
    path, _, delta = value.rpartition(':')
    if not path:
        raise argparse.ArgumentTypeError('expected FONT.ttf:DELTA, got %r' % value)
    return path, int(delta, 0)


def build_cmap(font, mapping):
    """Replace the font's cmap with format 4 (BMP) + format 12 (full) tables."""
    bmp = {cp: name for cp, name in mapping.items() if cp <= 0xFFFF}

    fmt4 = CmapSubtable.newSubtable(4)
    fmt4.platformID, fmt4.platEncID, fmt4.language = 3, 1, 0
    fmt4.cmap = bmp

    fmt12 = CmapSubtable.newSubtable(12)
    fmt12.platformID, fmt12.platEncID, fmt12.language = 3, 10, 0
    fmt12.format, fmt12.reserved, fmt12.length = 12, 0, 0
    fmt12.nGroups = 0
    fmt12.cmap = mapping

    font['cmap'].tableVersion = 0
    font['cmap'].tables = [fmt4, fmt12]


def load(path):
    """Load without touching anything we are not deliberately changing.

    recalcBBoxes: upstream's glyphs carry bounding boxes that disagree with their
    own coordinates, and their hmtx left-side bearings are written to match the
    stored boxes. Letting fontTools recompute them shifts glyphs horizontally
    against the font everyone is already rendering.

    recalcTimestamp: head.modified would otherwise change on every run, so the
    daily pipeline would commit a "new" font whenever it rebuilt.
    """
    return TTFont(path, recalcBBoxes=False, recalcTimestamp=False)


def merge(base_path, additions, out_path):
    base = load(base_path)
    glyf, hmtx = base['glyf'], base['hmtx']
    order = list(base.getGlyphOrder())
    mapping = dict(base.getBestCmap())

    report = [('base', base_path, 0, len(mapping))]

    for index, (path, delta) in enumerate(additions):
        font = load(path)
        src_glyf, src_hmtx = font['glyf'], font['hmtx']
        prefix = 's%d_' % index
        added = 0

        for cp, name in sorted(font.getBestCmap().items()):
            if src_glyf[name].isComposite():
                sys.exit('%s: composite glyph %r is not supported' % (path, name))
            new_cp = cp + delta
            if not 0 < new_cp <= MAX_CODEPOINT:
                sys.exit('%s: U+%04X + 0x%X lands outside Unicode' % (path, cp, delta))
            if new_cp in mapping:
                sys.exit('codepoint collision at U+%04X merging %s' % (new_cp, path))
            new_name = prefix + name
            if new_name not in glyf.glyphs:
                glyf.glyphs[new_name] = src_glyf[name]
                hmtx.metrics[new_name] = src_hmtx[name]
                order.append(new_name)
                added += 1
            mapping[new_cp] = new_name

        report.append((prefix, path, delta, added))

    base.setGlyphOrder(order)
    base['maxp'].numGlyphs = len(order)
    build_cmap(base, mapping)
    base.save(out_path)

    for prefix, path, delta, count in report:
        print('  %-6s %-24s delta=+0x%05X glyphs=%d' % (prefix, path.split('/')[-1], delta, count))
    print('  merged: %d glyphs, %d codepoints -> %s' % (len(order), len(mapping), out_path))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--add', action='append', type=parse_add, default=[])
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    merge(args.base, args.add, args.out)


if __name__ == '__main__':
    main()
