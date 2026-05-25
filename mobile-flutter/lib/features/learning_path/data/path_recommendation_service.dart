import '../../../models/models.dart';

class LearningPathRecommendation {
  const LearningPathRecommendation({
    required this.path,
    required this.program,
    required this.score,
  });

  final LearningPath path;
  final Program? program;
  final int score;
}

class PathRecommendationService {
  const PathRecommendationService();

  List<LearningPathRecommendation> recommend({
    required ChildProfile child,
    required List<Program> programs,
    required List<LearningPath> paths,
    Map<LearningGoalKey, List<String>> goalSkillTags = const {},
  }) {
    final publishedPrograms = programs
        .where((program) => program.status == PublishStatus.published)
        .toList();
    final programById = {
      for (final program in publishedPrograms) program.id: program,
    };
    final publishedPaths = paths
        .where((path) => path.status == PublishStatus.published)
        .toList();

    final scored =
        publishedPaths.map((path) {
          final program = programById[path.programId];
          return LearningPathRecommendation(
            path: path,
            program: program,
            score: _score(child, path, goalSkillTags),
          );
        }).toList()..sort((a, b) {
          final scoreCompare = b.score.compareTo(a.score);
          if (scoreCompare != 0) return scoreCompare;
          final freeCompare = _freeRank(a.path).compareTo(_freeRank(b.path));
          if (freeCompare != 0) return freeCompare;
          return a.path.title.compareTo(b.path.title);
        });

    if (scored.isNotEmpty && scored.first.score > 0) {
      return scored.take(3).toList();
    }

    final fallbackFree =
        publishedPaths
            .where((path) => path.accessType == AccessType.free)
            .toList()
          ..sort((a, b) => a.title.compareTo(b.title));
    if (fallbackFree.isEmpty) return scored.take(3).toList();
    final fallbackPath = fallbackFree.first;
    return [
      LearningPathRecommendation(
        path: fallbackPath,
        program: programById[fallbackPath.programId],
        score: 0,
      ),
    ];
  }

  int _score(
    ChildProfile child,
    LearningPath path,
    Map<LearningGoalKey, List<String>> goalSkillTags,
  ) {
    var score = 0;
    final rules = path.targetProfileRules;
    final ruleGoals = _learningGoalsFromRules(rules['learningGoals']);
    final ruleSkills = _stringsFromRules(rules['skillTags']).toSet();
    final ruleSupportLevels = _stringsFromRules(
      rules['supportLevel'],
    ).map((item) => item.toUpperCase()).toSet();

    final goalMatches = child.learningGoals.where(ruleGoals.contains).length;
    score += goalMatches * 4;

    final childSkills = <String>{
      for (final goal in child.learningGoals) ...?goalSkillTags[goal],
      ..._stringsFromRules(child.accessibilityPreferences['skillTags']),
    };
    final skillMatches = childSkills.where(ruleSkills.contains).length;
    score += skillMatches * 3;

    if (ruleSupportLevels.contains(child.supportLevel.firestoreValue)) {
      score += 2;
    }
    return score;
  }

  int _freeRank(LearningPath path) =>
      path.accessType == AccessType.free ? 0 : 1;

  List<LearningGoalKey> _learningGoalsFromRules(Object? value) {
    final names = _stringsFromRules(
      value,
    ).map((item) => item.toUpperCase()).toSet();
    return LearningGoalKey.values
        .where((item) => names.contains(item.firestoreValue))
        .toList();
  }

  List<String> _stringsFromRules(Object? value) {
    if (value is Iterable) {
      return value
          .map((item) => '$item'.trim())
          .where((item) => item.isNotEmpty)
          .toList();
    }
    if (value is String && value.trim().isNotEmpty) return [value.trim()];
    return const [];
  }
}
