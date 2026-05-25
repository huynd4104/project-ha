import '../../../core/api/api_client.dart';
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
  GamificationRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;
  final ApiClient _api;

  LevelStats calculateLevel(int totalXp) =>
      LevelStats(totalXp, (totalXp / 100).floor() + 1, totalXp % 100, 100);

  Future<int> totalXp(String userId, String childId) async {
    final data = await _api.get('/api/children/$childId/xp') as Map<String, dynamic>;
    return (data['totalXp'] as num?)?.toInt() ?? 0;
  }

  Future<LevelStats> levelStats(String childId) async {
    final data = await _api.get('/api/children/$childId/xp') as Map<String, dynamic>;
    return LevelStats(
      (data['totalXp'] as num?)?.toInt() ?? 0,
      (data['level'] as num?)?.toInt() ?? 1,
      (data['xpInLevel'] as num?)?.toInt() ?? 0,
      (data['xpToNextLevel'] as num?)?.toInt() ?? 100,
    );
  }

  Future<Streak?> getStreak(String userId, String childId) async {
    final data = await _api.get('/api/children/$childId/streak');
    if (data == null) return null;
    final map = Map<String, dynamic>.from(data as Map);
    return Streak.fromMap('${map['id']}', map);
  }

  Future<List<MissionWithProgress>> dailyMissions(
    String userId,
    String childId,
  ) async {
    final data = await _api.get('/api/children/$childId/daily-missions') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      final missionMap = Map<String, dynamic>.from(map['mission'] as Map);
      final progressMap = Map<String, dynamic>.from(map['progress'] as Map);
      return MissionWithProgress(
        DailyMission.fromMap('${missionMap['id']}', missionMap),
        UserMissionProgress.fromMap('${progressMap['id']}', progressMap),
      );
    }).toList();
  }

  Future<List<Badge>> badges(String userId, String childId) async {
    final data = await _api.get('/api/children/$childId/badges') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return Badge.fromMap('${map['id']}', map, isEarned: map['isEarned'] == true);
    }).toList();
  }

  Future<int> claimMissionReward(
    String userId,
    String childId,
    MissionWithProgress item,
  ) async {
    if (!item.progress.isCompleted) {
      throw Exception('Nhiệm vụ chưa hoàn thành.');
    }
    if (item.progress.rewardClaimed) {
      throw Exception('Phần thưởng đã được nhận.');
    }
    final data = await _api.post(
      '/api/children/$childId/daily-missions/${item.mission.id}/claim',
    ) as Map<String, dynamic>;
    return (data['xpGained'] as num?)?.toInt() ?? item.mission.rewardXp;
  }
}
