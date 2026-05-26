import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_image.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../widgets/answer_option_card.dart';
import '../widgets/feedback_sheet.dart';
import '../widgets/lesson_header.dart';
import '../widgets/mascot_message_bubble.dart';

class MathLessonScreen extends StatefulWidget {
  const MathLessonScreen({super.key, required this.lessonId});
  final String lessonId;
  @override
  State<MathLessonScreen> createState() => _MathLessonScreenState();
}

class _MathLessonScreenState extends State<MathLessonScreen> {
  final repo = LessonRepository();
  late Future<({Lesson lesson, List<MathQuestion> items})> data;
  int index = 0;
  final answers = <String, String>{};

  @override
  void initState() {
    super.initState();
    data = load();
  }

  Future<({Lesson lesson, List<MathQuestion> items})> load() async {
    final state = context.read<AppState>();
    final lesson = await repo.lessonForChild(
      state.appUser!.id,
      state.activeChild!,
      widget.lessonId,
    );
    return (lesson: lesson, items: await repo.mathQuestions(widget.lessonId));
  }

  Future<void> finish(Lesson lesson, List<MathQuestion> items) async {
    final state = context.read<AppState>();
    final result = await repo.submitChoiceLesson(
      userId: state.appUser!.id,
      childId: state.activeChild!.id,
      lesson: lesson,
      items: items,
      answers: answers,
    );
    await state.refreshStats();
    if (mounted) context.go('/result', extra: result);
  }

  Future<void> confirmExit() async {
    final ok = await showAppConfirmationDialog(
      context,
      title: 'Dừng bài học',
      message: 'Con có muốn dừng bài học không?',
      confirmLabel: 'Dừng lại',
    );
    if (ok && mounted) {
      if (Navigator.canPop(context)) {
        Navigator.of(context).pop();
      } else {
        context.go('/lesson/${widget.lessonId}');
      }
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: data,
    builder: (_, snap) {
      if (!snap.hasData) return const Scaffold(body: LoadingView());
      final value = snap.data!;
      final items = value.items;
      if (items.isEmpty)
        return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('Bài học chưa có câu hỏi.')),
        );
      final q = items[index];
      final selected = answers[q.id];
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (didPop) return;
          Future.microtask(() => confirmExit());
        },
        child: Scaffold(
          body: Column(
            children: [
              LessonHeader(
                title: value.lesson.title,
                progress: (index + 1) / items.length,
                activityLabel: 'Hoạt động ${index + 1}/${items.length}',
                onBack: confirmExit,
                onHelp: () => SoundService.instance.play('tap'),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(18),
                  children: [
                    MascotMessageBubble(
                      npc: value.lesson.npc,
                      message: 'Con chọn đáp án phù hợp nhé.',
                    ),
                    const SizedBox(height: 16),
                    AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            q.questionText,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          if ((q.imageUrl ?? '').isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 12),
                              child: AppImage(
                                imageUrl: q.imageUrl!,
                                height: 150,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    for (final entry in q.options.entries)
                      if (entry.value.trim().isNotEmpty)
                        AnswerOptionCard(
                          label: entry.key,
                          text: entry.value,
                          state: selected == entry.key
                              ? AnswerOptionState.selected
                              : AnswerOptionState.normal,
                          onTap: () =>
                              setState(() => answers[q.id] = entry.key),
                        ),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: AppButton(
                label: index == items.length - 1 ? 'Hoàn thành' : 'Kiểm tra',
                icon: Icons.check_rounded,
                onPressed: selected == null
                    ? null
                    : () {
                        final correct = selected == q.correctOption;
                        SoundService.instance.play(
                          correct ? 'correct' : 'wrong',
                        );
                        showModalBottomSheet(
                          context: context,
                          builder: (_) => FeedbackSheet(
                            correct: correct,
                            message: q.explanation.isEmpty
                                ? (correct
                                      ? 'Con làm tốt lắm!'
                                      : 'Mình thử lại nhé.')
                                : q.explanation,
                            onContinue: () {
                              Navigator.pop(context);
                              if (!correct) return;
                              if (index == items.length - 1) {
                                finish(value.lesson, items);
                              } else {
                                setState(() => index++);
                              }
                            },
                          ),
                        );
                      },
              ),
            ),
          ),
        ),
      );
    },
  );
}
