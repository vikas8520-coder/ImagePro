// AI client with fallback chain: Gemini Flash → Ollama

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";
const GEMINI_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

interface AIResponse {
  text: string;
  model: string;
  provider: "ollama" | "gemini";
}

async function callOllama(prompt: string, system?: string): Promise<AIResponse> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      system: system || "",
      stream: false,
      options: { temperature: 0.3 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return { text: data.response, model: OLLAMA_MODEL, provider: "ollama" };
}

async function callGemini(prompt: string, system?: string): Promise<AIResponse> {
  if (!GEMINI_KEY) throw new Error("No GOOGLE_AI_API_KEY");

  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text, model: GEMINI_MODEL, provider: "gemini" };
}

export async function aiGenerate(prompt: string, system?: string): Promise<AIResponse> {
  // Try Gemini first (works on Vercel + free tier)
  try {
    return await callGemini(prompt, system);
  } catch (e) {
    console.log("[AI] Gemini failed, falling back to Ollama:", (e as Error).message);
  }

  // Fallback to Ollama (local dev)
  try {
    return await callOllama(prompt, system);
  } catch (e) {
    console.log("[AI] Ollama failed:", (e as Error).message);
  }

  throw new Error("All AI providers failed");
}

export async function aiJSON<T>(prompt: string, system?: string): Promise<{ data: T; model: string; provider: string }> {
  const jsonSystem = (system || "") + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no code fences, no explanation.";
  const result = await aiGenerate(prompt, jsonSystem);

  // Extract JSON from response (handle markdown code fences)
  let text = result.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const data = JSON.parse(text) as T;
  return { data, model: result.model, provider: result.provider };
}
