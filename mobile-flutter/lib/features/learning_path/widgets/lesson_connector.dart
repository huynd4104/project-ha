import 'package:flutter/material.dart';

import 'learning_path_connector.dart';

class LessonConnector extends StatelessWidget {
  const LessonConnector({super.key, required this.completed});
  final bool completed;

  @override
  Widget build(BuildContext context) =>
      LearningPathConnector(completed: completed, alignRight: false);
}
