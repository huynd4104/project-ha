import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../data/lesson_repository.dart';
import '../widgets/learning_map.dart';

class LearningPathScreen extends StatefulWidget {
  const LearningPathScreen({super.key});
  @override
  State<LearningPathScreen> createState() => _LearningPathScreenState();
}

class _LearningPathScreenState extends State<LearningPathScreen> {
  final repo = LessonRepository();
  late Future<({List<Lesson> lessons, List<UserProgress> progress})> data;

  @override
  void initState() {
    super.initState();
    data = load();
  }

  Future<({List<Lesson> lessons, List<UserProgress> progress})> load() async {
    final state = context.read<AppState>();
    final lessons = await repo.listLessons(
      state.firebaseUser!.uid,
      state.activeChild!.id,
    );
    final progress = await repo.progress(
      state.firebaseUser!.uid,
      state.activeChild!.id,
    );
    return (lessons: lessons, progress: progress);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Lộ trình học')),
    body: FutureBuilder(
      future: data,
      builder: (_, snap) {
        if (snap.connectionState != ConnectionState.done)
          return const LoadingView();
        if (snap.hasError)
          return ErrorView(
            message: '${snap.error}',
            onRetry: () => setState(() => data = load()),
          );
        final value = snap.data!;
        return LearningMap(
          lessons: value.lessons,
          progress: value.progress,
          onOpen: (lesson) => context.push('/lesson/${lesson.id}'),
        );
      },
    ),
  );
}
