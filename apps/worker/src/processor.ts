import type { Job } from '@cook-mode/redis';
import type { JobMessage } from '@cook-mode/shared';
import { processRecipeExtract } from './operations/recipe-extract.js';
import { processVoiceTrack } from './operations/voice-track.js';

export async function processJob(job: Job<JobMessage>): Promise<void> {
  const { operation } = job.data;

  switch (operation.type) {
    case 'recipe.extract':
      await processRecipeExtract(job);
      break;

    case 'voice.track':
      await processVoiceTrack(job);
      break;

    default:
      throw new Error(`Unknown operation type: ${(operation as { type: string }).type}`);
  }
}
