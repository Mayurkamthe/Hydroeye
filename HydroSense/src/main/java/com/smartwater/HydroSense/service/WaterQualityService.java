package com.smartwater.HydroSense.service;

import com.smartwater.HydroSense.dto.CitizenWaterStatusDTO;
import com.smartwater.HydroSense.dto.SensorDataDTO;
import com.smartwater.HydroSense.dto.WaterQualityResponse;
import com.smartwater.HydroSense.entity.PollutionEvent;
import com.smartwater.HydroSense.entity.WaterQualityReading;
import com.smartwater.HydroSense.enums.WaterQualityStatus;
import com.smartwater.HydroSense.entity.User;
import com.smartwater.HydroSense.enums.UserRole;
import com.smartwater.HydroSense.repository.PollutionEventRepository;
import com.smartwater.HydroSense.repository.UserRepository;
import com.smartwater.HydroSense.repository.WaterQualityReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WaterQualityService {

    private final WaterQualityReadingRepository readingRepository;
    private final PollutionEventRepository pollutionEventRepository;
    private final UserRepository userRepository;
    private final AlertService alertService;
    private final EmailService emailService;

    // Tracks the last known status per device to enable state-based alert logic
    private final Map<String, WaterQualityStatus> devicePreviousStatusMap = new ConcurrentHashMap<>();

    // Threshold values from application.properties
    @Value("${water.threshold.temperature.min}")
    private Double tempMin;

    @Value("${water.threshold.temperature.max}")
    private Double tempMax;

    @Value("${water.threshold.ph.min}")
    private Double phMin;

    @Value("${water.threshold.ph.max}")
    private Double phMax;

    @Value("${water.threshold.tds.min}")
    private Double tdsMin;

    @Value("${water.threshold.tds.max}")
    private Double tdsMax;

    @Value("${water.threshold.turbidity.min}")
    private Double turbidityMin;

    @Value("${water.threshold.turbidity.max}")
    private Double turbidityMax;

    @Value("${water.threshold.dissolved-oxygen.min}")
    private Double doMin;

    @Value("${water.threshold.dissolved-oxygen.max}")
    private Double doMax;

    @Value("${water.threshold.warning-percentage}")
    private Double warningPercentage;

    /**
     * Process incoming sensor data from ESP32
     */
    @Transactional
    public WaterQualityResponse processSensorData(SensorDataDTO sensorData) {
        log.info("Processing sensor data from device: {}", sensorData.getDeviceId());

        // Classify water quality
        WaterQualityStatus status = classifyWaterQuality(sensorData);
        boolean approachingUnsafe = isApproachingUnsafe(sensorData);

        // Build and save the reading
        WaterQualityReading reading = WaterQualityReading.builder()
                .temperature(sensorData.getTemperature())
                .ph(sensorData.getPh())
                .tds(sensorData.getTds())
                .turbidity(sensorData.getTurbidity())
                .dissolvedOxygen(sensorData.getDissolvedOxygen())
                .latitude(sensorData.getLatitude())
                .longitude(sensorData.getLongitude())
                .deviceId(sensorData.getDeviceId())
                .status(status)
                .approachingUnsafe(approachingUnsafe)
                .isDeleted(false)
                .build();

        // Handle pollution event logic
        handlePollutionEvent(reading, status);

        // Save reading
        reading = readingRepository.save(reading);
        log.info("Saved water quality reading with ID: {}, Device: {}, Status: {}",
                reading.getId(), reading.getDeviceId(), status);

        // State-based alert logic per device
        String deviceId = sensorData.getDeviceId();
        WaterQualityStatus previousStatus = devicePreviousStatusMap.get(deviceId);

        if (status == WaterQualityStatus.UNSAFE && previousStatus != WaterQualityStatus.UNSAFE) {
            // SAFE → UNSAFE transition: send unsafe alert
            log.info("Device {} transitioned to UNSAFE. Sending alert.", deviceId);
            alertService.generateUnsafeAlert(reading, approachingUnsafe);
        } else if (status == WaterQualityStatus.SAFE && previousStatus == WaterQualityStatus.UNSAFE) {
            // UNSAFE → SAFE transition: send safe recovery notification
            log.info("Device {} recovered to SAFE. Sending recovery notification.", deviceId);
            alertService.generateSafeRecoveryNotification(reading);
        } else if (status == WaterQualityStatus.SAFE && approachingUnsafe) {
            // Still safe but approaching unsafe: warn authorities only
            alertService.generateApproachingUnsafeAlert(reading);
        }

        // Update device state
        devicePreviousStatusMap.put(deviceId, status);

        return mapToResponse(reading);
    }

    /**
     * Classify water quality based on threshold values
     */
    private WaterQualityStatus classifyWaterQuality(SensorDataDTO data) {
        boolean isTemperatureSafe = data.getTemperature() >= tempMin && data.getTemperature() <= tempMax;
        boolean isPhSafe = data.getPh() >= phMin && data.getPh() <= phMax;
        boolean isTdsSafe = data.getTds() >= tdsMin && data.getTds() <= tdsMax;
        boolean isTurbiditySafe = data.getTurbidity() >= turbidityMin && data.getTurbidity() <= turbidityMax;
        boolean isDoSafe = data.getDissolvedOxygen() >= doMin && data.getDissolvedOxygen() <= doMax;

        if (isTemperatureSafe && isPhSafe && isTdsSafe && isTurbiditySafe && isDoSafe) {
            return WaterQualityStatus.SAFE;
        }
        return WaterQualityStatus.UNSAFE;
    }

    /**
     * Check if any parameter is approaching unsafe limits (within warning
     * threshold)
     * Returns true if value is in the warning zone (close to but still within
     * limits)
     */
    private boolean isApproachingUnsafe(SensorDataDTO data) {
        double warningFactor = warningPercentage / 100.0;

        // Check temperature - warning if in the margin zone near the limits
        double tempRange = tempMax - tempMin;
        double tempLowerWarning = tempMin + (tempRange * warningFactor);
        double tempUpperWarning = tempMax - (tempRange * warningFactor);
        // Value is approaching unsafe if it's within safe range but in the warning
        // margin
        if ((data.getTemperature() >= tempMin && data.getTemperature() < tempLowerWarning) ||
                (data.getTemperature() > tempUpperWarning && data.getTemperature() <= tempMax)) {
            return true;
        }

        // Check pH - warning if in the margin zone near the limits
        double phRange = phMax - phMin;
        double phLowerWarning = phMin + (phRange * warningFactor);
        double phUpperWarning = phMax - (phRange * warningFactor);
        if ((data.getPh() >= phMin && data.getPh() < phLowerWarning) ||
                (data.getPh() > phUpperWarning && data.getPh() <= phMax)) {
            return true;
        }

        // Check TDS (only upper limit matters) - warning zone near max
        double tdsRange = tdsMax - tdsMin;
        double tdsWarning = tdsMax - (tdsRange * warningFactor);
        if (data.getTds() > tdsWarning && data.getTds() <= tdsMax) {
            return true;
        }

        // Check Turbidity (only upper limit matters) - warning zone near max
        double turbidityRange = turbidityMax - turbidityMin;
        double turbidityWarning = turbidityMax - (turbidityRange * warningFactor);
        if (data.getTurbidity() > turbidityWarning && data.getTurbidity() <= turbidityMax) {
            return true;
        }

        // Check DO (only lower limit matters) - warning zone near min
        double doRange = doMax - doMin;
        double doWarning = doMin + (doRange * warningFactor);
        if (data.getDissolvedOxygen() >= doMin && data.getDissolvedOxygen() < doWarning) {
            return true;
        }

        return false;
    }

    /**
     * Handle pollution event - create new or add to existing
     */
    private void handlePollutionEvent(WaterQualityReading reading, WaterQualityStatus status) {
        Optional<PollutionEvent> activeEvent = pollutionEventRepository.findTopByIsActiveTrueOrderByStartTimeDesc();

        if (status == WaterQualityStatus.UNSAFE) {
            if (activeEvent.isPresent()) {
                // Add reading to existing event
                PollutionEvent event = activeEvent.get();
                event.addReading(reading);
                pollutionEventRepository.save(event);
                log.info("Added reading to existing pollution event ID: {}", event.getId());
            } else {
                // Create new pollution event
                PollutionEvent newEvent = PollutionEvent.builder()
                        .isActive(true)
                        .initialLatitude(reading.getLatitude())
                        .initialLongitude(reading.getLongitude())
                        .description("Pollution event started due to unsafe water quality parameters")
                        .build();
                newEvent.addReading(reading);
                pollutionEventRepository.save(newEvent);
                log.info("Created new pollution event");

                // Notify all citizens
                notifyCitizens(reading);
            }
        } else {
            // Water is safe - check if we should close the active event
            if (activeEvent.isPresent()) {
                PollutionEvent event = activeEvent.get();
                event.resolve();
                pollutionEventRepository.save(event);
                log.info("Resolved pollution event ID: {}", event.getId());
            }
        }
    }

    private void notifyCitizens(WaterQualityReading reading) {
        try {
            List<User> citizens = userRepository.findByRoleAndIsActiveTrue(UserRole.CITIZEN);
            log.info("Found {} citizens to notify", citizens.size());

            for (User citizen : citizens) {
                if (citizen.getEmail() != null && !citizen.getEmail().isEmpty()) {
                    emailService.sendPollutionAlert(citizen.getEmail(), reading);
                }
            }
        } catch (Exception e) {
            log.error("Error notifying citizens", e);
        }
    }

    /**
     * Get current water status
     */
    public WaterQualityResponse getCurrentStatus() {
        return readingRepository.findTopByIsDeletedFalseOrderByRecordedAtDesc()
                .map(this::mapToResponse)
                .orElse(null);
    }

    /**
     * Get simplified status for citizens
     */
    public CitizenWaterStatusDTO getCitizenStatus() {
        Optional<WaterQualityReading> latestReading = readingRepository.findTopByIsDeletedFalseOrderByRecordedAtDesc();

        if (latestReading.isEmpty()) {
            return CitizenWaterStatusDTO.builder()
                    .status("UNKNOWN")
                    .message("No water quality data available at this time.")
                    .recommendation("Please check back later for updates.")
                    .build();
        }

        WaterQualityReading reading = latestReading.get();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

        if (reading.getStatus() == WaterQualityStatus.SAFE) {
            return CitizenWaterStatusDTO.builder()
                    .status("SAFE")
                    .message("Water quality is within safe limits.")
                    .lastUpdated(reading.getRecordedAt().format(formatter))
                    .recommendation("Water is safe for regular use and consumption.")
                    .build();
        } else {
            return CitizenWaterStatusDTO.builder()
                    .status("UNSAFE")
                    .message("Water is polluted and not safe for drinking.")
                    .lastUpdated(reading.getRecordedAt().format(formatter))
                    .recommendation(
                            "Please use bottled water or boil water before use. Authorities have been notified.")
                    .build();
        }
    }

    /**
     * Get historical readings
     */
    public List<WaterQualityResponse> getHistoricalReadings(LocalDateTime start, LocalDateTime end) {
        return readingRepository.findByRecordedAtBetweenAndIsDeletedFalseOrderByRecordedAtDesc(start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get readings by location
     */
    public List<WaterQualityResponse> getReadingsByLocation(Double lat, Double lng, Double radiusKm) {
        return readingRepository.findByLocationWithinRadius(lat, lng, radiusKm)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all readings for a specific device
     */
    public List<WaterQualityResponse> getReadingsByDevice(String deviceId) {
        return readingRepository.findByDeviceIdAndIsDeletedFalseOrderByRecordedAtDesc(deviceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get the latest reading for a specific device
     */
    public WaterQualityResponse getCurrentStatusByDevice(String deviceId) {
        return readingRepository.findTopByDeviceIdAndIsDeletedFalseOrderByRecordedAtDesc(deviceId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    /**
     * Get readings for a specific device filtered by status (SAFE or UNSAFE)
     */
    public List<WaterQualityResponse> getReadingsByDeviceAndStatus(String deviceId, WaterQualityStatus status) {
        return readingRepository.findByDeviceIdAndStatusAndIsDeletedFalseOrderByRecordedAtDesc(deviceId, status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get readings for a specific device within a time range
     */
    public List<WaterQualityResponse> getReadingsByDeviceAndTimeRange(
            String deviceId, LocalDateTime start, LocalDateTime end) {
        return readingRepository
                .findByDeviceIdAndRecordedAtBetweenAndIsDeletedFalseOrderByRecordedAtDesc(deviceId, start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all distinct active device IDs
     */
    public List<String> getAllActiveDeviceIds() {
        return readingRepository.findAllActiveDeviceIds();
    }

    /**
     * Map entity to response DTO
     */
    private WaterQualityResponse mapToResponse(WaterQualityReading reading) {
        String statusMessage = reading.getStatus() == WaterQualityStatus.SAFE
                ? "Water quality is within safe limits"
                : "Water is unsafe - one or more parameters exceed defined thresholds";

        return WaterQualityResponse.builder()
                .id(reading.getId())
                .temperature(reading.getTemperature())
                .ph(reading.getPh())
                .tds(reading.getTds())
                .turbidity(reading.getTurbidity())
                .dissolvedOxygen(reading.getDissolvedOxygen())
                .latitude(reading.getLatitude())
                .longitude(reading.getLongitude())
                .recordedAt(reading.getRecordedAt())
                .status(reading.getStatus())
                .approachingUnsafe(reading.getApproachingUnsafe())
                .deviceId(reading.getDeviceId())
                .statusMessage(statusMessage)
                .build();
    }
}

    // -------------------------------------------------------------------------
    // Device-based and status-based segregation methods (Change 1.2)
    // -------------------------------------------------------------------------

    /**
     * Get all readings for a specific device (device-based segregation)
     */
    public List<WaterQualityResponse> getReadingsByDevice(String deviceId) {
        return readingRepository.findByDeviceIdAndIsDeletedFalseOrderByRecordedAtDesc(deviceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get readings for a specific device filtered by status
     * Supports both device-wise and status-wise segregation simultaneously
     */
    public List<WaterQualityResponse> getReadingsByDeviceAndStatus(String deviceId, WaterQualityStatus status) {
        return readingRepository.findByDeviceIdAndStatusAndIsDeletedFalseOrderByRecordedAtDesc(deviceId, status)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get the latest reading for a specific device
     */
    public WaterQualityResponse getCurrentStatusByDevice(String deviceId) {
        return readingRepository.findTopByDeviceIdAndIsDeletedFalseOrderByRecordedAtDesc(deviceId)
                .map(this::mapToResponse)
                .orElse(null);
    }
}
