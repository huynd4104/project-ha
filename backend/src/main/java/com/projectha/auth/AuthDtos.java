package com.projectha.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
        @NotBlank String fullName,
        @Email @NotBlank String email,
        @Size(min = 8) String password
    ) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record LogoutRequest(String refreshToken) {}

    public record VerifyEmailRequest(@NotBlank String code) {}

    public record ForgotPasswordRequest(@Email @NotBlank String email) {}

    public record ResetPasswordRequest(@Email @NotBlank String email, @NotBlank String code, @Size(min = 8) String newPassword) {}

    public record ChangePasswordRequest(@NotBlank String currentPassword, @Size(min = 8) String newPassword) {}

    public record UpdateProfileRequest(@NotBlank String fullName) {}

    public record AuthResponse(String accessToken, String refreshToken, Map<String, Object> user) {}
}
