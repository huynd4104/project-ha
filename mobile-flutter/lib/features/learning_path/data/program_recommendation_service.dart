import '../../../models/models.dart';

class ProgramRecommendation {
  const ProgramRecommendation({
    required this.program,
    required this.score,
  });

  final Program program;
  final int score;
}

class ProgramRecommendationService {
  const ProgramRecommendationService();

  List<ProgramRecommendation> recommend({
    required ChildProfile child,
    required List<Program> programs,
  }) {
    final published = programs
        .where((p) => p.status == PublishStatus.published)
        .toList();

    final scored = published.map((program) {
      return ProgramRecommendation(
        program: program,
        score: _score(child, program),
      );
    }).toList()
      ..sort((a, b) {
        final scoreCompare = b.score.compareTo(a.score);
        if (scoreCompare != 0) return scoreCompare;
        final freeCompare = _freeRank(a.program).compareTo(_freeRank(b.program));
        if (freeCompare != 0) return freeCompare;
        return a.program.title.compareTo(b.program.title);
      });

    if (scored.isNotEmpty && scored.first.score > 0) {
      return scored.take(3).toList();
    }

    final fallbackFree = published
        .where((p) => p.accessType == AccessType.free)
        .toList()
      ..sort((a, b) => a.title.compareTo(b.title));
    if (fallbackFree.isEmpty) return scored.take(3).toList();
    return [
      ProgramRecommendation(program: fallbackFree.first, score: 0),
    ];
  }

  int _score(ChildProfile child, Program program) {
    var score = 0;

    // 1. Difficulty categories match
    if (program.difficultyCategories.contains(child.primaryDifficulty)) {
      score += 5;
    }
    for (final secDiff in child.secondaryDifficulties) {
      if (program.difficultyCategories.contains(secDiff)) {
        score += 3;
      }
    }

    // 2. Learning goals match
    final goalMatches = child.learningGoals
        .where((g) => program.learningGoals.contains(g))
        .length;
    score += goalMatches * 4;

    // 3. Age match
    if (child.age >= program.targetAgeMin && child.age <= program.targetAgeMax) {
      score += 2;
    }

    return score;
  }

  int _freeRank(Program program) =>
      program.accessType == AccessType.free ? 0 : 1;
}
