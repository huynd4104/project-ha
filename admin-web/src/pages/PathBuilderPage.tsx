import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { UNLOCK_RULE_LABELS, uiLabel } from "../utils/adminLabels";
import type { Lesson, LearningPath, PathItem, Program, UnlockRule } from "../types/firebaseModels";

const UNLOCK_RULES: UnlockRule[] = ["ALWAYS_OPEN", "PREVIOUS_COMPLETED", "MANUAL_UNLOCK", "PREMIUM_ONLY"];
const UNLOCK_LABELS = UNLOCK_RULE_LABELS;

export function PathBuilderPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [allPathItems, setAllPathItems] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedPathId, setSelectedPathId] = useState("");
  const [addLessonId, setAddLessonId] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonTypeFilter, setLessonTypeFilter] = useState("");
  const [accessFilter, setAccessFilter] = useState("");
  const [detailLesson, setDetailLesson] = useState<Lesson | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [draftPathItems, setDraftPathItems] = useState<PathItem[]>([]);
  const [draggingPathItemId, setDraggingPathItemId] = useState("");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editUnlockRule, setEditUnlockRule] = useState<UnlockRule>("ALWAYS_OPEN");
  const [editReqCompletion, setEditReqCompletion] = useState(true);
  const [editPrereqs, setEditPrereqs] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, lpRes, lRes, piRes, cRes, gRes, sRes] = await Promise.all([
        adminApi.list("/programs"), adminApi.list("/learning-paths"),
        adminApi.list("/lessons"), adminApi.list("/path-items"),
        adminApi.list("/development-categories"), adminApi.list("/learning-goals"), adminApi.list("/skills")
      ]);
      setPrograms(pRes.data.data || []);
      setPaths(lpRes.data.data || []);
      const all = (lRes.data.data || []) as Lesson[];
      all.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setLessons(all);
      setAllPathItems(piRes.data.data || []);
      setCategories(cRes.data.data || []);
      setGoals(gRes.data.data || []);
      setSkills(sRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!isReordering) setDraftPathItems(pathItems);
  }, [allPathItems, selectedPathId, isReordering]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const filteredPaths = selectedProgramId ? paths.filter((p) => p.programId === selectedProgramId) : paths;
  const pathItems = allPathItems
    .filter((pi) => pi.pathId === selectedPathId)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const visiblePathItems = isReordering ? draftPathItems : pathItems;

  const usedLessonIds = new Set(pathItems.map((pi) => pi.lessonId));
  const lessonTypes = Array.from(new Set(lessons.map((l) => l.lessonType || l.type).filter(Boolean))).sort();
  const availableLessons = lessons.filter((l) => {
    const query = lessonSearch.trim().toLowerCase();
    const matchesSearch = !query || [l.title, l.description, ...(l.skillTags || []), ...(l.difficultyCategories || []), ...(l.learningGoals || [])]
      .some((value) => `${value || ""}`.toLowerCase().includes(query));
    const matchesType = !lessonTypeFilter || (l.lessonType || l.type) === lessonTypeFilter;
    const matchesAccess = !accessFilter || (l.accessType || "FREE") === accessFilter;
    return !usedLessonIds.has(l.id) && matchesSearch && matchesType && matchesAccess;
  });

  const getLesson = (id: string) => lessons.find((l) => l.id === id);
  const selectedPath = paths.find((p) => p.id === selectedPathId);
  const categoryLabel = (key: string) => categories.find((item) => item.key === key)?.label || key;
  const goalLabel = (key: string) => goals.find((item) => item.key === key)?.label || key;
  const skillLabel = (key: string) => skills.find((item) => item.key === key)?.label || key;
  const labelsFor = (keys: string[] | undefined, lookup: (key: string) => string) =>
    keys?.length ? keys.map(lookup).join(", ") : "—";

  const handleAddLesson = async () => {
    if (!addLessonId || !selectedPathId) return;
    const nextSeq = pathItems.length > 0 ? Math.max(...pathItems.map((pi) => pi.sequence ?? 0)) + 1 : 1;
    await adminApi.create("/path-items", {
      pathId: selectedPathId,
      lessonId: addLessonId,
      sequence: nextSeq,
      unlockRule: "ALWAYS_OPEN",
      prerequisiteLessonIds: [],
      requiredCompletion: true
    });
    setAddLessonId("");
    setLessonSearch("");
    showToast("Đã thêm bài học vào lộ trình!");
    loadData();
  };

  const handleRemoveItem = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn gỡ bài học khỏi lộ trình?")) return;
    await adminApi.remove("/path-items", id);
    showToast("Đã gỡ!"); loadData();
  };

  const moveItem = async (pi: PathItem, direction: "up" | "down") => {
    const idx = pathItems.indexOf(pi);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pathItems.length) return;
    const other = pathItems[swapIdx];
    await Promise.all([
      adminApi.update("/path-items", pi.id, { sequence: other.sequence }),
      adminApi.update("/path-items", other.id, { sequence: pi.sequence })
    ]);
    loadData();
  };

  const startEditItem = (pi: PathItem) => {
    setEditingItemId(pi.id);
    setEditUnlockRule(pi.unlockRule || "ALWAYS_OPEN");
    setEditReqCompletion(pi.requiredCompletion !== false);
    setEditPrereqs(pi.prerequisiteLessonIds || []);
  };

  const saveEditItem = async () => {
    if (!editingItemId) return;
    await adminApi.update("/path-items", editingItemId, {
      unlockRule: editUnlockRule,
      requiredCompletion: editReqCompletion,
      prerequisiteLessonIds: editPrereqs
    });
    setEditingItemId(null);
    showToast("Đã cập nhật!"); loadData();
  };

  const startReorder = () => {
    setDraftPathItems(pathItems);
    setIsReordering(true);
  };

  const cancelReorder = () => {
    setDraftPathItems(pathItems);
    setDraggingPathItemId("");
    setIsReordering(false);
  };

  const reorderDraftPathItems = (fromId: string, toId: string) => {
    if (!fromId || fromId === toId) return;
    const fromIndex = draftPathItems.findIndex((item) => item.id === fromId);
    const toIndex = draftPathItems.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...draftPathItems];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDraftPathItems(next);
  };

  const savePathOrder = async () => {
    await Promise.all(draftPathItems.map((item, index) => (
      adminApi.update("/path-items", item.id, { sequence: index + 1 })
    )));
    setIsReordering(false);
    setDraggingPathItemId("");
    showToast("Đã lưu thứ tự bài học.");
    loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Sắp xếp bài học vào lộ trình</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Chọn lộ trình và sắp xếp thứ tự bài học trẻ sẽ học.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "end" }}>
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
          <label>Chương trình</label>
          <select value={selectedProgramId} onChange={(e) => { setSelectedProgramId(e.target.value); setSelectedPathId(""); }}>
            <option value="">-- Tất cả --</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
          <label>Lộ trình</label>
          <select value={selectedPathId} onChange={(e) => setSelectedPathId(e.target.value)}>
            <option value="">-- Chọn lộ trình --</option>
            {filteredPaths.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : !selectedPathId ? (
        <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗺️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa chọn lộ trình</h3>
          <p style={{ color: "var(--text-muted)", margin: "0", fontSize: "14px" }}>
            Vui lòng chọn một chương trình và lộ trình học cụ thể ở menu trên để bắt đầu cấu hình.
          </p>
        </div>
      ) : (
        <>
          {/* Path info */}
          {selectedPath && (
            <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{selectedPath.title}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>{uiLabel(selectedPath.status || "DRAFT")} • {pathItems.length} bài học</span>
                </div>
                {pathItems.length > 1 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {!isReordering ? (
                      <button className="secondary" onClick={startReorder}>Sắp xếp thứ tự</button>
                    ) : (
                      <>
                        <button className="secondary" onClick={cancelReorder}>Hủy sắp xếp</button>
                        <button onClick={savePathOrder}>Lưu thứ tự</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add lesson */}
          <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Tìm bài học</label>
                <input type="text" placeholder="Tìm theo tên, mục tiêu, kỹ năng..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Loại bài học</label>
                <select value={lessonTypeFilter} onChange={(e) => setLessonTypeFilter(e.target.value)}>
                  <option value="">Tất cả</option>
                  {lessonTypes.map((type) => <option key={type} value={type}>{uiLabel(type)}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Loại truy cập</label>
                <select value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)}>
                  <option value="">Tất cả</option>
                  <option value="FREE">Miễn phí</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "end" }}>
              <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                <label>Thêm bài học vào lộ trình</label>
                <select value={addLessonId} onChange={(e) => setAddLessonId(e.target.value)} disabled={isReordering}>
                  <option value="">-- Chọn bài học ({availableLessons.length}) --</option>
                  {availableLessons.map((l) => <option key={l.id} value={l.id}>{l.title} ({uiLabel(l.lessonType || l.type)} • {uiLabel(l.accessType || "FREE")})</option>)}
                </select>
                {addLessonId && (() => {
                  const lesson = getLesson(addLessonId);
                  if (!lesson) return null;
                  return (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
                      <span>Nhóm: {labelsFor(lesson.difficultyCategories as any, categoryLabel)}</span>
                      <span>Mục tiêu: {labelsFor(lesson.learningGoals as any, goalLabel)}</span>
                      <span>Kỹ năng: {labelsFor(lesson.skillTags, skillLabel)}</span>
                    </div>
                  );
                })()}
              </div>
              <button onClick={handleAddLesson} disabled={!addLessonId || isReordering}>➕ Thêm</button>
            </div>
          </div>

          {/* Path items list */}
          {pathItems.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🧩</div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Lộ trình này chưa có bài học nào</h3>
              <p style={{ color: "var(--text-muted)", margin: "0", fontSize: "14px" }}>
                Hãy chọn một bài học có sẵn ở mục trên và bấm <strong>Thêm</strong> để đưa vào lộ trình học tập của bé.
              </p>
            </div>
          ) : (
            <div>
              {visiblePathItems.map((pi, idx) => {
                const lesson = getLesson(pi.lessonId);
                const isEditing = editingItemId === pi.id;
                return (
                  <div
                    key={pi.id}
                    className={`path-item-card ${draggingPathItemId === pi.id ? "dragging" : ""}`}
                    style={{ flexWrap: "wrap" }}
                    draggable={isReordering}
                    onDragStart={(e) => {
                      setDraggingPathItemId(pi.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", pi.id);
                    }}
                    onDragOver={(e) => {
                      if (isReordering) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (!isReordering) return;
                      e.preventDefault();
                      reorderDraftPathItems(e.dataTransfer.getData("text/plain") || draggingPathItemId, pi.id);
                    }}
                    onDragEnd={() => setDraggingPathItemId("")}
                  >
                    <div className="path-item-seq">{idx + 1}</div>
                    <div className="path-item-info" style={{ flex: 1 }}>
                      <strong
                        onClick={() => lesson && setDetailLesson(lesson)}
                        style={{ cursor: lesson ? "pointer" : "default" }}
                      >
                        {lesson?.title || pi.lessonId}
                      </strong>
                      <small>
                        <span className="badge info" style={{ marginRight: "4px" }}>{uiLabel(lesson?.lessonType || lesson?.type)}</span>
                        <span className={`badge ${lesson?.accessType === "PREMIUM" ? "premium" : "free"}`} style={{ marginRight: "4px" }}>{uiLabel(lesson?.accessType || "FREE")}</span>
                        <span className="badge yellow" style={{ marginRight: "4px" }}>{UNLOCK_LABELS[pi.unlockRule] || pi.unlockRule}</span>
                        {pi.requiredCompletion && <span className="badge green">Bắt buộc</span>}
                      </small>
                      {lesson && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
                          <span>Nhóm: {labelsFor(lesson.difficultyCategories as any, categoryLabel)}</span>
                          <span>Mục tiêu: {labelsFor(lesson.learningGoals as any, goalLabel)}</span>
                          <span>Kỹ năng: {labelsFor(lesson.skillTags, skillLabel)}</span>
                        </div>
                      )}
                    </div>
                    <div className="path-item-actions">
                      {isReordering ? (
                        <span className="badge info">Kéo thả</span>
                      ) : (
                        <>
                          <button className="secondary" onClick={() => lesson && setDetailLesson(lesson)}>Chi tiết</button>
                          <button className="secondary" onClick={() => isEditing ? saveEditItem() : startEditItem(pi)}>
                            {isEditing ? "💾 Lưu" : "⚙ Cấu hình"}
                          </button>
                          <button className="danger" onClick={() => handleRemoveItem(pi.id)}>Gỡ</button>
                        </>
                      )}
                    </div>

                    {isEditing && !isReordering && (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
                            <label style={{ fontSize: "12px" }}>Điều kiện mở khóa</label>
                            <select value={editUnlockRule} onChange={(e) => setEditUnlockRule(e.target.value as UnlockRule)} style={{ fontSize: "13px" }}>
                              {UNLOCK_RULES.map((r) => <option key={r} value={r}>{UNLOCK_LABELS[r]}</option>)}
                            </select>
                          </div>
                          <div className="field" style={{ marginBottom: 0 }}>
                            <ToggleSwitch id={`req-${pi.id}`} label="Bắt buộc hoàn thành" checked={editReqCompletion} onChange={setEditReqCompletion} />
                          </div>
                        </div>

                        {editUnlockRule === "PREVIOUS_COMPLETED" && (
                          <div style={{ width: "100%", marginTop: "8px" }}>
                            <MultiSelect
                              label="Bài học cần hoàn thành trước"
                              options={pathItems
                                .filter((item) => item.id !== pi.id)
                                .map((item) => {
                                  const l = getLesson(item.lessonId);
                                  return { value: item.lessonId, label: l?.title || item.lessonId };
                                })}
                              selected={editPrereqs}
                              onChange={setEditPrereqs}
                              placeholder="Chọn bài học tiên quyết..."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {pathItems.length > 0 && (
            <div className="panel" style={{ padding: "16px", marginTop: "16px" }}>
              <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "8px" }}>Tóm tắt lộ trình</h3>
              <div style={{ fontSize: "13px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <span>📚 {pathItems.length} bài học</span>
                <span>🔒 {pathItems.filter((pi) => pi.unlockRule === "PREMIUM_ONLY").length} premium</span>
                <span>✅ {pathItems.filter((pi) => pi.requiredCompletion).length} bắt buộc</span>
              </div>
            </div>
          )}
        </>
      )}

      {detailLesson && (
        <div className="modal-overlay" onClick={() => setDetailLesson(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(620px, 95vw)" }}>
            <div className="modal-header">
              <h2>Chi tiết bài học</h2>
              <button className="modal-close" onClick={() => setDetailLesson(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <strong style={{ fontSize: "18px" }}>{detailLesson.title}</strong>
                <p style={{ color: "var(--text-muted)", margin: "6px 0 0" }}>{detailLesson.description || "Không có mô tả."}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span className="badge info">{uiLabel(detailLesson.lessonType || detailLesson.type)}</span>
                <span className={`badge ${detailLesson.accessType === "PREMIUM" ? "premium" : "free"}`}>{uiLabel(detailLesson.accessType || "FREE")}</span>
                <span className="badge yellow">{uiLabel(detailLesson.publishStatus || "DRAFT")}</span>
                <span className="badge green">{detailLesson.estimatedMinutes || 0} phút</span>
              </div>
              <div className="panel" style={{ padding: "12px", margin: 0 }}>
                <div style={{ marginBottom: "8px" }}><strong>Nhóm khó khăn:</strong> {labelsFor(detailLesson.difficultyCategories as any, categoryLabel)}</div>
                <div style={{ marginBottom: "8px" }}><strong>Mục tiêu học tập:</strong> {labelsFor(detailLesson.learningGoals as any, goalLabel)}</div>
                <div><strong>Kỹ năng:</strong> {labelsFor(detailLesson.skillTags, skillLabel)}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setDetailLesson(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
