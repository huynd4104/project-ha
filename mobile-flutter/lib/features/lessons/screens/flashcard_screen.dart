import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/services/sound_service.dart';
import '../../../core/services/nfc_service.dart';
import '../../../core/services/tts_service.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_image.dart';
import '../../../core/widgets/confirmation_dialog.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../widgets/lesson_header.dart';
import '../widgets/mascot_message_bubble.dart';
import '../widgets/nfc_tts_mixin.dart';

class FlashcardScreen extends StatefulWidget {
  const FlashcardScreen({super.key, required this.lessonId});
  final String lessonId;
  @override
  State<FlashcardScreen> createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends State<FlashcardScreen> with NfcTtsMixin<FlashcardScreen> {
  final repo = LessonRepository();
  late Future<({Lesson lesson, List<Flashcard> cards})> data;
  int index = 0;
  int? _lastSpokenIndex;
  bool back = false;

  @override
  void initState() {
    super.initState();
    data = load();
  }

  @override
  void onNfcTagScanned(NfcResolvedTag tag) {
    data.then((value) {
      if (index >= value.cards.length) return;
      final card = value.cards[index];
      
      // Auto flip to back on scan
      setState(() => back = true);

      // Speak tag spoken text, back text, or front text
      final textToSpeak = (tag.spokenText != null && tag.spokenText!.isNotEmpty)
          ? tag.spokenText!
          : (card.backText.isNotEmpty ? card.backText : card.frontText);
          
      TtsService.instance.speak(textToSpeak);
    });
  }

  Future<({Lesson lesson, List<Flashcard> cards})> load() async {
    final state = context.read<AppState>();
    final lesson = await repo.lessonForChild(
      state.appUser!.id,
      state.activeChild!,
      widget.lessonId,
    );
    return (lesson: lesson, cards: await repo.flashcards(widget.lessonId));
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

  void handleCardTap(Flashcard card) {
    setState(() {
      back = !back;
    });
    // Speak based on target face
    if (back) {
      TtsService.instance.speakFlashcardBack(card.backText);
    } else {
      TtsService.instance.speakFlashcardFront(card.frontText);
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

      // Auto speak front text when new flashcard is loaded
      if (_lastSpokenIndex != index) {
        _lastSpokenIndex = index;
        Future.microtask(() => TtsService.instance.speakFlashcardFront(card.frontText));
      }

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
              buildNfcIndicator(context),
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
                      onTap: () => handleCardTap(card),
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
                                const SizedBox(height: 16),
                                Text(
                                  back ? card.backText : card.frontText,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 24),
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
