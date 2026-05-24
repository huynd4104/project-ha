import 'package:flutter/material.dart';

import '../../../core/widgets/progress_bar.dart';

class LessonProgressBar extends StatelessWidget {
  const LessonProgressBar({super.key, required this.value});
  final double value;

  @override
  Widget build(BuildContext context) => ProgressBar(value: value, height: 14);
}
