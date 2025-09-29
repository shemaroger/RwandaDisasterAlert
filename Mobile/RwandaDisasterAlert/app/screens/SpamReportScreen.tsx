import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { reportSpam } from '../utils/api';

const SpamReportScreen = () => {
  const [messageId, setMessageId] = useState('');
  const [reason, setReason] = useState('');

  const handleReport = async () => {
    try {
      await reportSpam(messageId, reason);
      alert('Report submitted successfully');
      setMessageId('');
      setReason('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Spam</Text>
      <TextInput
        style={styles.input}
        placeholder="Message ID"
        value={messageId}
        onChangeText={setMessageId}
      />
      <TextInput
        style={styles.input}
        placeholder="Reason for reporting"
        value={reason}
        onChangeText={setReason}
      />
      <Button title="Submit Report" onPress={handleReport} />
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
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
});

export default SpamReportScreen;
