import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import typingAnim from "../assets/typing.json";

// Session interface
interface Session {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  isActive: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const { fromMatch, matchMessage, tone: initialTone, autoSend } = useLocalSearchParams();

  //  Session Management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSessionBlock, setShowNewSessionBlock] = useState(false);

  //  Chat state
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState(initialTone || "witty");
  const [persona, setPersona] = useState("millennial");
  const [showTyping, setShowTyping] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState("crafting");
  const [sessionActive, setSessionActive] = useState(false);
  const [originalMessage, setOriginalMessage] = useState(null);
  const [userSelectedMode, setUserSelectedMode] = useState("crafting");
  const [autoSendTriggered, setAutoSendTriggered] = useState(false);
  const [isPremium, setIsPremium] = useState(false); // Free tier by default
  const [messageCount, setMessageCount] = useState(0); // Track messages sent

  const flatListRef = useRef<FlatList>(null);
  const API_URL = "http://192.168.1.43:5000/generate";
  const CHARACTER_LIMIT = isPremium ? 1000 : 200; // Free: 200, Premium: 1000

  //  Handle input change with character limit
  const handleInputChange = (text: string) => {
    if (text.length <= CHARACTER_LIMIT) {
      setInput(text);
    } else if (!isPremium) {
      // Show upgrade prompt for free users
      Alert.alert(
        "Character Limit Reached",
        `Free users are limited to ${CHARACTER_LIMIT} characters per message. Upgrade to Premium for unlimited characters!`,
        [
          { text: "Continue", style: "cancel" },
          { text: "Upgrade", onPress: () => console.log("Show premium modal") }
        ]
      );
    }
  };

  //  Get character count info
  const getCharacterInfo = () => {
    const remaining = CHARACTER_LIMIT - input.length;
    const isNearLimit = remaining <= 20;
    const isOverLimit = remaining < 0;
    
    return {
      count: input.length,
      remaining,
      isNearLimit,
      isOverLimit,
      percentage: (input.length / CHARACTER_LIMIT) * 100
    };
  };

  //  Get current session messages
  const getCurrentMessages = () => {
    const activeSession = sessions.find(s => s.id === activeSessionId);
    return activeSession?.messages || [];
  };

  //  Load sessions from AsyncStorage
  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem('wingbot_sessions');
      if (stored) {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
        
        const activeSessions = parsedSessions.filter(s => s.isActive);
        if (activeSessions.length > 0) {
          setActiveSessionId(activeSessions[0].id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      createNewSession();
    }
  };

  //  Save sessions to AsyncStorage
  const saveSessions = async (newSessions: Session[]) => {
    try {
      await AsyncStorage.setItem('wingbot_sessions', JSON.stringify(newSessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  };

  //  Create new session
  const createNewSession = () => {
    // Check if we have 3 active sessions
    const activeSessions = sessions.filter(s => s.isActive);
    if (activeSessions.length >= 3) {
      setShowNewSessionBlock(true);
      return;
    }

    const newSession: Session = {
      id: Date.now().toString(),
      title: fromMatch ? `Match Reply ${activeSessions.length + 1}` : `Chat ${activeSessions.length + 1}`,
      messages: [
        fromMatch
          ? { id: "1", sender: "wingbot", text: `📩 Match message received! I'll craft the perfect reply for you. 🚀` }
          : { id: "1", sender: "wingbot", text: "Hey! I'm your AI wingman. Send me any message and I'll help you craft the perfect reply that gets results! 🚀" }
      ],
      createdAt: Date.now(),
      isActive: true
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    setActiveSessionId(newSession.id);
    saveSessions(updatedSessions);
  };

  //  Switch to session
  const switchToSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  //  Close session
  const closeSession = (sessionId: string) => {
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, isActive: false } : s
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    // Switch to another active session or create new one
    const remainingActive = updatedSessions.filter(s => s.isActive);
    if (remainingActive.length > 0) {
      setActiveSessionId(remainingActive[0].id);
    } else {
      createNewSession();
    }
    setShowNewSessionBlock(false);
  };

  //  Update session messages
  const updateSessionMessages = (newMessages: any[]) => {
    const updatedSessions = sessions.map(s =>
      s.id === activeSessionId ? { ...s, messages: newMessages } : s
    );
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  //  Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  //  AUTO-SEND FUNCTIONALITY
  useEffect(() => {
    if (fromMatch === "true" && matchMessage && autoSend === "true" && !autoSendTriggered && activeSessionId) {
      setAutoSendTriggered(true);
      
      const userMsg = { 
        id: Date.now().toString(), 
        sender: "user", 
        text: matchMessage as string 
      };
      const currentMessages = getCurrentMessages();
      const newMessages = [...currentMessages, userMsg];
      updateSessionMessages(newMessages);
      
      setTimeout(() => {
        sendAutoMessage(matchMessage as string);
      }, 500);
    }
  }, [fromMatch, matchMessage, autoSend, autoSendTriggered, activeSessionId]);

  //  Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [getCurrentMessages()]);

  //  Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  //  Auto-send message function
  const sendAutoMessage = async (messageText: string) => {
    setShowTyping(true);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convoText: messageText,
          tone,
          persona,
          history: getCurrentMessages().slice(-5),
          fromMatch: "true",
          forceMode: userSelectedMode
        })
      });

      const data = await response.json();
      const replies = data.replies || ["(No reply generated)"];

      setTimeout(() => {
        setShowTyping(false);
        const botMsg = {
          id: Date.now().toString() + "_wingbot",
          sender: "wingbot",
          text: replies.join("\n\n"),
          animated: true,
          mode: userSelectedMode,
          isCoaching: userSelectedMode === "coaching"
        };
        const currentMessages = getCurrentMessages();
        updateSessionMessages([...currentMessages, botMsg]);
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error("❌ Error fetching AI:", err);
      setShowTyping(false);
      const errorMsg = {
        id: Date.now().toString() + "_error",
        sender: "wingbot",
        text: "Oops! Something went wrong. Let me try again! 🔄"
      };
      const currentMessages = getCurrentMessages();
      updateSessionMessages([...currentMessages, errorMsg]);
      setLoading(false);
    }
  };

  //  Send message function
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Check character limit for free users
    if (!isPremium && input.length > CHARACTER_LIMIT) {
      Alert.alert("Message too long", `Please keep messages under ${CHARACTER_LIMIT} characters or upgrade to Premium.`);
      return;
    }

    Keyboard.dismiss();

    if (!hasUserSentMessage) {
      setHasUserSentMessage(true);
      setTimeout(() => {
        setShowControls(false);
      }, 500);
    }

    // Increment message count
    setMessageCount(prev => prev + 1);

    const userMsg = { id: Date.now().toString(), sender: "user", text: input };
    const currentMessages = getCurrentMessages();
    const newMessages = [...currentMessages, userMsg];
    updateSessionMessages(newMessages);
    
    const currentInput = input;
    setInput("");
    setShowTyping(true);
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convoText: currentInput,
          tone,
          persona,
          history: getCurrentMessages().slice(-5),
          fromMatch: fromMatch ? "true" : "false",
          forceMode: userSelectedMode
        })
      });

      const data = await response.json();
      const replies = data.replies || ["(No reply generated)"];

      setTimeout(() => {
        setShowTyping(false);
        const botMsg = {
          id: Date.now().toString() + "_wingbot",
          sender: "wingbot",
          text: replies.join("\n\n"),
          animated: true,
          mode: userSelectedMode,
          isCoaching: userSelectedMode === "coaching"
        };
        const updatedMessages = [...newMessages, botMsg];
        updateSessionMessages(updatedMessages);
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error(" Error fetching AI:", err);
      setShowTyping(false);
      const errorMsg = {
        id: Date.now().toString() + "_error",
        sender: "wingbot",
        text: "Oops! Something went wrong. Let me try again! 🔄"
      };
      const updatedMessages = [...newMessages, errorMsg];
      updateSessionMessages(updatedMessages);
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageRow,
        item.sender === "user" ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.sender === "user" ? styles.userBubble : 
          item.isCoaching ? styles.coachingBubble : styles.botBubble
        ]}
      >
        {item.sender === "wingbot" && item.mode && (
          <View style={styles.messageHeader}>
            <Text style={[styles.modeTag, item.isCoaching ? styles.coachingTag : styles.craftingTag]}>
              {item.isCoaching ? "🧠 COACHING" : "✏️ CRAFTING"}
            </Text>
          </View>
        )}
        <Text style={
          item.sender === "user" ? styles.userText : 
          item.isCoaching ? styles.coachingText : styles.botText
        }>
          {item.text}
        </Text>
      </View>
    </View>
  );

  //  Show blocked modal if 3 sessions active
  if (showNewSessionBlock) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.blockedContainer}>
          <View style={styles.blockedContent}>
            <Text style={styles.blockedTitle}>🚫 Session Limit Reached</Text>
            <Text style={styles.blockedText}>You have 3 active sessions. Close one to continue.</Text>
            
            <ScrollView style={styles.sessionsList}>
              {sessions.filter(s => s.isActive).map(session => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <Text style={styles.sessionDate}>
                      {new Date(session.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => closeSession(session.id)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentMessages = getCurrentMessages();
  const activeSessions = sessions.filter(s => s.isActive);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <LinearGradient colors={["#FF4B91", "#7A00FF"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.push("/")}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🪽 Wingbot AI</Text>
            
            {/*  Session Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.sessionTabsContainer}
              contentContainerStyle={styles.sessionTabsContent}
            >
              {activeSessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionTab,
                    session.id === activeSessionId && styles.sessionTabActive
                  ]}
                  onPress={() => switchToSession(session.id)}
                >
                  <Text style={[
                    styles.sessionTabText,
                    session.id === activeSessionId && styles.sessionTabTextActive
                  ]}>
                    {session.title}
                  </Text>
                  <TouchableOpacity 
                    style={styles.sessionTabClose}
                    onPress={() => closeSession(session.id)}
                  >
                    <Text style={styles.sessionTabCloseText}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              
              {activeSessions.length < 3 && (
                <TouchableOpacity 
                  style={styles.newSessionTab}
                  onPress={createNewSession}
                >
                  <Text style={styles.newSessionTabText}>+</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/*  Mode Toggle Buttons */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity 
                style={[styles.modeToggleButton, userSelectedMode === "crafting" && styles.modeToggleActive]}
                onPress={() => {
                  setUserSelectedMode("crafting");
                  setCurrentMode("crafting");
                }}
              >
                <Text style={[styles.modeToggleText, userSelectedMode === "crafting" && styles.modeToggleTextActive]}>
                  ✏️ Craft
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modeToggleButton, userSelectedMode === "coaching" && styles.modeToggleActive]}
                onPress={() => {
                  setUserSelectedMode("coaching");
                  setCurrentMode("coaching");
                }}
              >
                <Text style={[styles.modeToggleText, userSelectedMode === "coaching" && styles.modeToggleTextActive]}>
                  🧠 Coach
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.headerSubtitle}>
              {currentMode === "coaching" ? "Get dating strategy & advice" : "Create perfect messages"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statusDot} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {showControls && (
          <View style={styles.controlPanel}>
            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>Tone:</Text>
              <View style={styles.controlButtons}>
                {[
                  { key: "witty", label: "Witty", emoji: "😏" },
                  { key: "flirty", label: "Flirty", emoji: "😘" },
                  { key: "polite", label: "Sweet", emoji: "😊" }
                ].map(({ key, label, emoji }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.controlButton, tone === key && styles.controlButtonSelected]}
                    onPress={() => setTone(key)}
                  >
                    <Text style={styles.controlEmoji}>{emoji}</Text>
                    <Text style={tone === key ? styles.controlTextSelected : styles.controlText}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.controlSection}>
              <Text style={styles.controlLabel}>Age:</Text>
              <View style={styles.controlButtons}>
                {[
                  { key: "genz", label: "Gen Z", emoji: "🔥" },
                  { key: "millennial", label: "Millennial", emoji: "✨" },
                  { key: "older", label: "Mature", emoji: "🎯" }
                ].map(({ key, label, emoji }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.controlButton, persona === key && styles.personaButtonSelected]}
                    onPress={() => setPersona(key)}
                  >
                    <Text style={styles.controlEmoji}>{emoji}</Text>
                    <Text style={persona === key ? styles.personaTextSelected : styles.controlText}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => setShowControls(!showControls)}
          activeOpacity={0.7}
        >
          <View style={styles.toggleContent}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleText}>
                {tone.charAt(0).toUpperCase() + tone.slice(1)} • {persona === "genz" ? "Gen Z" : persona === "millennial" ? "Millennial" : "Mature"}
              </Text>
              <Text style={styles.toggleSubtext}>
                {showControls ? 'Tap to hide settings' : 'Tap to change tone & age'}
              </Text>
            </View>
            <View style={[styles.toggleArrow, showControls && styles.toggleArrowRotated]}>
              <Text style={styles.toggleArrowText}>▼</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={showTyping ? [...currentMessages, { id: "typing", sender: "wingbot", typing: true }] : currentMessages}
            renderItem={({ item }) =>
              item.typing ? (
                <View style={styles.typingContainer}>
                  <View style={styles.typingBubble}>
                    <LottieView
                      source={typingAnim}
                      autoPlay
                      loop
                      style={styles.typingAnimation}
                    />
                  </View>
                </View>
              ) : (
                renderItem({ item })
              )
            }
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesContainer,
              keyboardVisible && { paddingBottom: 20 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>

        <View style={styles.inputContainer}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inputBar}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.textInput,
                    getCharacterInfo().isNearLimit && styles.textInputWarning,
                    getCharacterInfo().isOverLimit && styles.textInputError
                  ]}
                  placeholder="Type your message here..."
                  placeholderTextColor="#9CA3AF"
                  value={input}
                  onChangeText={handleInputChange}
                  onFocus={() => {
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 200);
                  }}
                  multiline
                  maxLength={isPremium ? undefined : CHARACTER_LIMIT}
                />
                
                {/*  Character Counter */}
                <View style={styles.characterCounter}>
                  <Text style={[
                    styles.characterCountText,
                    getCharacterInfo().isNearLimit && styles.characterCountWarning,
                    getCharacterInfo().isOverLimit && styles.characterCountError
                  ]}>
                    {getCharacterInfo().count}/{CHARACTER_LIMIT}
                  </Text>
                  {!isPremium && getCharacterInfo().isNearLimit && (
                    <TouchableOpacity 
                      style={styles.upgradePrompt}
                      onPress={() => console.log("Show premium modal")}
                    >
                      <Text style={styles.upgradePromptText}>Upgrade</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
                onPress={sendMessage} 
                disabled={!input.trim() || loading}
              >
                <LinearGradient 
                  colors={(!input.trim() || loading) ? ["#D1D5DB", "#9CA3AF"] : ["#FF4B91", "#7A00FF"]} 
                  style={styles.sendButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendButtonText}>→</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
          
          {/*  Enhanced Input Hint */}
          <View style={styles.inputHintContainer}>
            <Text style={styles.inputHint}>
              💡 Tip: The more context you give me, the better I can help!
            </Text>
            {!isPremium && (
              <Text style={styles.premiumHint}>
                ⭐ Premium: Unlimited characters & advanced features
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#7A00FF" },
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  // Blocked screen styles
  blockedContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  blockedContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  blockedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 10,
    textAlign: "center"
  },
  blockedText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22
  },
  sessionsList: {
    width: "100%",
    maxHeight: 200,
    marginBottom: 20
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  sessionInfo: {
    flex: 1
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2
  },
  sessionDate: {
    fontSize: 12,
    color: "#9CA3AF"
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center"
  },
  closeButtonText: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "600"
  },
  backButton: {
    backgroundColor: "#FF4B91",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },

  // Header styles
  header: {
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    justifyContent: "space-between"
  },
  headerBackButton: { 
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18
  },
  backText: { fontSize: 20, color: "#fff", fontWeight: "600" },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10
  },
  headerTitle: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#fff",
    marginBottom: 6
  },

  // Session tabs - FIXED
  sessionTabsContainer: {
    marginBottom: 6,
    maxHeight: 32
  },
  sessionTabsContent: {
    paddingHorizontal: 5,
    alignItems: "center"
  },
  sessionTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 3,
    minWidth: 60
  },
  sessionTabActive: {
    backgroundColor: "rgba(255,255,255,0.9)"
  },
  sessionTabText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginRight: 4
  },
  sessionTabTextActive: {
    color: "#7A00FF",
    fontWeight: "600"
  },
  sessionTabClose: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 7
  },
  sessionTabCloseText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600"
  },
  newSessionTab: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 3
  },
  newSessionTabText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "300"
  },
  
  // Mode toggle styles
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 2,
    marginBottom: 8
  },
  modeToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginHorizontal: 1
  },
  modeToggleActive: {
    backgroundColor: "rgba(255,255,255,0.9)"
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)"
  },
  modeToggleTextActive: {
    color: "#7A00FF"
  },
  
  headerSubtitle: { 
    fontSize: 10, 
    color: "#FFE4EC", 
    fontWeight: "400",
    textAlign: "center"
  },
  headerRight: {
    width: 35,
    alignItems: "center"
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00E676"
  },

  controlPanel: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  controlSection: {
    marginBottom: 12
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8
  },
  controlButtons: {
    flexDirection: "row",
    gap: 8
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  controlButtonSelected: {
    backgroundColor: "#FFF1F5",
    borderColor: "#FF4B91"
  },
  personaButtonSelected: {
    backgroundColor: "#F3E8FF",
    borderColor: "#7A00FF"
  },
  controlEmoji: {
    fontSize: 14,
    marginRight: 4
  },
  controlText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280"
  },
  controlTextSelected: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF4B91"
  },
  personaTextSelected: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A00FF"
  },

  toggleButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  toggleInfo: {
    flex: 1
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2
  },
  toggleSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "400"
  },
  toggleArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center"
  },
  toggleArrowRotated: {
    transform: [{ rotate: "180deg" }],
    backgroundColor: "#E5E7EB"
  },
  toggleArrowText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600"
  },

  chatContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA"
  },
  messagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 6
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  userBubble: {
    backgroundColor: "#FF4B91",
    borderBottomRightRadius: 6,
    alignSelf: "flex-end"
  },
  botBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#F3F4F6"
  },
  coachingBubble: {
    backgroundColor: "#F8F4FF",
    borderBottomLeftRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E5D4FF",
    maxWidth: "90%"
  },
  messageHeader: {
    marginBottom: 8
  },
  modeTag: {
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden"
  },
  coachingTag: {
    backgroundColor: "#8A2BE2",
    color: "#fff"
  },
  craftingTag: {
    backgroundColor: "#FF4B91",
    color: "#fff"
  },
  userText: { 
    color: "#fff", 
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22
  },
  botText: { 
    color: "#1F2937", 
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22
  },
  coachingText: {
    color: "#4C1D95",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 24
  },

  typingContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginVertical: 6
  },
  typingBubble: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#F3F4F6"
  },
  typingAnimation: {
    width: 60,
    height: 40
  },

  inputContainer: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6"
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 8
  },
  inputWrapper: {
    flex: 1,
    position: "relative"
  },
  textInput: {
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32, // Space for character counter
    backgroundColor: "#F9FAFB",
    borderRadius: 22,
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "400",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    textAlignVertical: "top"
  },
  textInputWarning: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7"
  },
  textInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2"
  },
  characterCounter: {
    position: "absolute",
    bottom: 6,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  characterCountText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500"
  },
  characterCountWarning: {
    color: "#F59E0B"
  },
  characterCountError: {
    color: "#EF4444"
  },
  upgradePrompt: {
    backgroundColor: "#FF4B91",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  upgradePromptText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600"
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: "#FF4B91",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  sendButtonDisabled: {
    shadowOpacity: 0.1,
    shadowColor: "#000"
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  sendButtonText: { 
    color: "#fff", 
    fontSize: 20, 
    fontWeight: "600"
  },
  inputHintContainer: {
    alignItems: "center",
    gap: 4
  },
  inputHint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontWeight: "400"
  },
  premiumHint: {
    fontSize: 11,
    color: "#FF4B91",
    textAlign: "center",
    fontWeight: "500"
  }
});