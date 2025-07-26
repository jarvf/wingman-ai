import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ResponseScreen() {
  const { chatText } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated Replies</Text>
      <Text style={styles.subtitle}>Input: {chatText}</Text>

      {/* Placeholder for AI-generated responses */}
      <Text style={styles.response}>👉 Your witty AI responses will go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  response: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
    color: '#333'
  }
});
