import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Button, StyleSheet } from 'react-native';
import { fetchSettings, updateSettings } from '../utils/api';

const SettingsScreen = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      const settings = await fetchSettings();
      setIsEnabled(settings.isSpamFilteringEnabled);
    };

    getSettings();
  }, []);

  const handleToggle = async () => {
    const newSettings = { isSpamFilteringEnabled: !isEnabled };
    await updateSettings(newSettings);
    setIsEnabled(!isEnabled);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.row}>
        <Text>Enable Spam Filtering</Text>
        <Switch value={isEnabled} onValueChange={handleToggle} />
      </View>
      <Button title="Save Settings" onPress={handleToggle} />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

export default SettingsScreen;
