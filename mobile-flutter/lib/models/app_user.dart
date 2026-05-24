class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;

  factory AppUser.fromMap(String id, Map<String, dynamic> map) => AppUser(
    id: id,
    email: '${map['email'] ?? ''}',
    fullName: '${map['fullName'] ?? ''}',
    role: '${map['role'] ?? 'PARENT'}',
    isActive: map['isActive'] != false,
  );

  Map<String, dynamic> toMap() => {
    'uid': id,
    'email': email,
    'fullName': fullName,
    'role': role,
    'isActive': isActive,
  };

  AppUser copyWith({String? fullName, bool? isActive}) => AppUser(
    id: id,
    email: email,
    fullName: fullName ?? this.fullName,
    role: role,
    isActive: isActive ?? this.isActive,
  );
}
