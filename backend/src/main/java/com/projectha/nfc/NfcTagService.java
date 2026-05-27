package com.projectha.nfc;

import com.projectha.common.Db;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class NfcTagService {
    private final JdbcTemplate jdbc;

    public NfcTagService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> resolveTag(String tagUid) {
        return resolveTag(null, tagUid);
    }

    public Map<String, Object> resolveTag(String payload, String tagUid) {
        List<Map<String, Object>> rows = null;
        if (payload != null && !payload.isBlank()) {
            rows = jdbc.queryForList("SELECT * FROM nfc_tags WHERE payload_value = ?", payload);
        }

        if ((rows == null || rows.isEmpty()) && tagUid != null && !tagUid.isBlank()) {
            rows = jdbc.queryForList("SELECT * FROM nfc_tags WHERE tag_uid = ?", tagUid);
        }

        if (rows == null || rows.isEmpty()) {
            return responseMap(false, "NOT_FOUND", "Thẻ này chưa được hỗ trợ.", null);
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
        data.put("description", tag.get("description"));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("tagId", tag.get("id"));
        metadata.put("tagType", tagType);
        metadata.put("targetType", targetType);
        putIfPresent(metadata, "targetId", tag.get("targetId"));
        putIfPresent(metadata, "payloadValue", tag.get("payloadValue"));
        putIfPresent(metadata, "displayName", tag.get("displayName"));
        putIfPresent(metadata, "description", tag.get("description"));

        if ("FLASHCARD".equals(tagType)) {
            enrichFlashcardMetadata(data, metadata, tag.get("targetId"));
        } else if ("PECS".equals(tagType)) {
            enrichPecsMetadata(metadata, tag.get("targetId"));
        }

        data.put("metadata", metadata);

        return responseMap(true, "RESOLVED", "Nhận dạng thẻ thành công.", data);
    }

    private void enrichFlashcardMetadata(Map<String, Object> data, Map<String, Object> metadata, Object targetId) {
        UUID flashcardId = parseUuid(targetId);
        if (flashcardId == null) {
            metadata.put("pauseMs", 1200);
            return;
        }

        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM flashcards WHERE id = ?", flashcardId);
        if (rows.isEmpty()) {
            metadata.put("pauseMs", 1200);
            return;
        }

        Map<String, Object> flashcard = Db.row(rows.get(0));
        String frontText = stringValue(flashcard.get("frontText"));
        String backText = stringValue(flashcard.get("backText"));
        String spokenText = buildFlashcardSpeech(frontText, backText);

        metadata.put("flashcardId", flashcard.get("id"));
        metadata.put("frontText", frontText);
        metadata.put("backText", backText);
        metadata.put("imageUrl", flashcard.get("imageUrl"));
        metadata.put("audioUrl", flashcard.get("audioUrl"));
        metadata.put("pauseMs", 1200);

        if (isBlank(data.get("spokenText"))) {
            data.put("spokenText", spokenText);
        }
        if (isBlank(data.get("displayName")) && !frontText.isBlank()) {
            data.put("displayName", "Flashcard: " + frontText);
        }
    }

    private void enrichPecsMetadata(Map<String, Object> metadata, Object targetId) {
        UUID pecsCardId = parseUuid(targetId);
        if (pecsCardId == null) return;

        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM pecs_cards WHERE id = ?", pecsCardId);
        if (rows.isEmpty()) return;

        Map<String, Object> pecs = Db.row(rows.get(0));
        metadata.put("pecsCardId", pecs.get("id"));
        metadata.put("category", pecs.get("category"));
        metadata.put("title", pecs.get("title"));
        metadata.put("imageUrl", pecs.get("imageUrl"));
        metadata.put("spokenText", pecs.get("spokenText"));
    }

    private UUID parseUuid(Object value) {
        if (value == null) return null;
        try {
            return UUID.fromString(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    private void putIfPresent(Map<String, Object> metadata, String key, Object value) {
        if (!isBlank(value)) {
            metadata.put(key, value);
        }
    }

    private boolean isBlank(Object value) {
        return value == null || String.valueOf(value).isBlank();
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String buildFlashcardSpeech(String frontText, String backText) {
        if (frontText.isBlank() && backText.isBlank()) return "";
        if (backText.isBlank()) return frontText;
        if (frontText.isBlank()) return backText;
        String frontSentence = frontText.endsWith(".") ? frontText : frontText + ".";
        return frontSentence + " ... " + backText;
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
