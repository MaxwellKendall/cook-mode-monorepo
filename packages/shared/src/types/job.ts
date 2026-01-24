export type JobOperationType = 'recipe.extract' | 'voice.track';

export interface RecipeExtractPayload {
  url: string;
  userId?: string;
}

export interface VoiceTrackPayload {
  userId: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
}

export type JobPayload = RecipeExtractPayload | VoiceTrackPayload;

export interface JobOperation {
  type: JobOperationType;
  payload: JobPayload;
}

export interface JobMessage {
  jobId: string;
  operation: JobOperation;
  createdAt: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  operation: JobOperation;
  status: JobStatus;
  result?: unknown;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface JobEvent {
  id: string;
  jobId: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

export type RecipeExtractionStage =
  | 'extracting'
  | 'enriching'
  | 'embedding'
  | 'storing'
  | 'completed'
  | 'failed';

export interface RecipeProgressMessage {
  jobId: string;
  stage: RecipeExtractionStage;
  progress: number;
  message?: string;
  recipeId?: string;
  error?: string;
}
