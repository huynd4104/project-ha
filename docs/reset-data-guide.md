# Hướng dẫn Reset dữ liệu Firestore & Cấu hình Script

Tài liệu này hướng dẫn cách cấu hình và chạy các script để reset dữ liệu Firestore và tạo lại các tài khoản Demo.

> [!WARNING]
> **CẢNH BÁO QUAN TRỌNG:**
> Script reset sẽ **xóa vĩnh viễn** toàn bộ dữ liệu trong các collection được liệt kê dưới đây và xóa tất cả người dùng trong collection `users` ngoại trừ Admin và Parent. Hãy cẩn thận khi chạy trên môi trường production!

---

## 1. Tải Service Account JSON từ Firebase Console

Để script có quyền xóa và ghi dữ liệu vào Firestore thông qua Firebase Admin SDK, bạn cần tải về file khóa Private Key (dưới dạng JSON).

1. Truy cập vào [Firebase Console](https://console.firebase.google.com/).
2. Chọn dự án Firebase của bạn.
3. Nhấp vào biểu tượng **Răng cưa (Project settings)** bên cạnh mục **Project Overview** ở góc trên cùng bên trái.
4. Chọn tab **Service accounts**.
5. Nhấp vào nút **Generate new private key** (Tạo khóa riêng mới) ở dưới cùng.
6. Xác nhận bằng cách bấm **Generate key**.
7. Lưu file JSON vừa tải về máy của bạn.

> [!IMPORTANT]
> **BẢO MẬT KHÓA RIÊNG:**
> - Tuyệt đối **không** commit file JSON này lên Git.
> - Khuyến khích lưu file này ở ngoài thư mục dự án hoặc cấu hình đường dẫn tương đối trỏ ra ngoài dự án.
> - File `.env` và `.env.*` đã được thêm sẵn vào `.gitignore` để tránh rò rỉ thông tin.

---

## 2. Cấu hình biến môi trường (`.env`)

Tạo một file `.env` ở thư mục gốc của dự án (cùng cấp với `package.json` của root) bằng cách sao chép file `.env.example`:

```bash
cp .env.example .env
```

Sau đó, điền đầy đủ các giá trị cấu hình trong file `.env`:

```env
# ID của Firebase Project
FIREBASE_PROJECT_ID=ten-project-firebase-cua-ban

# Đường dẫn đến file JSON Service Account bạn vừa tải về (có thể dùng đường dẫn tuyệt đối hoặc tương đối)
FIREBASE_SERVICE_ACCOUNT_PATH=/Users/username/credentials/firebase-adminsdk-key.json

# UID của tài khoản Admin và Parent lấy từ Firebase Authentication
# Các tài khoản này sẽ được giữ lại/tạo mới trong Firestore collection "users"
ADMIN_UID=uid-cua-tai-khoan-admin-auth
PARENT_UID=uid-cua-tai-khoan-parent-auth
```

---

## 3. Cài đặt thư viện (Dependencies)

Di chuyển đến thư mục gốc của dự án và chạy lệnh sau để cài đặt các package cần thiết (`firebase-admin`, `dotenv`, `tsx`, `typescript`):

```bash
npm install
```

---

## 4. Cách sử dụng các Script

### A. Reset Firestore và Firebase Authentication

Script này sẽ xóa toàn bộ dữ liệu trong các collections Firestore sau:
* `children`
* `npcs`
* `qrCodes`
* `userUnlockedNpcs`
* `lessons`
* `mathQuestions`
* `dialogues`
* `flashcards`
* `spellingActivities`
* `rhymeChallenges`
* `progress`
* `xpLogs`
* `streaks`
* `mediaAssets`
* `badges`
* `userBadges`
* `dailyMissions`
* `userMissionProgress`

Đồng thời script sẽ:
1. Xóa các user documents khác trong collection `users` Firestore (chỉ giữ lại tài khoản ứng với `ADMIN_UID` và `PARENT_UID` trong `.env`).
2. Tự động **xóa các tài khoản Authentication tương ứng trên Firebase** (ngoại trừ Admin và Parent).
3. **KHÔNG** tự động nạp lại dữ liệu mẫu (NPCs, Lessons, v.v.). Database sẽ hoàn toàn trống sau khi reset để bạn tự import dữ liệu.

**Lệnh chạy:**
```bash
npm run db:reset
```

Khi chạy, script sẽ hiện cảnh báo và yêu cầu xác nhận. Bạn phải nhập chữ **`RESET`** để tiếp tục:

```text
 WARNING: CRITICAL DATABASE RESET OPERATION 
This script will permanently destroy all Firestore data in the following collections:
  - children
  - npcs
  ...
Additionally, all profiles in the "users" collection will be deleted EXCEPT:
  - Admin UID: admin-uid-here
  - Parent UID: parent-uid-here

Additionally, all registered users in Firebase Authentication (except Admin and Parent) will be permanently deleted.

To confirm this action, please type exactly "RESET": RESET
```

### B. Chỉ Seeding lại Demo Users (Không reset)

Nếu bạn chỉ muốn tạo hoặc cập nhật lại thông tin 2 tài khoản demo trong collection `users` Firestore và Firebase Auth mà không muốn xóa dữ liệu các collection khác:

**Lệnh chạy:**
```bash
npm run db:seed
```

Script này sẽ tự động:
- Kiểm tra xem user có UID tương ứng đã tồn tại trong Firestore collection `users` hay chưa.
- Nếu chưa có, sẽ tạo mới document với các trường thông tin chuẩn (`email`, `fullName`, `role`, `isActive`, `createdAt`, `updatedAt`).
- Nếu đã có, sẽ cập nhật lại vai trò và trạng thái hoạt động mà không ghi đè trường `createdAt`.

### C. Nạp dữ liệu mẫu Học tập (Seeding Learning Content)

Nếu bạn muốn nạp toàn bộ dữ liệu học tập mẫu (bao gồm các NPCs, QR Codes, bài học mẫu, câu hỏi toán học, hội thoại, badges, daily missions, v.v. từ data templates) vào database sạch:

**Lệnh chạy:**
```bash
npm run db:seed-learning
```
