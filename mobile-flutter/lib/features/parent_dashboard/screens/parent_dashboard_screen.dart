import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/domain.dart';
import '../../../models/progress.dart';
import '../../../models/models.dart';
import '../../learning_path/data/lesson_repository.dart';
import 'paywall_screen.dart';
import '../widgets/parent_metric_card.dart';
import '../widgets/recommendation_card.dart';
import '../widgets/skill_progress_card.dart';
import '../widgets/weekly_progress_card.dart';

class _DashboardData {
  final List<UserProgress> history;
  final Map<String, String> lessonTitles;
  final List<_SkillScore> skillScores;

  const _DashboardData({
    required this.history,
    required this.lessonTitles,
    required this.skillScores,
  });
}

class _SkillScore {
  const _SkillScore({
    required this.key,
    required this.label,
    required this.value,
  });

  final String key;
  final String label;
  final double value;
}

class ParentDashboardScreen extends StatelessWidget {
  const ParentDashboardScreen({super.key});

  Future<_DashboardData> _fetchDashboardData(String uid, String childId) async {
    final summary = await LessonRepository().childSummary(childId);
    final history = (summary['history'] as List? ?? const []).map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return UserProgress.fromMap('${map['id']}', map);
    }).toList();

    final lessonTitles = <String, String>{};
    for (final item in summary['lessons'] as List? ?? const []) {
      final map = Map<String, dynamic>.from(item as Map);
      lessonTitles['${map['id']}'] = '${map['title'] ?? ''}';
    }

    return _DashboardData(
      history: history,
      lessonTitles: lessonTitles,
      skillScores: _skillScoresFromAttempts(
        (summary['attempts'] as List? ?? const [])
            .map((item) => Map<String, dynamic>.from(item as Map))
            .toList(),
      ),
    );
  }

  List<_SkillScore> _skillScoresFromAttempts(
    List<Map<String, dynamic>> docs,
  ) {
    final totals = <String, double>{};
    final counts = <String, int>{};
    for (final data in docs) {
      final tags = (data['skillTags'] as List? ?? const [])
          .map((item) => '$item'.trim())
          .where((item) => item.isNotEmpty)
          .toList();
      if (tags.isEmpty) continue;
      final rawScore = data['score'];
      final result = '${data['result'] ?? ''}'.toUpperCase();
      final score = rawScore is num
          ? (rawScore > 1 ? rawScore / 100 : rawScore.toDouble())
          : (result == 'CORRECT' ? 1.0 : 0.0);
      final normalizedScore = score.clamp(0, 1).toDouble();
      for (final tag in tags) {
        totals[tag] = (totals[tag] ?? 0) + normalizedScore;
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }
    final scores =
        totals.entries
            .map(
              (entry) => _SkillScore(
                key: entry.key,
                label: skillLabel(entry.key),
                value: entry.value / (counts[entry.key] ?? 1),
              ),
            )
            .toList()
          ..sort((a, b) => a.label.compareTo(b.label));
    return scores;
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      body: FutureBuilder<_DashboardData>(
        future: _fetchDashboardData(
          state.appUser!.id,
          state.activeChild!.id,
        ),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          final data = snap.data!;
          final completed = data.history
              .where(
                (e) =>
                    e.status == 'COMPLETED' &&
                    !e.lessonId.endsWith('_flashcard'),
              )
              .length;
          return ListView(
            padding: const EdgeInsets.fromLTRB(18, 56, 18, 24),
            children: [
              Text('Bảng phụ huynh', style: AppTextStyles.headline),
              const SizedBox(height: 4),
              Text(
                state.activeChild?.name ?? 'Hồ sơ bé',
                style: AppTextStyles.muted.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              _buildSubscriptionBanner(context, state.appUser?.subscriptionSummary),
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
                      color: AppColors.pink,
                      icon: Icons.local_fire_department_rounded,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              WeeklyProgressCard(completed: completed),
              const SizedBox(height: 18),
              Text('Kỹ năng', style: AppTextStyles.title),
              const SizedBox(height: 10),
              if (data.skillScores.isEmpty)
                AppCard(
                  color: Colors.grey[50]!,
                  borderColor: AppColors.border,
                  child: const Center(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 24.0, horizontal: 16.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.bar_chart_rounded,
                            color: AppColors.muted,
                            size: 48,
                          ),
                          SizedBox(height: 12),
                          Text(
                            'Chưa đủ dữ liệu phân tích',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: AppColors.text,
                            ),
                          ),
                          SizedBox(height: 6),
                          Text(
                            'Bé cần hoàn thành các bài học và hoạt động tự do để Mimi thu thập dữ liệu tiến độ.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.muted,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ...data.skillScores.take(5).map((skill) {
                  final colors = [
                    AppColors.primary,
                    AppColors.sky,
                    AppColors.pink,
                    AppColors.teal,
                    AppColors.orange,
                  ];
                  final color =
                      colors[data.skillScores.indexOf(skill) % colors.length];
                  return SkillProgressCard(
                    title: skill.label,
                    value: skill.value,
                    color: color,
                  );
                }),
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
              ...data.history.take(5).map((item) {
                final cleanId = item.lessonId.replaceAll('_flashcard', '');
                final lessonTitle = data.lessonTitles[cleanId] ?? item.lessonId;
                final isFlashcard = item.lessonId.endsWith('_flashcard');
                final titleText = isFlashcard
                    ? 'Ôn tập thẻ học: $lessonTitle'
                    : lessonTitle;
                return ListTile(
                  leading: const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.primary,
                  ),
                  title: Text(titleText),
                  subtitle: Text('Điểm ${item.score}%'),
                );
              }),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSubscriptionBanner(BuildContext context, SubscriptionSummary? summary) {
    final plan = summary?.plan ?? 'FREE';
    final status = summary?.status ?? 'NONE';
    final expiresAt = summary?.expiresAt;

    final bool isExpired = expiresAt != null && expiresAt.isBefore(DateTime.now());
    final bool isPremium = (plan == 'PREMIUM' || plan == 'TRIAL') && status == 'ACTIVE' && !isExpired;

    final String planLabel = plan == 'TRIAL' ? 'Dùng thử (TRIAL)' : (plan == 'PREMIUM' ? 'PREMIUM (Demo)' : 'FREE');
    final String dateStr = expiresAt != null ? '${expiresAt.day}/${expiresAt.month}/${expiresAt.year}' : 'Không giới hạn';

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isPremium ? Icons.workspace_premium_rounded : Icons.star_border_rounded,
                color: isPremium ? AppColors.yellow : AppColors.muted,
                size: 28,
              ),
              const SizedBox(width: 8),
              Text(
                'Gói dịch vụ: $planLabel',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.text),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (isPremium) ...[
            const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: AppColors.success, size: 16),
                SizedBox(width: 6),
                Text(
                  'Đang hoạt động',
                  style: TextStyle(fontSize: 14, color: AppColors.success, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Ngày hết hạn: $dateStr',
              style: const TextStyle(fontSize: 13, color: AppColors.muted),
            ),
          ] else ...[
            const Text(
              'Gói miễn phí giới hạn một số tính năng và nội dung nâng cao.',
              style: TextStyle(fontSize: 13, color: AppColors.muted, height: 1.4),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const PaywallScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.orange,
                foregroundColor: Colors.white,
                minimumSize: const Size(double.infinity, 44),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Nâng cấp Premium ngay'),
            ),
          ],
        ],
      ),
    );
  }
}
