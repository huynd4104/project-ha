package com.projectha.auth;

import com.projectha.common.Db;
import com.projectha.common.NotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserAccountRepository {
    private final JdbcTemplate jdbc;

    public UserAccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> findByEmail(String email) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM users WHERE lower(email) = lower(?)", email.trim());
        return rows.stream().findFirst().map(Db::row);
    }

    public Optional<Map<String, Object>> findById(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM users WHERE id = ?", id);
        return rows.stream().findFirst().map(Db::row);
    }

    public Map<String, Object> requireById(UUID id) {
        return findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng."));
    }

    public Map<String, Object> createParent(String fullName, String email, String passwordHash) {
        Map<String, Object> row = Db.row(jdbc.queryForMap("""
            INSERT INTO users(email, password_hash, full_name, role, is_active, email_verified)
            VALUES (?, ?, ?, 'PARENT', true, false)
            RETURNING *
            """, email.trim().toLowerCase(), passwordHash, fullName.trim()));
        assignRole(UUID.fromString((String) row.get("id")), "PARENT");
        return row;
    }

    public void assignRole(UUID userId, String role) {
        jdbc.update("""
            INSERT INTO user_roles(user_id, role_id)
            SELECT ?, id FROM roles WHERE name = ?
            ON CONFLICT DO NOTHING
            """, userId, role);
    }

    public void updatePassword(UUID userId, String passwordHash) {
        jdbc.update("UPDATE users SET password_hash = ?, updated_at = now() WHERE id = ?", passwordHash, userId);
    }

    public Map<String, Object> updateFullName(UUID userId, String fullName) {
        return Db.row(jdbc.queryForMap(
            "UPDATE users SET full_name = ?, updated_at = now() WHERE id = ? RETURNING *",
            fullName.trim(), userId
        ));
    }

    public void markEmailVerified(UUID userId) {
        jdbc.update("UPDATE users SET email_verified = true, updated_at = now() WHERE id = ?", userId);
    }

    public void storeRefreshToken(UUID userId, String tokenHash, Instant expiresAt) {
        jdbc.update(
            "INSERT INTO refresh_tokens(user_id, token_hash, expires_at) VALUES (?, ?, ?)",
            userId, tokenHash, expiresAt
        );
    }

    public Optional<Map<String, Object>> findActiveRefreshToken(String tokenHash) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
            SELECT rt.*, u.email, u.full_name, u.role, u.is_active, u.email_verified
            FROM refresh_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token_hash = ? AND rt.revoked_at IS NULL AND rt.expires_at > now()
            """, tokenHash);
        return rows.stream().findFirst().map(Db::row);
    }

    public void revokeRefreshToken(String tokenHash) {
        jdbc.update("UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = ? AND revoked_at IS NULL", tokenHash);
    }

    public void createVerificationCode(UUID userId, String code, Instant expiresAt) {
        jdbc.update("UPDATE email_verification_tokens SET used_at = now() WHERE user_id = ? AND used_at IS NULL", userId);
        jdbc.update(
            "INSERT INTO email_verification_tokens(user_id, code, expires_at) VALUES (?, ?, ?)",
            userId, code, expiresAt
        );
    }

    public boolean consumeVerificationCode(UUID userId, String code) {
        int updated = jdbc.update("""
            UPDATE email_verification_tokens
            SET used_at = now()
            WHERE user_id = ? AND code = ? AND used_at IS NULL AND expires_at > now()
            """, userId, code.trim());
        return updated > 0;
    }

    public void createPasswordResetCode(UUID userId, String code, Instant expiresAt) {
        jdbc.update("UPDATE password_reset_tokens SET used_at = now() WHERE user_id = ? AND used_at IS NULL", userId);
        jdbc.update(
            "INSERT INTO password_reset_tokens(user_id, code, expires_at) VALUES (?, ?, ?)",
            userId, code, expiresAt
        );
    }

    public boolean consumePasswordResetCode(UUID userId, String code) {
        int updated = jdbc.update("""
            UPDATE password_reset_tokens
            SET used_at = now()
            WHERE user_id = ? AND code = ? AND used_at IS NULL AND expires_at > now()
            """, userId, code.trim());
        return updated > 0;
    }
}
