package com.projectha.auth;

import com.projectha.common.AuthPrincipal;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final Duration accessTtl;
    private final Duration refreshTtl;

    public JwtService(
        @Value("${project-ha.jwt.secret}") String secret,
        @Value("${project-ha.jwt.access-token-minutes}") long accessMinutes,
        @Value("${project-ha.jwt.refresh-token-days}") long refreshDays
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTtl = Duration.ofMinutes(accessMinutes);
        this.refreshTtl = Duration.ofDays(refreshDays);
    }

    public String accessToken(Map<String, Object> user) {
        Instant now = Instant.now();
        String role = String.valueOf(user.getOrDefault("role", "PARENT"));
        return Jwts.builder()
            .subject(String.valueOf(user.get("id")))
            .claim("email", user.get("email"))
            .claim("fullName", user.get("fullName"))
            .claim("role", role)
            .claim("roles", Set.of(role))
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plus(accessTtl)))
            .signWith(key)
            .compact();
    }

    public AuthPrincipal parse(String token) {
        var claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        String role = String.valueOf(claims.get("role", String.class));
        return new AuthPrincipal(
            UUID.fromString(claims.getSubject()),
            claims.get("email", String.class),
            claims.get("fullName", String.class),
            role,
            Set.of(role)
        );
    }

    public Instant refreshExpiresAt() {
        return Instant.now().plus(refreshTtl);
    }

    public String hashRefreshToken(String token) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot hash refresh token", e);
        }
    }
}
