import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_icon_button.dart';
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
                    context.go('/npcs');
                  }
                },
              ),
            ),
          ),
        ),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            AppCard(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final imageWidth = constraints.maxWidth;
                  final imageHeight = (imageWidth * 1.25)
                      .clamp(280.0, 460.0)
                      .toDouble();

                  return SizedBox(
                    width: imageWidth,
                    height: imageHeight,
                    child: Center(
                      child: (npc.imageUrl.isEmpty)
                          ? const Icon(Icons.auto_awesome_rounded, size: 120)
                          : AppImage(
                              imageUrl: npc.imageUrl,
                              width: imageWidth,
                              height: imageHeight,
                              fit: BoxFit.contain,
                            ),
                    ),
                  );
                },
              ),
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
