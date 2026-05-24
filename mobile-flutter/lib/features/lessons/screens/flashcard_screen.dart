import 'package:cached_network_image/cached_network_image.dart';
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
    final lessons = await repo.listLessons(
      state.firebaseUser!.uid,
      state.activeChild!.id,
    );
    return (
      lesson: lessons.firstWhere((e) => e.id == widget.lessonId),
      cards: await repo.flashcards(widget.lessonId),
    );
  }

  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: data,
    builder: (_, snap) {
      if (!snap.hasData) return const Scaffold(body: LoadingView());
      final value = snap.data!;
      if (value.cards.isEmpty)
        return Scaffold(
          appBar: AppBar(),
          body: const Center(child: Text('Bộ thẻ chưa có nội dung.')),
        );
      final card = value.cards[index];
      return Scaffold(
        appBar: AppBar(title: Text(value.lesson.title)),
        body: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            ProgressBar(value: (index + 1) / value.cards.length),
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
                          CachedNetworkImage(
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
        bottomNavigationBar: Padding(
          padding: const EdgeInsets.all(18),
          child: AppButton(
            label: index == value.cards.length - 1 ? 'Đã học xong' : 'Đã thuộc',
            icon: Icons.check_rounded,
            onPressed: () async {
              if (index < value.cards.length - 1)
                return setState(() {
                  index++;
                  back = false;
                });
              final state = context.read<AppState>();
              final result = await repo.submitFlashcardComplete(
                state.firebaseUser!.uid,
                state.activeChild!.id,
                value.lesson,
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
