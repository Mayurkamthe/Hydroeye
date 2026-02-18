import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

interface TrendChartProps {
    data: { value: number; label: string }[];
    title: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, title }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title} Trend (Last 5 Days)</Text>
            <View style={styles.chartWrapper}>
                <LineChart
                    data={data}
                    color="#0077B6"
                    thickness={3}
                    dataPointsColor="#0077B6"
                    startFillColor="rgba(0, 119, 182, 0.3)"
                    endFillColor="rgba(0, 119, 182, 0.01)"
                    startOpacity={0.9}
                    endOpacity={0.2}
                    initialSpacing={20}
                    noOfSections={4}
                    yAxisColor="lightgray"
                    xAxisColor="lightgray"
                    yAxisTextStyle={{ color: 'gray' }}
                    width={width - 80}
                    height={200}
                    curved
                    isAnimated
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
});

export default TrendChart;
