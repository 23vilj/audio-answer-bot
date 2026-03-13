import { AudioUploader } from "@/components/AudioUploader";
import { VoiceOrb } from "@/components/VoiceOrb";
import { PipelineStep } from "@/components/PipelineStep";
import { useVoicePipeline } from "@/hooks/useVoicePipeline";
import type { PipelineStage } from "@/types/pipeline";
import { RotateCcw, Zap } from "lucide-react";

const steps: { stage: PipelineStage; label: string; description: string }[] = [
  { stage: "transcribing", label: "Transcribing", description: "Converting speech to text" },
  { stage: "thinking", label: "Thinking", description: "AI is generating a response" },
  { stage: "synthesizing", label: "Synthesizing", description: "Converting text to speech" },
];

function getCompletedStages(current: PipelineStage): PipelineStage[] {
  const order: PipelineStage[] = ["transcribing", "thinking", "synthesizing", "complete"];
  const idx = order.indexOf(current);
  return idx > 0 ? order.slice(0, idx) : [];
}

const Index = () => {
  const { state, processAudio, reset, continueConversation } = useVoicePipeline();
  const isProcessing = !["idle", "complete", "error"].includes(state.stage);

  // Past conversation pairs (exclude the current exchange)
  const pastPairs: { user: string; assistant: string }[] = [];
  const historyWithoutCurrent = state.history.slice(
    0,
    state.stage === "complete" ? state.history.length - 2 : state.history.length - 1
  );
  for (let i = 0; i < historyWithoutCurrent.length; i += 2) {
    const user = historyWithoutCurrent[i];
    const assistant = historyWithoutCurrent[i + 1];
    if (user && assistant) {
      pastPairs.push({ user: user.content, assistant: assistant.content });
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Voice Oracle</h1>
          </div>
          {state.stage !== "idle" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-display"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New conversation
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-8">
          {/* Central Orb */}
          <div className="flex justify-center">
            <VoiceOrb
              onRecorded={processAudio}
              disabled={isProcessing}
              isProcessing={isProcessing}
              audioSrc={state.audioResponseUrl}
            />
          </div>

          {/* File upload fallback */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-display text-muted-foreground">or upload a file</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <AudioUploader onFileSelected={processAudio} disabled={isProcessing} />
          </div>

          {/* Past conversation history */}
          {pastPairs.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-display text-muted-foreground uppercase tracking-wider px-1">
                Conversation
              </p>
              {pastPairs.map((pair, i) => (
                <div key={i} className="space-y-2 opacity-60">
                  <div className="bg-surface rounded-xl p-4 border border-border">
                    <p className="text-sm text-foreground leading-relaxed">"{pair.user}"</p>
                  </div>
                  <div className="bg-surface rounded-xl p-4 border border-primary/20">
                    <p className="text-sm text-foreground leading-relaxed">{pair.assistant}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pipeline progress */}
          {!["idle", "complete"].includes(state.stage) && (
            <div className="space-y-2">
              <p className="text-xs font-display text-muted-foreground uppercase tracking-wider px-1">
                Pipeline
              </p>
              {steps.map((step, i) => (
                <PipelineStep
                  key={step.stage}
                  label={step.label}
                  description={step.description}
                  stage={step.stage}
                  activeStage={state.stage}
                  completedStages={getCompletedStages(state.stage)}
                  index={i}
                />
              ))}
            </div>
          )}

          {/* Transcript */}
          {state.transcript && (
            <div className="space-y-2 animate-float-up">
              <p className="text-xs font-display text-muted-foreground uppercase tracking-wider px-1">
                You said
              </p>
              <div className="bg-surface rounded-xl p-4 border border-border">
                <p className="text-sm text-foreground leading-relaxed">"{state.transcript}"</p>
              </div>
            </div>
          )}

          {/* AI Response */}
          {state.aiResponse && (
            <div className="space-y-2 animate-float-up">
              <p className="text-xs font-display text-muted-foreground uppercase tracking-wider px-1">
                AI Response
              </p>
              <div className="bg-surface rounded-xl p-4 border border-primary/20">
                <p className="text-sm text-foreground leading-relaxed">{state.aiResponse}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-float-up">
              <p className="text-sm font-display text-destructive">{state.error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
