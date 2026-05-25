import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../widgets/answer_option_card.dart';
import '../widgets/audio_button.dart';
import '../widgets/feedback_panel.dart';
import '../widgets/lesson_header.dart';
import '../widgets/mascot_message_bubble.dart';

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
    final lesson = await repo.lessonForChild(
      state.appUser!.id,
      state.activeChild!,
      widget.lessonId,
    );
    return (
      lesson: lesson,
      items: await repo.dialogues(widget.lessonId),
    );
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

  Future<void> playAudio(String? audioUrl) async {
    final played = await SoundService.instance.playUrl(audioUrl);
    if (!played && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Audio chưa sẵn sàng cho nội dung này.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: data,
    builder: (_, snap) {
      if (!snap.hasData) return const Scaffold(body: LoadingView());
      final value = snap.data!;
      if (value.items.isEmpty) {
        return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('Bài hội thoại chưa có nội dung.')),
        );
      }
      final item = value.items[index];
      final selected = answers[item.id];
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
                progress: (index + 1) / value.items.length,
                activityLabel: 'Hoạt động ${index + 1}/${value.items.length}',
                onBack: confirmExit,
                onHelp: () => SoundService.instance.play('tap'),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(18),
                  children: [
                    MascotMessageBubble(
                      npc: value.lesson.npc,
                      message: 'Con nghe tình huống rồi chọn câu trả lời nhé.',
                    ),
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
                          AudioButton(
                            label: (item.audioUrl ?? '').isEmpty
                                ? 'Nghe hướng dẫn'
                                : 'Phát audio',
                            onPressed: () => playAudio(item.audioUrl),
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
                      if (entry.value.trim().isNotEmpty)
                        AnswerOptionCard(
                          label: entry.key,
                          text: entry.value,
                          state: selected == entry.key
                              ? AnswerOptionState.selected
                              : AnswerOptionState.normal,
                          onTap: () =>
                              setState(() => answers[item.id] = entry.key),
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
                label: index == value.items.length - 1
                    ? 'Hoàn thành'
                    : 'Kiểm tra',
                icon: Icons.check_rounded,
                onPressed: selected == null
                    ? null
                    : () {
                        final correct = selected == item.correctOption;
                        SoundService.instance.play(
                          correct ? 'correct' : 'wrong',
                        );
                        showModalBottomSheet(
                          context: context,
                          builder: (_) => FeedbackPanel(
                            type: correct
                                ? FeedbackType.correct
                                : FeedbackType.wrong,
                            message: correct
                                ? 'Con làm tốt lắm!'
                                : 'Không sao, mình nghe lại và thử thêm lần nữa nhé.',
                            ctaLabel: correct
                                ? (index == value.items.length - 1
                                      ? 'Hoàn thành'
                                      : 'Tiếp tục')
                                : 'Thử lại',
                            onPressed: () async {
                              Navigator.pop(context);
                              if (!correct) return;
                              if (index < value.items.length - 1) {
                                setState(() => index++);
                                return;
                              }
                              final state = context.read<AppState>();
                              final result = await repo.submitChoiceLesson(
                                userId: state.appUser!.id,
                                childId: state.activeChild!.id,
                                lesson: value.lesson,
                                items: value.items.cast<MathQuestion>(),
                                answers: answers,
                              );
                              await state.refreshStats();
                              if (context.mounted) {
                                context.go('/result', extra: result);
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
