import '../../../core/api/api_client.dart';
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
  ActivationRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;
  final ApiClient _api;

  Future<UnlockResult> unlockByCode(
    String code,
    String userId,
    String childId, {
    String source = 'MANUAL',
  }) async {
    final data = await _api.post('/api/activation/redeem', {
      'code': code.trim(),
      'childId': childId,
      'source': source,
    }) as Map<String, dynamic>;
    final npcMap = Map<String, dynamic>.from(data['npc'] as Map);
    final npc = NPC.fromMap('${npcMap['id']}', npcMap);
    final levelMap = data['levelStats'] == null
        ? null
        : Map<String, dynamic>.from(data['levelStats'] as Map);
    final streakMap = data['streak'] == null
        ? null
        : Map<String, dynamic>.from(data['streak'] as Map);
    final badgeItems = (data['newBadges'] as List? ?? const []).map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return Badge.fromMap('${map['id']}', map, isEarned: true);
    }).toList();

    return UnlockResult(
      npc: npc,
      message: '${data['message'] ?? 'Mở khóa Mascot thành công!'}',
      xpGained: (data['xpGained'] as num?)?.toInt() ?? 0,
      levelStats: levelMap == null
          ? null
          : LevelStats(
              (levelMap['totalXp'] as num?)?.toInt() ?? 0,
              (levelMap['level'] as num?)?.toInt() ?? 1,
              (levelMap['xpInLevel'] as num?)?.toInt() ?? 0,
              (levelMap['xpToNextLevel'] as num?)?.toInt() ?? 100,
            ),
      newBadges: badgeItems,
      streak: streakMap == null
          ? null
          : Streak.fromMap('${streakMap['id']}', streakMap),
    );
  }
}
