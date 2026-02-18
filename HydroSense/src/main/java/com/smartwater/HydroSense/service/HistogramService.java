package com.smartwater.HydroSense.service;

import com.smartwater.HydroSense.dto.HistogramDTO;
import com.smartwater.HydroSense.dto.HistogramDTO.HistogramBin;
import com.smartwater.HydroSense.repository.WaterQualityReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistogramService {

    private final WaterQualityReadingRepository readingRepository;

    private static final int DEFAULT_BIN_COUNT = 10;

    /**
     * Generate histogram for a specific parameter
     */
    public HistogramDTO generateHistogram(String parameter, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        List<Double> values = getValuesForParameter(parameter, since);

        if (values.isEmpty()) {
            return HistogramDTO.builder()
                    .parameter(parameter)
                    .bins(new ArrayList<>())
                    .totalReadings(0)
                    .unit(getUnit(parameter))
                    .build();
        }

        return buildHistogram(parameter, values);
    }

    /**
     * Get values for specific parameter from database
     */
    private List<Double> getValuesForParameter(String parameter, LocalDateTime since) {
        return switch (parameter.toLowerCase()) {
            case "ph" -> readingRepository.findPhValuesForHistogram(since);
            case "tds" -> readingRepository.findTdsValuesForHistogram(since);
            case "turbidity" -> readingRepository.findTurbidityValuesForHistogram(since);
            case "temperature" -> readingRepository.findTemperatureValuesForHistogram(since);
            case "dissolvedoxygen", "do" -> readingRepository.findDissolvedOxygenValuesForHistogram(since);
            default -> throw new IllegalArgumentException("Unknown parameter: " + parameter);
        };
    }

    /**
     * Build histogram from values
     */
    private HistogramDTO buildHistogram(String parameter, List<Double> values) {
        double min = values.stream().mapToDouble(Double::doubleValue).min().orElse(0);
        double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        // Calculate standard deviation
        double sumSquaredDiff = values.stream()
                .mapToDouble(v -> Math.pow(v - mean, 2))
                .sum();
        double stdDev = Math.sqrt(sumSquaredDiff / values.size());

        // Create bins
        double binWidth = (max - min) / DEFAULT_BIN_COUNT;
        if (binWidth == 0)
            binWidth = 1; // Avoid division by zero

        List<HistogramBin> bins = new ArrayList<>();
        int[] frequencies = new int[DEFAULT_BIN_COUNT];

        // Count frequencies
        for (Double value : values) {
            int binIndex = (int) ((value - min) / binWidth);
            if (binIndex >= DEFAULT_BIN_COUNT)
                binIndex = DEFAULT_BIN_COUNT - 1;
            if (binIndex < 0)
                binIndex = 0;
            frequencies[binIndex]++;
        }

        // Build bin objects
        for (int i = 0; i < DEFAULT_BIN_COUNT; i++) {
            double rangeStart = min + (i * binWidth);
            double rangeEnd = min + ((i + 1) * binWidth);
            double percentage = (frequencies[i] * 100.0) / values.size();

            bins.add(HistogramBin.builder()
                    .rangeStart(Math.round(rangeStart * 100.0) / 100.0)
                    .rangeEnd(Math.round(rangeEnd * 100.0) / 100.0)
                    .frequency(frequencies[i])
                    .percentage(Math.round(percentage * 100.0) / 100.0)
                    .label(String.format("%.1f - %.1f", rangeStart, rangeEnd))
                    .build());
        }

        return HistogramDTO.builder()
                .parameter(parameter)
                .bins(bins)
                .min(Math.round(min * 100.0) / 100.0)
                .max(Math.round(max * 100.0) / 100.0)
                .mean(Math.round(mean * 100.0) / 100.0)
                .standardDeviation(Math.round(stdDev * 100.0) / 100.0)
                .totalReadings(values.size())
                .unit(getUnit(parameter))
                .build();
    }

    /**
     * Get unit for parameter
     */
    private String getUnit(String parameter) {
        return switch (parameter.toLowerCase()) {
            case "ph" -> "";
            case "tds" -> "ppm";
            case "turbidity" -> "NTU";
            case "temperature" -> "°C";
            case "dissolvedoxygen", "do" -> "mg/L";
            default -> "";
        };
    }

    /**
     * Get all histograms for dashboard
     */
    public List<HistogramDTO> getAllHistograms(int days) {
        List<HistogramDTO> histograms = new ArrayList<>();

        String[] parameters = { "ph", "tds", "turbidity", "temperature", "dissolvedoxygen" };
        for (String param : parameters) {
            try {
                histograms.add(generateHistogram(param, days));
            } catch (Exception e) {
                log.error("Error generating histogram for: {}", param, e);
            }
        }

        return histograms;
    }
}
