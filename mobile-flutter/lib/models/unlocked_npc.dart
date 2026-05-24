class UserUnlockedNpc {
  const UserUnlockedNpc({
    required this.id,
    required this.userId,
    required this.childId,
    required this.npcId,
    this.qrCodeId,
  });
  final String id;
  final String userId;
  final String childId;
  final String npcId;
  final String? qrCodeId;

  factory UserUnlockedNpc.fromMap(String id, Map<String, dynamic> map) =>
      UserUnlockedNpc(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        npcId: '${map['npcId'] ?? ''}',
        qrCodeId: map['qrCodeId']?.toString(),
      );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'childId': childId,
    'npcId': npcId,
    'qrCodeId': qrCodeId,
  };
}
