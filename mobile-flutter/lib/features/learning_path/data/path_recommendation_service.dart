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
            score: _score(child, program, path),
          );
        }).toList()..sort((a, b) {
          final scoreCompare = b.score.compareTo(a.score);
          if (scoreCompare != 0) return scoreCompare;
          final freeCompare = _freeRank(a.path).compareTo(_freeRank(b.path));
          if (freeCompare != 0) return freeCompare;
          return a.path.orderIndex.compareTo(b.path.orderIndex);
        });

    if (scored.isNotEmpty && scored.first.score > 0) {
      return scored.take(3).toList();
    }

    final fallbackFree =
        publishedPaths
            .where((path) => path.accessType == AccessType.free)
            .toList()
          ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
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

  int _score(ChildProfile child, Program? program, LearningPath path) {
    if (program == null) return path.accessType == AccessType.free ? 1 : 0;
    var score = 0;
    if (child.age >= program.targetAgeMin &&
        child.age <= program.targetAgeMax) {
      score += 4;
    }
    if (program.difficultyCategories.contains(child.primaryDifficulty)) {
      score += 5;
    }
    final secondaryMatches = child.secondaryDifficulties
        .where(program.difficultyCategories.contains)
        .length;
    score += secondaryMatches * 2;

    final goalMatches = child.learningGoals
        .where(program.learningGoals.contains)
        .length;
    score += goalMatches * 3;

    if (path.level == LearningLevel.beginner &&
        child.supportLevel == SupportLevel.high) {
      score += 1;
    }
    if (path.accessType == AccessType.free) score += 1;
    return score;
  }

  int _freeRank(LearningPath path) =>
      path.accessType == AccessType.free ? 0 : 1;
}
