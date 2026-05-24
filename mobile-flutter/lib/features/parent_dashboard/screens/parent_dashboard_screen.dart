import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/progress.dart';
import '../widgets/parent_metric_card.dart';
import '../widgets/recommendation_card.dart';
import '../widgets/skill_progress_card.dart';
import '../widgets/weekly_progress_card.dart';

class ParentDashboardScreen extends StatelessWidget {
  const ParentDashboardScreen({super.key});

  Future<List<UserProgress>> _history(String uid, String childId) async {
    final snap = await FirebaseFirestore.instance
        .collection('progress')
        .where('userId', isEqualTo: uid)
        .where('childId', isEqualTo: childId)
        .get();
    return snap.docs
        .map((doc) => UserProgress.fromMap(doc.id, doc.data()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      body: FutureBuilder(
        future: _history(state.firebaseUser!.uid, state.activeChild!.id),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          final completed = snap.data!
              .where(
                (e) =>
                    e.status == 'COMPLETED' &&
                    !e.lessonId.endsWith('_flashcard'),
              )
              .length;
          return ListView(
            padding: const EdgeInsets.fromLTRB(18, 56, 18, 24),
            children: [
              const Text('Bảng phụ huynh', style: AppTextStyles.headline),
              const SizedBox(height: 4),
              Text(
                state.activeChild?.name ?? 'Hồ sơ bé',
                style: AppTextStyles.muted.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              AppCard(
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 30,
                      backgroundColor: AppColors.sky,
                      child: Icon(
                        Icons.child_care_rounded,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Hôm nay bé đã hoàn thành $completed hoạt động',
                        style: AppTextStyles.subtitle,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ParentMetricCard(
                      label: 'Bài hoàn thành',
                      value: '$completed',
                      color: AppColors.sky,
                      icon: Icons.check_circle_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ParentMetricCard(
                      label: 'Level',
                      value: '${state.levelStats.level}',
                      color: AppColors.primary,
                      icon: Icons.trending_up_rounded,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ParentMetricCard(
                      label: 'XP',
                      value: '${state.levelStats.totalXp}',
                      color: AppColors.orange,
                      icon: Icons.bolt_rounded,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ParentMetricCard(
                      label: 'Streak',
                      value: '${state.streak?.currentStreak ?? 0}',
                      color: AppColors.purple,
                      icon: Icons.local_fire_department_rounded,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              WeeklyProgressCard(completed: completed),
              const SizedBox(height: 18),
              const Text('Kỹ năng', style: AppTextStyles.title),
              const SizedBox(height: 10),
              SkillProgressCard(
                title: 'Nhận biết hình ảnh',
                value: completed == 0 ? .12 : .72,
                color: AppColors.primary,
              ),
              SkillProgressCard(
                title: 'Nghe và làm theo hướng dẫn',
                value: completed == 0 ? .08 : .48,
                color: AppColors.sky,
              ),
              SkillProgressCard(
                title: 'Giao tiếp hằng ngày',
                value: completed == 0 ? .05 : .36,
                color: AppColors.purple,
              ),
              const SizedBox(height: 8),
              const RecommendationCard(
                text:
                    'Gợi ý tại nhà: Chơi trò chọn đồ vật trong 5 phút, khen nỗ lực của bé và dừng lại khi bé mệt.',
              ),
              const SizedBox(height: 12),
              const RecommendationCard(
                text:
                    'Ứng dụng chỉ hỗ trợ phụ huynh đồng hành cùng trẻ tại nhà, không chẩn đoán, không điều trị và không thay thế chuyên gia.',
              ),
              const SizedBox(height: 18),
              const Text(
                'Hoạt động gần đây',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              for (final item in snap.data!.take(5))
                ListTile(
                  leading: const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.primary,
                  ),
                  title: Text(item.lessonId),
                  subtitle: Text('Điểm ${item.score}%'),
                ),
            ],
          );
        },
      ),
    );
  }
}
