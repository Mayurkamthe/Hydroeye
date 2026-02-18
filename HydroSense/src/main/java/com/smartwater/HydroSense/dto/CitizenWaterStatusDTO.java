package com.smartwater.HydroSense.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CitizenWaterStatusDTO {
    private String status; // "SAFE" or "UNSAFE"
    private String message; // Simple user-friendly message
    private String lastUpdated; // Human-readable time
    private String locationName; // Optional location
    private String recommendation; // What citizen should do
}
