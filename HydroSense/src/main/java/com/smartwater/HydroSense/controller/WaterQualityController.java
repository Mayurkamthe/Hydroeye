package com.smartwater.HydroSense.controller;

import com.smartwater.HydroSense.dto.CitizenWaterStatusDTO;
import com.smartwater.HydroSense.dto.WaterQualityResponse;
import com.smartwater.HydroSense.enums.WaterQualityStatus;
import com.smartwater.HydroSense.service.WaterQualityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/water")
@RequiredArgsConstructor
@Tag(name = "Water Quality", description = "Water quality data APIs")
public class WaterQualityController {

    private final WaterQualityService waterQualityService;

    /**
     * Get current water quality status (public)
     */
    @GetMapping("/current")
    @Operation(summary = "Get current water quality status", description = "Returns the latest water quality reading")
    public ResponseEntity<?> getCurrentStatus() {
        WaterQualityResponse current = waterQualityService.getCurrentStatus();

        if (current == null) {
            return ResponseEntity.ok(Map.of(
                    "message", "No water quality data available",
                    "status", "UNKNOWN"));
        }

        return ResponseEntity.ok(current);
    }

    /**
     * Get simplified status for citizens (public)
     */
    @GetMapping("/citizen-status")
    @Operation(summary = "Get simplified water status for citizens", description = "Returns simple safe/unsafe status without technical details")
    public ResponseEntity<CitizenWaterStatusDTO> getCitizenStatus() {
        return ResponseEntity.ok(waterQualityService.getCitizenStatus());
    }

    /**
     * Get historical readings (authorities only)
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('AUTHORITY', 'CITIZEN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get historical water quality readings", description = "Returns readings within specified date range (Authority only)")
    public ResponseEntity<List<WaterQualityResponse>> getHistoricalReadings(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        return ResponseEntity.ok(waterQualityService.getHistoricalReadings(start, end));
    }

    /**
     * Get readings by location (authorities only)
     */
    @GetMapping("/location")
    @PreAuthorize("hasRole('AUTHORITY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get readings by location", description = "Returns readings within specified radius (Authority only)")
    public ResponseEntity<List<WaterQualityResponse>> getReadingsByLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "5") Double radiusKm) {

        return ResponseEntity.ok(waterQualityService.getReadingsByLocation(latitude, longitude, radiusKm));
    }

    /**
     * Get list of all active device IDs (authorities only)
     */
    @GetMapping("/devices")
    @PreAuthorize("hasRole('AUTHORITY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get all active device IDs", description = "Returns list of all device IDs that have sent data")
    public ResponseEntity<List<String>> getAllActiveDevices() {
        return ResponseEntity.ok(waterQualityService.getAllActiveDeviceIds());
    }

    /**
     * Get latest reading for a specific device (authorities only)
     */
    @GetMapping("/devices/{deviceId}/current")
    @PreAuthorize("hasRole('AUTHORITY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current status for a specific device")
    public ResponseEntity<?> getCurrentStatusByDevice(@PathVariable String deviceId) {
        WaterQualityResponse current = waterQualityService.getCurrentStatusByDevice(deviceId);
        if (current == null) {
            return ResponseEntity.ok(Map.of(
                    "message", "No data available for device: " + deviceId,
                    "status", "UNKNOWN"));
        }
        return ResponseEntity.ok(current);
    }

    /**
     * Get all readings for a specific device (authorities only)
     */
    @GetMapping("/devices/{deviceId}/history")
    @PreAuthorize("hasRole('AUTHORITY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get all readings for a specific device")
    public ResponseEntity<List<WaterQualityResponse>> getReadingsByDevice(@PathVariable String deviceId) {
        return ResponseEntity.ok(waterQualityService.getReadingsByDevice(deviceId));
    }

    /**
     * Get readings for a specific device filtered by status (authorities only)
     */
    @GetMapping("/devices/{deviceId}/status/{status}")
    @PreAuthorize("hasRole('AUTHORITY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get readings for a device filtered by SAFE or UNSAFE status")
    public ResponseEntity<List<WaterQualityResponse>> getReadingsByDeviceAndStatus(
            @PathVariable String deviceId,
            @PathVariable WaterQualityStatus status) {
        return ResponseEntity.ok(waterQualityService.getReadingsByDeviceAndStatus(deviceId, status));
    }

    /**
     * Get readings for a specific device within a time range (authorities only)
     */
    @GetMapping("/devices/{deviceId}/history/range")
    @PreAuthorize("hasRole('AUTHORITY')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get readings for a device within a time range")
    public ResponseEntity<List<WaterQualityResponse>> getReadingsByDeviceAndTimeRange(
            @PathVariable String deviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(waterQualityService.getReadingsByDeviceAndTimeRange(deviceId, start, end));
    }
}
