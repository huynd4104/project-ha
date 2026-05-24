# Runbook

## Backend

Khuyen nghi Node.js LTS 20/22 de Prisma migrate on dinh.

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Admin Web

```bash
cd admin-web
npm install
npm run dev
```

## Mobile Flutter

```bash
cd mobile-flutter
flutter pub get
flutter run --dart-define=REQUIRE_EMAIL_VERIFICATION=false --dart-define=ALLOW_ALL_LESSONS_FOR_DEMO=true
```

Lưu ý: Bạn cần có Flutter SDK được cài đặt sẵn. Cấu hình Firebase có thể được tạo bằng `flutterfire configure`.

## Demo Accounts

- Admin: `admin@demo.com` / `123456`
- Parent: `parent@demo.com` / `123456`

## Demo QR

- `CAT_001_UNLOCK_MIMI`
- `BEAR_001_UNLOCK_BOBO`
- `RABBIT_001_UNLOCK_NANA`
