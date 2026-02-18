package com.smartwater.HydroSense.controller;

import com.smartwater.HydroSense.dto.AlertDTO;
import com.smartwater.HydroSense.entity.User;
import com.smartwater.HydroSense.enums.UserRole;
import com.smartwater.HydroSense.repository.UserRepository;
import com.smartwater.HydroSense.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts")
@RequiredArgsConstructor
@Tag(name = "Alerts", description = "Alert management APIs")
@SecurityRequirement(name = "bearerAuth")
public class AlertController {

    private final AlertService alertService;
    private final UserRepository userRepository;

    /**
     * Get alerts for authorities
     */
    @GetMapping("/authority")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Get all authority alerts")
    public ResponseEntity<List<AlertDTO>> getAuthorityAlerts() {
        return ResponseEntity.ok(alertService.getAlertsForRole(UserRole.AUTHORITY));
    }

    /**
     * Get unacknowledged alerts for authorities
     */
    @GetMapping("/authority/unacknowledged")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Get unacknowledged alerts for authorities")
    public ResponseEntity<List<AlertDTO>> getUnacknowledgedAlerts() {
        return ResponseEntity.ok(alertService.getUnacknowledgedAlerts());
    }

    /**
     * Get alert count for dashboard
     */
    @GetMapping("/authority/count")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Get unacknowledged alert count")
    public ResponseEntity<?> getAlertCount() {
        Long count = alertService.getUnacknowledgedAlertCount(UserRole.AUTHORITY);
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Acknowledge an alert
     */
    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Acknowledge an alert")
    public ResponseEntity<AlertDTO> acknowledgeAlert(
            @PathVariable Long id,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(alertService.acknowledgeAlert(id, user));
    }

    /**
     * Get alerts for citizens
     */
    @GetMapping("/citizen")
    @PreAuthorize("hasRole('CITIZEN')")
    @Operation(summary = "Get citizen alerts")
    public ResponseEntity<List<AlertDTO>> getCitizenAlerts() {
        return ResponseEntity.ok(alertService.getAlertsForRole(UserRole.CITIZEN));
    }
}
