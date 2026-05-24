# Hướng dẫn Tương thích Dữ liệu Di động (Mobile Data Compatibility)

Tài liệu này giải thích cách thức ứng dụng Flutter (`mobile-flutter`) tải và xử lý dữ liệu một cách an toàn giữa cấu trúc Firestore cũ (Legacy) và cấu trúc mới của Phase 2 & 3.

---

## 1. Nguyên tắc Tương thích Chung

Ứng dụng di động Flutter sử dụng các mô hình dữ liệu (Models) được viết tay với các bộ chuyển đổi `fromMap` thủ công (không dùng mã tự động sinh). Để tránh crash ứng dụng khi đọc dữ liệu cũ chưa được cập nhật đầy đủ, các nguyên tắc sau được áp dụng nghiêm ngặt:
- **Safe Defaults**: Mọi trường dữ liệu không bắt buộc hoặc mới bổ sung đều phải có giá trị mặc định an toàn (`?? ''`, `const []`, `const {}`).
- **Safe Parsers**: Sử dụng các hàm tiện ích trong `model_helpers.dart` để chuyển đổi kiểu dữ liệu an toàn (ví dụ: `readInt`, `readDouble`, `readStringList`, `readDate`).
- **Nullable Fields**: Các trường có thể không có ở phiên bản cũ và không có giá trị mặc định hợp lý thì được khai báo dạng nullable (ví dụ: `String? audioUrl`).

---

## 2. Chi tiết Xử lý các Thay đổi Quan trọng

### A. PathItem.requiredCompletion

Trong Phase 2, trường `requiredCompletion` được thiết kế dưới dạng một đối tượng cấu hình phức tạp:
```json
"requiredCompletion": {
  "status": "COMPLETED",
  "minScore": 60
}
```

Tuy nhiên, trong Phase 3 Admin Web, trường này đã được chuẩn hóa thành kiểu `boolean` (`true` hoặc `false`) để đơn giản hóa giao diện và trải nghiệm.

**Giải pháp tương thích trong Flutter (`domain.dart`):**
Lớp Dart phân tích cú pháp trường này một cách linh hoạt:
```dart
factory PathItem.fromMap(String id, Map<String, dynamic> map) {
  final reqVal = map['requiredCompletion'];
  bool reqBool = true;
  if (reqVal is bool) {
    reqBool = reqVal;
  } else if (reqVal is Map) {
    // Nếu là Map cũ của Phase 2, coi như bài học đó bắt buộc hoàn thành
    reqBool = true;
  }
  
  return PathItem(
    id: id,
    pathId: '${map['pathId'] ?? ''}',
    lessonId: '${map['lessonId'] ?? ''}',
    sequence: readInt(map['sequence']),
    unlockRule: unlockRuleFromString(map['unlockRule']),
    prerequisiteLessonIds: readStringList(map['prerequisiteLessonIds']),
    requiredCompletion: reqBool,
  );
}
```
Nhờ cơ chế này, app di động tương thích hoàn toàn với cả hai kiểu cấu trúc dữ liệu trong Firestore mà không gây crash.

---

### B. Các trường nâng cao của NPC (Mascot)

Các Mascot cũ chỉ có các trường cơ bản như `name`, `description`, `imageUrl`, `isActive`. Phase 3 giới thiệu các trường nâng cao phục vụ cho hệ thống hội thoại, gamification và liên kết lộ trình học tập:
- `role`, `personality`, `unlockBenefit`, `accessType`
- `skillTags`, `programIds`, `pathIds`
- `dialogueTemplates` (NPCDialogueTemplates)

**Giải pháp tương thích trong Flutter (`npc.dart`):**
```dart
factory NPC.fromMap(String id, Map<String, dynamic> map) => NPC(
  id: id,
  name: '${map['name'] ?? ''}',
  description: '${map['description'] ?? ''}',
  imageUrl: '${map['imageUrl'] ?? ''}',
  animationUrl: map['animationUrl']?.toString(),
  defaultDialogue: '${map['defaultDialogue'] ?? ''}',
  isActive: map['isActive'] != false,
  role: '${map['role'] ?? ''}',
  personality: '${map['personality'] ?? ''}',
  skillTags: readStringList(map['skillTags']),
  programIds: readStringList(map['programIds']),
  pathIds: readStringList(map['pathIds']),
  dialogueTemplates: NPCDialogueTemplates.fromMap(readMap(map['dialogueTemplates'])),
  unlockBenefit: '${map['unlockBenefit'] ?? ''}',
  accessType: accessTypeFromString(map['accessType']),
);
```
Nếu NPC được tải từ tài liệu cũ (không có các trường mới), ứng dụng sẽ tự động gán chuỗi rỗng (`''`), danh sách rỗng (`[]`), hoặc mẫu hội thoại mặc định trống, giúp giao diện hiển thị mượt mà.

---

### C. Các trường mới của Activity

Để hỗ trợ AI Voice Quiz và các định dạng đa phương tiện nâng cao của Phase 3.5 & 4, lớp `Activity` đã được bổ sung các trường tùy chọn:
- `audioUrl` (String?): Đường dẫn âm thanh phát âm mẫu.
- `imageUrl` (String?): Hình ảnh gợi ý của hoạt động.
- `ttsPromptText` (String?): Kịch bản văn bản để AI/hệ thống chuyển đổi giọng nói (text-to-speech).

**Giải pháp tương thích trong Flutter (`domain.dart`):**
```dart
audioUrl: map['audioUrl']?.toString(),
imageUrl: map['imageUrl']?.toString(),
ttsPromptText: map['ttsPromptText']?.toString(),
```
Các trường này được định nghĩa là Nullable. Nếu không tồn tại trong tài liệu cũ, chúng sẽ có giá trị `null`, cho phép giao diện bỏ qua hoặc dùng fallback thích hợp mà không gây lỗi.

---

## 3. Tương thích Ngược với Dữ liệu Học tập Legacy

Mặc dù chúng ta giới thiệu cấu trúc Chương trình (`programs`), Lộ trình (`learningPaths`), và Hoạt động (`activities`), ứng dụng di động vẫn giữ nguyên tính tương thích với cấu trúc cũ:
1. **Lessons**: Vẫn hoạt động bình thường kể cả khi không thuộc bất cứ Lộ trình (`learningPaths`) nào.
2. **Questions / Dialogues / Flashcards**: Các tài liệu trong các collection cũ (`mathQuestions`, `dialogues`, `flashcards`) vẫn tồn tại độc lập. Khi chạy bài học không có danh sách `activities` liên kết mới, runtime adapter trong ứng dụng di động sẽ tự động map dữ liệu câu hỏi cũ sang giao diện hoạt động tương ứng để hiển thị cho trẻ.
