import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/badge.dart' as model;
import '../data/gamification_repository.dart';
import '../widgets/badge_card.dart';
import '../widgets/daily_mission_card.dart';
import '../widgets/level_card.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key});
  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  final repo = GamificationRepository();
  late Future<({List<MissionWithProgress> missions, List<model.Badge> badges})>
  data;

  @override
  void initState() {
    super.initState();
    data = load();
  }

  Future<({List<MissionWithProgress> missions, List<model.Badge> badges})>
  load() async {
    final state = context.read<AppState>();
    final uid = state.firebaseUser!.uid;
    final childId = state.activeChild!.id;
    final missions = await repo.dailyMissions(uid, childId);
    final badgesSnap = await FirebaseFirestore.instance
        .collection('badges')
        .where('isActive', isEqualTo: true)
        .get();
    final earnedSnap = await FirebaseFirestore.instance
        .collection('userBadges')
        .where('userId', isEqualTo: uid)
        .where('childId', isEqualTo: childId)
        .get();
    final earned = earnedSnap.docs.map((e) => e.data()['badgeId']).toSet();
    final badges = badgesSnap.docs
        .map(
          (doc) => model.Badge.fromMap(
            doc.id,
            doc.data(),
            isEarned: earned.contains(doc.id),
          ),
        )
        .toList();
    return (missions: missions, badges: badges);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    return Scaffold(
      body: FutureBuilder(
        future: data,
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          return ListView(
            padding: const EdgeInsets.fromLTRB(18, 56, 18, 24),
            children: [
              const Text('Phần thưởng', style: AppTextStyles.headline),
              const SizedBox(height: 4),
              const Text(
                'Ghi nhận nỗ lực của bé, không so sánh hay xếp hạng.',
                style: AppTextStyles.muted,
              ),
              const SizedBox(height: 16),
              LevelCard(stats: state.levelStats),
              const SizedBox(height: 18),
              const Text(
                'Nhiệm vụ hôm nay',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 10),
              for (final mission in snap.data!.missions)
                DailyMissionCard(
                  item: mission,
                  onClaim: () async {
                    await repo.claimMissionReward(
                      state.firebaseUser!.uid,
                      state.activeChild!.id,
                      mission,
                    );
                    await state.refreshStats();
                    if (mounted) {
                      setState(() => data = load());
                    }
                  },
                ),
              const SizedBox(height: 16),
              const Text(
                'Huy hiệu',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 10),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: snap.data!.badges.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.1,
                ),
                itemBuilder: (_, i) => BadgeCard(badge: snap.data!.badges[i]),
              ),
            ],
          );
        },
      ),
    );
  }
}
