import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import { validateLessonPublish } from "../utils/publishValidation";
import type { Lesson, Program, LearningPath, NPC, PublishStatus, AccessType, LearningLevel } from "../types/firebaseModels";

const LESSON_TYPES_V2 = [
  "MATH", "DIALOGUE", "FLASHCARD", "THINKING", "SPELLING", "RHYME",
  "LISTEN_AND_CHOOSE", "VOICE_QUIZ", "EMOTION", "DAILY_LIFE", "PARENT_ACTIVITY", "MIXED"
];

const LEVELS: LearningLevel[] = ["BEGINNER", "BASIC", "INTERMEDIATE"];
const ACCESS_TYPES: AccessType[] = ["FREE", "PREMIUM"];
const STATUSES: PublishStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const statusBadge = (s?: string) => s === "PUBLISHED" ? "published" : s === "ARCHIVED" ? "archived" : "draft";
const accessBadge = (s?: string) => s === "PREMIUM" ? "premium" : "free";

export function LessonsPageV2() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [filtered, setFiltered] = useState<Lesson[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Lesson | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonType, setLessonType] = useState("MIXED");
  const [programId, setProgramId] = useState("");
  const [pathId, setPathId] = useState("");
  const [level, setLevel] = useState<LearningLevel>("BEGINNER");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [difficultyCategories, setDifficultyCategories] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [npcId, setNpcId] = useState("");
  const [accessType, setAccessType] = useState<AccessType>("FREE");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("DRAFT");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [lRes, pRes, lpRes, nRes, cRes, gRes, sRes] = await Promise.all([
        adminApi.list("/lessons"), adminApi.list("/programs"), adminApi.list("/learning-paths"),
        adminApi.list("/npcs"), adminApi.list("/development-categories"),
        adminApi.list("/learning-goals"), adminApi.list("/skills")
      ]);
      const lessons = (lRes.data.data || []) as Lesson[];
      lessons.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setItems(lessons);
      setPrograms(pRes.data.data || []);
      setPaths(lpRes.data.data || []);
      setNpcs(nRes.data.data || []);
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

  const filteredPaths = programId ? paths.filter((p) => p.programId === programId) : paths;
  const categoryOptions = categories.filter((c: any) => c.isActive).map((c: any) => ({ value: c.key, label: c.label }));
  const goalOptions = goals.filter((g: any) => g.isActive).map((g: any) => ({ value: g.key, label: g.label }));
  const skillOptions = skills.filter((s: any) => s.isActive).map((s: any) => ({ value: s.key, label: s.label }));

  const openAddModal = () => {
    setEditingItem(null);
    setTitle(""); setDescription(""); setLessonType("MIXED");
    setProgramId(""); setPathId(""); setLevel("BEGINNER");
    setSkillTags([]); setDifficultyCategories([]); setLearningGoals([]);
    setEstimatedMinutes(5); setNpcId(""); setAccessType("FREE"); setPublishStatus("DRAFT");
    setOrderIndex(items.length ? Math.max(...items.map((i) => i.orderIndex ?? 0)) + 10 : 10);
    setIsActive(true); setErrors({}); setPublishWarnings([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Lesson) => {
    setEditingItem(item);
    setTitle(item.title || ""); setDescription(item.description || "");
    setLessonType(item.lessonType || item.type || "MIXED");
    setProgramId(item.programId || ""); setPathId(item.pathId || "");
    setLevel(item.level || "BEGINNER");
    setSkillTags(item.skillTags || []); setDifficultyCategories(item.difficultyCategories || []);
    setLearningGoals(item.learningGoals || []);
    setEstimatedMinutes(item.estimatedMinutes ?? 5); setNpcId(item.npcId || "");
    setAccessType(item.accessType || "FREE"); setPublishStatus(item.publishStatus || "DRAFT");
    setOrderIndex(item.orderIndex ?? 0); setIsActive(item.isActive !== false);
    setErrors({}); setPublishWarnings([]);
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề không được để trống.";
    if (!description.trim()) errs.description = "Mô tả không được để trống.";
    if (!lessonType) errs.lessonType = "Loại bài không được để trống.";
    if (estimatedMinutes <= 0) errs.estimatedMinutes = "Thời gian phải > 0.";
    setErrors(errs);

    if (publishStatus === "PUBLISHED") {
      const v = validateLessonPublish(
        { title, description, lessonType, estimatedMinutes, learningGoals: learningGoals as any, skillTags },
        0, true
      );
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
    const payload: any = {
      title: title.trim(), description: description.trim(),
      lessonType, type: lessonType,
      programId: programId || null, pathId: pathId || null,
      level, skillTags, difficultyCategories, learningGoals,
      estimatedMinutes, npcId: npcId || null,
      accessType, publishStatus, orderIndex: Number(orderIndex), isActive
    };
    try {
      if (editingItem) await adminApi.update("/lessons", editingItem.id, payload);
      else await adminApi.create("/lessons", payload);
      setIsModalOpen(false);
      showToast(editingItem ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
    await adminApi.remove("/lessons", id);
    showToast("Đã xóa!"); loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Bài học v2</h1>
        <button onClick={openAddModal}>➕ Thêm Bài Học</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input type="text" placeholder="Tìm kiếm bài học..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      {loading ? <p>Đang tải...</p> : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📚</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có bài học nào</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Tạo các bài học để liên kết hoạt động và phân loại theo độ tuổi của trẻ.
          </p>
          <button onClick={openAddModal}>➕ Thêm bài học mới</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Chương trình</th>
                <th>Mascot</th>
                <th>Level</th>
                <th>Truy cập</th>
                <th>Publish</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const npc = npcs.find((n) => n.id === item.npcId);
                const prog = programs.find((p) => p.id === item.programId);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                    <td style={{ fontWeight: "600" }}>{item.title}</td>
                    <td><span className="badge info">{item.lessonType || item.type}</span></td>
                    <td style={{ fontSize: "13px" }}>{prog?.title || "—"}</td>
                    <td>{npc ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {npc.imageUrl && <img src={npc.imageUrl} alt="" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />}
                        <span style={{ fontSize: "12px" }}>{npc.name}</span>
                      </div>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>}</td>
                    <td><span className="badge info">{item.level || "—"}</span></td>
                    <td><span className={`badge ${accessBadge(item.accessType)}`}>{item.accessType || "FREE"}</span></td>
                    <td><span className={`badge ${statusBadge(item.publishStatus)}`}>{item.publishStatus || "DRAFT"}</span></td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                        <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(800px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Cập nhật Bài Học" : "Thêm Bài Học Mới"}</h2>
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
                      <label>Tiêu đề bài học <span style={{ color: "red" }}>*</span></label>
                      <input type="text" placeholder="VD: Nghe và chọn hình" value={title} onChange={(e) => setTitle(e.target.value)} />
                      {errors.title && <span className="error-msg">{errors.title}</span>}
                    </div>

                    <div className="field">
                      <label>Mô tả <span style={{ color: "red" }}>*</span></label>
                      <textarea placeholder="Mô tả bài học..." value={description} onChange={(e) => setDescription(e.target.value)} />
                      {errors.description && <span className="error-msg">{errors.description}</span>}
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Loại bài học <span style={{ color: "red" }}>*</span></label>
                        <select value={lessonType} onChange={(e) => setLessonType(e.target.value)}>
                          {LESSON_TYPES_V2.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {errors.lessonType && <span className="error-msg">{errors.lessonType}</span>}
                      </div>
                      <div className="field">
                        <label>Thời gian ước tính (phút) <span style={{ color: "red" }}>*</span></label>
                        <input type="number" min={1} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} />
                        {errors.estimatedMinutes && <span className="error-msg">{errors.estimatedMinutes}</span>}
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Chương trình</label>
                        <select value={programId} onChange={(e) => { setProgramId(e.target.value); setPathId(""); }}>
                          <option value="">-- Không --</option>
                          {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Lộ trình</label>
                        <select value={pathId} onChange={(e) => setPathId(e.target.value)}>
                          <option value="">-- Không --</option>
                          {filteredPaths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Mascot đồng hành</label>
                        <select value={npcId} onChange={(e) => setNpcId(e.target.value)}>
                          <option value="">-- Không --</option>
                          {npcs.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Level</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value as LearningLevel)}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</select>
                      </div>
                    </div>

                    <MultiSelect label="Kỹ năng" options={skillOptions} selected={skillTags} onChange={setSkillTags} />
                    <MultiSelect label="Nhóm khó khăn" options={categoryOptions} selected={difficultyCategories} onChange={setDifficultyCategories} />
                    <MultiSelect label="Mục tiêu học tập" options={goalOptions} selected={learningGoals} onChange={setLearningGoals} />

                    <div className="form-grid">
                      <div className="field">
                        <label>Truy cập</label>
                        <select value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>{ACCESS_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}</select>
                      </div>
                      <div className="field">
                        <label>Trạng thái xuất bản</label>
                        <select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value as PublishStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Thứ tự hiển thị</label>
                        <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
                      </div>
                      <div className="field check-row" style={{ height: "60px" }}>
                        <input type="checkbox" id="lessonV2Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                        <label htmlFor="lessonV2Active" style={{ fontWeight: "normal", cursor: "pointer" }}>Đang hoạt động</label>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-aside" style={{ width: "220px" }}>
                    <h3>Xem trước</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginTop: "12px", background: "white", padding: "14px" }}>
                      <strong style={{ fontSize: "13px" }}>{title || "Tên bài học"}</strong>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{description || "Mô tả bài học..."}</p>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                        <span className="badge info">{lessonType}</span>
                        <span className={`badge ${statusBadge(publishStatus)}`}>{publishStatus}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
                        ⏱ {estimatedMinutes} phút • {skillTags.length} kỹ năng
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingItem ? "Cập Nhật" : "Tạo Mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
