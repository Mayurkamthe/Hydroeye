import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WaterService, WaterQualityData, DeviceStatusMap, WaterQualityStatus } from '../../services/waterService';

type StatusFilter = 'ALL' | 'SAFE' | 'UNSAFE';

const DevicesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deviceStatusMap, setDeviceStatusMap] = useState<DeviceStatusMap>({});
    const [filter, setFilter] = useState<StatusFilter>('ALL');

    const fetchDevices = useCallback(async () => {
        try {
            const data = await WaterService.getAllDevicesStatus();
            setDeviceStatusMap(data);
        } catch (error) {
            console.error('Failed to fetch device statuses:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDevices();
    }, [fetchDevices]);

    const allDevices = Object.entries(deviceStatusMap).map(([deviceId, data]) => ({
        deviceId,
        ...data,
    }));

    const filteredDevices = allDevices.filter((d) => {
        if (filter === 'ALL') return true;
        return d.status === filter;
    });

    const safeCount = allDevices.filter((d) => d.status === 'SAFE').length;
    const unsafeCount = allDevices.filter((d) => d.status === 'UNSAFE').length;

    const getStatusColor = (status: WaterQualityStatus) =>
        status === 'SAFE' ? '#4CAF50' : '#D32F2F';

    const getStatusBg = (status: WaterQualityStatus) =>
        status === 'SAFE' ? '#E8F5E9' : '#FFEBEE';

    const getStatusIcon = (status: WaterQualityStatus): keyof typeof Ionicons.glyphMap =>
        status === 'SAFE' ? 'checkmark-circle' : 'warning';

    const renderDevice = ({ item }: { item: WaterQualityData & { deviceId: string } }) => (
        <View style={[styles.deviceCard, { borderLeftColor: getStatusColor(item.status), borderLeftWidth: 4 }]}>
            <View style={styles.deviceHeader}>
                <View style={[styles.statusIcon, { backgroundColor: getStatusBg(item.status) }]}>
                    <Ionicons name={getStatusIcon(item.status)} size={22} color={getStatusColor(item.status)} />
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceId}>{item.deviceId}</Text>
                    <Text style={styles.deviceTime}>
                        Last update: {item.recordedAt
                            ? new Date(item.recordedAt).toLocaleString([], {
                                  month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                              })
                            : 'N/A'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.paramsGrid}>
                <View style={styles.paramItem}>
                    <Text style={styles.paramLabel}>pH</Text>
                    <Text style={styles.paramValue}>{item.ph?.toFixed(2) ?? '--'}</Text>
                </View>
                <View style={styles.paramItem}>
                    <Text style={styles.paramLabel}>Temp</Text>
                    <Text style={styles.paramValue}>{item.temperature?.toFixed(1) ?? '--'}°C</Text>
                </View>
                <View style={styles.paramItem}>
                    <Text style={styles.paramLabel}>TDS</Text>
                    <Text style={styles.paramValue}>{item.tds?.toFixed(0) ?? '--'} ppm</Text>
                </View>
                <View style={styles.paramItem}>
                    <Text style={styles.paramLabel}>Turbidity</Text>
                    <Text style={styles.paramValue}>{item.turbidity?.toFixed(1) ?? '--'} NTU</Text>
                </View>
            </View>

            {item.approachingUnsafe && item.status === 'SAFE' && (
                <View style={styles.warningBanner}>
                    <Ionicons name="alert-circle-outline" size={14} color="#F57C00" />
                    <Text style={styles.warningText}>Parameters approaching unsafe limits</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4169E1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Device Monitor</Text>
                <Text style={styles.subtitle}>Real-time per-device SAFE / UNSAFE status</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{allDevices.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>{safeCount}</Text>
                    <Text style={styles.statLabel}>Safe</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#D32F2F' }]}>{unsafeCount}</Text>
                    <Text style={styles.statLabel}>Unsafe</Text>
                </View>
            </View>

            <View style={styles.filterRow}>
                {(['ALL', 'SAFE', 'UNSAFE'] as StatusFilter[]).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                            {f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredDevices}
                renderItem={renderDevice}
                keyExtractor={(item) => item.deviceId}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#4169E1"
                        colors={['#4169E1']}
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="hardware-chip-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>
                            {filter === 'ALL' ? 'No device data received yet' : `No ${filter} devices`}
                        </Text>
                        <Text style={styles.emptySubtext}>Data appears once devices send readings</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: { fontSize: 26, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    statCard: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
    statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    filterTabActive: { backgroundColor: '#EEF2FF' },
    filterTabText: { fontSize: 13, fontWeight: '600', color: '#999' },
    filterTabTextActive: { color: '#4169E1' },
    listContent: { padding: 20 },
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    deviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    statusIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deviceInfo: { flex: 1 },
    deviceId: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    deviceTime: { fontSize: 12, color: '#999', marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    paramsGrid: {
        flexDirection: 'row',
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 12,
    },
    paramItem: { flex: 1, alignItems: 'center' },
    paramLabel: { fontSize: 11, color: '#999', marginBottom: 4 },
    paramValue: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginTop: 10,
    },
    warningText: { fontSize: 12, color: '#F57C00', marginLeft: 6, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 17, fontWeight: 'bold', color: '#333', marginTop: 16 },
    emptySubtext: { fontSize: 13, color: '#999', marginTop: 4, textAlign: 'center' },
});

export default DevicesScreen;
