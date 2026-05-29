import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../data/lesson_repository.dart';

enum PathNodeState { completed, active, available, locked }

class ProgramPathsMapScreen extends StatefulWidget {
  const ProgramPathsMapScreen({super.key});

  @override
  State<ProgramPathsMapScreen> createState() => _ProgramPathsMapScreenState();
}

class _ProgramPathsMapScreenState extends State<ProgramPathsMapScreen> {
  final repo = LessonRepository();
  late Future<
    ({
      List<LearningPath> paths,
      List<UserProgress> progress,
      Program? program,
      Map<String, List<Lesson>> pathLessons,
    })
  >
  _loadDataFuture;

  @override
  void initState() {
    super.initState();
    _loadDataFuture = _loadData();
  }

  void _goBack(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.of(context).pop();
    } else {
      context.go('/home');
    }
  }

  Future<
    ({
      List<LearningPath> paths,
      List<UserProgress> progress,
      Program? program,
      Map<String, List<Lesson>> pathLessons,
    })
  >
  _loadData() async {
    final state = context.read<AppState>();
    final child = state.activeChild!;

    final allPaths = await repo.learningPaths();
    final progress = await repo.progress(state.appUser!.id, child.id);
    final programs = await repo.programs();

    final program = programs.firstWhere(
      (p) => p.id == child.currentProgramId,
      orElse: () => programs.first,
    );

    // Filter paths of this program
    final paths = allPaths
        .where((p) => p.programId == child.currentProgramId)
        .toList()
      ..sort((a, b) => a.title.compareTo(b.title));

    // For each path, load its lessons to determine completion
    final Map<String, List<Lesson>> pathLessons = {};
    for (final path in paths) {
      final plan = await repo.currentLearningPlan(
        state.appUser!.id,
        child.id,
        pathId: path.id,
      );
      pathLessons[path.id] = plan.lessons;
    }

    return (
      paths: paths,
      progress: progress,
      program: program,
      pathLessons: pathLessons,
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final child = appState.activeChild;

    if (child == null || child.currentProgramId == null || child.currentProgramId!.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Chương trình học của bé'),
          leadingWidth: 64,
          leading: Padding(
            padding: const EdgeInsets.only(left: 12.0),
            child: Center(
              child: AppIconButton(
                icon: Icons.arrow_back_ios_new_rounded,
                tooltip: 'Trở lại',
                onPressed: () => _goBack(context),
              ),
            ),
          ),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.text,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Bé chưa chọn chương trình học.',
                style: TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => context.push('/program-selection'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Chọn chương trình ngay', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: FutureBuilder(
        future: _loadDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingView();
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: 'Lỗi tải chặng học: ${snapshot.error}',
              onRetry: () {
                setState(() {
                  _loadDataFuture = _loadData();
                });
              },
            );
          }

          final data = snapshot.data!;
          final paths = data.paths;
          final progress = data.progress;
          final program = data.program;
          final pathLessons = data.pathLessons;

          if (paths.isEmpty) {
            return Scaffold(
              appBar: AppBar(
                title: const Text('Chặng học'),
                leadingWidth: 64,
                leading: Padding(
                  padding: const EdgeInsets.only(left: 12.0),
                  child: Center(
                    child: AppIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      tooltip: 'Trở lại',
                      onPressed: () => _goBack(context),
                    ),
                  ),
                ),
                backgroundColor: Colors.white,
                foregroundColor: AppColors.text,
                elevation: 0,
              ),
              body: const Center(
                child: Text('Chương trình này chưa có chặng học nào được xuất bản.'),
              ),
            );
          }

          final completedLessons = progress
              .where((p) => p.status == 'COMPLETED')
              .map((p) => p.lessonId.replaceAll('_flashcard', ''))
              .toSet();

          // Determine status for each path
          final Map<String, PathNodeState> pathStates = {};
          bool previousCompleted = true;

          for (var i = 0; i < paths.length; i++) {
            final path = paths[i];
            final lessons = pathLessons[path.id] ?? const [];
            
            // Check if path is completed
            final isPathCompleted = lessons.isNotEmpty &&
                lessons.every((l) => completedLessons.contains(l.id));

            if (isPathCompleted) {
              pathStates[path.id] = PathNodeState.completed;
            } else if (child.currentPathId == path.id) {
              pathStates[path.id] = PathNodeState.active;
            } else if (previousCompleted) {
              pathStates[path.id] = PathNodeState.available;
            } else {
              pathStates[path.id] = PathNodeState.locked;
            }

            previousCompleted = isPathCompleted;
          }

          return CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverAppBar(
                expandedHeight: 140,
                floating: false,
                pinned: true,
                automaticallyImplyLeading: false,
                leadingWidth: 64,
                leading: Padding(
                  padding: const EdgeInsets.only(left: 12.0),
                  child: Center(
                    child: AppIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      tooltip: 'Trở lại',
                      onPressed: () => _goBack(context),
                    ),
                  ),
                ),
                backgroundColor: AppColors.primary,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    program?.title ?? 'Chương trình của bé',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.white,
                    ),
                  ),
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.primary, Color(0xFF3B82F6)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                      ),
                      Positioned(
                        right: -30,
                        top: -10,
                        child: Icon(
                          Icons.insights_rounded,
                          size: 150,
                          color: Colors.white.withOpacity(0.08),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const CircleAvatar(
                          backgroundColor: Color(0xFFEFF6FF),
                          child: Icon(Icons.explore_rounded, color: AppColors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Bản đồ chặng đường học',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Bé hãy vượt qua từng chặng học để làm chủ kiến thức nhé!',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 10, 24, 48),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    _buildWindingMap(paths, pathStates, pathLessons, completedLessons),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _buildWindingMap(
    List<LearningPath> paths,
    Map<String, PathNodeState> pathStates,
    Map<String, List<Lesson>> pathLessons,
    Set<String> completedLessons,
  ) {
    final widgets = <Widget>[];

    // Map title decorations
    widgets.add(
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: const [
          Icon(Icons.cloud_rounded, color: Colors.white, size: 28),
          Icon(Icons.wb_sunny_rounded, color: AppColors.yellow, size: 24),
          Icon(Icons.cloud_rounded, color: Colors.white, size: 32),
        ],
      ).animate().fadeIn().scale(),
    );
    widgets.add(const SizedBox(height: 20));

    for (var i = 0; i < paths.length; i++) {
      final path = paths[i];
      final state = pathStates[path.id] ?? PathNodeState.locked;
      final lessons = pathLessons[path.id] ?? const [];
      final doneCount = lessons.where((l) => completedLessons.contains(l.id)).length;
      final totalCount = lessons.length;
      
      final alignRight = i % 2 == 1;

      widgets.add(
        _PathItemNode(
          path: path,
          state: state,
          doneCount: doneCount,
          totalCount: totalCount,
          alignRight: alignRight,
          index: i + 1,
          onTap: () {
            context.push('/learning-path/${path.id}');
          },
        ),
      );

      // Draw custom painted connector to the next node
      if (i != paths.length - 1) {
        final nextPath = paths[i + 1];
        final nextState = pathStates[nextPath.id] ?? PathNodeState.locked;
        final isCompletedConnector = state == PathNodeState.completed && nextState != PathNodeState.locked;

        widgets.add(
          _PathMapConnector(
            completed: isCompletedConnector,
            alignRight: alignRight,
          ),
        );
      }
    }

    return widgets;
  }
}

class _PathItemNode extends StatelessWidget {
  const _PathItemNode({
    required this.path,
    required this.state,
    required this.doneCount,
    required this.totalCount,
    required this.alignRight,
    required this.index,
    required this.onTap,
  });

  final LearningPath path;
  final PathNodeState state;
  final int doneCount;
  final int totalCount;
  final bool alignRight;
  final int index;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = switch (state) {
      PathNodeState.completed => const Color(0xFF10B981), // Green
      PathNodeState.active => const Color(0xFF0EA5E9), // Sky Blue
      PathNodeState.available => const Color(0xFFF59E0B), // Yellow/Orange
      PathNodeState.locked => const Color(0xFF94A3B8), // Grey
    };

    final stateText = switch (state) {
      PathNodeState.completed => 'Đã hoàn thành',
      PathNodeState.active => 'Đang học chặng này',
      PathNodeState.available => 'Sẵn sàng học',
      PathNodeState.locked => 'Chưa mở khóa',
    };

    final nodeWidget = GestureDetector(
      onTap: state == PathNodeState.locked ? null : onTap,
      child: Container(
        width: 140,
        height: 140,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(
            color: color,
            width: state == PathNodeState.active ? 6 : 4,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(state == PathNodeState.active ? 0.35 : 0.15),
              blurRadius: state == PathNodeState.active ? 20 : 10,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Internal background gradient for active/completed nodes
            Container(
              margin: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: state == PathNodeState.locked
                      ? [Colors.grey[100]!, Colors.grey[200]!]
                      : [color.withOpacity(0.05), color.withOpacity(0.15)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  state == PathNodeState.completed
                      ? Icons.emoji_events_rounded
                      : state == PathNodeState.locked
                      ? Icons.lock_rounded
                      : Icons.map_rounded,
                  color: color,
                  size: 38,
                ),
                const SizedBox(height: 6),
                Text(
                  'CHẶNG $index',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                    color: color,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$doneCount/$totalCount bài',
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );

    final infoWidget = SizedBox(
      width: 160,
      child: Column(
        crossAxisAlignment: alignRight ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Text(
            path.title.replaceAll('Lộ trình', 'Chặng').replaceAll('lộ trình', 'chặng'),
            textAlign: alignRight ? TextAlign.right : TextAlign.left,
            style: const TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 16,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            stateText,
            textAlign: alignRight ? TextAlign.right : TextAlign.left,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 12,
              color: color,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            path.description,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: alignRight ? TextAlign.right : TextAlign.left,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[500],
              height: 1.3,
            ),
          ),
        ],
      ),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: alignRight
            ? [
                infoWidget,
                state == PathNodeState.active
                    ? nodeWidget
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 1000.ms)
                    : nodeWidget,
              ]
            : [
                state == PathNodeState.active
                    ? nodeWidget
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 1000.ms)
                    : nodeWidget,
                infoWidget,
              ],
      ),
    );
  }
}

class _PathMapConnector extends StatelessWidget {
  const _PathMapConnector({
    required this.completed,
    required this.alignRight,
  });

  final bool completed;
  final bool alignRight;

  @override
  Widget build(BuildContext context) => Container(
        height: 80,
        margin: const EdgeInsets.symmetric(vertical: 4),
        child: CustomPaint(
          painter: _PathConnectorPainter(
            color: completed ? const Color(0xFF10B981) : const Color(0xFFCBD5E1),
            alignRight: alignRight,
          ),
          child: const SizedBox.expand(),
        ),
      );
}

class _PathConnectorPainter extends CustomPainter {
  const _PathConnectorPainter({required this.color, required this.alignRight});

  final Color color;
  final bool alignRight;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final dashPaint = Paint()
      ..color = color
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final startX = alignRight ? size.width * .80 : size.width * .20;
    final endX = alignRight ? size.width * .20 : size.width * .80;

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

    // Draw dashed lines for lock connectors, solid for completed ones
    if (color == const Color(0xFFCBD5E1)) {
      final pathMetrics = path.computeMetrics();
      for (final metric in pathMetrics) {
        double distance = 0.0;
        const dashLength = 8.0;
        const spaceLength = 8.0;
        while (distance < metric.length) {
          final extractPath = metric.extractPath(distance, distance + dashLength);
          canvas.drawPath(extractPath, dashPaint);
          distance += dashLength + spaceLength;
        }
      }
    } else {
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _PathConnectorPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.alignRight != alignRight;
}
