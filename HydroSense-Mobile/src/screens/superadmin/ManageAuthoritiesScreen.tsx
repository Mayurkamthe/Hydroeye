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
import { AuthService, UserInfo, RegisterRequest } from '../../services/authService';

const ManageAuthoritiesScreen = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [authorities, setAuthorities] = useState<UserInfo[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const hasFetched = React.useRef(false);

    const [formData, setFormData] = useState<RegisterRequest>({
        fullName: '',
        email: '',
        password: '',
        organization: '',
        designation: '',
        role: 'AUTHORITY',
    });

    const fetchAuthorities = useCallback(async (force = false) => {
        if (!force && hasFetched.current) return; // skip redundant fetches
        try {
            const data = await AuthService.listAuthorityUsers();
            setAuthorities(data);
            hasFetched.current = true;
        } catch (error) {
            console.error('Failed to fetch authorities:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAuthorities();
    }, [fetchAuthorities]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAuthorities(true); // force refetch on pull-to-refresh
    }, [fetchAuthorities]);

    const resetForm = () => {
        setFormData({
            fullName: '',
            email: '',
            password: '',
            organization: '',
            designation: '',
            role: 'AUTHORITY',
        });
    };

    const handleCreate = async () => {
        if (!formData.fullName || !formData.email || !formData.password) {
            Alert.alert('Error', 'Name, email, and password are required.');
            return;
        }
        if (formData.password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        setSubmitting(true);
        try {
            const response = await AuthService.createAuthorityAccount(formData);
            // Update list locally — no extra API call needed
            setAuthorities((prev) => [...prev, response.user]);
            Alert.alert('Success', `Authority account created for ${formData.fullName}.`);
            setModalVisible(false);
            resetForm();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create account.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeactivate = (user: UserInfo) => {
        Alert.alert(
            'Deactivate Account',
            `Deactivate account for "${user.fullName}"? They will no longer be able to log in.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AuthService.deactivateUser(user.id);
                            // Remove from list locally — no extra API call needed
                            setAuthorities((prev) => prev.filter((a) => a.id !== user.id));
                            Alert.alert('Done', 'Account deactivated successfully.');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to deactivate account.');
                        }
                    },
                },
            ]
        );
    };

    const renderAuthority = ({ item }: { item: UserInfo }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                        {item.fullName.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.fullName}</Text>
                    <Text style={styles.cardEmail}>{item.email}</Text>
                    {item.organization && (
                        <Text style={styles.cardOrg}>{item.organization}</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => handleDeactivate(item)}
                >
                    <Ionicons name="ban-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>
            </View>
            {item.designation && (
                <View style={styles.designationBadge}>
                    <Ionicons name="briefcase-outline" size={12} color="#4169E1" />
                    <Text style={styles.designationText}>{item.designation}</Text>
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
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Authority Accounts</Text>
                    <Text style={styles.subtitle}>Super Admin Control Panel</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{authorities.length}</Text>
                    <Text style={styles.statLabel}>Total Authorities</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                    <Text style={[styles.statLabel, { marginTop: 2 }]}>Super Admin Active</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={authorities}
                renderItem={renderAuthority}
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
                        <Ionicons name="people-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyText}>No authority accounts yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to create the first one</Text>
                    </View>
                }
            />

            {/* Create Authority Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Create Authority Account</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalBadge}>
                                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                                <Text style={styles.modalBadgeText}>Super Admin Only</Text>
                            </View>

                            {/* Full Name */}
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Raj Sharma"
                                value={formData.fullName}
                                onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                            />

                            {/* Email */}
                            <Text style={styles.label}>Email Address *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="authority@gov.in"
                                value={formData.email}
                                onChangeText={(t) => setFormData({ ...formData, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {/* Password */}
                            <Text style={styles.label}>Password *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Min. 6 characters"
                                value={formData.password}
                                onChangeText={(t) => setFormData({ ...formData, password: t })}
                                secureTextEntry
                            />

                            {/* Organization */}
                            <Text style={styles.label}>Organization</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Pune Municipal Corporation"
                                value={formData.organization}
                                onChangeText={(t) => setFormData({ ...formData, organization: t })}
                            />

                            {/* Designation */}
                            <Text style={styles.label}>Designation</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Water Quality Officer"
                                value={formData.designation}
                                onChangeText={(t) => setFormData({ ...formData, designation: t })}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                                onPress={handleCreate}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.submitButtonText}>Create Authority Account</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
    addButton: {
        width: 46,
        height: 46,
        backgroundColor: '#4169E1',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: 'bold', color: '#4169E1' },
    statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
    statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },
    listContent: { padding: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#4169E1' },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
    cardEmail: { fontSize: 13, color: '#666', marginTop: 2 },
    cardOrg: { fontSize: 12, color: '#999', marginTop: 2 },
    deactivateButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    designationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 10,
    },
    designationText: { fontSize: 12, color: '#4169E1', marginLeft: 6, fontWeight: '500' },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#999', marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
    modalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4169E1',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 10,
        marginBottom: 20,
    },
    modalBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        marginBottom: 16,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#4169E1',
        borderRadius: 16,
        padding: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ManageAuthoritiesScreen;
