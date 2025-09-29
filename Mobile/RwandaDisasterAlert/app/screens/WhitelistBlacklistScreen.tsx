import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { fetchWhitelist, fetchBlacklist, updateWhitelist, updateBlacklist } from '../utils/api';

const WhitelistBlacklistScreen = () => {
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [newWhitelistEntry, setNewWhitelistEntry] = useState('');
  const [newBlacklistEntry, setNewBlacklistEntry] = useState('');

  const loadLists = async () => {
    const wl = await fetchWhitelist();
    const bl = await fetchBlacklist();
    setWhitelist(wl);
    setBlacklist(bl);
  };

  useEffect(() => {
    loadLists();
  }, []);

  const addWhitelistEntry = async () => {
    const updatedList = [...whitelist, newWhitelistEntry];
    await updateWhitelist(updatedList);
    setWhitelist(updatedList);
    setNewWhitelistEntry('');
  };

  const addBlacklistEntry = async () => {
    const updatedList = [...blacklist, newBlacklistEntry];
    await updateBlacklist(updatedList);
    setBlacklist(updatedList);
    setNewBlacklistEntry('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Whitelist & Blacklist</Text>
      <View style={styles.section}>
        <Text>Whitelist</Text>
        <TextInput
          style={styles.input}
          placeholder="Add number to whitelist"
          value={newWhitelistEntry}
          onChangeText={setNewWhitelistEntry}
        />
        <Button title="Add to Whitelist" onPress={addWhitelistEntry} />
        <FlatList
          data={whitelist}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <Text>{item}</Text>}
        />
      </View>
      <View style={styles.section}>
        <Text>Blacklist</Text>
        <TextInput
          style={styles.input}
          placeholder="Add number to blacklist"
          value={newBlacklistEntry}
          onChangeText={setNewBlacklistEntry}
        />
        <Button title="Add to Blacklist" onPress={addBlacklistEntry} />
        <FlatList
          data={blacklist}
          keyExtractor={(item) => item}
          renderItem={({ item }) => <Text>{item}</Text>}
        />
      </View>
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
  section: {
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

export default WhitelistBlacklistScreen;