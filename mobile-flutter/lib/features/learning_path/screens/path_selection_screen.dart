import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../data/lesson_repository.dart';
import '../data/path_recommendation_service.dart';

class PathSelectionScreen extends StatefulWidget {
  const PathSelectionScreen({super.key});

  @override
  State<PathSelectionScreen> createState() => _PathSelectionScreenState();
}

class _PathSelectionScreenState extends State<PathSelectionScreen> {
  late Future<
    ({
      List<LearningPath> paths,
      List<Program> programs,
      Map<LearningGoalKey, List<String>> goalSkillTags,
    })
  >
  _loadDataFuture;
  String? _selectedPathId;
  String? _selectedProgramId;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadDataFuture = _loadData();
  }

  Future<
    ({
      List<LearningPath> paths,
      List<Program> programs,
      Map<LearningGoalKey, List<String>> goalSkillTags,
    })
  >
  _loadData() async {
    final repo = LessonRepository();
    final programs = await repo.programs();
    final paths = await repo.learningPaths()
      ..sort((a, b) => a.title.compareTo(b.title));
    final goalSkillTags = await repo.goalSkillTags();

    return (paths: paths, programs: programs, goalSkillTags: goalSkillTags);
  }

  Future<void> _saveSelection() async {
    if (_selectedPathId == null || _selectedProgramId == null) return;
    setState(() => _isSaving = true);
    try {
      final appState = context.read<AppState>();
      final child = appState.activeChild;
      if (child == null) return;

      // Call repository write
      await appState.childRepository.saveCurrentPath(
        child.id,
        _selectedProgramId!,
        _selectedPathId!,
      );

      // Update local state
      appState.updateActiveChildPath(_selectedProgramId!, _selectedPathId!);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã cập nhật lộ trình học mới cho bé thành công!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi cập nhật lộ trình: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final child = appState.activeChild;

    if (child == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chọn lộ trình học')),
        body: const Center(child: Text('Vui lòng chọn hồ sơ của bé trước.')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Lộ trình của ${child.name}',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
      ),
      body: FutureBuilder(
        future: _loadDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingView();
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: 'Lỗi tải danh sách lộ trình: ${snapshot.error}',
              onRetry: () {
                setState(() {
                  _loadDataFuture = _loadData();
                });
              },
            );
          }

          final data = snapshot.data!;
          final programs = data.programs;
          final paths = data.paths;

          if (paths.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'Hiện chưa có lộ trình nào được xuất bản. Vui lòng quay lại sau.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ),
            );
          }

          // Calculate recommendations
          final recommendations = const PathRecommendationService().recommend(
            child: child,
            programs: programs,
            paths: paths,
            goalSkillTags: data.goalSkillTags,
          );

          // Build a map for easy lookup of programs
          final programMap = {for (final p in programs) p.id: p};

          // Combine and sort: paths that are recommended first (sorted by score descending), then the rest
          final Map<String, int> pathScores = {
            for (final r in recommendations) r.path.id: r.score,
          };

          final sortedPaths = List<LearningPath>.from(paths)
            ..sort((a, b) {
              final scoreA = pathScores[a.id] ?? -1;
              final scoreB = pathScores[b.id] ?? -1;
              if (scoreA != scoreB) {
                return scoreB.compareTo(scoreA); // High score first
              }
              return a.title.compareTo(b.title);
            });

          // Pre-select active path if not selected yet
          if (_selectedPathId == null && child.currentPathId != null) {
            _selectedPathId = child.currentPathId;
            final path = paths.firstWhere(
              (p) => p.id == _selectedPathId,
              orElse: () => paths.first,
            );
            _selectedProgramId = path.programId;
          }

          return Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16.0),
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Lựa chọn lộ trình học tối ưu',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Hệ thống tự động chấm điểm và gợi ý lộ trình dựa trên mục tiêu học, kỹ năng và mức hỗ trợ của bé.',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 12.0,
                  ),
                  itemCount: sortedPaths.length,
                  itemBuilder: (context, index) {
                    final path = sortedPaths[index];
                    final program = programMap[path.programId];
                    final score = pathScores[path.id] ?? 0;
                    final isRecommended = recommendations.any(
                      (r) => r.path.id == path.id && r.score > 0,
                    );
                    final isSelected = _selectedPathId == path.id;
                    final isActivePath = child.currentPathId == path.id;

                    // Detect if this is the absolute top recommended path (highest score)
                    final isTopRecommended =
                        isRecommended &&
                        (recommendations.isNotEmpty &&
                            recommendations.first.path.id == path.id);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedPathId = path.id;
                          _selectedProgramId = path.programId;
                        });
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF0EA5E9) // Sky Blue
                                : Colors.grey[200]!,
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isSelected
                                  ? const Color(0xFF0EA5E9).withOpacity(0.08)
                                  : Colors.black.withOpacity(0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      path.title,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected
                                            ? const Color(0xFF0EA5E9)
                                            : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                  if (isTopRecommended)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF0FDF4),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: const Color(0xFFBBF7D0),
                                        ),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.star,
                                            size: 12,
                                            color: Color(0xFF10B981),
                                          ),
                                          SizedBox(width: 4),
                                          Text(
                                            'Đề xuất tốt nhất',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF10B981),
                                            ),
                                          ),
                                        ],
                                      ),
                                    )
                                  else if (isRecommended)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF0F9FF),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: const Color(0xFFBAE6FD),
                                        ),
                                      ),
                                      child: Text(
                                        'Khuyên dùng ($scoređ)',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF0284C7),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              if (program != null) ...[
                                const SizedBox(height: 6),
                                Text(
                                  'Chương trình: ${program.title}',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 8),
                              Text(
                                path.description,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey[600],
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Divider(color: Colors.grey[100]),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(
                                    Icons.child_care,
                                    size: 16,
                                    color: Colors.grey[500],
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    program != null
                                        ? 'Độ tuổi: ${program.targetAgeMin}-${program.targetAgeMax} tuổi'
                                        : 'Độ tuổi: Mọi lứa tuổi',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                  const Spacer(),
                                  if (isActivePath)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: Colors.grey[300]!,
                                        ),
                                      ),
                                      child: const Text(
                                        'Đang học',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w500,
                                          color: Colors.grey,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              if (program != null &&
                                  program.skillTags.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 6,
                                  children: program.skillTags.take(3).map((
                                    tag,
                                  ) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        '#$tag',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFF475569),
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: ElevatedButton(
                    onPressed: _selectedPathId == null || _isSaving
                        ? null
                        : _saveSelection,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0EA5E9),
                      minimumSize: const Size(double.infinity, 50),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'Lưu & Bắt đầu học',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
