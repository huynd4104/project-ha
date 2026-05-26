import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { MultiSelect } from "../components/MultiSelect";
import { MediaPicker } from "../components/MediaPicker";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { npcsImportConfig } from "../components/import/importConfigs";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { uiLabel } from "../utils/adminLabels";
import { useTableControls } from "../utils/tableControls";
import type { DialogueTemplates } from "../types/firebaseModels";
const SPEECH_FIELDS: { key: keyof DialogueTemplates; label: string; placeholder: string }[] = [
  { key: "welcome", label: "Chào mừng", placeholder: "Xin chào bé! Hôm nay mình học gì nhỉ?" },
  { key: "beforeActivity", label: "Trước hoạt động", placeholder: "Mình cùng bắt đầu nào!" },
  { key: "correct", label: "Trả lời đúng", placeholder: "Giỏi lắm! Đúng rồi!" },
  { key: "wrong", label: "Trả lời sai", placeholder: "Thử lại nhé, bé cố lên!" },
  { key: "lessonComplete", label: "Hoàn thành bài", placeholder: "Tuyệt vời! Bé đã hoàn thành bài học!" },
  { key: "encouragement", label: "Khích lệ", placeholder: "Bé làm tốt lắm, tiếp tục nha!" }
];

interface NPCItem {
  id: string; name: string; description: string; imageUrl: string;
  animationUrl?: string; defaultDialogue?: string; isActive: boolean;
  role?: string; personality?: string; skillTags?: string[];
  programIds?: string[]; pathIds?: string[];
  dialogueTemplates?: DialogueTemplates;
}

export function NPCsPageV2() {
  const [items, setItems] = useState<NPCItem[]>([]);
  const [filtered, setFiltered] = useState<NPCItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<NPCItem | null>(null);
  const [previewItem, setPreviewItem] = useState<NPCItem | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [animationUrl, setAnimationUrl] = useState("");
  const [defaultDialogue, setDefaultDialogue] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Advanced fields
  const [role, setRole] = useState("");
  const [personality, setPersonality] = useState("");
  const [npcSkillTags, setNpcSkillTags] = useState<string[]>([]);
  const [npcProgramIds, setNpcProgramIds] = useState<string[]>([]);
  const [npcPathIds, setNpcPathIds] = useState<string[]>([]);
  const [dialogueTemplates, setDialogueTemplates] = useState<DialogueTemplates>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [nRes, sRes, pRes, lpRes] = await Promise.all([
        adminApi.list("/npcs"), adminApi.list("/skills"),
        adminApi.list("/programs"), adminApi.list("/learning-paths")
      ]);
      setItems(nRes.data.data || []);
      setSkills(sRes.data.data || []);
      setPrograms(pRes.data.data || []);
      setPaths(lpRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) : items);
  }, [items, search]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };
  const table = useTableControls(filtered, [
    { value: "name", label: "Tên", getValue: (item) => item.name },
    { value: "role", label: "Vai trò", getValue: (item) => item.role },
    { value: "status", label: "Trạng thái", getValue: (item) => item.isActive !== false }
  ], "name");

  const skillOptions = skills.filter((s: any) => s.isActive).map((s: any) => ({ value: s.key, label: s.label }));
  const programOptions = programs.map((p: any) => ({ value: p.id, label: p.title }));
  const pathOptions = paths.map((p: any) => ({ value: p.id, label: p.title }));

  const openAddModal = () => {
    setEditingItem(null); setName(""); setDescription(""); setImageUrl("");
    setAnimationUrl(""); setDefaultDialogue(""); setIsActive(true);
    setRole(""); setPersonality(""); setNpcSkillTags([]);
    setNpcProgramIds([]); setNpcPathIds([]);
    setDialogueTemplates({});
    setErrors({}); setShowAdvanced(false); setIsModalOpen(true);
  };

  const openEditModal = (item: NPCItem) => {
    setEditingItem(item); setName(item.name); setDescription(item.description);
    setImageUrl(item.imageUrl || ""); setAnimationUrl(item.animationUrl || "");
    setDefaultDialogue(item.defaultDialogue || ""); setIsActive(item.isActive !== false);
    setRole(item.role || ""); setPersonality(item.personality || "");
    setNpcSkillTags(item.skillTags || []); setNpcProgramIds(item.programIds || []);
    setNpcPathIds(item.pathIds || []);
    setDialogueTemplates(item.dialogueTemplates || {});
    setErrors({}); setShowAdvanced(!!(item.role || item.personality || item.skillTags?.length));
    setIsModalOpen(true);
  };

  const openPreviewModal = (item: NPCItem) => {
    setPreviewItem(item);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Tên nhân vật không được để trống.";
    if (!description.trim()) errs.description = "Mô tả không được để trống.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload: any = {
      name: name.trim(), description: description.trim(),
      imageUrl: imageUrl.trim(), animationUrl: animationUrl.trim() || null,
      defaultDialogue: defaultDialogue.trim() || null, isActive,
      role: role.trim() || null, personality: personality.trim() || null,
      skillTags: npcSkillTags, programIds: npcProgramIds, pathIds: npcPathIds,
      dialogueTemplates: Object.keys(dialogueTemplates).length ? dialogueTemplates : null
    };

    try {
      if (editingItem) await adminApi.update("/npcs", editingItem.id, payload);
      else await adminApi.create("/npcs", payload);
      setIsModalOpen(false);
      showToast(editingItem ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhân vật này?")) return;
    await adminApi.remove("/npcs", id); showToast("Đã xóa!"); loadData();
  };

  const updateDT = (key: keyof DialogueTemplates, value: string) => {
    setDialogueTemplates({ ...dialogueTemplates, [key]: value || undefined });
  };

  const getProgramNames = (ids?: string[]) => {
    if (!ids?.length) return "Chưa gắn";
    return ids.map((id) => programs.find((p: any) => p.id === id)?.title || id).join(", ");
  };

  const getPathNames = (ids?: string[]) => {
    if (!ids?.length) return "Chưa gắn";
    return ids.map((id) => paths.find((p: any) => p.id === id)?.title || id).join(", ");
  };

  const getSkillNames = (keys?: string[]) => {
    if (!keys?.length) return "Chưa gắn";
    return keys.map((key) => skills.find((s: any) => s.key === key)?.label || key).join(", ");
  };

  const importConfig = npcsImportConfig(items as any);
  const handleImport = async (rows: any[]) => {
    await batchImport("npcs", rows);
    showToast(`Import thành công ${rows.length} nhân vật.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Mascot</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Quản lý nhân vật hướng dẫn, động viên và phản hồi trong quá trình học.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import</button>
          <button onClick={openAddModal}>➕ Thêm nhân vật</button>
        </div>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input type="text" placeholder="Tìm kiếm nhân vật..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🐾</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có Mascot nào</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Mascot sẽ hướng dẫn, động viên và phản hồi trong quá trình trẻ học.
          </p>
          <button onClick={openAddModal}>➕ Thêm nhân vật mới</button>
        </div>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Ảnh</th>
                  <th>Tên</th>
                  <th>Mô tả</th>
                  <th>Vai trò</th>
                  <th style={{ width: "110px" }}>Trạng thái</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }} />
                        : <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#e2e8f0", display: "grid", placeItems: "center", fontSize: "18px" }}>🐾</div>}
                    </td>
                    <td style={{ fontWeight: "600" }}>{item.name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description?.slice(0, 60)}{(item.description?.length || 0) > 60 ? "..." : ""}</td>
                    <td style={{ fontSize: "12px" }}>{item.role || "—"}</td>
                    <td><span className={`badge ${item.isActive ? "active" : "inactive"}`}>{item.isActive ? "Đang bật" : "Đang tắt"}</span></td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => openPreviewModal(item)}>Xem trước</button>
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

      {previewItem && (
        <div className="modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 95vw)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.2)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, #f8fafc, #ffffff)", padding: "20px 24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✨</span> Thông tin nhân vật
              </h2>
              <button className="modal-close" onClick={() => setPreviewItem(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: "24px", background: "#ffffff" }}>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "24px", alignItems: "start" }}>
                {/* Left Card */}
                <div style={{
                  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "20px 16px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}>
                  <div style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
                    border: "3px solid #ffffff",
                    marginBottom: "12px"
                  }}>
                    {previewItem.imageUrl ? (
                      <img src={previewItem.imageUrl} alt={previewItem.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "44px" }}>🐾</span>
                    )}
                  </div>
                  <strong style={{ display: "block", fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>{previewItem.name}</strong>
                  {previewItem.role && (
                    <span style={{
                      color: "var(--primary)",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "rgba(37, 99, 235, 0.08)",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      marginBottom: "16px"
                    }}>{previewItem.role}</span>
                  )}

                </div>

                {/* Right Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Speech Bubble for Default Dialogue */}
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <div style={{
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      border: "1px solid rgba(37, 99, 235, 0.15)",
                      borderRadius: "16px",
                      padding: "14px 18px",
                      fontSize: "14px",
                      color: "#1e3a8a",
                      fontWeight: "500",
                      lineHeight: "1.5",
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.04)"
                    }}>
                      <span style={{ marginRight: "6px", fontSize: "16px" }}>💬</span>
                      {previewItem.defaultDialogue || "Chưa thiết lập lời thoại mặc định cho bé."}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 16px", border: "1px solid var(--border)" }}>
                    <label style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>📝 Mô tả</label>
                    <p style={{ margin: 0, color: "var(--text-main)", fontSize: "14px", lineHeight: "1.6" }}>{previewItem.description || "Chưa có mô tả"}</p>
                  </div>

                  {/* Personality */}
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 16px", border: "1px solid var(--border)" }}>
                    <label style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>🧠 Tính cách</label>
                    <p style={{ margin: 0, color: "var(--text-main)", fontSize: "14px", lineHeight: "1.6" }}>{previewItem.personality || "Chưa khai báo tính cách"}</p>
                  </div>

                  {/* Skill tags */}
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 16px", border: "1px solid var(--border)" }}>
                    <label style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>🧩 Kỹ năng liên quan</label>
                    {previewItem.skillTags && previewItem.skillTags.length > 0 ? (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {previewItem.skillTags.map((tag: string) => {
                          const skillLabel = skills.find((s: any) => s.key === tag)?.label || tag;
                          return (
                            <span key={tag} style={{ background: "#ffffff", border: "1px solid var(--border)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", color: "var(--text-main)", fontWeight: "500" }}>
                              {skillLabel}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>Chưa gắn kỹ năng</p>
                    )}
                  </div>

                  {/* Programs / Paths */}
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 16px", border: "1px solid var(--border)" }}>
                    <label style={{ fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>🎓 Chương trình & Lộ trình</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Chương trình:</span>
                        {previewItem.programIds && previewItem.programIds.length > 0 ? (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {previewItem.programIds.map((id: string) => {
                              const title = programs.find((p: any) => p.id === id)?.title || id;
                              return (
                                <span key={id} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", color: "#1e40af", fontWeight: "500" }}>
                                  {title}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Chưa gắn chương trình</span>
                        )}
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Lộ trình học:</span>
                        {previewItem.pathIds && previewItem.pathIds.length > 0 ? (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {previewItem.pathIds.map((id: string) => {
                              const title = paths.find((p: any) => p.id === id)?.title || id;
                              return (
                                <span key={id} style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", color: "#065f46", fontWeight: "500" }}>
                                  {title}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Chưa gắn lộ trình</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ background: "#f8fafc", padding: "16px 24px", borderTop: "1px solid var(--border)" }}>
              <button type="button" className="secondary" onClick={() => setPreviewItem(null)} style={{ padding: "8px 20px" }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(780px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa nhân vật" : "Thêm nhân vật mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="field">
                      <label>Tên nhân vật <span style={{ color: "red" }}>*</span></label>
                      <input type="text" placeholder="VD: Mèo Mimi" value={name} onChange={(e) => setName(e.target.value)} />
                      {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>

                    <div className="field">
                      <label>Mô tả <span style={{ color: "red" }}>*</span></label>
                      <textarea placeholder="Bạn mèo thân thiện, hay giúp đỡ..." value={description} onChange={(e) => setDescription(e.target.value)} />
                      {errors.description && <span className="error-msg">{errors.description}</span>}
                    </div>

                    <div className="field">
                      <label>Hình ảnh nhân vật</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="text" placeholder="URL hình ảnh" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flex: 1 }} />
                        <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                      </div>
                    </div>

                    <div className="field">
                      <label>Đường dẫn hoạt ảnh</label>
                      <input type="text" placeholder="URL hoạt ảnh (Lottie, GIF...)" value={animationUrl} onChange={(e) => setAnimationUrl(e.target.value)} />
                    </div>

                    <div className="field">
                      <label>Lời thoại mặc định</label>
                      <input type="text" placeholder="Xin chào bé!" value={defaultDialogue} onChange={(e) => setDefaultDialogue(e.target.value)} />
                    </div>

                    <div className="field">
                      <ToggleSwitch id="npcIsActive" label="Đang bật" checked={isActive} onChange={setIsActive} />
                    </div>

                    {/* Advanced section */}
                    <div className="collapsible-header" onClick={() => setShowAdvanced(!showAdvanced)}>
                      <h3>🧩 Vai trò nâng cao</h3>
                      <span style={{ fontSize: "18px" }}>{showAdvanced ? "▾" : "▸"}</span>
                    </div>

                    {showAdvanced && (
                      <div className="collapsible-body">
                        <div className="field">
                          <label>Vai trò</label>
                          <input type="text" placeholder="VD: Hướng dẫn viên nghe hiểu" value={role} onChange={(e) => setRole(e.target.value)} />
                        </div>
                        <div className="field">
                          <label>Tính cách</label>
                          <textarea placeholder="VD: Nhẹ nhàng, kiên nhẫn, hay khen ngợi" value={personality} onChange={(e) => setPersonality(e.target.value)} />
                        </div>
                        <MultiSelect label="Kỹ năng liên quan" options={skillOptions} selected={npcSkillTags} onChange={setNpcSkillTags} />
                        <MultiSelect label="Chương trình" options={programOptions} selected={npcProgramIds} onChange={setNpcProgramIds} />
                        <MultiSelect label="Lộ trình" options={pathOptions} selected={npcPathIds} onChange={setNpcPathIds} />


                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "8px" }}>
                          <label style={{ fontWeight: "600", fontSize: "14px", marginBottom: "8px", display: "block" }}>Mẫu câu thoại</label>
                          {SPEECH_FIELDS.map((df) => (
                            <div className="field" key={df.key}>
                              <label style={{ fontSize: "12px" }}>{df.label}</label>
                              <input type="text" placeholder={df.placeholder} value={dialogueTemplates[df.key] || ""} onChange={(e) => updateDT(df.key, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  <div className="drawer-aside" style={{ width: "220px" }}>
                    <h3>Xem trước</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", marginTop: "12px", background: "white", textAlign: "center", padding: "16px" }}>
                      <div style={{ width: "80px", height: "80px", margin: "0 auto 12px", borderRadius: "40px", background: "#f8fafc", display: "grid", placeItems: "center", overflow: "hidden" }}>
                        {imageUrl ? <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: "36px" }}>🐾</span>}
                      </div>
                      <strong style={{ fontSize: "14px" }}>{name || "Tên nhân vật"}</strong>
                      {role && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{role}</p>}
                      {defaultDialogue && (
                        <div style={{ marginTop: "8px", padding: "8px 12px", background: "#f0f9ff", borderRadius: "12px", fontSize: "12px", color: "var(--primary)", position: "relative" }}>
                          💬 {defaultDialogue}
                        </div>
                      )}
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

      {showMediaPicker && <MediaPicker type="IMAGE" currentValue={imageUrl} onSelect={(url) => setImageUrl(url)} onClose={() => setShowMediaPicker(false)} />}

      <CSVImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} {...importConfig} onImport={handleImport} onRefresh={loadData} />

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
