import '../../../core/api/api_client.dart';
import '../../../features/gamification/data/gamification_repository.dart';
import '../../../models/models.dart';
import 'path_recommendation_service.dart';

class LessonResult {
  const LessonResult({
    required this.score,
    required this.totalQuestions,
    required this.correctAnswers,
    required this.xpGained,
    required this.levelStats,
    required this.newBadges,
    required this.streak,
  });
  final int score;
  final int totalQuestions;
  final int correctAnswers;
  final int xpGained;
  final LevelStats levelStats;
  final List<Badge> newBadges;
  final Streak streak;
}

class LearningPlan {
  const LearningPlan({
    required this.lessons,
    this.path,
    this.program,
    this.recommendations = const [],
    this.usesLegacyFallback = false,
    this.pathItems = const [],
  });

  final List<Lesson> lessons;
  final LearningPath? path;
  final Program? program;
  final List<LearningPathRecommendation> recommendations;
  final bool usesLegacyFallback;
  final List<PathItem> pathItems;

  String get title => path?.title ?? 'Lộ trình mặc định';
  String get description => usesLegacyFallback
      ? 'Đang dùng danh sách bài học cũ vì chưa có lộ trình mới.'
      : (path?.description ?? 'Đi từng bước nhỏ, học vừa đủ mỗi ngày.');
}

class LessonRepository {
  LessonRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;
  final ApiClient _api;

  Future<List<Lesson>> listLessons(String userId, String childId) async {
    final plan = await currentLearningPlan(userId, childId);
    return plan.lessons;
  }

  Future<List<Program>> programs() async {
    final data = await _api.get('/api/programs') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return Program.fromMap('${map['id']}', map);
    }).toList();
  }

  Future<List<LearningPath>> learningPaths() async {
    final data = await _api.get('/api/learning-paths') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return LearningPath.fromMap('${map['id']}', map);
    }).toList();
  }

  Future<Map<LearningGoalKey, List<String>>> goalSkillTags() async {
    final data = await _api.get('/api/learning-goals/skill-tags');
    if (data is! Map) return const {};
    return data.map((key, value) {
      final goal = learningGoalFromString(key);
      return MapEntry(goal, readStringList(value));
    });
  }

  Future<LearningPlan> currentLearningPlan(
    String userId,
    String childId,
  ) async {
    final data =
        await _api.get('/api/children/$childId/learning-plan')
            as Map<String, dynamic>;
    return _planFromMap(data);
  }

  Future<LearningPlan> currentLearningPlanForChild(ChildProfile child) =>
      currentLearningPlan(child.userId, child.id);

  Future<Lesson> lessonForChild(
    String userId,
    ChildProfile child,
    String lessonId,
  ) async {
    final data =
        await _api.get('/api/lessons/$lessonId') as Map<String, dynamic>;
    return _lessonFromMap(data);
  }

  Future<List<Activity>> activitiesForLesson(Lesson lesson) async {
    final data = await _api.get('/api/lessons/${lesson.id}/activities') as List;
    final activities = data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return Activity.fromMap('${map['id']}', map);
    }).toList();
    if (activities.isNotEmpty) return activities;

    switch (lesson.type) {
      case LessonType.flashcard:
        return (await flashcards(lesson.id))
            .map(
              (item) => ActivityAdapters.fromFlashcard(
                item,
                skillTags: lesson.skillTags,
              ),
            )
            .toList();
      case LessonType.math:
      case LessonType.thinking:
      case LessonType.spelling:
      case LessonType.rhyme:
        return (await mathQuestions(lesson.id))
            .map(
              (item) => ActivityAdapters.fromMathQuestion(
                item,
                skillTags: lesson.skillTags,
              ),
            )
            .toList();
    }
  }

  Future<List<UserProgress>> progress(String userId, String childId) async {
    final data = await _api.get('/api/children/$childId/progress') as List;
    return data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return UserProgress.fromMap('${map['id']}', map);
    }).toList();
  }

  Future<Map<String, dynamic>> childSummary(String childId) async {
    final data = await _api.get('/api/children/$childId/summary');
    return Map<String, dynamic>.from(data as Map);
  }

  Future<List<MathQuestion>> mathQuestions(String lessonId) async {
    final data =
        await _api.get('/api/lessons/$lessonId/math-questions') as List;
    final items = data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return MathQuestion.fromMap('${map['id']}', map);
    }).toList();
    items.sort((a, b) => a.questionText.compareTo(b.questionText));
    return items;
  }

  Future<List<Flashcard>> flashcards(String lessonId) async {
    final data = await _api.get('/api/lessons/$lessonId/flashcards') as List;
    final items = data.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return Flashcard.fromMap('${map['id']}', map);
    }).toList();
    items.sort((a, b) => a.frontText.compareTo(b.frontText));
    return items;
  }

  Future<void> submitActivityAttempt({
    required String childId,
    required String lessonId,
    required String activityId,
    required String activityType,
    required String result,
    required double score,
    required Map<String, dynamic> answerPayload,
    required List<String> skillTags,
    required int durationSec,
  }) async {
    await _api.post('/api/children/$childId/lessons/$lessonId/attempts', {
      'activityId': activityId,
      'activityType': activityType,
      'result': result,
      'score': score,
      'answerPayload': answerPayload,
      'skillTags': skillTags,
      'durationSec': durationSec,
    });
  }

  Future<Map<String, dynamic>> submitVoiceAnswer({
    required String childId,
    required String lessonId,
    required String activityId,
    String? audioBase64,
    required int durationSec,
    String? mockTranscript,
  }) async {
    final data = await _api.post('/api/voice/answer', {
      'childId': childId,
      'lessonId': lessonId,
      'activityId': activityId,
      'audioBase64': audioBase64,
      'durationSec': durationSec,
      if (mockTranscript != null) 'mockTranscript': mockTranscript,
    });
    return Map<String, dynamic>.from(data as Map);
  }

  Future<LessonResult> submitChoiceLesson({
    required String userId,
    required String childId,
    required Lesson lesson,
    required List<MathQuestion> items,
    required Map<String, String> answers,
  }) async {
    final data = await _api.post(
      '/api/children/$childId/lessons/${lesson.id}/complete',
      {'answers': answers, 'completionType': lessonTypeToString(lesson.type)},
    );
    return _lessonResultFromMap(Map<String, dynamic>.from(data as Map));
  }

  Future<LessonResult> submitFlashcardComplete(
    String userId,
    String childId,
    Lesson lesson,
  ) async {
    final data = await _api.post(
      '/api/children/$childId/lessons/${lesson.id}/complete',
      {'completionType': 'FLASHCARD'},
    );
    return _lessonResultFromMap(Map<String, dynamic>.from(data as Map));
  }

  Future<LessonResult> submitActivityLessonComplete({
    required String childId,
    required String lessonId,
    required int correctAnswers,
    required int score,
    required Map<String, String> answers,
  }) async {
    final data = await _api
        .post('/api/children/$childId/lessons/$lessonId/complete', {
          'completionType': 'ACTIVITY',
          'correctAnswers': correctAnswers,
          'score': score,
          'answers': answers,
        });
    return _lessonResultFromMap(Map<String, dynamic>.from(data as Map));
  }

  LearningPlan _planFromMap(Map<String, dynamic> data) {
    final lessons = (data['lessons'] as List? ?? const []).map((item) {
      return _lessonFromMap(Map<String, dynamic>.from(item as Map));
    }).toList();
    final pathMap = data['path'] == null
        ? null
        : Map<String, dynamic>.from(data['path'] as Map);
    final programMap = data['program'] == null
        ? null
        : Map<String, dynamic>.from(data['program'] as Map);
    final pathItems = (data['pathItems'] as List? ?? const []).map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return PathItem.fromMap('${map['id']}', map);
    }).toList();
    return LearningPlan(
      lessons: lessons,
      path: pathMap == null
          ? null
          : LearningPath.fromMap('${pathMap['id']}', pathMap),
      program: programMap == null
          ? null
          : Program.fromMap('${programMap['id']}', programMap),
      recommendations: const [],
      usesLegacyFallback: data['usesLegacyFallback'] == true,
      pathItems: pathItems,
    );
  }

  Lesson _lessonFromMap(Map<String, dynamic> data) {
    final npcMap = data['npc'] == null
        ? null
        : Map<String, dynamic>.from(data['npc'] as Map);
    return Lesson.fromMap(
      '${data['id']}',
      data,
      npc: npcMap == null ? null : NPC.fromMap('${npcMap['id']}', npcMap),
    );
  }

  LessonResult _lessonResultFromMap(Map<String, dynamic> data) {
    final levelMap = Map<String, dynamic>.from(data['levelStats'] as Map);
    final streakMap = Map<String, dynamic>.from(data['streak'] as Map);
    final badges = (data['newBadges'] as List? ?? const []).map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return Badge.fromMap('${map['id']}', map, isEarned: true);
    }).toList();

    return LessonResult(
      score: (data['score'] as num?)?.toInt() ?? 0,
      totalQuestions: (data['totalQuestions'] as num?)?.toInt() ?? 0,
      correctAnswers: (data['correctAnswers'] as num?)?.toInt() ?? 0,
      xpGained: (data['xpGained'] as num?)?.toInt() ?? 0,
      levelStats: LevelStats(
        (levelMap['totalXp'] as num?)?.toInt() ?? 0,
        (levelMap['level'] as num?)?.toInt() ?? 1,
        (levelMap['xpInLevel'] as num?)?.toInt() ?? 0,
        (levelMap['xpToNextLevel'] as num?)?.toInt() ?? 100,
      ),
      newBadges: badges,
      streak: Streak.fromMap('${streakMap['id']}', streakMap),
    );
  }
}
