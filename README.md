# Project HA

MVP hỗ trợ phụ huynh có con 2-6 tuổi đồng hành cùng trẻ qua hoạt động học/chơi ngắn, QR unlock NPC, bài học, flashcard và theo dõi tiến độ. Ứng dụng không chẩn đoán, không điều trị và không thay thế chuyên gia.

---

## 1. Kiến trúc thư mục

```text
backend/       Legacy Express + TypeScript + Prisma + SQLite, deprecated cho MVP
admin-web/     React + Vite + TypeScript, dùng Firebase SDK trực tiếp
mobile-flutter/ Ứng dụng di động Flutter dùng Firebase SDK trực tiếp
firebase/      Firestore rules, Storage rules, indexes
functions/     Firebase Cloud Functions cho OTP, QR activation, completion, rewards
scripts/       Seed/reset/import scripts dùng Firebase Admin
docs/          Tài liệu setup, schema, flow và migration
```

*Lưu ý*: MVP mới không sử dụng backend Express trong flow chính. Thư mục `backend/` được giữ lại để rollback hoặc nâng cấp giai đoạn sau.

Phase 1 đã chuyển các ghi nhạy cảm như progress, XP, streak, badge, mission, QR unlock và OTP verification sang Cloud Functions. Phase 2 bổ sung domain model cho hồ sơ trẻ, taxonomy, chương trình, lộ trình, path items và activity scaffolding nhưng vẫn giữ dữ liệu legacy. Không triển khai Firestore rules mới nếu chưa deploy Functions tương ứng.

---

## 2. Cấu hình môi trường (Environment Variables)


### Admin Web (`admin-web/.env`)
```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Hiển thị banner cảnh báo nếu tài khoản chưa được xác thực
VITE_REQUIRE_EMAIL_VERIFICATION=false
```

---

## 3. Khởi chạy dự án

### Chạy admin-web
```bash
cd admin-web
npm install
cp .env.example .env
npm run dev
```
Trang quản trị chạy tại: `http://localhost:5173`

### Chạy mobile-flutter
```bash
cd mobile-flutter
flutter pub get
dart pub global activate flutterfire_cli
flutterfire configure
flutter run --dart-define=REQUIRE_EMAIL_VERIFICATION=false --dart-define=ALLOW_ALL_LESSONS_FOR_DEMO=true
```

---

## 4. Triển khai lên Firebase

### Deploy Rules & Indexes
```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

### Deploy Cloud Functions
```bash
cd functions
npm install
npm run build
cd ..
npx firebase-tools deploy --only functions
```

### Deploy Admin Web lên Firebase Hosting
```bash
cd admin-web
npm run build
cd ..
npx firebase-tools deploy --only hosting
```
*(Cấu hình thư mục công khai là `admin-web/dist` và SPA rewrite là Yes)*

---

## 5. Tài khoản Demo & Cơ sở dữ liệu

Bạn có thể tự động reset cơ sở dữ liệu và seed sẵn các tài khoản demo, danh sách huy hiệu (badges) và nhiệm vụ ngày (daily missions) bằng lệnh sau ở thư mục gốc:

```bash
npm run db:reset
```

*(Lưu ý: Lệnh này sẽ yêu cầu bạn nhập xác nhận `RESET` trên console trước khi thực hiện để đảm bảo an toàn.)*

Các tài khoản demo được tạo tự động:
- Admin: `admin@demo.com` / `123456`
- Parent: `parent@demo.com` / `123456`

Seed riêng domain Phase 2:

```bash
npm run db:seed-domain
```

---

## 6. Tài liệu chi tiết trong `docs/`

Xem thêm các hướng dẫn vận hành chi tiết:
- [Tài liệu Thiết lập Firebase](file:///Users/huy/Documents/project_ha/docs/firebase-setup.md)
- [Quy trình Xác thực & Tài khoản](file:///Users/huy/Documents/project_ha/docs/auth-flow.md)
- [Quy trình Nghiệp vụ Người dùng](file:///Users/huy/Documents/project_ha/docs/user-flow.md)
- [Hướng dẫn Vận hành Quản trị](file:///Users/huy/Documents/project_ha/docs/admin-guide.md)
- [Database Schema](file:///Users/huy/Documents/project_ha/docs/database-schema.md)
- [Seed Data Guide](file:///Users/huy/Documents/project_ha/docs/seed-guide.md)
- [CSV Import Guide](file:///Users/huy/Documents/project_ha/docs/csv-import-guide.md)
- [Gamification Flow & Architecture](file:///Users/huy/Documents/project_ha/docs/gamification-flow.md)
- [Parent Dashboard Guide](file:///Users/huy/Documents/project_ha/docs/parent-dashboard.md)
- [Implementation Plan From Audit](file:///Users/huy/Documents/project_ha/docs/implementation-plan-from-audit.md)
- [Domain Model Phase 2](file:///Users/huy/Documents/project_ha/docs/domain-model.md)
- [Firestore Schema V2](file:///Users/huy/Documents/project_ha/docs/firestore-schema-v2.md)
- [Phase 2 Migration Notes](file:///Users/huy/Documents/project_ha/docs/phase-2-migration-notes.md)
- [Seed Domain Data](file:///Users/huy/Documents/project_ha/docs/seed-domain-data.md)
- [Security Rules](file:///Users/huy/Documents/project_ha/docs/security-rules.md)
- [Secrets And Deployment Safety](file:///Users/huy/Documents/project_ha/docs/secrets-and-deployment-safety.md)
- [Premium Demo Flow (Phase 5)](file:///Users/huy/Documents/project_ha/docs/premium-demo-flow.md)
- [Entitlements and Access Control (Phase 5)](file:///Users/huy/Documents/project_ha/docs/entitlements-and-access-control.md)
- [Admin Premium Management (Phase 5)](file:///Users/huy/Documents/project_ha/docs/admin-premium-management.md)
- [Payment Future Plan (Phase 5)](file:///Users/huy/Documents/project_ha/docs/payment-future-plan.md)
- [AI Voice Quiz MVP (Phase 6)](file:///Users/huy/Documents/project_ha/docs/phase-6-ai-voice.md)
- [AI Voice Quiz UX & States (Phase 6)](file:///Users/huy/Documents/project_ha/docs/ai-voice-quiz.md)
- [Real AI Provider Setup (Phase 6)](file:///Users/huy/Documents/project_ha/docs/ai-provider-setup.md)
- [Cost & Security Control (Phase 6)](file:///Users/huy/Documents/project_ha/docs/voice-usage-and-cost-control.md)
