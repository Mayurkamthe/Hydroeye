import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Note: Assuming Header is a custom component, but we will style a local header 
// to ensure consistency with the new theme.
// import Header from '../../components/Header'; 
import QualityCard from '../../components/QualityCard';
import TrendChart from '../../components/TrendChart';
import { WaterService, WaterQualityData } from '../../services/waterService';
import { AlertService } from '../../services/alertService';
import { DeviceService, Device } from '../../services/deviceService';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const GovernmentDashboard = () => {
    // --- LOGIC STARTS HERE (Unchanged) ---
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentReading, setCurrentReading] = useState<WaterQualityData | null>(null);
    const [historyData, setHistoryData] = useState<WaterQualityData[]>([]);
    const [alertCount, setAlertCount] = useState(0);
    const [devices, setDevices] = useState<Device[]>([]);
    const [viewMode, setViewMode] = useState<'Chart' | 'Table'>('Chart');

    const fetchData = useCallback(async () => {
        try {
            const [reading, history, count, deviceList] = await Promise.all([
                WaterService.getCurrentStatus(),
                WaterService.getHistory(5),
                AlertService.getAlertCount(),
                DeviceService.getDevices(),
            ]);
            setCurrentReading(reading);
            setHistoryData(history);
            setAlertCount(count);
            setDevices(deviceList);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const getStatus = (val: number | undefined, min: number, max: number): 'Safe' | 'Warning' | 'Danger' => {
        if (val === undefined) return 'Safe';
        if (val < min * 0.9 || val > max * 1.1) return 'Danger';
        if (val < min || val > max) return 'Warning';
        return 'Safe';
    };

    const trendData = historyData.slice(0, 5).reverse().map((item) => ({
        value: item.ph,
        label: new Date(item.recordedAt).toLocaleDateString('en-US', { weekday: 'short' }),
    }));

    const getDeviceStatusColor = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return '#4CAF50';
            case 'WARNING': return '#FFA000';
            case 'INACTIVE': return '#D32F2F';
            default: return '#999';
        }
    };

    const activeDeviceCount = devices.filter(d => d.status === 'ACTIVE').length;
    const warningDeviceCount = devices.filter(d => d.status === 'WARNING').length;

    const getDeviceCountText = (): string => {
        if (devices.length === 0) return 'No Devices';
        if (warningDeviceCount > 0) return `${activeDeviceCount} Active, ${warningDeviceCount} Warning`;
        return `${activeDeviceCount} Active`;
    };

    const getMapRegion = () => {
        if (devices.length === 0) {
            return {
                latitude: 18.5204,
                longitude: 73.8567,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            };
        }
        const avgLat = devices.reduce((sum, d) => sum + d.latitude, 0) / devices.length;
        const avgLng = devices.reduce((sum, d) => sum + d.longitude, 0) / devices.length;
        return {
            latitude: avgLat,
            longitude: avgLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        };
    };
    // --- LOGIC ENDS HERE ---

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4169E1" />
                <Text style={styles.loadingText}>Syncing data...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Custom Styled Header for Consistency */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Authority Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Real-time monitoring & analytics</Text>
                </View>
                <TouchableOpacity style={styles.profileButton}>
                    <Ionicons name="person-circle-outline" size={36} color="#4169E1" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#4169E1"
                        colors={['#4169E1']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Alert Banner */}
                {alertCount > 0 && (
                    <TouchableOpacity style={styles.alertBanner}>
                        <View style={styles.alertIconContainer}>
                            <Ionicons name="warning" size={24} color="#D32F2F" />
                        </View>
                        <View style={styles.alertTextContainer}>
                            <Text style={styles.alertTitle}>Action Required</Text>
                            <Text style={styles.alertSubtitle}>{alertCount} unacknowledged critical alert(s)</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                )}

                {/* Section Title */}
                <Text style={styles.sectionTitle}>Live Sensor Readings</Text>

                {/* Quality Cards Grid */}
                <View style={styles.grid}>
                    <QualityCard
                        label="pH Level"
                        value={currentReading?.ph?.toFixed(2) || '--'}
                        unit=""
                        status={getStatus(currentReading?.ph, 6.5, 8.5)}
                        iconName="water"
                    />
                    <QualityCard
                        label="Temperature"
                        value={currentReading?.temperature?.toFixed(1) || '--'}
                        unit="°C"
                        status={getStatus(currentReading?.temperature, 0, 35)}
                        iconName="thermometer"
                    />
                    <QualityCard
                        label="Turbidity"
                        value={currentReading?.turbidity?.toFixed(2) || '--'}
                        unit="NTU"
                        status={getStatus(currentReading?.turbidity, 0, 5)}
                        iconName="eye"
                    />
                    <QualityCard
                        label="TDS"
                        value={currentReading?.tds?.toFixed(0) || '--'}
                        unit="ppm"
                        status={getStatus(currentReading?.tds, 0, 500)}
                        iconName="flask"
                    />
                </View>

                {/* Analytics Section */}
                <View style={styles.analyticsHeader}>
                    <Text style={styles.sectionTitle}>Analytics</Text>

                    {/* Toggle Switch */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, viewMode === 'Chart' && styles.toggleActive]}
                            onPress={() => setViewMode('Chart')}
                        >
                            <Ionicons name="stats-chart" size={16} color={viewMode === 'Chart' ? '#4169E1' : '#999'} style={{ marginRight: 4 }} />
                            <Text style={[styles.toggleText, viewMode === 'Chart' && styles.toggleTextActive]}>Chart</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, viewMode === 'Table' && styles.toggleActive]}
                            onPress={() => setViewMode('Table')}
                        >
                            <Ionicons name="list" size={16} color={viewMode === 'Table' ? '#4169E1' : '#999'} style={{ marginRight: 4 }} />
                            <Text style={[styles.toggleText, viewMode === 'Table' && styles.toggleTextActive]}>Table</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content View */}
                {viewMode === 'Chart' ? (
                    <View style={styles.chartCard}>
                        <TrendChart
                            data={trendData.length > 0 ? trendData : [{ value: 0, label: 'No Data' }]}
                            title="pH Trend (Last 5 Readings)"
                        />
                    </View>
                ) : (
                    <View style={styles.tableCard}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeadText, { flex: 1.5 }]}>Time</Text>
                            <Text style={styles.tableHeadText}>pH</Text>
                            <Text style={styles.tableHeadText}>Temp</Text>
                            <Text style={styles.tableHeadText}>TDS</Text>
                        </View>

                        {/* Table Rows */}
                        {historyData.slice(0, 10).map((log, index) => (
                            <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowAlt : null]}>
                                <Text style={[styles.tableText, styles.tableTimeText]}>
                                    {new Date(log.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.tableTextBold}>{log.ph?.toFixed(1)}</Text>
                                </View>
                                <Text style={styles.tableText}>{log.temperature?.toFixed(1)}</Text>
                                <Text style={styles.tableText}>{log.tds?.toFixed(0)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Device Locations Section */}
                <Text style={styles.sectionTitle}>Device Locations</Text>
                <View style={styles.mapCard}>
                    <View style={styles.mapHeader}>
                        <View style={styles.mapHeaderLeft}>
                            <Ionicons name="location" size={20} color="#4169E1" />
                            <Text style={styles.mapLabel}>Monitoring Stations</Text>
                        </View>
                        <View style={[styles.deviceCountBadge, warningDeviceCount > 0 && styles.deviceCountBadgeWarning]}>
                            <Text style={[styles.deviceCountText, warningDeviceCount > 0 && styles.deviceCountTextWarning]}>
                                {getDeviceCountText()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.mapContainer}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={getMapRegion()}
                        >
                            {devices.map((device) => (
                                <Marker
                                    key={device.id}
                                    coordinate={{ latitude: device.latitude, longitude: device.longitude }}
                                    title={`${device.name} - ${device.location}`}
                                    description={`Status: ${device.status}${device.lastReading ? ` | Last: ${new Date(device.lastReading).toLocaleTimeString()}` : ''}`}
                                    pinColor={getDeviceStatusColor(device.status)}
                                />
                            ))}
                        </MapView>
                    </View>
                    {/* Device List */}
                    <View style={styles.deviceList}>
                        {devices.length === 0 ? (
                            <Text style={styles.noDevicesText}>No devices registered yet</Text>
                        ) : (
                            devices.map((device) => (
                                <View key={device.id} style={styles.deviceItem}>
                                    <View style={[styles.statusDot, { backgroundColor: getDeviceStatusColor(device.status) }]} />
                                    <Text style={styles.deviceName}>{device.name}</Text>
                                    <Text style={styles.deviceLocation}>{device.location}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Theme Background
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    profileButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 8,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE', // Soft Red
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    alertIconContainer: {
        marginRight: 12,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 12,
    },
    alertTextContainer: {
        flex: 1,
    },
    alertTitle: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2,
    },
    alertSubtitle: {
        color: '#B71C1C',
        fontSize: 13,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    analyticsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 4,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    toggleActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
    },
    toggleTextActive: {
        color: '#4169E1',
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    tableCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4169E1',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    tableHeadText: {
        flex: 1,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: '#FAFAFA',
    },
    tableText: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontSize: 14,
    },
    tableTimeText: {
        flex: 1.5,
        color: '#666',
        fontSize: 13,
    },
    tableTextBold: {
        fontWeight: 'bold',
        color: '#4169E1',
    },
    badgeContainer: {
        flex: 1,
        alignItems: 'center',
    },
    mapCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    mapHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mapLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginLeft: 8,
    },
    deviceCountBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    deviceCountText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    mapContainer: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    deviceList: {
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    deviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    deviceLocation: {
        fontSize: 12,
        color: '#999',
    },
    deviceCountBadgeWarning: {
        backgroundColor: '#FFF3E0',
    },
    deviceCountTextWarning: {
        color: '#FFA000',
    },
    noDevicesText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 16,
    },
});

export default GovernmentDashboard;