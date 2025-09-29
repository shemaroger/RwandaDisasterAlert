import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { fetchRecentSpam } from '../utils/api';

const HomeScreen = ({ navigation }) => {
  const [spamData, setSpamData] = useState([]);

  useEffect(() => {
    const getSpamData = async () => {
      const data = await fetchRecentSpam();
      setSpamData(data);
    };

    getSpamData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SpamShield SMS</Text>
      <Button title="View Spam Reports" onPress={() => navigation.navigate('SpamReport')} />
      <FlatList
        data={spamData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.message}</Text>
          </View>
        )}
      />
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
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default HomeScreen;
