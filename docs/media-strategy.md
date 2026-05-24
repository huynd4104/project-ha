# Chiến Lược Quản Lý Media & QR Code

Tài liệu này mô tả chi tiết giải pháp lưu trữ hình ảnh, âm thanh, video và sinh mã QR trong dự án HA, đáp ứng mục tiêu hoạt động ổn định cho buổi demo đồ án với chi phí $0 (không bắt buộc nâng cấp gói Firebase Storage).

---

## 1. Kiến Trúc Media 3 Mức (Multi-tier Media Strategy)

Để dự án hoạt động trơn tru trong mọi điều kiện (ngay cả khi gói Firebase Storage bị khóa/hết dung lượng miễn phí), chúng tôi áp dụng chiến lược media 3 mức:

### Mức A: Media Công Cộng (Public Presets) - Mặc định cho MVP
* **Cách hoạt động**: Các tệp tin được đặt trực tiếp trong thư mục công khai của Web server (`admin-web/public/media/`) hoặc sử dụng các liên kết hình ảnh công cộng (ví dụ từ Unsplash) có độ ổn định cao.
* **Lợi ích**: Không tốn dung lượng lưu trữ Cloud, tải nhanh, không lỗi chứng thực và bảo mật.
* **Seed dữ liệu**: Thư viện Media được trang bị tính năng "Seed Media Mẫu" để tự động nạp các đường dẫn ảnh NPC (Mimi, Bobo, Nana) và Flashcard chất lượng cao vào Firestore chỉ với 1 click từ giao diện Quản trị.

### Mức B: Firebase Storage / Cloudinary - Cho Phase Tiếp Theo
* **Cách hoạt động**: Khi hệ thống sẵn sàng nâng cấp gói, cấu hình `VITE_ENABLE_FIREBASE_STORAGE_UPLOAD=true` để kích hoạt giao diện upload file trực tiếp từ Admin Panel lên Firebase Storage hoặc Cloudinary. Giao diện upload sẽ tự động trả về đường dẫn tải xuống công khai.

---

## 2. Firestore Collection: `mediaAssets`

Hệ thống quản lý thống nhất các tệp tin qua collection `mediaAssets` trên Firestore với cấu trúc dữ liệu sau:

```json
{
  "id": "chuỗi_id_tự_sinh",
  "name": "Tên gợi nhớ của tệp tin (ví dụ: Mèo Mimi vẫy tay)",
  "type": "IMAGE" | "AUDIO" | "VIDEO",
  "category": "NPC" | "FLASHCARD" | "DIALOGUE" | "GENERAL",
  "url": "https://đường_dẫn_đầy_đủ_của_tệp_tin.png",
  "thumbnailUrl": "https://đường_dẫn_ảnh_thu_nhỏ_tùy_chọn.png",
  "createdAt": "serverTimestamp()",
  "updatedAt": "serverTimestamp()"
}
```

---

## 3. Thành Phần Chọn Media Reusable (`MediaPicker`)

Thay vì bắt admin nhập thủ công các đường dẫn URL thô (dễ sai sót và gây lỗi crash giao diện hiển thị của trẻ trên Mobile), tất cả các form nhập liệu trong hệ thống đều tích hợp component chọn media (`MediaPicker`):

* **Địa chỉ code**: `admin-web/src/components/MediaPicker.tsx`
* **Cách sử dụng**: Khi nhấn nút "Thư viện", một cửa sổ modal sẽ mở ra cho phép lọc nhanh tệp theo danh mục, tìm kiếm theo tên và xem trước ảnh/nghe trước audio trực tiếp trước khi lựa chọn.
* **Nhập thủ công**: Form chọn vẫn cung cấp ô nhập URL trực tiếp ở phía trên như một phương án dự phòng linh hoạt.

---

## 4. Giao Giao Diện Sinh Mã QR Deterministic

Để in ấn dán trên đồ chơi hoặc thẻ học vật lý, hệ thống triển khai cơ chế sinh mã QR như sau:

* **Không lưu trữ ảnh**: Hệ thống **không** lưu ảnh QR vào Database hay Storage để tiết kiệm tài nguyên. Giao diện chỉ lưu trữ chuỗi mã định danh duy nhất (ví dụ: `NPC_MIMI_01`) và NPC liên kết.
* **Deterministic Render**: Trên Admin Panel, mã QR được vẽ trực tiếp ra thẻ `<canvas>` bằng thư viện client-side `qrcode`. Do mã định danh cố định, hình ảnh QR sinh ra sẽ luôn luôn giống nhau (Deterministic).
* **Các tính năng hỗ trợ**:
  1. **In nhãn QR**: Bật hộp thoại in hệ thống để in trực tiếp thẻ QR dán lên đồ chơi gỗ.
  2. **Tải xuống PNG**: Kết xuất thẻ canvas thành tệp ảnh PNG chất lượng cao để in ấn sau.
  3. **Sao chép mã**: Tiện lợi khi muốn kiểm tra thử thủ công bằng mã nhập tay trên mobile app.
