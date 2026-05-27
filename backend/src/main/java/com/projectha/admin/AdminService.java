package com.projectha.admin;

import com.projectha.audit.AuditService;
import com.projectha.subscription.SubscriptionService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {
    private final AdminRepository repo;
    private final AuditService audit;
    private final SubscriptionService subscriptionService;
    private final com.projectha.media.MediaService mediaService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public AdminService(AdminRepository repo, AuditService audit, SubscriptionService subscriptionService, com.projectha.media.MediaService mediaService, org.springframework.jdbc.core.JdbcTemplate jdbc) {
        this.repo = repo;
        this.audit = audit;
        this.subscriptionService = subscriptionService;
        this.mediaService = mediaService;
        this.jdbc = jdbc;
    }

    public Map<String, Object> dashboard() {
        return repo.dashboard();
    }

    @Transactional
    public List<Map<String, Object>> createBatch(UUID actor, String resource, List<Map<String, Object>> payloads) {
        List<Map<String, Object>> results = new ArrayList<>();
        for (Map<String, Object> payload : payloads) {
            if ("nfc-tags".equals(resource)) {
                validateAndNormalizeNfcTag(payload, null);
            }
            Map<String, Object> item = repo.create(resource, payload);
            audit.log(actor, "CREATE_BATCH", resource, String.valueOf(item.get("id")), Map.of("payload", payload));
            results.add(item);
        }
        return results;
    }

    public List<Map<String, Object>> list(String resource) {
        int limit = "audit-logs".equals(resource) || "transactions".equals(resource) ? 200 : 5000;
        return repo.list(resource, limit);
    }

    public List<Map<String, Object>> listActivitiesByLesson(UUID lessonId) {
        return repo.listActivitiesByLesson(lessonId);
    }

    public Map<String, Object> byId(String resource, UUID id) {
        return repo.byId(resource, id);
    }

    public Map<String, Object> create(UUID actor, String resource, Map<String, Object> payload) {
        if ("nfc-tags".equals(resource)) {
            validateAndNormalizeNfcTag(payload, null);
        }
        Map<String, Object> item = repo.create(resource, payload);
        audit.log(actor, "CREATE", resource, String.valueOf(item.get("id")), Map.of("payload", payload));
        return item;
    }

    public Map<String, Object> update(UUID actor, String resource, UUID id, Map<String, Object> payload) {
        if ("nfc-tags".equals(resource)) {
            validateAndNormalizeNfcTag(payload, id);
        }
        Map<String, Object> item = repo.update(resource, id, payload);
        audit.log(actor, "UPDATE", resource, id.toString(), Map.of("payload", payload));
        return item;
    }

    private void validateAndNormalizeNfcTag(Map<String, Object> payload, UUID id) {
        String payloadValue = null;
        if (payload.containsKey("payloadValue")) {
            Object val = payload.get("payloadValue");
            payloadValue = val != null ? String.valueOf(val) : null;
        }
        
        String tagUid = null;
        if (payload.containsKey("tagUid")) {
            Object val = payload.get("tagUid");
            tagUid = val != null ? String.valueOf(val) : null;
        }

        if (payloadValue != null) {
            payloadValue = payloadValue.trim();
            payload.put("payloadValue", payloadValue);
        }

        if (payloadValue == null || payloadValue.isBlank()) {
            if (tagUid == null || tagUid.isBlank()) {
                throw new com.projectha.common.BadRequestException("Nội dung ghi vào thẻ (payload_value) không được để trống.");
            } else {
                System.out.println("WARN: Creating/updating legacy UID-only NFC tag without payload_value. tagUid: " + tagUid);
            }
        } else {
            payloadValue = payloadValue.toUpperCase();
            payload.put("payloadValue", payloadValue);
            if (!payloadValue.matches("^PHA_[A-Z0-9_]+$")) {
                throw new com.projectha.common.BadRequestException("Định dạng nội dung thẻ không hợp lệ. Phải bắt đầu bằng 'PHA_' và chỉ chứa chữ in hoa, số và dấu gạch dưới.");
            }

            List<Map<String, Object>> existing;
            if (id != null) {
                existing = jdbc.queryForList("SELECT id FROM nfc_tags WHERE payload_value = ? AND id != ?", payloadValue, id);
            } else {
                existing = jdbc.queryForList("SELECT id FROM nfc_tags WHERE payload_value = ?", payloadValue);
            }
            if (!existing.isEmpty()) {
                throw new com.projectha.common.BadRequestException("Nội dung ghi vào thẻ (payload_value) '" + payloadValue + "' đã tồn tại.");
            }
        }

        // Auto-fill displayName if empty or not provided
        String displayName = null;
        if (payload.containsKey("displayName")) {
            Object val = payload.get("displayName");
            displayName = val != null ? String.valueOf(val).trim() : null;
        }
        if (displayName == null || displayName.isEmpty()) {
            String spokenText = null;
            if (payload.containsKey("spokenText")) {
                Object val = payload.get("spokenText");
                spokenText = val != null ? String.valueOf(val).trim() : null;
            }
            if (spokenText != null && !spokenText.isEmpty()) {
                payload.put("displayName", spokenText);
            } else {
                payload.put("displayName", payloadValue);
            }
        }
    }

    public void delete(UUID actor, String resource, UUID id) {
        if ("media-files".equals(resource)) {
            mediaService.delete(id, actor);
        } else if ("media-assets".equals(resource)) {
            try {
                Map<String, Object> asset = repo.byId(resource, id);
                String url = String.valueOf(asset.get("url"));
                if (url != null && !url.isBlank()) {
                    // Try to find if this URL belongs to a media_files record by matching public_url
                    List<Map<String, Object>> files = repo.list("media-files", 1000);
                    for (Map<String, Object> file : files) {
                        if (url.equals(file.get("publicUrl"))) {
                            UUID fileId = UUID.fromString(String.valueOf(file.get("id")));
                            mediaService.delete(fileId, actor);
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Lỗi khi xóa file đính kèm R2 của media-asset: " + e.getMessage());
            }
            repo.delete(resource, id);
        } else {
            repo.delete(resource, id);
        }
        audit.log(actor, "DELETE", resource, id.toString(), Map.of());
    }
}
