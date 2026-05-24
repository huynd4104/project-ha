# Kiểm soát Chi phí & Bảo mật Hệ thống AI Voice Quiz

Tương tác bằng giọng nói thông qua các API đám mây (OpenAI Whisper, Azure Speech) luôn phát sinh chi phí theo từng giây âm thanh được phân tích. Tài liệu này hướng dẫn cách bảo vệ tài nguyên hệ thống và tối ưu hóa chi phí cho `project_ha`.

---

## 1. Các biện pháp Kiểm soát Chi phí (Cost Control)

Hệ thống đã được tích hợp 4 lớp bảo vệ chi phí tự động từ tầng Client đến Server:

### Lớp 1: Giới hạn độ dài và dung lượng Audio (Server-side & Client-side)
* **Client-side**: Ứng dụng di động tự động ngắt ghi âm sau tối đa 5 giây. Vừa đủ để trẻ nói một từ hoặc câu ngắn (ví dụ: "con mèo", "xin chào cô ạ").
* **Server-side**: Hàm Cloud Function `submitVoiceAnswer` thực thi kiểm tra nghiêm ngặt:
  - Reject lập tức nếu tham số `durationSec > 6` giây.
  - Reject lập tức nếu dung lượng chuỗi Base64 `audioBase64.length > 1.5 MB`.
  *Lợi ích*: Ngăn chặn việc gửi tệp âm thanh rác cực lớn gây treo hoặc cạn kiệt tài khoản API STT.

### Lớp 2: Ràng buộc số lần nói lại (Retry Limits)
* Tận dụng thuộc tính `retryLimit` của từng hoạt động. Trẻ chỉ được phép thu âm thử lại tối đa số lần quy định (mặc định là 2).
* Khi hết số lượt thử, nút Micro bị vô hiệu hóa hoặc chuyển sang nút "Tiếp tục". Trẻ không thể bấm spam ghi âm liên tục hàng trăm lần cho một câu hỏi.

### Lớp 3: Khóa cứng phân quyền (Unconditional Entitlement Check)
* Server Cloud Functions thực hiện kiểm tra quyền `voiceQuiz = true` và gói `PREMIUM/TRIAL` hoạt động đối với **tất cả** yêu cầu gọi STT.
* Người dùng miễn phí (FREE) hoặc tài khoản hết hạn bị chặn ngay từ đầu, không thể gửi yêu cầu STT lên server để tiêu tốn tài nguyên.

---

## 2. Bảo mật API Key (API Key Security)

* **Không lưu Key ở Client**: Tuyệt đối không nhúng bất kỳ API Key nào của OpenAI, Google Cloud hay Azure vào mã nguồn Flutter di động hoặc React Web Admin.
* **Secrets Manager ở Backend**: Toàn bộ API Key được quản lý tập trung thông qua Cloud Secret Manager của Google Cloud (tích hợp trong Firebase). Cloud Functions truy xuất các API Key này thông qua biến môi trường an toàn tại thời điểm chạy:
  ```typescript
  const openaiKey = process.env.OPENAI_API_KEY;
  ```
  *Lợi ích*: Nếu ứng dụng di động bị dịch ngược (decompile), kẻ tấn công cũng không thể lấy được API Key của dịch vụ.

---

## 3. Giám sát & Báo cáo qua Nhật ký (Usage Auditing)

Mọi lượt gọi nhận dạng giọng nói đều được ghi chép tự động vào Firestore collection `voiceUsageLogs`.

### Dữ liệu mẫu của một Log:
```json
{
  "userId": "user_12345",
  "childId": "child_abcde",
  "lessonId": "lesson_dialogue_basic",
  "activityId": "act_lesson_dialogue_basic_1",
  "provider": "openai",
  "type": "STT",
  "durationSec": 3,
  "transcriptLength": 8,
  "result": "CORRECT",
  "status": "SUCCESS",
  "createdAt": "2026-05-24T15:30:00.000Z"
}
```

### Cách truy vấn kiểm tra chi phí:
Quản trị viên có thể xem số lượng cuộc gọi STT hàng tháng bằng cách đếm số tài liệu trong `voiceUsageLogs` hoặc tạo bảng thống kê trên Firebase Console dựa theo trường `provider` và `result` để ước tính chi phí API:
* **Chi phí ước tính OpenAI Whisper**: `$0.006` / phút (khoảng `$0.0006` cho mỗi lượt ghi âm 6 giây). Với 10,000 lượt gọi/tháng, chi phí chỉ khoảng `$6` USD.
* **Theo dõi lỗi**: Các bản ghi có `status = "ERROR"` giúp phát hiện các sự cố lỗi mạng hoặc thiết bị của bé bị cấu hình sai định dạng ghi âm.
