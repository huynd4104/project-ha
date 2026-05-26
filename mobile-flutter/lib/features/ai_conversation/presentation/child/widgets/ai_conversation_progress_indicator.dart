import 'package:flutter/material.dart';

class AiConversationProgressIndicator extends StatelessWidget {
  const AiConversationProgressIndicator({
    super.key,
    required this.current,
    required this.total,
  });

  final int current;
  final int total;

  @override
  Widget build(BuildContext context) => Text(
    '$current/$total',
    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
  );
}
