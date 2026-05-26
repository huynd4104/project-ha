import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../../../core/utils/access_check.dart';
import '../data/lesson_repository.dart';
import '../widgets/learning_map.dart';

class LearningPathScreen extends StatefulWidget {
  const LearningPathScreen({super.key, this.pathId});
  final String? pathId;

  @override
  State<LearningPathScreen> createState() => _LearningPathScreenState();
}

class _LearningPathScreenState extends State<LearningPathScreen> {
  final repo = LessonRepository();
  late Future<({LearningPlan plan, List<UserProgress> progress})> data;

  @override
  void initState() {
    super.initState();
    data = load();
  }

  Future<({LearningPlan plan, List<UserProgress> progress})> load() async {
    final state = context.read<AppState>();
    final plan = await repo.currentLearningPlan(
      state.appUser!.id,
      state.activeChild!.id,
      pathId: widget.pathId,
    );
    final progress = await repo.progress(
      state.appUser!.id,
      state.activeChild!.id,
    );
    return (plan: plan, progress: progress);
  }

  Lesson? _getCurrentLesson(
    List<Lesson> lessons,
    Set<String> completed,
    SubscriptionSummary? summary,
  ) {
    for (final lesson in lessons) {
      if (!completed.contains(lesson.id)) {
        final hasPremiumAccess = AccessCheck.canAccessContent(
          accessType: lesson.accessType,
          summary: summary,
        );
        if (lesson.accessType == AccessType.premium && !hasPremiumAccess) {
          continue; // Bỏ qua nếu bị khóa Premium
        }
        return lesson;
      }
    }
    return lessons.isNotEmpty ? lessons.first : null;
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final summary = appState.appUser?.subscriptionSummary;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: FutureBuilder(
        future: data,
        builder: (_, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const LoadingView();
          }
          if (snap.hasError) {
            return ErrorView(
              message: '${snap.error}',
              onRetry: () => setState(() => data = load()),
            );
          }
          final value = snap.data!;
          final completed = value.progress
              .where((p) => p.status == 'COMPLETED')
              .map((p) => p.lessonId.replaceAll('_flashcard', ''))
              .toSet();

          final currentLesson = _getCurrentLesson(
            value.plan.lessons,
            completed,
            summary,
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (widget.pathId != null) ...[
                            IconButton(
                              icon: const Icon(Icons.arrow_back_ios_new_rounded),
                              color: AppColors.text,
                              onPressed: () {
                                try {
                                  if (context.canPop()) {
                                    context.pop();
                                  } else {
                                    context.go('/program-paths');
                                  }
                                } catch (e) {
                                  context.go('/program-paths');
                                }
                              },
                            ),
                            const SizedBox(width: 8),
                          ],
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Chặng học của bé',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.text,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  value.plan.title.replaceAll('Lộ trình', 'Chặng').replaceAll('lộ trình', 'chặng'),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (value.plan.usesLegacyFallback)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.orange.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(
                                  AppRadius.md,
                                ),
                              ),
                              child: const Text(
                                'Bản mẫu',
                                style: TextStyle(
                                  color: AppColors.orange,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (currentLesson != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.cream,
                            borderRadius: BorderRadius.circular(AppRadius.lg),
                            border: Border.all(
                              color: AppColors.primary.withOpacity(0.3),
                              width: 2,
                            ),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 22,
                                backgroundColor: AppColors.primary.withOpacity(
                                  0.15,
                                ),
                                child: const Icon(
                                  Icons.play_arrow_rounded,
                                  color: AppColors.primary,
                                  size: 28,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'BÀI HỌC TIẾP THEO',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.primary,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      currentLesson.title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.text,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                onPressed: () =>
                                    context.push('/lesson/${currentLesson.id}'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  elevation: 2,
                                  shadowColor: AppColors.primary.withOpacity(
                                    0.5,
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 10,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                      AppRadius.md,
                                    ),
                                  ),
                                ),
                                child: const Text(
                                  'Học ngay',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: LearningMap(
                  lessons: value.plan.lessons,
                  progress: value.progress,
                  pathItems: value.plan.pathItems,
                  onOpen: (lesson) => context.push('/lesson/${lesson.id}'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
