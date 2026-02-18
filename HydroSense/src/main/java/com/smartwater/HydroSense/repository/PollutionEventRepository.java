package com.smartwater.HydroSense.repository;

import com.smartwater.HydroSense.entity.PollutionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PollutionEventRepository extends JpaRepository<PollutionEvent, Long> {

    // Find active pollution events
    List<PollutionEvent> findByIsActiveTrueOrderByStartTimeDesc();

    // Find the most recent active event
    Optional<PollutionEvent> findTopByIsActiveTrueOrderByStartTimeDesc();

    // Check if there are any active pollution events
    Boolean existsByIsActiveTrue();

    // Find resolved events within time range
    List<PollutionEvent> findByIsActiveFalseAndEndTimeBetweenOrderByEndTimeDesc(
            LocalDateTime start, LocalDateTime end);

    // Find all events ordered by start time
    List<PollutionEvent> findAllByOrderByStartTimeDesc();

    // Find events by location
    List<PollutionEvent> findByInitialLatitudeBetweenAndInitialLongitudeBetweenOrderByStartTimeDesc(
            Double latMin, Double latMax, Double lngMin, Double lngMax);
}
