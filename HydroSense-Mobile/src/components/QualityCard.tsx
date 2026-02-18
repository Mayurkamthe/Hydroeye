import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QualityCardProps {
    label: string;
    value: string | number;
    unit: string;
    status: 'Safe' | 'Warning' | 'Danger';
    iconName: keyof typeof Ionicons.glyphMap;
}

const getStatusColor = (status: 'Safe' | 'Warning' | 'Danger') => {
    switch (status) {
        case 'Safe':
            return '#4CAF50';
        case 'Warning':
            return '#FFC107';
        case 'Danger':
            return '#F44336';
        default:
            return '#2196F3';
    }
};

const QualityCard: React.FC<QualityCardProps> = ({ label, value, unit, status, iconName }) => {
    const statusColor = getStatusColor(status);

    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: `${statusColor}15` }]}>
                <Ionicons name={iconName} size={24} color={statusColor} />
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.valueContainer}>
                    <Text style={styles.value}>{value}</Text>
                    <Text style={styles.unit}>{unit}</Text>
                </View>
                <Text style={[styles.status, { color: statusColor }]}>{status}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f8f9fa',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    content: {
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        marginBottom: 4,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    unit: {
        fontSize: 12,
        color: '#999',
        marginLeft: 2,
    },
    status: {
        fontSize: 12,
        marginTop: 6,
        fontWeight: '600',
    },
});

export default QualityCard;
