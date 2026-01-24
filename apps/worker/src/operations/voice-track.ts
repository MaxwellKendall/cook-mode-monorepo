import type { Job } from '@cook-mode/redis';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { recordTokenUsage, getRemainingMinutes } from '@cook-mode/db';
import type { JobMessage, VoiceTrackPayload } from '@cook-mode/shared';

const pubsub = createPubSub();

export async function processVoiceTrack(job: Job<JobMessage>): Promise<void> {
  const { operation } = job.data;
  const payload = operation.payload as VoiceTrackPayload;
  const { userId, inputTokens, outputTokens } = payload;

  try {
    // Record token usage in database
    const result = await recordTokenUsage(userId, inputTokens, outputTokens);

    // Get updated minutes remaining
    const minutesRemaining = await getRemainingMinutes(userId);

    // Publish voice usage update
    await pubsub.publish(CHANNELS.voice(userId), {
      minutesRemaining,
      costRemaining: result.costRemaining,
      inputTokens,
      outputTokens,
      hasAvailable: result.hasAvailable,
    });

    await job.updateProgress(100);

    console.log(
      `Voice usage tracked for user ${userId}: ${inputTokens} input, ${outputTokens} output tokens`
    );
  } catch (error) {
    console.error(`Failed to track voice usage for user ${userId}:`, error);
    throw error;
  }
}
