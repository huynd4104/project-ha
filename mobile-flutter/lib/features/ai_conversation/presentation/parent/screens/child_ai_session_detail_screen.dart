import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../core/services/app_state.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../../../core/widgets/error_view.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../data/repositories/ai_conversation_repository.dart';

class ChildAiSessionDetailScreen extends StatelessWidget {
  const ChildAiSessionDetailScreen({super.key, required this.sessionId});

  final String sessionId;

  @override
  Widget build(BuildContext context) {
    final childId = context.watch<AppState>().activeChild!.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Chi tiết phiên')),
      body: FutureBuilder(
        future: AiConversationRepository().sessionDetail(childId, sessionId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingView();
          }
          if (snapshot.hasError) return ErrorView(message: '${snapshot.error}');
          final detail = snapshot.data!;
          final summary = detail.summary;
          return ListView(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
            children: [
              Text(summary.topicTitle, style: AppTextStyles.headline),
              const SizedBox(height: 12),
              AppCard(
                child: Column(
                  children: [
                    _Row(
                      label: 'Thời lượng',
                      value: '${summary.durationSeconds ~/ 60} phút',
                    ),
                    _Row(
                      label: 'Tổng câu hỏi',
                      value: '${summary.totalQuestions}',
                    ),
                    _Row(
                      label: 'Phản hồi tốt',
                      value:
                          '${summary.correctAnswers + summary.partiallyCorrectAnswers}',
                    ),
                    _Row(
                      label: 'Cần luyện thêm',
                      value: '${summary.needsPracticeCount}',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text('Từng câu trả lời', style: AppTextStyles.title),
              const SizedBox(height: 10),
              for (final turn in detail.turns)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          turn.questionText,
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          detail.transcriptVisible
                              ? 'Bé trả lời: ${turn.childTranscript.isEmpty ? "Không có transcript" : turn.childTranscript}'
                              : 'Đã ẩn để bảo vệ quyền riêng tư',
                          style: const TextStyle(color: AppColors.muted),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Kết quả: ${_friendlyResult(turn.evaluationResult)}',
                        ),
                        if (turn.aiFeedback.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text('Feedback: ${turn.aiFeedback}'),
                        ],
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  String _friendlyResult(String result) => switch (result) {
    'CORRECT' => 'Tốt',
    'PARTIALLY_CORRECT' => 'Gần đúng',
    'UNCLEAR' => 'Cần nghe rõ hơn',
    'SKIPPED' => 'Bỏ qua',
    _ => 'Cần luyện thêm',
  };
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Row(
      children: [
        Expanded(child: Text(label)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900)),
      ],
    ),
  );
}
