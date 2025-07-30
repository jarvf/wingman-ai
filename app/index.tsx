import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen() {
  const router = useRouter();

  //  Modal state instead of bottom sheet
  const [showModal, setShowModal] = useState(false);
  const [matchMessage, setMatchMessage] = useState("");
  const [tone, setTone] = useState("witty");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  //  Handle image upload - NO OCR FOR NOW
  const handleImageUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission needed", "Please allow access to your photos to upload screenshots.");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setIsProcessingImage(true);
        
        // Simulate processing time
        setTimeout(() => {
          setIsProcessingImage(false);
          Alert.alert(
            "Image Selected!", 
            "For now, please type the message from your screenshot manually. OCR feature coming soon!",
            [{ text: "OK" }]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Image processing error:', error);
      setIsProcessingImage(false);
      Alert.alert("Error", "Failed to process image. Please try again or type manually.");
    }
  };

  //  Open the Modal
  const openModal = () => {
    console.log("Opening modal...");
    setShowModal(true);
  };

  //  Handle "Start Chat" - go directly to chat
  const handleStartChat = () => {
    setShowModal(false);
    router.push("/chat");
  };

  //  Handle "Craft My Reply" - go to chat with match data AND auto-send
  const handleCraftReply = () => {
    if (!matchMessage.trim()) return;
    setShowModal(false);
    
    // Navigate to chat with auto-send functionality
    router.push({
      pathname: "/chat",
      params: { 
        fromMatch: "true", 
        matchMessage: matchMessage.trim(), 
        tone,
        autoSend: "true" // NEW: Tell chat to auto-send the message
      }
    });
    setMatchMessage("");
  };

  return (
    <View style={styles.container}>
      {/*  Gradient Header */}
      <LinearGradient colors={["#FF4B91", "#7A00FF"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.logo}>🪽 Wingbot</Text>
          <Text style={styles.tagline}>Your AI wingman for dating apps</Text>
        </View>
      </LinearGradient>

      {/*  Main Content */}
      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/*  Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Ready to level up your game?</Text>
          <Text style={styles.heroSubtitle}>Get AI-powered responses that actually get replies</Text>
          
          {/*  Modern Circle Button */}
          <TouchableOpacity 
            style={styles.circleButton} 
            onPress={() => {
              console.log("Circle button pressed!");
              openModal();
            }}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={["#FF4B91", "#FF6B9D", "#7A00FF"]} 
              style={styles.circleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.circleContent}>
                <Text style={styles.circleIcon}>🚀</Text>
                <Text style={styles.circleButtonText}>Start Now</Text>
                <Text style={styles.circleSubtext}>Tap to begin</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/*  Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>💬</Text>
            <Text style={styles.featureTitle}>Smart Replies</Text>
            <Text style={styles.featureDesc}>AI-crafted responses that match your personality</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Tone Control</Text>
            <Text style={styles.featureDesc}>Witty, flirty, or sweet - you choose the vibe</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureTitle}>Instant Results</Text>
            <Text style={styles.featureDesc}>Get multiple options in seconds</Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text style={styles.featureTitle}>Higher Success</Text>
            <Text style={styles.featureDesc}>95% of our users see more replies</Text>
          </View>
        </View>

        {/*  Coming Soon Section */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.sectionTitle}>🚀 Coming Soon</Text>
          
          <View style={styles.comingSoonItem}>
            <View style={styles.comingSoonIcon}>
              <Text style={styles.comingSoonEmoji}>🖼</Text>
            </View>
            <View style={styles.comingSoonText}>
              <Text style={styles.comingSoonTitle}>Screenshot Analysis</Text>
              <Text style={styles.comingSoonDesc}>Upload chat screenshots for context-aware replies</Text>
            </View>
          </View>

          <View style={styles.comingSoonItem}>
            <View style={styles.comingSoonIcon}>
              <Text style={styles.comingSoonEmoji}>⭐</Text>
            </View>
            <View style={styles.comingSoonText}>
              <Text style={styles.comingSoonTitle}>Premium Modes</Text>
              <Text style={styles.comingSoonDesc}>Unlock bolder, spicier, and savage response styles</Text>
            </View>
          </View>

          <View style={styles.comingSoonItem}>
            <View style={styles.comingSoonIcon}>
              <Text style={styles.comingSoonEmoji}>📊</Text>
            </View>
            <View style={styles.comingSoonText}>
              <Text style={styles.comingSoonTitle}>Success Analytics</Text>
              <Text style={styles.comingSoonDesc}>Track your response rates and conversation stats</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/*  MODAL */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            
            <View style={styles.handleBar} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Let's craft something amazing</Text>
              <Text style={styles.modalSubtitle}>Choose your wingman mode</Text>
            </View>

            <KeyboardAvoidingView
              style={styles.modalContent}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={0}
            >
              <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
            {/*  Quick Start Button */}
            <TouchableOpacity style={styles.quickButton} onPress={handleStartChat}>
              <LinearGradient colors={["#FF4B91", "#FF6B9D"]} style={styles.quickGradient}>
                <Text style={styles.quickIcon}>💬</Text>
                <Text style={styles.quickText}>Start General Chat</Text>
                <Text style={styles.quickSubtext}>Get help with any message</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.matchSection}>
              <Text style={styles.matchLabel}>📩 Reply to a Match</Text>

              {/*  Input Methods */}
              <View style={styles.inputMethodsContainer}>
                {/* Image Upload Button */}
                <View style={styles.imageUploadWrapper}>
                  <TouchableOpacity 
                    style={styles.imageUploadButton} 
                    onPress={handleImageUpload}
                    disabled={isProcessingImage}
                  >
                    <LinearGradient 
                      colors={isProcessingImage ? ["#D1D5DB", "#9CA3AF"] : ["#00E676", "#00C853"]} 
                      style={styles.imageUploadGradient}
                    >
                      <Text style={styles.imageUploadIcon}>
                        {isProcessingImage ? "⏳" : "📷"}
                      </Text>
                      <Text style={styles.imageUploadText}>
                        {isProcessingImage ? "Processing..." : "Upload Screenshot"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Soon!</Text>
                  </View>
                </View>

                {/* OR Divider */}
                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Text Input  */}
                <TextInput
                  style={styles.textInput}
                  placeholder="Type their message..."
                  placeholderTextColor="#999"
                  value={matchMessage}
                  onChangeText={setMatchMessage}
                  multiline
                />
              </View>

              {/*  Tone Selector */}
              <View style={styles.toneRow}>
                {[
                  { key: "witty", label: "😏 Witty" },
                  { key: "flirty", label: "😘 Flirty" },
                  { key: "polite", label: "😊 Sweet" }
                ].map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.toneButton, tone === key && styles.toneButtonSelected]}
                    onPress={() => setTone(key)}
                  >
                    <Text style={tone === key ? styles.toneTextSelected : styles.toneText}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/*  Craft Button */}
              <TouchableOpacity
                style={[styles.craftButton, !matchMessage.trim() && styles.craftButtonDisabled]}
                onPress={handleCraftReply}
                disabled={!matchMessage.trim()}
              >
                <LinearGradient 
                  colors={!matchMessage.trim() ? ["#ccc", "#aaa"] : ["#FF4B91", "#7A00FF"]} 
                  style={styles.craftGradient}
                >
                  <Text style={styles.craftIcon}>🔥</Text>
                  <Text style={styles.craftText}>Craft My Reply</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  // Header styles
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20
  },
  logo: { 
    fontSize: 42, 
    fontWeight: "800", 
    color: "#fff",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  tagline: { 
    fontSize: 18, 
    color: "#FFE4EC", 
    fontWeight: "500",
    textAlign: "center"
  },

  // Main content styles
  scrollArea: { 
    paddingVertical: 30,
    paddingHorizontal: 20
  },
  
  heroSection: {
    alignItems: "center",
    marginBottom: 40
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 36
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 10
  },

  circleButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
    shadowColor: "#FF4B91",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10
  },
  circleGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center"
  },
  circleContent: {
    alignItems: "center"
  },
  circleIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  circleButtonText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 22,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  circleSubtext: {
    color: "#FFE4EC",
    fontSize: 14,
    fontWeight: "500"
  },

  // Features grid
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 40
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#F3F4F6"
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center"
  },
  featureDesc: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18
  },

  // Coming soon section
  comingSoonSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: "#F3F4F6"
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    marginBottom: 20,
    color: "#1F2937",
    textAlign: "center"
  },
  comingSoonItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20
  },
  comingSoonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF1F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16
  },
  comingSoonEmoji: {
    fontSize: 24
  },
  comingSoonText: {
    flex: 1
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4
  },
  comingSoonDesc: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20
  },

  // Modal styles
  modalContainer: { 
    flex: 1, 
    backgroundColor: "#FAFAFA",
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    backgroundColor: "#FAFAFA",
    alignItems: "center"
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#1F2937",
    marginBottom: 4,
    textAlign: "center"
  },
  modalSubtitle: { 
    fontSize: 16, 
    color: "#6B7280",
    fontWeight: "400"
  },
  modalContent: { 
    flex: 1
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  
  quickButton: { 
    width: "100%", 
    marginBottom: 25,
    borderRadius: 16,
    shadowColor: "#FF4B91",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  quickGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center"
  },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 18,
    marginBottom: 4
  },
  quickSubtext: { 
    color: "#FFE4EC", 
    fontSize: 14,
    fontWeight: "400"
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB"
  },
  orText: { 
    paddingHorizontal: 16,
    fontSize: 14, 
    color: "#9CA3AF", 
    fontWeight: "600",
    letterSpacing: 0.5
  },

  matchSection: {
    flex: 1
  },
  matchLabel: { 
    fontSize: 20, 
    fontWeight: "700", 
    marginBottom: 6,
    color: "#1F2937",
    textAlign: "center"
  },
  matchSubtext: { 
    fontSize: 15, 
    color: "#6B7280", 
    marginBottom: 20,
    lineHeight: 22,
    textAlign: "center"
  },

  // Input methods container
  inputMethodsContainer: {
    marginBottom: 20
  },

  imageUploadWrapper: {
    position: "relative",
    marginBottom: 20
  },
  
  imageUploadButton: {
    width: "100%",
    borderRadius: 12,
    shadowColor: "#00E676",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  imageUploadGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  imageUploadIcon: {
    fontSize: 20,
    marginRight: 8
  },
  imageUploadText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  },
  comingSoonBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF4B91",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#FF4B91",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4
  },
  comingSoonBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },

  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB"
  },

  textInput: {
    minHeight: 60,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },

  toneRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20,
    gap: 6
  },
  toneButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  toneButtonSelected: { 
    backgroundColor: "#FFF1F5",
    borderColor: "#FF4B91",
    shadowColor: "#FF4B91",
    shadowOpacity: 0.2
  },
  toneEmoji: {
    fontSize: 20,
    marginBottom: 6
  },
  toneText: { 
    color: "#6B7280", 
    fontSize: 14,
    fontWeight: "500"
  },
  toneTextSelected: { 
    color: "#FF4B91", 
    fontSize: 14,
    fontWeight: "600"
  },

  craftButton: { 
    width: "100%",
    borderRadius: 16,
    shadowColor: "#7A00FF",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  craftButtonDisabled: {
    shadowOpacity: 0.1,
    shadowColor: "#000"
  },
  craftGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center"
  },
  craftIcon: {
    fontSize: 20,
    marginRight: 8
  },
  craftText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 18
  }
});