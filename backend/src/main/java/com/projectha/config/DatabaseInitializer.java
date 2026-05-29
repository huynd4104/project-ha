package com.projectha.config;

import com.projectha.auth.UserAccountRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {
    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    public DatabaseInitializer(UserAccountRepository users, PasswordEncoder passwordEncoder, JdbcTemplate jdbc) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@projectha.local";
        try {
            if (users.findByEmail(adminEmail).isEmpty()) {
                Map<String, Object> admin = jdbc.queryForMap("""
                    INSERT INTO users(email, password_hash, full_name, role, is_active, email_verified)
                    VALUES (?, ?, 'System Admin', 'ADMIN', true, true)
                    RETURNING *
                    """, adminEmail, passwordEncoder.encode("Admin@123456"));
                
                UUID adminId = UUID.fromString(String.valueOf(admin.get("id")));
                users.assignRole(adminId, "ADMIN");
            }
        } catch (DataAccessException e) {
            // Safe fallback if database tables don't exist yet (e.g. in tests where Flyway is disabled)
            System.out.println("Database schema not fully initialized. Skipping default admin account creation: " + e.getMessage());
        }
    }
}
