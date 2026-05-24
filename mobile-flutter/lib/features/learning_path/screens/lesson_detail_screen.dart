import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/lesson.dart';
import '../data/lesson_repository.dart';

class LessonDetailScreen extends StatelessWidget {
  const LessonDetailScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return FutureBuilder(
      future: LessonRepository().listLessons(
        state.firebaseUser!.uid,
        state.activeChild!.id,
      ),
      builder: (_, snap) {
        if (!snap.hasData) return const Scaffold(body: LoadingView());
        final lesson = snap.data!.firstWhere((e) => e.id == lessonId);
        final path = switch (lesson.type) {
          LessonType.dialogue => 'dialogue',
          LessonType.flashcard => 'flashcard',
          _ => 'math',
        };
        return Scaffold(
          appBar: AppBar(title: const Text('Bài học')),
          body: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lesson.title,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(lesson.description),
                    if (lesson.npc != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        'Mascot: ${lesson.npc!.name}',
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 18),
              AppButton(
                label: 'Bắt đầu',
                icon: Icons.play_arrow_rounded,
                onPressed: () => context.push('/lesson/$lessonId/$path'),
              ),
            ],
          ),
        );
      },
    );
  }
}
