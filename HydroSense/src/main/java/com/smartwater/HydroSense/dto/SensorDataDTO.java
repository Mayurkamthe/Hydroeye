package com.smartwater.HydroSense.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorDataDTO {

    @NotNull(message = "Temperature is required")
    @DecimalMin(value = "-50.0", message = "Temperature too low")
    @DecimalMax(value = "100.0", message = "Temperature too high")
    private Double temperature;

    @NotNull(message = "pH is required")
    @DecimalMin(value = "0.0", message = "pH must be at least 0")
    @DecimalMax(value = "14.0", message = "pH must be at most 14")
    private Double ph;

    @NotNull(message = "TDS is required")
    @DecimalMin(value = "0.0", message = "TDS cannot be negative")
    private Double tds;

    @NotNull(message = "Turbidity is required")
    @DecimalMin(value = "0.0", message = "Turbidity cannot be negative")
    private Double turbidity;

    @NotNull(message = "Dissolved Oxygen is required")
    @DecimalMin(value = "0.0", message = "DO cannot be negative")
    private Double dissolvedOxygen;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Invalid latitude")
    @DecimalMax(value = "90.0", message = "Invalid latitude")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Invalid longitude")
    @DecimalMax(value = "180.0", message = "Invalid longitude")
    private Double longitude;

    private String deviceId;
}
