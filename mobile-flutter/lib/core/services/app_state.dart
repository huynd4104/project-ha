import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/child/data/child_repository.dart';
import '../../features/gamification/data/gamification_repository.dart';
import '../../features/npcs/data/npc_repository.dart';
import '../../models/models.dart';
import 'sound_service.dart';

class AppState extends ChangeNotifier {
  AppState({this.firebaseError});

  final Object? firebaseError;
  late final AuthRepository authRepository = AuthRepository();
  late final ChildRepository childRepository = ChildRepository();
  late final GamificationRepository gamificationRepository =
      GamificationRepository();

  StreamSubscription<User?>? _sub;
  bool loading = true;
  AppUser? appUser;
  User? firebaseUser;
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

  bool get isAuthed => firebaseUser != null && appUser != null;
  bool get emailVerified =>
      (firebaseUser?.emailVerified ?? false) ||
      (appUser?.emailVerified ?? false);
  bool get hasChild => activeChild != null;

  Future<void> start() async {
    await SoundService.instance.load();
    await _loadAccessibility();
    if (firebaseError != null) {
      loading = false;
      error = firebaseError.toString();
      notifyListeners();
      return;
    }
    _sub = authRepository.authStateChanges().listen((user) async {
      firebaseUser = user;
      await refresh();
    });
  }

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      firebaseUser = authRepository.currentFirebaseUser;
      if (firebaseUser == null) {
        appUser = null;
        children = const [];
        activeChild = null;
        activeNpc = null;
      } else {
        var userDoc = await authRepository.readUser(firebaseUser!.uid);
        userDoc ??= await authRepository.repairParentDoc(firebaseUser!);
        if (!userDoc.isActive || userDoc.role != 'PARENT') {
          await authRepository.logout();
          throw Exception('Tài khoản phụ huynh không hợp lệ hoặc đã bị khóa.');
        }
        appUser = userDoc;
        children = await childRepository.list(firebaseUser!.uid);
        activeChild = children.isEmpty ? null : children.first;
        if (activeChild != null) {
          await refreshStats();
        } else {
          activeNpc = null;
        }
      }
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> refreshStats() async {
    if (firebaseUser == null || activeChild == null) return;
    final uid = firebaseUser!.uid;
    final childId = activeChild!.id;
    final xp = await gamificationRepository.totalXp(uid, childId);
    levelStats = gamificationRepository.calculateLevel(xp);
    streak = await gamificationRepository.getStreak(uid, childId);
    final unlockedNpcs = await NpcRepository().collection(uid, childId);
    activeNpc = unlockedNpcs.isEmpty ? null : unlockedNpcs.first.npc;
  }

  Future<void> logout() => authRepository.logout();

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

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
