import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

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
  GamificationRepository({FirebaseFirestore? db, FirebaseFunctions? functions})
    : _db = db ?? FirebaseFirestore.instance,
      _functions =
          functions ?? FirebaseFunctions.instanceFor(region: 'asia-southeast1');
  final FirebaseFirestore _db;
  final FirebaseFunctions _functions;

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
    final response = await _functions
        .httpsCallable('claimDailyMissionReward')
        .call({'childId': childId, 'missionId': item.mission.id});
    final data = Map<String, dynamic>.from(response.data as Map);
    return (data['xpGained'] as num?)?.toInt() ?? item.mission.rewardXp;
  }
}
