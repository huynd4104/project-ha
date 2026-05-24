# Lưu Ý Tích Hợp Firebase Storage (Giai Đoạn Nâng Cấp)

Trong bản chạy thử nghiệm MVP hiện tại, hệ thống sử dụng **Thư viện Media liên kết URL công cộng** làm mặc định để đảm bảo dự án chạy ổn định mà không yêu cầu nâng cấp gói trả phí của Firebase. 

Tài liệu này hướng dẫn các bước để kích hoạt và cấu hình chức năng tải tệp tin trực tiếp từ máy tính lên Firebase Storage khi chuyển giao dự án sang giai đoạn sản xuất (Production/Phase 2).

---

## 1. Kích Hoạt Firebase Storage trên Firebase Console

1. Truy cập [Firebase Console](https://console.firebase.google.com/) và chọn dự án của bạn.
2. Ở thanh menu bên trái, tìm mục **Build** -> click chọn **Storage**.
3. Bấm **Get Started** để bắt đầu tạo Bucket lưu trữ.
4. Lựa chọn chế độ cấu hình ban đầu: Chọn **Start in test mode** (chế độ thử nghiệm) để hệ thống tự động thiết lập quyền đọc/ghi cơ bản, sau đó bấm **Next**.
5. Chọn vị trí máy chủ lưu trữ (nên chọn `asia-southeast1` hoặc `asia-east1` để tốc độ tải ảnh ở Việt Nam nhanh nhất).
6. Bấm **Done** và chờ Firebase hoàn tất thiết lập tài nguyên Cloud Storage.

---

## 2. Thiết Lập Quyền Truy Cập (Security Rules)

Để tránh lỗi bị chặn quyền đọc/ghi từ ứng dụng admin-web và mobile-flutter, hãy truy cập tab **Rules** trên trang cấu hình Storage của Firebase Console và cập nhật luật bảo mật như sau:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cho phép đọc công khai mọi tệp tin
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Chỉ cho phép ghi nếu người dùng đã đăng nhập tài khoản (Admin/Parent)
    match /npcs/{allPaths=**} {
      allow write: if request.auth != null;
    }
    match /flashcards/{allPaths=**} {
      allow write: if request.auth != null;
    }
    match /dialogues/{allPaths=**} {
      allow write: if request.auth != null;
    }
  }
}
```

*Lưu ý: Bấm **Publish** sau khi dán luật để áp dụng cấu hình bảo mật mới.*

---

## 3. Kích Hoạt Chức Năng Upload Trên Giao Diện Quản Trị

Khi cấu hình Storage trên Firebase hoàn tất:
1. Mở tệp tin `.env` trong dự án `admin-web`.
2. Thay đổi hoặc thêm biến môi trường sau:
   ```env
   VITE_ENABLE_FIREBASE_STORAGE_UPLOAD=true
   ```
3. Khởi động lại dev server của `admin-web`. Nút bấm "Tải tệp tin lên" sẽ tự động hiển thị trong form thêm Media Asset, cho phép chọn tệp tin `.png`, `.jpg`, `.mp3` trực tiếp từ ổ đĩa máy tính.
4. Sau khi upload, thư viện sẽ tự động lấy `downloadURL` trả về từ Firebase SDK để điền vào ô URL và ghi nhận tệp tin vào bộ sưu tập `mediaAssets`.
