import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import type { Lesson, LearningPath, PathItem, Program, UnlockRule } from "../types/firebaseModels";

const UNLOCK_RULES: UnlockRule[] = ["ALWAYS_OPEN", "PREVIOUS_COMPLETED", "MANUAL_UNLOCK", "PREMIUM_ONLY"];
const UNLOCK_LABELS: Record<string, string> = {
  ALWAYS_OPEN: "Luôn mở", PREVIOUS_COMPLETED: "Hoàn thành bài trước",
  MANUAL_UNLOCK: "Mở khóa thủ công", PREMIUM_ONLY: "Chỉ Premium"
};

export function PathBuilderPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allPathItems, setAllPathItems] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedPathId, setSelectedPathId] = useState("");
  const [addLessonId, setAddLessonId] = useState("");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editUnlockRule, setEditUnlockRule] = useState<UnlockRule>("ALWAYS_OPEN");
  const [editReqCompletion, setEditReqCompletion] = useState(true);
  const [editPrereqs, setEditPrereqs] = useState<string[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, lpRes, lRes, piRes] = await Promise.all([
        adminApi.list("/programs"), adminApi.list("/learning-paths"),
        adminApi.list("/lessons"), adminApi.list("/path-items")
      ]);
      setPrograms(pRes.data.data || []);
      setPaths(lpRes.data.data || []);
      const all = (lRes.data.data || []) as Lesson[];
      all.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setLessons(all);
      setAllPathItems(piRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };

  const filteredPaths = selectedProgramId ? paths.filter((p) => p.programId === selectedProgramId) : paths;
  const pathItems = allPathItems
    .filter((pi) => pi.pathId === selectedPathId)
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  const usedLessonIds = new Set(pathItems.map((pi) => pi.lessonId));
  const availableLessons = lessons.filter((l) => !usedLessonIds.has(l.id));

  const getLesson = (id: string) => lessons.find((l) => l.id === id);
  const selectedPath = paths.find((p) => p.id === selectedPathId);

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

  return (
    <div>
      <div className="toolbar">
        <h1>Xây dựng lộ trình</h1>
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

      {loading ? <p>Đang tải...</p> : !selectedPathId ? (
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
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>{selectedPath.status || "DRAFT"} • {pathItems.length} bài học</span>
                </div>
              </div>
            </div>
          )}

          {/* Add lesson */}
          <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", alignItems: "end" }}>
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label>Thêm bài học vào lộ trình</label>
              <select value={addLessonId} onChange={(e) => setAddLessonId(e.target.value)}>
                <option value="">-- Chọn bài học --</option>
                {availableLessons.map((l) => <option key={l.id} value={l.id}>{l.title} ({l.lessonType || l.type})</option>)}
              </select>
            </div>
            <button onClick={handleAddLesson} disabled={!addLessonId}>➕ Thêm</button>
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
              {pathItems.map((pi, idx) => {
                const lesson = getLesson(pi.lessonId);
                const isEditing = editingItemId === pi.id;
                return (
                  <div key={pi.id} className="path-item-card" style={{ flexWrap: "wrap" }}>
                    <div className="path-item-seq">{idx + 1}</div>
                    <div className="path-item-info" style={{ flex: 1 }}>
                      <strong>{lesson?.title || pi.lessonId}</strong>
                      <small>
                        <span className="badge info" style={{ marginRight: "4px" }}>{lesson?.lessonType || lesson?.type || "—"}</span>
                        <span className="badge yellow" style={{ marginRight: "4px" }}>{UNLOCK_LABELS[pi.unlockRule] || pi.unlockRule}</span>
                        {pi.requiredCompletion && <span className="badge green">Bắt buộc</span>}
                      </small>
                    </div>
                    <div className="path-item-actions">
                      <button className="secondary" disabled={idx === 0} onClick={() => moveItem(pi, "up")}>↑</button>
                      <button className="secondary" disabled={idx === pathItems.length - 1} onClick={() => moveItem(pi, "down")}>↓</button>
                      <button className="secondary" onClick={() => isEditing ? saveEditItem() : startEditItem(pi)}>
                        {isEditing ? "💾 Lưu" : "⚙ Cấu hình"}
                      </button>
                      <button className="danger" onClick={() => handleRemoveItem(pi.id)}>Gỡ</button>
                    </div>

                    {isEditing && (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                          <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
                            <label style={{ fontSize: "12px" }}>Unlock Rule</label>
                            <select value={editUnlockRule} onChange={(e) => setEditUnlockRule(e.target.value as UnlockRule)} style={{ fontSize: "13px" }}>
                              {UNLOCK_RULES.map((r) => <option key={r} value={r}>{UNLOCK_LABELS[r]}</option>)}
                            </select>
                          </div>
                          <div className="field check-row" style={{ marginBottom: 0 }}>
                            <input type="checkbox" id={`req-${pi.id}`} checked={editReqCompletion} onChange={(e) => setEditReqCompletion(e.target.checked)} />
                            <label htmlFor={`req-${pi.id}`} style={{ fontWeight: "normal", cursor: "pointer", fontSize: "12px" }}>Bắt buộc hoàn thành</label>
                          </div>
                        </div>

                        {editUnlockRule === "PREVIOUS_COMPLETED" && (
                          <div style={{ width: "100%", marginTop: "8px" }}>
                            <MultiSelect
                              label="Bài học tiên quyết (Prerequisites)"
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

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
