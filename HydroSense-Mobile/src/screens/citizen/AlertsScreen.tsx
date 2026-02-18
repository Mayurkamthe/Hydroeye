import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertService, Alert } from '../../services/alertService';
import { Ionicons } from '@expo/vector-icons';

const CitizenAlerts = () => {
    // --- LOGIC STARTS HERE (Unchanged) ---
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const fetchAlerts = useCallback(async () => {
        try {
            const data = await AlertService.getCitizenAlerts();
            setAlerts(data);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAlerts();
    }, [fetchAlerts]);
    // --- LOGIC ENDS HERE ---

    const renderAlert = ({ item }: { item: Alert }) => {
        const isHighPriority = item.priority === 'HIGH';

        // Dynamic styles based on priority
        const iconName = isHighPriority ? 'warning' : 'alert-circle';
        const iconColor = isHighPriority ? '#E53935' : '#F59E0B'; // Red vs Amber
        const iconBg = isHighPriority ? '#FFEBEE' : '#FFF8E1'; // Light Red vs Light Amber

        return (
            <View style={styles.alertCard}>
                {/* Status Icon */}
                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    <Ionicons name={iconName} size={24} color={iconColor} />
                </View>

                {/* Content */}
                <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                        <Text style={styles.priorityLabel} numberOfLines={1}>
                            {isHighPriority ? 'Critical Alert' : 'Advisory'}
                        </Text>
                        <Text style={styles.alertTime}>
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    </View>

                    <Text style={styles.alertMessage}>{item.message}</Text>

                    <Text style={styles.timeDetail}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4169E1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Recent water quality alerts</Text>
            </View>

            {/* List */}
            <FlatList
                data={alerts}
                renderItem={renderAlert}
                keyExtractor={(item) => item.id.toString()}
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
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="shield-checkmark" size={48} color="#4169E1" />
                        </View>
                        <Text style={styles.emptyText}>All Clear</Text>
                        <Text style={styles.emptySubtext}>No active alerts in your area.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Matching theme
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    listContent: {
        padding: 24,
        paddingTop: 24,
    },
    alertCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f8f8f8',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    alertContent: {
        flex: 1,
        justifyContent: 'center',
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priorityLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    alertTime: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    alertMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        lineHeight: 22,
        marginBottom: 4,
    },
    timeDetail: {
        fontSize: 12,
        color: '#BBB',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        backgroundColor: '#EEF2FF', // Very light blue
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default CitizenAlerts;