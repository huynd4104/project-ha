import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../features/gamification/data/gamification_repository.dart';
import '../../../models/models.dart';

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

class LessonRepository {
  LessonRepository({
    FirebaseFirestore? db,
    GamificationRepository? gamification,
  }) : _db = db ?? FirebaseFirestore.instance,
       _gamification = gamification ?? GamificationRepository();
  final FirebaseFirestore _db;
  final GamificationRepository _gamification;

  Future<List<Lesson>> listLessons(String userId, String childId) async {
    final lessonsSnap = await _db
        .collection('lessons')
        .where('isActive', isEqualTo: true)
        .get();
    final npcSnap = await _db.collection('npcs').get();
    final npcs = {
      for (final doc in npcSnap.docs) doc.id: NPC.fromMap(doc.id, doc.data()),
    };
    final lessons = lessonsSnap.docs.map((doc) {
      final data = doc.data();
      return Lesson.fromMap(
        doc.id,
        data,
        npc: data['npcId'] == null ? null : npcs[data['npcId']],
      );
    }).toList();
    lessons.sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return lessons;
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
    final total = items.length;
    final correct = items.where((q) => answers[q.id] == q.correctOption).length;
    final score = total == 0 ? 0 : ((correct / total) * 100).round();
    final already = await _completed(userId, childId, lesson.id);
    await _upsertProgress(
      userId,
      childId,
      lesson.id,
      lessonTypeToString(lesson.type),
      score,
      total,
      correct,
    );
    var xp = 0;
    if (!already)
      xp = await _gamification.awardXp(
        userId,
        childId,
        20,
        'Hoàn thành bài học: ${lesson.title}',
      );
    final streak = await _gamification.updateStreak(userId, childId);
    await _gamification.updateDailyMissionProgress(
      userId,
      childId,
      'COMPLETE_LESSON',
    );
    if (lesson.type == LessonType.math)
      await _gamification.updateDailyMissionProgress(
        userId,
        childId,
        'COMPLETE_MATH',
      );
    if (lesson.type == LessonType.dialogue)
      await _gamification.updateDailyMissionProgress(
        userId,
        childId,
        'COMPLETE_DIALOGUE',
      );
    final badges = await _gamification.checkAndAwardBadges(userId, childId);
    final totalXp = await _gamification.totalXp(userId, childId);
    return LessonResult(
      score: score,
      totalQuestions: total,
      correctAnswers: correct,
      xpGained: xp,
      levelStats: _gamification.calculateLevel(totalXp),
      newBadges: badges,
      streak: streak,
    );
  }

  Future<LessonResult> submitFlashcardComplete(
    String userId,
    String childId,
    Lesson lesson,
  ) async {
    final progressId = '${lesson.id}_flashcard';
    final already = await _completed(userId, childId, progressId);
    await _upsertProgress(userId, childId, progressId, 'FLASHCARD', 100, 1, 1);
    var xp = 0;
    if (!already)
      xp = await _gamification.awardXp(
        userId,
        childId,
        5,
        'Hoàn thành ôn tập thẻ học',
      );
    final streak = await _gamification.updateStreak(userId, childId);
    await _gamification.updateDailyMissionProgress(
      userId,
      childId,
      'REVIEW_FLASHCARD',
    );
    final badges = await _gamification.checkAndAwardBadges(userId, childId);
    final totalXp = await _gamification.totalXp(userId, childId);
    return LessonResult(
      score: 100,
      totalQuestions: 1,
      correctAnswers: 1,
      xpGained: xp,
      levelStats: _gamification.calculateLevel(totalXp),
      newBadges: badges,
      streak: streak,
    );
  }

  Future<bool> _completed(
    String userId,
    String childId,
    String lessonId,
  ) async {
    final snap = await _db
        .collection('progress')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .where('lessonId', isEqualTo: lessonId)
        .limit(1)
        .get();
    return snap.docs.isNotEmpty;
  }

  Future<void> _upsertProgress(
    String userId,
    String childId,
    String lessonId,
    String activityType,
    int score,
    int total,
    int correct,
  ) async {
    final snap = await _db
        .collection('progress')
        .where('userId', isEqualTo: userId)
        .where('childId', isEqualTo: childId)
        .where('lessonId', isEqualTo: lessonId)
        .limit(1)
        .get();
    final payload = {
      'userId': userId,
      'childId': childId,
      'lessonId': lessonId,
      'activityType': activityType,
      'status': 'COMPLETED',
      'score': score,
      'totalQuestions': total,
      'correctAnswers': correct,
      'completedAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    };
    if (snap.docs.isEmpty) {
      await _db.collection('progress').add({
        ...payload,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } else {
      await snap.docs.first.reference.set(payload, SetOptions(merge: true));
    }
  }
}
