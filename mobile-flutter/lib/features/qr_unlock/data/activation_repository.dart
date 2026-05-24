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

    final transactionResult = await _db.runTransaction<Map<String, dynamic>>((
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

      final npcData = npcDoc.data()!;
      npcData['id'] = npcDoc.id;

      final unlockRef = _db
          .collection('userUnlockedNpcs')
          .doc('${userId}_${childId}_${fresh.npcId}');
      final unlockedDoc = await transaction.get(unlockRef);
      if (unlockedDoc.exists) {
        return {
          'status': 'existing',
          'npc': npcData,
        };
      }
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
      return {
        'status': 'created',
        'npc': npcData,
      };
    });

    final npcMap = transactionResult['npc'] as Map<String, dynamic>;
    final npcId = npcMap['id'] as String;
    final npc = NPC.fromMap(npcId, npcMap);
    final status = transactionResult['status'] as String;

    if (status == 'existing') {
      return UnlockResult(
        npc: npc,
        message: 'Mascot này đã có sẵn trong bộ sưu tập của bé!',
        xpGained: 0,
        levelStats: null,
        newBadges: const [],
      );
    }

    // Run gamification updates in parallel
    final gamificationResults = await Future.wait([
      _gamification.awardXp(
        userId,
        childId,
        10,
        'Mở khóa Mascot: ${npc.name}',
      ),
      _gamification.updateStreak(userId, childId),
      _gamification.updateDailyMissionProgress(userId, childId, 'SCAN_QR'),
    ]);

    final xp = gamificationResults[0] as int;
    final streak = gamificationResults[1] as Streak;

    // Run badge checks and total XP concurrently after writes
    final badgeAndXpResults = await Future.wait([
      _gamification.checkAndAwardBadges(userId, childId),
      _gamification.totalXp(userId, childId),
    ]);

    final badges = badgeAndXpResults[0] as List<Badge>;
    final totalXp = badgeAndXpResults[1] as int;

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
