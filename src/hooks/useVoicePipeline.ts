import { useState, useCallback, useRef } from "react";
import { apiConfig } from "@/config/api";
import { PipelineState, initialPipelineState, ChatMessage } from "@/types/pipeline";

function extractSentences(text: string): { sentences: string[]; remainder: string } {
  const regex = /[^.!?\n]*[.!?\n]+/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const s = match[0].trim();
    if (s) sentences.push(s);
    lastIndex = regex.lastIndex;
  }
  return { sentences, remainder: text.slice(lastIndex) };
}

async function textToSpeech(text: string): Promise<Blob> {
  const res = await fetch(apiConfig.tts.url, {
    method: "POST",
    headers: { ...apiConfig.tts.headers },
    body: JSON.stringify({
      model: apiConfig.tts.model,
      voice: apiConfig.tts.voice,
      input: text,
      language: apiConfig.tts.language,
      response_format: apiConfig.tts.response_format,
    }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return res.blob();
}

export function useVoicePipeline() {
  const [state, setState] = useState<PipelineState>(initialPipelineState);
  const historyRef = useRef<ChatMessage[]>([]);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const allTtsDoneRef = useRef(false);

  const playNext = useCallback(() => {
    if (audioQueueRef.current.length > 0) {
      const nextUrl = audioQueueRef.current.shift()!;
      isPlayingRef.current = true;
      setState(s => {
        if (s.audioResponseUrl) URL.revokeObjectURL(s.audioResponseUrl);
        return { ...s, audioResponseUrl: nextUrl, stage: "playing" };
      });
    } else if (allTtsDoneRef.current) {
      // All audio played, allow new message
      isPlayingRef.current = false;
      setState(s => {
        if (s.audioResponseUrl) URL.revokeObjectURL(s.audioResponseUrl);
        return { ...s, audioResponseUrl: null, stage: "idle" };
      });
    } else {
      // Queue empty but more TTS coming, wait
      isPlayingRef.current = false;
    }
  }, []);

   const enqueueTTS = useCallback(async (sentence: string) => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    try {
      const blob = await textToSpeech(sentence);
      const url = URL.createObjectURL(blob);
      audioQueueRef.current.push(url);
      if (!isPlayingRef.current) {
        playNext();
      }
    } catch (e) {
      console.error("TTS error for sentence:", e);
    }
  }, [playNext]);

  const onPlaybackEnd = useCallback(() => {
    playNext();
  }, [playNext]);

  const reset = useCallback(() => {
    setState(prev => {
      if (prev.audioResponseUrl) URL.revokeObjectURL(prev.audioResponseUrl);
      return initialPipelineState;
    });
    historyRef.current = [];
    audioQueueRef.current.forEach(url => URL.revokeObjectURL(url));
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    allTtsDoneRef.current = false;
  }, []);

  const processAudio = useCallback(async (audioFile: File) => {
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
    audioQueueRef.current.forEach(url => URL.revokeObjectURL(url));
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    allTtsDoneRef.current = false;

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

      historyRef.current = [...historyRef.current, { role: "user", content: transcript }];

      setState(s => ({
        ...s,
        transcript,
        stage: "thinking",
        history: [...historyRef.current],
      }));

      // Step 2: AI streaming
      const aiRes = await fetch(apiConfig.ai.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...apiConfig.ai.headers },
        body: JSON.stringify({
          model: apiConfig.ai.model,
          stream: true,
          messages: [
            { role: "system", content: "You are a helpful voice assistant. Keep responses concise and natural for speech." },
            ...historyRef.current,
          ],
        }),
      });
      if (!aiRes.ok) throw new Error(`AI failed: ${aiRes.status}`);

      const reader = aiRes.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let processedUpTo = 0;
      const ttsPromises: Promise<void>[] = [];
      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        // Keep the last element as it may be incomplete
        sseBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setState(s => ({ ...s, aiResponse: fullText }));

              // Check for complete sentences
              const unprocessed = fullText.slice(processedUpTo);
              const { sentences, remainder } = extractSentences(unprocessed);
              if (sentences.length > 0) {
                processedUpTo = fullText.length - remainder.length;
                for (const sentence of sentences) {
                  ttsPromises.push(enqueueTTS(sentence));
                }
                setState(s => ({ ...s, stage: "synthesizing" }));
              }
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      // Send any remaining text to TTS
      const remaining = fullText.slice(processedUpTo).trim();
      if (remaining) {
        ttsPromises.push(enqueueTTS(remaining));
      }

      // Add assistant message to history
      historyRef.current = [...historyRef.current, { role: "assistant", content: fullText }];
      setState(s => ({ ...s, history: [...historyRef.current] }));

      // Wait for all TTS requests to finish
      await Promise.all(ttsPromises);
      allTtsDoneRef.current = true;

      // If nothing is currently playing, start playback
      if (!isPlayingRef.current) {
        playNext();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState(s => ({ ...s, stage: "error", error: message }));
    }
  }, [enqueueTTS, playNext]);

  return { state, processAudio, reset, onPlaybackEnd };
}
