import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/routes/app_router.dart';
import 'core/services/app_state.dart';
import 'core/theme/app_theme.dart';

class ProjectHaApp extends StatefulWidget {
  const ProjectHaApp({super.key});

  @override
  State<ProjectHaApp> createState() => _ProjectHaAppState();
}

class _ProjectHaAppState extends State<ProjectHaApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = buildRouter(context.read<AppState>());
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return MaterialApp.router(
      title: 'Project HA',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(highContrast: state.highContrast),
      routerConfig: _router,
      builder: (context, child) {
        final media = MediaQuery.of(context);
        final scale = state.largeText ? 1.16 : 1.0;
        return MediaQuery(
          data: media.copyWith(
            textScaler: TextScaler.linear(
              (media.textScaler.scale(1) * scale).clamp(1.0, 1.32),
            ),
            disableAnimations: state.reducedAnimation,
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
