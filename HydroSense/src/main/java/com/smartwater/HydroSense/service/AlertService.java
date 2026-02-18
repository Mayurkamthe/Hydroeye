package com.smartwater.HydroSense.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.HydroSense.dto.AlertDTO;
import com.smartwater.HydroSense.entity.Alert;
import com.smartwater.HydroSense.entity.User;
import com.smartwater.HydroSense.entity.WaterQualityReading;
import com.smartwater.HydroSense.enums.AlertPriority;
import com.smartwater.HydroSense.enums.UserRole;
import com.smartwater.HydroSense.enums.WaterQualityStatus;
import com.smartwater.HydroSense.repository.AlertRepository;
import com.smartwater.HydroSense.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PushNotificationService pushNotificationService;
    private final ObjectMapper objectMapper;

    /**
     * Generate alerts based on water quality reading
     */
    @Transactional
    public void generateAlerts(WaterQualityReading reading, boolean approachingUnsafe) {
        if (reading.getStatus() == WaterQualityStatus.HIGHLY_POLLUTED) {
            // High priority alert for authorities
            createAuthorityAlert(reading, AlertPriority.HIGH,
                    "CRITICAL: Highly polluted water detected! Immediate action required.");

            // Simple alert for citizens
            createCitizenAlert(reading,
                    "Water is polluted and not safe for drinking. Please use alternative water sources.");
        } else if (approachingUnsafe) {
            // Medium priority alert for authorities only
            createAuthorityAlert(reading, AlertPriority.MEDIUM,
                    "WARNING: Water quality approaching unsafe limits. Monitor closely.");
        }
    }

    /**
     * Create alert for government authorities with full technical details
     */
    private void createAuthorityAlert(WaterQualityReading reading, AlertPriority priority, String message) {
        // Build technical details JSON
        String technicalDetails = buildTechnicalDetails(reading);

        Alert alert = Alert.builder()
                .message(message)
                .technicalDetails(technicalDetails)
                .priority(priority)
                .targetRole(UserRole.AUTHORITY)
                .reading(reading)
                .latitude(reading.getLatitude())
                .longitude(reading.getLongitude())
                .acknowledged(false)
                .emailSent(false)
                .pushSent(false)
                .build();

        alert = alertRepository.save(alert);
        log.info("Created authority alert ID: {} with priority: {}", alert.getId(), priority);

        // Send notifications to authorities
        sendNotificationsToAuthorities(alert);
    }

    /**
     * Create simple alert for citizens (no technical data)
     */
    private void createCitizenAlert(WaterQualityReading reading, String message) {
        Alert alert = Alert.builder()
                .message(message)
                .priority(AlertPriority.HIGH)
                .targetRole(UserRole.CITIZEN)
                .reading(reading)
                .latitude(reading.getLatitude())
                .longitude(reading.getLongitude())
                .acknowledged(false)
                .emailSent(false)
                .pushSent(false)
                .build();

        alert = alertRepository.save(alert);
        log.info("Created citizen alert ID: {}", alert.getId());

        // Send notifications to citizens
        sendNotificationsToCitizens(alert);
    }

    /**
     * Build JSON string with technical sensor details
     */
    private String buildTechnicalDetails(WaterQualityReading reading) {
        Map<String, Object> details = new HashMap<>();
        details.put("temperature", reading.getTemperature() + " °C");
        details.put("ph", reading.getPh());
        details.put("tds", reading.getTds() + " ppm");
        details.put("turbidity", reading.getTurbidity() + " NTU");
        details.put("dissolvedOxygen", reading.getDissolvedOxygen() + " mg/L");
        details.put("latitude", reading.getLatitude());
        details.put("longitude", reading.getLongitude());
        details.put("recordedAt", reading.getRecordedAt().toString());
        details.put("deviceId", reading.getDeviceId());

        try {
            return objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException e) {
            log.error("Error serializing technical details", e);
            return "{}";
        }
    }

    /**
     * Send notifications to all authorities
     */
    private void sendNotificationsToAuthorities(Alert alert) {
        List<User> authorities = userRepository.findByRoleAndIsActiveTrueOrderByFullNameAsc(UserRole.AUTHORITY);

        for (User authority : authorities) {
            // Send email
            try {
                emailService.sendAlertEmail(
                        authority.getEmail(),
                        "Water Quality Alert - " + alert.getPriority().name(),
                        buildEmailContent(alert, true));
                alert.setEmailSent(true);
            } catch (Exception e) {
                log.error("Failed to send email to authority: {}", authority.getEmail(), e);
            }

            // Send push notification if device token exists
            if (authority.getDeviceToken() != null) {
                try {
                    pushNotificationService.sendNotification(
                            authority.getDeviceToken(),
                            "Water Quality Alert",
                            alert.getMessage());
                    alert.setPushSent(true);
                } catch (Exception e) {
                    log.error("Failed to send push to authority: {}", authority.getEmail(), e);
                }
            }
        }

        alertRepository.save(alert);
    }

    /**
     * Send notifications to all citizens
     */
    private void sendNotificationsToCitizens(Alert alert) {
        List<User> citizens = userRepository.findByRoleAndDeviceTokenIsNotNullAndIsActiveTrue(UserRole.CITIZEN);
        boolean anySuccess = false;

        for (User citizen : citizens) {
            try {
                pushNotificationService.sendNotification(
                        citizen.getDeviceToken(),
                        "Water Safety Alert",
                        alert.getMessage());
                anySuccess = true;
            } catch (Exception e) {
                log.error("Failed to send push to citizen: {}", citizen.getEmail(), e);
            }
        }

        if (anySuccess) {
            alert.setPushSent(true);
        }
        alertRepository.save(alert);
    }

    /**
     * Build email content based on alert details
     */
    private String buildEmailContent(Alert alert, boolean includeTechnicalDetails) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html><body>");
        sb.append("<h2>Water Quality Alert - ").append(alert.getPriority().name()).append("</h2>");
        sb.append("<p>").append(alert.getMessage()).append("</p>");

        if (includeTechnicalDetails && alert.getTechnicalDetails() != null) {
            sb.append("<h3>Technical Details:</h3>");
            sb.append("<pre>").append(alert.getTechnicalDetails()).append("</pre>");
        }

        sb.append("<p><strong>Location:</strong> Lat: ").append(alert.getLatitude())
                .append(", Lng: ").append(alert.getLongitude()).append("</p>");
        sb.append("<p><strong>Time:</strong> ").append(alert.getCreatedAt()).append("</p>");
        sb.append("<p>Please take immediate action as required.</p>");
        sb.append("</body></html>");

        return sb.toString();
    }

    /**
     * Get alerts for a specific role
     */
    public List<AlertDTO> getAlertsForRole(UserRole role) {
        return alertRepository.findByTargetRoleOrderByCreatedAtDesc(role)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get unacknowledged alerts for authorities
     */
    public List<AlertDTO> getUnacknowledgedAlerts() {
        return alertRepository.findByTargetRoleAndAcknowledgedFalseOrderByPriorityDescCreatedAtDesc(UserRole.AUTHORITY)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Acknowledge an alert
     */
    @Transactional
    public AlertDTO acknowledgeAlert(Long alertId, User acknowledgedBy) {
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            throw new RuntimeException("Alert not found with ID: " + alertId);
        }

        Alert alert = alertOpt.get();
        alert.setAcknowledged(true);
        alert.setAcknowledgedAt(LocalDateTime.now());
        alert.setAcknowledgedBy(acknowledgedBy);

        alert = alertRepository.save(alert);
        log.info("Alert ID: {} acknowledged by: {}", alertId, acknowledgedBy.getEmail());

        return mapToDTO(alert);
    }

    /**
     * Get alert count for dashboard
     */
    public Long getUnacknowledgedAlertCount(UserRole role) {
        return alertRepository.countByTargetRoleAndAcknowledgedFalse(role);
    }

    /**
     * Map entity to DTO
     */
    private AlertDTO mapToDTO(Alert alert) {
        return AlertDTO.builder()
                .id(alert.getId())
                .message(alert.getMessage())
                .technicalDetails(alert.getTechnicalDetails())
                .priority(alert.getPriority())
                .targetRole(alert.getTargetRole())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .locationName(alert.getLocationName())
                .createdAt(alert.getCreatedAt())
                .acknowledged(alert.getAcknowledged())
                .acknowledgedAt(alert.getAcknowledgedAt())
                .acknowledgedByName(alert.getAcknowledgedBy() != null ? alert.getAcknowledgedBy().getFullName() : null)
                .build();
    }
}
