/**
 * ═══════════════════════════════════════════════════════
 *  API CONFIGURATION — Edit endpoints and keys here
 * ═══════════════════════════════════════════════════════
 */

const API_KEY = "YOUR_API_KEY_HERE";

export const apiConfig = {
  stt: {
    url: "https://teachgpt-teachgpt-test.apps.okd.ssis.nu/api/v1/audio/transcriptions",
    headers: { Authorization: `Bearer ${API_KEY}` } as Record<string, string>,
    model: "kb-whisper-large",
  },
  ai: {
    url: "http://localhost:8000/ai",
    headers: {} as Record<string, string>,
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
