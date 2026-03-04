import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square } from "lucide-react";

interface VoiceOrbProps {
  onRecorded: (file: File) => void;
  disabled?: boolean;
  audioSrc?: string | null;
  isProcessing?: boolean;
}

const NUM_POINTS = 32;

export function VoiceOrb({ onRecorded, disabled, audioSrc, isProcessing }: VoiceOrbProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [levels, setLevels] = useState<number[]>(new Array(NUM_POINTS).fill(0));

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Recording
  const startRecording = useCallback(async () => {
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

  const stopRecording = useCallback(() => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  }, []);

  // Audio playback with analyser
  useEffect(() => {
    if (!audioSrc) {
      setIsPlaying(false);
      setLevels(new Array(NUM_POINTS).fill(0));
      return;
    }

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyserRef.current = analyser;

    const source = ctx.createMediaElementSource(audio);
    sourceRef.current = source;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    audio.play();
    setIsPlaying(true);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const newLevels: number[] = [];
      for (let i = 0; i < NUM_POINTS; i++) {
        const idx = Math.floor((i / NUM_POINTS) * dataArray.length);
        newLevels.push(dataArray[idx] / 255);
      }
      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    audio.onended = () => {
      setIsPlaying(false);
      setLevels(new Array(NUM_POINTS).fill(0));
    };

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audio.pause();
      source.disconnect();
      analyser.disconnect();
      ctx.close();
    };
  }, [audioSrc]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Determine visual state
  const hasAudio = !!audioSrc;
  const showVisualizer = hasAudio;
  const orbActive = isRecording || isProcessing || isPlaying;

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else if (hasAudio) {
      togglePlayback();
    } else if (!disabled) {
      startRecording();
    }
  };

  // Draw points around circle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    canvas.width = size * 2; // retina
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = 80;

    ctx.clearRect(0, 0, size, size);

    for (let i = 0; i < NUM_POINTS; i++) {
      const angle = (i / NUM_POINTS) * Math.PI * 2 - Math.PI / 2;
      const level = levels[i];
      const pointRadius = baseRadius + level * 40;
      const x = cx + Math.cos(angle) * pointRadius;
      const y = cy + Math.sin(angle) * pointRadius;

      const dotSize = 2.5 + level * 3;
      const alpha = 0.3 + level * 0.7;

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, dotSize + 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(180, 70%, 50%, ${alpha * 0.3})`;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(180, 70%, 50%, ${alpha})`;
      ctx.fill();
    }
  }, [levels]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Orb container */}
      <div className="relative w-[280px] h-[280px] flex items-center justify-center">
        {/* Visualizer canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            showVisualizer ? "opacity-100" : "opacity-0"
          }`}
          style={{ width: 280, height: 280 }}
        />

        {/* Central button */}
        <button
          onClick={handleClick}
          disabled={disabled && !isRecording && !hasAudio}
          className={`
            relative z-10 rounded-full flex items-center justify-center
            transition-all duration-500 ease-out
            ${showVisualizer
              ? "w-24 h-24"
              : isRecording
                ? "w-32 h-32"
                : "w-28 h-28"
            }
            ${isRecording
              ? "bg-destructive/20 border-2 border-destructive/60 shadow-[0_0_40px_hsl(0_70%_55%/0.3)]"
              : isPlaying
                ? "bg-primary/20 border-2 border-primary/60 shadow-[0_0_40px_hsl(180_70%_50%/0.4)]"
                : isProcessing
                  ? "bg-primary/10 border-2 border-primary/30 animate-pulse"
                  : hasAudio
                    ? "bg-primary/15 border-2 border-primary/40 hover:border-primary/60 hover:shadow-[0_0_30px_hsl(180_70%_50%/0.3)]"
                    : "bg-surface border-2 border-border hover:border-primary/50 hover:shadow-[0_0_30px_hsl(180_70%_50%/0.2)]"
            }
            ${disabled && !isRecording && !hasAudio ? "opacity-40 pointer-events-none" : "cursor-pointer"}
          `}
        >
          {isRecording ? (
            <div className="flex flex-col items-center gap-1">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive" />
              </span>
              <Square className="w-5 h-5 text-destructive mt-1" />
            </div>
          ) : isProcessing ? (
            <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          ) : hasAudio ? (
            isPlaying ? (
              <div className="flex gap-1 items-end h-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    style={{
                      height: `${12 + levels[i * 6] * 16}px`,
                      transition: "height 0.1s ease",
                    }}
                  />
                ))}
              </div>
            ) : (
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )
          ) : (
            <Mic className="w-8 h-8 text-muted-foreground" />
          )}
        </button>

        {/* Ambient glow ring */}
        {!showVisualizer && !isRecording && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-36 h-36 rounded-full border border-border/30 animate-pulse-glow" />
          </div>
        )}
      </div>

      {/* Status label */}
      <div className="text-center font-display text-sm">
        {isRecording ? (
          <span className="text-destructive">Recording {fmt(duration)} — tap to stop</span>
        ) : isProcessing ? (
          <span className="text-muted-foreground">Processing…</span>
        ) : isPlaying ? (
          <span className="text-primary">Playing — tap to pause</span>
        ) : hasAudio ? (
          <span className="text-muted-foreground">Tap to play response</span>
        ) : (
          <span className="text-muted-foreground">Tap to record</span>
        )}
      </div>
    </div>
  );
}
