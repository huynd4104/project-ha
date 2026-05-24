# Data reset and clean admin flow

Tài liệu này mô tả luồng quản trị hợp nhất sau khi dọn Admin Web. Không chạy reset hoặc xóa Firestore tự động nếu chưa có lệnh rõ ràng.

## Collection chính

- `development-categories`, `learning-goals`, `skills`: nhóm trẻ, mục tiêu và kỹ năng.
- `programs`: chương trình học.
- `learning-paths`: lộ trình học.
- `lessons`: bài học chính. Bài học mới dùng các field như `lessonType`, `publishStatus`, `accessType`, `programId`, `pathId`.
- `activities`: hoạt động trong bài học.
- `flashcards`: thư viện Flashcard tái sử dụng.
- `dialogues`: thư viện hội thoại tái sử dụng.
- `math-questions`: thư viện câu hỏi toán, tư duy, đánh vần và ghép vần. Loại nội dung được nhận diện qua lesson liên kết.
- `npcs`: nhân vật đồng hành.
- `activation-codes`: mã QR mở khóa.
- `premium-plans`: gói Premium.
- `users`, `children`, `progress`: người dùng, hồ sơ trẻ và tiến độ học tập.
- `badges`, `daily-missions`, `media-assets`: công cụ phụ trợ.

## Collection/route chỉ còn dùng để đọc hoặc tương thích

- Route Admin cũ như `/lessons`, `/npcs`, `/qr-codes`, `/programs`, `/learning-paths`, `/development-categories`, `/learning-goals`, `/skills` vẫn có thể tồn tại trong code để fallback hoặc debug.
- Sidebar chính không hiển thị các route trùng chức năng này cho admin thường.
- Không xem dữ liệu thư viện Flashcard, hội thoại và câu hỏi là dữ liệu bỏ đi. Đây là kho nội dung dùng lại khi tạo activity.

## Cách seed lại data sạch

1. Kiểm tra Firebase project và biến môi trường theo `docs/firebase-setup.md`.
2. Chạy seed domain trước:

```bash
npm run db:seed-domain
```

3. Chạy seed learning content nếu cần dữ liệu bài học mẫu:

```bash
npm run db:seed-learning
```

4. Kiểm tra dữ liệu bằng script trạng thái nếu cần:

```bash
npx tsx scripts/test-db-status.ts
```

Nếu tên script trong `package.json` thay đổi, dùng script tương ứng trong thư mục `scripts/`. Không chạy `scripts/reset-firestore.ts` khi chưa có yêu cầu reset rõ ràng.

## Luồng tạo nội dung đúng

1. Tạo nhóm trẻ, mục tiêu và kỹ năng.
2. Tạo chương trình học.
3. Tạo lộ trình học.
4. Tạo bài học trong màn hình `Bài học`.
5. Tạo hoạt động trong `Hoạt động trong bài học`.
6. Nếu cần tái sử dụng nội dung, quản lý nguồn trong `Kho nội dung học`, sau đó tạo khung hoạt động từ khu vực `Tạo hoạt động từ kho nội dung`.
7. Sắp xếp bài học vào lộ trình.
8. Tạo nhân vật đồng hành và mã QR mở khóa nếu bài học cần trải nghiệm unlock.

## Quy tắc an toàn

- Không tự động xóa dữ liệu production.
- Trước khi reset, export dữ liệu Firestore hoặc dùng backup của Firebase Console.
- Chỉ chạy reset khi có xác nhận rõ project, môi trường và phạm vi collection.
