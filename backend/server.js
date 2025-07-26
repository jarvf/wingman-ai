import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// 🔥 GROQ API endpoint
app.post("/generate", async (req, res) => {
  try {
    const { convoText, tone } = req.body;

    const prompt = `
      You are an AI wingman helping write dating app replies.
      Tone: ${tone}.
      Chat or bio text: "${convoText}".
      Generate 3 short, witty, natural replies (less than 25 words each).
    `;

    // ✅ Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are a witty dating coach." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const aiText = data.choices[0].message.content;
    res.json({ replies: aiText.split("\n").filter(r => r.trim() !== "") });
  } catch (error) {
    console.error("❌ Error generating reply:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
