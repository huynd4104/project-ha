import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebase";

export function PremiumPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "transactions">("users");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [plan, setPlan] = useState<"PREMIUM" | "TRIAL">("PREMIUM");
  const [expiresAt, setExpiresAt] = useState("");
  const [premiumContent, setPremiumContent] = useState(true);
  const [voiceQuiz, setVoiceQuiz] = useState(true);
  const [advancedReports, setAdvancedReports] = useState(true);
  const [premiumNpcs, setPremiumNpcs] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  async function loadData() {
    setLoading(true);
    try {
      const [uRes, tRes] = await Promise.all([
        adminApi.list("/users"),
        adminApi.list("/transactions"),
      ]);
      setUsers(uRes.data.data || []);
      setTransactions(tRes.data.data || []);
    } catch (e) {
      console.error(e);
      showToast("Lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter users
  useEffect(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.fullName?.toLowerCase().includes(q)
      );
    }

    if (planFilter !== "ALL") {
      result = result.filter(
        (u) => (u.subscriptionSummary?.plan ?? "FREE") === planFilter
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter(
        (u) => (u.subscriptionSummary?.status ?? "NONE") === statusFilter
      );
    }

    setFilteredUsers(result);
  }, [users, search, planFilter, statusFilter]);

  // Set default expiresAt date (30 days from now) when opening modal or changing plan
  const openGrantModal = (user: any) => {
    setSelectedUser(user);
    setPlan("PREMIUM");
    
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    setExpiresAt(defaultDate.toISOString().slice(0, 10));

    setPremiumContent(true);
    setVoiceQuiz(true);
    setAdvancedReports(true);
    setPremiumNpcs(true);
    setIsModalOpen(true);
  };

  const handleGrantPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (plan === "TRIAL" && !expiresAt) {
      alert("Gói TRIAL bắt buộc phải cấu hình ngày hết hạn.");
      return;
    }

    setSubmitting(true);
    try {
      const grantFn = httpsCallable<any, any>(functions, "adminGrantPremium");
      const expiresMillis = expiresAt ? new Date(expiresAt).getTime() : null;

      await grantFn({
        userId: selectedUser.id,
        plan,
        expiresAt: expiresMillis,
        entitlements: {
          premiumContent,
          voiceQuiz,
          advancedReports,
          premiumNpcs,
        },
      });

      showToast(`Đã cấp gói ${plan} cho ${selectedUser.fullName || selectedUser.email}`);
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi: ${e.message || "Không thể cấp premium."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokePremium = async (user: any) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn thu hồi gói Premium của người dùng ${
          user.fullName || user.email
        }?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const revokeFn = httpsCallable<any, any>(functions, "adminRevokePremium");
      await revokeFn({ userId: user.id });
      showToast(`Đã thu hồi gói của ${user.fullName || user.email}`);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi: ${e.message || "Không thể thu hồi premium."}`);
      setLoading(false);
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.fullName || ""} (${user.email})` : userId;
  };

  const formatDateTime = (value: any) => {
    if (!value) return "Không giới hạn";
    let date: Date;
    if (typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else {
      const seconds = value._seconds ?? value.seconds;
      if (seconds !== undefined) {
        date = new Date(seconds * 1000);
      } else {
        date = new Date(value);
      }
    }
    if (isNaN(date.getTime())) return "Không giới hạn";
    return date.toLocaleString("vi-VN");
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Quản lý Premium (Demo)</h1>
      </div>

      {/* Warning Banner */}
      <div
        className="panel"
        style={{
          borderLeft: "6px solid #d97706",
          background: "#fffbeb",
          padding: "16px",
          marginBottom: "20px",
          color: "#92400e",
          borderRadius: "6px",
        }}
      >
        <h3 style={{ margin: "0 0 6px 0", color: "#b45309" }}>
          ⚠️ LƯU Ý MÔI TRƯỜNG KIỂM THỬ
        </h3>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
          Trang web này dùng để mô phỏng và kiểm thử tính năng phân quyền Premium.
          Tất cả các hành động Cấp/Thu hồi đều thông qua Cloud Functions an toàn,
          không tích hợp và không phát sinh giao dịch tiền tệ thật.
        </p>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          className={activeTab === "users" ? "" : "secondary"}
          onClick={() => setActiveTab("users")}
        >
          Người dùng &amp; Gói cước
        </button>
        <button
          className={activeTab === "transactions" ? "" : "secondary"}
          onClick={() => setActiveTab("transactions")}
        >
          Lịch sử giao dịch mock ({transactions.length})
        </button>
      </div>

      {activeTab === "users" && (
        <>
          {/* Filter Panel */}
          <div
            className="panel"
            style={{
              padding: "16px",
              marginBottom: "16px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Tìm theo email, tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
              style={{ flex: 1, minWidth: "200px" }}
            />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Gói cước:</label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                style={{ width: "130px", padding: "8px" }}
              >
                <option value="ALL">Tất cả</option>
                <option value="FREE">FREE</option>
                <option value="PREMIUM">PREMIUM</option>
                <option value="TRIAL">TRIAL</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "130px", padding: "8px" }}
              >
                <option value="ALL">Tất cả</option>
                <option value="NONE">Chưa kích hoạt</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELED">CANCELED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>👥</div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Không tìm thấy người dùng</h3>
              <p style={{ color: "var(--text-muted)", margin: "0", fontSize: "14px" }}>
                Không tìm thấy người dùng nào khớp với bộ lọc hoặc từ khóa tìm kiếm của bạn.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Họ và Tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Gói hiện tại</th>
                    <th>Trạng thái</th>
                    <th>Ngày hết hạn</th>
                    <th>Quyền chi tiết</th>
                    <th style={{ width: "220px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const summary = user.subscriptionSummary;
                    const plan = summary?.plan ?? "FREE";
                    const status = summary?.status ?? "NONE";
                    const expiresAtStr = summary?.expiresAt
                      ? formatDateTime(summary.expiresAt)
                      : "Không giới hạn";

                    // Simple check if expired
                    let isUserExpired = false;
                    if (summary?.expiresAt) {
                      let dateVal: number = 0;
                      if (typeof summary.expiresAt.toMillis === "function") {
                        dateVal = summary.expiresAt.toMillis();
                      } else if (summary.expiresAt._seconds) {
                        dateVal = summary.expiresAt._seconds * 1000;
                      } else {
                        dateVal = new Date(summary.expiresAt).getTime();
                      }
                      if (dateVal > 0 && dateVal < Date.now()) {
                        isUserExpired = true;
                      }
                    }

                    return (
                      <tr key={user.id}>
                        <td style={{ fontWeight: "600" }}>{user.fullName || "—"}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${user.role === "ADMIN" ? "info" : ""}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              plan === "PREMIUM"
                                ? "active"
                                : plan === "TRIAL"
                                ? "yellow"
                                : "inactive"
                            }`}
                          >
                            {plan}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              isUserExpired
                                ? "inactive"
                                : status === "ACTIVE"
                                ? "active"
                                : status === "CANCELED"
                                ? "yellow"
                                : "inactive"
                            }`}
                          >
                            {isUserExpired ? "EXPIRED" : status}
                          </span>
                        </td>
                        <td>{expiresAtStr}</td>
                        <td style={{ fontSize: "11px", maxWidth: "200px" }}>
                          {summary?.entitlements ? (
                            <ul style={{ margin: 0, paddingLeft: "14px" }}>
                              {summary.entitlements.premiumContent && <li>Mở khóa nội dung</li>}
                              {summary.entitlements.voiceQuiz && <li>AI Voice Quiz</li>}
                              {summary.entitlements.advancedReports && <li>Báo cáo chi tiết</li>}
                              {summary.entitlements.premiumNpcs && <li>NPC Premium</li>}
                            </ul>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="secondary"
                              onClick={() => openGrantModal(user)}
                            >
                              Cấp Gói
                            </button>
                            {plan !== "FREE" && (
                              <button
                                className="danger"
                                onClick={() => handleRevokePremium(user)}
                              >
                                Thu hồi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "transactions" && (
        <>
          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : transactions.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>💳</div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Không có giao dịch nào</h3>
              <p style={{ color: "var(--text-muted)", margin: "0", fontSize: "14px" }}>
                Chưa có giao dịch mô phỏng (mock) nào được ghi nhận trên hệ thống.
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Giao dịch ID</th>
                    <th>Người dùng</th>
                    <th>Cổng thanh toán</th>
                    <th>Sản phẩm ID</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "11px" }}>
                          {t.id}
                        </code>
                      </td>
                      <td style={{ fontSize: "13px" }}>{getUserEmail(t.userId)}</td>
                      <td>
                        <span className="badge info">{t.provider}</span>
                      </td>
                      <td>
                        <code>{t.productId}</code>
                      </td>
                      <td style={{ fontWeight: "700" }}>
                        {t.amount.toLocaleString("vi-VN")} {t.currency}
                      </td>
                      <td>
                        <span className={`badge ${t.status === "SUCCESS" ? "active" : "inactive"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px" }}>{formatDateTime(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Grant modal */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(500px, 95vw)" }}
          >
            <div className="modal-header">
              <h2>Cấp quyền Premium / Trial</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleGrantPremium}>
              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="field">
                    <label>Người nhận</label>
                    <input
                      type="text"
                      value={`${selectedUser.fullName || ""} (${selectedUser.email})`}
                      disabled
                      style={{ background: "#f1f5f9" }}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="field">
                      <label>Gói cước <span style={{ color: "red" }}>*</span></label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value as "PREMIUM" | "TRIAL")}
                      >
                        <option value="PREMIUM">PREMIUM</option>
                        <option value="TRIAL">TRIAL</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Ngày hết hạn {plan === "TRIAL" && <span style={{ color: "red" }}>*</span>}</label>
                      <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        required={plan === "TRIAL"}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>
                      Quyền lợi (Entitlements)
                    </label>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        background: "#f8fafc",
                        padding: "12px",
                        borderRadius: "6px",
                      }}
                    >
                      <div className="field check-row" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          id="premiumContent"
                          checked={premiumContent}
                          onChange={(e) => setPremiumContent(e.target.checked)}
                        />
                        <label htmlFor="premiumContent" style={{ fontWeight: "normal", cursor: "pointer", margin: 0 }}>
                          premiumContent (Mở khóa nội dung Premium)
                        </label>
                      </div>

                      <div className="field check-row" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          id="voiceQuiz"
                          checked={voiceQuiz}
                          onChange={(e) => setVoiceQuiz(e.target.checked)}
                        />
                        <label htmlFor="voiceQuiz" style={{ fontWeight: "normal", cursor: "pointer", margin: 0 }}>
                          voiceQuiz (AI Voice Quiz)
                        </label>
                      </div>

                      <div className="field check-row" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          id="advancedReports"
                          checked={advancedReports}
                          onChange={(e) => setAdvancedReports(e.target.checked)}
                        />
                        <label htmlFor="advancedReports" style={{ fontWeight: "normal", cursor: "pointer", margin: 0 }}>
                          advancedReports (Xem báo cáo phân tích sâu)
                        </label>
                      </div>

                      <div className="field check-row" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="checkbox"
                          id="premiumNpcs"
                          checked={premiumNpcs}
                          onChange={(e) => setPremiumNpcs(e.target.checked)}
                        />
                        <label htmlFor="premiumNpcs" style={{ fontWeight: "normal", cursor: "pointer", margin: 0 }}>
                          premiumNpcs (Nhân vật Mascot VIP)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button type="submit" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Cấp Quyền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="toast">
          <span>✨</span> {toastMsg}
        </div>
      )}
    </div>
  );
}
