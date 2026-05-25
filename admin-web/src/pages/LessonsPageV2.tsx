import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { MultiSelect } from "../components/MultiSelect";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { uiLabel } from "../utils/adminLabels";
import { validateLessonPublish } from "../utils/publishValidation";
import { useTableControls } from "../utils/tableControls";
import type { Lesson, NPC, PublishStatus, AccessType, LearningLevel } from "../types/firebaseModels";

const LESSON_TYPES = [
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
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Lesson | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonType, setLessonType] = useState("MIXED");
  const [level, setLevel] = useState<LearningLevel>("BEGINNER");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [difficultyCategories, setDifficultyCategories] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [npcId, setNpcId] = useState("");
  const [accessType, setAccessType] = useState<AccessType>("FREE");
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("DRAFT");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishWarnings, setPublishWarnings] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [lRes, nRes, cRes, gRes, sRes, aRes] = await Promise.all([
        adminApi.list("/lessons"),
        adminApi.list("/npcs"), adminApi.list("/development-categories"),
        adminApi.list("/learning-goals"), adminApi.list("/skills"), adminApi.list("/activities")
      ]);
      const lessons = (lRes.data.data || []) as Lesson[];
      lessons.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setItems(lessons);
      setNpcs(nRes.data.data || []);
      setCategories(cRes.data.data || []);
      setGoals(gRes.data.data || []);
      setSkills(sRes.data.data || []);
      setAllActivities(aRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const next = items.filter((i) => {
      const matchesSearch = !q || i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
      const activityCount = allActivities.filter((a) => a.lessonId === i.id).length;
      const matchesFilter =
        filter === "ALL" ||
        (filter === "DRAFT" && (i.publishStatus || "DRAFT") === "DRAFT") ||
        (filter === "PUBLISHED" && i.publishStatus === "PUBLISHED") ||
        (filter === "FREE" && (i.accessType || "FREE") === "FREE") ||
        (filter === "PREMIUM" && i.accessType === "PREMIUM") ||
        (filter === "HAS_ACTIVITIES" && activityCount > 0) ||
        (filter === "NO_ACTIVITIES" && activityCount === 0);
      return matchesSearch && matchesFilter;
    });
    setFiltered(next);
  }, [items, search, filter, allActivities]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const table = useTableControls(filtered, [
    { value: "title", label: "Tiêu đề", getValue: (item) => item.title },
    { value: "type", label: "Loại", getValue: (item) => item.lessonType || item.type },
    { value: "level", label: "Cấp độ", getValue: (item) => item.level },
    { value: "access", label: "Truy cập", getValue: (item) => item.accessType },
    { value: "status", label: "Xuất bản", getValue: (item) => item.publishStatus }
  ], "title");
  const categoryOptions = categories.filter((c: any) => c.isActive).map((c: any) => ({ value: c.key, label: c.label }));
  const goalOptions = goals.filter((g: any) => g.isActive).map((g: any) => ({ value: g.key, label: g.label }));
  const skillOptions = skills.filter((s: any) => s.isActive).map((s: any) => ({ value: s.key, label: s.label }));

  const openAddModal = () => {
    setEditingItem(null);
    setTitle(""); setDescription(""); setLessonType("MIXED");
    setLevel("BEGINNER");
    setSkillTags([]); setDifficultyCategories([]); setLearningGoals([]);
    setEstimatedMinutes(5); setNpcId(""); setAccessType("FREE"); setPublishStatus("DRAFT");
    setIsActive(true); setErrors({}); setPublishWarnings([]);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Lesson) => {
    setEditingItem(item);
    setTitle(item.title || ""); setDescription(item.description || "");
    setLessonType(item.lessonType || item.type || "MIXED");
    setLevel(item.level || "BEGINNER");
    setSkillTags(item.skillTags || []); setDifficultyCategories(item.difficultyCategories || []);
    setLearningGoals(item.learningGoals || []);
    setEstimatedMinutes(item.estimatedMinutes ?? 5); setNpcId(item.npcId || "");
    setAccessType(item.accessType || "FREE"); setPublishStatus(item.publishStatus || "DRAFT");
    setIsActive(item.isActive !== false);
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
      level, skillTags, difficultyCategories, learningGoals,
      estimatedMinutes, npcId: npcId || null,
      accessType, publishStatus, isActive
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
        <div>
          <h1>Bài học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Tạo bài học chính. Mỗi bài học có thể gồm nhiều hoạt động nhỏ.</p>
        </div>
        <button onClick={openAddModal}>➕ Thêm bài học</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input type="text" placeholder="Tìm kiếm bài học..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
          {[
            ["ALL", "Tất cả"],
            ["DRAFT", "Bản nháp"],
            ["PUBLISHED", "Đã xuất bản"],
            ["FREE", "Miễn phí"],
            ["PREMIUM", "Premium"],
            ["HAS_ACTIVITIES", "Có hoạt động"],
            ["NO_ACTIVITIES", "Chưa có hoạt động"]
          ].map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? "" : "secondary"} onClick={() => setFilter(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📚</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có bài học nào</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Tạo các bài học để liên kết hoạt động và phân loại theo độ tuổi của trẻ.
          </p>
          <button onClick={openAddModal}>➕ Thêm bài học mới</button>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Nhân vật</th>
                <th>Cấp độ</th>
                <th>Truy cập</th>
                <th>Xuất bản</th>
                <th style={{ width: "300px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => {
                const npc = npcs.find((n) => n.id === item.npcId);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: "600" }}>
                      {item.title}
                      {!item.lessonType && item.type && <span className="badge yellow" style={{ marginLeft: "8px" }}>Dữ liệu cũ</span>}
                    </td>
                    <td><span className="badge info">{uiLabel(item.lessonType || item.type)}</span></td>
                    <td>{npc ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {npc.imageUrl && <img src={npc.imageUrl} alt="" style={{ width: "20px", height: "20px", borderRadius: "4px" }} />}
                        <span style={{ fontSize: "12px" }}>{npc.name}</span>
                      </div>
                    ) : <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>}</td>
                    <td><span className="badge info">{uiLabel(item.level)}</span></td>
                    <td><span className={`badge ${accessBadge(item.accessType)}`}>{uiLabel(item.accessType || "FREE")}</span></td>
                    <td><span className={`badge ${statusBadge(item.publishStatus)}`}>{uiLabel(item.publishStatus || "DRAFT")}</span></td>
                    <td>
                      <div className="actions">
                        <Link className="button-link secondary" style={{ padding: "6px 12px", fontSize: "12px" }} to="/activity-builder">Thêm hoạt động</Link>
                        <Link className="button-link secondary" style={{ padding: "6px 12px", fontSize: "12px" }} to="/path-builder">Sắp xếp vào lộ trình</Link>
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
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(800px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa bài học" : "Thêm bài học mới"}</h2>
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
                          {LESSON_TYPES.map((t) => <option key={t} value={t}>{uiLabel(t)}</option>)}
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
                        <label>Mascot</label>
                        <select value={npcId} onChange={(e) => setNpcId(e.target.value)}>
                          <option value="">-- Không --</option>
                          {npcs.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Cấp độ</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value as LearningLevel)}>{LEVELS.map((l) => <option key={l} value={l}>{uiLabel(l)}</option>)}</select>
                      </div>
                    </div>

                    <MultiSelect label="Nhóm khó khăn" options={categoryOptions} selected={difficultyCategories} onChange={setDifficultyCategories} />
                    <MultiSelect label="Mục tiêu học tập" options={goalOptions} selected={learningGoals} onChange={setLearningGoals} />
                    <MultiSelect label="Kỹ năng" options={skillOptions} selected={skillTags} onChange={setSkillTags} />

                    <div className="form-grid">
                      <div className="field">
                        <label>Truy cập</label>
                        <select value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>{ACCESS_TYPES.map((a) => <option key={a} value={a}>{uiLabel(a)}</option>)}</select>
                      </div>
                      <div className="field">
                        <label>Trạng thái xuất bản</label>
                        <select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value as PublishStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{uiLabel(s)}</option>)}</select>
                      </div>
                    </div>

                    <div className="field" style={{ justifyContent: "end" }}>
                      <ToggleSwitch id="lessonActive" label="Đang bật" checked={isActive} onChange={setIsActive} />
                    </div>
                  </div>

                  <div className="drawer-aside" style={{ width: "220px" }}>
                    <h3>Xem trước</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginTop: "12px", background: "white", padding: "14px" }}>
                      <strong style={{ fontSize: "13px" }}>{title || "Tên bài học"}</strong>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{description || "Mô tả bài học..."}</p>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                        <span className="badge info">{uiLabel(lessonType)}</span>
                        <span className={`badge ${statusBadge(publishStatus)}`}>{uiLabel(publishStatus)}</span>
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
