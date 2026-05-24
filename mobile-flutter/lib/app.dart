import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/routes/app_router.dart';
import 'core/services/app_state.dart';
import 'core/theme/app_theme.dart';

class ProjectHaApp extends StatelessWidget {
  const ProjectHaApp({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final router = buildRouter(state);

    return MaterialApp.router(
      title: 'Project HA',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: router,
    );
  }
}
