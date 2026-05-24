import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/child/data/child_repository.dart';
import '../../features/gamification/data/gamification_repository.dart';
import '../../models/models.dart';
import 'sound_service.dart';

class AppState extends ChangeNotifier {
  AppState({this.firebaseError});

  final Object? firebaseError;
  late final AuthRepository authRepository = AuthRepository();
  late final ChildRepository childRepository = ChildRepository();
  late final GamificationRepository gamificationRepository = GamificationRepository();

  StreamSubscription<User?>? _sub;
  bool loading = true;
  AppUser? appUser;
  User? firebaseUser;
  List<ChildProfile> children = const [];
  ChildProfile? activeChild;
  LevelStats levelStats = const LevelStats(0, 1, 0, 100);
  Streak? streak;
  String? error;

  bool get isAuthed => firebaseUser != null && appUser != null;
  bool get emailVerified => firebaseUser?.emailVerified ?? false;
  bool get hasChild => activeChild != null;

  Future<void> start() async {
    await SoundService.instance.load();
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
        if (activeChild != null) await refreshStats();
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
  }

  Future<void> logout() => authRepository.logout();

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
