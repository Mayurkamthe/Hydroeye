package com.smartwater.HydroSense.scheduler;

import com.smartwater.HydroSense.service.DataRetentionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class DataCleanupScheduler {

    private final DataRetentionService dataRetentionService;

    /**
     * Run daily at midnight to clean up old data
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupOldData() {
        log.info("Starting scheduled data cleanup...");

        try {
            int deletedCount = dataRetentionService.cleanupOldData();
            log.info("Scheduled cleanup completed. Deleted {} records.", deletedCount);
        } catch (Exception e) {
            log.error("Error during scheduled data cleanup", e);
        }
    }

    /**
     * Run every hour to check data retention health
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkRetentionStatus() {
        int pendingDeletion = dataRetentionService.getRecordsToDeleteCount();
        boolean isSafe = dataRetentionService.isCleanupSafe();

        log.info("Retention check - Records pending deletion: {}, Cleanup safe: {}",
                pendingDeletion, isSafe);
    }
}
