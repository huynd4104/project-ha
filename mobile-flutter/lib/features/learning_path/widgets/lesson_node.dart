import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../models/lesson.dart';
import '../../../core/utils/parent_gate.dart';
import '../../parent_dashboard/screens/paywall_screen.dart';

enum LessonNodeState { completed, current, available, locked, premiumLocked }

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
      LessonNodeState.premiumLocked => const Color(
        0xFFF59E0B,
      ), // Premium Amber/Orange
    };
    final icon = switch (lesson.type) {
      LessonType.flashcard => Icons.style_rounded,
      LessonType.spelling => Icons.abc_rounded,
      LessonType.rhyme => Icons.music_note_rounded,
      LessonType.thinking => Icons.psychology_rounded,
      _ => Icons.calculate_rounded,
    };
    final reducedAnimation = context.watch<AppState>().reducedAnimation;
    final node = InkWell(
      onTap: () {
        if (state == LessonNodeState.locked) return;
        if (state == LessonNodeState.premiumLocked) {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('✨ Bài học Premium'),
              content: const Text(
                'Bài học này cần tài khoản Premium để truy cập. Bé hãy nhờ bố mẹ mở khóa giúp nhé!',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Để sau',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    ParentGate.show(context, () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const PaywallScreen(),
                        ),
                      );
                    });
                  },
                  child: const Text(
                    'Dành cho Bố Mẹ',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          );
          return;
        }
        onTap();
      },
      borderRadius: BorderRadius.circular(AppRadius.xl),
      child: Container(
        width: state == LessonNodeState.current ? 122 : 108,
        constraints: const BoxConstraints(minHeight: 108),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: state == LessonNodeState.locked
              ? const Color(0xFFF3F4F6)
              : Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.xl),
          border: Border.all(color: color, width: 3),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: .28),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color,
              child: Icon(
                state == LessonNodeState.completed
                    ? Icons.check_rounded
                    : state == LessonNodeState.locked
                    ? Icons.lock_rounded
                    : state == LessonNodeState.premiumLocked
                    ? Icons.workspace_premium_rounded
                    : icon,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _statusText(),
              style: TextStyle(
                color: state == LessonNodeState.locked
                    ? AppColors.muted
                    : color,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
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
          (state == LessonNodeState.current && !reducedAnimation
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
            width: 190,
            child: Column(
              crossAxisAlignment: alignRight
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                Text(
                  lesson.title,
                  textAlign: alignRight ? TextAlign.right : TextAlign.left,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_typeLabel()} • 3 phút',
                  textAlign: alignRight ? TextAlign.right : TextAlign.left,
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _statusText() => switch (state) {
    LessonNodeState.completed => 'Xong',
    LessonNodeState.current => 'Tiếp tục',
    LessonNodeState.available => 'Sẵn sàng',
    LessonNodeState.locked => 'Mở sau',
    LessonNodeState.premiumLocked => 'Premium',
  };

  String _typeLabel() => switch (lesson.type) {
    LessonType.flashcard => 'Thẻ học',
    LessonType.thinking => 'Tư duy',
    LessonType.spelling => 'Từ vựng',
    LessonType.rhyme => 'Âm nhạc',
    LessonType.math => 'Chọn đáp án',
  };
}
