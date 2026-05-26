import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../../core/services/app_state.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/error_view.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../data/repositories/ai_conversation_repository.dart';
import '../widgets/ai_session_history_card.dart';

class ChildAiSessionHistoryScreen extends StatelessWidget {
  const ChildAiSessionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final childId = context.watch<AppState>().activeChild!.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Lịch sử hội thoại AI')),
      body: FutureBuilder(
        future: AiConversationRepository().sessionHistory(childId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const LoadingView();
          }
          if (snapshot.hasError) return ErrorView(message: '${snapshot.error}');
          final items = snapshot.data ?? const [];
          return ListView(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 28),
            children: [
              Text('Lịch sử từng phiên', style: AppTextStyles.headline),
              const SizedBox(height: 14),
              if (items.isEmpty)
                const Text('Chưa có phiên hội thoại AI nào.')
              else
                for (final item in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AiSessionHistoryCard(
                      session: item,
                      onTap: () => context.push(
                        '/parent/ai-conversations/sessions/${item.sessionId}',
                      ),
                    ),
                  ),
            ],
          );
        },
      ),
    );
  }
}
