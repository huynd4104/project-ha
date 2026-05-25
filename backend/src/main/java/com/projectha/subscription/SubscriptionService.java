package com.projectha.subscription;

import com.projectha.common.ForbiddenException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubscriptionService {
    private final SubscriptionRepository repo;
    private final boolean demoEnabled;

    public SubscriptionService(SubscriptionRepository repo, @Value("${project-ha.features.demo-premium-upgrade}") boolean demoEnabled) {
        this.repo = repo;
        this.demoEnabled = demoEnabled;
    }

    public Map<String, Object> current(UUID userId) {
        return repo.current(userId).map(this::summaryFromSubscription).orElseGet(() -> repo.summary("FREE", "NONE", null, entitlements(false)));
    }

    @Transactional
    public Map<String, Object> demoUpgrade(UUID userId) {
        if (!demoEnabled) throw new ForbiddenException("Chức năng demo tự kích hoạt premium hiện đang tắt.");
        Instant expiresAt = Instant.now().plus(30, ChronoUnit.DAYS);
        repo.create(userId, "PREMIUM", "MOCK", expiresAt, entitlements(true));
        return current(userId);
    }

    @Transactional
    public Map<String, Object> grant(UUID userId, String plan, Instant expiresAt, Map<String, Object> entitlements) {
        repo.create(userId, plan, "MANUAL", expiresAt, entitlements == null ? entitlements(true) : entitlements);
        return current(userId);
    }

    @Transactional
    public void revoke(UUID userId) {
        repo.cancel(userId);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> summaryFromSubscription(Map<String, Object> sub) {
        return repo.summary(
            String.valueOf(sub.get("plan")),
            String.valueOf(sub.get("status")),
            sub.get("expiresAt") == null ? null : Instant.parse(String.valueOf(sub.get("expiresAt"))),
            sub.get("entitlementFlags") instanceof Map<?, ?> map ? (Map<String, Object>) map : entitlements(true)
        );
    }

    private Map<String, Object> entitlements(boolean enabled) {
        return Map.of(
            "premiumContent", enabled,
            "voiceQuiz", enabled,
            "advancedReports", enabled,
            "premiumNpcs", enabled
        );
    }
}
