package com.smartwater.HydroSense.dto;

import com.smartwater.HydroSense.enums.DeviceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class DeviceDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDeviceRequest {
        @NotBlank(message = "Device ID is required")
        private String deviceId;

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Location is required")
        private String location;

        @NotNull(message = "Latitude is required")
        private Double latitude;

        @NotNull(message = "Longitude is required")
        private Double longitude;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateDeviceRequest {
        private String deviceId;
        private String name;
        private String location;
        private Double latitude;
        private Double longitude;
        private DeviceStatus status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeviceResponse {
        private Long id;
        private String deviceId;
        private String name;
        private String location;
        private Double latitude;
        private Double longitude;
        private DeviceStatus status;
        private LocalDateTime lastReading;
        private LocalDateTime createdAt;
    }
}
