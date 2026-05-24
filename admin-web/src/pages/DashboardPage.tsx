import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { adminApi } from "../api/adminApi";

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { adminApi.dashboard().then((res) => setData(res.data.data)); }, []);
  if (!data) return <p>Đang tải...</p>;

  const cards = [
    ["Người dùng", data.totalUsers],
    ["Hồ sơ trẻ", data.totalChildren],
    ["Nhân vật Mascot", data.totalNPCs],
    ["Mã QR", data.totalQRCodes],
    ["Bài học", data.totalLessons],
    ["Bài hoàn thành", data.totalCompletedLessons],
    ["Tổng Huy hiệu", data.totalBadges],
    ["Nhiệm vụ hoạt động", data.totalActiveMissions],
    ["Huy hiệu đã trao", data.badgesEarnedCount],
    ["Nhiệm vụ xong hôm nay", data.missionCompletionsToday]
  ];

  return (
    <div>
      <h1>Tổng quan</h1>
      <div className="cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {cards.map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Người dùng gần đây</h2>
        {data.recentUsers.map((u: any) => <div className="row" key={u.id}>{u.fullName} - {u.email}</div>)}
      </div>
      <div className="panel chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cards.map(([name, value]) => ({ name, value }))}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Bar dataKey="value" fill="#b7794b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
