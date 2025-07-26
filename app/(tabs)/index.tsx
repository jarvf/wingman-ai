import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  
  const API_URL = "http://192.168.1.45:5000/generate"; 

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
          <Text style={styles.title}>Wingman AI</Text>
          <Text style={styles.subtitle}>Paste your chat or bio below:</Text>

          <TextInput
            style={styles.input}
            placeholder="Paste here..."
            placeholderTextColor="#bbb"
            multiline
            value={input}
            onChangeText={setInput}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={styles.buttonWrapper}
            disabled={loading}
            onPress={async () => {
              if (!input.trim()) return;

              setLoading(true);
              try {
                const response = await fetch(API_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ convoText: input, tone: "witty" })
                });

                const data = await response.json();

                router.push({
                  pathname: '/responses',
                  params: {
                    chatText: input,
                    replies: JSON.stringify(data.replies)
                  }
                });
              } catch (error) {
                console.error("❌ Error fetching AI:", error);
              } finally {
                setLoading(false);
              }
            }}
          >
            <LinearGradient colors={['#ff758c', '#ff7eb3']} style={styles.button}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>✨ Generate Replies</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4
  },
  subtitle: {
    fontSize: 18,
    color: '#eee',
    marginBottom: 20
  },
  input: {
    width: '90%',
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20
  },
  buttonWrapper: {
    width: '80%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 30
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  }
});
