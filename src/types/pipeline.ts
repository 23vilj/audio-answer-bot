export type PipelineStage = "idle" | "uploading" | "transcribing" | "thinking" | "synthesizing" | "playing" | "complete" | "error";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface PipelineState {
  stage: PipelineStage;
  transcript: string | null;
  aiResponse: string | null;
  audioResponseUrl: string | null;
  error: string | null;
  history: ChatMessage[];
}

export const initialPipelineState: PipelineState = {
  stage: "idle",
  transcript: null,
  aiResponse: null,
  audioResponseUrl: null,
  error: null,
  history: [],
};
