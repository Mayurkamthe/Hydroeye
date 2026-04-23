package com.smartwater.HydroSense.controller;

import com.smartwater.HydroSense.dto.AuthDTO.*;
import com.smartwater.HydroSense.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User authentication APIs")
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new CITIZEN user (public)
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new citizen user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * Create an AUTHORITY account — Super Admin only
     */
    @PostMapping("/super-admin/create-authority")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create an authority account (Super Admin only)")
    public ResponseEntity<AuthResponse> createAuthorityAccount(
            @Valid @RequestBody RegisterRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(authService.createAuthorityAccount(request, authentication.getName()));
    }

    /**
     * List all authority users — Super Admin only
     */
    @GetMapping("/super-admin/authorities")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List all authority users (Super Admin only)")
    public ResponseEntity<List<UserInfo>> listAuthorityUsers() {
        return ResponseEntity.ok(authService.listAuthorityUsers());
    }

    /**
     * Deactivate a user account — Super Admin only
     */
    @PutMapping("/super-admin/deactivate/{userId}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Deactivate a user account (Super Admin only)")
    public ResponseEntity<?> deactivateUser(@PathVariable Long userId) {
        authService.deactivateUser(userId);
        return ResponseEntity.ok(Map.of("message", "User account deactivated successfully"));
    }

    /**
     * Login user
     */
    @PostMapping("/login")
    @Operation(summary = "Login user")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Get current user info
     */
    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current user info")
    public ResponseEntity<UserInfo> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    /**
     * Update device token for push notifications
     */
    @PutMapping("/device-token")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update device token for push notifications")
    public ResponseEntity<?> updateDeviceToken(
            @Valid @RequestBody UpdateDeviceTokenRequest request,
            Authentication authentication) {

        authService.updateDeviceToken(authentication.getName(), request.getDeviceToken());
        return ResponseEntity.ok(Map.of("message", "Device token updated successfully"));
    }

    /**
     * Forgot Password
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset OTP")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        authService.forgotPassword(email);
        return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
    }

    /**
     * Reset Password
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        authService.resetPassword(email, otp, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
