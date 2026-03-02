export type PipelineStage = "idle" | "uploading" | "transcribing" | "thinking" | "synthesizing" | "complete" | "error";

export interface PipelineState {
  stage: PipelineStage;
  transcript: string | null;
  aiResponse: string | null;
  audioResponseUrl: string | null;
  error: string | null;
}

export const initialPipelineState: PipelineState = {
  stage: "idle",
  transcript: null,
  aiResponse: null,
  audioResponseUrl: null,
  error: null,
};
