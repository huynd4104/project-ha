# Quản trị Premium trên Admin Panel (Phase 5)

Tài liệu này hướng dẫn cách sử dụng trang quản trị Premium và Subscriptions tại Admin Web Portal phục vụ mục đích vận hành và kiểm thử thủ công.

---

## 1. Truy cập Trang Quản lý Premium

1. Đăng nhập vào trang quản trị với tài khoản có vai trò `ADMIN` và trạng thái `isActive == true`.
2. Trên thanh Sidebar bên trái, điều hướng đến nhóm **Users & Progress** và nhấp chọn mục **Gói Premium (Demo)** (hoặc truy cập trực tiếp qua đường dẫn `/premium`).

---

## 2. Các chức năng chính

Trang quản trị được chia làm 2 Tab chính:

### Tab 1: Người dùng & Gói cước (User Subscriptions)
Hiển thị danh sách toàn bộ người dùng trong hệ thống kèm thông tin:
* **Họ và Tên, Email, Vai trò** (ADMIN / PARENT).
* **Gói hiện tại:** FREE / TRIAL / PREMIUM.
* **Trạng thái:** ACTIVE / CANCELED / EXPIRED.
* **Ngày hết hạn:** Thời hạn cụ thể của gói TRIAL hoặc PREMIUM. Hiển thị "Không giới hạn" nếu không thiết lập hạn dùng.
* **Quyền chi tiết:** Liệt kê các cờ entitlements hiện tại của user.
* **Bộ lọc và tìm kiếm:** Tìm nhanh người dùng bằng Email/Tên; Lọc theo gói cước hoặc trạng thái cước.

#### Thao tác Cấp gói (Grant Premium/Trial)
1. Nhấp chọn nút **"Cấp Gói"** tại dòng của người dùng mong muốn.
2. Form Modal mở ra:
   * **Gói cước:** Chọn PREMIUM hoặc TRIAL.
   * **Ngày hết hạn:** Chọn ngày hết hạn cho gói (bắt buộc đối với gói TRIAL).
   * **Quyền lợi (Entitlements):** Chọn/bỏ chọn thủ công 4 cờ quyền lợi (`premiumContent`, `voiceQuiz`, `advancedReports`, `premiumNpcs`).
3. Nhấp chọn **"Cấp Quyền"** $\rightarrow$ Hệ thống gọi Cloud Function `adminGrantPremium` để cập nhật an toàn vào Firestore và đồng bộ lập tức về thiết bị di động của phụ huynh.

#### Thao tác Thu hồi gói (Revoke Premium)
1. Nhấp chọn nút **"Thu hồi"** (nút màu đỏ) đối với người dùng đang có gói PREMIUM hoặc TRIAL.
2. Xác nhận tại hộp thoại của trình duyệt.
3. Hệ thống gọi Cloud Function `adminRevokePremium`, chuyển thông tin cước của người dùng về FREE, hủy (CANCELED) gói cước active và cập nhật giao dịch mock tương ứng.

---

### Tab 2: Lịch sử giao dịch mock (Mock Transactions)
* Thu thập toàn bộ tài liệu giao dịch giả lập từ collection `transactions` của Firestore.
* Mỗi dòng hiển thị: Mã giao dịch (Transaction ID), Email người dùng nhận gói, Cổng thanh toán (MOCK hoặc MANUAL), Mã sản phẩm, Số tiền (0 VND) và trạng thái (SUCCESS).
* Giúp kiểm tra tính toàn vẹn dữ liệu khi có các thao tác cấp/thu hồi gói hoặc nâng cấp demo trên mobile.

---

## 3. Quy trình Kiểm thử end-to-end với Admin Panel

1. Trên điện thoại di động (hoặc emulator), đăng nhập một tài khoản phụ huynh (ví dụ: `parent@test.com`) $\rightarrow$ App hiển thị trạng thái cước là **Gói Free**.
2. Trên Admin Web, tìm tài khoản `parent@test.com` trong danh sách người dùng.
3. Bấm **Cấp Gói**, chọn **TRIAL**, chọn hạn dùng đến ngày mai, giữ nguyên 4 cờ tích hợp và bấm **Cấp Quyền**.
4. Trên điện thoại di động, mở Parent Dashboard hoặc quay ra màn hình bản đồ học tập $\rightarrow$ Hệ thống sẽ lập tức cập nhật trạng thái cước thành **Gói Trial** và mở khóa toàn bộ bài học, NPC Premium.
5. Trên Admin Web, bấm nút **Thu hồi** đối với tài khoản `parent@test.com`.
6. Trên điện thoại di động, kiểm tra lại trạng thái cước $\rightarrow$ Hệ thống cập nhật về **Gói Free** và khóa lại các nội dung Premium.
