import 'package:flutter/material.dart';
import 'icon_list.dart';

void main() => runApp(const TablerIconsExampleApp());

class TablerIconsExampleApp extends StatelessWidget {
  const TablerIconsExampleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tabler Icons Plus',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: Colors.blue,
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: Colors.blue,
        brightness: Brightness.dark,
        useMaterial3: true,
      ),
      home: const IconGalleryPage(),
    );
  }
}

class IconGalleryPage extends StatefulWidget {
  const IconGalleryPage({super.key});

  @override
  State<IconGalleryPage> createState() => _IconGalleryPageState();
}

class _IconGalleryPageState extends State<IconGalleryPage> {
  static const _minTileSize = 64.0;
  static const _maxTileSize = 192.0;
  static const _defaultTileSize = 96.0;

  String _query = '';
  double _tileSize = _defaultTileSize;
  late List<IconEntry> _filtered;

  @override
  void initState() {
    super.initState();
    _filtered = allIcons;
  }

  void _onSearch(String value) {
    setState(() {
      _query = value.toLowerCase();
      _filtered = _query.isEmpty
          ? allIcons
          : allIcons.where((e) => e.label.contains(_query)).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final iconSize = _tileSize * 0.3;
    final fontSize = (_tileSize * 0.1).clamp(8.0, 14.0);

    return Scaffold(
      appBar: AppBar(
        title: Text('Tabler Icons (${_filtered.length})'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              onChanged: _onSearch,
              decoration: InputDecoration(
                hintText: 'Search icons...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.remove),
            tooltip: 'Zoom out',
            onPressed: _tileSize <= _minTileSize
                ? null
                : () => setState(() =>
                    _tileSize = (_tileSize - 16).clamp(_minTileSize, _maxTileSize)),
          ),
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Zoom in',
            onPressed: _tileSize >= _maxTileSize
                ? null
                : () => setState(() =>
                    _tileSize = (_tileSize + 16).clamp(_minTileSize, _maxTileSize)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _filtered.isEmpty
          ? const Center(child: Text('No icons found'))
          : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: _tileSize,
                mainAxisSpacing: 4,
                crossAxisSpacing: 4,
                childAspectRatio: 0.85,
              ),
              itemCount: _filtered.length,
              itemBuilder: (context, index) {
                final entry = _filtered[index];
                return _IconTile(
                  entry: entry,
                  iconSize: iconSize,
                  fontSize: fontSize,
                );
              },
            ),
    );
  }
}

class _IconTile extends StatelessWidget {
  const _IconTile({
    required this.entry,
    required this.iconSize,
    required this.fontSize,
  });
  final IconEntry entry;
  final double iconSize;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(entry.label),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 1),
            ),
          );
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(entry.icon, size: iconSize, color: colorScheme.onSurface),
          const SizedBox(height: 4),
          Text(
            entry.label,
            style: TextStyle(fontSize: fontSize, color: colorScheme.onSurfaceVariant),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
