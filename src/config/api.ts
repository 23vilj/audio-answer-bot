/**
 * ═══════════════════════════════════════════════════════
 *  API CONFIGURATION — Edit endpoints and keys here
 * ═══════════════════════════════════════════════════════
 */

// Try to import from local secrets file (not tracked by git)
// Falls back to placeholder if local file doesn't exist
let API_KEY = "YOUR_API_KEY_HERE";

try {
  // Dynamic import to avoid build errors if file doesn't exist
  const localSecrets = await import("./api.local.ts");
  if (localSecrets.LOCAL_API_KEY && localSecrets.LOCAL_API_KEY !== "YOUR_API_KEY_HERE") {
    API_KEY = localSecrets.LOCAL_API_KEY;
  }
} catch {
  // Local secrets file doesn't exist, use placeholder
  console.log("[API] Using placeholder API key. Create src/config/api.local.ts for local development.");
}

export const apiConfig = {
  stt: {
    url: "https://teachgpt-teachgpt-test.apps.okd.ssis.nu/api/v1/audio/transcriptions",
    headers: { Authorization: `Bearer ${API_KEY}` } as Record<string, string>,
    model: "kb-whisper-large",
  },
  ai: {
    url: "https://teachgpt-teachgpt-test.apps.okd.ssis.nu/api/v1/chat/completions",
    headers: { Authorization: `Bearer ${API_KEY}` } as Record<string, string>,
    model: "Meta-Llama-3.3-70B-Instruct-AWQ",
  },
  tts: {
    url: "https://teachgpt-teachgpt-test.apps.okd.ssis.nu/api/v1/audio/speech",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    } as Record<string, string>,
    model: "Qwen3-TTS-12Hz-1.7B-CustomVoice",
    voice: "ryan",
    language: "English",
    response_format: "wav",
  },
} as const;
