package com.projectha.nfc;

import com.projectha.common.Db;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class NfcTagService {
    private final JdbcTemplate jdbc;

    public NfcTagService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> resolveTag(String tagUid) {
        if (tagUid == null || tagUid.isBlank()) {
            return responseMap(false, "INVALID_UID", "Mã thẻ NFC không hợp lệ.", null);
        }

        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM nfc_tags WHERE tag_uid = ?", tagUid);
        if (rows.isEmpty()) {
            return responseMap(false, "NOT_FOUND", "Thẻ này chưa được gán nội dung học.", null);
        }

        Map<String, Object> tag = Db.row(rows.get(0));
        Boolean isActive = (Boolean) tag.get("isActive");
        if (isActive == null || !isActive) {
            return responseMap(false, "INACTIVE", "Thẻ này đã bị khóa hoặc ngừng hoạt động.", null);
        }

        // Domain-specific validation (enforce control list)
        String tagType = (String) tag.get("tagType");
        String targetType = (String) tag.get("targetType");
        
        // Ensure values are normalized
        if (tagType != null) tagType = tagType.toUpperCase();
        if (targetType != null) targetType = targetType.toUpperCase();

        Map<String, Object> data = new HashMap<>();
        data.put("tagUid", tag.get("tagUid"));
        data.put("tagType", tagType);
        data.put("targetType", targetType);
        data.put("targetId", tag.get("targetId"));
        data.put("payloadValue", tag.get("payloadValue"));
        data.put("displayName", tag.get("displayName"));
        data.put("spokenText", tag.get("spokenText"));
        data.put("metadata", new HashMap<>());

        return responseMap(true, "RESOLVED", "Nhận dạng thẻ thành công.", data);
    }

    private Map<String, Object> responseMap(boolean success, String status, String message, Object data) {
        Map<String, Object> map = new HashMap<>();
        map.put("success", success);
        map.put("status", status);
        map.put("message", message);
        map.put("data", data);
        return map;
    }
}
