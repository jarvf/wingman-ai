import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

//  Enhanced memory system with context tracking
let conversationMemory = [];
let userProfile = {
  name: null,
  detectedStyle: null,
  preferences: []
};

//  Session context for craft message flow
let craftingSession = {
  originalMessage: null,
  isActive: false,
  iterations: 0
};

//  Enhanced tone personalities with real dating psychology
const TONE_PROFILES = {
  witty: {
    description: "Sharp, intelligent humor that creates attraction through wit",
    instructions: "Use clever observations, playful teasing, unexpected angles, or smart wordplay. Think 'charming smartass' energy - confident but not arrogant. Make them think 'damn, this person is sharp.'",
    examples: [
      "Original: 'I love hiking!' → Witty: 'Let me guess, your idea of roughing it is a hotel without room service? 😏'",
      "Original: 'How's your day?' → Witty: 'Well, I haven't conquered any kingdoms yet, but it's still early'"
    ]
  },
  flirty: {
    description: "Confident, playful tension that builds romantic interest",
    instructions: "Create sexual tension through confidence, playful challenges, and subtle innuendo. Use emotional push-pull dynamics. Be bold but classy - think 'I know you want me but you'll have to work for it' energy.",
    examples: [
      "Original: 'What are you up to?' → Flirty: 'Currently wondering if you're always this forward or if I'm just lucky 😉'",
      "Original: 'You're cute' → Flirty: 'I know 😘 but I'm more interested in what's behind those eyes'"
    ]
  },
  sweet: {
    description: "Genuine warmth with emotional intelligence that builds connection",
    instructions: "Show authentic interest, emotional depth, and caring without being needy. Use vulnerability strategically. Think 'confident but emotionally available' - someone who gets people and makes them feel seen.",
    examples: [
      "Original: 'Bad day at work' → Sweet: 'Ugh, those days when work feels like emotional warfare. What's your go-to reset button?'",
      "Original: 'Love your smile' → Sweet: 'Thank you 🥰 I have to say, there's something about your energy that just draws me in'"
    ]
  }
};

//  Enhanced persona profiles based on real generational communication
const PERSONA_PROFILES = {
  genz: {
    description: "Authentic, meme-literate, direct communication with emotional intelligence",
    style: "Use casual confidence, be direct about intentions, sprinkle in cultural references naturally. No cap energy but actually thoughtful.",
    vocabulary: ["fr", "no cap", "bet", "lowkey", "highkey", "hits different", "main character energy", "that's a vibe"],
    communication: "Short, punchy, authentic. Comfortable with vulnerability when it serves connection."
  },
  millennial: {
    description: "Balanced confidence with cultural awareness and emotional maturity",
    style: "Reference shared experiences, use humor that shows intelligence, be intentional with communication. Peak dating app energy.",
    vocabulary: ["honestly", "literally", "actually", "totally", "definitely", "absolutely"],
    communication: "Conversational but purposeful. Uses humor and references to build rapport."
  },
  older: {
    description: "Sophisticated, intentional communication with confidence and depth",
    style: "More thoughtful pacing, deeper questions, sophisticated humor. Quality over quantity energy.",
    vocabulary: ["particularly", "rather", "quite", "certainly", "indeed", "genuinely"],
    communication: "Longer, more considered responses. Values depth and substance."
  }
};

//  Context detection for better AI responses
function detectMessageContext(text) {
  const lower = text.toLowerCase();
  
  // Coaching requests (expanded keywords)
  if (lower.includes("help me") || lower.includes("what should") || lower.includes("how do i") ||
      lower.includes("why") || lower.includes("explain") || lower.includes("advice") ||
      lower.includes("strategy") || lower.includes("when should") || lower.includes("how to") ||
      lower.includes("what's a good") || lower.includes("should i") || lower.includes("is it") ||
      lower.includes("does this") || lower.includes("what does") || lower.includes("meaning") ||
      lower.includes("psychology") || lower.includes("understand") || lower.includes("confused")) {
    return "coaching";
  }
  
  // Regeneration requests
  if (lower.includes("regenerate") || lower.includes("try again") || lower.includes("different") || 
      lower.includes("better") || lower.includes("rewrite") || lower.includes("another") ||
      lower.includes("options") || lower.includes("alternatives")) {
    return "regenerate";
  }
  
  // Style adjustments
  if (lower.includes("shorter") || lower.includes("longer") || lower.includes("more") || 
      lower.includes("less") || lower.includes("bolder") || lower.includes("safer") ||
      lower.includes("make it") || lower.includes("turn it") || lower.includes("change")) {
    return "adjust";
  }
  
  // New message to craft reply for
  return "craft";
}

//  Smart name detection
function detectName(text) {
  // Look for "I'm [Name]" or "My name is [Name]" or greetings
  const patterns = [
    /(?:i'm|i am|my name is|call me)\s+([A-Z][a-z]+)/i,
    /(?:hey|hi|hello),?\s+i'm\s+([A-Z][a-z]+)/i,
    /(?:hey|hi|hello)\s+([A-Z][a-z]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1].length > 1 && match[1].length < 15) {
      return match[1];
    }
  }
  return null;
}

//  Build enhanced system prompt
function buildSystemPrompt(mode, tone, persona, userContext) {
  const toneProfile = TONE_PROFILES[tone] || TONE_PROFILES.witty;
  const personaProfile = PERSONA_PROFILES[persona] || PERSONA_PROFILES.millennial;
  
  const basePersonality = `
🎯 YOU ARE WINGBOT - The world's best dating coach and message craftsman.

CORE IDENTITY:
- Sharp, confident, and psychologically aware
- You understand modern dating dynamics deeply
- You craft messages that actually get responses and build attraction
- You coach with brutal honesty but supportive energy

TONE: ${tone.toUpperCase()}
${toneProfile.description}
INSTRUCTIONS: ${toneProfile.instructions}

PERSONA: ${persona.toUpperCase()}  
${personaProfile.description}
STYLE: ${personaProfile.style}
COMMUNICATION: ${personaProfile.communication}
`;

  if (mode === "coaching") {
    return basePersonality + `
🧠 COACHING MODE ACTIVATED

You are now in full coaching mode. This means:
- Explain the psychology behind your suggestions
- Give strategic dating advice
- Help them understand what works and why
- Be conversational and supportive
- Ask follow-up questions to give better advice

When they ask for help or advice, engage in full coaching conversation.
${userContext.name ? `Their name is ${userContext.name}.` : ""}
`;
  } else {
    return basePersonality + `
✏️ MESSAGE CRAFTING MODE ACTIVATED

Your job is to craft actual messages they can copy and send:
- Generate 2-3 different reply options
- Each should be under 30 words unless specifically requested longer
- Write AS IF YOU ARE THE USER typing the message
- Make them sound natural and authentic to their age/style
- Focus on responses that build attraction and get replies

CRITICAL: Write the actual messages they should send, not advice about messages.
Format your response as exactly 1 message option on a single line.
Do not include numbers, bullets, or labels - just the raw message.
${userContext.name ? `You are writing as ${userContext.name}.` : "You are writing as the user."}
`;
  }
}

//  Main generation endpoint
app.post("/generate", async (req, res) => {
  try {
    const { convoText, tone, persona, history, fromMatch, forceMode } = req.body;

    //  Detect and save user name
    const detectedName = detectName(convoText);
    if (detectedName && !userProfile.name) {
      userProfile.name = detectedName;
      console.log(`📛 Detected user name: ${detectedName}`);
    }

    //  Use forceMode if provided, otherwise detect context
    let mode = "crafting";
    let context = "craft";
    
    if (forceMode) {
      // User explicitly chose mode via toggle buttons
      mode = forceMode;
      context = forceMode === "coaching" ? "coaching" : "craft";
      console.log(`🎯 Force mode: ${forceMode}`);
      
      // Reset crafting session if switching to coaching
      if (forceMode === "coaching") {
        craftingSession.isActive = false;
      }
    } else {
      // Fallback to detection for backward compatibility
      context = detectMessageContext(convoText);
      if (context === "coaching") {
        mode = "coaching";
        craftingSession.isActive = false;
      }
    }

    //  Handle crafting session flow ONLY if in crafting mode
    if (mode === "crafting") {
      if (fromMatch === "true" || (!craftingSession.isActive && context === "craft")) {
        // Starting new crafting session
        craftingSession = {
          originalMessage: convoText,
          isActive: true,
          iterations: 1
        };
      } else if (craftingSession.isActive && (context === "regenerate" || context === "adjust")) {
        // Continue crafting session with the original message
        craftingSession.iterations++;
      }
    }

    //  Add to conversation memory
    conversationMemory.push({
      role: "user",
      content: convoText,
      timestamp: Date.now(),
      context: context,
      mode: mode
    });

    // Keep last 15 exchanges
    if (conversationMemory.length > 30) {
      conversationMemory = conversationMemory.slice(-30);
    }

    //  Build conversation history
    const recentHistory = conversationMemory.slice(-10)
      .map(msg => `${msg.role === "user" ? "User" : "Wingbot"}: ${msg.content}`)
      .join("\n");

    //  Build system prompt
    const systemPrompt = buildSystemPrompt(mode, tone, persona, userProfile);

    //  Build user prompt based on mode and context
    let userPrompt = "";

    if (mode === "coaching") {
      userPrompt = `
The user is asking for dating advice or help:
"${convoText}"

Recent conversation context:
${recentHistory}

Provide thoughtful coaching advice. Explain the psychology, give specific strategies, and be supportive but honest.
`;
    } else {
      // Crafting mode
      if (context === "regenerate" || context === "adjust") {
        userPrompt = `
The user wants you to improve/regenerate replies for this original message:
"${craftingSession.originalMessage}"

Their feedback: "${convoText}"

Generate 1 improved message based on their feedback. Write the actual message they should send.
`;
      } else {
        // New message to craft reply for
        userPrompt = `
New message from their match that needs a reply:
"${convoText}"

${history && history.length > 0 ? `Previous conversation context:\n${history.map(h => `${h.sender}: ${h.text}`).join('\n')}` : ''}

Generate 1 perfect reply message (under 30 words). Write the actual message they should send.
`;
      }
    }

    //  Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: mode === "coaching" ? 0.7 : 0.8,
        max_tokens: mode === "coaching" ? 500 : 300
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("No AI response received");
    }

    //  Parse response
    const aiResponse = data.choices[0].message.content;
    
    let replies;
    if (mode === "coaching") {
      // Return full coaching response as single message
      replies = [aiResponse];
    } else {
      // Parse single message response
      const cleanResponse = aiResponse
        .split('\n')[0] // Take first line only
        .replace(/^\d+[\.\)]\s*/, "")
        .replace(/^[-•]\s*/, "")
        .replace(/^(Option|Reply|Response)\s*\d*[:\.]?\s*/i, "")
        .trim();
      
      replies = cleanResponse.length > 5 ? [cleanResponse] : [aiResponse.trim()];
    }

    //  Save AI response to memory
    conversationMemory.push({
      role: "assistant",
      content: replies.join(" | "),
      timestamp: Date.now(),
      mode: mode
    });

    //  Send response with metadata
    res.json({ 
      replies,
      mode,
      context,
      sessionActive: craftingSession.isActive,
      originalMessage: craftingSession.originalMessage
    });

  } catch (error) {
    console.error("❌ Error generating response:", error);
    res.status(500).json({ 
      error: "AI temporarily unavailable",
      replies: ["Sorry, I'm having technical difficulties. Try again in a moment!"]
    });
  }
});

//  Reset crafting session endpoint
app.post("/reset-session", (req, res) => {
  craftingSession = {
    originalMessage: null,
    isActive: false,
    iterations: 0
  };
  res.json({ success: true });
});

//  Get session status
app.get("/session-status", (req, res) => {
  res.json({
    craftingSession,
    userProfile,
    memorySize: conversationMemory.length
  });
});

app.listen(port, () => {
  console.log(`🔥 Enhanced Wingbot Server running on http://localhost:${port}`);
  console.log(`💪 Ready to help users dominate the dating game!`);
});