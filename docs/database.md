# Database Schema

Database dung SQLite qua Prisma.

- `User`: tai khoan phu huynh/admin, password hash bang bcrypt.
- `ChildProfile`: ho so tre, thuoc ve mot parent.
- `NPC`: nhan vat dong hanh co image URL va cau noi mac dinh.
- `QRCode`: ma unlock NPC, co trang thai active, maxUses va usedCount.
- `UserUnlockedNpc`: NPC da duoc mo khoa theo user, co the gan child.
- `Lesson`: bai hoc `MATH` hoac `DIALOGUE`.
- `MathQuestion`: cau hoi toan A/B/C/D.
- `Dialogue`: tinh huong hoi thoai ngan, co cau hoi A/B/C/D.
- `Flashcard`: the hoc sau bai hoi thoai.
- `UserProgress`: trang thai bai hoc, diem, so cau dung.
- `XPLog`: log cong XP.
- `Streak`: streak hoat dong theo user/child.

MVP khong luu media binary. Cac truong media la URL string de demo nhanh va on dinh.
