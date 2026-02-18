package com.smartwater.HydroSense.dto;

import com.smartwater.HydroSense.enums.AlertPriority;
import com.smartwater.HydroSense.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDTO {
    private Long id;
    private String message;
    private String technicalDetails;
    private AlertPriority priority;
    private UserRole targetRole;
    private Double latitude;
    private Double longitude;
    private String locationName;
    private LocalDateTime createdAt;
    private Boolean acknowledged;
    private LocalDateTime acknowledgedAt;
    private String acknowledgedByName;
}
