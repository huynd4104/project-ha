import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/theme/app_colors.dart';
import '../../../models/lesson.dart';

enum LessonNodeState { completed, current, available, locked }

class LessonNode extends StatelessWidget {
  const LessonNode({
    super.key,
    required this.lesson,
    required this.state,
    required this.onTap,
    required this.alignRight,
  });
  final Lesson lesson;
  final LessonNodeState state;
  final VoidCallback onTap;
  final bool alignRight;

  @override
  Widget build(BuildContext context) {
    final color = switch (state) {
      LessonNodeState.completed => AppColors.primary,
      LessonNodeState.current => AppColors.sky,
      LessonNodeState.available => AppColors.yellow,
      LessonNodeState.locked => AppColors.border,
    };
    final icon = switch (lesson.type) {
      LessonType.dialogue => Icons.chat_bubble_rounded,
      LessonType.flashcard => Icons.style_rounded,
      _ => Icons.calculate_rounded,
    };
    final node = InkWell(
      onTap: state == LessonNodeState.locked ? null : onTap,
      borderRadius: BorderRadius.circular(28),
      child: Container(
        width: 104,
        height: 104,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: .28),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Icon(
          state == LessonNodeState.completed
              ? Icons.check_rounded
              : state == LessonNodeState.locked
              ? Icons.lock_rounded
              : icon,
          color: Colors.white,
          size: 42,
        ),
      ),
    );
    return Align(
      alignment: alignRight ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: alignRight
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          (state == LessonNodeState.current
              ? node
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.06, 1.06),
                      duration: 800.ms,
                    )
              : node),
          const SizedBox(height: 8),
          SizedBox(
            width: 170,
            child: Text(
              lesson.title,
              textAlign: alignRight ? TextAlign.right : TextAlign.left,
              style: const TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
    );
  }
}
