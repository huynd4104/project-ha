import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/services/app_state.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../data/npc_repository.dart';

class NPCCollectionScreen extends StatelessWidget {
  const NPCCollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.read<AppState>();
    return Scaffold(
      appBar: AppBar(title: const Text('Bộ sưu tập Mascot')),
      body: FutureBuilder(
        future: NpcRepository().collection(
          state.firebaseUser!.uid,
          state.activeChild!.id,
        ),
        builder: (_, snap) {
          if (!snap.hasData) return const LoadingView();
          final items = snap.data!;
          if (items.isEmpty)
            return const EmptyState(
              title: 'Chưa có Mascot',
              message:
                  'Hãy quét QR hoặc nhập mã để mở khóa bạn đồng hành đầu tiên.',
              icon: Icons.auto_awesome_rounded,
            );
          return GridView.builder(
            padding: const EdgeInsets.all(18),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: .78,
            ),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final npc = items[i].npc;
              return InkWell(
                onTap: () => context.push('/npc/${npc.id}'),
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: const Color(0xFFE5E7EB)),
                  ),
                  child: Column(
                    children: [
                      Expanded(
                        child: (npc.imageUrl.isEmpty)
                            ? const Icon(Icons.auto_awesome_rounded, size: 70)
                            : CachedNetworkImage(
                                imageUrl: npc.imageUrl,
                                fit: BoxFit.contain,
                              ),
                      ),
                      Text(
                        npc.name,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
