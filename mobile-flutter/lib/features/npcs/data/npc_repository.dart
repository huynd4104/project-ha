import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/models.dart';

class UnlockedNpcView {
  const UnlockedNpcView(this.unlock, this.npc);
  final UserUnlockedNpc unlock;
  final NPC npc;
}

class NpcRepository {
  NpcRepository({FirebaseFirestore? db})
    : _db = db ?? FirebaseFirestore.instance;
  final FirebaseFirestore _db;

  Future<List<NPC>> allActive() async {
    final snap = await _db
        .collection('npcs')
        .where('isActive', isEqualTo: true)
        .get();
    return snap.docs.map((doc) => NPC.fromMap(doc.id, doc.data())).toList();
  }

  Future<List<UnlockedNpcView>> collection(
    String userId,
    String childId,
  ) async {
    final snap = await _db
        .collection('userUnlockedNpcs')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .get();
    final items = <UnlockedNpcView>[];
    for (final doc in snap.docs) {
      final unlock = UserUnlockedNpc.fromMap(doc.id, doc.data());
      final npcDoc = await _db.collection('npcs').doc(unlock.npcId).get();
      if (npcDoc.exists)
        items.add(
          UnlockedNpcView(unlock, NPC.fromMap(npcDoc.id, npcDoc.data()!)),
        );
    }
    return items;
  }

  Future<NPC?> byId(String id) async {
    final doc = await _db.collection('npcs').doc(id).get();
    return doc.exists ? NPC.fromMap(doc.id, doc.data()!) : null;
  }
}
