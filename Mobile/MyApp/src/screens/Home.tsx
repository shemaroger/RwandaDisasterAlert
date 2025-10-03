import React from "react";
import { View, Text, StyleSheet, Button, SafeAreaView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function Home({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hello — Welcome to MyApp</Text>
      <View style={styles.row}>
        <Button title="Login" onPress={() => navigation.navigate("Login")} />
      </View>
      <View style={styles.row}>
        <Button title="Sign up" onPress={() => navigation.navigate("Signup")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 22, textAlign: "center", marginBottom: 24 },
  row: { marginVertical: 8 },
});
