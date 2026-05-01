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
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DeviceService, Device, CreateDeviceDTO } from '../../services/deviceService';

const EMPTY_FORM: CreateDeviceDTO = {
    deviceId: '',
    name: '',
    location: '',
    latitude: 0,
    longitude: 0,
};

const ManageDevicesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [devices, setDevices] = useState<Device[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateDeviceDTO>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchDevices = useCallback(async (force = false) => {
        try {
            const data = await DeviceService.getDevices();
            setDevices(data);
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            Alert.alert('Error', 'Failed to load devices. Please try again.');
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

    const openAddModal = () => {
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setModalVisible(true);
    };

    const openEditModal = (device: Device) => {
        setEditingId(device.id);
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
        if (!formData.deviceId.trim() || !formData.name.trim() || !formData.location.trim()) {
            Alert.alert('Validation Error', 'Device ID, Name, and Location are required.');
            return;
        }
        const lat = Number(formData.latitude);
        const lng = Number(formData.longitude);
        if (isNaN(lat) || isNaN(lng)) {
            Alert.alert('Validation Error', 'Latitude and Longitude must be valid numbers.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = { ...formData, latitude: lat, longitude: lng };
            if (editingId !== null) {
                await DeviceService.updateDevice(editingId, payload);
                Alert.alert('Success', 'Device updated successfully.');
            } else {
                await DeviceService.addDevice(payload);
                Alert.alert('Success', 'Device added successfully.');
            }
            setModalVisible(false);
            fetchDevices();
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Operation failed. Please try again.';
            Alert.alert('Error', msg);
        } finally {
            setSubmitting(false);
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
                            setDevices((prev) => prev.filter((d) => d.id !== device.id));
                        } catch {
                            Alert.alert('Error', 'Failed to delete device.');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: Device['status']) => {
        if (status === 'ACTIVE') return '#4CAF50';
        if (status === 'WARNING') return '#F57C00';
        return '#9E9E9E';
    };

    const renderDevice = ({ item }: { item: Device }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>{item.deviceId}</Text>
                    <Text style={styles.cardLocation}>{item.location}</Text>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionBtn}>
                        <Ionicons name="pencil" size={18} color="#4169E1" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                        <Ionicons name="trash" size={18} color="#D32F2F" />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.coordRow}>
                <Text style={styles.coordText}>
                    {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a1a" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Manage Devices</Text>
                    <Text style={styles.subtitle}>{devices.length} device{devices.length !== 1 ? 's' : ''} registered</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a1a" />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="hardware-chip-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No devices registered</Text>
                        <Text style={styles.emptySubtext}>Tap + to add a new device</Text>
                    </View>
                }
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingId !== null ? 'Edit Device' : 'Add New Device'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {[
                                { label: 'Device ID *', key: 'deviceId', placeholder: 'e.g. ESP32_001', editable: editingId === null },
                                { label: 'Name *', key: 'name', placeholder: 'e.g. Pump Station A' },
                                { label: 'Location *', key: 'location', placeholder: 'e.g. Zone 3, North Wing' },
                                { label: 'Latitude', key: 'latitude', placeholder: 'e.g. 16.7050', keyboard: 'numeric' },
                                { label: 'Longitude', key: 'longitude', placeholder: 'e.g. 74.2433', keyboard: 'numeric' },
                            ].map(({ label, key, placeholder, editable = true, keyboard }) => (
                                <View style={styles.field} key={key}>
                                    <Text style={styles.fieldLabel}>{label}</Text>
                                    <TextInput
                                        style={[styles.input, !editable && styles.inputDisabled]}
                                        placeholder={placeholder}
                                        value={String((formData as any)[key])}
                                        onChangeText={(v) => setFormData((p) => ({ ...p, [key]: v }))}
                                        keyboardType={(keyboard as any) || 'default'}
                                        editable={editable}
                                        autoCapitalize="none"
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {editingId !== null ? 'Update Device' : 'Add Device'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
    addBtn: {
        backgroundColor: '#1a1a1a',
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: { padding: 20, flexGrow: 1 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12, marginTop: 2 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    cardSub: { fontSize: 12, color: '#888', marginTop: 1 },
    cardLocation: { fontSize: 12, color: '#666', marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 6 },
    coordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    coordText: { fontSize: 12, color: '#aaa' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyText: { fontSize: 17, fontWeight: 'bold', color: '#333', marginTop: 16 },
    emptySubtext: { fontSize: 13, color: '#999', marginTop: 4 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    field: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1a1a1a',
        backgroundColor: '#FAFAFA',
    },
    inputDisabled: { backgroundColor: '#F0F0F0', color: '#999' },
    submitBtn: {
        backgroundColor: '#1a1a1a',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ManageDevicesScreen;
