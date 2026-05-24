# Project HA Mobile Flutter

Ứng dụng di động của Project HA được xây dựng bằng Flutter. App này dùng trực tiếp Firebase project hiện tại và giữ nguyên Firestore collections/schema.

## Yêu cầu

- Flutter stable
- Dart null safety
- Firebase project hiện tại của Project HA
- Android Studio/Xcode nếu chạy Android/iOS

## Cài đặt

```bash
cd mobile-flutter
flutter pub get
```

## Cấu hình Firebase

Khuyến nghị dùng FlutterFire CLI để tạo cấu hình native chuẩn:

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

Khi được hỏi:

1. Chọn Firebase project hiện tại của Project HA.
2. Chọn Android/iOS/Web theo nhu cầu chạy.
3. Commit `lib/firebase_options.dart` sau khi kiểm tra không có service account hay secret server.

Trong lúc chưa chạy FlutterFire CLI, `lib/firebase_options.dart` hỗ trợ cấu hình qua `--dart-define`:

```bash
flutter run \
  --dart-define=FIREBASE_API_KEY=... \
  --dart-define=FIREBASE_AUTH_DOMAIN=... \
  --dart-define=FIREBASE_PROJECT_ID=... \
  --dart-define=FIREBASE_STORAGE_BUCKET=... \
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=... \
  --dart-define=FIREBASE_APP_ID=...
```

Không dùng service account trong Flutter app.

## Chạy app

```bash
cd mobile-flutter
flutter run
```

Demo flags:

```bash
flutter run \
  --dart-define=REQUIRE_EMAIL_VERIFICATION=false \
  --dart-define=ALLOW_ALL_LESSONS_FOR_DEMO=true
```

## Flow đã port

- Firebase Auth: welcome, register, login, forgot password, verify email, change password, profile.
- Child profile: tạo/sửa hồ sơ bé.
- Home: XP, level, streak, quick actions.
- Learning Path: map zigzag, trạng thái lesson, demo unlock all.
- QR unlock: scan bằng `mobile_scanner` hoặc nhập mã thủ công.
- NPC collection/detail.
- Math lesson, dialogue lesson, flashcard, result.
- Rewards: level, badges, daily missions, claim reward.
- Parent dashboard.

## Firestore collections dùng chung

`users`, `children`, `npcs`, `qrCodes`, `userUnlockedNpcs`, `lessons`, `mathQuestions`, `dialogues`, `flashcards`, `progress`, `xpLogs`, `streaks`, `badges`, `userBadges`, `dailyMissions`, `userMissionProgress`, `mediaAssets`.

## Test account và QR demo

Nếu đã seed dữ liệu từ root project:

- Parent: `parent@demo.com` / `123456`
- Admin web quản trị: `admin@demo.com` / `123456`

QR demo codes nằm trong collection `qrCodes` hoặc file `data template/QR Codes.csv`. Có thể dùng tab **Nhập mã** nếu thiết bị không có camera.

## Phase sau

Không thêm NFC/Bluetooth ở phase này. `ActivationRepository.unlockByCode(code, userId, childId)` đã tách logic unlock theo mã, nên NFC/Bluetooth sau này chỉ cần đọc mã và truyền vào method này.
