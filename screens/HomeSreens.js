import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  const [input, setInput] = React.useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wingman AI</Text>
      <Text style={styles.subtitle}>Paste your chat or bio below:</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste here..."
        placeholderTextColor="#999"
        multiline
        value={input}
        onChangeText={setInput}
      />

      <Button
        title="✨ Generate Replies"
        onPress={() => navigation.navigate('Responses', { chatText: input })}
      />
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 8
  }
});
