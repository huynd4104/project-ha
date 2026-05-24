# Luồng Học Tập Trên Ứng Dụng Di Động (Mobile Learning Flow)

Tài liệu này mô tả chi tiết cách thức hoạt động, logic kiểm tra điều kiện mở khóa và luồng điều hướng của bài học trên ứng dụng di động Flutter dành cho trẻ.

---

## 1. Bản Đồ Học Tập & Trạng Thái Bài Học (Learning Map & Node States)

Màn hình bản đồ bài học `LearningPathScreen` hiển thị các bài học tương ứng với lộ trình hiện tại của trẻ (`LearningPath` và các `PathItem`).

Các bài học (`LessonNode`) được phân loại theo các trạng thái trực quan:
- **`completed`**: Trẻ đã hoàn thành bài học (dữ liệu `status == 'COMPLETED'` tồn tại trên collection `progress` của Firestore). Hiển thị màu xanh lá cây cùng huy hiệu hoàn thành.
- **`current`**: Bài học tiếp theo trẻ nên làm (là bài học chưa hoàn thành đầu tiên trong danh sách). Hiển thị nổi bật, có hiệu ứng động kích thích trẻ nhấp chọn.
- **`available`**: Bài học đã được mở khóa và sẵn sàng học nhưng chưa đến lượt ưu tiên hiện tại.
- **`locked`**: Bài học bị khóa. Trẻ không thể nhấp vào.
- **`premiumLocked`**: Bài học nâng cấp. Hiển thị màu cam hổ phách cao cấp. Khi phụ huynh hoặc trẻ nhấp vào, hệ thống sẽ hiển thị một thông báo hướng dẫn nhập mã kích hoạt để mở khóa.

---

## 2. Luật Mở Khóa Bài Học (Unlock Rules)

Mỗi `PathItem` trong lộ trình học có cấu hình trường `unlockRule` và các điều kiện đi kèm. Các luật mở khóa bao gồm:

### ALWAYS_OPEN (Luôn mở)
- **Quy tắc**: Bài học này luôn ở trạng thái khả dụng (`available` hoặc `current` nếu chưa học) bất kể trạng thái của các bài học khác trong lộ trình.
- **Ứng dụng**: Dùng cho các bài học nhập môn, các hoạt động tự do hoặc bài đánh giá ban đầu.

### PREVIOUS_COMPLETED (Bài học trước hoàn thành)
- **Quy tắc**: Bài học chỉ được mở khóa khi bài học ngay trước đó trong chuỗi `sequence` có trạng thái hoàn thành (`COMPLETED`).
- **Ứng dụng**: Luồng học tuyến tính chuẩn, đảm bảo trẻ học theo đúng lộ trình sư phạm nâng dần độ khó.

### PREMIUM_ONLY (Chỉ tài khoản Premium)
- **Quy tắc**: Chỉ mở khóa khi tài khoản của trẻ có gói đăng ký premium đang hoạt động hoặc được kích hoạt bằng mã khuyến nghị tương ứng.
- **Giao diện**: Node hiển thị trạng thái `premiumLocked`. Nhấp vào sẽ mở popup hướng dẫn phụ huynh kích hoạt.

### MANUAL_UNLOCK (Kích hoạt thủ công)
- **Quy tắc**: Bài học bị khóa mặc định và chỉ được mở khóa khi admin hoặc phụ huynh kích hoạt thủ công từ trang quản trị/hồ sơ.
- **Giao diện**: Node hiển thị trạng thái `locked` một cách an toàn.

---

## 3. Điều Hướng Động & Fallback Bài Học Cũ (Dynamic Routing & Fallback)

Để đảm bảo tính tương thích ngược với dữ liệu cũ (Legacy compatibility), luồng điều hướng hoạt động như sau:

1. Khi trẻ nhấp vào một bài học khả dụng trên Bản đồ học tập, hệ thống mở màn hình chi tiết bài học `LessonDetailScreen`.
2. Khi nhấp vào nút **"Bắt đầu"** trong màn hình chi tiết:
   - Hệ thống thực hiện một truy vấn nhanh lên Firestore kiểm tra xem có tài liệu hoạt động mới nào trong collection `activities` liên kết với `lessonId` này hay không.
   - **Nếu có activities mới**: Chuyển hướng sang màn hình học thống nhất mới `ActivityLessonScreen` (route `/lesson/:id/activity`).
   - **Nếu không có activities mới (Bài học cũ/Legacy Fallback)**: Tự động chuyển hướng về các màn hình học cũ tương ứng với loại bài học (`MathLessonScreen`, `DialogueLessonScreen`, hoặc `FlashcardScreen`).
3. Nếu trẻ mở trực tiếp màn hình `ActivityLessonScreen` (ví dụ từ thẻ gợi ý ở trang Home) đối với bài học cũ không có activities, màn hình này cũng tự động phát hiện danh sách hoạt động trống và chuyển hướng về luồng cũ ngay lập tức mà không gây crash ứng dụng.

---

## 4. Đồng Bộ Tiến Độ Server-Side (Server-authoritative Progress)

Để ngăn chặn việc gian lận hoặc sai lệch dữ liệu từ phía client, toàn bộ tiến trình học tập đều được ghi nhận thông qua Firebase Cloud Functions:

- **Mỗi hoạt động (Activity Attempts)**:
  - Khi hoàn thành mỗi màn hình hoạt động, client gọi Cloud Function `submitActivityAttempt` truyền lên kết quả cụ thể.
  - Server thực hiện ghi nhận vào collection `activityAttempts`. Client không có quyền ghi trực tiếp vào collection này.
- **Kết thúc bài học (Lesson Completion)**:
  - Khi hoàn thành tất cả hoạt động, client gọi Cloud Function `submitLessonCompletion`.
  - Server tự động tính toán tổng điểm, cấp phát điểm thưởng XP, kiểm tra và nâng cấp level, cập nhật chuỗi học tập (Streak) và cấp phát huy hiệu (Badge) mới nếu đạt điều kiện.
  - Kết quả trả về từ server sẽ được client sử dụng để hiển thị màn hình chúc mừng `ResultScreen`.
