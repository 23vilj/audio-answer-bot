/**
 * ═══════════════════════════════════════════════════════
 *  API CONFIGURATION — Edit endpoints and keys here
 * ═══════════════════════════════════════════════════════
 */

export const apiConfig = {
  stt: {
    url: "http://localhost:8000/stt",
    /** Optional headers (e.g. auth). Merged into every STT request. */
    headers: {} as Record<string, string>,
  },
  ai: {
    url: "http://localhost:8000/ai",
    headers: {} as Record<string, string>,
  },
  tts: {
    url: "http://localhost:8000/tts",
    headers: {} as Record<string, string>,
  },
} as const;
