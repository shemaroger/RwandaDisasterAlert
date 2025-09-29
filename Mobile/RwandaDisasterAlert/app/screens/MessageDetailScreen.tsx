import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchMessageDetail } from '../utils/api';

const MessageDetailScreen = ({ route }) => {
  const { messageId } = route.params;
  const [messageDetail, setMessageDetail] = useState(null);

  useEffect(() => {
    const getMessageDetail = async () => {
      const detail = await fetchMessageDetail(messageId);
      setMessageDetail(detail);
    };

    getMessageDetail();
  }, [messageId]);

  if (!messageDetail) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Message Detail</Text>
      <Text>ID: {messageDetail.id}</Text>
      <Text>Content: {messageDetail.content}</Text>
      <Text>Status: {messageDetail.status}</Text>
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
});

export default MessageDetailScreen;
