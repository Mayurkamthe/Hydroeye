package com.smartwater.HydroSense.enums;

public enum UserRole {
    SUPER_ADMIN, // Super Admin - can create/manage authority accounts
    AUTHORITY,   // Government authorities - full access to technical data
    CITIZEN      // Citizens - simplified alerts only
}
