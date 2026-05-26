import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/error_view.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../state/ai_conversation_controller.dart';
import '../widgets/ai_topic_card.dart';

class AiConversationTopicScreen extends StatefulWidget {
  const AiConversationTopicScreen({super.key});

  @override
  State<AiConversationTopicScreen> createState() =>
      _AiConversationTopicScreenState();
}

class _AiConversationTopicScreenState extends State<AiConversationTopicScreen> {
  late final AiConversationController controller;

  @override
  void initState() {
    super.initState();
    controller = AiConversationController()..loadTopics();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Hội thoại cùng AI')),
    body: AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        if (controller.loading) return const LoadingView();
        if (controller.error != null) {
          return ErrorView(message: controller.error!);
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
          children: [
            Text('Hội thoại cùng AI', style: AppTextStyles.headline),
            const SizedBox(height: 6),
            Text(
              'Con chọn một chủ đề để cùng nói chuyện nhé!',
              style: AppTextStyles.muted.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 18),
            for (final topic in controller.topics)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AiTopicCard(
                  topic: topic,
                  onTap: () => context.push(
                    '/ai-conversations/topics/${topic.id}/intro',
                  ),
                ),
              ),
          ],
        );
      },
    ),
  );
}
