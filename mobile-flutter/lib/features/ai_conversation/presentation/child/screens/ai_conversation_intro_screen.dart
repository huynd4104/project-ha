import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:permission_handler/permission_handler.dart';

import '../../../../../core/services/app_state.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_button.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../data/repositories/ai_conversation_repository.dart';
import '../../../data/services/ai_conversation_permission_service.dart';
import '../widgets/ai_conversation_mascot_panel.dart';

class AiConversationIntroScreen extends StatefulWidget {
  const AiConversationIntroScreen({super.key, required this.topicId});

  final String topicId;

  @override
  State<AiConversationIntroScreen> createState() => _AiConversationIntroScreenState();
}

class _AiConversationIntroScreenState extends State<AiConversationIntroScreen> {
  bool _isLoading = false;
  String? _error;

  Future<void> _startSessionAndNavigate() async {
    // Fetch user/child IDs before async gaps
    final appState = context.read<AppState>();
    final child = appState.activeChild;
    final user = appState.appUser;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (kDebugMode) {
        debugPrint('[AI Conversation Lifecycle] prepareSession started');
      }

      // 1. Check & request Microphone permission first
      var micStatus = await AiConversationPermissionService.getMicrophoneStatus();
      if (!micStatus.isGranted) {
        micStatus = await AiConversationPermissionService.requestMicrophone();
        if (!micStatus.isGranted) {
          throw StateError('Con cần cho phép quyền Micro để nói chuyện cùng Mascot nhé.');
        }
      }

      // 2. Check & request Speech Recognition permission (only on iOS)
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        var speechStatus = await AiConversationPermissionService.getSpeechStatus();
        if (!speechStatus.isGranted) {
          speechStatus = await AiConversationPermissionService.requestSpeech();
          if (!speechStatus.isGranted) {
            throw StateError('Con cần cho phép quyền Nhận diện giọng nói để tiếp tục nhé.');
          }
        }
      }

      if (child == null || user == null) {
        throw StateError('Không tìm thấy thông tin tài khoản.');
      }

      // 4. Call backend start session
      final session = await AiConversationRepository().startSession(
        userId: user.id,
        childId: child.id,
        topicId: widget.topicId,
      );

      if (kDebugMode) {
        debugPrint('[AI Conversation Lifecycle] prepareSession completed');
      }

      if (!mounted) {
        if (kDebugMode) {
          debugPrint('[AI Conversation Lifecycle] disposed before navigate');
        }
        return;
      }

      if (kDebugMode) {
        debugPrint('[AI Conversation Lifecycle] navigating to live screen');
      }

      // 5. Navigate to Live Screen passing the session
      context.go('/ai-conversations/topics/${widget.topicId}/live', extra: session);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[AI Conversation Lifecycle] Error: $e');
      }
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString().contains('Cần quyền') || e.toString().contains('cho phép')
              ? e.toString().replaceAll('Exception: ', '').replaceAll('StateError: ', '')
              : 'Không kết nối được. Con bấm Thử lại để kết nối lại nhé.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: LoadingView(
          message: 'Đang chuẩn bị phiên trò chuyện...',
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chuẩn bị')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  size: 64,
                  color: AppColors.orange,
                ),
                const SizedBox(height: 16),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 24),
                AppButton(
                  label: 'Thử lại',
                  icon: Icons.refresh_rounded,
                  onPressed: _startSessionAndNavigate,
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () {
                    context.go('/ai-conversations/topics');
                  },
                  icon: const Icon(Icons.arrow_back_rounded, size: 18),
                  label: const Text('Quay lại'),
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(50),
                    foregroundColor: AppColors.text,
                    side: const BorderSide(color: AppColors.border, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Chuẩn bị')),
      body: FutureBuilder(
        future: AiConversationRepository().topics(),
        builder: (context, snapshot) {
          final topics = snapshot.data ?? const [];
          final matches = topics.where((item) => item.id == widget.topicId).toList();
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
                onPressed: _startSessionAndNavigate,
              ),
            ],
          );
        },
      ),
    );
  }
}
