import 'model_helpers.dart';

class QRCodeModel {
  const QRCodeModel({
    required this.id,
    required this.code,
    required this.npcId,
    this.label = '',
    this.isActive = true,
    this.maxUses,
    this.usedCount = 0,
  });

  final String id;
  final String code;
  final String npcId;
  final String label;
  final bool isActive;
  final int? maxUses;
  final int usedCount;

  factory QRCodeModel.fromMap(String id, Map<String, dynamic> map) =>
      QRCodeModel(
        id: id,
        code: '${map['code'] ?? ''}',
        npcId: '${map['npcId'] ?? ''}',
        label: '${map['label'] ?? ''}',
        isActive: map['isActive'] != false,
        maxUses: map['maxUses'] == null ? null : readInt(map['maxUses']),
        usedCount: readInt(map['usedCount']),
      );

  Map<String, dynamic> toMap() => {
    'code': code,
    'npcId': npcId,
    'label': label,
    'isActive': isActive,
    'maxUses': maxUses,
    'usedCount': usedCount,
  };
}
