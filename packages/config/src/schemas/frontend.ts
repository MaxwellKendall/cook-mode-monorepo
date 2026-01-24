import { optionalEnv } from '../env.js';

/**
 * Frontend (Vite) configuration.
 * Note: For Vite apps, these should be accessed via import.meta.env.VITE_*
 * This config is useful for SSR or build-time configuration.
 */
export const frontendConfig = {
  get apiUrl(): string {
    return optionalEnv('VITE_API_URL', 'http://localhost:3000');
  },
  get wsUrl(): string {
    return optionalEnv('VITE_WS_URL', 'ws://localhost:3001/ws');
  },
  get voiceBridgeUrl(): string {
    return optionalEnv('VITE_VOICE_BRIDGE_URL', 'http://localhost:3002');
  },
} as const;
