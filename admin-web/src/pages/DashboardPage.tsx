import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { adminApi } from "../api/adminApi";

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [extra, setExtra] = useState<any>(null);

  useEffect(() => {
    adminApi.dashboard().then((res) => setData(res.data.data));
    Promise.all([
      adminApi.list("/programs"),
      adminApi.list("/learning-paths"),
      adminApi.list("/activities"),
      adminApi.list("/activation-codes"),
      adminApi.list("/development-categories"),
      adminApi.list("/learning-goals"),
      adminApi.list("/skills"),
      adminApi.list("/lessons"),
      adminApi.list("/users"),
      adminApi.list("/npcs")
    ]).then(([pRes, lpRes, aRes, acRes, dcRes, lgRes, sRes, lRes, uRes, nRes]) => {
      const programs = pRes.data.data || [];
      const paths = lpRes.data.data || [];
      const activities = aRes.data.data || [];
      const codes = acRes.data.data || [];
      const lessons = lRes.data.data || [];
      const users = uRes.data.data || [];
      const npcs = nRes.data.data || [];

      const legacyLessonsCount = lessons.filter((l: any) => !l.lessonType).length;

      const missingMetadataCount = [
        ...programs.filter((p: any) => !p.difficultyCategories?.length || !p.learningGoals?.length || !p.skillTags?.length),
        ...paths.filter((p: any) => !p.targetProfileRules?.difficultyCategories?.length || !p.targetProfileRules?.learningGoals?.length),
        ...lessons.filter((l: any) => l.lessonType && (!l.difficultyCategories?.length || !l.learningGoals?.length || !l.skillTags?.length))
      ].length;

      const now = Date.now();
      const premiumUsers = users.filter((u: any) => {
        const summary = u.subscriptionSummary;
        if (!summary) return false;
        if (summary.plan !== "PREMIUM" && summary.plan !== "TRIAL") return false;
        if (summary.status !== "ACTIVE") return false;
        if (summary.expiresAt) {
          let expTime = 0;
          if (typeof summary.expiresAt.toMillis === "function") {
            expTime = summary.expiresAt.toMillis();
          } else if (summary.expiresAt._seconds) {
            expTime = summary.expiresAt._seconds * 1000;
          } else {
            expTime = new Date(summary.expiresAt).getTime();
          }
          if (expTime < now) return false;
        }
        return true;
      }).length;

      const premiumPrograms = programs.filter((p: any) => p.accessType === "PREMIUM").length;
      const premiumPaths = paths.filter((p: any) => p.accessType === "PREMIUM").length;
      const premiumLessons = lessons.filter((l: any) => l.accessType === "PREMIUM").length;
      const premiumActivities = activities.filter((a: any) => a.accessType === "PREMIUM").length;
      const premiumNpcs = npcs.filter((n: any) => n.accessType === "PREMIUM").length;

      setExtra({
        totalPrograms: programs.length,
        publishedPrograms: programs.filter((p: any) => p.status === "PUBLISHED").length,
        draftPrograms: programs.filter((p: any) => p.status !== "PUBLISHED").length,
        totalPaths: paths.length,
        publishedPaths: paths.filter((p: any) => p.status === "PUBLISHED").length,
        totalActivities: activities.length,
        totalActivationCodes: codes.length,
        activeActivationCodes: codes.filter((c: any) => c.active !== false).length,
        totalCategories: dcRes.data.data?.length || 0,
        totalGoals: lgRes.data.data?.length || 0,
        totalSkills: sRes.data.data?.length || 0,
        legacyLessonsCount,
        missingMetadataCount,
        premiumUsers,
        premiumPrograms,
        premiumPaths,
        premiumLessons,
        premiumActivities,
        premiumNpcs
      });
    });
  }, []);

  if (!data) return <p>Đang tải dữ liệu...</p>;

  const mainCards = [
    ["Người dùng", data.totalUsers, "👤"],
    ["Hồ sơ trẻ", data.totalChildren, "👶"],
    ["Bài học", data.totalLessons, "📖"],
    ["Bài hoàn thành", data.totalCompletedLessons, "✅"],
    ["Nhân vật đồng hành", data.totalNPCs, "🐾"],
    ["Mã QR", data.totalQRCodes, "📱"],
    ["Huy hiệu", data.totalBadges, "🏅"],
    ["Nhiệm vụ hôm nay", data.missionCompletionsToday, "⭐"],
  ];

  const phase3Cards = extra ? [
    ["Chương trình", extra.totalPrograms, "📚"],
    ["Chương trình đã xuất bản", extra.publishedPrograms, "🟢"],
    ["Lộ trình", extra.totalPaths, "🗺️"],
    ["Lộ trình đã xuất bản", extra.publishedPaths, "🟢"],
    ["Hoạt động", extra.totalActivities, "🎯"],
    ["Mã QR mở khóa", extra.totalActivationCodes, "🔑"],
    ["Nhóm trẻ", extra.totalCategories, "📂"],
    ["Kỹ năng", extra.totalSkills, "🧩"],
    ["Bài học cũ", extra.legacyLessonsCount, "📦"],
    ["Thiếu thông tin phân loại", extra.missingMetadataCount, "⚠️"]
  ] : [];

  const premiumCards = extra ? [
    ["Người dùng Premium", extra.premiumUsers, "👑"],
    ["Chương trình Premium", extra.premiumPrograms, "💎"],
    ["Premium Lộ trình", extra.premiumPaths, "💎"],
    ["Premium Bài học", extra.premiumLessons, "💎"],
    ["Premium Hoạt động", extra.premiumActivities, "💎"],
    ["Nhân vật Premium", extra.premiumNpcs, "👑"]
  ] : [];

  return (
    <div>
      <h1>Bảng điều khiển</h1>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <h2 style={{ marginTop: 0 }}>Quy trình tạo nội dung học</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
          Làm theo thứ tự này để nội dung mới có đủ chương trình, lộ trình, bài học và hoạt động trước khi kiểm tra trên app mobile.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            ["1. Kiểm tra nhóm trẻ, mục tiêu học và kỹ năng", "/taxonomy"],
            ["2. Tạo chương trình học", "/programs-v2"],
            ["3. Tạo lộ trình học", "/learning-paths-v2"],
            ["4. Tạo bài học", "/lessons-v2"],
            ["5. Tạo hoạt động", "/activity-builder"],
            ["6. Sắp xếp bài học vào lộ trình", "/path-builder"],
            ["7. Kiểm tra trên app mobile", "/progress"],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="secondary" style={{ textDecoration: "none", padding: "8px 10px", borderRadius: "8px" }}>{label}</Link>
          ))}
        </div>
      </div>

      <div className="cards">
        {mainCards.map(([label, value, icon]) => (
          <div className="stat" key={label as string}>
            <span>{icon} {label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {extra && (
        <>
          <h2 style={{ marginTop: "12px" }}>Gói Premium</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {premiumCards.map(([label, value, icon]) => (
              <div className="stat" key={label as string} style={{ borderLeft: "4px solid #d97706" }}>
                <span>{icon} {label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: "12px" }}>Nội dung học tập</h2>
          <div className="cards">
            {phase3Cards.map(([label, value, icon]) => (
              <div className="stat" key={label as string}>
                <span>{icon} {label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="panel">
        <h2>Người dùng gần đây</h2>
        {data.recentUsers.map((u: any) => <div className="row" key={u.id}>{u.fullName} - {u.email}</div>)}
      </div>
      <div className="panel chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mainCards.map(([name, value]) => ({ name, value }))}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
