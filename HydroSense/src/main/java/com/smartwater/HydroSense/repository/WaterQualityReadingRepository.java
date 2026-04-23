package com.smartwater.HydroSense.repository;

import com.smartwater.HydroSense.entity.WaterQualityReading;
import com.smartwater.HydroSense.enums.WaterQualityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaterQualityReadingRepository extends JpaRepository<WaterQualityReading, Long> {

    // Get the most recent reading
    Optional<WaterQualityReading> findTopByIsDeletedFalseOrderByRecordedAtDesc();

    // Get readings within a time range
    List<WaterQualityReading> findByRecordedAtBetweenAndIsDeletedFalseOrderByRecordedAtDesc(
            LocalDateTime start, LocalDateTime end);

    // Get readings by status
    List<WaterQualityReading> findByStatusAndIsDeletedFalseOrderByRecordedAtDesc(WaterQualityStatus status);

    // Get readings for a specific location (within radius)
    @Query("SELECT r FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND (6371 * acos(cos(radians(:lat)) * cos(radians(r.latitude)) * " +
            "cos(radians(r.longitude) - radians(:lng)) + sin(radians(:lat)) * " +
            "sin(radians(r.latitude)))) <= :radius " +
            "ORDER BY r.recordedAt DESC")
    List<WaterQualityReading> findByLocationWithinRadius(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radius") Double radiusInKm);

    // Get old records not part of active pollution event for deletion
    @Query("SELECT r FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt < :cutoffDate " +
            "AND (r.pollutionEvent IS NULL OR r.pollutionEvent.isActive = false)")
    List<WaterQualityReading> findOldRecordsForDeletion(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Soft delete old records
    @Modifying
    @Query("UPDATE WaterQualityReading r SET r.isDeleted = true WHERE r.id IN :ids")
    int softDeleteByIds(@Param("ids") List<Long> ids);

    // Get readings for histogram generation
    @Query("SELECT r FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt >= :since ORDER BY r.recordedAt")
    List<WaterQualityReading> findReadingsForHistogram(@Param("since") LocalDateTime since);

    // Get all pH values for histogram
    @Query("SELECT r.ph FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt >= :since")
    List<Double> findPhValuesForHistogram(@Param("since") LocalDateTime since);

    // Get all TDS values for histogram
    @Query("SELECT r.tds FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt >= :since")
    List<Double> findTdsValuesForHistogram(@Param("since") LocalDateTime since);

    // Get all turbidity values for histogram
    @Query("SELECT r.turbidity FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt >= :since")
    List<Double> findTurbidityValuesForHistogram(@Param("since") LocalDateTime since);

    // Get all temperature values for histogram
    @Query("SELECT r.temperature FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt >= :since")
    List<Double> findTemperatureValuesForHistogram(@Param("since") LocalDateTime since);

    // Get all DO values for histogram
    @Query("SELECT r.dissolvedOxygen FROM WaterQualityReading r WHERE r.isDeleted = false " +
            "AND r.recordedAt >= :since")
    List<Double> findDissolvedOxygenValuesForHistogram(@Param("since") LocalDateTime since);

    // Count readings by status in time range
    Long countByStatusAndRecordedAtBetweenAndIsDeletedFalse(
            WaterQualityStatus status, LocalDateTime start, LocalDateTime end);

    // -------------------------------------------------------------------------
    // Device-based and status-based segregation queries
    // -------------------------------------------------------------------------

    // Get all readings for a specific device (device-wise segregation)
    List<WaterQualityReading> findByDeviceIdAndIsDeletedFalseOrderByRecordedAtDesc(String deviceId);

    // Get the most recent reading for a specific device
    Optional<WaterQualityReading> findTopByDeviceIdAndIsDeletedFalseOrderByRecordedAtDesc(String deviceId);

    // Get readings for a specific device filtered by status (device + status segregation)
    List<WaterQualityReading> findByDeviceIdAndStatusAndIsDeletedFalseOrderByRecordedAtDesc(
            String deviceId, WaterQualityStatus status);

    // Get readings for a specific device within a time range
    List<WaterQualityReading> findByDeviceIdAndRecordedAtBetweenAndIsDeletedFalseOrderByRecordedAtDesc(
            String deviceId, LocalDateTime start, LocalDateTime end);

    // Get all distinct active device IDs
    @Query("SELECT DISTINCT r.deviceId FROM WaterQualityReading r WHERE r.isDeleted = false AND r.deviceId IS NOT NULL")
    List<String> findAllActiveDeviceIds();

    // Alias for findAllActiveDeviceIds (used in device overview)
    @Query("SELECT DISTINCT r.deviceId FROM WaterQualityReading r WHERE r.isDeleted = false AND r.deviceId IS NOT NULL")
    List<String> findDistinctDeviceIds();
}
