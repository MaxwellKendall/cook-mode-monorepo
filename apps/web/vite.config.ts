import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env from monorepo root (two levels up from apps/web)
  const monorepoRoot = resolve(__dirname, '../..');
  const env = loadEnv(mode, monorepoRoot, '');

  return {
    plugins: [react()],
    server: {
      port: 3003,
    },
    build: {
      outDir: 'dist',
    },
    // Expose VITE_ prefixed env vars to the client
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || 'ws://localhost:3001/ws'),
      'import.meta.env.VITE_VOICE_BRIDGE_URL': JSON.stringify(env.VITE_VOICE_BRIDGE_URL || 'http://localhost:3002'),
    },
  };
});
