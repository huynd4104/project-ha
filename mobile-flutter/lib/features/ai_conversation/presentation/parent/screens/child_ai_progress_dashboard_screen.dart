import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../../core/services/app_state.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/error_view.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../state/ai_conversation_progress_controller.dart';
import '../widgets/ai_practice_recommendation_card.dart';
import '../widgets/ai_progress_overview_card.dart';
import '../widgets/ai_progress_stat_card.dart';
import '../widgets/ai_session_history_card.dart';
import '../widgets/ai_topic_progress_card.dart';

class ChildAiProgressDashboardScreen extends StatefulWidget {
  const ChildAiProgressDashboardScreen({super.key});

  @override
  State<ChildAiProgressDashboardScreen> createState() =>
      _ChildAiProgressDashboardScreenState();
}

class _ChildAiProgressDashboardScreenState
    extends State<ChildAiProgressDashboardScreen> {
  late final AiConversationProgressController controller;

  @override
  void initState() {
    super.initState();
    controller = AiConversationProgressController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final childId = context.read<AppState>().activeChild?.id;
      if (childId != null) controller.load(childId);
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Tiến bộ hội thoại AI')),
    body: AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        if (controller.loading) {
          return const LoadingView();
        }
        if (controller.error != null) {
          return ErrorView(message: controller.error!);
        }
        final overview = controller.overview;
        final hasData = overview != null &&
            (overview.totalCompletedSessions > 0 ||
                controller.recentSessions.isNotEmpty);
        if (!hasData) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.record_voice_over_rounded,
                    size: 64,
                    color: AppColors.primary.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Chưa có phiên luyện tập nào.\nBé hãy thử Hội thoại cùng AI nhé.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            ),
          );
        }
        final ov = overview;
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
          children: [
            Text('Tiến bộ hội thoại AI', style: AppTextStyles.headline),
            const SizedBox(height: 14),
            AiProgressOverviewCard(overview: ov),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: AiProgressStatCard(
                    label: 'Phiên đã luyện',
                    value: '${ov.totalCompletedSessions}',
                    icon: Icons.check_circle_rounded,
                    color: AppColors.teal,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AiProgressStatCard(
                    label: 'Thời gian',
                    value: '${ov.totalDurationSeconds ~/ 60} phút',
                    icon: Icons.timer_rounded,
                    color: AppColors.sky,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: AiProgressStatCard(
                    label: 'Câu trả lời',
                    value: '${ov.totalAnsweredQuestions}',
                    icon: Icons.question_answer_rounded,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: AiProgressStatCard(
                    label: 'Phản hồi tốt',
                    value: '${(ov.goodResponseRate * 100).round()}%',
                    icon: Icons.trending_up_rounded,
                    color: AppColors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            _SectionTitle(
              title: 'Theo chủ đề',
              action: 'Xem lịch sử',
              onTap: () => context.push('/parent/ai-conversations/sessions'),
            ),
            const SizedBox(height: 10),
            for (final item in controller.topicProgress)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AiTopicProgressCard(
                  progress: item,
                  onTap: () => context.push(
                    '/parent/ai-conversations/topics/${item.topicId}',
                  ),
                ),
              ),
            const SizedBox(height: 8),
            Text('Phiên gần đây', style: AppTextStyles.title),
            const SizedBox(height: 10),
            for (final item in controller.recentSessions.take(3))
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AiSessionHistoryCard(
                  session: item,
                  onTap: () => context.push(
                    '/parent/ai-conversations/sessions/${item.sessionId}',
                  ),
                ),
              ),
            const SizedBox(height: 8),
            Text('Gợi ý luyện tập', style: AppTextStyles.title),
            const SizedBox(height: 10),
            for (final item in controller.recommendations)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AiPracticeRecommendationCard(item: item),
              ),
          ],
        );
      },
    ),
  );
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.action,
    required this.onTap,
  });

  final String title;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(title, style: AppTextStyles.title),
      TextButton(onPressed: onTap, child: Text(action)),
    ],
  );
}
