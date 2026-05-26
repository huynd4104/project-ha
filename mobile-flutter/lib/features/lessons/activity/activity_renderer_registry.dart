import 'package:flutter/widgets.dart';

import '../../../models/models.dart';
import 'activity_renderers.dart';

typedef ActivityRendererBuilder =
    Widget Function(
      BuildContext context,
      Activity activity,
      AnswerCallback onAnswerSubmitted,
    );

class ActivityRendererRegistry {
  ActivityRendererRegistry([
    Map<ActivityType, ActivityRendererBuilder>? renderers,
  ]) : _renderers = Map<ActivityType, ActivityRendererBuilder>.from(
         renderers ?? const {},
       );

  final Map<ActivityType, ActivityRendererBuilder> _renderers;

  void register(ActivityType type, ActivityRendererBuilder builder) {
    _renderers[type] = builder;
  }

  bool supports(ActivityType type) => _renderers.containsKey(type);

  Widget build(
    BuildContext context,
    Activity activity,
    AnswerCallback onAnswerSubmitted,
  ) {
    final builder = _renderers[activity.activityType];
    if (builder == null) {
      // Fallback renderer
      return ChoiceAnswerRenderer(
        activity: activity,
        onAnswerSubmitted: onAnswerSubmitted,
      );
    }
    return builder(context, activity, onAnswerSubmitted);
  }

  // Factory to create registry with all default renderers
  factory ActivityRendererRegistry.createDefault() {
    final registry = ActivityRendererRegistry();

    // 1. CHOICE_ANSWER (multipleChoice, listenAndChooseImage, lookAndChooseWord, emotionRecognition)
    registry.register(
      ActivityType.multipleChoice,
      (ctx, act, callback) =>
          ChoiceAnswerRenderer(activity: act, onAnswerSubmitted: callback),
    );
    registry.register(
      ActivityType.listenAndChooseImage,
      (ctx, act, callback) =>
          ChoiceAnswerRenderer(activity: act, onAnswerSubmitted: callback),
    );
    registry.register(
      ActivityType.lookAndChooseWord,
      (ctx, act, callback) =>
          ChoiceAnswerRenderer(activity: act, onAnswerSubmitted: callback),
    );
    registry.register(
      ActivityType.emotionRecognition,
      (ctx, act, callback) =>
          ChoiceAnswerRenderer(activity: act, onAnswerSubmitted: callback),
    );

    // 2. TEXT_ANSWER (spelling / textAnswer)
    registry.register(
      ActivityType.matchObjects,
      (ctx, act, callback) =>
          DragDropRenderer(activity: act, onAnswerSubmitted: callback),
    );

    // flashcard -> flashcardReview
    registry.register(
      ActivityType.flashcardReview,
      (ctx, act, callback) =>
          FlashcardRenderer(activity: act, onAnswerSubmitted: callback),
    );

    // scenario practice -> hearAndRepeat, dailyLifeScenario
    registry.register(
      ActivityType.hearAndRepeat,
      (ctx, act, callback) =>
          ScenarioPracticeRenderer(activity: act, onAnswerSubmitted: callback),
    );
    registry.register(
      ActivityType.dailyLifeScenario,
      (ctx, act, callback) =>
          ScenarioPracticeRenderer(activity: act, onAnswerSubmitted: callback),
    );

    // voice_answer -> voiceAnswer
    registry.register(
      ActivityType.voiceAnswer,
      (ctx, act, callback) =>
          VoiceAnswerRenderer(activity: act, onAnswerSubmitted: callback),
    );

    // parent_mark -> parentMarkResult
    registry.register(
      ActivityType.parentMarkResult,
      (ctx, act, callback) =>
          ParentMarkRenderer(activity: act, onAnswerSubmitted: callback),
    );

    return registry;
  }
}
