import type { Job } from '@cook-mode/redis';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import type { JobMessage, RecipeExtractPayload, RecipeProgressMessage } from '@cook-mode/shared';

const MCP_SERVICE_URL = process.env.MCP_SERVICE_URL || 'http://localhost:8000';

const pubsub = createPubSub();

async function publishProgress(jobId: string, progress: RecipeProgressMessage): Promise<void> {
  await pubsub.publish(CHANNELS.recipe(jobId), progress as unknown as Record<string, unknown>);
}

async function callMCPService(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${MCP_SERVICE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MCP service error: ${error}`);
  }

  return response.json();
}

export async function processRecipeExtract(job: Job<JobMessage>): Promise<void> {
  const { jobId, operation } = job.data;
  const payload = operation.payload as RecipeExtractPayload;
  const { url, userId } = payload;

  try {
    // Stage 1: Extracting
    await publishProgress(jobId, {
      jobId,
      stage: 'extracting',
      progress: 10,
      message: 'Extracting recipe from URL...',
    });

    await job.updateProgress(10);

    // Call MCP service to extract recipe
    const extractResult = (await callMCPService('/extract-and-store-recipe', 'POST', {
      url,
      user_id: userId,
    })) as { recipe_id?: string; error?: string };

    if (extractResult.error) {
      throw new Error(extractResult.error);
    }

    // Stage 2: Enriching
    await publishProgress(jobId, {
      jobId,
      stage: 'enriching',
      progress: 40,
      message: 'Enriching recipe data...',
    });

    await job.updateProgress(40);

    // Stage 3: Embedding
    await publishProgress(jobId, {
      jobId,
      stage: 'embedding',
      progress: 60,
      message: 'Creating embeddings...',
    });

    await job.updateProgress(60);

    // Stage 4: Storing
    await publishProgress(jobId, {
      jobId,
      stage: 'storing',
      progress: 80,
      message: 'Storing recipe...',
    });

    await job.updateProgress(80);

    // Stage 5: Completed
    await publishProgress(jobId, {
      jobId,
      stage: 'completed',
      progress: 100,
      message: 'Recipe extraction complete',
      recipeId: extractResult.recipe_id,
    });

    await job.updateProgress(100);

    // Publish job completed event
    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'completed',
      result: { recipeId: extractResult.recipe_id },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await publishProgress(jobId, {
      jobId,
      stage: 'failed',
      progress: 0,
      message: 'Recipe extraction failed',
      error: errorMessage,
    });

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}
