import '../../../core/api/api_client.dart';
import '../../../models/models.dart';

class UnlockedNpcView {
  const UnlockedNpcView(this.unlock, this.npc);
  final UserUnlockedNpc unlock;
  final NPC npc;
}

class NpcRepository {
  NpcRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;
  final ApiClient _api;

  Future<List<NPC>> allActive() async {
    final data = await _api.get('/api/npcs') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return NPC.fromMap('${map['id']}', map);
    }).toList();
  }

  Future<List<UnlockedNpcView>> collection(
    String userId,
    String childId,
  ) async {
    final data = await _api.get('/api/children/$childId/npcs/unlocked') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      final npcMap = Map<String, dynamic>.from(map['npc'] as Map);
      return UnlockedNpcView(
        UserUnlockedNpc.fromMap('${map['id']}', map),
        NPC.fromMap('${npcMap['id']}', npcMap),
      );
    }).toList();
  }

  Future<NPC?> byId(String id) async {
    final data = await _api.get('/api/npcs/$id') as Map<String, dynamic>;
    return NPC.fromMap('${data['id']}', data);
  }
}
