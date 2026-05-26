import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class AiConversationMicButton extends StatefulWidget {
  const AiConversationMicButton({
    super.key,
    required this.onPressed,
    this.listening = false,
    this.disabled = false,
  });

  final VoidCallback onPressed;
  final bool listening;
  final bool disabled;

  @override
  State<AiConversationMicButton> createState() =>
      _AiConversationMicButtonState();
}

class _AiConversationMicButtonState extends State<AiConversationMicButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void didUpdateWidget(AiConversationMicButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.listening && !_pulseController.isAnimating) {
      _pulseController.repeat(reverse: true);
    } else if (!widget.listening && _pulseController.isAnimating) {
      _pulseController.stop();
      _pulseController.reset();
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) => Transform.scale(
          scale: widget.listening ? _pulseAnimation.value : 1.0,
          child: Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: widget.listening
                  ? [
                      BoxShadow(
                        color: AppColors.orange.withValues(alpha: 0.4),
                        blurRadius: 24,
                        spreadRadius: 4,
                      ),
                    ]
                  : null,
            ),
            child: ElevatedButton(
              onPressed: widget.disabled ? null : widget.onPressed,
              style: ElevatedButton.styleFrom(
                shape: const CircleBorder(),
                backgroundColor:
                    widget.listening ? AppColors.orange : AppColors.primary,
                foregroundColor: Colors.white,
                padding: EdgeInsets.zero,
              ),
              child: Icon(
                widget.listening
                    ? Icons.hearing_rounded
                    : Icons.mic_rounded,
                size: 42,
              ),
            ),
          ),
        ),
      );
}
