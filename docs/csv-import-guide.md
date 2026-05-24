# CSV / Excel Import Guide

Admin Web hỗ trợ import `.csv` và `.xlsx` cho các màn CRUD chính. Luôn tải template từ đúng màn hình trước khi nhập dữ liệu để tránh sai header.

## Thứ tự import khuyến nghị

1. Media Assets
2. NPCs
3. QR Codes
4. Lessons
5. Math Questions
6. Dialogues
7. Flashcards
8. Badges
9. Daily Missions

Thứ tự này quan trọng vì một số file cần map quan hệ bằng tên:

- QR Codes cần `npcName` để tìm NPC.
- Lessons có thể cần `relatedNpc` để tìm NPC.
- Math Questions, Dialogues và Flashcards cần `lessonTitle` để tìm lesson.

Nếu import file phụ thuộc trước khi dữ liệu gốc tồn tại, modal sẽ báo lỗi theo từng dòng và không cho import.

## Cách dùng

1. Vào màn admin cần import.
2. Bấm `Download Template` để tải template Excel mặc định, hoặc mở modal import để tải `Download CSV Template` / `Download Excel Template`.
3. Điền dữ liệu vào file, giữ nguyên header.
4. Bấm `Import CSV`.
5. Chọn file `.csv` hoặc `.xlsx`.
6. Kiểm tra preview và lỗi từng dòng.
7. Bấm `Import valid rows` khi toàn bộ dòng hợp lệ.

Nếu file có lỗi format hoặc sai dữ liệu, modal sẽ hiển thị lỗi và không ghi Firestore.

Nếu gặp lỗi `Missing or insufficient permissions`, kiểm tra tài khoản đang đăng nhập có `role = ADMIN`, `isActive = true` trong collection `users`, và Firestore rules mới nhất đã được deploy.

Bạn có thể copy CSV text như ví dụ dưới đây vào Excel, sau đó lưu thành `.xlsx`:

```csv
name,type,category,url
Mèo Mimi Image,IMAGE,NPC,https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f431.svg
```

Hoặc import trực tiếp file `.csv` có cùng header.

## Headers

### Media Assets

```csv
name,type,category,url,thumbnailUrl
```

`type`: `IMAGE`, `AUDIO`, `VIDEO`

`category`: `NPC`, `FLASHCARD`, `DIALOGUE`, `BADGE`, `GENERAL`

### NPCs

```csv
name,description,imageUrl,animationUrl,defaultDialogue,isActive
```

`isActive` mặc định là `true` nếu để trống.

### QR Codes

```csv
label,code,npcName,isActive,maxUses
```

`npcName` phải trùng tên NPC đã có. `code` không được trùng QR code đang tồn tại.

### Lessons

```csv
title,description,type,relatedNpc,orderIndex,isActive
```

`type`: `MATH`, `DIALOGUE`

`relatedNpc` là optional. Nếu có, tên phải trùng NPC đã có.

### Math Questions

```csv
lessonTitle,questionText,imageUrl,optionA,optionB,optionC,optionD,correctOption,explanation,orderIndex
```

`lessonTitle` phải là lesson type `MATH`. `correctOption`: `A`, `B`, `C`, `D`.

### Dialogues

```csv
lessonTitle,title,sceneText,audioUrl,questionText,optionA,optionB,optionC,optionD,correctOption,orderIndex
```

`lessonTitle` phải là lesson type `DIALOGUE`. `correctOption`: `A`, `B`, `C`, `D`.

### Flashcards

```csv
lessonTitle,frontText,backText,imageUrl,audioUrl,orderIndex
```

`lessonTitle` phải tồn tại trong Lessons.

### Badges

```csv
name,description,iconUrl,type,conditionType,conditionValue,isActive
```

`type`: `LESSON`, `STREAK`, `XP`, `NPC`, `MISSION`

`conditionType`: `COMPLETE_LESSONS`, `STREAK_DAYS`, `TOTAL_XP`, `UNLOCK_NPCS`, `COMPLETE_DAILY_MISSIONS`

### Daily Missions

```csv
title,description,type,targetValue,rewardXp,isActive
```

`type`: `COMPLETE_LESSON`, `REVIEW_FLASHCARD`, `SCAN_QR`, `COMPLETE_DIALOGUE`, `COMPLETE_MATH`

## Giá trị boolean và number

Boolean chấp nhận:

- `true` / `false`
- `TRUE` / `FALSE`
- `yes` / `no`
- `1` / `0`

Number phải là số hợp lệ. Field optional như `maxUses` có thể để trống.

## Lỗi thường gặp

- `Không tìm thấy NPC`: `npcName` hoặc `relatedNpc` không trùng tên NPC đã có.
- `Không tìm thấy lesson`: `lessonTitle` không trùng title lesson đã có.
- `Lesson sai type`: import Math Questions vào lesson không phải `MATH`, hoặc Dialogues vào lesson không phải `DIALOGUE`.
- `QR code đã tồn tại`: `code` bị trùng với QR code hiện có.
- `NPC đã tồn tại`, `Lesson đã tồn tại`, `Badge đã tồn tại`, `Daily Mission đã tồn tại`: tên hoặc title đã tồn tại.
- Sai enum: giá trị không nằm trong danh sách enum được hỗ trợ.
- Sai boolean: giá trị không thuộc nhóm boolean hợp lệ.
- Thiếu field required: field bắt buộc bị để trống.

Nếu có nhiều NPC hoặc lesson trùng tên, import sẽ ưu tiên record đầu tiên và hiển thị warning trong modal.
