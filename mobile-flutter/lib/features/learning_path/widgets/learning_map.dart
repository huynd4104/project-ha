import 'package:flutter/material.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../models/models.dart';
import 'learning_path_connector.dart';
import 'learning_path_section_header.dart';
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
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 32),
      children: [
        const _MapDecor(),
        for (var i = 0; i < lessons.length; i++) ...[
          if (i % 3 == 0)
            LearningPathSectionHeader(title: _sectionTitle(i ~/ 3)),
          LessonNode(
            lesson: lessons[i],
            state: _state(i, lessons[i], completed),
            alignRight: i.isOdd,
            onTap: () => onOpen(lessons[i]),
          ),
          if (i != lessons.length - 1)
            LearningPathConnector(
              completed: completed.contains(lessons[i].id),
              alignRight: i.isOdd,
            ),
        ],
      ],
    );
  }

  String _sectionTitle(int index) {
    const titles = [
      'Bước 1: Làm quen',
      'Bước 2: Luyện nghe',
      'Bước 3: Luyện nói',
      'Bước 4: Giao tiếp hằng ngày',
    ];
    return titles[index.clamp(0, titles.length - 1)];
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

class _MapDecor extends StatelessWidget {
  const _MapDecor();

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: const [
      Icon(Icons.cloud_rounded, color: AppColors.sky, size: 30),
      Icon(Icons.star_rounded, color: AppColors.yellow, size: 26),
      Icon(Icons.eco_rounded, color: AppColors.primary, size: 28),
    ],
  );
}
