import '../../../core/api/api_client.dart';
import '../../../models/child_profile.dart';
import '../../../models/domain.dart';

class ChildRepository {
  ChildRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;
  final ApiClient _api;

  Future<List<ChildProfile>> list([String? userId]) async {
    final data = await _api.get('/api/children') as List;
    return data
        .map((item) {
          final map = Map<String, dynamic>.from(item as Map);
          return ChildProfile.fromMap('${map['id']}', map);
        })
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
    final data = await _api.post('/api/children', {
      'displayName': name.trim(),
      'name': name.trim(),
      'age': age,
      'gender': gender,
      'note': note.trim(),
      'primaryDifficulty': primaryDifficulty.apiValue,
      'secondaryDifficulties': <String>[],
      'learningGoals': learningGoals.map((item) => item.apiValue).toList(),
      'supportLevel': supportLevel.apiValue,
      'dailyDurationMinutes': dailyDurationMinutes,
      'coLearningMode': coLearningMode.apiValue,
      'interests': <String>[],
      'accessibilityPreferences': <String, dynamic>{},
    }) as Map<String, dynamic>;
    return ChildProfile.fromMap('${data['id']}', data);
  }

  Future<void> update(ChildProfile child) async {
    await _api.put('/api/children/${child.id}', child.toMap());
  }

  Future<void> saveCurrentPath(
    String childId,
    String programId,
    String pathId,
  ) async {
    await _api.put('/api/children/$childId/current-path', {
      'programId': programId,
      'pathId': pathId,
    });
  }
}
