import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_button.dart';
import '../../../../../core/widgets/error_view.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../data/repositories/ai_conversation_repository.dart';
import '../widgets/ai_conversation_mascot_panel.dart';

class AiConversationSummaryScreen extends StatelessWidget {
  const AiConversationSummaryScreen({super.key, required this.sessionId});

  final String sessionId;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Hoàn thành')),
    body: FutureBuilder(
      future: AiConversationRepository().sessionSummary(sessionId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const LoadingView(message: 'Đang tổng kết...');
        }
        if (snapshot.hasError) return ErrorView(message: '${snapshot.error}');
        final summary = snapshot.data!;
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 26, 18, 28),
          children: [
            const AiConversationMascotPanel(
              message: 'Con đã hoàn thành rồi!',
              reaction: 'lesson complete',
            ),
            const SizedBox(height: 22),
            Text(
              'Con trả lời ${summary.answeredQuestions} câu',
              style: AppTextStyles.headline,
            ),
            const SizedBox(height: 10),
            Text(
              summary.summaryFeedback.isEmpty
                  ? 'Con đã cố gắng rất tốt. Mình cùng luyện tiếp nhé!'
                  : summary.summaryFeedback,
              style: AppTextStyles.subtitle.copyWith(height: 1.35),
            ),
            const SizedBox(height: 28),
            AppButton(
              label: 'Chọn chủ đề khác',
              icon: Icons.apps_rounded,
              onPressed: () => context.go('/ai-conversations/topics'),
            ),
            const SizedBox(height: 12),
            AppButton(
              label: 'Luyện lại',
              icon: Icons.replay_rounded,
              variant: AppButtonVariant.secondary,
              onPressed: () => context.go(
                '/ai-conversations/topics/${summary.topicId}/intro',
              ),
            ),
          ],
        );
      },
    ),
  );
}
