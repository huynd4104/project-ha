import 'model_helpers.dart';

class Badge {
  const Badge({
    required this.id,
    required this.name,
    required this.description,
    this.iconUrl = '',
    this.type = '',
    this.conditionType = '',
    this.conditionValue = 0,
    this.isActive = true,
    this.isEarned = false,
  });
  final String id;
  final String name;
  final String description;
  final String iconUrl;
  final String type;
  final String conditionType;
  final int conditionValue;
  final bool isActive;
  final bool isEarned;

  factory Badge.fromMap(
    String id,
    Map<String, dynamic> map, {
    bool isEarned = false,
  }) => Badge(
    id: id,
    name: '${map['name'] ?? ''}',
    description: '${map['description'] ?? ''}',
    iconUrl: '${map['iconUrl'] ?? ''}',
    type: '${map['type'] ?? ''}',
    conditionType: '${map['conditionType'] ?? ''}',
    conditionValue: readInt(map['conditionValue']),
    isActive: map['isActive'] != false,
    isEarned: isEarned,
  );

  Map<String, dynamic> toMap() => {
    'name': name,
    'description': description,
    'iconUrl': iconUrl,
    'type': type,
    'conditionType': conditionType,
    'conditionValue': conditionValue,
    'isActive': isActive,
  };

  Badge copyWith({bool? isEarned}) => Badge(
    id: id,
    name: name,
    description: description,
    iconUrl: iconUrl,
    type: type,
    conditionType: conditionType,
    conditionValue: conditionValue,
    isActive: isActive,
    isEarned: isEarned ?? this.isEarned,
  );
}
