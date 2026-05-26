import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../../core/services/app_state.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../../../core/widgets/error_view.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../data/repositories/ai_conversation_repository.dart';
import '../../../data/models/ai_conversation_topic_progress.dart';

class ChildAiProgressTopicScreen extends StatelessWidget {
  const ChildAiProgressTopicScreen({super.key, required this.topicId});

  final String topicId;

  @override
  Widget build(BuildContext context) {
    final childId = context.watch<AppState>().activeChild!.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Tiến bộ theo chủ đề')),
      body: FutureBuilder<List<AiConversationTopicProgress>>(
        future: AiConversationRepository().topicProgress(childId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingView();
          }
          if (snapshot.hasError) return ErrorView(message: '${snapshot.error}');
          final matches = (snapshot.data ?? const [])
              .where((item) => item.topicId == topicId)
              .toList();
          if (matches.isEmpty) {
            return const Center(child: Text('Chưa có dữ liệu chủ đề này.'));
          }
          final item = matches.first;
          return ListView(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
            children: [
              Text(item.topicTitle, style: AppTextStyles.headline),
              const SizedBox(height: 14),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Row(
                      label: 'Tổng số lần luyện',
                      value: '${item.totalSessions}',
                    ),
                    _Row(
                      label: 'Điểm trung bình',
                      value: '${(item.averageScore * 100).round()}%',
                    ),
                    _Row(
                      label: 'Câu phản hồi tốt',
                      value:
                          '${item.totalCorrect + item.totalPartiallyCorrect}',
                    ),
                    _Row(
                      label: 'Câu cần luyện thêm',
                      value: '${item.totalIncorrect}',
                    ),
                    _Row(
                      label: 'Trạng thái',
                      value: item.needsPractice
                          ? 'Nên luyện thêm'
                          : 'Đang tiến bộ tốt',
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
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
