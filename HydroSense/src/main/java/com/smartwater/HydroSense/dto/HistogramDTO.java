package com.smartwater.HydroSense.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistogramDTO {
    private String parameter; // ph, tds, turbidity, temperature, dissolvedOxygen
    private List<HistogramBin> bins;
    private Double min;
    private Double max;
    private Double mean;
    private Double standardDeviation;
    private Integer totalReadings;
    private String unit;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistogramBin {
        private Double rangeStart;
        private Double rangeEnd;
        private Integer frequency;
        private Double percentage;
        private String label;
    }
}
