import 'model_helpers.dart';

class ChildProfile {
  const ChildProfile({
    required this.id,
    required this.userId,
    required this.name,
    required this.age,
    this.gender = '',
    this.note = '',
  });

  final String id;
  final String userId;
  final String name;
  final int age;
  final String gender;
  final String note;

  factory ChildProfile.fromMap(String id, Map<String, dynamic> map) =>
      ChildProfile(
        id: id,
        userId: '${map['userId'] ?? ''}',
        name: '${map['name'] ?? ''}',
        age: readInt(map['age']),
        gender: '${map['gender'] ?? ''}',
        note: '${map['note'] ?? ''}',
      );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'name': name,
    'age': age,
    'gender': gender,
    'note': note,
  };

  ChildProfile copyWith({
    String? name,
    int? age,
    String? gender,
    String? note,
  }) => ChildProfile(
    id: id,
    userId: userId,
    name: name ?? this.name,
    age: age ?? this.age,
    gender: gender ?? this.gender,
    note: note ?? this.note,
  );
}
