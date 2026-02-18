package com.smartwater.HydroSense.dto;

import com.smartwater.HydroSense.enums.WaterQualityStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterQualityResponse {
    private Long id;
    private Double temperature;
    private Double ph;
    private Double tds;
    private Double turbidity;
    private Double dissolvedOxygen;
    private Double latitude;
    private Double longitude;
    private LocalDateTime recordedAt;
    private WaterQualityStatus status;
    private Boolean approachingUnsafe;
    private String deviceId;
    private String statusMessage;
}
