import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_image.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../models/models.dart';
import '../../../core/utils/access_check.dart';
import '../../../core/utils/parent_gate.dart';
import '../../parent_dashboard/screens/paywall_screen.dart';
import '../data/npc_repository.dart';

class NPCCollectionScreen extends StatelessWidget {
  const NPCCollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mascot của bé'),
        leadingWidth: 64,
        leading: Padding(
          padding: const EdgeInsets.only(left: 12.0),
          child: Center(
            child: AppIconButton(
              icon: Icons.arrow_back_ios_new_rounded,
              tooltip: 'Trở lại',
              onPressed: () {
                if (Navigator.canPop(context)) {
                  Navigator.of(context).pop();
                } else {
                  context.go('/home');
                }
              },
            ),
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.text,
        elevation: 0,
      ),
      body: FutureBuilder(
        future: Future.wait([
          NpcRepository().allActive(),
          NpcRepository().collection(
            state.appUser!.id,
            state.activeChild!.id,
          ),
        ]),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          final allNpcs = snap.data![0] as List<NPC>;
          final unlockedNpcs = snap.data![1] as List<UnlockedNpcView>;
          final unlockedIds = unlockedNpcs.map((e) => e.npc.id).toSet();

          if (allNpcs.isEmpty)
            return const EmptyState(
              title: 'Chưa có Mascot',
              message: 'Hệ thống chưa cấu hình Mascot nào.',
              icon: Icons.auto_awesome_rounded,
            );

          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 20, 18, 10),
                  child: Text(
                    'Bộ sưu tập bạn đồng hành',
                    style: AppTextStyles.headline,
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.all(18),
                sliver: SliverGrid.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.76,
                  ),
                  itemCount: allNpcs.length,
                  itemBuilder: (context, i) {
                    final npc = allNpcs[i];
                    final isUnlocked = unlockedIds.contains(npc.id);
                    final hasPremiumAccess = AccessCheck.canAccessContent(
                      accessType: npc.accessType,
                      summary: state.appUser?.subscriptionSummary,
                      entitlementType: 'premiumNpcs',
                    );
                    final isPremiumLocked = npc.accessType == AccessType.premium && !hasPremiumAccess;

                    return AppCard(
                      padding: const EdgeInsets.all(12),
                      onTap: isPremiumLocked
                          ? () {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('✨ Mascot Premium'),
                                  content: Text(
                                    'Bạn ${npc.name} là Mascot Premium đặc biệt. Bé hãy nhờ bố mẹ nâng cấp để mở khóa nhé!',
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.of(context).pop(),
                                      child: const Text('Để sau', style: TextStyle(color: Colors.grey)),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                        ParentGate.show(context, () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (context) => const PaywallScreen(),
                                            ),
                                          );
                                        });
                                      },
                                      child: const Text('Dành cho Bố Mẹ', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              );
                            }
                          : (isUnlocked
                              ? () => context.push('/npc/${npc.id}')
                              : () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Hãy quét mã QR của ${npc.name} để mở khóa bạn nhỏ này nhé!',
                                        style: const TextStyle(fontWeight: FontWeight.w800),
                                      ),
                                      backgroundColor: AppColors.orange,
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }),
                      child: Column(
                        children: [
                           Expanded(
                            child: LayoutBuilder(
                              builder: (context, constraints) {
                                final w = constraints.maxWidth;
                                final h = constraints.maxHeight;

                                Widget imageWidget = npc.imageUrl.isEmpty
                                    ? const Center(
                                        child: Icon(
                                          Icons.auto_awesome_rounded,
                                          size: 70,
                                        ),
                                      )
                                    : SizedBox(
                                        width: w,
                                        height: h,
                                        child: AppImage(
                                          imageUrl: npc.imageUrl,
                                          fit: BoxFit.contain,
                                          width: w,
                                          height: h,
                                        ),
                                      );

                                return SizedBox(
                                  width: w,
                                  height: h,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Opacity(
                                        opacity: (isUnlocked && !isPremiumLocked) ? 1.0 : 0.3,
                                        child: imageWidget,
                                      ),
                                      if (isPremiumLocked)
                                        CircleAvatar(
                                          radius: 20,
                                          backgroundColor: Colors.amber.shade700.withValues(alpha: .8),
                                          child: const Icon(
                                            Icons.workspace_premium_rounded,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                        )
                                      else if (!isUnlocked)
                                        CircleAvatar(
                                          radius: 20,
                                          backgroundColor: Colors.black.withValues(alpha: .5),
                                          child: const Icon(
                                            Icons.lock_rounded,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            npc.name,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              color: (isUnlocked && !isPremiumLocked) ? AppColors.text : AppColors.muted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: isPremiumLocked
                                  ? Colors.amber.shade50
                                  : (isUnlocked
                                      ? AppColors.primary.withValues(alpha: .12)
                                      : AppColors.border.withValues(alpha: .5)),
                              borderRadius: BorderRadius.circular(99),
                              border: isPremiumLocked ? Border.all(color: Colors.amber.shade200) : null,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (isPremiumLocked) ...[
                                  const Icon(
                                    Icons.workspace_premium_rounded,
                                    size: 11,
                                    color: Colors.amber,
                                  ),
                                  const SizedBox(width: 4),
                                ] else if (!isUnlocked) ...[
                                  const Icon(
                                    Icons.lock_rounded,
                                    size: 10,
                                    color: AppColors.muted,
                                  ),
                                  const SizedBox(width: 4),
                                ],
                                Text(
                                  isPremiumLocked
                                      ? 'Mở khóa Premium'
                                      : (isUnlocked ? 'Đã mở khóa' : 'Chưa mở khóa'),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 10,
                                    color: isPremiumLocked
                                        ? Colors.amber.shade800
                                        : (isUnlocked ? AppColors.primary : AppColors.muted),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
