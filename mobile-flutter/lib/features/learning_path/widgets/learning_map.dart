import 'package:flutter/material.dart';

import '../../../core/config/app_config.dart';
import '../../../models/models.dart';
import 'lesson_connector.dart';
import 'lesson_node.dart';

class LearningMap extends StatelessWidget {
  const LearningMap({
    super.key,
    required this.lessons,
    required this.progress,
    required this.onOpen,
  });
  final List<Lesson> lessons;
  final List<UserProgress> progress;
  final ValueChanged<Lesson> onOpen;

  @override
  Widget build(BuildContext context) {
    final completed = progress
        .where((p) => p.status == 'COMPLETED')
        .map((p) => p.lessonId.replaceAll('_flashcard', ''))
        .toSet();
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      itemCount: lessons.length * 2 - 1,
      itemBuilder: (_, index) {
        if (index.isOdd) {
          final before = lessons[index ~/ 2];
          return LessonConnector(completed: completed.contains(before.id));
        }
        final i = index ~/ 2;
        final lesson = lessons[i];
        final state = _state(i, lesson, completed);
        return LessonNode(
          lesson: lesson,
          state: state,
          alignRight: i.isOdd,
          onTap: () => onOpen(lesson),
        );
      },
    );
  }

  LessonNodeState _state(int index, Lesson lesson, Set<String> completed) {
    if (completed.contains(lesson.id)) return LessonNodeState.completed;
    if (AppConfig.allowAllLessonsForDemo)
      return index == 0 ? LessonNodeState.current : LessonNodeState.available;
    if (index == 0) return LessonNodeState.current;
    return completed.contains(lessons[index - 1].id)
        ? LessonNodeState.available
        : LessonNodeState.locked;
  }
}
