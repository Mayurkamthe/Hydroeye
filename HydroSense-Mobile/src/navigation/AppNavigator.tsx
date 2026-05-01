import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Citizen Screens
import CitizenDashboard from '../screens/citizen/DashboardScreen';
import CitizenAlerts from '../screens/citizen/AlertsScreen';
import CitizenProfile from '../screens/citizen/ProfileScreen';

// Government (Authority) Screens
import GovernmentDashboard from '../screens/government/DashboardScreen';
import GovernmentAlerts from '../screens/government/AlertsScreen';
import GovernmentProfile from '../screens/government/ProfileScreen';
import GovernmentDevices from '../screens/government/DevicesScreen';

// Super Admin Screens
import ManageAuthoritiesScreen from '../screens/superadmin/ManageAuthoritiesScreen';
import SuperAdminProfileScreen from '../screens/superadmin/ProfileScreen';
import ManageDevicesScreen from '../screens/superadmin/ManageDevicesScreen';

const AuthStack = createStackNavigator();
const CitizenTabs = createBottomTabNavigator();
const GovernmentTabs = createBottomTabNavigator();
const SuperAdminTabs = createBottomTabNavigator();

const tabBarStyle = {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    backgroundColor: '#fff',
};

const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
        <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
);

const CitizenNavigator = () => (
    <CitizenTabs.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'home';
                if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
                else if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4169E1',
            tabBarInactiveTintColor: '#999',
            tabBarStyle,
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
            headerShown: false,
        })}
    >
        <CitizenTabs.Screen name="Dashboard" component={CitizenDashboard} />
        <CitizenTabs.Screen name="Alerts" component={CitizenAlerts} />
        <CitizenTabs.Screen name="Profile" component={CitizenProfile} />
    </CitizenTabs.Navigator>
);

const GovernmentNavigator = () => (
    <GovernmentTabs.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'home';
                if (route.name === 'Dashboard') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                else if (route.name === 'Devices') iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
                else if (route.name === 'Alerts') iconName = focused ? 'warning' : 'warning-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4169E1',
            tabBarInactiveTintColor: '#999',
            tabBarStyle,
            headerShown: false,
        })}
    >
        <GovernmentTabs.Screen name="Dashboard" component={GovernmentDashboard} />
        <GovernmentTabs.Screen name="Devices" component={GovernmentDevices} />
        <GovernmentTabs.Screen name="Alerts" component={GovernmentAlerts} />
        <GovernmentTabs.Screen name="Profile" component={GovernmentProfile} />
    </GovernmentTabs.Navigator>
);

const SuperAdminNavigator = () => (
    <SuperAdminTabs.Navigator
        screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'people';
                if (route.name === 'Authorities') iconName = focused ? 'people' : 'people-outline';
                else if (route.name === 'Devices') iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
                else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
                return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#1a1a1a',
            tabBarInactiveTintColor: '#999',
            tabBarStyle,
            headerShown: false,
        })}
    >
        <SuperAdminTabs.Screen name="Authorities" component={ManageAuthoritiesScreen} />
        <SuperAdminTabs.Screen name="Devices" component={ManageDevicesScreen} />
        <SuperAdminTabs.Screen name="Profile" component={SuperAdminProfileScreen} />
    </SuperAdminTabs.Navigator>
);

const AppNavigator = () => {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0077B6' }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {!isAuthenticated ? (
                <AuthNavigator />
            ) : user?.role === 'SUPER_ADMIN' ? (
                <SuperAdminNavigator />
            ) : user?.role === 'AUTHORITY' ? (
                <GovernmentNavigator />
            ) : (
                <CitizenNavigator />
            )}
        </NavigationContainer>
    );
};

export default AppNavigator;
