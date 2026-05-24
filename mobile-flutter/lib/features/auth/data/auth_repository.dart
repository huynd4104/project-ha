import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart' hide EmailAuthProvider;
import 'package:firebase_auth/firebase_auth.dart' as fb;

import '../../../models/app_user.dart';

class AuthRepository {
  AuthRepository({
    FirebaseAuth? auth,
    FirebaseFirestore? db,
    FirebaseFunctions? functions,
  }) : _auth = auth ?? FirebaseAuth.instance,
       _db = db ?? FirebaseFirestore.instance,
       _functions =
           functions ??
           FirebaseFunctions.instanceFor(region: 'asia-southeast1');

  final FirebaseAuth _auth;
  final FirebaseFirestore _db;
  final FirebaseFunctions _functions;

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
    await _functions.httpsCallable('sendOtpVerificationCode').call();
  }

  Future<bool> verifyOtpCode(String enteredCode) async {
    final user = _auth.currentUser;
    if (user == null) throw Exception('Bạn cần đăng nhập.');

    await _functions.httpsCallable('verifyOtpCode').call({
      'code': enteredCode.trim(),
    });
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
