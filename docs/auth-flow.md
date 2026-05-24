# Authentication & Account Flow Documentation

This document explains the registration, login, verification, and security guard architecture for both the parent mobile app and the admin dashboard.

---

## 1. User Registration (Mobile App)
- **Form Fields**: Full Name (min 2 characters), Email, Password (min 8 characters, letters & numbers), Confirm Password, and disclaimer consent checkbox.
- **Password Strength**: Real-time evaluation (Yếu / Trung bình / Mạnh) based on length and characters.
- **Logic**:
  1. Calls Firebase `createUserWithEmailAndPassword`.
  2. Updates Firebase Auth `displayName` with the parent's full name.
  3. Creates a corresponding document `users/{uid}` in Firestore containing:
     - `uid`
     - `email`
     - `fullName`
     - `role` = `"PARENT"`
     - `isActive` = `true`
     - `emailVerified` = `false`
     - `createdAt`/`updatedAt`
  4. Triggers `sendEmailVerification` to send a link to the parent's inbox.
  5. Redirects the user interface to `VerifyEmailScreen`.

---

## 2. Email Verification & Cooldown
- **VerifyEmailScreen**: Blocks main navigation stack if verification is mandatory.
- **Verification Trigger**: Bấm "Tôi đã xác thực email" reloads the Firebase current user and calls `refreshUserProfile()`. If `user.emailVerified` is true, the user document in Firestore is synchronized (`emailVerified: true`) and navigation transitions to the home page.
- **Resend Mail**: Cooldown constraint of 60 seconds is enforced via state timers to prevent API abuse.
- **Demo Mode**:
  - Controlled by environment flags `EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION` (mobile) and `VITE_REQUIRE_EMAIL_VERIFICATION` (admin).
  - If set to `false`, parents can access the main flow even if unverified.
  - A persistent **Warning Banner** is displayed at the top of the home screen and settings page, providing a shortcut to trigger email resending.

---

## 3. Account Settings & Password Management
- **Name Updates**: Parents can edit their display name. Changes are pushed to Firebase Auth (`updateProfile`) and Firestore.
- **Password Modification**:
  - Forms: Current Password, New Password, Confirm New Password.
  - Verification: New password must be at least 8 characters, contain letters and numbers, match confirm password, and be different from current password.
  - Logic: Reauthenticates utilizing `reauthenticateWithCredential` with current password credentials before calling `updatePassword` to prevent timeout exceptions.

---

## 4. Admin Dashboard Security Guards
- **Login validation**: Calls `signInWithEmailAndPassword`, then fetches `users/{uid}`.
- **ADMIN check**: Logs out instantly using `signOut` and displays "Tài khoản không có quyền admin" if the Firestore user document `role !== "ADMIN"`.
- **Blocked Check**: Rejects login if `isActive === false`.
- **Navigation Guard**: `ProtectedRoute` checks logged-in status and `isAdmin === true` in the application state context. If a user tries to access `/dashboard` or other CRUD pages without permissions, they are routed back to the login page.
