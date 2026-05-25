package com.projectha.auth;

import com.projectha.auth.AuthDtos.AuthResponse;
import com.projectha.common.BadRequestException;
import com.projectha.email.EmailService;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwt;
    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserAccountRepository users, PasswordEncoder passwordEncoder, JwtService jwt, EmailService emailService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwt = jwt;
        this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(String fullName, String email, String password) {
        users.findByEmail(email).ifPresent(existing -> {
            throw new BadRequestException("Email đã được đăng ký.");
        });
        Map<String, Object> user = users.createParent(fullName, email, passwordEncoder.encode(password));
        sendVerificationCode(UUID.fromString((String) user.get("id")));
        return issue(user);
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        Map<String, Object> user = users.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("bad credentials"));
        if (!Boolean.TRUE.equals(user.get("isActive"))) throw new BadCredentialsException("inactive");
        if (!passwordEncoder.matches(password, String.valueOf(user.get("passwordHash")))) {
            throw new BadCredentialsException("bad credentials");
        }
        return issue(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        String hash = jwt.hashRefreshToken(refreshToken);
        Map<String, Object> token = users.findActiveRefreshToken(hash)
            .orElseThrow(() -> new BadRequestException("Refresh token không hợp lệ hoặc đã hết hạn."));
        users.revokeRefreshToken(hash);
        Map<String, Object> user = users.requireById(UUID.fromString(String.valueOf(token.get("userId"))));
        return issue(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            users.revokeRefreshToken(jwt.hashRefreshToken(refreshToken));
        }
    }

    @Transactional
    public void sendVerificationCode(UUID userId) {
        Map<String, Object> user = users.requireById(userId);
        String code = code();
        users.createVerificationCode(userId, code, Instant.now().plusSeconds(30 * 60));
        emailService.sendVerificationCode(String.valueOf(user.get("email")), String.valueOf(user.get("fullName")), code);
    }

    @Transactional
    public void verifyEmail(UUID userId, String code) {
        if (!users.consumeVerificationCode(userId, code)) {
            throw new BadRequestException("Mã xác thực không hợp lệ hoặc đã hết hạn.");
        }
        users.markEmailVerified(userId);
    }

    @Transactional
    public void forgotPassword(String email) {
        users.findByEmail(email).ifPresent(user -> {
            UUID userId = UUID.fromString((String) user.get("id"));
            String code = code();
            users.createPasswordResetCode(userId, code, Instant.now().plusSeconds(30 * 60));
            emailService.sendPasswordResetCode(String.valueOf(user.get("email")), String.valueOf(user.get("fullName")), code);
        });
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        Map<String, Object> user = users.findByEmail(email).orElseThrow(() -> new BadRequestException("Mã đặt lại không hợp lệ."));
        UUID userId = UUID.fromString((String) user.get("id"));
        if (!users.consumePasswordResetCode(userId, code)) {
            throw new BadRequestException("Mã đặt lại không hợp lệ hoặc đã hết hạn.");
        }
        users.updatePassword(userId, passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        Map<String, Object> user = users.requireById(userId);
        if (!passwordEncoder.matches(currentPassword, String.valueOf(user.get("passwordHash")))) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng.");
        }
        users.updatePassword(userId, passwordEncoder.encode(newPassword));
    }

    private AuthResponse issue(Map<String, Object> user) {
        String refreshToken = UUID.randomUUID() + "." + UUID.randomUUID();
        users.storeRefreshToken(UUID.fromString((String) user.get("id")), jwt.hashRefreshToken(refreshToken), jwt.refreshExpiresAt());
        user.remove("passwordHash");
        return new AuthResponse(jwt.accessToken(user), refreshToken, user);
    }

    private String code() {
        return String.valueOf(100000 + random.nextInt(900000));
    }
}
