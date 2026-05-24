import 'model_helpers.dart';

class XPLog {
  const XPLog({
    required this.id,
    required this.userId,
    required this.childId,
    required this.amount,
    required this.reason,
    this.createdAt,
  });
  final String id;
  final String userId;
  final String childId;
  final int amount;
  final String reason;
  final DateTime? createdAt;

  factory XPLog.fromMap(String id, Map<String, dynamic> map) => XPLog(
    id: id,
    userId: '${map['userId'] ?? ''}',
    childId: '${map['childId'] ?? ''}',
    amount: readInt(map['amount']),
    reason: '${map['reason'] ?? ''}',
    createdAt: readDate(map['createdAt']),
  );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'childId': childId,
    'amount': amount,
    'reason': reason,
  };
}
