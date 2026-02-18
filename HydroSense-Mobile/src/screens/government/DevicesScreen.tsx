import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DeviceService, Device, CreateDeviceDTO } from '../../services/deviceService';

const DevicesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateDeviceDTO>({
        deviceId: '',
        name: '',
        location: '',
        latitude: 0,
        longitude: 0,
    });

    const fetchDevices = useCallback(async () => {
        try {
            const data = await DeviceService.getDevices();
            setDevices(data);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
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

    const resetForm = () => {
        setFormData({
            deviceId: '',
            name: '',
            location: '',
            latitude: 0,
            longitude: 0,
        });
        setEditingDevice(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (device: Device) => {
        setEditingDevice(device);
        setFormData({
            deviceId: device.deviceId,
            name: device.name,
            location: device.location,
            latitude: device.latitude,
            longitude: device.longitude,
        });
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!formData.deviceId || !formData.name || !formData.location) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            if (editingDevice) {
                await DeviceService.updateDevice(editingDevice.id, formData);
                Alert.alert('Success', 'Device updated successfully');
            } else {
                await DeviceService.addDevice(formData);
                Alert.alert('Success', 'Device added successfully');
            }
            setModalVisible(false);
            resetForm();
            fetchDevices();
        } catch (error) {
            Alert.alert('Error', 'Failed to save device');
        }
    };

    const handleDelete = (device: Device) => {
        Alert.alert(
            'Delete Device',
            `Are you sure you want to delete "${device.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await DeviceService.deleteDevice(device.id);
                            fetchDevices();
                            Alert.alert('Success', 'Device deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete device');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: Device['status']) => {
        switch (status) {
            case 'ACTIVE':
                return '#4CAF50';
            case 'WARNING':
                return '#FFA000';
            case 'INACTIVE':
                return '#F44336';
            default:
                return '#999';
        }
    };

    const renderDevice = ({ item }: { item: Device }) => (
        <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name}</Text>
                    <Text style={styles.deviceId}>{item.deviceId}</Text>
                </View>
                <View style={styles.deviceActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
                        <Ionicons name="pencil" size={18} color="#4169E1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash" size={18} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.deviceDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.location}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        Last reading: {item.lastReading ? new Date(item.lastReading).toLocaleString() : 'N/A'}
                    </Text>
                </View>
            </View>

            <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status}
                </Text>
            </View>
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
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>IoT Devices</Text>
                    <Text style={styles.subtitle}>Manage monitoring stations</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{devices.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                        {devices.filter(d => d.status === 'ACTIVE').length}
                    </Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#FFA000' }]}>
                        {devices.filter(d => d.status === 'WARNING').length}
                    </Text>
                    <Text style={styles.statLabel}>Warning</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statValue, { color: '#F44336' }]}>
                        {devices.filter(d => d.status === 'INACTIVE').length}
                    </Text>
                    <Text style={styles.statLabel}>Inactive</Text>
                </View>
            </View>

            {/* Device List */}
            <FlatList
                data={devices}
                renderItem={renderDevice}
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
                        <Ionicons name="hardware-chip-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No devices registered</Text>
                        <Text style={styles.emptySubtext}>Tap + to add your first device</Text>
                    </View>
                }
            />

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingDevice ? 'Edit Device' : 'Add New Device'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Device ID *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., ESP32-001"
                                value={formData.deviceId}
                                onChangeText={(text) => setFormData({ ...formData, deviceId: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Station A"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Location *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Shaniwar Wada, Pune"
                                value={formData.location}
                                onChangeText={(text) => setFormData({ ...formData, location: text })}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Latitude</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="18.5204"
                                    keyboardType="numeric"
                                    value={formData.latitude ? formData.latitude.toString() : ''}
                                    onChangeText={(text) => setFormData({ ...formData, latitude: parseFloat(text) || 0 })}
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Longitude</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="73.8567"
                                    keyboardType="numeric"
                                    value={formData.longitude ? formData.longitude.toString() : ''}
                                    onChangeText={(text) => setFormData({ ...formData, longitude: parseFloat(text) || 0 })}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>
                                {editingDevice ? 'Update Device' : 'Add Device'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    addButton: {
        width: 48,
        height: 48,
        backgroundColor: '#4169E1',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    listContent: {
        padding: 24,
    },
    deviceCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    deviceId: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    deviceActions: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deviceDetails: {
        paddingLeft: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    formGroup: {
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    submitButton: {
        backgroundColor: '#4169E1',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default DevicesScreen;
