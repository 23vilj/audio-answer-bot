import { useCallback, useState, useRef } from "react";
import { Upload, Mic } from "lucide-react";

interface AudioUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function AudioUploader({ onFileSelected, disabled }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    onFileSelected(file);
  }, [onFileSelected]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative group cursor-pointer rounded-2xl border-2 border-dashed p-12
        flex flex-col items-center justify-center gap-4 transition-all duration-300
        ${isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-surface-hover"
        }
        ${disabled ? "opacity-50 pointer-events-none" : ""}
      `}
    >
      <div className={`
        w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
        ${isDragging ? "bg-primary/20 animate-pulse-glow" : "bg-surface group-hover:bg-primary/10"}
      `}>
        {isDragging ? (
          <Mic className="w-8 h-8 text-primary" />
        ) : (
          <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>

      <div className="text-center">
        <p className="font-display text-sm font-medium text-foreground">
          {fileName || "Drop audio file here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse · MP3, WAV, M4A, OGG
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={onChange}
        className="hidden"
      />
    </div>
  );
}
