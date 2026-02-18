import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const CitizenProfile = () => {
    // --- LOGIC STARTS HERE (Unchanged) ---
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };
    // --- LOGIC ENDS HERE ---

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerSubtitle}>Manage your account details</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarShadow}>
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
                            style={styles.avatar}
                        />
                    </View>
                    <Text style={styles.name}>{user?.fullName || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>

                    <View style={styles.roleBadge}>
                        <Ionicons name="shield-checkmark" size={14} color="#4169E1" style={{ marginRight: 4 }} />
                        <Text style={styles.roleText}>{user?.role || 'CITIZEN'}</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>Preferences</Text>
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
                        <View style={[styles.iconContainer, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="language-outline" size={22} color="#4169E1" />
                        </View>
                        <Text style={styles.menuText}>Language</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* Support Section */}
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.iconContainer, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="help-circle-outline" size={22} color="#00695C" />
                        </View>
                        <Text style={styles.menuText}>Help & Support</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="information-circle-outline" size={22} color="#EF6C00" />
                        </View>
                        <Text style={styles.menuText}>About App</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.2</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Matching theme
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
    scrollContent: {
        padding: 24,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    avatarShadow: {
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fff',
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#999',
        marginBottom: 16,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    roleText: {
        color: '#4169E1',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#999',
        marginBottom: 12,
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    separator: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginLeft: 72, // Aligns with text
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFEBEE', // Soft Red
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
    },
    logoutText: {
        color: '#D32F2F', // Darker Red for text
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        color: '#CCC',
        fontSize: 12,
        marginBottom: 20,
    },
});

export default CitizenProfile;