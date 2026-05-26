import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_button.dart';
import '../../../data/repositories/ai_conversation_repository.dart';
import '../widgets/ai_conversation_mascot_panel.dart';

class AiConversationIntroScreen extends StatelessWidget {
  const AiConversationIntroScreen({super.key, required this.topicId});

  final String topicId;

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Chuẩn bị')),
    body: FutureBuilder(
      future: AiConversationRepository().topics(),
      builder: (context, snapshot) {
        final topics = snapshot.data ?? const [];
        final matches = topics.where((item) => item.id == topicId).toList();
        final topic = matches.isEmpty ? null : matches.first;
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 26, 18, 28),
          children: [
            const AiConversationMascotPanel(
              message: 'Con hãy nghe câu hỏi và trả lời nhé!',
              reaction: 'welcome',
            ),
            const SizedBox(height: 20),
            Text(
              topic?.title ?? 'Hội thoại cùng AI',
              style: AppTextStyles.headline,
            ),
            const SizedBox(height: 8),
            Text('Khoảng 3 phút', style: AppTextStyles.subtitle),
            const SizedBox(height: 28),
            AppButton(
              label: 'Bắt đầu',
              icon: Icons.play_arrow_rounded,
              onPressed: () =>
                  context.go('/ai-conversations/topics/$topicId/live'),
            ),
          ],
        );
      },
    ),
  );
}
