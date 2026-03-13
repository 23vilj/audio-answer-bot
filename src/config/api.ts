/**
 * ═══════════════════════════════════════════════════════
 *  API CONFIGURATION — Edit endpoints and keys here
 * ═══════════════════════════════════════════════════════
 */

// Import local secrets (not tracked by git)
// Create src/config/api.local.ts with your actual API key
import { LOCAL_API_KEY } from "./api.local";

const API_KEY = LOCAL_API_KEY !== "YOUR_API_KEY_HERE" ? LOCAL_API_KEY : "YOUR_API_KEY_HERE";

export const apiConfig = {
  stt: {
    url: "https://teachgpt-teachgpt-test.apps.okd.ssis.nu/api/v1/audio/transcriptions",
    headers: { Authorization: `Bearer ${API_KEY}` } as Record<string, string>,
    model: "faster-distil-whisper-small.en",
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
