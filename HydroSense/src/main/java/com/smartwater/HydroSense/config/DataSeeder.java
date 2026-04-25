package com.smartwater.HydroSense.config;

import com.smartwater.HydroSense.entity.User;
import com.smartwater.HydroSense.enums.UserRole;
import com.smartwater.HydroSense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the Super Admin account on first startup.
 * Uses configured credentials from application.properties.
 * No API call or token needed — account exists before any login.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${superadmin.email}")
    private String superAdminEmail;

    @Value("${superadmin.password}")
    private String superAdminPassword;

    @Value("${superadmin.fullname}")
    private String superAdminFullName;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(superAdminEmail)) {
            User superAdmin = User.builder()
                    .email(superAdminEmail)
                    .password(passwordEncoder.encode(superAdminPassword))
                    .fullName(superAdminFullName)
                    .role(UserRole.SUPER_ADMIN)
                    .isActive(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(superAdmin);
            log.info("Super Admin account seeded: {}", superAdminEmail);
        } else {
            log.info("Super Admin already exists, skipping seed.");
        }
    }
}
