package com.projectha.common;

import java.util.Set;
import java.util.UUID;

public record AuthPrincipal(UUID id, String email, String fullName, String role, Set<String> roles) {
    public boolean hasAnyRole(String... allowed) {
        for (String roleName : allowed) {
            if (roles.contains(roleName)) return true;
        }
        return false;
    }
}
