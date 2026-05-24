# Đăng Ký Bộ Dịch Hoạt Động (Activity Renderer Registry)

Tài liệu này hướng dẫn chi tiết về cấu trúc `ActivityRendererRegistry` và cách 8 bộ dịch hoạt động (Activity Renderers) được xây dựng và đăng ký để xử lý các bài học tương tác trong ứng dụng di động Flutter.

---

## Kiến trúc Registry

Bộ dịch hoạt động được thiết kế theo mẫu **Registry Pattern**, giúp cô lập các UI component học tập khỏi luồng chính của màn hình bài học `ActivityLessonScreen`. 

- **Định nghĩa Builder**:
  ```dart
  typedef ActivityRendererBuilder =
      Widget Function(BuildContext context, Activity activity, AnswerCallback onAnswerSubmitted);
  ```
- **Callback gửi đáp án (`AnswerCallback`)**:
  ```dart
  typedef AnswerCallback = void Function(String selectedAnswer, String result, double score);
  ```
  * `selectedAnswer`: Câu trả lời được nhập/chọn (dùng để lưu payload).
  * `result`: Kết quả đánh giá: `'correct'` (đúng), `'wrong'` (sai), `'almost'` (gần đúng), `'done'` (hoàn thành), `'partial'` (hoàn thành một phần), `'not_yet'` (chưa hoàn thành).
  * `score`: Điểm số đạt được (0.0 đến 10.0).

---

## Chi tiết 8 Bộ Dịch Hoạt Động (Renderers)

### 1. Trắc nghiệm Một Đáp Án (`ChoiceAnswerRenderer`)
- **Loại hoạt động hỗ trợ**: `multipleChoice`, `listenAndChooseImage`, `lookAndChooseWord`, `emotionRecognition`.
- **Đặc điểm**:
  - Tự động phát hiện nếu các lựa chọn (`options`) có chứa hình ảnh để chuyển đổi layout linh hoạt giữa danh sách hàng dọc (chỉ có chữ) và lưới Grid 2x2 (chữ kèm hình ảnh).
  - Có nút nghe phát âm câu hỏi (`AudioButton`) nếu hoạt động được gán `audioUrl`.
  - So khớp đáp án lựa chọn trực tiếp với danh sách `correctAnswers`.

### 2. Trả Lời Tự Do (`TextAnswerRenderer`)
- **Loại hoạt động hỗ trợ**: Các hoạt động điền từ tự do bằng bàn phím.
- **Đặc điểm**:
  - Hiển thị ô nhập dữ liệu `TextField` mượt mà cùng nút "Gửi câu trả lời".
  - So khớp chuỗi nhập liệu (không phân biệt chữ hoa/thường) với `correctAnswers` (đánh giá `correct`) và `almostAnswers` (đánh giá `almost`).

### 3. Ghép Chữ Cái (`SpellingRenderer`)
- **Loại hoạt động hỗ trợ**: Các bài học luyện đánh vần và viết từ vựng.
- **Đặc điểm**:
  - Tự động phân tách từ khóa đúng (từ `correctAnswers`) thành các chữ cái đơn lẻ và trộn ngẫu nhiên.
  - Trẻ nhấp chọn các khối chữ cái để ghép vào vị trí đích. Hỗ trợ nút xóa kí tự cuối cùng và nút đặt lại từ đầu.
  - Tự động nộp bài khi các chữ cái được điền đầy đủ.

### 4. Kéo Thả / Điền Vào Ô Trống (`DragDropRenderer`)
- **Loại hoạt động hỗ trợ**: Ghép cặp hoặc điền từ vào chỗ trống (`matchObjects`).
- **Đặc điểm**:
  - Giao diện hiển thị câu hỏi chứa ký tự khuyết dạng `____`.
  - Hiển thị các viên thuốc từ vựng gợi ý ở bên dưới. Khi trẻ nhấp chọn một từ gợi ý, hệ thống tự động điền từ đó vào khoảng trống trong câu để trẻ dễ dàng quan sát ngữ cảnh trước khi nhấn nút nộp bài.

### 5. Thẻ Học Tương Tác (`FlashcardRenderer`)
- **Loại hoạt động hỗ trợ**: Luyện tập ghi nhớ thẻ học (`flashcardReview`).
- **Đặc điểm**:
  - Thể hiện một chiếc thẻ lớn 3D sinh động ở trung tâm. Nhấp vào thẻ để kích hoạt hiệu ứng lật (mặt trước: từ vựng + hình ảnh; mặt sau: nghĩa tiếng Việt + hướng dẫn của phụ huynh).
  - Có nút nghe phát âm riêng cho thẻ. Nút "Đã thuộc thẻ" để chuyển hoạt động tiếp theo.

### 6. Hội Thoại & Nhập Vai (`DialogueRoleplayRenderer`)
- **Loại hoạt động hỗ trợ**: Hội thoại, nhập vai cùng Mascot (`hearAndRepeat`, `dailyLifeScenario`).
- **Đặc điểm**:
  - Hiển thị khung chat hội thoại giữa hai nhân vật. Bong bóng của Mascot nằm bên trái, bong bóng câu trả lời của trẻ nằm bên phải.
  - Có nút nghe câu thoại mẫu.
  - Trẻ bấm giữ micro để nói lại câu thoại của mình (chạy demo mô phỏng ghi âm trong 2 giây rồi tự động nộp bài).

### 7. Trả Lời Giọng Nói (`VoiceAnswerRenderer`)
- **Loại hoạt động hỗ trợ**: Câu đố/luyện tập phản xạ nói tiếng Anh (`voiceAnswer`).
- **Đặc điểm**:
  - Hiển thị thông báo trạng thái: *"Tính năng trả lời bằng giọng nói sẽ được bổ sung ở giai đoạn AI Voice."*
  - Nút Micro lớn kèm hiệu ứng chuyển động sóng âm (waveform) khi kích hoạt.
  - Cho phép trẻ phát biểu tự do, sau đó bấm nút nộp bài.

### 8. Phụ Huynh Đánh Giá (`ParentMarkRenderer`)
- **Loại hoạt động hỗ trợ**: Đánh giá các hoạt động thực hành ngoài đời thực (`parentMarkResult`).
- **Đặc điểm**:
  - Chế độ đồng hành đặc biệt. Hiển thị gợi ý/hướng dẫn cụ thể dành riêng cho cha mẹ (`parentInstruction`).
  - Cung cấp 3 nút chấm điểm lớn để phụ huynh trực tiếp chấm cho trẻ:
    - 🌟 **Làm tốt** (`correct` / `done`, 10 điểm).
    - 🕳️ **Gần đúng** (`almost` / `partial`, 5 điểm).
    - ❌ **Thử lại sau** (`wrong` / `not_yet`, 0 điểm).
