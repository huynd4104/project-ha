import { useState } from "react";
import { NavLink } from "react-router-dom";

type NavItem = { to: string; label: string; legacy?: boolean };
type NavGroup = { title: string; icon: string; items: NavItem[]; defaultOpen?: boolean };

const groups: NavGroup[] = [
  {
    title: "Dashboard", icon: "📊", defaultOpen: true,
    items: [{ to: "/dashboard", label: "Tổng quan" }]
  },
  {
    title: "Content Workflow", icon: "✏️", defaultOpen: true,
    items: [
      { to: "/taxonomy", label: "Phân loại (Taxonomy)" },
      { to: "/programs-v2", label: "Chương trình" },
      { to: "/learning-paths-v2", label: "Lộ trình học" },
      { to: "/path-builder", label: "Xây dựng lộ trình" },
      { to: "/lessons-v2", label: "Bài học v2" },
      { to: "/activity-builder", label: "Xây dựng hoạt động" }
    ]
  },
  {
    title: "Characters & Unlock", icon: "🐾",
    items: [
      { to: "/npcs-v2", label: "Mascot (NPC) v2" },
      { to: "/activation-codes", label: "Mã kích hoạt" }
    ]
  },
  {
    title: "Gamification", icon: "🏅",
    items: [
      { to: "/badges", label: "Huy hiệu" },
      { to: "/daily-missions", label: "Nhiệm vụ ngày" }
    ]
  },
  {
    title: "Users & Progress", icon: "👤",
    items: [
      { to: "/users", label: "Người dùng" },
      { to: "/premium", label: "Gói Premium (Demo)" },
      { to: "/children", label: "Hồ sơ trẻ" },
      { to: "/progress", label: "Tiến độ" }
    ]
  },
  {
    title: "Media", icon: "🖼️",
    items: [{ to: "/media", label: "Thư viện Media" }]
  },
  {
    title: "Legacy", icon: "📦",
    items: [
      { to: "/development-categories", label: "Nhóm khó khăn", legacy: true },
      { to: "/learning-goals", label: "Mục tiêu học", legacy: true },
      { to: "/skills", label: "Kỹ năng", legacy: true },
      { to: "/programs", label: "Chương trình", legacy: true },
      { to: "/learning-paths", label: "Lộ trình", legacy: true },
      { to: "/npcs", label: "Mascot", legacy: true },
      { to: "/qr-codes", label: "Mã QR", legacy: true },
      { to: "/lessons", label: "Bài học", legacy: true },
      { to: "/math-questions", label: "Toán", legacy: true },
      { to: "/thinking-questions", label: "Tư duy", legacy: true },
      { to: "/spelling-questions", label: "Đánh vần", legacy: true },
      { to: "/rhyme-questions", label: "Ghép vần", legacy: true },
      { to: "/dialogues", label: "Hội thoại", legacy: true },
      { to: "/flashcards", label: "Thẻ học", legacy: true }
    ]
  }
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach((g) => { init[g.title] = !g.defaultOpen; });
    return init;
  });

  const toggle = (title: string) => setCollapsed({ ...collapsed, [title]: !collapsed[title] });

  return (
    <aside className="sidebar">
      <div className="brand">Quản trị Project HA</div>
      {groups.map((group) => (
        <div className="sidebar-group" key={group.title}>
          <div className="sidebar-group-header" onClick={() => toggle(group.title)}>
            <span>{group.icon}</span>
            <span style={{ flex: 1 }}>{group.title}</span>
            <span style={{ fontSize: "10px" }}>{collapsed[group.title] ? "▸" : "▾"}</span>
          </div>
          <div className={`sidebar-group-items ${collapsed[group.title] ? "collapsed" : ""}`} style={collapsed[group.title] ? { maxHeight: 0 } : { maxHeight: `${group.items.length * 44}px` }}>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav active" : "nav")}>
                {item.label}
                {item.legacy && <span className="legacy-tag">Legacy</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

