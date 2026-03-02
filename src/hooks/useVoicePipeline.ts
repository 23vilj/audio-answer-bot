import { useState, useCallback } from "react";
import { ApiConfig } from "@/config/api";
import { PipelineState, initialPipelineState } from "@/types/pipeline";

export function useVoicePipeline(config: ApiConfig) {
  const [state, setState] = useState<PipelineState>(initialPipelineState);

  const reset = useCallback(() => {
    setState(initialPipelineState);
  }, []);

  const processAudio = useCallback(async (audioFile: File) => {
    setState({ ...initialPipelineState, stage: "uploading" });

    try {
      // Step 1: STT
      setState(s => ({ ...s, stage: "transcribing" }));
      const sttForm = new FormData();
      sttForm.append("audio", audioFile);

      const sttRes = await fetch(config.sttEndpoint, {
        method: "POST",
        body: sttForm,
      });
      if (!sttRes.ok) throw new Error(`STT failed: ${sttRes.status}`);
      const sttData = await sttRes.json();
      const transcript = sttData.text || sttData.transcript || JSON.stringify(sttData);

      setState(s => ({ ...s, transcript, stage: "thinking" }));

      // Step 2: AI
      const aiRes = await fetch(config.aiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript, message: transcript }),
      });
      if (!aiRes.ok) throw new Error(`AI failed: ${aiRes.status}`);
      const aiData = await aiRes.json();
      const aiResponse = aiData.text || aiData.response || aiData.answer || JSON.stringify(aiData);

      setState(s => ({ ...s, aiResponse, stage: "synthesizing" }));

      // Step 3: TTS
      const ttsRes = await fetch(config.ttsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiResponse }),
      });
      if (!ttsRes.ok) throw new Error(`TTS failed: ${ttsRes.status}`);

      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      setState(s => ({ ...s, audioResponseUrl: audioUrl, stage: "complete" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState(s => ({ ...s, stage: "error", error: message }));
    }
  }, [config]);

  return { state, processAudio, reset };
}
