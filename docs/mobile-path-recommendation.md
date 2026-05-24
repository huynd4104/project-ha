# Cơ Chế Gợi Ý Lộ Trình Học Tập (Path Recommendation Engine)

Tài liệu này giải thích thuật toán chấm điểm và gợi ý lộ trình học tập cá nhân hóa cho từng trẻ dựa trên hồ sơ phát triển được tích hợp trong ứng dụng di động Flutter.

---

## Nguyên Lý Hoạt Động

Mục tiêu của công cụ gợi ý (`PathRecommendationService`) là chấm điểm mức độ phù hợp của tất cả các lộ trình học tập (`learningPaths` và `programs`) đã được xuất bản đối với hồ sơ hiện tại của trẻ (`ChildProfile`). 

Kết quả đầu ra là danh sách các lộ trình được sắp xếp theo điểm số từ cao xuống thấp. Lộ trình có điểm số cao nhất sẽ được tự động chọn làm mặc định hoặc được đánh dấu nổi bật với huy hiệu **"Đề xuất tốt nhất"** trên màn hình chọn lộ trình.

---

## Quy Tắc Chấm Điểm (Scoring Rules)

Hệ thống tính điểm cho mỗi lộ trình dựa trên 3 tiêu chí chính trong hồ sơ trẻ:

### 1. Trùng Khớp Khó Khăn Phát Triển (`difficultyCategories`)
- Trẻ có khó khăn chính (`primaryDifficulty`) và danh sách các khó khăn phụ (`secondaryDifficulties`).
- Mỗi chương trình học (`Program`) liên kết với lộ trình được định cấu hình danh sách các khó khăn phát triển mà chương trình đó nhắm tới (`difficultyCategories`).
- **Quy tắc cộng điểm**:
  - Nếu khó khăn chính của trẻ nằm trong danh sách hỗ trợ của chương trình: **+50 điểm**.
  - Đối với mỗi khó khăn phụ của trẻ trùng khớp với danh sách hỗ trợ của chương trình: **+15 điểm** mỗi trùng khớp.

### 2. Trùng Khớp Mục Tiêu Học Tập (`learningGoals`)
- Phụ huynh lựa chọn các mục tiêu mong muốn đạt được cho con (`learningGoals`) trong hồ sơ trẻ.
- Mỗi chương trình học cũng định nghĩa danh sách các mục tiêu học tập mà nó hướng tới.
- **Quy tắc cộng điểm**:
  - Đối với mỗi mục tiêu học tập trùng khớp giữa hồ sơ trẻ và chương trình: **+20 điểm** mỗi trùng khớp.

### 3. Phù Hợp Độ Tuổi (`targetAge`)
- Mỗi chương trình học có dải độ tuổi tối ưu: `targetAgeMin` và `targetAgeMax`.
- **Quy tắc cộng điểm**:
  - Nếu tuổi hiện tại của trẻ nằm hoàn toàn trong dải độ tuổi tối ưu của chương trình: **+30 điểm**.
  - Nếu nằm ngoài dải độ tuổi, không được cộng điểm tiêu chí này.

---

## Ví dụ Chấm Điểm Thực Tế

Giả sử bé **Nam (5 tuổi)** có hồ sơ phát triển như sau:
- Khó khăn chính: `SPEECH_DELAY` (Chậm nói)
- Khó khăn phụ: `ADHD` (Tăng động giảm chú ý)
- Mục tiêu học tập: `COMMUNICATION` (Giao tiếp), `FOCUS` (Tập trung)

Hệ thống có 2 chương trình:
1. **Chương trình A: Luyện nghe cơ bản**
   - Hỗ trợ khó khăn: `SPEECH_DELAY`
   - Mục tiêu: `COMMUNICATION`
   - Độ tuổi phù hợp: 3 - 6 tuổi
   - **Tính điểm**:
     - Khó khăn chính khớp (`SPEECH_DELAY`): **+50 điểm**
     - Khó khăn phụ: 0 điểm
     - Mục tiêu khớp (`COMMUNICATION`): **+20 điểm**
     - Phù hợp tuổi (5 tuổi nằm trong dải 3-6): **+30 điểm**
     - **Tổng điểm: 100 điểm** (Đề xuất tốt nhất)

2. **Chương trình B: Tập trung vận động**
   - Hỗ trợ khó khăn: `ADHD`
   - Mục tiêu: `FOCUS`, `PHYSICAL`
   - Độ tuổi phù hợp: 6 - 10 tuổi
   - **Tính điểm**:
     - Khó khăn chính: 0 điểm
     - Khó khăn phụ khớp (`ADHD`): **+15 điểm**
     - Mục tiêu khớp (`FOCUS`): **+20 điểm**
     - Phù hợp tuổi (5 tuổi nằm ngoài dải 6-10): 0 điểm
     - **Tổng điểm: 35 điểm**
