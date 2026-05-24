import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/progress.dart';

class ParentDashboardScreen extends StatelessWidget {
  const ParentDashboardScreen({super.key});

  Future<List<UserProgress>> _history(String uid, String childId) async {
    final snap = await FirebaseFirestore.instance
        .collection('progress')
        .where('userId', isEqualTo: uid)
        .where('childId', isEqualTo: childId)
        .get();
    return snap.docs
        .map((doc) => UserProgress.fromMap(doc.id, doc.data()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Phụ huynh')),
      body: FutureBuilder(
        future: _history(state.firebaseUser!.uid, state.activeChild!.id),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          final completed = snap.data!
              .where(
                (e) =>
                    e.status == 'COMPLETED' &&
                    !e.lessonId.endsWith('_flashcard'),
              )
              .length;
          return ListView(
            padding: const EdgeInsets.all(18),
            children: [
              const Text(
                'Tổng quan hôm nay',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _Metric(
                      label: 'Bài hoàn thành',
                      value: '$completed',
                      color: AppColors.sky,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _Metric(
                      label: 'Level',
                      value: '${state.levelStats.level}',
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _Metric(
                      label: 'XP',
                      value: '${state.levelStats.totalXp}',
                      color: AppColors.orange,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _Metric(
                      label: 'Streak',
                      value: '${state.streak?.currentStreak ?? 0}',
                      color: AppColors.purple,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const AppCard(
                color: Color(0xFFFFFBEB),
                child: Text(
                  'Gợi ý: Chọn một khung giờ ngắn 5-10 phút mỗi ngày, khen nỗ lực của bé và dừng lại khi bé mệt. Ứng dụng không chẩn đoán, không điều trị và không thay thế chuyên gia.',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Hoạt động gần đây',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              for (final item in snap.data!.take(5))
                ListTile(
                  leading: const Icon(
                    Icons.check_circle_rounded,
                    color: AppColors.primary,
                  ),
                  title: Text(item.lessonId),
                  subtitle: Text('Điểm ${item.score}%'),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({
    required this.label,
    required this.value,
    required this.color,
  });
  final String label;
  final String value;
  final Color color;
  @override
  Widget build(BuildContext context) => AppCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        Text(label),
      ],
    ),
  );
}
