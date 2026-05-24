class UserBadge {
  const UserBadge({
    required this.id,
    required this.userId,
    required this.childId,
    required this.badgeId,
  });
  final String id;
  final String userId;
  final String childId;
  final String badgeId;

  factory UserBadge.fromMap(String id, Map<String, dynamic> map) => UserBadge(
    id: id,
    userId: '${map['userId'] ?? ''}',
    childId: '${map['childId'] ?? ''}',
    badgeId: '${map['badgeId'] ?? ''}',
  );
  Map<String, dynamic> toMap() => {
    'userId': userId,
    'childId': childId,
    'badgeId': badgeId,
  };
}
