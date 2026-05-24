import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../models/child_profile.dart';
import '../../../models/domain.dart';

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
    String note, {
    DevelopmentCategoryKey primaryDifficulty = DevelopmentCategoryKey.other,
    List<LearningGoalKey> learningGoals = const [],
    SupportLevel supportLevel = SupportLevel.medium,
    int dailyDurationMinutes = 5,
    CoLearningMode coLearningMode = CoLearningMode.parentChildTogether,
  }) async {
    final payload = {
      'userId': userId,
      'displayName': name.trim(),
      'name': name.trim(),
      'age': age,
      'gender': gender,
      'note': note.trim(),
      'primaryDifficulty': primaryDifficulty.firestoreValue,
      'secondaryDifficulties': <String>[],
      'learningGoals': learningGoals
          .map((item) => item.firestoreValue)
          .toList(),
      'supportLevel': supportLevel.firestoreValue,
      'dailyDurationMinutes': dailyDurationMinutes,
      'coLearningMode': coLearningMode.firestoreValue,
      'interests': <String>[],
      'accessibilityPreferences': <String, dynamic>{},
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

  Future<void> saveCurrentPath(String childId, String programId, String pathId) async {
    await _db.collection('children').doc(childId).update({
      'currentProgramId': programId,
      'currentPathId': pathId,
      'selectedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
