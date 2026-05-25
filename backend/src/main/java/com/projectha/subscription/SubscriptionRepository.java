package com.projectha.subscription;

import com.projectha.common.Db;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SubscriptionRepository {
    private final JdbcTemplate jdbc;

    public SubscriptionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Map<String, Object>> current(UUID userId) {
        return jdbc.queryForList("""
            SELECT * FROM subscriptions
            WHERE user_id = ? AND status = 'ACTIVE'
            ORDER BY created_at DESC
            LIMIT 1
            """, userId).stream().findFirst().map(Db::row);
    }

    public Map<String, Object> create(UUID userId, String plan, String provider, Instant expiresAt, Map<String, Object> entitlements) {
        jdbc.update("UPDATE subscriptions SET status = 'CANCELED' WHERE user_id = ? AND status = 'ACTIVE'", userId);
        Map<String, Object> sub = Db.row(jdbc.queryForMap("""
            INSERT INTO subscriptions(user_id, plan, status, provider, expires_at, entitlement_flags)
            VALUES (?, ?, 'ACTIVE', ?, ?, CAST(? AS jsonb))
            RETURNING *
            """, userId, plan, provider, expiresAt, Db.json(entitlements)));
        jdbc.update("""
            UPDATE users SET subscription_summary = CAST(? AS jsonb)
            WHERE id = ?
            """, Db.json(summary(plan, "ACTIVE", expiresAt, entitlements)), userId);
        jdbc.update("""
            INSERT INTO transactions(user_id, provider, product_id, amount, currency, status)
            VALUES (?, ?, ?, 0, 'VND', 'SUCCESS')
            """, userId, provider, plan.equals("PREMIUM") ? "premium_demo_upgrade" : "trial_manual_grant");
        return sub;
    }

    public void cancel(UUID userId) {
        jdbc.update("UPDATE subscriptions SET status = 'CANCELED' WHERE user_id = ? AND status = 'ACTIVE'", userId);
        jdbc.update("UPDATE users SET subscription_summary = CAST(? AS jsonb) WHERE id = ?", Db.json(summary("FREE", "CANCELED", null, Map.of(
            "premiumContent", false,
            "voiceQuiz", false,
            "advancedReports", false,
            "premiumNpcs", false
        ))), userId);
    }

    public Map<String, Object> summary(String plan, String status, Instant expiresAt, Map<String, Object> entitlements) {
        return Map.of(
            "plan", plan,
            "status", status,
            "expiresAt", expiresAt == null ? "" : expiresAt.toString(),
            "entitlements", entitlements
        );
    }
}
