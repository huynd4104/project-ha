import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../lessons/widgets/mascot_message_bubble.dart';
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
          body: ListView(
            padding: const EdgeInsets.fromLTRB(24, 56, 24, 24),
            children: [
              IconButton(
                alignment: Alignment.centerLeft,
                onPressed: () {
                  if (Navigator.canPop(context)) {
                    Navigator.of(context).pop();
                  } else {
                    context.go('/learning');
                  }
                },
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const SizedBox(height: 6),
              MascotMessageBubble(
                npc: lesson.npc,
                message: 'Mình học một hoạt động ngắn thôi nhé.',
              ),
              const SizedBox(height: 16),
              AppCard(
                borderColor: AppColors.sky.withValues(alpha: .25),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: AppColors.sky.withValues(alpha: .16),
                      child: Icon(
                        _lessonIcon(lesson.type),
                        color: AppColors.sky,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(lesson.title, style: AppTextStyles.headline),
                    const SizedBox(height: 8),
                    Text(
                      lesson.description.isEmpty
                          ? 'Bài học ngắn, một nhiệm vụ mỗi màn hình.'
                          : lesson.description,
                      style: AppTextStyles.body,
                    ),
                    const SizedBox(height: 14),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: const [
                        _InfoPill(icon: Icons.timer_rounded, label: '3 phút'),
                        _InfoPill(icon: Icons.touch_app_rounded, label: 'Dễ'),
                        _InfoPill(
                          icon: Icons.volume_up_rounded,
                          label: 'Có âm thanh',
                        ),
                      ],
                    ),
                    if (lesson.npc != null) ...[
                      const SizedBox(height: 14),
                      Text(
                        'Bạn đồng hành: ${lesson.npc!.name}',
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

  IconData _lessonIcon(LessonType type) => switch (type) {
    LessonType.dialogue => Icons.chat_bubble_rounded,
    LessonType.flashcard => Icons.style_rounded,
    LessonType.thinking => Icons.psychology_rounded,
    LessonType.spelling => Icons.abc_rounded,
    LessonType.rhyme => Icons.music_note_rounded,
    LessonType.math => Icons.calculate_rounded,
  };
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
    decoration: BoxDecoration(
      color: AppColors.primary.withValues(alpha: .12),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: AppColors.primary, size: 18),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
      ],
    ),
  );
}
