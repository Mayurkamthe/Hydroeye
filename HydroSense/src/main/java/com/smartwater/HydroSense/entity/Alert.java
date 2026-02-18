package com.smartwater.HydroSense.entity;

import com.smartwater.HydroSense.enums.AlertPriority;
import com.smartwater.HydroSense.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(name = "technical_details", length = 2000)
    private String technicalDetails; // JSON with sensor data (for authorities only)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", nullable = false)
    private UserRole targetRole; // AUTHORITY or CITIZEN

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reading_id")
    private WaterQualityReading reading;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "location_name")
    private String locationName; // Human-readable location

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "acknowledged")
    private Boolean acknowledged = false;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "acknowledged_by")
    private User acknowledgedBy;

    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Column(name = "push_sent")
    private Boolean pushSent = false;
}
