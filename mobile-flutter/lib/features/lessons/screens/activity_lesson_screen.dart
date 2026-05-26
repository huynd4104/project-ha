import 'package:flutter/material.dart' hide Badge;
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../../../core/utils/access_check.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../activity/activity_renderer_registry.dart';
import '../widgets/feedback_panel.dart';
import '../widgets/lesson_progress_bar.dart';
import '../widgets/mascot_message_bubble.dart';

class ActivityLessonScreen extends StatefulWidget {
  const ActivityLessonScreen({super.key, required this.lessonId});

  final String lessonId;

  @override
  State<ActivityLessonScreen> createState() => _ActivityLessonScreenState();
}

class _ActivityLessonScreenState extends State<ActivityLessonScreen> {
  final _lessonRepo = LessonRepository();
  late Future<({Lesson lesson, List<Activity> activities})> _dataFuture;

  int _currentIndex = 0;
  DateTime _activityStartTime = DateTime.now();

  // Track attempts results
  final List<Map<String, dynamic>> _attempts = [];
  bool _showFeedback = false;

  // Current feedback states
  FeedbackType _feedbackType = FeedbackType.correct;
  String _feedbackMessage = '';
  String _npcMessage = '';
  bool _isSubmittingAttempt = false;
  bool _isCompletingLesson = false;

  @override
  void initState() {
    super.initState();
    _dataFuture = _loadData();
    _activityStartTime = DateTime.now();
  }

  Future<({Lesson lesson, List<Activity> activities})> _loadData() async {
    final state = context.read<AppState>();
    final lesson = await _lessonRepo.lessonForChild(
      state.appUser!.id,
      state.activeChild!,
      widget.lessonId,
    );
    final allActivities = await _lessonRepo.activitiesForLesson(lesson);

    final summary = state.appUser?.subscriptionSummary;
    final hasPremiumAccess = AccessCheck.canAccessContent(
      accessType: AccessType.premium,
      summary: summary,
    );

    final activities = allActivities.where((activity) {
      if (activity.accessType == AccessType.premium && !hasPremiumAccess) {
        return false;
      }
      return true;
    }).toList();

    return (lesson: lesson, activities: activities);
  }

  Future<void> _handleAnswer(
    String selectedAnswer,
    String result,
    double score,
    Activity activity,
    Lesson lesson,
  ) async {
    if (_isSubmittingAttempt) return;
    setState(() => _isSubmittingAttempt = true);

    final durationSec = DateTime.now().difference(_activityStartTime).inSeconds;
    final state = context.read<AppState>();

    // 1. Save locally
    _attempts.add({
      'activityId': activity.id,
      'result': result,
      'score': score,
      'answer': selectedAnswer,
    });

    // 2. Persist attempt through backend in the background.
    try {
      await _lessonRepo.submitActivityAttempt(
        childId: state.activeChild!.id,
        lessonId: widget.lessonId,
        activityId: activity.id,
        activityType: enumKey(activity.activityType),
        result: result.toUpperCase(),
        score: score,
        answerPayload: {'selectedAnswer': selectedAnswer},
        skillTags: activity.skillTags,
        durationSec: durationSec,
      );
    } catch (e) {
      debugPrint('Error submitting activity attempt: $e');
    }

    // 3. Prepare contextual NPC bubble message
    final npc = lesson.npc;
    String feedbackMsg = '';
    String npcMsg = '';

    if (result == 'correct' || result == 'done') {
      _feedbackType = FeedbackType.correct;
      feedbackMsg = activity.feedback.correct.isNotEmpty
          ? activity.feedback.correct
          : 'Tuyệt vời! Con làm đúng rồi!';
      npcMsg = (npc != null && npc.dialogueTemplates.correct.isNotEmpty)
          ? npc.dialogueTemplates.correct
          : 'Tuyệt vời! Con làm rất tốt!';
    } else if (result == 'almost') {
      _feedbackType = FeedbackType.nearCorrect;
      feedbackMsg = activity.feedback.almost.isNotEmpty
          ? activity.feedback.almost
          : 'Gần chính xác rồi, cố gắng lên con!';
      npcMsg = (npc != null && npc.dialogueTemplates.encouragement.isNotEmpty)
          ? npc.dialogueTemplates.encouragement
          : 'Gần đúng rồi con ơi, cố lên chút nữa!';
    } else {
      _feedbackType = FeedbackType.wrong;
      feedbackMsg = activity.feedback.wrong.isNotEmpty
          ? activity.feedback.wrong
          : 'Chưa chính xác. Chúng mình thử lại nhé!';
      npcMsg = (npc != null && npc.dialogueTemplates.wrong.isNotEmpty)
          ? npc.dialogueTemplates.wrong
          : 'Không sao đâu, lần sau sẽ tốt hơn!';
    }

    setState(() {
      _feedbackMessage = feedbackMsg;
      _npcMessage = npcMsg;
      _showFeedback = true;
      _isSubmittingAttempt = false;
    });
  }

  Future<void> _nextActivity(List<Activity> activities, Lesson lesson) async {
    setState(() => _showFeedback = false);

    if (_currentIndex < activities.length - 1) {
      setState(() {
        _currentIndex++;
        _activityStartTime = DateTime.now();
        _npcMessage = '';
      });
    } else {
      // Completed all activities! Finish the lesson.
      await _finishLesson(activities, lesson);
    }
  }

  Future<void> _finishLesson(List<Activity> activities, Lesson lesson) async {
    setState(() => _isCompletingLesson = true);
    final state = context.read<AppState>();

    try {
      final correctCount = _attempts
          .where((a) => a['result'] == 'correct' || a['result'] == 'done')
          .length;
      final finalScore = activities.isEmpty
          ? 0
          : ((correctCount / activities.length) * 100).round();

      // Collect all answers payload
      final Map<String, String> answersMap = {
        for (final att in _attempts)
          att['activityId'] as String: att['result'] as String,
      };

      final result = await _lessonRepo.submitActivityLessonComplete(
        childId: state.activeChild!.id,
        lessonId: widget.lessonId,
        correctAnswers: correctCount,
        score: finalScore,
        answers: answersMap,
      );

      await state.refreshStats();

      if (mounted) {
        context.go('/result', extra: result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi hoàn thành bài học: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCompletingLesson = false);
      }
    }
  }

  Future<void> _confirmExit() async {
    final ok = await showAppConfirmationDialog(
      context,
      title: 'Dừng bài học',
      message: 'Con có muốn dừng học bài học này không?',
      confirmLabel: 'Dừng lại',
    );
    if (ok && mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _dataFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: LoadingView());
        }
        if (snapshot.hasError) {
          return Scaffold(
            appBar: AppBar(title: const Text('Lỗi')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text('Lỗi tải bài học: ${snapshot.error}'),
              ),
            ),
          );
        }

        final data = snapshot.data!;
        final lesson = data.lesson;
        final activities = data.activities;

        // Legacy fallback check: if no activities found, route to legacy layout screen
        if (activities.isEmpty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final path = switch (lesson.type) {
              LessonType.flashcard => 'flashcard',
              _ => 'math',
            };
            context.go('/lesson/${lesson.id}/$path');
          });
          return const Scaffold(body: LoadingView());
        }

        final activity = activities[_currentIndex];
        final progress = _currentIndex / activities.length;

        // Determine mascot bubble message
        String bubbleMessage = _npcMessage;
        if (bubbleMessage.isEmpty) {
          bubbleMessage =
              (lesson.npc != null &&
                  lesson.npc!.dialogueTemplates.beforeActivity.isNotEmpty)
              ? lesson.npc!.dialogueTemplates.beforeActivity
              : (lesson.npc != null && lesson.npc!.defaultDialogue.isNotEmpty)
              ? lesson.npc!.defaultDialogue
              : 'Chào con! Mình cùng hoàn thành bài học này nhé.';
        }

        if (_isCompletingLesson) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text(
                    'Đang nộp bài học và tính điểm...',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          );
        }

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (didPop) return;
            _confirmExit();
          },
          child: Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            body: SafeArea(
              child: Column(
                children: [
                  // 1. Progress Bar & Header
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          onPressed: _confirmExit,
                          icon: const Icon(Icons.close_rounded),
                        ),
                        Expanded(child: LessonProgressBar(value: progress)),
                        const SizedBox(width: 8),
                        Text(
                          '${_currentIndex + 1}/${activities.length}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),

                  // 2. NPC & Message Bubble
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20.0,
                      vertical: 8.0,
                    ),
                    child: MascotMessageBubble(
                      npc: lesson.npc,
                      message: bubbleMessage,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // 3. Activity Renderer Area
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Container(
                        padding: const EdgeInsets.all(16.0),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9).withOpacity(0.4),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: KeyedSubtree(
                          key: ValueKey(activity.id),
                          child: ActivityRendererRegistry.createDefault().build(
                            context,
                            activity,
                            (selectedAnswer, result, score) => _handleAnswer(
                              selectedAnswer,
                              result,
                              score,
                              activity,
                              lesson,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // 4. Bottom Feedback Panel
                  if (_showFeedback)
                    FeedbackPanel(
                      type: _feedbackType,
                      message: _feedbackMessage,
                      ctaLabel: _currentIndex == activities.length - 1
                          ? 'Hoàn thành bài'
                          : 'Tiếp tục',
                      onPressed: () => _nextActivity(activities, lesson),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
