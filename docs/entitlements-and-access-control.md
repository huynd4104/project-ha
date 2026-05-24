# Hệ thống Phân quyền (Entitlements) & Kiểm tra Truy cập

Tài liệu này chi tiết cấu trúc dữ liệu quyền hạn, thuật toán kiểm tra truy cập (Access Control) và các kịch bản biên (Edge cases) xử lý cước trên Mobile Flutter.

---

## 1. Cấu trúc Quyền hạn (Entitlement Flags)

Hệ thống phân quyền được thiết kế dạng **Entitlement-based**, tách biệt giữa gói cước cụ thể (`plan`) và các tính năng chi tiết mà gói cước đó được phép sử dụng (`entitlements`).

Đối với mỗi người dùng, Firestore lưu giữ cấu trúc cước tại document `users/{userId}`:

```json
{
  "subscriptionSummary": {
    "plan": "PREMIUM", 
    "status": "ACTIVE",
    "expiresAt": "2026-06-24T15:00:00.000Z",
    "entitlements": {
      "premiumContent": true,
      "voiceQuiz": true,
      "advancedReports": true,
      "premiumNpcs": true
    },
    "updatedAt": "2026-05-24T15:00:00.000Z"
  }
}
```

### Các cờ quyền hạn (Entitlements)
1. **`premiumContent`**: Cho phép bé học các Lộ trình học (Learning Path), Chương trình (Program) hoặc Bài học (Lesson) được đánh dấu là `PREMIUM`.
2. **`voiceQuiz`**: Quyền lợi sử dụng AI Voice Quiz.
   > [!NOTE]
   > Cờ `voiceQuiz = true` đã được tích hợp và hoạt động thực tế kể từ **Phase 6** phục vụ tính năng AI Voice Quiz MVP.
3. **`advancedReports`**: Cho phép phụ huynh xem các báo cáo phân tích sâu, thống kê hành vi và biểu đồ tiến độ nâng cao tại Parent Dashboard.
4. **`premiumNpcs`**: Cho phép bé mở khóa và nói chuyện với các Mascot VIP (ví dụ: Bạn Nana).

---

## 2. Gói dùng thử TRIAL

Để hỗ trợ kiểm thử dễ dàng, gói `TRIAL` được thiết lập với đầy đủ 4 cờ entitlement giống hệt như gói `PREMIUM`. Tuy nhiên, gói `TRIAL` có các đặc thù sau:
* **Bắt buộc có hạn dùng:** Gói `TRIAL` bắt buộc phải có thời điểm hết hạn `expiresAt` (không được phép để `null` như gói `PREMIUM`).
* **Kiểm tra hết hạn:** Ngay khi `expiresAt` nhỏ hơn thời gian hiện tại, hệ thống Access Check sẽ coi như người dùng không còn quyền hạn Premium.

---

## 3. Thuật toán Kiểm tra Quyền (Access Check)

Trên mobile, lớp `AccessCheck` (`mobile-flutter/lib/core/utils/access_check.dart`) chịu trách nhiệm quyết định xem người dùng có quyền mở nội dung hay không.

### logic kiểm tra:
1. Nếu nội dung có `accessType == AccessType.free` $\rightarrow$ Trả về `true` (Mở cho tất cả).
2. Nếu nội dung có `accessType == AccessType.premium`:
   * Kiểm tra xem `subscriptionSummary` có tồn tại hay không. Nếu không $\rightarrow$ Trả về `false`.
   * Kiểm tra xem `plan` có phải là `PREMIUM` hoặc `TRIAL` hay không. Nếu không $\rightarrow$ Trả về `false`.
   * Kiểm tra xem `status` có phải là `ACTIVE` hay không. Nếu không $\rightarrow$ Trả về `false`.
   * Nếu có `expiresAt`, so sánh với thời gian hiện tại của thiết bị (`DateTime.now()`). Nếu đã qua hạn dùng $\rightarrow$ Trả về `false`.
   * Kiểm tra cờ entitlement tương ứng (ví dụ: `entitlements.premiumContent` đối với bài học). Nếu `false` $\rightarrow$ Trả về `false`.
   * Nếu vượt qua tất cả các bước trên $\rightarrow$ Trả về `true`.

---

## 4. Xử lý các Kịch bản Biên (Edge Cases)

### Hết hạn cước giữa phiên học (Active Session Expiration)
Để đảm bảo trải nghiệm học tập của trẻ không bị đứt gãy đột ngột:
* Hệ thống **chỉ kiểm tra quyền** tại các điểm bắt đầu: Khi chọn Lộ trình học, mở màn hình chi tiết bài học (LessonDetailScreen), hoặc mở bộ sưu tập Mascot.
* Nếu trẻ đã vượt qua kiểm tra ban đầu và đang trong màn hình bài học (`ActivityLessonScreen`), hệ thống **sẽ không chặn đột ngột** hoặc đá trẻ ra ngoài kể cả khi thời gian `expiresAt` trôi qua trong lúc học. Trẻ được phép hoàn thành toàn bộ các hoạt động (activities) của bài học đó.
* Khi bài học kết thúc, trẻ quay về màn hình Home hoặc bản đồ Learning Path, hệ thống sẽ thực hiện refresh lại trạng thái cước từ Firestore và thực thi việc khóa các nội dung Premium tiếp theo nếu gói đã hết hạn.

### Hết hạn cước khi Ngoại tuyến (Offline Expiration)
Do ứng dụng có chế độ offline:
* Khi thiết bị mất mạng, app sử dụng cache thông tin `subscriptionSummary` lưu gần nhất từ Firestore để kiểm tra quyền truy cập. Điều này giúp trẻ không bị gián đoạn bài học khi đi xe hoặc ở nơi không có sóng.
* Ở bản Premium Demo, hệ thống chấp nhận rủi ro người dùng gian lận bằng cách chỉnh lùi giờ trên thiết bị để hack thêm thời gian học offline. Việc phòng chống chỉnh giờ thiết bị (sử dụng NTP server hoặc khóa offline) được xếp vào backlog và sẽ giải quyết ở bản Production thực tế.
