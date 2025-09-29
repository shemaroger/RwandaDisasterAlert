import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchAnalyticsData } from '../utils/api';

interface AnalyticsData {
  blockedMessages?: number;
  spamTrends?: string;
}

const AnalyticsScreen = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getAnalytics = async () => {
      try {
        const data = await fetchAnalyticsData();
        setAnalyticsData(data);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error(err);
      }
    };

    getAnalytics();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <Text>Blocked Messages: {analyticsData.blockedMessages ?? 'N/A'}</Text>
      <Text>Spam Trends: {analyticsData.spamTrends ?? 'N/A'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});

export default AnalyticsScreen;