import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Image,
    TouchableOpacity,
    Dimensions,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import QualityCard from '../../components/QualityCard';
import TrendChart from '../../components/TrendChart';
import { WaterService, WaterQualityData, CitizenStatus } from '../../services/waterService';
import { DeviceService, Device } from '../../services/deviceService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const CitizenDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentReading, setCurrentReading] = useState<WaterQualityData | null>(null);
    const [citizenStatus, setCitizenStatus] = useState<CitizenStatus | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [chartData, setChartData] = useState<{ value: number; label: string }[]>([]);

    const fetchData = useCallback(async () => {
        try {
            const [reading, status, history, deviceList] = await Promise.all([
                WaterService.getCurrentStatus(),
                WaterService.getCitizenStatus(),
                WaterService.getHistory(7),
                DeviceService.getDevices(),
            ]);
            setCurrentReading(reading);
            setCitizenStatus(status);
            setDevices(deviceList);

            // Transform history data for the chart
            if (history && history.length > 0) {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const transformedData = history.slice(-7).map((item) => ({
                    value: item.ph,
                    label: days[new Date(item.recordedAt).getDay()],
                }));
                setChartData(transformedData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Get the nearest/first active device for display
    const primaryDevice = devices.find(d => d.status === 'ACTIVE') || devices[0];

    const getMapRegion = () => {
        if (primaryDevice) {
            return {
                latitude: primaryDevice.latitude,
                longitude: primaryDevice.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
        }
        return {
            latitude: 18.5204,
            longitude: 73.8567,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    };

    const getDeviceStatusColor = (status: string): string => {
        switch (status) {
            case 'ACTIVE': return '#4CAF50';
            case 'WARNING': return '#FFA000';
            case 'INACTIVE': return '#D32F2F';
            default: return '#999';
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4169E1" />
            </View>
        );
    }

    const categories = ['All', 'Chemical', 'Physical', 'Biological'];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.greeting}>Good Afternoon</Text>
                        <Text style={styles.username}>{user?.fullName || 'Alex'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search location..."
                        style={styles.searchInput}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity>
                        <Ionicons name="options-outline" size={20} color="#4169E1" />
                    </TouchableOpacity>
                </View>

                {/* Feature Card (Status) */}
                <Text style={styles.sectionTitle}>Current Status</Text>
                <LinearGradient
                    colors={['#4169E1', '#6495ED']} // Royal Blue Gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureCard}
                >
                    <View style={styles.featureCardContent}>
                        <View>
                            <Text style={styles.featureLabel}>Location</Text>
                            <Text style={styles.featureTitle}>{primaryDevice?.location || 'No Station Available'}</Text>

                            <View style={styles.featureRow}>
                                <Ionicons name="calendar-outline" size={16} color="#E3F2FD" />
                                <Text style={styles.featureDate}>Today, {new Date().toLocaleDateString()}</Text>
                            </View>

                            <View style={styles.statusBadge}>
                                <Ionicons
                                    name={citizenStatus?.safetyStatus === 'DANGER' ? 'warning' : 'shield-checkmark'}
                                    size={16}
                                    color={citizenStatus?.safetyStatus === 'DANGER' ? '#C62828' : '#155724'}
                                />
                                <Text style={[
                                    styles.statusText,
                                    { color: citizenStatus?.safetyStatus === 'DANGER' ? '#C62828' : '#155724' }
                                ]}>
                                    {citizenStatus?.safetyStatus === 'DANGER' ? 'Unsafe' : 'Safe to Use'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureIconContainer}>
                            <Ionicons name="water" size={40} color="#fff" />
                        </View>
                    </View>
                </LinearGradient>

                {/* Categories */}
                <Text style={styles.sectionTitle}>Sensor Readings</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryPill, activeCategory === cat && styles.activeCategoryPill]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Sensor Grid */}
                <View style={styles.grid}>
                    <QualityCard
                        label="pH Level"
                        value={currentReading?.ph?.toFixed(1) || '7.2'}
                        unit=""
                        status={citizenStatus?.safetyStatus === 'DANGER' ? 'Danger' : citizenStatus?.safetyStatus === 'WARNING' ? 'Warning' : 'Safe'}
                        iconName="water"
                    />
                    <QualityCard
                        label="Dissolved Oxygen"
                        value={currentReading?.dissolvedOxygen?.toFixed(1) || '8.6'}
                        unit="mg/L"
                        status={citizenStatus?.safetyStatus === 'DANGER' ? 'Danger' : citizenStatus?.safetyStatus === 'WARNING' ? 'Warning' : 'Safe'}
                        iconName="analytics"
                    />
                    <QualityCard
                        label="Turbidity"
                        value={currentReading?.turbidity?.toFixed(1) || '0.6'}
                        unit="NTU"
                        status={citizenStatus?.safetyStatus === 'DANGER' ? 'Danger' : citizenStatus?.safetyStatus === 'WARNING' ? 'Warning' : 'Safe'}
                        iconName="eye"
                    />
                    <QualityCard
                        label="TDS"
                        value={currentReading?.tds?.toFixed(0) || '334'}
                        unit="ppm"
                        status={citizenStatus?.safetyStatus === 'DANGER' ? 'Danger' : citizenStatus?.safetyStatus === 'WARNING' ? 'Warning' : 'Safe'}
                        iconName="flask"
                    />
                </View>

                {/* Chart Section */}
                <Text style={styles.sectionTitle}>Weekly Trend</Text>
                <TrendChart data={chartData} title="pH Level" />

                {/* Map Section */}
                <Text style={styles.sectionTitle}>Live Location</Text>
                <View style={styles.mapCard}>
                    <View style={styles.mapHeader}>
                        <Ionicons name="location" size={20} color="#4169E1" />
                        <Text style={styles.mapLabel}>Monitoring Stations</Text>
                        {devices.length > 0 && (
                            <View style={styles.deviceCountBadge}>
                                <Text style={styles.deviceCountText}>{devices.length} Station{devices.length > 1 ? 's' : ''}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.mapContainer}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={getMapRegion()}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            {devices.map((device) => (
                                <Marker
                                    key={device.id}
                                    coordinate={{ latitude: device.latitude, longitude: device.longitude }}
                                    title={device.name}
                                    description={`${device.location} | Status: ${device.status}`}
                                    pinColor={getDeviceStatusColor(device.status)}
                                />
                            ))}
                        </MapView>
                    </View>
                    <Text style={styles.mapFooterText}>
                        {primaryDevice
                            ? `${primaryDevice.location} (${primaryDevice.latitude.toFixed(4)}° N, ${primaryDevice.longitude.toFixed(4)}° E)`
                            : 'No monitoring station available'}
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Very light grey bg
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    notificationButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5252',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    featureCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    featureCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    featureLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 4,
    },
    featureTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureDate: {
        color: '#E3F2FD',
        marginLeft: 8,
        fontSize: 14,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    featureIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryScroll: {
        marginBottom: 24,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    activeCategoryPill: {
        backgroundColor: '#4169E1',
        borderColor: '#4169E1',
    },
    categoryText: {
        color: '#666',
        fontWeight: '500',
    },
    activeCategoryText: {
        color: '#fff',
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
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
        elevation: 2,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    mapLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginLeft: 8,
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
    mapFooterText: {
        marginTop: 12,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    deviceCountBadge: {
        marginLeft: 'auto',
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
});

export default CitizenDashboard;
