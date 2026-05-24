# Hướng Dẫn Sử Dụng Trang Quản Trị (Admin Panel)

Tài liệu này hướng dẫn quản trị viên (Admin) quản lý nội dung số, chuẩn bị tài nguyên học tập và in ấn mã QR tương tác cho ứng dụng trẻ em.

---

## 1. Khởi Tạo Thư Viện Media Mẫu (Presets)

Khi chạy dự án lần đầu tiên, thư viện media có thể bị trống. Để có tài nguyên demo nhanh chóng:
1. Truy cập mục **Thư viện Media** trên thanh menu bên trái.
2. Bấm nút **🌱 Seed Media Mẫu** ở góc trên bên phải.
3. Hệ thống sẽ tự động thêm 10 tài nguyên mẫu (hình ảnh nhân vật Mimi, Bobo, Nana, ảnh flashcard các loại quả và các tệp âm thanh hội thoại mẫu).
4. Bạn có thể bấm **Copy Link** trên từng thẻ để sử dụng nhanh, hoặc bấm **Thêm Media** để liên kết các tệp tin mới của riêng mình.

---

## 2. Quản Lý Nhân Vật NPC

1. Truy cập mục **Nhân vật NPC** và bấm **Thêm Nhân Vật**.
2. **Nhập Tên**: Ví dụ "Mèo Mimi".
3. **Mô tả**: Viết thông tin giới thiệu ngắn về vai trò của NPC.
4. **Hình ảnh đại diện**: Bấm nút **Thư viện** để mở cửa sổ chọn media, tìm và chọn hình ảnh Mèo Mimi mẫu, sau đó bấm **Chọn**.
5. **Thoại mặc định**: Câu thoại đầu tiên NPC nói khi con tương tác (ví dụ: "Chào con! Hôm nay con có khỏe không?").
6. Xem trước giao diện hiển thị của Mascot ở khung **Mô phỏng NPC** bên phải trước khi bấm **Tạo Mới** để lưu lại.

---

## 3. Quản Lý & In Ấn Mã QR Đồ Chơi

1. Truy cập mục **Mã QR** và bấm **Thêm Mã QR**.
2. **Nhập Nhãn**: Đặt tên gợi nhớ vị trí dán (ví dụ: "Mã dán trên Mèo gỗ Mimi").
3. **Mã định danh**: Bấm nút **Sinh mã** để tạo chuỗi code ngẫu nhiên và duy nhất.
4. **NPC liên kết**: Chọn nhân vật Mèo Mimi trong dropdown list. Khi trẻ quét mã QR này trên điện thoại, nhân vật Mèo Mimi sẽ được mở khóa vào bộ sưu tập.
5. Bấm **Tạo mới** để lưu lại.
6. **In ấn / Tải xuống**:
   - Bấm vào hàng QR vừa tạo để mở bảng **Bản In QR Code** bên phải.
   - Bấm **Tải xuống PNG** để lưu ảnh mã vạch phục vụ thiết kế.
   - Bấm **In nhãn QR** để mở trực tiếp hộp thoại in ấn của trình duyệt, sẵn sàng kết nối máy in để in ra nhãn dán dán lên thẻ học gỗ.

---

## 4. Quản Lý Bài Học & Câu Hỏi Học Tập

### Tạo Bài học
1. Truy cập mục **Bài học** -> **Thêm Bài học**.
2. Nhập tiêu đề và mô tả bài học.
3. Chọn Loại bài học:
   - **MATH**: Bài tập tính toán, đếm và so sánh.
   - **THINKING**: Bài tập tư duy, suy luận, chọn đáp án hợp lý.
   - **SPELLING**: Bài tập đánh vần, nhận diện âm đầu/cuối.
   - **RHYME**: Bài tập ghép vần, nhận diện âm vần.
   - **DIALOGUE**: Bài học kể chuyện, hội thoại nghe nói.
   - **FLASHCARD**: Thẻ học ôn từ, hình và phát âm.
4. Chọn NPC đồng hành và thứ tự hiển thị rồi bấm lưu lại.

### Tạo Câu hỏi Học tập (Áp dụng cho MATH, THINKING, SPELLING, RHYME)
1. Truy cập mục **Ngân hàng câu hỏi** -> **Thêm Câu hỏi**.
2. Chọn bài học tương tác vừa tạo.
3. Nhập câu hỏi (Ví dụ: "Bé hãy đếm xem có bao nhiêu quả táo trong khay?").
4. **Hình ảnh**: Bấm nút **Thư viện** để lấy hình ảnh quả táo minh họa.
5. **Đáp án**: Điền cụ thể vào 4 ô độc lập: Đáp án A, B, C, D.
6. **Đáp án đúng**: Click chọn radio button tương ứng với đáp án đúng.
7. **Giải thích**: Ghi lời giải ngắn gọn để trẻ hiểu vì sao đáp án đó đúng.
8. Quan sát khung **Mô phỏng Mobile Card** bên phải để xem trước câu hỏi hiển thị trên điện thoại của bé có bị tràn chữ hay lệch hình không trước khi bấm lưu.

---

## 5. Quản Lý Hội Thoại & Thẻ Học Flashcard

### Tạo Hội thoại (Chỉ dành cho bài học loại DIALOGUE)
1. Truy cập mục **Hội thoại** -> **Thêm Hội thoại**.
2. Chọn bài học hội thoại phù hợp.
3. Nhập lời thoại/Bối cảnh dẫn dắt (Ví dụ: "Mimi nói: 'Xin chào, nông trại của mình có rất nhiều bạn nhỏ đáng yêu đấy!'").
4. **File âm thanh**: Bấm nút **Thư viện** để chọn tệp âm thanh ghi âm giọng đọc tương ứng.
5. Thiết lập câu hỏi trắc nghiệm ngắn và đáp án đúng để trẻ tương tác sau khi nghe.

### Tạo Thẻ Học (Flashcards)
1. Truy cập mục **Thẻ học** -> **Thêm Thẻ học**.
2. Chọn bài học loại **FLASHCARD** cần gắn thẻ.
3. **Mặt trước**: Nhập từ khóa tiếng Anh hoặc hình vẽ (Ví dụ: "Apple").
4. **Mặt sau**: Nhập nghĩa tiếng Việt (Ví dụ: "Quả Táo").
5. Chọn hình minh họa và file phát âm tương ứng từ thư viện.
6. Thử nghiệm click chuột lên thẻ ở khung **Thử Nghiệm Thẻ Lật** bên phải để kiểm tra hiệu ứng lật thẻ và nội dung trước khi lưu lại.

---

## 6. Ràng buộc an toàn khi xóa dữ liệu

Để bảo vệ tính toàn vẹn của dữ liệu trên hệ thống và tránh crash ứng dụng của người dùng, hệ thống admin-web áp dụng các quy tắc ràng buộc nghiêm ngặt khi xóa dữ liệu:

- **Xóa Nhân vật NPC**: 
  Hệ thống sẽ từ chối xóa nhân vật nếu phát hiện có mã QR đang gắn với nhân vật này. Bạn cần truy cập mục **Mã QR**, chỉnh sửa hoặc xóa mã QR đang trỏ đến NPC này trước khi thực hiện xóa.
- **Xóa Bài học (Lessons)**: 
  Hệ thống sẽ tự động chặn hành động xóa bài học nếu bài học đó chứa:
  - Câu hỏi Toán học (Math Questions).
  - Câu hội thoại dẫn dắt (Dialogues).
  - Thẻ học từ vựng (Flashcards).
  Bạn cần xóa hoặc chuyển các dữ liệu liên kết trên sang bài học khác trước khi tiến hành xóa bài học gốc.
