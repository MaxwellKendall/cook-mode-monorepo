import type { Job } from '@cook-mode/redis';
import { createPubSub, CHANNELS } from '@cook-mode/redis';
import { openaiConfig } from '@cook-mode/config';
import type {
  JobMessage,
  IngredientParsePayload,
  IngredientParseProgressMessage,
  ParsedIngredient,
} from '@cook-mode/shared';
import OpenAI from 'openai';

const pubsub = createPubSub();

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: openaiConfig.apiKey });
  }
  return openai;
}

async function publishProgress(jobId: string, progress: IngredientParseProgressMessage): Promise<void> {
  await pubsub.publish(CHANNELS.pantry(jobId), progress as unknown as Record<string, unknown>);
}

interface GPTIngredientResponse {
  ingredients: Array<{
    name: string;
    confidence: number;
    category?: string;
    quantity?: string;
  }>;
}

export async function processIngredientParse(job: Job<JobMessage>): Promise<void> {
  const { jobId, operation } = job.data;
  const payload = operation.payload as IngredientParsePayload;
  const { imageUrls } = payload;

  try {
    const imageCount = imageUrls.length;
    const imageText = imageCount === 1 ? 'image' : `${imageCount} images`;

    // Stage 1: Analyzing
    await publishProgress(jobId, {
      jobId,
      stage: 'analyzing',
      progress: 10,
      message: `Analyzing ${imageText}...`,
    });

    await job.updateProgress(10);

    // Stage 2: Extracting with GPT-4o Vision
    await publishProgress(jobId, {
      jobId,
      stage: 'extracting',
      progress: 30,
      message: 'Identifying ingredients...',
    });

    await job.updateProgress(30);

    const client = getOpenAI();

    // Build content array with all images
    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail: 'high' } }
    > = [
      {
        type: 'text',
        text: imageCount === 1
          ? 'Please identify all food ingredients visible in this image.'
          : `Please identify all food ingredients visible across these ${imageCount} images. Combine results and avoid duplicates.`,
      },
      ...imageUrls.map((url: string) => ({
        type: 'image_url' as const,
        image_url: {
          url,
          detail: 'high' as const,
        },
      })),
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at identifying food ingredients from images.
Analyze ${imageCount === 1 ? 'the image' : 'all provided images'} and identify all visible food ingredients.
For each ingredient, provide:
- name: the ingredient name (singular, lowercase)
- confidence: how confident you are (0.0 to 1.0)
- category: one of "produce", "protein", "dairy", "pantry", "spices", "other"
- quantity: estimated quantity if visible (e.g., "2", "1 bunch", "500g")

Return a JSON object with an "ingredients" array. Be thorough but avoid duplicates${imageCount > 1 ? ' across all images' : ''}.`,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000, // Increased for multiple images
    });

    await job.updateProgress(70);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o Vision');
    }

    const parsed: GPTIngredientResponse = JSON.parse(content);
    const ingredients: ParsedIngredient[] = parsed.ingredients.map((item) => ({
      name: item.name,
      confidence: item.confidence,
      category: item.category,
      quantity: item.quantity,
    }));

    // Stage 3: Completed
    await publishProgress(jobId, {
      jobId,
      stage: 'completed',
      progress: 100,
      message: `Found ${ingredients.length} ingredients`,
      ingredients,
    });

    await job.updateProgress(100);

    // Publish job completed event
    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'completed',
      result: { ingredients },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await publishProgress(jobId, {
      jobId,
      stage: 'failed',
      progress: 0,
      message: 'Failed to parse ingredients',
      error: errorMessage,
    });

    await pubsub.publish(CHANNELS.job(jobId), {
      eventType: 'failed',
      error: errorMessage,
    });

    throw error;
  }
}
