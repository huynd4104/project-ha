# Admin Content Workflow (Phase 3)

## Tổng quan

Phase 3 chuyển admin panel từ CRUD rời rạc sang workflow tạo nội dung học theo nghiệp vụ:

```
Taxonomy → Program → Learning Path → Path Items → Lesson → Activities → NPC/Activation → Publish
```

## Workflow tạo nội dung

### 1. Tạo Taxonomy (Phân loại)
- **Trang**: `/taxonomy`
- Tạo **Nhóm khó khăn** (developmentCategories): key, label, description, orderIndex
- Tạo **Mục tiêu học** (learningGoals): key, label, description, skillTags
- Tạo **Kỹ năng** (skills): key, label, domain, parentDescription
- Hỗ trợ import CSV

### 2. Tạo Chương trình (Programs)
- **Trang**: `/programs-v2`
- Liên kết với: difficultyCategories, learningGoals, skillTags (multi-select)
- Cấu hình: targetAgeMin/Max, level, accessType, status (DRAFT/PUBLISHED/ARCHIVED)
- Publish validation: cần title, description, learningGoals, skillTags

### 3. Tạo Lộ trình (Learning Paths)
- **Trang**: `/learning-paths-v2`
- Thuộc về 1 program (dropdown)
- Target profile rules: difficultyCategories, learningGoals, supportLevel, age range
- Filter theo program

### 4. Xây dựng lộ trình (Path Builder)
- **Trang**: `/path-builder`
- Chọn Program → chọn Path → thêm bài học vào path
- Sắp xếp thứ tự (lên/xuống)
- Cấu hình unlock rule: ALWAYS_OPEN, PREVIOUS_COMPLETED, MANUAL_UNLOCK, PREMIUM_ONLY
- Cấu hình bắt buộc hoàn thành (requiredCompletion)

### 5. Tạo Bài học v2 (Lessons)
- **Trang**: `/lessons-v2`
- Liên kết: program, path, NPC, skillTags, difficultyCategories, learningGoals
- Cấu hình: lessonType, estimatedMinutes, level, accessType, publishStatus
- Publish validation: cần title, description, estimatedMinutes, learningGoals, skillTags

### 6. Xây dựng Hoạt động (Activity Builder)
- **Trang**: `/activity-builder`
- Chọn bài học → xem/thêm/sửa/xóa hoạt động
- Sắp xếp thứ tự
- Form thay đổi theo activityType:
  - MULTIPLE_CHOICE: câu hỏi + 2-4 lựa chọn
  - LISTEN_AND_CHOOSE_IMAGE: audio + hình ảnh options
  - VOICE_ANSWER: TTS prompt + acceptedAnswers + retryLimit
  - PARENT_MARK_RESULT: hướng dẫn phụ huynh
  - Và nhiều loại khác...

### 7. Mascot NPC v2
- **Trang**: `/npcs-v2`
- Tất cả fields hiện tại + phần Advanced:
  - Vai trò, tính cách, kỹ năng liên quan
  - Liên kết chương trình, lộ trình
  - Mẫu câu thoại (dialogue templates)
  - Lợi ích khi mở khóa

### 8. Mã kích hoạt
- **Trang**: `/activation-codes`
- Loại: NPC, LESSON, PATH, REWARD, PHYSICAL_TOY
- Nguồn: QR, NFC, MANUAL
- Tạo mã random, xem trước QR, tải QR PNG
- Giới hạn maxUses, perUserLimit

## Legacy Pages

Tất cả trang cũ vẫn hoạt động bình thường tại URL gốc. Trong sidebar được gom nhóm "Legacy" với badge đánh dấu.

## Publish Validation

Khi chuyển status sang PUBLISHED, hệ thống kiểm tra:
- **Program**: cần title, description, learningGoals, skillTags, age range hợp lệ
- **Path**: cần programId, title, ít nhất 1 bài học
- **Lesson**: cần title, description, lessonType, estimatedMinutes, learningGoals, skillTags
- **Activity**: cần activityType, prompt, options (nếu multiple choice), acceptedAnswers (nếu voice)
