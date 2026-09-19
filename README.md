<p align="center">
  <img src="assets/logo.svg" alt="Tabler Icons" width="80">
</p>

<h1 align="center">Tabler Icons for Flutter</h1>

<p align="center">
  <a href="https://pub.dev/packages/tabler_icons_plus"><img src="https://img.shields.io/pub/v/tabler_icons_plus?color=blue&label=pub.dev" alt="pub.dev"></a>
  <a href="https://www.npmjs.com/package/@tabler/icons"><img src="https://img.shields.io/badge/@tabler/icons-v3.47.0-066fd1" alt="@tabler/icons version"></a>
  <a href="https://tabler.io/icons"><img src="https://img.shields.io/badge/icons-6%2C268-blue" alt="Icon count"></a>
</p>

<p align="center">
  <strong>6,268 open-source <a href="https://tabler.io/icons">Tabler Icons</a></strong> as typed <code>IconData</code> constants for Flutter,<br>
  in all three stroke widths plus filled. Drop-in compatible with the <code>Icon</code> widget and theme system.
</p>

<p align="center">
  <a href="https://tabler.io/icons"><strong>Browse all icons &rarr;</strong></a>
</p>

<div align="center">
  <h3>✨ Always Up-to-Date</h3>
  <p>Every new Tabler Icons release is automatically synced and published to <a href="https://pub.dev/packages/tabler_icons_plus">pub.dev</a> daily. <br>Enjoy a continuously refreshed icon library requiring zero manual maintenance.</p>
</div>

---

## Getting Started

Add the package to your `pubspec.yaml`:

```sh
flutter pub add tabler_icons_plus
```

Then import and use:

```dart
import 'package:tabler_icons_plus/tabler_icons_plus.dart';
```

---

## Usage

```dart
// Simple icon
Icon(TablerIcons.home)

// Sized and colored
Icon(TablerIcons.bell, size: 32, color: Colors.blue)

// Inside a button
IconButton(
  icon: Icon(TablerIcons.settings),
  onPressed: () {},
)

// Themed group
IconTheme(
  data: IconThemeData(size: 24, color: Colors.grey),
  child: Row(
    children: [
      Icon(TablerIcons.heart),
      Icon(TablerIcons.star),
      Icon(TablerIcons.user),
    ],
  ),
)
```

---

## Stroke Widths

Tabler draws its outline icons at three stroke widths, and this package ships all
of them. Every class carries the **same 5,211 names**, so you change stroke by
changing class:

```dart
Icon(TablerIcons.home)       // stroke 2 (the Tabler default)
Icon(TablerIconsLight.home)  // stroke 1.5
Icon(TablerIconsThin.home)   // stroke 1
Icon(TablerIcons.homeFilled) // filled, no stroke variants
```

| Class | Stroke | Upstream font | Icons |
|:--|:--|:--|:--|
| `TablerIcons` | 2 | `tabler-icons` | 5,211 outline + 1,057 filled |
| `TablerIconsLight` | 1.5 | `tabler-icons-300` | 5,211 outline |
| `TablerIconsThin` | 1 | `tabler-icons-200` | 5,211 outline |

Choosing between them at runtime is fine, since both branches stay `const`:

```dart
Icon(compact ? TablerIconsThin.home : TablerIcons.home)
```

### App size

Every icon constant is `const`, so release builds subset each font down to the
icons you reference, so a stroke you use costs about a kilobyte.

A font you *never* reference is the exception: it is not subsetted at all, and
ships whole (~1.8 MB per outline font). Unused *assets* are not removed from a
build: that is [flutter#64106](https://github.com/flutter/flutter/issues/64106)
("Tree shake unused assets"), open since 2020, and it affects every multi-style
icon package.

You can shrink them anyway. Reference one icon from each font in code that runs,
and every font collapses to a single glyph. Nothing needs to be displayed:

```dart
const keepStrokes = <IconData>[
  TablerIcons.home,
  TablerIcons.homeFilled,
  TablerIconsLight.home,
  TablerIconsThin.home,
];

void main() {
  debugPrint('${keepStrokes.length}');
  runApp(const MyApp());
}
```

Measured in a release APK, that took an otherwise-unused outline font from
1,826,040 bytes down to 860. What matters is reachability, not rendering: a
top-level `const` that nothing references is stripped by the AOT compiler before
the tree shaker runs, and the font ships whole. `Offstage(child: Icon(...))`
works too, since it stays in the widget tree without being laid out or painted.

---

## Icon Naming

Tabler's kebab-case names are converted to **camelCase**:

| Tabler Name | Dart Constant |
|:--|:--|
| `arrow-left` | `TablerIcons.arrowLeft` |
| `chevron-down` | `TablerIcons.chevronDown` |
| `brand-github` | `TablerIcons.brandGithub` |
| `circle-check` | `TablerIcons.circleCheck` |
| `switch` | `TablerIcons.switch1` |

> **Note:** `switch` is a Dart reserved keyword and is renamed to `switch1` for consistency with `switch2` and `switch3`.

---

## Platforms

<table>
  <tr>
    <td align="center"><strong>Android</strong></td>
    <td align="center"><strong>iOS</strong></td>
    <td align="center"><strong>Web</strong></td>
    <td align="center"><strong>macOS</strong></td>
    <td align="center"><strong>Linux</strong></td>
    <td align="center"><strong>Windows</strong></td>
  </tr>
  <tr>
    <td align="center">&#10003;</td>
    <td align="center">&#10003;</td>
    <td align="center">&#10003;</td>
    <td align="center">&#10003;</td>
    <td align="center">&#10003;</td>
    <td align="center">&#10003;</td>
  </tr>
</table>

---

## License

MIT License. See [LICENSE](LICENSE) for details.

Icon designs by [Paweł Kuna](https://github.com/tabler/tabler-icons) under the [MIT License](https://github.com/tabler/tabler-icons/blob/main/LICENSE).

<p align="center">
  <sub>Built with &#9829; by <a href="https://deveji.com">Deveji</a></sub>
</p>
