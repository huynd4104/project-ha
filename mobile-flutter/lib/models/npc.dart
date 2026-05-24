class NPC {
  const NPC({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    this.animationUrl,
    this.defaultDialogue = '',
    this.isActive = true,
  });

  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final String? animationUrl;
  final String defaultDialogue;
  final bool isActive;

  factory NPC.fromMap(String id, Map<String, dynamic> map) => NPC(
    id: id,
    name: '${map['name'] ?? ''}',
    description: '${map['description'] ?? ''}',
    imageUrl: '${map['imageUrl'] ?? ''}',
    animationUrl: map['animationUrl']?.toString(),
    defaultDialogue: '${map['defaultDialogue'] ?? ''}',
    isActive: map['isActive'] != false,
  );

  Map<String, dynamic> toMap() => {
    'name': name,
    'description': description,
    'imageUrl': imageUrl,
    'animationUrl': animationUrl,
    'defaultDialogue': defaultDialogue,
    'isActive': isActive,
  };

  NPC copyWith({String? name}) => NPC(
    id: id,
    name: name ?? this.name,
    description: description,
    imageUrl: imageUrl,
    animationUrl: animationUrl,
    defaultDialogue: defaultDialogue,
    isActive: isActive,
  );
}
