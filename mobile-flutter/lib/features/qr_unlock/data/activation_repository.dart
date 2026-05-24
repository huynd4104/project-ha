import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../features/gamification/data/gamification_repository.dart';
import '../../../models/models.dart';

class UnlockResult {
  const UnlockResult({
    required this.npc,
    required this.message,
    required this.xpGained,
    required this.levelStats,
    required this.newBadges,
    this.streak,
  });
  final NPC npc;
  final String message;
  final int xpGained;
  final LevelStats? levelStats;
  final List<Badge> newBadges;
  final Streak? streak;
}

class ActivationRepository {
  ActivationRepository({
    FirebaseFirestore? db,
    GamificationRepository? gamification,
  }) : _db = db ?? FirebaseFirestore.instance,
       _gamification = gamification ?? GamificationRepository();
  final FirebaseFirestore _db;
  final GamificationRepository _gamification;

  Future<UnlockResult> unlockByCode(
    String code,
    String userId,
    String childId,
  ) async {
    final qrSnap = await _db
        .collection('qrCodes')
        .where('code', isEqualTo: code.trim())
        .limit(1)
        .get();
    if (qrSnap.docs.isEmpty)
      throw Exception(
        'Mã QR không tồn tại. Vui lòng kiểm tra lại mã in trên sản phẩm.',
      );
    final qrDoc = qrSnap.docs.first;
    final qr = QRCodeModel.fromMap(qrDoc.id, qrDoc.data());

    final transactionResult = await _db.runTransaction<String>((
      transaction,
    ) async {
      final freshQr = await transaction.get(qrDoc.reference);
      final data = freshQr.data();
      if (data == null) throw Exception('Mã QR không hợp lệ.');
      final fresh = QRCodeModel.fromMap(freshQr.id, data);
      if (!fresh.isActive)
        throw Exception('Mã QR này hiện đang tạm dừng hoạt động.');
      if (fresh.maxUses != null && fresh.usedCount >= fresh.maxUses!)
        throw Exception('Mã QR này đã đạt giới hạn lượt sử dụng tối đa.');
      final npcRef = _db.collection('npcs').doc(fresh.npcId);
      final npcDoc = await transaction.get(npcRef);
      if (!npcDoc.exists)
        throw Exception('Nhân vật Mascot liên kết với mã này không tồn tại.');
      if (npcDoc.data()?['isActive'] == false)
        throw Exception('Nhân vật Mascot liên kết với mã này hiện đã bị khóa.');
      final unlockRef = _db
          .collection('userUnlockedNpcs')
          .doc('${userId}_${childId}_${fresh.npcId}');
      if ((await transaction.get(unlockRef)).exists) return 'existing';
      transaction.set(unlockRef, {
        'userId': userId,
        'childId': childId,
        'npcId': fresh.npcId,
        'qrCodeId': fresh.id,
        'unlockedAt': FieldValue.serverTimestamp(),
      });
      transaction.update(qrDoc.reference, {
        'usedCount': FieldValue.increment(1),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return 'created';
    });

    final npcDoc = await _db.collection('npcs').doc(qr.npcId).get();
    final npc = NPC.fromMap(npcDoc.id, npcDoc.data()!);
    if (transactionResult == 'existing') {
      return UnlockResult(
        npc: npc,
        message: 'Mascot này đã có sẵn trong bộ sưu tập của bé!',
        xpGained: 0,
        levelStats: null,
        newBadges: const [],
      );
    }
    final xp = await _gamification.awardXp(
      userId,
      childId,
      10,
      'Mở khóa Mascot: ${npc.name}',
    );
    final streak = await _gamification.updateStreak(userId, childId);
    await _gamification.updateDailyMissionProgress(userId, childId, 'SCAN_QR');
    final badges = await _gamification.checkAndAwardBadges(userId, childId);
    final totalXp = await _gamification.totalXp(userId, childId);
    return UnlockResult(
      npc: npc,
      message: 'Mở khóa Mascot thành công!',
      xpGained: xp,
      levelStats: _gamification.calculateLevel(totalXp),
      newBadges: badges,
      streak: streak,
    );
  }
}
