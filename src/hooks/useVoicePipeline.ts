import { useState, useCallback, useRef } from "react";
import { apiConfig } from "@/config/api";
import { PipelineState, initialPipelineState, ChatMessage } from "@/types/pipeline";

export function useVoicePipeline() {
  const [state, setState] = useState<PipelineState>(initialPipelineState);
  const historyRef = useRef<ChatMessage[]>([]);

  const reset = useCallback(() => {
    setState(prev => {
      if (prev.audioResponseUrl) URL.revokeObjectURL(prev.audioResponseUrl);
      return initialPipelineState;
    });
    historyRef.current = [];
  }, []);

  const processAudio = useCallback(async (audioFile: File) => {
    // Revoke previous audio URL but keep history
    setState(prev => {
      if (prev.audioResponseUrl) URL.revokeObjectURL(prev.audioResponseUrl);
      return {
        ...prev,
        stage: "transcribing",
        transcript: null,
        aiResponse: null,
        audioResponseUrl: null,
        error: null,
      };
    });

    try {
      // Step 1: STT
      const sttForm = new FormData();
      sttForm.append("file", audioFile);
      sttForm.append("model", apiConfig.stt.model);

      const sttRes = await fetch(apiConfig.stt.url, {
        method: "POST",
        headers: { ...apiConfig.stt.headers },
        body: sttForm,
      });
      if (!sttRes.ok) throw new Error(`STT failed: ${sttRes.status}`);
      const sttData = await sttRes.json();
      const transcript = sttData.text || sttData.transcript || JSON.stringify(sttData);

      // Add user message to history
      historyRef.current = [...historyRef.current, { role: "user", content: transcript }];

      setState(s => ({
        ...s,
        transcript,
        stage: "thinking",
        history: [...historyRef.current],
      }));

      // Step 2: AI with full conversation history
      const aiRes = await fetch(apiConfig.ai.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiConfig.ai.headers },
        body: JSON.stringify({
          model: apiConfig.ai.model,
          messages: [
            { role: "system", content: "You are a helpful voice assistant. Keep responses concise and natural for speech." },
            ...historyRef.current,
          ],
        }),
      });
      if (!aiRes.ok) throw new Error(`AI failed: ${aiRes.status}`);
      const aiData = await aiRes.json();
      const aiResponse = aiData.choices?.[0]?.message?.content || JSON.stringify(aiData);

      // Add assistant message to history
      historyRef.current = [...historyRef.current, { role: "assistant", content: aiResponse }];

      setState(s => ({
        ...s,
        aiResponse,
        stage: "synthesizing",
        history: [...historyRef.current],
      }));

      // Step 3: TTS
      const ttsRes = await fetch(apiConfig.tts.url, {
        method: "POST",
        headers: { ...apiConfig.tts.headers },
        body: JSON.stringify({
          model: apiConfig.tts.model,
          voice: apiConfig.tts.voice,
          input: aiResponse,
          language: apiConfig.tts.language,
          response_format: apiConfig.tts.response_format,
        }),
      });
      if (!ttsRes.ok) throw new Error(`TTS failed: ${ttsRes.status}`);

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setState(s => ({ ...s, audioResponseUrl: audioUrl, stage: "complete" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState(s => ({ ...s, stage: "error", error: message }));
    }
  }, []);

  return { state, processAudio, reset };
}
