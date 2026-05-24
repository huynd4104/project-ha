import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/widgets/progress_bar.dart';
import '../../../models/models.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../widgets/answer_option.dart';

class DialogueLessonScreen extends StatefulWidget {
  const DialogueLessonScreen({super.key, required this.lessonId});
  final String lessonId;
  @override
  State<DialogueLessonScreen> createState() => _DialogueLessonScreenState();
}

class _DialogueLessonScreenState extends State<DialogueLessonScreen> {
  final repo = LessonRepository();
  late Future<({Lesson lesson, List<Dialogue> items})> data;
  int index = 0;
  final answers = <String, String>{};

  @override
  void initState() {
    super.initState();
    data = load();
  }

  Future<({Lesson lesson, List<Dialogue> items})> load() async {
    final state = context.read<AppState>();
    final lessons = await repo.listLessons(
      state.firebaseUser!.uid,
      state.activeChild!.id,
    );
    return (
      lesson: lessons.firstWhere((e) => e.id == widget.lessonId),
      items: await repo.dialogues(widget.lessonId),
    );
  }

  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: data,
    builder: (_, snap) {
      if (!snap.hasData) return const Scaffold(body: LoadingView());
      final value = snap.data!;
      if (value.items.isEmpty)
        return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('Bài hội thoại chưa có nội dung.')),
        );
      final item = value.items[index];
      final selected = answers[item.id];
      return Scaffold(
        appBar: AppBar(title: Text(value.lesson.title)),
        body: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            ProgressBar(value: (index + 1) / value.items.length),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(item.sceneText),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: null,
                    icon: const Icon(Icons.volume_up_rounded),
                    label: Text(
                      (item.audioUrl ?? '').isEmpty
                          ? 'Audio sẽ được bổ sung sau'
                          : 'Phát audio',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              item.questionText,
              style: const TextStyle(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            for (final entry in item.options.entries)
              AnswerOption(
                label: entry.key,
                text: entry.value,
                selected: selected == entry.key,
                onTap: () => setState(() => answers[item.id] = entry.key),
              ),
          ],
        ),
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(18),
          child: AppButton(
            label: index == value.items.length - 1 ? 'Hoàn thành' : 'Tiếp tục',
            icon: Icons.check_rounded,
            onPressed: selected == null
                ? null
                : () async {
                    if (index < value.items.length - 1)
                      return setState(() => index++);
                    final state = context.read<AppState>();
                    final result = await repo.submitChoiceLesson(
                      userId: state.firebaseUser!.uid,
                      childId: state.activeChild!.id,
                      lesson: value.lesson,
                      items: value.items,
                      answers: answers,
                    );
                    await state.refreshStats();
                    if (context.mounted) context.go('/result', extra: result);
                  },
          ),
        ),
      );
    },
  );
}
