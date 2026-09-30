## Basic Usage

```dart
import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Tabler Icons Demo')),
        body: const Center(
          child: Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              Icon(TablerIcons.home, size: 32),
              Icon(TablerIcons.user, size: 32),
              Icon(TablerIcons.settings, size: 32),
              Icon(TablerIcons.bell, size: 32),
              Icon(TablerIcons.heart, size: 32, color: Colors.red),
              Icon(TablerIcons.star, size: 32, color: Colors.amber),
            ],
          ),
        ),
      ),
    );
  }
}
```

## Stroke Widths

Every outline icon exists at three stroke widths under the same name. Pick one
by picking a class:

```dart
Row(
  children: const [
    Icon(TablerIcons.home, size: 32),       // stroke 2 (default)
    Icon(TablerIconsLight.home, size: 32),  // stroke 1.5
    Icon(TablerIconsThin.home, size: 32),   // stroke 1
    Icon(TablerIcons.homeFilled, size: 32), // filled
  ],
)
```

All four are `const`, so release builds still tree-shake the fonts down to the
icons you use.

## Icon Naming

Tabler's kebab-case names are converted to camelCase:

| Tabler Name | Dart Constant |
|---|---|
| `arrow-left` | `TablerIcons.arrowLeft` |
| `chevron-down` | `TablerIcons.chevronDown` |
| `brand-github` | `TablerIcons.brandGithub` |
| `circle-check` | `TablerIcons.circleCheck` |

Browse all icons at [tabler.io/icons](https://tabler.io/icons).
