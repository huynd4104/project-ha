# Phase 6: AI Voice Quiz MVP

Tài liệu này tổng hợp thiết kế, kiến trúc và hướng dẫn vận hành cho tính năng **AI Voice Quiz MVP** đã triển khai trong Phase 6.

---

## 1. Tổng quan & Phạm vi (Scope)

Tính năng AI Voice Quiz được xây dựng ở mức độ **MVP (Minimum Viable Product)** nhằm cung cấp giải pháp tương tác giọng nói cơ bản mà vẫn đảm bảo an toàn tài nguyên, bảo mật API Key và kiểm soát chi phí.

> [!WARNING]
> **Giới hạn phạm vi nghiêm ngặt:**
> - **Chỉ làm AI Voice Quiz MVP**: Không hỗ trợ hội thoại tự do (free conversation), chatbot hoặc phản hồi ngẫu nhiên.
> - **Không chấm điểm phát âm chuyên sâu**: Hệ thống chỉ so khớp từ khóa/cụm từ (Speech-to-Text & Keyword matching), không đánh giá ngữ điệu, âm tiết hoặc chấm điểm bản địa (pronunciation scoring).
> - **Không chẩn đoán y tế**: Tuyệt đối không đưa ra các đánh giá, chẩn đoán trẻ chậm nói hay rối loạn ngôn ngữ. Mọi phản hồi chỉ mang tính khích lệ học tập.
> - **Không RAG/Fine-tuning**: Không huấn luyện thêm model nhận diện giọng nói riêng.
> - **Không lưu file audio dài hạn**: File âm thanh ghi âm chỉ chuyển thành Base64 truyền trong RAM của Cloud Function, không lưu trữ lại trong Storage hoặc Database nhằm tránh chi phí rác và rủi ro quyền riêng tư.
> - **Entitlement Gating**: Tính năng này được khóa cứng cho gói PREMIUM hoặc TRIAL đang hoạt động. User FREE không thể gọi function này.

---

## 2. Các thành phần triển khai

### A. Cloud Functions (`submitVoiceAnswer`)
* **Kiểm tra quyền hạn**: Xác minh entitlement `voiceQuiz` của phụ huynh trước khi thực hiện STT.
* **Cost Control**: Giới hạn payload size (`<= 1.5MB`) và thời lượng ghi âm (`<= 6s`) để tránh spam.
* **Provider Routing**: Hỗ trợ chạy ở chế độ **Mock Provider** (mặc định) bằng cờ `ENABLE_MOCK_VOICE_PROVIDER = true` ở server và chuẩn bị sẵn khung kết nối OpenAI Whisper/Google Speech/Azure.
* **So khớp tiếng Việt**:
  - Chuẩn hóa chữ thường, xóa dấu câu và khoảng trắng dư thừa.
  - So khớp song song bản có dấu và không dấu để tối ưu lỗi nhận diện của microphone.
  - Áp dụng thuật toán khoảng cách Levenshtein để tính similarity. Similarity `>= 80%` được xếp vào dạng `ALMOST` (gần đúng), không trả về `CORRECT` (chính xác tuyệt đối) để giữ tiêu chuẩn học tập.
* **Nhật ký**: Mỗi lượt gọi đều ghi nhận metadata vào collection `voiceUsageLogs`.

### B. Mobile Flutter (`VoiceAnswerRenderer`)
* **Quản lý thiết bị ghi âm**: Khởi tạo và giải phóng tài nguyên micro của thiết bị bằng thư viện `record`.
* **Microphone Permissions**: Xin quyền microphone cho Android/iOS một cách thân thiện.
* **Premium Gate Paywall**: Hiển thị màn hình Premium Lock và dẫn phụ huynh đến trang Paywall nếu tài khoản là FREE hoặc hết hạn.
* **Giao diện 7 trạng thái**:
  1. `idle`: Chờ trẻ nhấn.
  2. `requestingPermission`: Đang yêu cầu quyền truy cập microphone.
  3. `recording`: Đang lắng nghe trẻ nói (có đếm ngược 3-5 giây).
  4. `uploading`: Đang mã hóa Base64 và gửi lên Cloud Function.
  5. `correct` / `almost` / `wrong`: Hiển thị kết quả kèm phản hồi từ Mascot và nội dung nghe được (`transcript`).
  6. `noSpeech`: Không phát hiện giọng nói (transcript rỗng/quá ngắn), hiển thị thông điệp khích lệ nói to hơn và cho phép thử lại trực tiếp mà không trừ lượt thử (`retryLimit`).
  7. `error`: Xử lý lỗi kết nối/microphone thân thiện.
* **Web Fallback**: Trong chế độ Debug/Demo, nếu trình duyệt không hỗ trợ micro hoặc bị từ chối quyền, ứng dụng hiển thị cụm Quick Mock Input để tester/phụ huynh giả lập câu trả lời thay vì crash. Ở chế độ Production, hiển thị thông điệp lỗi hướng dẫn sử dụng điện thoại hoặc cấp quyền đầy đủ.
* **Retry Limits**: Kiểm soát số lượt nói lại theo cấu hình `activity.retryLimit` của bài học.
* **Chế độ Debug/Quick Mock**: Cung cấp Dropdown chọn kết quả mock nhanh trên Emulator/Web debug giúp lập trình viên kiểm thử dễ dàng mà không cần cắm micro thật.

### C. Admin Web (`ActivityBuilderPage`)
* Bổ sung giao diện nhập liệu cho hoạt động `VOICE_ANSWER`:
  - `acceptedAnswers` (Mảng từ chấp nhận đúng).
  - `almostAnswers` (Mảng từ chấp nhận gần đúng).
  - `retryLimit` (Giới hạn thử lại, mặc định là 2).
  - `ttsPromptText` (Nội dung mascot đọc trước khi hỏi).
  - Phản hồi `feedback.correct`, `feedback.almost`, và `feedback.wrong`.
  - Cờ `voicePremiumRequired` kiểm soát việc khóa hoạt động giọng nói cụ thể.
* **Validation**: Kiểm tra bắt buộc có ít nhất 1 đáp án đúng trong `acceptedAnswers` và `retryLimit >= 0` trước khi lưu.

---

## 3. Nhật ký sử dụng (Cost & Usage logs)

Mọi yêu cầu phân tích giọng nói được ghi lại trong Firestore collection `voiceUsageLogs`:
* **Quyền ghi**: Chỉ admin hoặc Cloud Function mới có quyền ghi chép collection này (`firestore.rules` chặn client ghi trực tiếp).
* **Thông tin lưu trữ**:
  - `userId` & `childId`: Tài khoản thực hiện.
  - `lessonId` & `activityId`: Bài học và hoạt động tương ứng.
  - `durationSec`: Thời lượng audio thực tế.
  - `transcriptLength`: Độ dài chuỗi chữ nhận diện.
  - `result`: Kết quả khớp (`CORRECT` / `ALMOST` / `WRONG`).
  - `provider`: Provider STT được sử dụng (`mock`, `openai`, v.v.).
  - `status`: Trạng thái cuộc gọi (`SUCCESS` / `ERROR`).

---

## 4. Kịch bản Kiểm thử & Xác thực

1. **Khóa Premium**: Dùng tài khoản FREE vào bài học có hoạt động nói $\rightarrow$ Banner Khóa Premium xuất hiện. Bấm nâng cấp demo $\rightarrow$ Trở lại học bình thường.
2. **Xin quyền Micro**: Từ chối quyền $\rightarrow$ Banner cảnh báo nhẹ nhàng. Đồng ý quyền $\rightarrow$ Ghi âm bình thường.
3. **So khớp fuzzy tiếng Việt**:
   - Cấu hình đáp án đúng: `"xin chào"`.
   - Nếu nhận diện: `"xin chao"` (không dấu) $\rightarrow$ Trả về `CORRECT` nhờ so khớp không dấu song song.
   - Nếu nhận diện: `"chao"` $\rightarrow$ Trả về `ALMOST` nhờ so khớp `almostAnswers`.
   - Nếu nhận diện: `"sin chào"` $\rightarrow$ Tính Similarity = 87% $\rightarrow$ Trả về `ALMOST` (fuzzy match).
   - Nếu nhận diện: `"quả táo"` $\rightarrow$ Trả về `WRONG`.
