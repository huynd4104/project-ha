import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { MultiSelect } from "../components/MultiSelect";
import { uiLabel } from "../utils/adminLabels";
import { useTableControls } from "../utils/tableControls";
import type { LearningPath, Program, PublishStatus, AccessType, LearningLevel } from "../types/firebaseModels";

const LEVELS: LearningLevel[] = ["BEGINNER", "BASIC", "INTERMEDIATE"];
const ACCESS_TYPES: AccessType[] = ["FREE", "PREMIUM"];
const STATUSES: PublishStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const SUPPORT_LEVELS = ["LOW", "MEDIUM", "HIGH"];

const statusBadge = (s?: string) => s === "PUBLISHED" ? "published" : s === "ARCHIVED" ? "archived" : "draft";
const accessBadge = (s?: string) => s === "PREMIUM" ? "premium" : "free";

export function LearningPathsPageV2() {
  const [items, setItems] = useState<LearningPath[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<LearningPath[]>([]);
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningPath | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [programId, setProgramId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<LearningLevel>("BEGINNER");
  const [orderIndex, setOrderIndex] = useState(0);
  const [accessType, setAccessType] = useState<AccessType>("FREE");
  const [status, setStatus] = useState<PublishStatus>("DRAFT");

  const [ruleDiffCategories, setRuleDiffCategories] = useState<string[]>([]);
  const [ruleLearningGoals, setRuleLearningGoals] = useState<string[]>([]);
  const [ruleSupportLevel, setRuleSupportLevel] = useState<string[]>([]);
  const [ruleAgeMin, setRuleAgeMin] = useState(0);
  const [ruleAgeMax, setRuleAgeMax] = useState(10);

  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [lpRes, pRes, cRes, gRes] = await Promise.all([
        adminApi.list("/learning-paths"),
        adminApi.list("/programs"),
        adminApi.list("/development-categories"),
        adminApi.list("/learning-goals")
      ]);
      const paths = (lpRes.data.data || []) as LearningPath[];
      paths.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setItems(paths);
      setPrograms(pRes.data.data || []);
      setCategories(cRes.data.data || []);
      setGoals(gRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = items;
    if (filterProgram) result = result.filter((i) => i.programId === filterProgram);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [items, search, filterProgram]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };
  const getProgramTitle = (id: string) => programs.find((p) => p.id === id)?.title || "—";
  const table = useTableControls(filtered, [
    { value: "order", label: "Thứ tự", getValue: (item) => item.orderIndex },
    { value: "title", label: "Tiêu đề", getValue: (item) => item.title },
    { value: "program", label: "Chương trình", getValue: (item) => getProgramTitle(item.programId) },
    { value: "level", label: "Cấp độ", getValue: (item) => item.level },
    { value: "access", label: "Truy cập", getValue: (item) => item.accessType },
    { value: "status", label: "Trạng thái", getValue: (item) => item.status }
  ], "order");

  const categoryOptions = categories.filter((c: any) => c.isActive).map((c: any) => ({ value: c.key, label: c.label }));
  const goalOptions = goals.filter((g: any) => g.isActive).map((g: any) => ({ value: g.key, label: g.label }));
  const supportOptions = SUPPORT_LEVELS.map((s) => ({ value: s, label: uiLabel(s) }));

  const openAddModal = () => {
    setEditingItem(null);
    setProgramId(programs[0]?.id || ""); setTitle(""); setDescription("");
    setLevel("BEGINNER"); setOrderIndex(items.length ? Math.max(...items.map((i) => i.orderIndex ?? 0)) + 1 : 1);
    setAccessType("FREE"); setStatus("DRAFT");
    setRuleDiffCategories([]); setRuleLearningGoals([]); setRuleSupportLevel([]);
    setRuleAgeMin(0); setRuleAgeMax(10);
    setErrors({}); setIsModalOpen(true);
  };

  const openEditModal = (item: LearningPath) => {
    setEditingItem(item);
    setProgramId(item.programId || ""); setTitle(item.title || ""); setDescription(item.description || "");
    setLevel(item.level || "BEGINNER"); setOrderIndex(item.orderIndex ?? 0);
    setAccessType(item.accessType || "FREE"); setStatus(item.status || "DRAFT");
    const rules = (item.targetProfileRules || {}) as Record<string, any>;
    setRuleDiffCategories((rules.difficultyCategories as string[]) || []);
    setRuleLearningGoals((rules.learningGoals as string[]) || []);
    setRuleSupportLevel((rules.supportLevel as string[]) || []);
    setRuleAgeMin((rules.ageMin as number) ?? 0); setRuleAgeMax((rules.ageMax as number) ?? 10);
    setErrors({}); setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!programId) errs.programId = "Vui lòng chọn chương trình.";
    if (status === "PUBLISHED" && !programId) errs.programId = "Không thể xuất bản mà không có chương trình.";
    if (status === "PUBLISHED" && !title.trim()) errs.title = "Không thể xuất bản mà không có tiêu đề.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const targetProfileRules = {
      difficultyCategories: ruleDiffCategories,
      learningGoals: ruleLearningGoals,
      supportLevel: ruleSupportLevel,
      ageMin: ruleAgeMin, ageMax: ruleAgeMax
    };
    const payload = {
      programId, title: title.trim(), description: description.trim(),
      targetProfileRules, level, orderIndex: Number(orderIndex),
      accessType, status
    };
    try {
      if (editingItem) await adminApi.update("/learning-paths", editingItem.id, payload);
      else await adminApi.create("/learning-paths", payload);
      setIsModalOpen(false);
      showToast(editingItem ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lộ trình này?")) return;
    await adminApi.remove("/learning-paths", id);
    showToast("Đã xóa!"); loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Lộ trình học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Tạo đường học cụ thể cho từng nhóm trẻ và mục tiêu học.</p>
        </div>
        <button onClick={openAddModal}>➕ Thêm lộ trình</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <input type="text" placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
        <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} style={{ maxWidth: "260px" }}>
          <option value="">Tất cả chương trình</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛣️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có lộ trình nào</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Lộ trình học tập giúp cá nhân hóa nội dung giảng dạy dựa trên nhóm khó khăn của trẻ.
          </p>
          <button onClick={openAddModal}>➕ Tạo lộ trình ngay</button>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th>Tiêu đề</th>
                <th>Chương trình</th>
                <th>Cấp độ</th>
                <th>Truy cập</th>
                <th>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                  <td style={{ fontWeight: "600" }}>{item.title}</td>
                  <td style={{ fontSize: "13px" }}>{getProgramTitle(item.programId)}</td>
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
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(720px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa lộ trình" : "Thêm lộ trình mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Chương trình <span style={{ color: "red" }}>*</span></label>
                  <select value={programId} onChange={(e) => setProgramId(e.target.value)}>
                    <option value="">-- Chọn chương trình --</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  {errors.programId && <span className="error-msg">{errors.programId}</span>}
                </div>

                <div className="field">
                  <label>Tiêu đề <span style={{ color: "red" }}>*</span></label>
                  <input type="text" placeholder="VD: Lộ trình nghe hiểu cơ bản" value={title} onChange={(e) => setTitle(e.target.value)} />
                  {errors.title && <span className="error-msg">{errors.title}</span>}
                </div>

                <div className="field">
                  <label>Mô tả</label>
                  <textarea placeholder="Mô tả lộ trình..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label>Cấp độ</label>
                    <select value={level} onChange={(e) => setLevel(e.target.value as LearningLevel)}>{LEVELS.map((l) => <option key={l} value={l}>{uiLabel(l)}</option>)}</select>
                  </div>
                  <div className="field">
                    <label>Thứ tự</label>
                    <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label>Truy cập</label>
                    <select value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>{ACCESS_TYPES.map((a) => <option key={a} value={a}>{uiLabel(a)}</option>)}</select>
                  </div>
                  <div className="field">
                    <label>Trạng thái</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as PublishStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{uiLabel(s)}</option>)}</select>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", marginTop: "8px", paddingTop: "16px" }}>
                  <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-muted)" }}>Quy tắc đề xuất cho hồ sơ trẻ</h3>

                  <MultiSelect label="Nhóm khó khăn" options={categoryOptions} selected={ruleDiffCategories} onChange={setRuleDiffCategories} />
                  <MultiSelect label="Mục tiêu học" options={goalOptions} selected={ruleLearningGoals} onChange={setRuleLearningGoals} />
                  <MultiSelect label="Mức hỗ trợ" options={supportOptions} selected={ruleSupportLevel} onChange={setRuleSupportLevel} />

                  <div className="form-grid">
                    <div className="field">
                      <label>Tuổi tối thiểu</label>
                      <input type="number" value={ruleAgeMin} onChange={(e) => setRuleAgeMin(Number(e.target.value))} />
                    </div>
                    <div className="field">
                      <label>Tuổi tối đa</label>
                      <input type="number" value={ruleAgeMax} onChange={(e) => setRuleAgeMax(Number(e.target.value))} />
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
