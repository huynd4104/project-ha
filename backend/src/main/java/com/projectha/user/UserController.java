package com.projectha.user;

import com.projectha.auth.AuthDtos.UpdateProfileRequest;
import com.projectha.auth.UserAccountRepository;
import com.projectha.common.AuthPrincipal;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class UserController {
    private final UserAccountRepository users;

    public UserController(UserAccountRepository users) {
        this.users = users;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal AuthPrincipal principal) {
        Map<String, Object> user = users.requireById(principal.id());
        user.remove("passwordHash");
        return user;
    }

    @PutMapping("/me")
    public Map<String, Object> update(@AuthenticationPrincipal AuthPrincipal principal, @Valid @RequestBody UpdateProfileRequest request) {
        Map<String, Object> user = users.updateFullName(principal.id(), request.fullName());
        user.remove("passwordHash");
        return user;
    }
}
