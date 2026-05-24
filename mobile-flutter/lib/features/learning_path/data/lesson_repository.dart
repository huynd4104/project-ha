import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

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
  LessonRepository({FirebaseFirestore? db, FirebaseFunctions? functions})
    : _db = db ?? FirebaseFirestore.instance,
      _functions =
          functions ?? FirebaseFunctions.instanceFor(region: 'asia-southeast1');
  final FirebaseFirestore _db;
  final FirebaseFunctions _functions;

  Future<List<Lesson>> listLessons(String userId, String childId) async {
    final plan = await currentLearningPlan(userId, childId);
    return plan.lessons;
  }

  Future<LearningPlan> currentLearningPlan(
    String userId,
    String childId,
  ) async {
    final childDoc = await _db.collection('children').doc(childId).get();
    final child = childDoc.exists
        ? ChildProfile.fromMap(childDoc.id, childDoc.data()!)
        : ChildProfile(id: childId, userId: userId, name: '', age: 0);
    return currentLearningPlanForChild(child);
  }

  Future<LearningPlan> currentLearningPlanForChild(ChildProfile child) async {
    final programs = await _publishedPrograms();
    final paths = await _publishedPaths();

    // 1. Check if the child has selected a specific path
    if (child.currentPathId != null && child.currentPathId!.isNotEmpty) {
      LearningPath? selectedPath;
      for (final p in paths) {
        if (p.id == child.currentPathId) {
          selectedPath = p;
          break;
        }
      }
      if (selectedPath != null) {
        final program = _programForPath(programs, selectedPath);
        final data = await _lessonsAndItemsForPath(selectedPath);
        if (data.lessons.isNotEmpty) {
          return LearningPlan(
            lessons: data.lessons,
            path: selectedPath,
            program: program,
            pathItems: data.pathItems,
          );
        }
      }
    }

    // 2. Fallback to recommendation service
    if (paths.isNotEmpty) {
      final recommendations = const PathRecommendationService().recommend(
        child: child,
        programs: programs,
        paths: paths,
      );
      final candidates = recommendations.isNotEmpty
          ? recommendations
          : paths.map(
              (path) => LearningPathRecommendation(
                path: path,
                program: _programForPath(programs, path),
                score: 0,
              ),
            );
      for (final recommendation in candidates) {
        final data = await _lessonsAndItemsForPath(recommendation.path);
        if (data.lessons.isNotEmpty) {
          return LearningPlan(
            lessons: data.lessons,
            path: recommendation.path,
            program: recommendation.program,
            recommendations: recommendations.toList(),
            pathItems: data.pathItems,
          );
        }
      }
    }

    return LearningPlan(
      lessons: await _legacyActiveLessons(),
      usesLegacyFallback: true,
    );
  }

  Future<({List<Lesson> lessons, List<PathItem> pathItems})> _lessonsAndItemsForPath(LearningPath path) async {
    final itemSnap = await _db
        .collection('pathItems')
        .where('pathId', isEqualTo: path.id)
        .get();
    final items =
        itemSnap.docs
            .map((doc) => PathItem.fromMap(doc.id, doc.data()))
            .toList()
          ..sort((a, b) => a.sequence.compareTo(b.sequence));
    if (items.isEmpty) return (lessons: const <Lesson>[], pathItems: const <PathItem>[]);

    final npcSnap = await _db.collection('npcs').get();
    final npcs = {
      for (final doc in npcSnap.docs) doc.id: NPC.fromMap(doc.id, doc.data()),
    };
    final lessonDocs = await Future.wait(
      items.map((item) => _db.collection('lessons').doc(item.lessonId).get()),
    );
    final lessonsById = {
      for (final doc in lessonDocs)
        if (doc.exists) doc.id: _lessonFromDoc(doc, npcs),
    };
    final lessons = items
        .map((item) => lessonsById[item.lessonId])
        .whereType<Lesson>()
        .where((lesson) => lesson.isActive)
        .toList();
    return (lessons: lessons, pathItems: items);
  }

  Future<Lesson> lessonForChild(
    String userId,
    ChildProfile child,
    String lessonId,
  ) async {
    final plan = await currentLearningPlanForChild(child);
    for (final lesson in plan.lessons) {
      if (lesson.id == lessonId) return lesson;
    }
    final npcSnap = await _db.collection('npcs').get();
    final npcs = {
      for (final doc in npcSnap.docs) doc.id: NPC.fromMap(doc.id, doc.data()),
    };
    final doc = await _db.collection('lessons').doc(lessonId).get();
    if (!doc.exists) throw Exception('Bài học không tồn tại.');
    return _lessonFromDoc(doc, npcs);
  }

  Future<List<Activity>> activitiesForLesson(Lesson lesson) async {
    final snap = await _db
        .collection('activities')
        .where('lessonId', isEqualTo: lesson.id)
        .where('isActive', isEqualTo: true)
        .get();
    final activities =
        snap.docs.map((doc) => Activity.fromMap(doc.id, doc.data())).toList()
          ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    if (activities.isNotEmpty) return activities;

    switch (lesson.type) {
      case LessonType.dialogue:
        return (await dialogues(lesson.id))
            .map(
              (item) => ActivityAdapters.fromDialogue(
                item,
                skillTags: lesson.skillTags,
              ),
            )
            .toList();
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

  Future<List<Program>> _publishedPrograms() async {
    final snap = await _db
        .collection('programs')
        .where('status', isEqualTo: PublishStatus.published.firestoreValue)
        .get();
    return snap.docs.map((doc) => Program.fromMap(doc.id, doc.data())).toList();
  }

  Future<List<LearningPath>> _publishedPaths() async {
    final snap = await _db
        .collection('learningPaths')
        .where('status', isEqualTo: PublishStatus.published.firestoreValue)
        .get();
    final paths = snap.docs
        .map((doc) => LearningPath.fromMap(doc.id, doc.data()))
        .toList();
    paths.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return paths;
  }

  Program? _programForPath(List<Program> programs, LearningPath path) {
    for (final program in programs) {
      if (program.id == path.programId) return program;
    }
    return null;
  }

  Future<List<Lesson>> _legacyActiveLessons() async {
    final lessonsSnap = await _db
        .collection('lessons')
        .where('isActive', isEqualTo: true)
        .get();
    final npcSnap = await _db.collection('npcs').get();
    final npcs = {
      for (final doc in npcSnap.docs) doc.id: NPC.fromMap(doc.id, doc.data()),
    };
    final lessons = lessonsSnap.docs
        .map((doc) => _lessonFromDoc(doc, npcs))
        .toList();
    lessons.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return lessons;
  }

  Future<List<Lesson>> _lessonsForPath(LearningPath path) async {
    final itemSnap = await _db
        .collection('pathItems')
        .where('pathId', isEqualTo: path.id)
        .get();
    final items =
        itemSnap.docs
            .map((doc) => PathItem.fromMap(doc.id, doc.data()))
            .toList()
          ..sort((a, b) => a.sequence.compareTo(b.sequence));
    if (items.isEmpty) return const [];

    final npcSnap = await _db.collection('npcs').get();
    final npcs = {
      for (final doc in npcSnap.docs) doc.id: NPC.fromMap(doc.id, doc.data()),
    };
    final lessonDocs = await Future.wait(
      items.map((item) => _db.collection('lessons').doc(item.lessonId).get()),
    );
    final lessonsById = {
      for (final doc in lessonDocs)
        if (doc.exists) doc.id: _lessonFromDoc(doc, npcs),
    };
    return items
        .map((item) => lessonsById[item.lessonId])
        .whereType<Lesson>()
        .where((lesson) => lesson.isActive)
        .toList();
  }

  Lesson _lessonFromDoc(
    DocumentSnapshot<Map<String, dynamic>> doc,
    Map<String, NPC> npcs,
  ) {
    final data = doc.data() ?? const {};
    return Lesson.fromMap(
      doc.id,
      data,
      npc: data['npcId'] == null ? null : npcs[data['npcId']],
    );
  }

  Future<List<UserProgress>> progress(String userId, String childId) async {
    final snap = await _db
        .collection('progress')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .get();
    return snap.docs
        .map((doc) => UserProgress.fromMap(doc.id, doc.data()))
        .toList();
  }

  Future<List<MathQuestion>> mathQuestions(String lessonId) async {
    final snap = await _db
        .collection('mathQuestions')
        .where('lessonId', isEqualTo: lessonId)
        .get();
    final items = snap.docs
        .map((doc) => MathQuestion.fromMap(doc.id, doc.data()))
        .toList();
    items.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return items;
  }

  Future<List<Dialogue>> dialogues(String lessonId) async {
    final snap = await _db
        .collection('dialogues')
        .where('lessonId', isEqualTo: lessonId)
        .get();
    final items = snap.docs
        .map((doc) => Dialogue.fromMap(doc.id, doc.data()))
        .toList();
    items.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return items;
  }

  Future<List<Flashcard>> flashcards(String lessonId) async {
    final snap = await _db
        .collection('flashcards')
        .where('lessonId', isEqualTo: lessonId)
        .get();
    final items = snap.docs
        .map((doc) => Flashcard.fromMap(doc.id, doc.data()))
        .toList();
    items.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return items;
  }

  Future<LessonResult> submitChoiceLesson({
    required String userId,
    required String childId,
    required Lesson lesson,
    required List<MathQuestion> items,
    required Map<String, String> answers,
  }) async {
    final response = await _functions
        .httpsCallable('submitLessonCompletion')
        .call({
          'childId': childId,
          'lessonId': lesson.id,
          'answers': answers,
          'completionType': lessonTypeToString(lesson.type),
        });
    return _lessonResultFromCallable(response.data);
  }

  Future<LessonResult> submitFlashcardComplete(
    String userId,
    String childId,
    Lesson lesson,
  ) async {
    final response = await _functions
        .httpsCallable('submitLessonCompletion')
        .call({
          'childId': childId,
          'lessonId': lesson.id,
          'completionType': 'FLASHCARD',
        });
    return _lessonResultFromCallable(response.data);
  }

  LessonResult _lessonResultFromCallable(Object? raw) {
    final data = Map<String, dynamic>.from(raw as Map);
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
