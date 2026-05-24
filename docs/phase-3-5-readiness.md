# Báo cáo Sẵn sàng Phase 3.5 (Phase 3.5 Readiness Report)

Tài liệu này tổng hợp tiến độ hoàn thành Phase 3.5, làm rõ trạng thái hoạt động thực tế (Active) và trạng thái chuẩn bị cấu trúc (Prepared) của hệ thống dữ liệu trước khi chuyển sang Phase 4.

---

## 1. Trạng thái Hoạt động thực tế (Active)

Các tính năng và luồng dữ liệu sau đây đã được cài đặt, seed đầy đủ vào cơ sở dữ liệu và hoạt động tích hợp hoàn chỉnh:

### A. Hệ thống dữ liệu miền học tập (Taxonomy & Programs)
- **Taxonomy**: Danh mục phát triển (`developmentCategories`), Mục tiêu học tập (`learningGoals`), và kỹ năng (`skills`) được định nghĩa chuẩn hóa.
- **Chương trình & Lộ trình**: 3 chương trình mẫu và 3 lộ trình mẫu tương ứng (`programs`, `learningPaths`) đã được nạp thành công vào Firestore.
- **PathItems**: Toàn bộ bài học hoạt động (legacy lessons) đã được phân bổ vào các lộ trình học tập, với thuộc tính `requiredCompletion` dạng boolean.

### B. Hoạt động mẫu nâng cao (Sample Activities)
- Toàn bộ bài học được bổ sung các hoạt động (`activities`) thuộc các định dạng mới:
  - `MULTIPLE_CHOICE` (Trắc nghiệm hình ảnh/chữ)
  - `LISTEN_AND_CHOOSE_IMAGE` (Nghe và chọn hình)
  - `LOOK_AND_CHOOSE_WORD` (Nhìn hình chọn từ)
  - `EMOTION_RECOGNITION` (Nhận diện cảm xúc qua emoji)
  - `DAILY_LIFE_SCENARIO` (Tình huống giao tiếp hội thoại)
  - `PARENT_MARK_RESULT` (Phụ huynh đánh giá kết quả)
  - `VOICE_ANSWER` (Tập nói và nhắc lại)

### C. Mở khóa Mascot/NPC bằng Mã kích hoạt (NPC Activation)
- Cloud Function `redeemActivationCode` hỗ trợ đầy đủ việc tìm kiếm mã kích hoạt từ cả hai bộ sưu tập `activationCodes` và `qrCodes`.
- Khi người dùng sử dụng mã loại `NPC` (ví dụ: `HA-NPC-MIMI`), hệ thống sẽ thực hiện giao dịch (transaction) an toàn để lưu thông tin mở khóa vào `userUnlockedNpcs` và tăng số lượt sử dụng mã.

---

## 2. Trạng thái Chuẩn bị cấu trúc (Prepared Only)

Các tính năng sau đây được thiết kế và chuẩn bị đầy đủ về mặt cấu trúc dữ liệu và mô hình trong ứng dụng di động, nhưng **chưa được kích hoạt luồng nghiệp vụ thực tế** (sẽ phát triển trong Phase 4):

### A. Mở khóa Bài học và Lộ trình bằng Mã kích hoạt
- **Dữ liệu mẫu**: Đã nạp mã mẫu `HA-LESSON-01` (loại `LESSON`) và `HA-TOY100` (loại `PHYSICAL_TOY`) vào collection `activationCodes`. Các Flutter model cũng đã hỗ trợ parse các trường này.
- **Hành vi trên Cloud Function**: Hàm `redeemActivationCode` vẫn chặn các loại kích hoạt khác `NPC`. Khi gửi yêu cầu redeem mã bài học hay đồ chơi vật lý, hàm sẽ ném ra lỗi tiền điều kiện:
  ```
  HttpsError("failed-precondition", "Phase 1 chỉ hỗ trợ kích hoạt Mascot/NPC.")
  ```
  *Điều này đảm bảo an toàn cho luồng nghiệp vụ học tập hiện tại, tránh ảnh hưởng đến tiến độ học tập (learning path/progress) của trẻ trước khi Phase 4 được triển khai.*

### B. Logic xử lý giọng nói / AI Voice thật
- **Dữ liệu mẫu**: Các hoạt động mẫu loại `VOICE_ANSWER` chứa cấu hình kịch bản mẫu (`ttsPromptText`) và bộ đáp án chấp nhận (`acceptedAnswers`, `almostAnswers`).
- **Hành vi thực tế**: Ứng dụng di động đã sẵn sàng mô hình dữ liệu để nhận diện, nhưng tính năng gọi API Text-to-Speech hoặc Speech-to-Text thật sự chưa được liên kết. Logic nhận giọng nói thật sẽ thuộc phạm vi Phase 4.

---

## 3. Kết quả Validation & Sẵn sàng cho Phase 4

- **Seed script**: Chạy thành công qua lệnh `npm run db:seed-domain` mà không tạo ra các dữ liệu trùng lặp cho các bài học cũ.
- **Flutter compilation**: Dự án `mobile-flutter` build thành công, không gặp lỗi biên dịch liên quan đến thay đổi mô hình dữ liệu.
- **Backend compilation**: Thư mục `functions` biên dịch TypeScript thành công, đảm bảo deploy an toàn.
- **Admin-web compilation**: Dự án `admin-web` build thành công, tương thích hoàn toàn với schema mới.

Hệ thống đã hoàn toàn sẵn sàng về mặt dữ liệu để triển khai luồng nghiệp vụ trên di động ở Phase 4.
