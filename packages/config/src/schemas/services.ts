import { optionalEnv, optionalEnvInt, isDevelopment } from '../env.js';

/**
 * API service configuration.
 */
export const apiConfig = {
  get port(): number {
    return optionalEnvInt('API_PORT', 3000);
  },
  get host(): string {
    return optionalEnv('HOST', '0.0.0.0');
  },
  get corsOrigin(): string | boolean {
    const origin = optionalEnv('CORS_ORIGIN', '');
    return origin || true;
  },
  get isDev(): boolean {
    return isDevelopment();
  },
} as const;

/**
 * Realtime (WebSocket) service configuration.
 */
export const realtimeConfig = {
  get port(): number {
    return optionalEnvInt('REALTIME_PORT', 3001);
  },
  get host(): string {
    return optionalEnv('HOST', '0.0.0.0');
  },
  get corsOrigin(): string | boolean {
    const origin = optionalEnv('CORS_ORIGIN', '');
    return origin || true;
  },
  get isDev(): boolean {
    return isDevelopment();
  },
} as const;

/**
 * Voice Bridge service configuration.
 */
export const voiceBridgeConfig = {
  get port(): number {
    return optionalEnvInt('VOICE_BRIDGE_PORT', 3002);
  },
  get host(): string {
    return optionalEnv('HOST', '0.0.0.0');
  },
  get corsOrigin(): string | boolean {
    const origin = optionalEnv('CORS_ORIGIN', '');
    return origin || true;
  },
  get isDev(): boolean {
    return isDevelopment();
  },
} as const;

/**
 * Worker service configuration.
 */
export const workerConfig = {
  get concurrency(): number {
    return optionalEnvInt('WORKER_CONCURRENCY', 5);
  },
} as const;

/**
 * MCP (Recipe extraction) service configuration.
 */
export const mcpConfig = {
  get serviceUrl(): string {
    return optionalEnv('MCP_SERVICE_URL', 'http://localhost:8000');
  },
} as const;
