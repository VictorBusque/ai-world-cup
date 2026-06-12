import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Ensure DNS resolution defaults to ipv4 to prevent connection timeouts in some systems
dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please configure it in the Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ==================== API ENDPOINTS ====================

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Endpoint to generate full-leaderboard AI analysis
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { modelStandingText, matchSummaryText } = req.body;
    
    const client = getAiClient();
    const prompt = `You are a world-class soccer analyst, statistician, and tech reporter. Your task is to analyze the current performance of several AI Models forecasting World Cup outcomes.

Here is the current model rankings state:
${modelStandingText}

Here are the match prediction discrepancies or updates:
${matchSummaryText}

Please write a highly engaging, professional, and slightly witty newsletter-style sports brief (max 350 words). Focus on:
1. Which AI model is currently leading the pack, what their predictive identity is, and if their "vibe" is actually paying off in the stats.
2. An interesting insight about how these models disagree (e.g., DeepSeek's high upset rating vs. Opus's conservative draw bias, Fable's dramatic storylines).
3. A punchy final headline statement.

Use bullet-points where appropriate and format in neat Markdown syntax. Keep the tone friendly, objective, and highly engaging for both programmers and football fans!`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini summarize error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI analysis." });
  }
});

// Endpoint to generate specific match forecasting explanation and comparison
app.post("/api/gemini/explain-match", async (req, res) => {
  try {
    const { matchDetails } = req.body;
    
    const client = getAiClient();
    const prompt = `You are a tactical soccer expert and AI modeling evaluator. Compare the following match details and the divergent forecasts made by various artificial intelligence models:

${JSON.stringify(matchDetails, null, 2)}

Provide a sharp, 3-paragraph tactical break-down:
1. **The Tactical Matchup**: Briefly describe the tactical reality of this game (the strengths of Team A vs Team B).
2. **AI Forecast Discrepancies**: Contrast how distinct models predicted this match. Highlight *why* a particular model predicted what it did based on its style (e.g., Gemini's focus on transitions, GPT-5.5's historical momentum, DeepSeek's statistical probabilities, Opus's defensive caution, or Fable's narrative flares).
3. **The Consensus Prediction**: Give a professional soccer coach's unified prediction and key player to watch.

Format neatly in Markdown. Keep it brief, smart, and tactical (max 300 words).`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini explain-match error:", error);
    res.status(500).json({ error: error.message || "Failed to generate tactical breakdown." });
  }
});

// ==================== VITE MIDDLEWARE SETUP ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static assets under the Vite base path (/ai-world-cup/) so that
    // the production build's asset and data fetches resolve correctly.
    // Also serve at root as a fallback.
    const base = "/ai-world-cup";
    app.use(base, express.static(distPath));
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting backend server:", err);
});
