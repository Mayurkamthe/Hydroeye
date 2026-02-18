package com.smartwater.HydroSense.service;

import com.smartwater.HydroSense.entity.WaterQualityReading;
import com.smartwater.HydroSense.repository.PollutionEventRepository;
import com.smartwater.HydroSense.repository.WaterQualityReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataRetentionService {

    private final WaterQualityReadingRepository readingRepository;
    private final PollutionEventRepository pollutionEventRepository;

    @Value("${data.retention.days:5}")
    private int retentionDays;

    /**
     * Clean up old data records
     * - Delete records older than retention period
     * - EXCEPT records associated with active pollution events
     */
    @Transactional
    public int cleanupOldData() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);

        log.info("Starting data cleanup. Cutoff date: {}", cutoffDate);

        // Check if there are active pollution events
        boolean hasActivePollution = pollutionEventRepository.existsByIsActiveTrue();

        if (hasActivePollution) {
            log.info("Active pollution event detected. Only cleaning safe data records.");
        }

        // Find old records that are safe to delete
        List<WaterQualityReading> oldRecords = readingRepository.findOldRecordsForDeletion(cutoffDate);

        if (oldRecords.isEmpty()) {
            log.info("No old records found for cleanup.");
            return 0;
        }

        // Soft delete the records
        List<Long> idsToDelete = oldRecords.stream()
                .map(WaterQualityReading::getId)
                .collect(Collectors.toList());

        int deletedCount = readingRepository.softDeleteByIds(idsToDelete);

        log.info("Soft deleted {} records older than {}", deletedCount, cutoffDate);

        return deletedCount;
    }

    /**
     * Get count of records that would be deleted
     */
    public int getRecordsToDeleteCount() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
        return readingRepository.findOldRecordsForDeletion(cutoffDate).size();
    }

    /**
     * Check if cleanup is safe (no active pollution events)
     */
    public boolean isCleanupSafe() {
        return !pollutionEventRepository.existsByIsActiveTrue();
    }

    /**
     * Get current retention period in days
     */
    public int getRetentionDays() {
        return retentionDays;
    }
}
