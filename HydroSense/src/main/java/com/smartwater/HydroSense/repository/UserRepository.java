package com.smartwater.HydroSense.repository;

import com.smartwater.HydroSense.entity.User;
import com.smartwater.HydroSense.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByRoleAndIsActiveTrue(UserRole role);

    // Find users with device tokens for push notifications
    List<User> findByRoleAndDeviceTokenIsNotNullAndIsActiveTrue(UserRole role);

    // Find all active authorities
    List<User> findByRoleAndIsActiveTrueOrderByFullNameAsc(UserRole role);
}
