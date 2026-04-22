package com.smartwater.HydroSense.service;

import com.smartwater.HydroSense.dto.AuthDTO.*;
import com.smartwater.HydroSense.entity.User;
import com.smartwater.HydroSense.repository.UserRepository;
import com.smartwater.HydroSense.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    /**
     * Register a new user (public self-registration for CITIZEN only)
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Only CITIZEN role is allowed via public registration
        if (request.getRole() != com.smartwater.HydroSense.enums.UserRole.CITIZEN) {
            throw new RuntimeException("Public registration is only allowed for CITIZEN accounts.");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .organization(request.getOrganization())
                .designation(request.getDesignation())
                .isActive(true)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {} with role: {}", user.getEmail(), user.getRole());

        // Send welcome email
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), user.getRole().name());
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", user.getEmail(), e);
        }

        // Generate token
        String token = jwtTokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .user(mapToUserInfo(user))
                .build();
    }

    /**
     * Create an AUTHORITY account — only callable by SUPER_ADMIN
     */
    @Transactional
    public AuthResponse createAuthorityAccount(RegisterRequest request, String requesterEmail) {
        // Verify the requester is a SUPER_ADMIN
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Requester not found"));

        if (requester.getRole() != com.smartwater.HydroSense.enums.UserRole.SUPER_ADMIN) {
            throw new RuntimeException("Access denied: Only Super Admin can create authority accounts.");
        }

        // Force role to AUTHORITY regardless of what was sent
        request.setRole(com.smartwater.HydroSense.enums.UserRole.AUTHORITY);

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(com.smartwater.HydroSense.enums.UserRole.AUTHORITY)
                .organization(request.getOrganization())
                .designation(request.getDesignation())
                .isActive(true)
                .emailVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("Super Admin {} created AUTHORITY account for: {}", requesterEmail, user.getEmail());

        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(), user.getRole().name());
        } catch (Exception e) {
            log.error("Failed to send welcome email to authority: {}", user.getEmail(), e);
        }

        return AuthResponse.builder()
                .token(null) // No token issued by admin on behalf of user
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .user(mapToUserInfo(user))
                .build();
    }

    /**
     * Login user
     */
    public AuthResponse login(LoginRequest request) {
        // Authenticate
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        // Get user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        // Generate token
        String token = jwtTokenProvider.generateToken(user.getEmail());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .user(mapToUserInfo(user))
                .build();
    }

    /**
     * Update device token for push notifications
     */
    @Transactional
    public void updateDeviceToken(String email, String deviceToken) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setDeviceToken(deviceToken);
        userRepository.save(user);

        log.info("Device token updated for: {}", email);
    }

    /**
     * Get current user info
     */
    public UserInfo getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToUserInfo(user);
    }

    /**
     * Map user entity to user info DTO
     */
    private UserInfo mapToUserInfo(User user) {
        return UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .organization(user.getOrganization())
                .designation(user.getDesignation())
                .build();
    }

    /**
     * Initiate forgot password flow
     */
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));

        user.setOtp(otp);
        user.setOtpExpiration(java.time.LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendOtpEmail(user.getEmail(), otp, user.getFullName());
    }

    /**
     * Reset password with OTP
     */
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiration().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtp(null);
        user.setOtpExpiration(null);
        userRepository.save(user);

        log.info("Password reset successfully for: {}", email);
    }
}
