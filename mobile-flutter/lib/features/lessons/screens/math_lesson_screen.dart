import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/progress_bar.dart';
import '../../../models/models.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../widgets/answer_option.dart';
import '../widgets/feedback_sheet.dart';

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
    final lessons = await repo.listLessons(
      state.firebaseUser!.uid,
      state.activeChild!.id,
    );
    return (
      lesson: lessons.firstWhere((e) => e.id == widget.lessonId),
      items: await repo.mathQuestions(widget.lessonId),
    );
  }

  Future<void> finish(Lesson lesson, List<MathQuestion> items) async {
    final state = context.read<AppState>();
    final result = await repo.submitChoiceLesson(
      userId: state.firebaseUser!.uid,
      childId: state.activeChild!.id,
      lesson: lesson,
      items: items,
      answers: answers,
    );
    await state.refreshStats();
    if (mounted) context.go('/result', extra: result);
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
      return Scaffold(
        appBar: AppBar(title: Text(value.lesson.title)),
        body: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            ProgressBar(value: (index + 1) / items.length),
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
                      child: CachedNetworkImage(
                        imageUrl: q.imageUrl!,
                        height: 150,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            for (final entry in q.options.entries)
              AnswerOption(
                label: entry.key,
                text: entry.value,
                selected: selected == entry.key,
                onTap: () => setState(() => answers[q.id] = entry.key),
              ),
          ],
        ),
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(18),
          child: AppButton(
            label: index == items.length - 1 ? 'Hoàn thành' : 'Kiểm tra',
            icon: Icons.check_rounded,
            onPressed: selected == null
                ? null
                : () {
                    final correct = selected == q.correctOption;
                    SoundService.instance.play(correct ? 'correct' : 'wrong');
                    showModalBottomSheet(
                      context: context,
                      builder: (_) => FeedbackSheet(
                        correct: correct,
                        message: q.explanation.isEmpty
                            ? 'Đáp án đúng là ${q.correctOption}.'
                            : q.explanation,
                        onContinue: () {
                          Navigator.pop(context);
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
      );
    },
  );
}
