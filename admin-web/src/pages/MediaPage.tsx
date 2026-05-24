import { useEffect, useState } from "react";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { mediaAssetsImportConfig } from "../components/import/importConfigs";
import { batchImport } from "../services/batchImportService";
import { mediaService, MediaAsset } from "../services/mediaService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";

function isTikTokUrl(url: string) {
  return /(^|\.)tiktok\.com\//i.test(url);
}

function isDirectVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
}

function VideoPreview({ asset, onPreview }: { asset: MediaAsset; onPreview: () => void }) {
  const canPlayInline = isDirectVideoUrl(asset.url);
  const helperText = canPlayInline
    ? "Mở khung xem lớn để phát video."
    : isTikTokUrl(asset.url)
      ? ""
      : "Link này không phải file video trực tiếp.";

  return (
    <div className="media-external-preview">
      {asset.thumbnailUrl ? (
        <img src={asset.thumbnailUrl} alt={asset.name} />
      ) : (
        <span className="media-external-icon">🎥</span>
      )}
      <button type="button" className="secondary media-preview-button" onClick={onPreview}>
        Xem trước
      </button>
      {helperText && <small>{helperText}</small>}
    </div>
  );
}

function VideoReviewModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const directVideo = isDirectVideoUrl(asset.url);
  const tiktok = isTikTokUrl(asset.url);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content media-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{asset.name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body media-review-body">
          {directVideo ? (
            <video src={asset.url} controls className="media-review-video" poster={asset.thumbnailUrl} />
          ) : (
            <div className="media-review-unavailable">
              {asset.thumbnailUrl ? (
                <img src={asset.thumbnailUrl} alt={asset.name} />
              ) : (
                <span className="media-external-icon">🎥</span>
              )}
              <p>
                {tiktok
                  ? "TikTok không cho phát ổn định trong khung review của admin. Hãy mở link gốc để xem video."
                  : "URL này không phải file video trực tiếp nên không thể phát trong admin."}
              </p>
              <a className="button-link" href={asset.url} target="_blank" rel="noreferrer">Mở video gốc</a>
              <small>Muốn phát trực tiếp trong admin, hãy lưu URL file video .mp4/.webm/.ogg.</small>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <a className="button-link secondary" href={asset.url} target="_blank" rel="noreferrer">Mở link gốc</a>
          <button onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

export function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filtered, setFiltered] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [reviewAsset, setReviewAsset] = useState<MediaAsset | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [assetCategory, setAssetCategory] = useState<MediaAsset["category"]>("NPC");
  const [assetType, setAssetType] = useState<MediaAsset["type"]>("IMAGE");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [formError, setFormError] = useState("");

  async function loadAssets() {
    setLoading(true);
    try {
      const data = await mediaService.list();
      setAssets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    let list = assets;
    if (category !== "ALL") {
      list = list.filter((a) => a.category === category);
    }
    if (type !== "ALL") {
      list = list.filter((a) => a.type === type);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [assets, category, type, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    showToast("Đã copy link media vào clipboard!");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa asset này khỏi thư viện?")) return;
    await mediaService.remove(id);
    showToast("Xóa media asset thành công!");
    loadAssets();
  };

  const handleSeed = async () => {
    setLoading(true);
    await mediaService.seedPresets();
    showToast("Đã seed các assets mẫu thành công!");
    loadAssets();
  };

  const resetForm = () => {
    setEditingAsset(null);
    setName("");
    setAssetCategory("NPC");
    setAssetType("IMAGE");
    setUrl("");
    setThumbnailUrl("");
    setFormError("");
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setName(asset.name || "");
    setAssetCategory(asset.category || "NPC");
    setAssetType(asset.type || "IMAGE");
    setUrl(asset.url || "");
    setThumbnailUrl(asset.thumbnailUrl || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) {
      setFormError("Vui lòng điền Tên và URL.");
      return;
    }
    setFormError("");
    const payload = {
      name,
      category: assetCategory,
      type: assetType,
      url,
      thumbnailUrl: thumbnailUrl || undefined
    };
    if (editingAsset) {
      await mediaService.update(editingAsset.id, payload);
      showToast("Cập nhật media asset thành công!");
    } else {
      await mediaService.create(payload);
      showToast("Thêm media asset thành công!");
    }
    closeModal();
    loadAssets();
  };

  const importConfig = mediaAssetsImportConfig();

  const handleImport = async (rows: any[]) => {
    await batchImport("mediaAssets", rows);
    showToast(`Import CSV thành công ${rows.length} media asset.`);
    await loadAssets();
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Thư viện Media</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          {assets.length === 0 && (
            <button onClick={handleSeed} className="secondary">🌱 Seed Media Mẫu</button>
          )}
          <button className="secondary" onClick={() => downloadExcelTemplate(toExcelTemplateFilename(importConfig.templateFilename), importConfig.templateHeaders, importConfig.templateExampleRows)}>Download Template</button>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</button>
          <button onClick={openAddModal}>➕ Thêm Media</button>
        </div>
      </div>

      <div className="panel" style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc link..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "auto" }}>
          <option value="ALL">Tất cả danh mục</option>
          <option value="NPC">Mascot</option>
          <option value="FLASHCARD">Flashcard</option>
          <option value="DIALOGUE">Dialogue</option>
          <option value="BADGE">Badge</option>
          <option value="GENERAL">General</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "auto" }}>
          <option value="ALL">Tất cả định dạng</option>
          <option value="IMAGE">Hình ảnh</option>
          <option value="AUDIO">Âm thanh</option>
          <option value="VIDEO">Video</option>
        </select>
      </div>

      {loading ? (
        <p>Đang tải dữ liệu thư viện...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>Thư viện chưa có media asset nào phù hợp hoặc đang trống.</p>
          {assets.length === 0 ? (
            <button onClick={handleSeed}>Tải trước thư viện mẫu (Presets)</button>
          ) : (
            <button className="secondary" onClick={() => { setSearch(""); setCategory("ALL"); setType("ALL"); }}>Hủy bộ lọc</button>
          )}
        </div>
      ) : (
        <div className="media-grid">
          {filtered.map((asset) => (
            <div key={asset.id} className="media-card">
              <div className="media-preview-container">
                {asset.type === "IMAGE" ? (
                  <img src={asset.url} alt={asset.name} />
                ) : asset.type === "AUDIO" ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%", padding: "12px" }}>
                    <span style={{ fontSize: "36px" }}>🎵</span>
                    <audio src={asset.url} controls style={{ width: "100%", maxHeight: "30px" }} />
                  </div>
                ) : (
                  <VideoPreview asset={asset} onPreview={() => setReviewAsset(asset)} />
                )}
              </div>
              <div className="media-info">
                <div>
                  <div className="media-title" title={asset.name}>{asset.name}</div>
                  <div className="media-meta">
                    <span className="badge blue" style={{ padding: "2px 6px", fontSize: "10px" }}>{asset.category}</span>
                    <span style={{ fontSize: "10px" }}>{asset.type}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  <button className="secondary" style={{ flex: 1, padding: "6px", fontSize: "11px" }} onClick={() => handleCopy(asset.url)}>Copy Link</button>
                  <button className="secondary" style={{ padding: "6px", fontSize: "11px" }} onClick={() => openEditModal(asset)}>Sửa</button>
                  <button className="danger" style={{ padding: "6px", fontSize: "11px" }} onClick={() => handleDelete(asset.id)}>Xóa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Asset Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAsset ? "Cập Nhật Media Asset" : "Thêm Media Asset Mới"}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <p className="error-msg" style={{ marginBottom: "12px", fontWeight: "bold" }}>{formError}</p>}
                
                <div className="field">
                  <label>Tên hiển thị *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mèo Mimi đang cười"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <span className="helper">Tên mô tả để dễ tìm kiếm lại sau này.</span>
                </div>

                <div className="form-grid" style={{ marginBottom: "16px" }}>
                  <div className="field">
                    <label>Danh mục *</label>
                    <select value={assetCategory} onChange={(e) => setAssetCategory(e.target.value as any)}>
                      <option value="NPC">Mascot</option>
                      <option value="FLASHCARD">Flashcard</option>
                      <option value="DIALOGUE">Dialogue</option>
                      <option value="BADGE">Badge</option>
                      <option value="GENERAL">General</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Loại tệp tin *</label>
                    <select value={assetType} onChange={(e) => setAssetType(e.target.value as any)}>
                      <option value="IMAGE">Hình ảnh</option>
                      <option value="AUDIO">Âm thanh</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Đường dẫn tệp tin (URL) *</label>
                  <input
                    type="text"
                    placeholder="Nhập đường dẫn http hoặc public/media/... của file"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <span className="helper">Link ảnh/audio/video đầy đủ. Ví dụ: https://images.unsplash.com/photo-... hoặc /media/npcs/mimi.png</span>
                  {assetType === "VIDEO" && (
                    <span className="helper">Video phát trực tiếp trong admin cần URL file .mp4/.webm/.ogg. Link TikTok chỉ được lưu để mở xem ở tab gốc.</span>
                  )}
                </div>

                <div className="field">
                  <label>Đường dẫn thumbnail (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Không bắt buộc"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={closeModal}>Hủy</button>
                <button type="submit">{editingAsset ? "Cập Nhật" : "Lưu lại"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewAsset && (
        <VideoReviewModal asset={reviewAsset} onClose={() => setReviewAsset(null)} />
      )}

      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        {...importConfig}
        onImport={handleImport}
        onRefresh={loadAssets}
      />

      {/* Toast Alert */}
      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
