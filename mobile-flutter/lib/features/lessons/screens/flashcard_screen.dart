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
import '../widgets/audio_button.dart';
import '../widgets/lesson_header.dart';
import '../widgets/mascot_message_bubble.dart';

class FlashcardScreen extends StatefulWidget {
  const FlashcardScreen({super.key, required this.lessonId});
  final String lessonId;
  @override
  State<FlashcardScreen> createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends State<FlashcardScreen> {
  final repo = LessonRepository();
  late Future<({Lesson lesson, List<Flashcard> cards})> data;
  int index = 0;
  bool back = false;

  @override
  void initState() {
    super.initState();
    data = load();
  }

  Future<({Lesson lesson, List<Flashcard> cards})> load() async {
    final state = context.read<AppState>();
    final lesson = await repo.lessonForChild(
      state.appUser!.id,
      state.activeChild!,
      widget.lessonId,
    );
    return (
      lesson: lesson,
      cards: await repo.flashcards(widget.lessonId),
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
        const SnackBar(content: Text('Audio chưa sẵn sàng cho thẻ này.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: data,
    builder: (_, snap) {
      if (!snap.hasData) return const Scaffold(body: LoadingView());
      final value = snap.data!;
      if (value.cards.isEmpty) {
        return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('Bộ thẻ chưa có nội dung.')),
        );
      }
      final card = value.cards[index];
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
                progress: (index + 1) / value.cards.length,
                activityLabel: 'Thẻ ${index + 1}/${value.cards.length}',
                onBack: confirmExit,
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(18),
                  children: [
                    MascotMessageBubble(
                      npc: value.lesson.npc,
                      message: 'Con chạm vào thẻ để xem mặt sau nhé.',
                    ),
                    const SizedBox(height: 18),
                    GestureDetector(
                      onTap: () => setState(() => back = !back),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 240),
                        child: AppCard(
                          key: ValueKey(back),
                          child: SizedBox(
                            height: 300,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if ((card.imageUrl ?? '').isNotEmpty)
                                  AppImage(
                                    imageUrl: card.imageUrl!,
                                    height: 120,
                                  ),
                                Text(
                                  back ? card.backText : card.frontText,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                if ((card.audioUrl ?? '').isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  AudioButton(
                                    label: 'Phát audio',
                                    onPressed: () => playAudio(card.audioUrl),
                                  ),
                                ],
                                const SizedBox(height: 12),
                                Text(back ? 'Mặt sau' : 'Chạm để lật thẻ'),
                              ],
                            ),
                          ),
                        ),
                      ),
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
                label: index == value.cards.length - 1
                    ? 'Đã học xong'
                    : 'Đã thuộc',
                icon: Icons.check_rounded,
                onPressed: () async {
                  if (index < value.cards.length - 1) {
                    setState(() {
                      index++;
                      back = false;
                    });
                    return;
                  }
                  final state = context.read<AppState>();
                  final result = await repo.submitFlashcardComplete(
                    state.appUser!.id,
                    state.activeChild!.id,
                    value.lesson,
                  );
                  await state.refreshStats();
                  if (context.mounted) context.go('/result', extra: result);
                },
              ),
            ),
          ),
        ),
      );
    },
  );
}
