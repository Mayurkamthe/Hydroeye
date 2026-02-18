package com.smartwater.HydroSense.service;

import com.smartwater.HydroSense.dto.DeviceDTO.*;
import com.smartwater.HydroSense.entity.Device;
import com.smartwater.HydroSense.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {

    private final DeviceRepository deviceRepository;

    /**
     * Get all devices
     */
    public List<DeviceResponse> getAllDevices() {
        return deviceRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get device by ID
     */
    public DeviceResponse getDeviceById(Long id) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found with id: " + id));
        return toResponse(device);
    }

    /**
     * Get device by device ID (ESP32 ID)
     */
    public DeviceResponse getDeviceByDeviceId(String deviceId) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found with deviceId: " + deviceId));
        return toResponse(device);
    }

    /**
     * Create a new device
     */
    @Transactional
    public DeviceResponse createDevice(CreateDeviceRequest request) {
        if (deviceRepository.existsByDeviceId(request.getDeviceId())) {
            throw new RuntimeException("Device with ID " + request.getDeviceId() + " already exists");
        }

        Device device = Device.builder()
                .deviceId(request.getDeviceId())
                .name(request.getName())
                .location(request.getLocation())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();

        device = deviceRepository.save(device);
        log.info("Created new device: {}", device.getDeviceId());
        return toResponse(device);
    }

    /**
     * Update an existing device
     */
    @Transactional
    public DeviceResponse updateDevice(Long id, UpdateDeviceRequest request) {
        Device device = deviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Device not found with id: " + id));

        if (request.getDeviceId() != null) {
            device.setDeviceId(request.getDeviceId());
        }
        if (request.getName() != null) {
            device.setName(request.getName());
        }
        if (request.getLocation() != null) {
            device.setLocation(request.getLocation());
        }
        if (request.getLatitude() != null) {
            device.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            device.setLongitude(request.getLongitude());
        }
        if (request.getStatus() != null) {
            device.setStatus(request.getStatus());
        }

        device = deviceRepository.save(device);
        log.info("Updated device: {}", device.getDeviceId());
        return toResponse(device);
    }

    /**
     * Delete a device
     */
    @Transactional
    public void deleteDevice(Long id) {
        if (!deviceRepository.existsById(id)) {
            throw new RuntimeException("Device not found with id: " + id);
        }
        deviceRepository.deleteById(id);
        log.info("Deleted device with id: {}", id);
    }

    /**
     * Convert entity to response DTO
     */
    private DeviceResponse toResponse(Device device) {
        return DeviceResponse.builder()
                .id(device.getId())
                .deviceId(device.getDeviceId())
                .name(device.getName())
                .location(device.getLocation())
                .latitude(device.getLatitude())
                .longitude(device.getLongitude())
                .status(device.getStatus())
                .lastReading(device.getLastReading())
                .createdAt(device.getCreatedAt())
                .build();
    }
}
