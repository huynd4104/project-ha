import 'domain.dart';
import 'flashcard.dart';
import 'math_question.dart';

class ActivityAdapters {
  const ActivityAdapters._();

  static Activity fromMathQuestion(
    MathQuestion item, {
    List<String> skillTags = const [],
  }) => Activity(
    id: item.id,
    lessonId: item.lessonId,
    activityType: ActivityType.multipleChoice,
    orderIndex: item.orderIndex,
    prompt: item.questionText,
    mediaRefs: (item.imageUrl ?? '').isEmpty
        ? const []
        : [
            ActivityMediaRef(
              type: 'image',
              url: item.imageUrl!,
              label: item.questionText,
            ),
          ],
    options: _choiceOptions(item.options, item.correctOption),
    correctAnswers: [item.correctOption],
    feedback: ActivityFeedback(
      correct: item.explanation.isEmpty ? 'Con làm tốt lắm!' : item.explanation,
      wrong: item.explanation.isEmpty ? 'Mình thử lại nhé.' : item.explanation,
    ),
    retryLimit: 1,
    skillTags: skillTags,
  );

  static Activity fromFlashcard(
    Flashcard item, {
    List<String> skillTags = const [],
  }) => Activity(
    id: item.id,
    lessonId: item.lessonId,
    activityType: ActivityType.flashcardReview,
    orderIndex: item.orderIndex,
    prompt: item.frontText,
    instruction: item.backText,
    mediaRefs: [
      if ((item.imageUrl ?? '').isNotEmpty)
        ActivityMediaRef(
          type: 'image',
          url: item.imageUrl!,
          label: item.frontText,
        ),
      if ((item.audioUrl ?? '').isNotEmpty)
        ActivityMediaRef(
          type: 'audio',
          url: item.audioUrl!,
          label: item.frontText,
        ),
    ],
    acceptedAnswers: const ['REVIEWED'],
    feedback: const ActivityFeedback(correct: 'Đã ôn tập thẻ học.'),
    retryLimit: 0,
    skillTags: skillTags,
  );

  static List<ActivityOption> _choiceOptions(
    Map<String, String> options,
    String correctOption,
  ) => options.entries
      .where((entry) => entry.value.trim().isNotEmpty)
      .map(
        (entry) => ActivityOption(
          id: entry.key,
          text: entry.value,
          isCorrect: entry.key == correctOption,
        ),
      )
      .toList();
}
