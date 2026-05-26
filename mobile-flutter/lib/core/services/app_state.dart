import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/child/data/child_repository.dart';
import '../../features/gamification/data/gamification_repository.dart';
import '../../features/npcs/data/npc_repository.dart';
import '../../features/parent/data/subscription_service.dart';
import '../../models/models.dart';
import 'sound_service.dart';

class AppState extends ChangeNotifier with WidgetsBindingObserver {
  late final AuthRepository authRepository = AuthRepository();
  late final ChildRepository childRepository = ChildRepository();
  late final GamificationRepository gamificationRepository =
      GamificationRepository();
  late final SubscriptionService subscriptionService = SubscriptionService();

  bool loading = true;
  AppUser? appUser;
  AuthSession? session;
  List<ChildProfile> children = const [];
  ChildProfile? activeChild;
  NPC? activeNpc;
  LevelStats levelStats = const LevelStats(0, 1, 0, 100);
  Streak? streak;
  String? error;
  bool largeText = false;
  bool highContrast = false;
  bool reducedAnimation = false;
  bool audioInstructions = true;
  bool repeatInstructions = false;
  bool hapticFeedback = true;

  bool get isAuthed => session?.isValid == true && appUser != null;
  bool get emailVerified => appUser?.emailVerified ?? false;
  bool get hasChild => activeChild != null;

  Future<void> start() async {
    WidgetsBinding.instance.addObserver(this);
    await SoundService.instance.load();
    await _loadAccessibility();
    session = await authRepository.loadSession();
    await refresh();
  }

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      session = authRepository.currentSession ?? await authRepository.loadSession();
      if (session == null || !session!.isValid) {
        _clearUserState();
      } else {
        final user = await authRepository.me();
        if (!user.isActive || user.role != 'PARENT') {
          await authRepository.logout();
          throw Exception('Tài khoản phụ huynh không hợp lệ hoặc đã bị khóa.');
        }
        appUser = user;
        children = await childRepository.list(user.id);
        activeChild = children.isEmpty ? null : children.first;
        if (activeChild != null) {
          await refreshStats();
        } else {
          activeNpc = null;
        }
      }
    } catch (e) {
      error = e.toString();
      if ('$e'.contains('401')) {
        _clearUserState();
      }
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void _clearUserState() {
    appUser = null;
    session = null;
    children = const [];
    activeChild = null;
    activeNpc = null;
  }

  Future<void> refreshStats() async {
    if (appUser == null || activeChild == null) return;
    final uid = appUser!.id;
    final childId = activeChild!.id;

    final results = await Future.wait([
      gamificationRepository.totalXp(uid, childId),
      gamificationRepository.getStreak(uid, childId),
      NpcRepository().collection(uid, childId),
    ]);

    final xp = results[0] as int;
    levelStats = gamificationRepository.calculateLevel(xp);
    streak = results[1] as Streak?;
    final unlockedNpcs = results[2] as List<UnlockedNpcView>;
    activeNpc = unlockedNpcs.isEmpty ? null : unlockedNpcs.first.npc;
    notifyListeners();
  }

  Future<void> logout() async {
    await authRepository.logout();
    _clearUserState();
    notifyListeners();
  }

  Future<void> _loadAccessibility() async {
    final prefs = await SharedPreferences.getInstance();
    largeText = prefs.getBool('access_large_text') ?? false;
    highContrast = prefs.getBool('access_high_contrast') ?? false;
    reducedAnimation = prefs.getBool('access_reduced_animation') ?? false;
    audioInstructions = prefs.getBool('access_audio_instructions') ?? true;
    repeatInstructions = prefs.getBool('access_repeat_instructions') ?? false;
    hapticFeedback = prefs.getBool('access_haptic_feedback') ?? true;
  }

  Future<void> setLargeText(bool value) async {
    largeText = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('access_large_text', value);
    notifyListeners();
  }

  Future<void> setHighContrast(bool value) async {
    highContrast = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('access_high_contrast', value);
    notifyListeners();
  }

  Future<void> setReducedAnimation(bool value) async {
    reducedAnimation = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('access_reduced_animation', value);
    notifyListeners();
  }

  Future<void> setAudioInstructions(bool value) async {
    audioInstructions = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('access_audio_instructions', value);
    notifyListeners();
  }

  Future<void> setRepeatInstructions(bool value) async {
    repeatInstructions = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('access_repeat_instructions', value);
    notifyListeners();
  }

  Future<void> setHapticFeedback(bool value) async {
    hapticFeedback = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('access_haptic_feedback', value);
    notifyListeners();
  }

  Future<void> setSoundEnabled(bool value) async {
    await SoundService.instance.setEnabled(value);
    notifyListeners();
  }

  void updateActiveChildPath(String programId, String pathId) {
    if (activeChild != null) {
      activeChild = activeChild!.copyWith(
        currentProgramId: programId,
        currentPathId: pathId,
        selectedAt: DateTime.now(),
      );
      children = children.map((c) => c.id == activeChild!.id ? activeChild! : c).toList();
      notifyListeners();
    }
  }

  Future<void> refreshSubscription() async {
    if (appUser == null) return;
    try {
      final summary = await subscriptionService.getSubscriptionSummary(appUser!.id);
      if (summary != null && appUser != null) {
        appUser = appUser!.copyWith(subscriptionSummary: summary);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error refreshing subscription: $e');
    }
  }

  Future<void> upgradeDemoPremium() async {
    await subscriptionService.demoUpgradePremium();
    await refreshSubscription();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      refreshSubscription();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}
