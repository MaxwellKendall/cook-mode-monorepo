import { z } from 'zod';

export const RecipeExtractPayloadSchema = z.object({
  url: z.string().url(),
  userId: z.string().uuid().optional(),
});

export const VoiceTrackPayloadSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

export const JobOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('recipe.extract'),
    payload: RecipeExtractPayloadSchema,
  }),
  z.object({
    type: z.literal('voice.track'),
    payload: VoiceTrackPayloadSchema,
  }),
]);

export const CreateJobRequestSchema = z.object({
  operation: JobOperationSchema,
});

export const JobMessageSchema = z.object({
  jobId: z.string().uuid(),
  operation: JobOperationSchema,
  createdAt: z.string().datetime(),
});

export type CreateJobRequest = z.infer<typeof CreateJobRequestSchema>;
