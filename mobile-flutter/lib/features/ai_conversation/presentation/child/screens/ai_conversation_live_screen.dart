import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:provider/provider.dart';

import '../../../../../core/services/app_state.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/widgets/app_button.dart';
import '../../../../../core/widgets/loading_view.dart';
import '../../../data/repositories/ai_conversation_repository.dart';
import '../../../data/models/ai_conversation_session.dart';
import '../../../data/services/ai_conversation_permission_service.dart';
import '../../../state/ai_conversation_live_controller.dart';
import '../widgets/ai_conversation_feedback_bubble.dart';
import '../widgets/ai_conversation_mascot_panel.dart';
import '../widgets/ai_conversation_mic_button.dart';
import '../widgets/ai_conversation_progress_indicator.dart';
import '../widgets/ai_conversation_question_bubble.dart';
import '../widgets/ai_conversation_timer_bar.dart';

class AiConversationLiveScreen extends StatefulWidget {
  const AiConversationLiveScreen({
    super.key,
    required this.topicId,
    this.preloadedSession,
  });

  final String topicId;
  final AiConversationSession? preloadedSession;

  @override
  State<AiConversationLiveScreen> createState() =>
      _AiConversationLiveScreenState();
}

class _AiConversationLiveScreenState extends State<AiConversationLiveScreen> {
  late final AiConversationLiveController controller;
  Timer? timer;
  int remainingSeconds = 180;
  bool completing = false;

  @override
  void initState() {
    super.initState();
    controller = AiConversationLiveController();
    _start();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (kDebugMode) {
        debugPrint('[AI Conversation Lifecycle] live screen rendered');
      }
      controller.onLiveScreenReady();
    });
  }

  Future<void> _start() async {
    final state = context.read<AppState>();
    final child = state.activeChild;
    final user = state.appUser;
    if (child == null || user == null) return;
    await controller.start(
      userId: user.id,
      childId: child.id,
      topicId: widget.topicId,
      preloadedSession: widget.preloadedSession,
    );
    if (!mounted) return;
    setState(() {
      remainingSeconds = controller.session?.maxDurationSeconds ?? 180;
    });
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (remainingSeconds <= 1) {
        _complete();
      } else {
        setState(() => remainingSeconds -= 1);
      }
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    controller.close();
    controller.dispose();
    super.dispose();
  }

  Future<void> _onMicPressed() async {
    await controller.toggleListening();
    if (!mounted) return;
    setState(() {});
  }

  /// Debug-only transcript input for development testing.
  Future<void> _askDebugTranscript() async {
    final textController = TextEditingController();
    final transcript = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('[DEBUG] Nhập transcript'),
        content: TextField(
          controller: textController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Nhập transcript test',
          ),
          minLines: 1,
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Huỷ'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, textController.text),
            child: const Text('Gửi'),
          ),
        ],
      ),
    );
    if (transcript == null || transcript.trim().isEmpty) return;
    await controller.submitTranscript(transcript);
    if (!mounted) return;
    if (controller.liveState == AiLiveState.completed) {
      await _complete();
    }
  }

  Future<void> _complete() async {
    if (completing) return;
    completing = true;
    timer?.cancel();
    final sessionId = controller.session?.sessionId;
    if (sessionId == null || sessionId.isEmpty) {
      if (mounted) context.go('/ai-conversations/topics');
      return;
    }
    try {
      await AiConversationRepository().completeSession(sessionId);
    } catch (_) {
      // Best effort — navigate to summary regardless
    }
    if (!mounted) return;
    context.go('/ai-conversations/sessions/$sessionId/summary');
  }

  Future<void> _confirmExit() async {
    // Safely stop STT listening before showing the dialog
    await controller.stopListening();
    
    if (!mounted) return;
    
    final exit = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Kết thúc nói chuyện',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
          textAlign: TextAlign.center,
        ),
        content: const Text(
          'Con muốn kết thúc phiên hội thoại này không? Kết quả nói chuyện của con sẽ được lưu lại nhé.',
          style: TextStyle(fontSize: 15, color: Colors.black54),
          textAlign: TextAlign.center,
        ),
        actionsPadding: const EdgeInsets.only(bottom: 16, left: 16, right: 16),
        actions: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    side: BorderSide(color: Colors.grey[300]!),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(
                    'Tiếp tục',
                    style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.orange,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text(
                    'Kết thúc',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );

    if (exit == true) {
      await _complete();
    }
  }

  String _mascotMessage() {
    switch (controller.liveState) {
      case AiLiveState.preparing:
      case AiLiveState.connecting:
        return 'Mascot đang chuẩn bị...';
      case AiLiveState.aiSpeaking:
        return 'Con lắng nghe câu hỏi của mình nhé!';
      case AiLiveState.childTurn:
        return 'Con trả lời câu hỏi nhé.';
      case AiLiveState.listening:
        return 'Con cứ nói nhé, mình đang lắng nghe...';
      case AiLiveState.processing:
        return 'Mình đang suy nghĩ một chút...';
      case AiLiveState.feedback:
        return controller.lastResult?.aiFeedback ?? 'Tốt lắm!';
      case AiLiveState.completed:
        return 'Giỏi lắm! Con đã hoàn thành rồi!';
      case AiLiveState.error:
        return 'Có chút trục trặc nhỏ, con bấm Thử lại để gặp lại mình nhé.';
    }
  }

  String _mascotReaction() {
    switch (controller.liveState) {
      case AiLiveState.aiSpeaking:
        return 'talking';
      case AiLiveState.listening:
        return 'listening carefully';
      case AiLiveState.feedback:
        return controller.lastResult?.isGood == true
            ? 'celebrating'
            : 'encouraging';
      case AiLiveState.completed:
        return 'celebrating';
      case AiLiveState.error:
        return 'worried';
      default:
        return 'idle';
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Hội thoại cùng AI'),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: TextButton.icon(
                onPressed: _confirmExit,
                icon: const Icon(Icons.exit_to_app_rounded, color: AppColors.orange, size: 20),
                label: const Text(
                  'Kết thúc',
                  style: TextStyle(
                    color: AppColors.orange,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
        body: AnimatedBuilder(
          animation: controller,
          builder: (context, _) {
            if (controller.loading) {
              return const LoadingView(
                message: 'Đang chuẩn bị phiên trò chuyện...',
              );
            }
            if (controller.liveState == AiLiveState.error &&
                controller.error != null) {
              if (controller.isPermissionError) {
                return _buildPermissionBlockerView();
              }
              return _buildErrorView();
            }
            if (controller.liveState == AiLiveState.completed) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted && !completing) _complete();
              });
              return const LoadingView(message: 'Đang tổng kết...');
            }
            final question = controller.currentQuestion;
            if (question == null && !controller.loading) {
              return const LoadingView(message: 'Đang tổng kết...');
            }
            return _buildLiveView(question);
          },
        ),
      );

  Widget _buildPermissionBlockerView() {
    final micGranted = controller.micPermissionStatus.isGranted;
    final speechGranted = controller.speechPermissionStatus.isGranted;
    final isSttInitFailed = controller.isSttInitFailed;

    final micPermanentlyDenied = controller.micPermissionStatus.isPermanentlyDenied;
    final speechPermanentlyDenied = controller.speechPermissionStatus.isPermanentlyDenied;

    bool showOpenSettings = false;
    if (!micGranted && micPermanentlyDenied) {
      showOpenSettings = true;
    }
    if (defaultTargetPlatform == TargetPlatform.iOS && !speechGranted && speechPermanentlyDenied) {
      showOpenSettings = true;
    }

    String title = 'Cần quyền Micro';
    String body = 'Ứng dụng cần quyền Micro để nghe con trả lời.\nCon hãy nhờ ba mẹ bật quyền Micro trong Cài đặt nhé.';
    IconData icon = Icons.mic_off_rounded;

    if (isSttInitFailed) {
      title = 'Nhận diện giọng nói chưa sẵn sàng';
      body = 'Ba mẹ hãy kiểm tra cài đặt Nhận diện giọng nói trên thiết bị rồi thử lại.';
      icon = Icons.hearing_disabled_rounded;
    } else if (!micGranted && !speechGranted) {
      title = 'Cần quyền Micro và Nhận diện giọng nói';
      body = 'Ứng dụng cần hai quyền này để bé có thể trả lời bằng giọng nói.\nCon hãy nhờ ba mẹ bật các quyền trong Cài đặt nhé.';
      icon = Icons.security_rounded;
    } else if (!micGranted) {
      title = 'Cần quyền Micro';
      body = 'Ứng dụng cần quyền Micro để nghe con trả lời.\nCon hãy nhờ ba mẹ bật quyền Micro trong Cài đặt nhé.';
      icon = Icons.mic_off_rounded;
    } else if (!speechGranted) {
      title = 'Cần quyền Nhận diện giọng nói';
      body = 'Ứng dụng cần quyền nhận diện giọng nói để chuyển lời bé nói thành chữ.\nCon hãy nhờ ba mẹ bật quyền Nhận diện giọng nói trong Cài đặt nhé.';
      icon = Icons.record_voice_over_rounded;
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Card(
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  icon,
                  size: 72,
                  color: AppColors.orange,
                ),
                const SizedBox(height: 20),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                Text(
                  body,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.grey[700],
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 28),
                if (showOpenSettings && !isSttInitFailed) ...[
                  AppButton(
                    label: 'Mở cài đặt',
                    icon: Icons.settings_rounded,
                    onPressed: () async {
                      await AiConversationPermissionService.openSettings();
                    },
                  ),
                ] else ...[
                  AppButton(
                    label: 'Cho phép lại',
                    icon: isSttInitFailed ? Icons.refresh_rounded : Icons.security_rounded,
                    onPressed: () async {
                      await _start();
                    },
                  ),
                ],
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
                if (kDebugMode) ...[
                  const SizedBox(height: 20),
                  Text(
                    'Gợi ý cho Developer:\nNếu chưa thấy quyền Micro hoặc Nhận diện giọng nói trong Settings, hãy xóa app khỏi máy rồi cài lại bản mới để hệ thống hỏi quyền lại.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFFC2410C),
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildErrorView() => Center(
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
                controller.error!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              AppButton(
                label: 'Thử lại',
                icon: Icons.refresh_rounded,
                onPressed: () {
                  _start();
                },
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _confirmExit,
                child: const Text('Kết thúc phiên'),
              ),
            ],
          ),
        ),
      );

  Widget _buildLiveView(dynamic question) => ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 28),
        children: [
          AiConversationTimerBar(
            remainingSeconds: remainingSeconds,
            totalSeconds:
                controller.session?.maxDurationSeconds ?? 180,
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _StatusChip(
                label: controller.statusLabel,
                state: controller.liveState,
              ),
              AiConversationProgressIndicator(
                current: controller.currentIndex + 1,
                total: controller.questions.length,
              ),
            ],
          ),
          const SizedBox(height: 16),
          AiConversationMascotPanel(
            message: _mascotMessage(),
            reaction: _mascotReaction(),
          ),
          const SizedBox(height: 16),
          if (question != null)
            AiConversationQuestionBubble(
              question: question.questionText,
            ),
          const SizedBox(height: 24),

          // Mic button — primary interaction
          Center(
            child: AiConversationMicButton(
              disabled: !controller.canTapMic || controller.submitting,
              listening: controller.isListening,
              onPressed: _onMicPressed,
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              controller.isListening
                  ? 'Đang nghe con nói. Chạm để dừng.'
                  : controller.canTapMic
                      ? 'Con bấm mic rồi trả lời nhé'
                      : controller.liveState == AiLiveState.aiSpeaking
                          ? 'Con nghe Mascot nói nhé'
                          : controller.liveState == AiLiveState.preparing ||
                                  controller.liveState == AiLiveState.connecting
                              ? 'Mascot đang chuẩn bị...'
                              : controller.liveState == AiLiveState.processing
                                  ? 'Mascot đang suy nghĩ...'
                                  : '',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
            ),
          ),
          const SizedBox(height: 16),

          // Feedback bubble
          if (controller.lastResult != null)
            AiConversationFeedbackBubble(
              text: controller.lastResult!.aiFeedback,
            ),

          const SizedBox(height: 16),

          // Debug transcript input — only in debug mode
          if (kDebugMode) ...[
            OutlinedButton.icon(
              onPressed: controller.submitting
                  ? null
                  : _askDebugTranscript,
              icon: const Icon(Icons.bug_report_rounded, size: 18),
              label: const Text('[DEBUG] Nhập transcript'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 12),
          ],

          AppButton(
            label: 'Con muốn nghỉ',
            icon: Icons.stop_rounded,
            backgroundColor: AppColors.orange,
            onPressed: _confirmExit,
          ),
        ],
      );
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.label, required this.state});

  final String label;
  final AiLiveState state;

  IconData get _icon => switch (state) {
        AiLiveState.aiSpeaking => Icons.volume_up_rounded,
        AiLiveState.listening => Icons.hearing_rounded,
        AiLiveState.processing => Icons.hourglass_top_rounded,
        AiLiveState.feedback => Icons.chat_bubble_rounded,
        AiLiveState.childTurn => Icons.record_voice_over_rounded,
        _ => Icons.fiber_manual_record_rounded,
      };

  Color get _color => switch (state) {
        AiLiveState.listening => AppColors.orange,
        AiLiveState.processing => AppColors.sky,
        AiLiveState.feedback => AppColors.teal,
        _ => AppColors.primary,
      };

  @override
  Widget build(BuildContext context) => Chip(
        avatar: Icon(_icon, size: 18, color: _color),
        label: Text(label, style: TextStyle(color: _color, fontSize: 13)),
        side: BorderSide(color: _color.withValues(alpha: 0.3)),
        backgroundColor: _color.withValues(alpha: 0.08),
      );
}
