import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Alert as RNAlert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertService, Alert } from '../../services/alertService';
import { Ionicons } from '@expo/vector-icons';

const GovernmentAlerts = () => {
    // --- LOGIC STARTS HERE (Unchanged) ---
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all');

    const fetchAlerts = useCallback(async () => {
        try {
            const data = filter === 'unacknowledged'
                ? await AlertService.getUnacknowledgedAlerts()
                : await AlertService.getAuthorityAlerts();
            setAlerts(data);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAlerts();
    }, [fetchAlerts]);

    const handleAcknowledge = async (id: number) => {
        RNAlert.alert('Acknowledge Alert', 'Are you sure you want to acknowledge this alert?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Acknowledge',
                onPress: async () => {
                    try {
                        await AlertService.acknowledgeAlert(id);
                        fetchAlerts();
                    } catch (error) {
                        RNAlert.alert('Error', 'Failed to acknowledge alert');
                    }
                },
            },
        ]);
    };
    // --- LOGIC ENDS HERE ---

    const renderAlert = ({ item }: { item: Alert }) => {
        const isHigh = item.priority === 'HIGH';
        const isRecovery = !!item.isRecoveryAlert || item.priority === 'LOW';
        const isAcknowledged = !!item.acknowledged;

        const badgeColor = isRecovery ? '#E8F5E9' : isHigh ? '#FFEBEE' : '#FFF3E0';
        const textColor = isRecovery ? '#388E3C' : isHigh ? '#D32F2F' : '#F57C00';
        const iconName: keyof typeof Ionicons.glyphMap = isRecovery
            ? 'checkmark-circle'
            : isHigh ? 'warning' : 'alert-circle';

        return (
            <View style={styles.alertCard}>
                <View style={styles.cardHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: badgeColor }]}>
                        <Ionicons
                            name={iconName}
                            size={14}
                            color={textColor}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.priorityText, { color: textColor }]}>
                            {isRecovery ? 'RECOVERY' : item.priority}
                        </Text>
                    </View>
                    <Text style={styles.alertTime}>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                </View>

                {item.deviceId && (
                    <View style={styles.deviceChip}>
                        <Ionicons name="hardware-chip-outline" size={12} color="#4169E1" />
                        <Text style={styles.deviceChipText}>Device: {item.deviceId}</Text>
                    </View>
                )}

                <Text style={styles.alertMessage}>{item.message}</Text>

                {item.technicalDetails && (
                    <View style={styles.techDetailsContainer}>
                        <Text style={styles.techDetailsLabel}>Technical Data:</Text>
                        <Text style={styles.technicalDetails} numberOfLines={2}>{item.technicalDetails}</Text>
                    </View>
                )}

                <View style={styles.cardFooter}>
                    {!isAcknowledged ? (
                        <TouchableOpacity style={styles.acknowledgeButton} onPress={() => handleAcknowledge(item.id)}>
                            <Text style={styles.acknowledgeText}>Acknowledge</Text>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.acknowledgedContainer}>
                            <Ionicons name="checkmark-done-circle" size={20} color="#388E3C" />
                            <Text style={styles.acknowledgedText}>
                                Acknowledged by {item.acknowledgedByName}
                            </Text>
                        </View>
                    )}
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
                <Text style={styles.headerTitle}>Authority Alerts</Text>
                <Text style={styles.headerSubtitle}>Monitor and respond to critical incidents</Text>
            </View>

            {/* Filter Pills */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All Alerts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'unacknowledged' && styles.filterActive]}
                    onPress={() => setFilter('unacknowledged')}
                >
                    <Text style={[styles.filterText, filter === 'unacknowledged' && styles.filterTextActive]}>Pending Action</Text>
                </TouchableOpacity>
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
                        <Text style={styles.emptyText}>No Alerts Found</Text>
                        <Text style={styles.emptySubtext}>
                            {filter === 'unacknowledged' ? "No pending actions required." : "System is running normally."}
                        </Text>
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
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        gap: 12,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    filterActive: {
        backgroundColor: '#4169E1',
        borderColor: '#4169E1',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 24,
    },
    alertCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f8f8f8',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeHigh: {
        backgroundColor: '#FFEBEE',
    },
    badgeMedium: {
        backgroundColor: '#FFF3E0',
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    textHigh: {
        color: '#D32F2F',
    },
    textMedium: {
        color: '#EF6C00',
    },
    deviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 8,
        gap: 4,
    },
    deviceChipText: {
        fontSize: 12,
        color: '#4169E1',
        fontWeight: '600',
    },
    alertTime: {
        fontSize: 12,
        color: '#999',
    },
    alertMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        lineHeight: 22,
        marginBottom: 12,
    },
    techDetailsContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    techDetailsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    technicalDetails: {
        fontSize: 13,
        color: '#444',
        fontFamily: 'monospace',
    },
    cardFooter: {
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 16,
    },
    acknowledgeButton: {
        flexDirection: 'row',
        backgroundColor: '#4169E1',
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    acknowledgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    acknowledgedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 10,
        borderRadius: 12,
    },
    acknowledgedText: {
        color: '#2E7D32',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        backgroundColor: '#EEF2FF',
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

export default GovernmentAlerts;