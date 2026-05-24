class MediaAsset {
  const MediaAsset({
    required this.id,
    required this.name,
    required this.url,
    this.type = '',
    this.path = '',
  });
  final String id;
  final String name;
  final String url;
  final String type;
  final String path;

  factory MediaAsset.fromMap(String id, Map<String, dynamic> map) => MediaAsset(
    id: id,
    name: '${map['name'] ?? map['fileName'] ?? ''}',
    url: '${map['url'] ?? map['downloadUrl'] ?? ''}',
    type: '${map['type'] ?? ''}',
    path: '${map['path'] ?? ''}',
  );
  Map<String, dynamic> toMap() => {
    'name': name,
    'url': url,
    'type': type,
    'path': path,
  };
}
