import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import { TableControls } from "../components/TableControls";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { CSVImportModal } from "../components/import/CSVImportModal";
import {
  developmentCategoriesImportConfig,
  learningGoalsImportConfig,
  skillsImportConfig
} from "../components/import/importConfigs";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { useTableControls } from "../utils/tableControls";

type Tab = "categories" | "goals" | "skills";

const skillDomainOptions = [
  { value: "COMMUNICATION", label: "Giao tiếp / ngôn ngữ" },
  { value: "COGNITIVE", label: "Nhận thức" },
  { value: "SOCIAL_EMOTIONAL", label: "Xã hội / cảm xúc" },
  { value: "PARENT_GUIDED", label: "Phụ huynh đồng hành" }
];

interface TaxItem {
  id: string;
  key: string;
  label: string;
  description?: string;
  parentDescription?: string;
  domain?: string;
  skillTags?: string[];
  isActive: boolean;
  orderIndex: number;
}

export function TaxonomyPage() {
  const [tab, setTab] = useState<Tab>("categories");
  const [items, setItems] = useState<TaxItem[]>([]);
  const [filtered, setFiltered] = useState<TaxItem[]>([]);
  const [skills, setSkills] = useState<TaxItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxItem | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [orderIndex, setOrderIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const collectionPath =
    tab === "categories" ? "/development-categories" :
    tab === "goals" ? "/learning-goals" : "/skills";

  const collectionName =
    tab === "categories" ? "developmentCategories" :
    tab === "goals" ? "learningGoals" : "skills";

  const tabTitle =
    tab === "categories" ? "Nhóm trẻ" :
    tab === "goals" ? "Mục tiêu học tập" : "Kỹ năng";

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list(collectionPath);
      const rows = (res.data.data || []) as TaxItem[];
      rows.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setItems(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [tab]);

  useEffect(() => {
    async function loadSkillsForGoals() {
      if (tab !== "goals") return;
      try {
        const res = await adminApi.list("/skills");
        const rows = (res.data.data || []) as TaxItem[];
        rows.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setSkills(rows);
      } catch (e) {
        console.error(e);
      }
    }
    loadSkillsForGoals();
  }, [tab]);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFiltered(items.filter((i) =>
        i.key.toLowerCase().includes(q) ||
        i.label.toLowerCase().includes(q) ||
        (i.description || i.parentDescription || "").toLowerCase().includes(q)
      ));
    } else {
      setFiltered(items);
    }
  }, [items, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };
  const table = useTableControls(filtered, [
    { value: "order", label: "Thứ tự", getValue: (item) => item.orderIndex },
    { value: "key", label: "Mã định danh", getValue: (item) => item.key },
    { value: "label", label: "Nhãn", getValue: (item) => item.label },
    { value: "domain", label: "Nhóm kỹ năng", getValue: (item) => item.domain },
    { value: "status", label: "Trạng thái", getValue: (item) => item.isActive !== false }
  ], "order");

  const openAddModal = () => {
    setEditingItem(null);
    setKey("");
    setLabel("");
    setDescription("");
    setDomain("");
    setSkillTags([]);
    setIsActive(true);
    setOrderIndex(items.length ? Math.max(...items.map((i) => i.orderIndex ?? 0)) + 1 : 1);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: TaxItem) => {
    setEditingItem(item);
    setKey(item.key || "");
    setLabel(item.label || "");
    setDescription(item.description || item.parentDescription || "");
    setDomain(item.domain || "");
    setSkillTags(item.skillTags || []);
    setIsActive(item.isActive !== false);
    setOrderIndex(item.orderIndex ?? 0);
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!key.trim()) errs.key = "Mã định danh không được để trống.";
    if (!label.trim()) errs.label = "Nhãn không được để trống.";
    if (!editingItem) {
      const existing = items.find((i) => i.key.toLowerCase() === key.trim().toLowerCase());
      if (existing) errs.key = "Mã định danh đã tồn tại.";
    }
    if (tab === "skills" && !domain.trim()) errs.domain = "Nhóm kỹ năng không được để trống.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: any = {
      key: key.trim(),
      label: label.trim(),
      isActive,
      orderIndex: Number(orderIndex)
    };

    if (tab === "categories") {
      payload.parentDescription = description.trim();
    } else if (tab === "goals") {
      payload.parentDescription = description.trim();
      payload.description = description.trim();
      payload.skillTags = skillTags;
    } else {
      payload.parentDescription = description.trim();
      payload.domain = domain.trim();
    }

    try {
      if (editingItem) {
        await adminApi.update(collectionPath, editingItem.id, payload);
        showToast("Cập nhật thành công!");
      } else {
        await adminApi.create(collectionPath, payload);
        showToast("Tạo mới thành công!");
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
    try {
      await adminApi.remove(collectionPath, id);
      showToast("Đã xóa thành công!");
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi xóa: " + (e.message || e));
    }
  };

  const getImportConfig = () => {
    if (tab === "categories") return developmentCategoriesImportConfig(items as any);
    if (tab === "goals") return learningGoalsImportConfig(items as any);
    return skillsImportConfig(items as any);
  };

  const handleImport = async (rows: any[]) => {
    await batchImport(collectionName, rows);
    showToast(`Import thành công ${rows.length} mục.`);
    await loadData();
  };

  const importConfig = getImportConfig();
  const skillOptions = skills
    .filter((skill) => skill.isActive !== false)
    .map((skill) => ({ value: skill.key, label: skill.label || skill.key }));

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Nhóm trẻ & mục tiêu học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Kiểm tra dữ liệu nền gồm nhóm trẻ, mục tiêu học và kỹ năng dùng để gắn vào chương trình, lộ trình và bài học.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => downloadExcelTemplate(toExcelTemplateFilename(importConfig.templateFilename), importConfig.templateHeaders, importConfig.templateExampleRows)}>Tải mẫu Excel</button>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</button>
          <button onClick={openAddModal}>➕ Thêm mới</button>
        </div>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${tab === "categories" ? "active" : ""}`} onClick={() => { setTab("categories"); setSearch(""); }}>Nhóm trẻ</button>
        <button className={`tab-btn ${tab === "goals" ? "active" : ""}`} onClick={() => { setTab("goals"); setSearch(""); }}>Mục tiêu học</button>
        <button className={`tab-btn ${tab === "skills" ? "active" : ""}`} onClick={() => { setTab("skills"); setSearch(""); }}>Kỹ năng</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <div className="validation-warnings" style={{ marginBottom: "12px" }}>
          Đây là dữ liệu nền của hệ thống. Thông thường admin chỉ cần kiểm tra, bật/tắt hoặc chỉnh nội dung hiển thị khi có yêu cầu.
        </div>
        <input
          type="text"
          placeholder={`Tìm kiếm ${tabTitle.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Không tìm thấy dữ liệu</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Chưa có {tabTitle.toLowerCase()} nào hoặc không khớp từ khóa tìm kiếm.
          </p>
          <button onClick={openAddModal}>➕ Thêm {tabTitle} ngay</button>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th>Mã định danh</th>
                <th>Nhãn</th>
                {tab === "skills" && <th>Nhóm kỹ năng</th>}
                {tab === "goals" && <th>Kỹ năng liên quan</th>}
                <th>Mô tả</th>
                <th style={{ width: "110px" }}>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                  <td><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>{item.key}</code></td>
                  <td style={{ fontWeight: "600" }}>{item.label}</td>
                  {tab === "skills" && <td><span className="badge info">{item.domain}</span></td>}
                  {tab === "goals" && <td style={{ fontSize: "12px" }}>{(item.skillTags || []).join(", ") || "—"}</td>}
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description || item.parentDescription || ""}</td>
                  <td>
                    <span className={`badge ${item.isActive ? "active" : "inactive"}`}>
                      {item.isActive ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </td>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? `Cập nhật ${tabTitle}` : `Thêm ${tabTitle}`}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Mã định danh <span style={{ color: "red" }}>*</span></label>
                  <input
                    type="text"
                    placeholder="VD: SPEECH_DELAY"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    disabled={!!editingItem}
                  />
                  {errors.key && <span className="error-msg">{errors.key}</span>}
                  {editingItem && <span className="helper">Mã định danh không thể thay đổi sau khi tạo.</span>}
                </div>

                <div className="field">
                  <label>Nhãn hiển thị <span style={{ color: "red" }}>*</span></label>
                  <input
                    type="text"
                    placeholder="VD: Chậm nói"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  {errors.label && <span className="error-msg">{errors.label}</span>}
                </div>

                <div className="field">
                  <label>Mô tả</label>
                  <textarea
                    placeholder="Mô tả dành cho phụ huynh..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {tab === "skills" && (
                  <div className="field">
                    <label>Nhóm kỹ năng <span style={{ color: "red" }}>*</span></label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    >
                      <option value="">Chọn nhóm kỹ năng...</option>
                      {skillDomainOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {errors.domain && <span className="error-msg">{errors.domain}</span>}
                  </div>
                )}

                {tab === "goals" && (
                  <MultiSelect
                    label="Kỹ năng liên quan"
                    options={skillOptions}
                    selected={skillTags}
                    onChange={setSkillTags}
                    placeholder="Chọn kỹ năng..."
                  />
                )}

                <div className="form-grid">
                  <div className="field">
                    <label>Thứ tự hiển thị</label>
                    <input
                      type="number"
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(Number(e.target.value))}
                    />
                  </div>
                  <div className="field" style={{ justifyContent: "end" }}>
                    <ToggleSwitch id="taxIsActive" label="Đang hoạt động" checked={isActive} onChange={setIsActive} />
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

      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        {...importConfig}
        onImport={handleImport}
        onRefresh={loadData}
      />

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
