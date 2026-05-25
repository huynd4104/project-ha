package com.projectha.media;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MediaRepository {
    private final JdbcTemplate jdbc;

    public MediaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> createPending(UUID ownerId, String key, String bucket, String fileName, String contentType, Long sizeBytes) {
        return Db.row(jdbc.queryForMap("""
            INSERT INTO media_files(owner_user_id, object_key, bucket, file_name, content_type, size_bytes, status)
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
            RETURNING *
            """, ownerId, key, bucket, fileName, contentType, sizeBytes));
    }

    public Map<String, Object> complete(UUID id, UUID ownerId, String publicUrl, Map<String, Object> metadata) {
        return Db.row(jdbc.queryForMap("""
            UPDATE media_files
            SET status = 'READY', public_url = ?, metadata = CAST(? AS jsonb)
            WHERE id = ? AND owner_user_id = ?
            RETURNING *
            """, publicUrl, Db.json(metadata), id, ownerId));
    }

    public Map<String, Object> byId(UUID id) {
        return jdbc.queryForList("SELECT * FROM media_files WHERE id = ?", id)
            .stream().findFirst().map(Db::row).orElseThrow(() -> new NotFoundException("Media không tồn tại."));
    }

    public void delete(UUID id, UUID userId) {
        jdbc.update("DELETE FROM media_files WHERE id = ? AND (owner_user_id = ? OR owner_user_id IS NULL)", id, userId);
    }
}
