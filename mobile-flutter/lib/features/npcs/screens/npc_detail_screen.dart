import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_image.dart';
import '../../../core/widgets/loading_view.dart';
import '../data/npc_repository.dart';

class NPCDetailScreen extends StatelessWidget {
  const NPCDetailScreen({super.key, required this.npcId});
  final String npcId;

  @override
  Widget build(BuildContext context) => FutureBuilder(
    future: NpcRepository().byId(npcId),
    builder: (_, snap) {
      if (!snap.hasData) return const Scaffold(body: LoadingView());
      final npc = snap.data!;
      return Scaffold(
        appBar: AppBar(
          title: Text(npc.name),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () {
              if (Navigator.canPop(context)) {
                Navigator.of(context).pop();
              } else {
                context.go('/npcs');
              }
            },
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            AppCard(
              child: (npc.imageUrl.isEmpty)
                  ? const Icon(Icons.auto_awesome_rounded, size: 120)
                  : AppImage(imageUrl: npc.imageUrl, height: 260),
            ),
            const SizedBox(height: 16),
            Text(
              npc.name,
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(npc.description),
            const SizedBox(height: 14),
            AppCard(
              child: Text(
                npc.defaultDialogue.isEmpty
                    ? 'Mascot này sẽ có lời thoại sau.'
                    : npc.defaultDialogue,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      );
    },
  );
}
