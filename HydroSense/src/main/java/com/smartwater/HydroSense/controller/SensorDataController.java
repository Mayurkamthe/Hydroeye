package com.smartwater.HydroSense.controller;

import com.smartwater.HydroSense.dto.SensorDataDTO;
import com.smartwater.HydroSense.dto.WaterQualityResponse;
import com.smartwater.HydroSense.service.WaterQualityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/sensor")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Sensor Data", description = "ESP32 sensor data ingestion APIs")
public class SensorDataController {

    private final WaterQualityService waterQualityService;

    @Value("${esp32.api.key}")
    private String esp32ApiKey;

    /**
     * Receive sensor data from ESP32
     */
    @PostMapping("/data")
    @Operation(summary = "Receive sensor data from ESP32", description = "Endpoint for ESP32 to send water quality readings")
    public ResponseEntity<?> receiveSensorData(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @Valid @RequestBody SensorDataDTO sensorData) {

        // Validate API key
        if (apiKey == null || !apiKey.equals(esp32ApiKey)) {
            log.warn("Invalid or missing API key from sensor");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or missing API key"));
        }

        log.info("Received sensor data from device: {}", sensorData.getDeviceId());

        try {
            WaterQualityResponse response = waterQualityService.processSensorData(sensorData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing sensor data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process sensor data: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint for ESP32
     */
    @GetMapping("/health")
    @Operation(summary = "Health check for ESP32 connectivity")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "HydroSense Sensor API",
                "timestamp", System.currentTimeMillis()));
    }
}
