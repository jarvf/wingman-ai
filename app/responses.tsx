import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ResponseScreen() {
  const { chatText, replies } = useLocalSearchParams();
  const parsedReplies = replies ? JSON.parse(replies as string) : [];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Generated Replies</Text>
      <Text style={styles.subtitle}>Input: {chatText}</Text>

      {parsedReplies.length > 0 ? (
        parsedReplies.map((reply: string, index: number) => (
          <Text key={index} style={styles.response}>👉 {reply}</Text>
        ))
      ) : (
        <Text style={styles.response}>No replies generated.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
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
    textAlign: 'left',
    color: '#333'
  }
});
