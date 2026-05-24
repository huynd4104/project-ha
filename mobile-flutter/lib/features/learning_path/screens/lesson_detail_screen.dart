import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../lessons/widgets/mascot_message_bubble.dart';
import '../../../models/models.dart';
import '../../../core/utils/access_check.dart';
import '../../../core/utils/parent_gate.dart';
import '../../parent_dashboard/screens/paywall_screen.dart';
import '../data/lesson_repository.dart';

class LessonDetailScreen extends StatelessWidget {
  const LessonDetailScreen({super.key, required this.lessonId});
  final String lessonId;

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return FutureBuilder(
      future: LessonRepository().lessonForChild(
        state.firebaseUser!.uid,
        state.activeChild!,
        lessonId,
      ),
      builder: (_, snap) {
        if (!snap.hasData) return const Scaffold(body: LoadingView());
        final lesson = snap.data!;
        final path = switch (lesson.type) {
          LessonType.dialogue => 'dialogue',
          LessonType.flashcard => 'flashcard',
          _ => 'math',
        };

        final hasAccess = AccessCheck.canAccessContent(
          accessType: lesson.accessType,
          summary: state.appUser?.subscriptionSummary,
        );

        return Scaffold(
          backgroundColor: AppColors.background,
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 56, 20, 24),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: InkWell(
                  onTap: () {
                    if (Navigator.canPop(context)) {
                      Navigator.of(context).pop();
                    } else {
                      context.go('/learning');
                    }
                  },
                  borderRadius: BorderRadius.circular(99),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.border),
                    ),
                    child: const Icon(Icons.arrow_back_rounded, color: AppColors.text),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              MascotMessageBubble(
                npc: lesson.npc,
                message: hasAccess
                    ? 'Chào bé yêu! Mình cùng hoàn thành hoạt động thú vị này nhé!'
                    : 'Bài học này đang khóa. Nhờ bố mẹ mở khóa Premium để học cùng tớ nhé!',
              ),
              const SizedBox(height: 16),
              AppCard(
                borderColor: hasAccess 
                    ? AppColors.sky.withOpacity(0.25)
                    : AppColors.orange.withOpacity(0.25),
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: (hasAccess ? AppColors.sky : AppColors.orange).withOpacity(0.12),
                          child: Icon(
                            _lessonIcon(lesson.type),
                            color: hasAccess ? AppColors.sky : AppColors.orange,
                            size: 28,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: (hasAccess ? AppColors.primary : AppColors.orange).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Text(
                            lesson.accessType == AccessType.premium ? 'PREMIUM' : 'MIỄN PHÍ',
                            style: TextStyle(
                              color: hasAccess ? AppColors.primary : AppColors.orange,
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(lesson.title, style: AppTextStyles.headline),
                    const SizedBox(height: 8),
                    Text(
                      lesson.description.isEmpty
                          ? 'Bài học ngắn, một nhiệm vụ mỗi màn hình.'
                          : lesson.description,
                      style: const TextStyle(
                        fontSize: 15,
                        color: AppColors.text,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _InfoPill(
                          icon: Icons.timer_rounded,
                          label: '${lesson.estimatedMinutes} phút',
                          color: hasAccess ? AppColors.sky : AppColors.orange,
                        ),
                        _InfoPill(
                          icon: Icons.star_rounded,
                          label: lesson.accessType == AccessType.premium ? 'Cao cấp' : 'Cơ bản',
                          color: hasAccess ? AppColors.primary : AppColors.orange,
                        ),
                        _InfoPill(
                          icon: Icons.volume_up_rounded,
                          label: 'Có audio',
                          color: AppColors.pink,
                        ),
                      ],
                    ),
                    if (lesson.npc != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.cream,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.face_retouching_natural_rounded, color: AppColors.orange, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Bạn đồng hành: ${lesson.npc!.name}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                color: AppColors.text,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              AppButton(
                label: hasAccess ? 'Bắt đầu học ngay' : 'Mở khóa Premium cho bé',
                icon: hasAccess ? Icons.play_arrow_rounded : Icons.lock_open_rounded,
                backgroundColor: hasAccess ? AppColors.primary : AppColors.orange,
                onPressed: () async {
                  if (!hasAccess) {
                    ParentGate.show(context, () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const PaywallScreen(),
                        ),
                      );
                    });
                    return;
                  }

                  final snap = await FirebaseFirestore.instance
                      .collection('activities')
                      .where('lessonId', isEqualTo: lessonId)
                      .where('isActive', isEqualTo: true)
                      .limit(1)
                      .get();

                  if (context.mounted) {
                    if (snap.docs.isNotEmpty) {
                      context.push('/lesson/$lessonId/activity');
                    } else {
                      context.push('/lesson/$lessonId/$path');
                    }
                  }
                },
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
  const _InfoPill({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: color.withOpacity(0.12),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 6),
        Text(
          label, 
          style: TextStyle(
            fontWeight: FontWeight.w900,
            color: color,
            fontSize: 12,
          ),
        ),
      ],
    ),
  );
}
