import { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";

interface MicRecorderProps {
  onRecorded: (file: File) => void;
  disabled?: boolean;
}

export function MicRecorder({ onRecorded, disabled }: MicRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      chunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timerRef.current);
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        onRecorded(file);
        setDuration(0);
      };

      recorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      console.error("Microphone access denied");
    }
  }, [onRecorded]);

  const stop = useCallback(() => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <button
      onClick={isRecording ? stop : start}
      disabled={disabled && !isRecording}
      className={`
        w-full flex items-center justify-center gap-3 rounded-2xl py-4 px-6 
        font-display text-sm font-medium transition-all duration-300
        ${isRecording
          ? "bg-destructive/10 border-2 border-destructive/40 text-destructive hover:bg-destructive/20"
          : "bg-surface border-2 border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
        }
        ${disabled && !isRecording ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      {isRecording ? (
        <>
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
          </span>
          <span>Recording {fmt(duration)}</span>
          <Square className="w-4 h-4 ml-1" />
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          <span>Record with microphone</span>
        </>
      )}
    </button>
  );
}
