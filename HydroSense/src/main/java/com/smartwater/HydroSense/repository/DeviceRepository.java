package com.smartwater.HydroSense.repository;

import com.smartwater.HydroSense.entity.Device;
import com.smartwater.HydroSense.enums.DeviceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByDeviceId(String deviceId);

    List<Device> findByStatus(DeviceStatus status);

    boolean existsByDeviceId(String deviceId);

    List<Device> findAllByOrderByCreatedAtDesc();
}
