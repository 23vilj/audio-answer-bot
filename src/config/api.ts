export interface ApiConfig {
  sttEndpoint: string;
  aiEndpoint: string;
  ttsEndpoint: string;
}

export const defaultApiConfig: ApiConfig = {
  sttEndpoint: "http://localhost:8000/stt",
  aiEndpoint: "http://localhost:8000/ai",
  ttsEndpoint: "http://localhost:8000/tts",
};
