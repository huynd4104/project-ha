import { useEffect, useState } from "react";
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

  if (!data) return <p>Đang tải...</p>;

  const mainCards = [
    ["Người dùng", data.totalUsers, "👤"],
    ["Hồ sơ trẻ", data.totalChildren, "👶"],
    ["Bài học", data.totalLessons, "📖"],
    ["Bài hoàn thành", data.totalCompletedLessons, "✅"],
    ["Mascot", data.totalNPCs, "🐾"],
    ["Mã QR", data.totalQRCodes, "📱"],
    ["Huy hiệu", data.totalBadges, "🏅"],
    ["Nhiệm vụ hôm nay", data.missionCompletionsToday, "⭐"],
  ];

  const phase3Cards = extra ? [
    ["Chương trình", extra.totalPrograms, "📚"],
    ["CT đã xuất bản", extra.publishedPrograms, "🟢"],
    ["Lộ trình", extra.totalPaths, "🗺️"],
    ["LT đã xuất bản", extra.publishedPaths, "🟢"],
    ["Hoạt động", extra.totalActivities, "🎯"],
    ["Mã kích hoạt", extra.totalActivationCodes, "🔑"],
    ["Nhóm khó khăn", extra.totalCategories, "📂"],
    ["Kỹ năng", extra.totalSkills, "🧩"],
    ["Bài học Legacy", extra.legacyLessonsCount, "📦"],
    ["Thiếu Metadata", extra.missingMetadataCount, "⚠️"]
  ] : [];

  const premiumCards = extra ? [
    ["Premium Users", extra.premiumUsers, "👑"],
    ["Premium CT", extra.premiumPrograms, "💎"],
    ["Premium Lộ trình", extra.premiumPaths, "💎"],
    ["Premium Bài học", extra.premiumLessons, "💎"],
    ["Premium Hoạt động", extra.premiumActivities, "💎"],
    ["Premium NPC", extra.premiumNpcs, "👑"]
  ] : [];

  return (
    <div>
      <h1>Tổng quan</h1>

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
          <h2 style={{ marginTop: "12px" }}>Phân quyền Premium (Phase 5)</h2>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {premiumCards.map(([label, value, icon]) => (
              <div className="stat" key={label as string} style={{ borderLeft: "4px solid #d97706" }}>
                <span>{icon} {label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: "12px" }}>Nội dung học tập (Phase 3)</h2>
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

