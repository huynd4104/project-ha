import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

type IconName =
  | "dashboard"
  | "content"
  | "target"
  | "program"
  | "path"
  | "lesson"
  | "activity"
  | "sort"
  | "character"
  | "qr"
  | "premium"
  | "users"
  | "child"
  | "progress"
  | "archive"
  | "badge"
  | "mission"
  | "media"
  | "more";
type NavItem = { to: string; label: string; icon: IconName; library?: boolean };
type NavGroup = { title: string; icon: IconName; items: NavItem[]; defaultOpen?: boolean };

const groups: NavGroup[] = [
  {
    title: "Tổng quan", icon: "dashboard", defaultOpen: true,
    items: [{ to: "/dashboard", label: "Bảng điều khiển", icon: "dashboard" }]
  },
  {
    title: "Quản lý nội dung học", icon: "content", defaultOpen: true,
    items: [
      { to: "/taxonomy", label: "Nhóm trẻ, mục tiêu & kỹ năng", icon: "target" },
      { to: "/programs-v2", label: "Chương trình học", icon: "program" },
      { to: "/learning-paths-v2", label: "Lộ trình học", icon: "path" },
      { to: "/lessons-v2", label: "Bài học", icon: "lesson" },
      { to: "/activity-builder", label: "Hoạt động trong bài học", icon: "activity" },
      { to: "/path-builder", label: "Sắp xếp bài học vào lộ trình", icon: "sort" }
    ]
  },
  {
    title: "Công nghệ", icon: "qr", defaultOpen: true,
    items: [
      { to: "/ai-conversations", label: "Hội thoại cùng AI", icon: "activity" },
      { to: "/nfc-tags", label: "Quản lý thẻ NFC", icon: "qr" },
      { to: "/technology/numbers", label: "Bộ số", icon: "activity" },
      { to: "/technology/shapes", label: "Bộ hình", icon: "activity" }
    ]
  },
  {
    title: "Kho nội dung học", icon: "archive",
    items: [
      { to: "/flashcards", label: "Thư viện Flashcard", icon: "lesson" },
      { to: "/math-questions", label: "Thư viện câu hỏi toán", icon: "activity" },
      { to: "/thinking-questions", label: "Thư viện tư duy", icon: "activity" },
      { to: "/spelling-questions", label: "Thư viện đánh vần", icon: "activity" },
      { to: "/rhyme-questions", label: "Thư viện ghép vần", icon: "activity" }
    ]
  },
  {
    title: "Nhân vật & mã mở khóa", icon: "character",
    items: [
      { to: "/npcs-v2", label: "Mascot", icon: "character" },
      { to: "/activation-codes", label: "Mã QR mở khóa", icon: "qr" }
    ]
  },
  {
    title: "Gói Premium", icon: "premium",
    items: [{ to: "/premium", label: "Quản lý gói Premium", icon: "premium" }]
  },
  {
    title: "Người dùng & tiến độ", icon: "users",
    items: [
      { to: "/users", label: "Người dùng", icon: "users" },
      { to: "/children", label: "Hồ sơ trẻ", icon: "child" },
      { to: "/progress", label: "Tiến độ học tập", icon: "progress" }
    ]
  },
  {
    title: "Công cụ", icon: "more",
    items: [
      { to: "/badges", label: "Huy hiệu", icon: "badge" },
      { to: "/daily-missions", label: "Nhiệm vụ ngày", icon: "mission" },
      { to: "/media", label: "Thư viện tệp", icon: "media" }
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach((g) => { init[g.title] = !g.defaultOpen; });
    return init;
  });

  const toggle = (title: string) => setCollapsed({ ...collapsed, [title]: !collapsed[title] });

  return (
    <aside className="sidebar">
      <div className="brand" aria-label="Quản trị Project HA">
        <span className="brand-mark">HA</span>
        <span className="brand-copy">
          <strong>Project HA</strong>
          <small>Admin Panel</small>
        </span>
      </div>
      {groups.map((group) => (
        <SidebarSection
          group={group}
          key={group.title}
          collapsed={collapsed[group.title]}
          active={group.items.some((item) => item.to === location.pathname)}
          onToggle={() => toggle(group.title)}
        />
      ))}
    </aside>
  );
}

function SidebarSection({
  group,
  collapsed,
  active,
  onToggle,
}: {
  group: NavGroup;
  collapsed: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  const groupId = `sidebar-${group.title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className={`sidebar-group ${active ? "has-active" : ""}`}>
      <button
        type="button"
        className="sidebar-group-header"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={groupId}
      >
        <span className="sidebar-group-icon"><SidebarIcon name={group.icon} /></span>
        <span className="sidebar-group-title">{group.title}</span>
        <span className="sidebar-chevron" aria-hidden="true">
          <SidebarIcon name="path" />
        </span>
      </button>
      <div id={groupId} className={`sidebar-group-items ${collapsed ? "collapsed" : ""}`}>
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav active" : "nav")}>
                <span className="nav-icon"><SidebarIcon name={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
                {item.library && <span className="reuse-tag">Reuse</span>}
              </NavLink>
            ))}
      </div>
    </section>
  );
}

function SidebarIcon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<IconName, JSX.Element> = {
    dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><path d="M14 17h6M17 14v6" /></>,
    content: <><path d="M5 5.5h14" /><path d="M5 11.5h14" /><path d="M5 17.5h9" /><path d="M17 16l2 2 3-4" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>,
    program: <><path d="M6 4.5h9a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z" /><path d="M8 8h6M8 12h7M8 16h5" /></>,
    path: <><path d="m8 5 7 7-7 7" /></>,
    lesson: <><path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H7.5A2.5 2.5 0 0 1 5 17V4.5Z" /><path d="M8.5 8h6M8.5 12h7" /></>,
    activity: <><path d="M6 7h12" /><path d="M6 12h12" /><path d="M6 17h7" /><circle cx="4" cy="7" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="17" r="1" /></>,
    sort: <><path d="M8 6h10" /><path d="M8 12h8" /><path d="M8 18h5" /><path d="M4 7v10" /><path d="m2.5 15.5 1.5 1.5 1.5-1.5" /></>,
    character: <><circle cx="12" cy="8" r="3.2" /><path d="M6.5 19a5.5 5.5 0 0 1 11 0" /><path d="M8 7 6 5M16 7l2-2" /></>,
    qr: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 14h2M14 18h6" /></>,
    premium: <><path d="m4 8 4 9h8l4-9-5 3-3-6-3 6-5-3Z" /><path d="M8 20h8" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 8.5a2.5 2.5 0 1 0-1-4.8" /><path d="M17 19a4.5 4.5 0 0 0-2.5-4" /></>,
    child: <><circle cx="12" cy="8" r="3" /><path d="M7 19a5 5 0 0 1 10 0" /><path d="M9.5 11.5 8 14M14.5 11.5 16 14" /></>,
    progress: <><path d="M5 19V9" /><path d="M12 19V5" /><path d="M19 19v-7" /><path d="M4 19h16" /></>,
    archive: <><path d="M4 7h16" /><path d="M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" /><path d="M7 4h10l1 3H6l1-3Z" /><path d="M10 11h4" /></>,
    badge: <><circle cx="12" cy="9" r="4" /><path d="m9.5 12.5-1 7 3.5-2 3.5 2-1-7" /></>,
    mission: <><path d="M6 4h10l2 2v14H6V4Z" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
    media: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m6.5 17 4-4 3 3 2-2 2.5 3" /></>,
    more: <><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}
