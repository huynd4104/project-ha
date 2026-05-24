import { NavLink } from "react-router-dom";

const links = [
  ["/dashboard", "Tổng quan"],
  ["/users", "Người dùng"],
  ["/children", "Hồ sơ trẻ"],
  ["/media", "Thư viện Media"],
  ["/npcs", "Nhân vật Mascot"],
  ["/qr-codes", "Mã QR"],
  ["/lessons", "Bài học"],
  ["/math-questions", "Toán"],
  ["/thinking-questions", "Tư duy"],
  ["/spelling-questions", "Đánh vần"],
  ["/rhyme-questions", "Ghép vần"],
  ["/dialogues", "Hội thoại"],
  ["/flashcards", "Thẻ học"],
  ["/badges", "Huy hiệu"],
  ["/daily-missions", "Nhiệm vụ"],
  ["/progress", "Tiến độ"]
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">Quản trị Project HA</div>
      {links.map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "nav active" : "nav")}>
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
