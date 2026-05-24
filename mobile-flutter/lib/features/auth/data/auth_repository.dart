import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' hide EmailAuthProvider;
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter/foundation.dart';

import '../../../models/app_user.dart';

class AuthRepository {
  AuthRepository({FirebaseAuth? auth, FirebaseFirestore? db})
    : _auth = auth ?? FirebaseAuth.instance,
      _db = db ?? FirebaseFirestore.instance;

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;

  User? get currentFirebaseUser => _auth.currentUser;
  Stream<User?> authStateChanges() => _auth.authStateChanges();

  Future<AppUser?> readUser(String uid) async {
    final snap = await _db.collection('users').doc(uid).get();
    return snap.exists ? AppUser.fromMap(snap.id, snap.data()!) : null;
  }

  Future<AppUser> repairParentDoc(User user, {String? fullName}) async {
    final now = FieldValue.serverTimestamp();
    final data = {
      'uid': user.uid,
      'email': user.email ?? '',
      'fullName': fullName ?? user.displayName ?? user.email ?? 'Phụ huynh',
      'role': 'PARENT',
      'isActive': true,
      'emailVerified': false,
      'createdAt': now,
      'updatedAt': now,
    };
    await _db
        .collection('users')
        .doc(user.uid)
        .set(data, SetOptions(merge: true));
    return AppUser.fromMap(user.uid, data);
  }

  Future<AppUser> register(
    String fullName,
    String email,
    String password,
  ) async {
    final credential = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await credential.user!.updateDisplayName(fullName.trim());
    final appUser = await repairParentDoc(
      credential.user!,
      fullName: fullName.trim(),
    );
    await sendOtpVerificationCode();
    return appUser;
  }

  Future<AppUser> login(String email, String password) async {
    final credential = await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    var user = await readUser(credential.user!.uid);
    user ??= await repairParentDoc(credential.user!);
    if (user.role != 'PARENT' || !user.isActive) {
      await logout();
      throw Exception('Tài khoản phụ huynh không hợp lệ.');
    }
    return user;
  }

  Future<void> sendPasswordReset(String email) =>
      _auth.sendPasswordResetEmail(email: email.trim());

  Future<void> sendOtpVerificationCode() async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Bạn cần đăng nhập.');

    final code = (100000 + (DateTime.now().microsecondsSinceEpoch % 900000))
        .toString();
    final expiresAt = DateTime.now().add(const Duration(minutes: 30));

    await _db.collection('otps').doc(user.uid).set({
      'code': code,
      'expiresAt': Timestamp.fromDate(expiresAt),
      'createdAt': FieldValue.serverTimestamp(),
    });

    debugPrint(
      '===== VERIFICATION CODE FOR ${user.email}: $code (expires at $expiresAt) =====',
    );
  }

  Future<bool> verifyOtpCode(String enteredCode) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Bạn cần đăng nhập.');

    final doc = await _db.collection('otps').doc(user.uid).get();
    if (!doc.exists) {
      throw Exception('Không tìm thấy mã xác thực. Vui lòng gửi lại mã mới.');
    }

    final data = doc.data()!;
    final actualCode = data['code'] as String?;
    final expiresAtTimestamp = data['expiresAt'] as Timestamp?;

    if (actualCode == null || expiresAtTimestamp == null) {
      throw Exception('Mã xác thực không hợp lệ. Vui lòng gửi lại mã mới.');
    }

    final expiresAt = expiresAtTimestamp.toDate();
    if (DateTime.now().isAfter(expiresAt)) {
      throw Exception(
        'Mã xác thực đã hết hạn (30 phút). Vui lòng gửi lại mã mới.',
      );
    }

    if (actualCode != enteredCode.trim()) {
      throw Exception(
        'Mã xác thực 6 số chưa chính xác. Vui lòng kiểm tra lại.',
      );
    }

    await _db.collection('users').doc(user.uid).set({
      'emailVerified': true,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    await _db.collection('otps').doc(user.uid).delete();

    return true;
  }

  Future<void> resendVerification() async => sendOtpVerificationCode();

  Future<void> reloadUser() async {
    await _auth.currentUser?.reload();
  }

  Future<void> updateFullName(String value) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Bạn cần đăng nhập.');
    await user.updateDisplayName(value.trim());
    await _db.collection('users').doc(user.uid).set({
      'fullName': value.trim(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    final user = _auth.currentUser;
    if (user?.email == null) throw Exception('Bạn cần đăng nhập.');
    final credential = fb.EmailAuthProvider.credential(
      email: user!.email!,
      password: currentPassword,
    );
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
  }

  Future<void> logout() => _auth.signOut();
}
