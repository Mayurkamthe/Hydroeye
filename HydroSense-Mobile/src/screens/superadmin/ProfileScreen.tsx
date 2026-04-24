import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const SuperAdminProfileScreen = () => {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>Super Admin Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarCircle}>
                            <Ionicons name="shield-checkmark" size={40} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.name}>{user?.fullName || 'Super Admin'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.roleText}>SUPER ADMIN</Text>
                    </View>
                </View>

                {/* Access Control Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="key-outline" size={20} color="#4169E1" />
                        <View style={styles.infoTextBlock}>
                            <Text style={styles.infoTitle}>Exclusive Permissions</Text>
                            <Text style={styles.infoDesc}>Create & deactivate authority accounts</Text>
                        </View>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Ionicons name="people-outline" size={20} color="#4169E1" />
                        <View style={styles.infoTextBlock}>
                            <Text style={styles.infoTitle}>Authority Management</Text>
                            <Text style={styles.infoDesc}>Full control over authority user access</Text>
                        </View>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Ionicons name="lock-closed-outline" size={20} color="#4169E1" />
                        <View style={styles.infoTextBlock}>
                            <Text style={styles.infoTitle}>System Security</Text>
                            <Text style={styles.infoDesc}>Public registration restricted to Citizens only</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>System</Text>
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="notifications-outline" size={22} color="#4169E1" />
                        </View>
                        <Text style={styles.menuText}>Notification Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.iconContainer, { backgroundColor: '#ECEFF1' }]}>
                            <Ionicons name="settings-outline" size={22} color="#546E7A" />
                        </View>
                        <Text style={styles.menuText}>System Settings</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>HydroEye Super Admin v2.1.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
    headerSubtitle: { fontSize: 14, color: '#666', marginTop: 2 },
    scrollContent: { padding: 24 },
    profileCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 28,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    avatarWrapper: {
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#4169E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    email: { fontSize: 14, color: '#999', marginBottom: 16 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    roleText: { color: '#fff', fontWeight: '700', fontSize: 12, letterSpacing: 1 },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    infoTextBlock: { flex: 1, marginLeft: 14 },
    infoTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    infoDesc: { fontSize: 12, color: '#888', marginTop: 2 },
    infoDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 34 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#999',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: { flex: 1, marginLeft: 16, fontSize: 16, fontWeight: '500', color: '#333' },
    separator: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 72 },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE',
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
    },
    logoutText: { color: '#D32F2F', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    versionText: { textAlign: 'center', color: '#CCC', fontSize: 12, marginBottom: 16 },
});

export default SuperAdminProfileScreen;
