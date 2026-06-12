import "dotenv/config";
import { readFile, writeFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AI_GATEWAY_URL = "https://ai-gateway.stack.victorbusque.com/v1/chat/completions";
const AI_GATEWAY_KEY = process.env.AI_GATEWAY_KEY;
const OUTPUT_DIR = join(__dirname, "..", "public", "data", "models");
const PROMPT_PATH = join(__dirname, "prediction_prompt.md");

const MODELS = [
  // OpenAI
  { model: "gpt-5.5", file: "gpt-5.5" },

  // // Anthropic
  { model: "claude-sonnet-4-6", file: "claude-sonnet-4-6" },
  { model: "claude-opus-4-8", file: "claude-opus-4-8" },
  { model: "claude-fable-5", file: "claude-fable-5" },

  // Google
  { model: "gemini-3.1-pro-preview", file: "gemini-3.1-pro" },
  { model: "gemini-3.5-flash", file: "gemini-3.5-flash" },

  // DeepSeek
  { model: "deepseek-v4-flash", file: "deepseek-v4-flash" },
  { model: "deepseek-v4-pro", file: "deepseek-v4-pro" },

  // Mistral
  { model: "mistral-medium-3-5", file: "mistral-medium-3.5" },

  // Z.AI
  { model: "glm-5.1", file: "glm-5.1" },

  // Moonshot AI
  { model: "moonshotai/kimi-k2.6:free", file: "kimi-k2.6" },


  // Nvidia AI
  { model: "nvidia/nemotron-3-ultra-550b-a55b:free", file: "nemotron-3-ultra" },

];

if (!AI_GATEWAY_KEY) {
  console.error("Error: AI_GATEWAY_KEY environment variable is not set.");
  process.exit(1);
}

async function predict(modelConfig, systemPrompt) {
  const { model, file } = modelConfig;
  const outPath = join(OUTPUT_DIR, `${file}.json`);

  try {
    await access(outPath);
    console.log(`⊘ ${model} skipped (${outPath} exists)`);
    return null;
  } catch {}

  console.log(`→ Querying ${model}...`);

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Send me the JSON with your predictions" },
    ],
    temperature: 0,
    max_tokens: 8192,
  };

  const res = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_GATEWAY_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000), // 2 min per model
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`✗ ${model} failed (${res.status}): ${text}`);
    return null;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error(`✗ ${model} returned no content`);
    return null;
  }

  // Extract JSON from the response (handles markdown code fences)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, null, content];
  const rawJson = jsonMatch[1] || content;

  try {
    const parsed = JSON.parse(rawJson.trim());
    await writeFile(outPath, JSON.stringify(parsed, null, 2) + "\n");
    console.log(`✓ ${model} → ${outPath}`);
    return parsed;
  } catch (e) {
    console.error(`✗ ${model} returned invalid JSON: ${e.message}`);
    console.error(`  Raw content: ${content.slice(0, 200)}...`);
    return null;
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const systemPrompt = await readFile(PROMPT_PATH, "utf-8");

  console.log(`Running predictions for ${MODELS.length} models...\n`);

  // Run sequentially to avoid rate limits; change to Promise.all for parallel
  for (const modelConfig of MODELS) {
    await predict(modelConfig, systemPrompt);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
