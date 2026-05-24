import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/child_profile.dart';

class ChildRepository {
  ChildRepository({FirebaseFirestore? db})
    : _db = db ?? FirebaseFirestore.instance;
  final FirebaseFirestore _db;

  Future<List<ChildProfile>> list(String userId) async {
    final snap = await _db
        .collection('children')
        .where('userId', isEqualTo: userId)
        .get();
    return snap.docs
        .map((doc) => ChildProfile.fromMap(doc.id, doc.data()))
        .toList();
  }

  Future<ChildProfile> create(
    String userId,
    String name,
    int age,
    String gender,
    String note,
  ) async {
    final payload = {
      'userId': userId,
      'name': name.trim(),
      'age': age,
      'gender': gender,
      'note': note.trim(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
    final ref = await _db.collection('children').add(payload);
    return ChildProfile.fromMap(ref.id, payload);
  }

  Future<void> update(ChildProfile child) async {
    await _db.collection('children').doc(child.id).set({
      ...child.toMap(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }
}
