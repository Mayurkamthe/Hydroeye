package com.smartwater.HydroSense.controller;

import com.smartwater.HydroSense.dto.HistogramDTO;
import com.smartwater.HydroSense.service.HistogramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/histogram")
@RequiredArgsConstructor
@PreAuthorize("hasRole('AUTHORITY')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Histogram", description = "Histogram visualization APIs")
public class HistogramController {

    private final HistogramService histogramService;

    /**
     * Get histogram for a specific parameter
     */
    @GetMapping("/{parameter}")
    @Operation(summary = "Get histogram for specific parameter", description = "Parameters: ph, tds, turbidity, temperature, dissolvedOxygen")
    public ResponseEntity<HistogramDTO> getHistogram(
            @PathVariable String parameter,
            @RequestParam(defaultValue = "7") int days) {

        return ResponseEntity.ok(histogramService.generateHistogram(parameter, days));
    }

    /**
     * Get all histograms
     */
    @GetMapping("/all")
    @Operation(summary = "Get histograms for all parameters")
    public ResponseEntity<List<HistogramDTO>> getAllHistograms(
            @RequestParam(defaultValue = "7") int days) {

        return ResponseEntity.ok(histogramService.getAllHistograms(days));
    }
}
