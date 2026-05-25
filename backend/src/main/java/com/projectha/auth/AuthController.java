package com.projectha.auth;

import com.projectha.auth.AuthDtos.ChangePasswordRequest;
import com.projectha.auth.AuthDtos.ForgotPasswordRequest;
import com.projectha.auth.AuthDtos.LoginRequest;
import com.projectha.auth.AuthDtos.LogoutRequest;
import com.projectha.auth.AuthDtos.RefreshRequest;
import com.projectha.auth.AuthDtos.RegisterRequest;
import com.projectha.auth.AuthDtos.ResetPasswordRequest;
import com.projectha.auth.AuthDtos.VerifyEmailRequest;
import com.projectha.common.AuthPrincipal;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return service.register(request.fullName(), request.email(), request.password());
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request.email(), request.password());
    }

    @PostMapping("/refresh")
    public AuthDtos.AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return service.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(@RequestBody(required = false) LogoutRequest request) {
        service.logout(request == null ? null : request.refreshToken());
        return Map.of("ok", true);
    }

    @PostMapping("/send-verification-code")
    public Map<String, Object> sendVerification(@AuthenticationPrincipal AuthPrincipal principal) {
        service.sendVerificationCode(principal.id());
        return Map.of("ok", true);
    }

    @PostMapping("/verify-email")
    public Map<String, Object> verify(@AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody VerifyEmailRequest request) {
        service.verifyEmail(principal.id(), request.code());
        return Map.of("ok", true);
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        service.forgotPassword(request.email());
        return Map.of("ok", true);
    }

    @PostMapping("/reset-password")
    public Map<String, Object> reset(@Valid @RequestBody ResetPasswordRequest request) {
        service.resetPassword(request.email(), request.code(), request.newPassword());
        return Map.of("ok", true);
    }

    @PostMapping("/change-password")
    public Map<String, Object> change(@AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(principal.id(), request.currentPassword(), request.newPassword());
        return Map.of("ok", true);
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        return Map.of("ok", true);
    }
}
