import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class LearningPathConnector extends StatelessWidget {
  const LearningPathConnector({
    super.key,
    required this.completed,
    required this.alignRight,
  });
  final bool completed;
  final bool alignRight;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 62,
    child: CustomPaint(
      painter: _ConnectorPainter(
        color: completed ? AppColors.primary : AppColors.border,
        alignRight: alignRight,
      ),
      child: const SizedBox.expand(),
    ),
  );
}

class _ConnectorPainter extends CustomPainter {
  const _ConnectorPainter({required this.color, required this.alignRight});
  final Color color;
  final bool alignRight;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    final startX = alignRight ? size.width * .74 : size.width * .26;
    final endX = alignRight ? size.width * .26 : size.width * .74;
    final path = Path()
      ..moveTo(startX, 0)
      ..cubicTo(
        startX,
        size.height * .45,
        endX,
        size.height * .55,
        endX,
        size.height,
      );
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _ConnectorPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.alignRight != alignRight;
}
