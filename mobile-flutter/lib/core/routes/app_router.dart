import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/change_password_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/verify_email_screen.dart';
import '../../features/auth/screens/welcome_screen.dart';
import '../../features/child/screens/child_profile_screen.dart';
import '../../features/gamification/screens/rewards_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/learning_path/screens/learning_path_screen.dart';
import '../../features/learning_path/screens/lesson_detail_screen.dart';
import '../../features/lessons/screens/dialogue_lesson_screen.dart';
import '../../features/lessons/screens/flashcard_screen.dart';
import '../../features/lessons/screens/math_lesson_screen.dart';
import '../../features/lessons/screens/result_screen.dart';
import '../../features/npcs/screens/npc_collection_screen.dart';
import '../../features/npcs/screens/npc_detail_screen.dart';
import '../../features/parent_dashboard/screens/parent_dashboard_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/qr_unlock/screens/qr_scanner_screen.dart';
import '../config/app_config.dart';
import '../services/app_state.dart';
import '../widgets/app_bottom_nav.dart';
import '../widgets/error_view.dart';
import '../widgets/loading_view.dart';

GoRouter buildRouter(AppState state) {
  return GoRouter(
    refreshListenable: state,
    initialLocation: '/home',
    redirect: (context, routerState) {
      final path = routerState.uri.path;
      final authPath =
          path == '/' ||
          path == '/login' ||
          path == '/register' ||
          path == '/forgot';
      if (state.loading &&
          (state.firebaseUser == null || state.activeChild == null)) {
        return '/loading';
      }
      if (state.loading) return null;
      if (state.firebaseError != null) return '/config-error';
      if (!state.isAuthed) return authPath ? null : '/';
      if (authPath || path == '/loading') return '/home';
      if (AppConfig.requireEmailVerification &&
          !state.emailVerified &&
          path != '/verify-email')
        return '/verify-email';
      if ((!AppConfig.requireEmailVerification || state.emailVerified) &&
          !state.hasChild &&
          path != '/child-profile')
        return '/child-profile';
      return null;
    },
    routes: [
      GoRoute(
        path: '/loading',
        builder: (_, __) => const GuardLoadingScreen(),
      ),
      GoRoute(
        path: '/config-error',
        builder: (_, __) => Scaffold(
          body: ErrorView(
            message: state.error ?? 'Firebase chưa được cấu hình.',
          ),
        ),
      ),
      GoRoute(path: '/', builder: (_, __) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(
        path: '/forgot',
        builder: (_, __) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (_, __) => const VerifyEmailScreen(),
      ),
      GoRoute(
        path: '/child-profile',
        builder: (_, __) => const ChildProfileScreen(),
      ),
      ShellRoute(
        builder: (_, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(
            path: '/learning',
            builder: (_, __) => const LearningPathScreen(),
          ),
          GoRoute(path: '/scan', builder: (_, __) => const QRScannerScreen()),
          GoRoute(path: '/rewards', builder: (_, __) => const RewardsScreen()),
          GoRoute(
            path: '/parent',
            builder: (_, __) => const ParentDashboardScreen(),
          ),
        ],
      ),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(
        path: '/change-password',
        builder: (_, __) => const ChangePasswordScreen(),
      ),
      GoRoute(path: '/npcs', builder: (_, __) => const NPCCollectionScreen()),
      GoRoute(
        path: '/npc/:id',
        builder: (_, s) => NPCDetailScreen(npcId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/lesson/:id',
        builder: (_, s) =>
            LessonDetailScreen(lessonId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/lesson/:id/math',
        builder: (_, s) => MathLessonScreen(lessonId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/lesson/:id/dialogue',
        builder: (_, s) =>
            DialogueLessonScreen(lessonId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/lesson/:id/flashcard',
        builder: (_, s) => FlashcardScreen(lessonId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/result',
        builder: (_, s) => ResultScreen(extra: s.extra),
      ),
      GoRoute(
        path: '/unlock-success',
        builder: (_, s) => ResultScreen(extra: s.extra, unlockMode: true),
      ),
    ],
    errorBuilder: (_, __) =>
        const Scaffold(body: ErrorView(message: 'Không tìm thấy màn hình.')),
  );
}

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});
  final Widget child;

  int _index(String path) {
    if (path.startsWith('/learning')) return 1;
    if (path.startsWith('/scan')) return 2;
    if (path.startsWith('/rewards')) return 3;
    if (path.startsWith('/parent')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    return Scaffold(
      body: child,
      bottomNavigationBar: AppBottomNav(selectedIndex: _index(path)),
    );
  }
}

class GuardLoadingScreen extends StatelessWidget {
  const GuardLoadingScreen({super.key});
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: LoadingView(message: 'Đang tải cấu hình...'));
}
