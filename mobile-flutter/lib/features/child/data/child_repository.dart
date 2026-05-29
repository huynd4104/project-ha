import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../../../core/api/api_client.dart';
import '../../../models/models.dart';

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
    String? avatarUrl,
    String? avatarObjectKey,
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
      'avatarUrl': avatarUrl ?? '',
      'avatarObjectKey': avatarObjectKey ?? '',
    }) as Map<String, dynamic>;
    return ChildProfile.fromMap('${data['id']}', data);
  }

  Future<void> update(ChildProfile child) async {
    await _api.put('/api/children/${child.id}', child.toMap());
  }

  Future<Map<String, dynamic>> uploadAvatar(
    String childId,
    List<int> fileBytes,
    String fileName,
  ) async {
    final uri = Uri.parse('${_api.baseUrl}/api/children/$childId/avatar');
    final request = http.MultipartRequest('POST', uri);

    final session = _api.session;
    if (session?.accessToken.isNotEmpty == true) {
      request.headers['Authorization'] = 'Bearer ${session!.accessToken}';
    }

    final contentType = fileName.endsWith('.png')
        ? 'image/png'
        : fileName.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg';

    final multipartFile = http.MultipartFile.fromBytes(
      'file',
      fileBytes,
      filename: fileName,
      contentType: MediaType.parse(contentType),
    );

    request.files.add(multipartFile);

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      String errMsg = 'Tải ảnh thất bại: ${response.statusCode}';
      try {
        final bodyJson = jsonDecode(response.body);
        if (bodyJson is Map && bodyJson['message'] != null) {
          errMsg = bodyJson['message'];
        }
      } catch (_) {}
      throw Exception(errMsg);
    }

    return jsonDecode(response.body) as Map<String, dynamic>;
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

  Future<ChildDevelopmentProfile> getDevelopmentProfile(String childId) async {
    final data = await _api.get('/api/children/$childId/development-profile')
        as Map<String, dynamic>;
    return ChildDevelopmentProfile.fromMap(data);
  }

  Future<ChildDevelopmentProfile> updateDevelopmentProfile(
    String childId,
    Map<String, dynamic> payload,
  ) async {
    final data = await _api.put(
      '/api/children/$childId/development-profile',
      payload,
    ) as Map<String, dynamic>;
    return ChildDevelopmentProfile.fromMap(data);
  }
}
