import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/change_password_screen.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/verify_email_screen.dart';
import '../../features/auth/screens/welcome_screen.dart';
import '../../features/ai_conversation/presentation/child/screens/ai_conversation_intro_screen.dart';
import '../../features/ai_conversation/presentation/child/screens/ai_conversation_live_screen.dart';
import '../../features/ai_conversation/presentation/child/screens/ai_conversation_summary_screen.dart';
import '../../features/ai_conversation/presentation/child/screens/ai_conversation_topic_screen.dart';
import '../../features/ai_conversation/presentation/parent/screens/child_ai_progress_dashboard_screen.dart';
import '../../features/ai_conversation/presentation/parent/screens/child_ai_progress_topic_screen.dart';
import '../../features/ai_conversation/presentation/parent/screens/child_ai_session_detail_screen.dart';
import '../../features/ai_conversation/presentation/parent/screens/child_ai_session_history_screen.dart';
import '../../features/child/screens/child_profile_screen.dart';
import '../../features/gamification/screens/rewards_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/learning_path/screens/learning_path_screen.dart';
import '../../features/learning_path/screens/lesson_detail_screen.dart';
import '../../features/lessons/screens/flashcard_screen.dart';
import '../../features/lessons/screens/math_lesson_screen.dart';
import '../../features/lessons/screens/result_screen.dart';
import '../../features/npcs/screens/npc_collection_screen.dart';
import '../../features/npcs/screens/npc_detail_screen.dart';
import '../../features/parent_dashboard/screens/parent_dashboard_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/learning_path/screens/program_selection_screen.dart';
import '../../features/learning_path/screens/program_paths_map_screen.dart';
import '../../features/lessons/screens/activity_lesson_screen.dart';
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
      if (state.loading && (!state.isAuthed || state.activeChild == null)) {
        return '/loading';
      }
      if (state.loading) return null;
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
      if (state.isAuthed && state.hasChild) {
        final currentProgramId = state.activeChild?.currentProgramId;
        final hasNoProgram = currentProgramId == null || currentProgramId.isEmpty;
        if (hasNoProgram && (path.startsWith('/learning') || path.startsWith('/program-paths'))) {
          return '/program-selection';
        }
      }
      return null;
    },
    routes: [
      GoRoute(path: '/loading', builder: (_, __) => const GuardLoadingScreen()),
      GoRoute(
        path: '/config-error',
        builder: (_, __) => Scaffold(
          body: ErrorView(
            message: state.error ?? 'Không tải được cấu hình API.',
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
          GoRoute(
            path: '/ai-conversations/topics',
            builder: (_, __) => const AiConversationTopicScreen(),
          ),
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
        path: '/lesson/:id/flashcard',
        builder: (_, s) => FlashcardScreen(lessonId: s.pathParameters['id']!),
      ),

      GoRoute(
        path: '/ai-conversations/topics/:topicId/intro',
        builder: (_, s) =>
            AiConversationIntroScreen(topicId: s.pathParameters['topicId']!),
      ),
      GoRoute(
        path: '/ai-conversations/topics/:topicId/live',
        builder: (_, s) =>
            AiConversationLiveScreen(topicId: s.pathParameters['topicId']!),
      ),
      GoRoute(
        path: '/ai-conversations/sessions/:sessionId/summary',
        builder: (_, s) => AiConversationSummaryScreen(
          sessionId: s.pathParameters['sessionId']!,
        ),
      ),
      GoRoute(
        path: '/parent/ai-conversations',
        builder: (_, __) => const ChildAiProgressDashboardScreen(),
      ),
      GoRoute(
        path: '/parent/ai-conversations/topics/:topicId',
        builder: (_, s) =>
            ChildAiProgressTopicScreen(topicId: s.pathParameters['topicId']!),
      ),
      GoRoute(
        path: '/parent/ai-conversations/sessions',
        builder: (_, __) => const ChildAiSessionHistoryScreen(),
      ),
      GoRoute(
        path: '/parent/ai-conversations/sessions/:sessionId',
        builder: (_, s) => ChildAiSessionDetailScreen(
          sessionId: s.pathParameters['sessionId']!,
        ),
      ),
      GoRoute(
        path: '/lesson/:id/activity',
        builder: (_, s) =>
            ActivityLessonScreen(lessonId: s.pathParameters['id']!),
      ),
      GoRoute(
        path: '/program-selection',
        builder: (_, __) => const ProgramSelectionScreen(),
      ),
      GoRoute(
        path: '/program-paths',
        builder: (_, __) => const ProgramPathsMapScreen(),
      ),
      GoRoute(
        path: '/learning-path/:pathId',
        builder: (_, s) => LearningPathScreen(
          pathId: s.pathParameters['pathId'],
        ),
      ),
      GoRoute(
        path: '/result',
        builder: (_, s) => ResultScreen(extra: s.extra),
      ),
      GoRoute(
        path: '/unlock-success',
        builder: (_, s) => ResultScreen(extra: s.extra, unlockMode: true),
      ),
      GoRoute(
        path: '/scan',
        builder: (_, __) => const QRScannerScreen(),
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
    if (path.startsWith('/ai-conversations/topics')) return 2;
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
