import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import { uiLabel } from "../utils/adminLabels";
import { validateProgramPublish } from "../utils/publishValidation";
import type { DevelopmentCategory, LearningGoal, Skill, Program, PublishStatus, AccessType, LearningLevel } from "../types/firebaseModels";

const LEVELS: LearningLevel[] = ["BEGINNER", "BASIC", "INTERMEDIATE"];
const ACCESS_TYPES: AccessType[] = ["FREE", "PREMIUM"];
const STATUSES: PublishStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const statusBadge = (s?: string) => s === "PUBLISHED" ? "published" : s === "ARCHIVED" ? "archived" : "draft";
const accessBadge = (s?: string) => s === "PREMIUM" ? "premium" : "free";

export function ProgramsPageV2() {
  const [items, setItems] = useState<Program[]>([]);
  const [filtered, setFiltered] = useState<Program[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<DevelopmentCategory[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Program | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAgeMin, setTargetAgeMin] = useState(2);
  const [targetAgeMax, setTargetAgeMax] = useState(6);
  const [difficultyCategories, setDifficultyCategories] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [level, setLevel] = useState<LearningLevel>("BEGINNER");
  const [accessType, setAccessType] = useState<AccessType>("FREE");
  const [status, setStatus] = useState<PublishStatus>("DRAFT");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, cRes, gRes, sRes] = await Promise.all([
        adminApi.list("/programs"),
        adminApi.list("/development-categories"),
        adminApi.list("/learning-goals"),
        adminApi.list("/skills")
      ]);
      setItems(pRes.data.data || []);
      setCategories(cRes.data.data || []);
      setGoals(gRes.data.data || []);
      setSkills(sRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? items.filter((i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)) : items);
  }, [items, search]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const categoryOptions = categories.filter((c) => c.isActive).map((c) => ({ value: c.key, label: c.label }));
  const goalOptions = goals.filter((g) => g.isActive).map((g) => ({ value: g.key, label: g.label }));
  const skillOptions = skills.filter((s) => s.isActive).map((s) => ({ value: s.key, label: s.label }));

  const openAddModal = () => {
    setEditingItem(null);
    setTitle(""); setDescription(""); setTargetAgeMin(2); setTargetAgeMax(6);
    setDifficultyCategories([]); setLearningGoals([]); setSkillTags([]);
    setLevel("BEGINNER"); setAccessType("FREE"); setStatus("DRAFT");
    setErrors({}); setPublishWarnings([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Program) => {
    setEditingItem(item);
    setTitle(item.title || ""); setDescription(item.description || "");
    setTargetAgeMin(item.targetAgeMin ?? 2); setTargetAgeMax(item.targetAgeMax ?? 6);
    setDifficultyCategories(item.difficultyCategories || []);
    setLearningGoals(item.learningGoals || []);
    setSkillTags(item.skillTags || []);
    setLevel(item.level || "BEGINNER"); setAccessType(item.accessType || "FREE");
    setStatus(item.status || "DRAFT");
    setErrors({}); setPublishWarnings([]);
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!description.trim()) errs.description = "Mô tả không được để trống.";
    if (targetAgeMin > targetAgeMax) errs.targetAgeMin = "Tuổi min phải ≤ tuổi max.";
    setErrors(errs);

    if (status === "PUBLISHED") {
      const v = validateProgramPublish({
        title, description, learningGoals: learningGoals as any, skillTags,
        targetAgeMin, targetAgeMax
      });
      setPublishWarnings(v.errors);
      if (!v.valid) return false;
    } else {
      setPublishWarnings([]);
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      title: title.trim(), description: description.trim(),
      targetAgeMin, targetAgeMax, difficultyCategories, learningGoals,
      skillTags, level, accessType, status
    };
    try {
      if (editingItem) await adminApi.update("/programs", editingItem.id, payload);
      else await adminApi.create("/programs", payload);
      setIsModalOpen(false);
      showToast(editingItem ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chương trình này?")) return;
    await adminApi.remove("/programs", id);
    showToast("Đã xóa!"); loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Chương trình học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Tạo các nhóm nội dung lớn như Luyện nghe cơ bản, Giao tiếp hằng ngày, Nhận biết cảm xúc.</p>
        </div>
        <button onClick={openAddModal}>➕ Thêm chương trình</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input type="text" placeholder="Tìm kiếm chương trình..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📂</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có chương trình nào</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Bắt đầu thiết kế chương trình học để phân phối lộ trình học tập cho trẻ.
          </p>
          <button onClick={openAddModal}>➕ Tạo chương trình ngay</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Đối tượng</th>
                <th>Mục tiêu học</th>
                <th>Kỹ năng</th>
                <th>Cấp độ</th>
                <th>Truy cập</th>
                <th>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "600" }}>{item.title}</td>
                  <td style={{ fontSize: "13px" }}>{item.targetAgeMin}–{item.targetAgeMax} tuổi</td>
                  <td style={{ fontSize: "12px" }}>{(item.learningGoals || []).length} mục tiêu</td>
                  <td style={{ fontSize: "12px" }}>{(item.skillTags || []).length} kỹ năng</td>
                  <td><span className="badge info">{uiLabel(item.level)}</span></td>
                  <td><span className={`badge ${accessBadge(item.accessType)}`}>{uiLabel(item.accessType)}</span></td>
                  <td><span className={`badge ${statusBadge(item.status)}`}>{uiLabel(item.status)}</span></td>
                  <td>
                    <div className="actions">
                      <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                      <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(780px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa chương trình" : "Thêm chương trình mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {publishWarnings.length > 0 && (
                      <div className="validation-warnings">
                        <p>⚠️ Không thể xuất bản:</p>
                        <ul>{publishWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                      </div>
                    )}

                    <div className="field">
                      <label>Tiêu đề chương trình <span style={{ color: "red" }}>*</span></label>
                      <input type="text" placeholder="VD: Luyện nghe cơ bản" value={title} onChange={(e) => setTitle(e.target.value)} />
                      {errors.title && <span className="error-msg">{errors.title}</span>}
                    </div>

                    <div className="field">
                      <label>Mô tả <span style={{ color: "red" }}>*</span></label>
                      <textarea placeholder="Mô tả chương trình học..." value={description} onChange={(e) => setDescription(e.target.value)} />
                      {errors.description && <span className="error-msg">{errors.description}</span>}
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Tuổi tối thiểu</label>
                        <input type="number" min={0} max={18} value={targetAgeMin} onChange={(e) => setTargetAgeMin(Number(e.target.value))} />
                        {errors.targetAgeMin && <span className="error-msg">{errors.targetAgeMin}</span>}
                      </div>
                      <div className="field">
                        <label>Tuổi tối đa</label>
                        <input type="number" min={0} max={18} value={targetAgeMax} onChange={(e) => setTargetAgeMax(Number(e.target.value))} />
                      </div>
                    </div>

                    <MultiSelect label="Nhóm khó khăn" options={categoryOptions} selected={difficultyCategories} onChange={setDifficultyCategories} placeholder="Chọn nhóm khó khăn..." />
                    <MultiSelect label={<span>Mục tiêu học tập <span style={{ color: "red" }}>*</span></span>} options={goalOptions} selected={learningGoals} onChange={setLearningGoals} placeholder="Chọn mục tiêu..." />
                    <MultiSelect label={<span>Kỹ năng <span style={{ color: "red" }}>*</span></span>} options={skillOptions} selected={skillTags} onChange={setSkillTags} placeholder="Chọn kỹ năng..." />

                    <div className="form-grid">
                      <div className="field">
                        <label>Cấp độ</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value as LearningLevel)}>
                          {LEVELS.map((l) => <option key={l} value={l}>{uiLabel(l)}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Loại truy cập</label>
                        <select value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>
                          {ACCESS_TYPES.map((a) => <option key={a} value={a}>{uiLabel(a)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="field">
                      <label>Trạng thái xuất bản</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value as PublishStatus)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{uiLabel(s)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="drawer-aside" style={{ width: "240px" }}>
                    <h3>Xem trước</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginTop: "12px", background: "white" }}>
                      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "#f0f9ff" }}>
                        <strong style={{ fontSize: "14px" }}>{title || "Tên chương trình"}</strong>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{description || "Mô tả chương trình..."}</p>
                      </div>
                      <div style={{ padding: "12px", fontSize: "12px" }}>
                        <div style={{ marginBottom: "6px" }}>🎯 {learningGoals.length} mục tiêu</div>
                        <div style={{ marginBottom: "6px" }}>🧩 {skillTags.length} kỹ năng</div>
                        <div style={{ marginBottom: "6px" }}>👶 {targetAgeMin}–{targetAgeMax} tuổi</div>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                          <span className={`badge ${statusBadge(status)}`}>{uiLabel(status)}</span>
                          <span className={`badge ${accessBadge(accessType)}`}>{uiLabel(accessType)}</span>
                          <span className="badge info">{uiLabel(level)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingItem ? "Cập nhật" : "Tạo mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
