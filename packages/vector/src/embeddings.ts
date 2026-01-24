import OpenAI from 'openai';
import { openaiConfig } from '@cook-mode/config';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: openaiConfig.apiKey });
  }
  return openai;
}

function getEmbeddingModel(): string {
  return openaiConfig.embeddingModel;
}

export async function textToVector(text: string): Promise<number[]> {
  const client = getOpenAI();

  const response = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: text,
  });

  return response?.data[0]?.embedding || [];
}

export async function textsToVectors(texts: string[]): Promise<number[][]> {
  const client = getOpenAI();

  const response = await client.embeddings.create({
    model: getEmbeddingModel(),
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

export function getEmbeddingDimensions(): number {
  const modelDimensions: Record<string, number> = {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'text-embedding-ada-002': 1536,
  };

  return modelDimensions[getEmbeddingModel()] || 1536;
}
