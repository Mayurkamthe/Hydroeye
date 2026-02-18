package com.smartwater.HydroSense.repository;

import com.smartwater.HydroSense.entity.Alert;
import com.smartwater.HydroSense.enums.AlertPriority;
import com.smartwater.HydroSense.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    // Find alerts by target role
    List<Alert> findByTargetRoleOrderByCreatedAtDesc(UserRole role);

    // Find unacknowledged alerts by priority
    List<Alert> findByAcknowledgedFalseAndPriorityOrderByCreatedAtDesc(AlertPriority priority);

    // Find alerts by priority and role
    List<Alert> findByPriorityAndTargetRoleOrderByCreatedAtDesc(AlertPriority priority, UserRole role);

    // Find recent alerts within time range
    List<Alert> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    // Find unacknowledged alerts for authorities
    List<Alert> findByTargetRoleAndAcknowledgedFalseOrderByPriorityDescCreatedAtDesc(UserRole role);

    // Count unacknowledged alerts
    Long countByTargetRoleAndAcknowledgedFalse(UserRole role);

    // Find alerts by location
    List<Alert> findByLatitudeBetweenAndLongitudeBetweenOrderByCreatedAtDesc(
            Double latMin, Double latMax, Double lngMin, Double lngMax);
}
