export {
  getQdrantClient,
  searchByText,
  searchByVector,
  getVector,
  type VectorSearchResult,
  type SimilaritySearchResult,
} from './client.js';

export {
  textToVector,
  textsToVectors,
  getEmbeddingDimensions,
} from './embeddings.js';
