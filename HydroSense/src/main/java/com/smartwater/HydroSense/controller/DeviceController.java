package com.smartwater.HydroSense.controller;

import com.smartwater.HydroSense.dto.DeviceDTO.*;
import com.smartwater.HydroSense.service.DeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/devices")
@RequiredArgsConstructor
@Tag(name = "Devices", description = "IoT Device management APIs")
@SecurityRequirement(name = "bearerAuth")
public class DeviceController {

    private final DeviceService deviceService;

    /**
     * Get all devices
     */
    @GetMapping
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Get all devices", description = "Returns list of all registered IoT devices")
    public ResponseEntity<List<DeviceResponse>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }

    /**
     * Get device by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Get device by ID", description = "Returns a specific device by its ID")
    public ResponseEntity<DeviceResponse> getDeviceById(@PathVariable Long id) {
        return ResponseEntity.ok(deviceService.getDeviceById(id));
    }

    /**
     * Create a new device
     */
    @PostMapping
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Create a new device", description = "Register a new IoT device")
    public ResponseEntity<DeviceResponse> createDevice(@Valid @RequestBody CreateDeviceRequest request) {
        return ResponseEntity.ok(deviceService.createDevice(request));
    }

    /**
     * Update an existing device
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Update a device", description = "Update an existing IoT device")
    public ResponseEntity<DeviceResponse> updateDevice(
            @PathVariable Long id,
            @RequestBody UpdateDeviceRequest request) {
        return ResponseEntity.ok(deviceService.updateDevice(id, request));
    }

    /**
     * Delete a device
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('AUTHORITY')")
    @Operation(summary = "Delete a device", description = "Remove an IoT device from the system")
    public ResponseEntity<?> deleteDevice(@PathVariable Long id) {
        deviceService.deleteDevice(id);
        return ResponseEntity.ok(Map.of("message", "Device deleted successfully"));
    }
}
