import { QdrantClient } from '@qdrant/js-client-rest';
import { qdrantConfig } from '@cook-mode/config';

let client: QdrantClient | null = null;

const COLLECTION_NAME = 'recipes';
const VECTOR_SIZE = 1536;

export interface VectorRecipe {
  id: string;
  title: string;
  summary?: string;
  ingredients?: string[];
  [key: string]: unknown;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: VectorRecipe;
}

export interface SimilaritySearchResult {
  results: VectorSearchResult[];
  total: number;
  searchTimeMs: number;
}

export function getQdrantClient(): QdrantClient {
  if (!client) {
    const config: { url: string; apiKey?: string } = { url: qdrantConfig.url };
    if (qdrantConfig.apiKey) {
      config.apiKey = qdrantConfig.apiKey;
    }

    client = new QdrantClient(config);
  }
  return client;
}

export async function ensureCollection(): Promise<void> {
  const qdrant = getQdrantClient();

  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((col) => col.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
  }
}

export async function searchByVector(
  vector: number[],
  limit: number = 10
): Promise<SimilaritySearchResult> {
  const qdrant = getQdrantClient();
  const startTime = Date.now();

  const response = await qdrant.search(COLLECTION_NAME, {
    vector,
    limit,
    with_payload: true,
  });

  const results: VectorSearchResult[] = response.map((point) => ({
    id: point.id as string,
    score: point.score || 0,
    payload: { id: point.id, ...point.payload } as unknown as VectorRecipe,
  }));

  return {
    results,
    total: results.length,
    searchTimeMs: Date.now() - startTime,
  };
}

export async function searchByText(
  text: string,
  textToVector: (text: string) => Promise<number[]>,
  limit: number = 10
): Promise<SimilaritySearchResult> {
  const vector = await textToVector(text);
  return searchByVector(vector, limit);
}

export async function getVector(id: string): Promise<VectorRecipe | null> {
  const qdrant = getQdrantClient();

  const response = await qdrant.retrieve(COLLECTION_NAME, {
    ids: [id],
    with_payload: true,
  });

  if (response.length === 0 || !response[0]?.payload) {
    return null;
  }

  return response[0].payload as unknown as VectorRecipe;
}
