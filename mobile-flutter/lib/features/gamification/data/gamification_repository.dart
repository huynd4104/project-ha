import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../core/utils/date_utils.dart';
import '../../../models/models.dart';

class LevelStats {
  const LevelStats(
    this.totalXp,
    this.level,
    this.xpInLevel,
    this.xpToNextLevel,
  );
  final int totalXp;
  final int level;
  final int xpInLevel;
  final int xpToNextLevel;
}

class MissionWithProgress {
  const MissionWithProgress(this.mission, this.progress);
  final DailyMission mission;
  final UserMissionProgress progress;
}

class GamificationRepository {
  GamificationRepository({FirebaseFirestore? db})
    : _db = db ?? FirebaseFirestore.instance;
  final FirebaseFirestore _db;

  LevelStats calculateLevel(int totalXp) =>
      LevelStats(totalXp, (totalXp / 100).floor() + 1, totalXp % 100, 100);

  Future<int> totalXp(String userId, String childId) async {
    final snap = await _db
        .collection('xpLogs')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .get();
    return snap.docs.fold<int>(
      0,
      (total, item) => total + ((item.data()['amount'] as num?)?.toInt() ?? 0),
    );
  }

  Future<Streak?> getStreak(String userId, String childId) async {
    final snap = await _db
        .collection('streaks')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .limit(1)
        .get();
    return snap.docs.isEmpty
        ? null
        : Streak.fromMap(snap.docs.first.id, snap.docs.first.data());
  }

  Future<int> awardXp(
    String userId,
    String childId,
    int amount,
    String reason,
  ) async {
    if (amount <= 0) return 0;
    await _db.collection('xpLogs').add({
      'userId': userId,
      'childId': childId,
      'amount': amount,
      'reason': reason,
      'createdAt': FieldValue.serverTimestamp(),
    });
    return amount;
  }

  Future<Streak> updateStreak(String userId, String childId) async {
    final today = todayKey();
    final yesterday = yesterdayKey();
    final snap = await _db
        .collection('streaks')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) {
      final ref = await _db.collection('streaks').add({
        'userId': userId,
        'childId': childId,
        'currentStreak': 1,
        'longestStreak': 1,
        'lastActiveDate': today,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return Streak(
        id: ref.id,
        userId: userId,
        childId: childId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      );
    }
    final doc = snap.docs.first;
    final current = Streak.fromMap(doc.id, doc.data());
    if (current.lastActiveDate == today) return current;
    final next = current.lastActiveDate == yesterday
        ? current.currentStreak + 1
        : 1;
    final longest = next > current.longestStreak ? next : current.longestStreak;
    await doc.reference.set({
      'currentStreak': next,
      'longestStreak': longest,
      'lastActiveDate': today,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    return Streak(
      id: doc.id,
      userId: userId,
      childId: childId,
      currentStreak: next,
      longestStreak: longest,
      lastActiveDate: today,
    );
  }

  Future<void> updateDailyMissionProgress(
    String userId,
    String childId,
    String type, [
    int increment = 1,
  ]) async {
    final missions = await _db
        .collection('dailyMissions')
        .where('isActive', isEqualTo: true)
        .where('type', isEqualTo: type)
        .get();
    final futures = missions.docs.map((missionDoc) async {
      final mission = DailyMission.fromMap(missionDoc.id, missionDoc.data());
      final progressSnap = await _db
          .collection('userMissionProgress')
          .where('userId', isEqualTo: userId)
          .where('childId', isEqualTo: childId)
          .where('missionId', isEqualTo: mission.id)
          .where('date', isEqualTo: todayKey())
          .limit(1)
          .get();
      final existing = progressSnap.docs.isEmpty
          ? null
          : UserMissionProgress.fromMap(
              progressSnap.docs.first.id,
              progressSnap.docs.first.data(),
            );
      final currentValue = (existing?.currentValue ?? 0) + increment;
      final isCompleted =
          (existing?.isCompleted ?? false) ||
          currentValue >= mission.targetValue;
      final payload = {
        'userId': userId,
        'childId': childId,
        'missionId': mission.id,
        'date': todayKey(),
        'currentValue': currentValue,
        'targetValue': mission.targetValue,
        'isCompleted': isCompleted,
        'rewardClaimed': existing?.rewardClaimed ?? false,
        'completedAt': isCompleted ? FieldValue.serverTimestamp() : null,
        'updatedAt': FieldValue.serverTimestamp(),
      };
      if (existing == null) {
        await _db.collection('userMissionProgress').add(payload);
      } else {
        await _db
            .collection('userMissionProgress')
            .doc(existing.id)
            .set(payload, SetOptions(merge: true));
      }
    });
    await Future.wait(futures);
  }

  Future<List<Badge>> checkAndAwardBadges(String userId, String childId) async {
    final results = await Future.wait([
      _db.collection('badges').where('isActive', isEqualTo: true).get(),
      _db
          .collection('userBadges')
          .where('userId', isEqualTo: userId)
          .where('childId', isEqualTo: childId)
          .get(),
      _db
          .collection('progress')
          .where('userId', isEqualTo: userId)
          .where('childId', isEqualTo: childId)
          .where('status', isEqualTo: 'COMPLETED')
          .get(),
      _db
          .collection('streaks')
          .where('userId', isEqualTo: userId)
          .where('childId', isEqualTo: childId)
          .limit(1)
          .get(),
      _db
          .collection('userUnlockedNpcs')
          .where('userId', isEqualTo: userId)
          .where('childId', isEqualTo: childId)
          .get(),
      _db
          .collection('userMissionProgress')
          .where('userId', isEqualTo: userId)
          .where('childId', isEqualTo: childId)
          .where('isCompleted', isEqualTo: true)
          .get(),
      totalXp(userId, childId),
    ]);

    final badgesSnap = results[0] as QuerySnapshot<Map<String, dynamic>>;
    final earnedSnap = results[1] as QuerySnapshot<Map<String, dynamic>>;
    final progressSnap = results[2] as QuerySnapshot<Map<String, dynamic>>;
    final streakSnap = results[3] as QuerySnapshot<Map<String, dynamic>>;
    final unlockSnap = results[4] as QuerySnapshot<Map<String, dynamic>>;
    final missionSnap = results[5] as QuerySnapshot<Map<String, dynamic>>;
    final xp = results[6] as int;

    final earnedIds = earnedSnap.docs.map((e) => e.data()['badgeId']).toSet();
    final streak =
        streakSnap.docs.isEmpty
            ? 0
            : Streak.fromMap(
              streakSnap.docs.first.id,
              streakSnap.docs.first.data(),
            ).currentStreak;

    final earned = <Badge>[];
    final writeFutures = <Future>[];

    for (final doc in badgesSnap.docs) {
      if (earnedIds.contains(doc.id)) continue;
      final badge = Badge.fromMap(doc.id, doc.data());
      final ok = switch (badge.conditionType) {
        'COMPLETE_LESSONS' =>
          progressSnap.docs.map((e) => e.data()['lessonId']).toSet().length >=
              badge.conditionValue,
        'STREAK_DAYS' => streak >= badge.conditionValue,
        'TOTAL_XP' => xp >= badge.conditionValue,
        'UNLOCK_NPCS' => unlockSnap.size >= badge.conditionValue,
        'COMPLETE_DAILY_MISSIONS' => missionSnap.size >= badge.conditionValue,
        _ => false,
      };
      if (ok) {
        final f = _db.collection('userBadges').add({
          'userId': userId,
          'childId': childId,
          'badgeId': badge.id,
          'earnedAt': FieldValue.serverTimestamp(),
        });
        writeFutures.add(f);
        earned.add(badge.copyWith(isEarned: true));
      }
    }
    if (writeFutures.isNotEmpty) {
      await Future.wait(writeFutures);
    }
    return earned;
  }

  Future<List<MissionWithProgress>> dailyMissions(
    String userId,
    String childId,
  ) async {
    final missionsSnap = await _db
        .collection('dailyMissions')
        .where('isActive', isEqualTo: true)
        .get();
    final progressSnap = await _db
        .collection('userMissionProgress')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .where('date', isEqualTo: todayKey())
        .get();
    final progressByMission = {
      for (final doc in progressSnap.docs)
        doc.data()['missionId']: UserMissionProgress.fromMap(
          doc.id,
          doc.data(),
        ),
    };
    return missionsSnap.docs.map((doc) {
      final mission = DailyMission.fromMap(doc.id, doc.data());
      return MissionWithProgress(
        mission,
        progressByMission[mission.id] ??
            UserMissionProgress(
              id: '',
              userId: userId,
              childId: childId,
              missionId: mission.id,
              date: todayKey(),
              targetValue: mission.targetValue,
            ),
      );
    }).toList();
  }

  Future<int> claimMissionReward(
    String userId,
    String childId,
    MissionWithProgress item,
  ) async {
    if (!item.progress.isCompleted)
      throw Exception('Nhiệm vụ chưa hoàn thành.');
    if (item.progress.rewardClaimed)
      throw Exception('Phần thưởng đã được nhận.');
    await _db.collection('userMissionProgress').doc(item.progress.id).set({
      'rewardClaimed': true,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
    return awardXp(
      userId,
      childId,
      item.mission.rewardXp,
      'Nhận thưởng nhiệm vụ hàng ngày: "${item.mission.title}"',
    );
  }
}
