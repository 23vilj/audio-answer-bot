import { Check, Loader2, AlertCircle } from "lucide-react";
import type { PipelineStage } from "@/types/pipeline";

interface PipelineStepProps {
  label: string;
  description: string;
  stage: PipelineStage;
  activeStage: PipelineStage;
  completedStages: PipelineStage[];
  index: number;
}

export function PipelineStep({ label, description, stage, activeStage, completedStages, index }: PipelineStepProps) {
  const isActive = activeStage === stage;
  const isComplete = completedStages.includes(stage);
  const isError = activeStage === "error";

  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-xl transition-all duration-500
        animate-float-up
        ${isActive ? "bg-primary/5 border border-primary/20" : ""}
        ${isComplete ? "bg-success/5 border border-success/20" : ""}
        ${!isActive && !isComplete ? "border border-transparent" : ""}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
        ${isActive ? "bg-primary/20 animate-pulse-glow" : ""}
        ${isComplete ? "bg-success/20" : ""}
        ${!isActive && !isComplete ? "bg-surface" : ""}
      `}>
        {isActive && !isError && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
        {isActive && isError && <AlertCircle className="w-5 h-5 text-destructive" />}
        {isComplete && <Check className="w-5 h-5 text-success" />}
        {!isActive && !isComplete && (
          <span className="text-sm font-display text-muted-foreground">{index + 1}</span>
        )}
      </div>

      <div className="min-w-0">
        <p className={`
          font-display text-sm font-medium transition-colors
          ${isActive ? "text-primary" : ""}
          ${isComplete ? "text-success" : ""}
          ${!isActive && !isComplete ? "text-muted-foreground" : ""}
        `}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </div>
  );
}
