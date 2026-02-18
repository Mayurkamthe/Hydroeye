package com.smartwater.HydroSense.entity;

import com.smartwater.HydroSense.enums.WaterQualityStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "water_quality_readings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterQualityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double temperature; // Celsius

    @Column(nullable = false)
    private Double ph; // pH value (0-14)

    @Column(nullable = false)
    private Double tds; // Total Dissolved Solids (ppm)

    @Column(nullable = false)
    private Double turbidity; // Turbidity (NTU)

    @Column(name = "dissolved_oxygen", nullable = false)
    private Double dissolvedOxygen; // DO (mg/L)

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WaterQualityStatus status;

    @Column(name = "approaching_unsafe")
    private Boolean approachingUnsafe = false; // True if within warning threshold

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pollution_event_id")
    private PollutionEvent pollutionEvent;

    // Additional metadata
    @Column(name = "device_id")
    private String deviceId; // ESP32 device identifier

    @Column(name = "is_deleted")
    private Boolean isDeleted = false; // Soft delete flag
}
