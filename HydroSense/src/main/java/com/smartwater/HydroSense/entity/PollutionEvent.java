package com.smartwater.HydroSense.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pollution_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollutionEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name = "start_time", nullable = false, updatable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "description", length = 1000)
    private String description;

    // Location where pollution was first detected
    @Column(name = "initial_latitude")
    private Double initialLatitude;

    @Column(name = "initial_longitude")
    private Double initialLongitude;

    @Column(name = "location_name")
    private String locationName;

    // Peak pollution values during the event
    @Column(name = "peak_ph")
    private Double peakPh;

    @Column(name = "peak_tds")
    private Double peakTds;

    @Column(name = "peak_turbidity")
    private Double peakTurbidity;

    @Column(name = "min_dissolved_oxygen")
    private Double minDissolvedOxygen;

    @OneToMany(mappedBy = "pollutionEvent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<WaterQualityReading> readings = new ArrayList<>();

    @Column(name = "reading_count")
    private Integer readingCount = 0;

    // Marks the event as resolved
    public void resolve() {
        this.isActive = false;
        this.endTime = LocalDateTime.now();
    }

    // Add a reading to this event
    public void addReading(WaterQualityReading reading) {
        readings.add(reading);
        reading.setPollutionEvent(this);
        readingCount = readings.size();

        // Update peak values
        if (peakPh == null || reading.getPh() > peakPh) {
            peakPh = reading.getPh();
        }
        if (peakTds == null || reading.getTds() > peakTds) {
            peakTds = reading.getTds();
        }
        if (peakTurbidity == null || reading.getTurbidity() > peakTurbidity) {
            peakTurbidity = reading.getTurbidity();
        }
        if (minDissolvedOxygen == null || reading.getDissolvedOxygen() < minDissolvedOxygen) {
            minDissolvedOxygen = reading.getDissolvedOxygen();
        }
    }
}
