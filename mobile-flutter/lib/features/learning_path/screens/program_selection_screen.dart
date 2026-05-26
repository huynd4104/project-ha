import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/error_view.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../core/utils/access_check.dart';
import '../../../models/models.dart';
import '../data/lesson_repository.dart';
import '../data/program_recommendation_service.dart';
import '../../parent_dashboard/screens/paywall_screen.dart';

class ProgramSelectionScreen extends StatefulWidget {
  const ProgramSelectionScreen({super.key});

  @override
  State<ProgramSelectionScreen> createState() => _ProgramSelectionScreenState();
}

class _ProgramSelectionScreenState extends State<ProgramSelectionScreen> {
  late Future<
    ({
      List<LearningPath> paths,
      List<Program> programs,
    })
  >
  _loadDataFuture;
  String? _selectedProgramId;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadDataFuture = _loadData();
  }

  void _goBack() {
    if (Navigator.canPop(context)) {
      Navigator.of(context).pop();
    } else {
      context.go('/home');
    }
  }

  Future<void> _openPremiumUpgradePanel() async {
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 24,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7ED),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.workspace_premium_rounded,
                      color: Color(0xFFEA580C),
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Chương trình này cần Premium',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Tài khoản hiện tại chưa mở khóa gói Premium để bắt đầu học chương trình này. Bạn có thể nâng cấp ngay để tiếp tục.',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.45,
                      color: Color(0xFF475569),
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(sheetContext).pop();
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const PaywallScreen(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEA580C),
                        foregroundColor: Colors.white,
                        minimumSize: const Size(double.infinity, 48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Nâng cấp premium',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton(
                      onPressed: () => Navigator.of(sheetContext).pop(),
                      child: const Text(
                        'Để sau',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  bool _hasProgramAccess(Program program, SubscriptionSummary? summary) {
    if (program.accessType == AccessType.free) return true;
    return AccessCheck.canAccessContent(
      accessType: program.accessType,
      summary: summary,
    );
  }

  Widget _buildMetaBadge({
    required IconData icon,
    required String label,
    required Color backgroundColor,
    required Color borderColor,
    required Color foregroundColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: foregroundColor),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: foregroundColor,
            ),
          ),
        ],
      ),
    );
  }

  Future<
    ({
      List<LearningPath> paths,
      List<Program> programs,
    })
  >
  _loadData() async {
    final repo = LessonRepository();
    final programs = await repo.programs();
    final paths = await repo.learningPaths();
    return (paths: paths, programs: programs);
  }

  Future<void> _saveSelection(List<LearningPath> paths, List<Program> programs) async {
    if (_selectedProgramId == null) return;
    final selectedProgram = programs.firstWhere(
      (program) => program.id == _selectedProgramId,
      orElse: () => programs.first,
    );
    final summary = context.read<AppState>().appUser?.subscriptionSummary;
    if (selectedProgram.accessType == AccessType.premium &&
        !_hasProgramAccess(selectedProgram, summary)) {
      await _openPremiumUpgradePanel();
      return;
    }
    setState(() => _isSaving = true);
    try {
      final appState = context.read<AppState>();
      final child = appState.activeChild;
      if (child == null) return;

      // Find paths belonging to the selected program
      final programPaths = paths.where((p) => p.programId == _selectedProgramId).toList()
        ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));

      if (programPaths.isEmpty) {
        throw Exception('Chương trình này chưa cấu hình lộ trình học. Vui lòng chọn chương trình khác.');
      }

      // Check if child already has a path in this program to keep progress
      String targetPathId = programPaths.first.id;
      if (child.currentProgramId == _selectedProgramId && child.currentPathId != null) {
        final hasPath = programPaths.any((p) => p.id == child.currentPathId);
        if (hasPath) {
          targetPathId = child.currentPathId!;
        }
      }

      // Call repository write
      await appState.childRepository.saveCurrentPath(
        child.id,
        _selectedProgramId!,
        targetPathId,
      );

      // Update local state
      appState.updateActiveChildPath(_selectedProgramId!, targetPathId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã cập nhật chương trình học mới cho bé thành công!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        try {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/home');
          }
        } catch (e) {
          context.go('/home');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi cập nhật chương trình: $e'),
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
        appBar: AppBar(
          title: const Text('Chọn chương trình học'),
          leadingWidth: 64,
          leading: Padding(
            padding: const EdgeInsets.only(left: 12.0),
            child: Center(
              child: AppIconButton(
                icon: Icons.arrow_back_ios_new_rounded,
                tooltip: 'Trở lại',
                onPressed: _goBack,
              ),
            ),
          ),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF1E293B),
          elevation: 0,
        ),
        body: const Center(child: Text('Vui lòng chọn hồ sơ của bé trước.')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Chương trình của ${child.name}',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
        leadingWidth: 64,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12.0),
          child: Center(
            child: AppIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              tooltip: 'Trở lại',
              onPressed: _goBack,
            ),
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
              message: 'Lỗi tải danh sách chương trình: ${snapshot.error}',
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

          if (programs.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'Hiện chưa có chương trình nào được xuất bản. Vui lòng quay lại sau.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ),
            );
          }

          // Calculate recommendations
          final recommendations = const ProgramRecommendationService().recommend(
            child: child,
            programs: programs,
          );

          final Map<String, int> programScores = {
            for (final r in recommendations) r.program.id: r.score,
          };

          // Combine and sort: programs that are recommended first (sorted by score descending), then the rest
          final sortedPrograms = List<Program>.from(programs)
            ..sort((a, b) {
              final scoreA = programScores[a.id] ?? -1;
              final scoreB = programScores[b.id] ?? -1;
              if (scoreA != scoreB) {
                return scoreB.compareTo(scoreA); // High score first
              }
              return a.title.compareTo(b.title);
            });

          // Pre-select active program if not selected yet
          if (_selectedProgramId == null && child.currentProgramId != null) {
            _selectedProgramId = child.currentProgramId;
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
                      'Lựa chọn chương trình học tối ưu',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Hệ thống gợi ý chương trình học phù hợp nhất dựa trên mục tiêu học tập, kỹ năng và mức hỗ trợ của bé.',
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
                  itemCount: sortedPrograms.length,
                  itemBuilder: (context, index) {
                    final program = sortedPrograms[index];
                    final score = programScores[program.id] ?? 0;
                    final isRecommended = recommendations.any(
                      (r) => r.program.id == program.id && r.score > 0,
                    );
                    final isSelected = _selectedProgramId == program.id;
                    final isActiveProgram = child.currentProgramId == program.id;
                    final hasPremiumAccess = _hasProgramAccess(
                      program,
                      appState.appUser?.subscriptionSummary,
                    );
                    final isPremiumLocked =
                        program.accessType == AccessType.premium &&
                        !hasPremiumAccess;

                    // Detect if this is the absolute top recommended program (highest score)
                    final isTopRecommended =
                        isRecommended &&
                        (recommendations.isNotEmpty &&
                            recommendations.first.program.id == program.id);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedProgramId = program.id;
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
                                      program.title,
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
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _buildMetaBadge(
                                    icon: Icons.signal_cellular_alt_rounded,
                                    label: 'Cấp độ: ${program.level.label}',
                                    backgroundColor: const Color(0xFFF8FAFC),
                                    borderColor: const Color(0xFFE2E8F0),
                                    foregroundColor: const Color(0xFF334155),
                                  ),
                                  _buildMetaBadge(
                                    icon: program.accessType == AccessType.premium
                                        ? Icons.workspace_premium_rounded
                                        : Icons.lock_open_rounded,
                                    label: 'Loại truy cập: ${program.accessType.label}',
                                    backgroundColor: program.accessType == AccessType.premium
                                        ? (isPremiumLocked
                                            ? const Color(0xFFFFF7ED)
                                            : const Color(0xFFF3E8FF))
                                        : const Color(0xFFE0F2FE),
                                    borderColor: program.accessType == AccessType.premium
                                        ? (isPremiumLocked
                                            ? const Color(0xFFFED7AA)
                                            : const Color(0xFFE9D5FF))
                                        : const Color(0xFFBAE6FD),
                                    foregroundColor: program.accessType == AccessType.premium
                                        ? (isPremiumLocked
                                            ? const Color(0xFFEA580C)
                                            : const Color(0xFF7E22CE))
                                        : const Color(0xFF0369A1),
                                  ),
                                ],
                              ),
                              if (isPremiumLocked) ...[
                                const SizedBox(height: 10),
                                const Text(
                                  'Cần nâng cấp Premium để bắt đầu học chương trình này.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFFEA580C),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 8),
                              Text(
                                program.description,
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
                                    'Độ tuổi: ${program.targetAgeMin}-${program.targetAgeMax} tuổi',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                  const Spacer(),
                                  if (isActiveProgram)
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
                              if (program.skillTags.isNotEmpty) ...[
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
                                        '#${skillLabel(tag)}',
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
                    onPressed: _selectedProgramId == null || _isSaving
                      ? null
                      : () => _saveSelection(paths, sortedPrograms),
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
