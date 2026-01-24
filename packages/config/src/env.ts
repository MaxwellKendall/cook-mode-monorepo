import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Searches upward from the starting directory to find a .env file.
 * Stops at the filesystem root.
 */
function findEnvFile(startDir: string): string | null {
  let dir = startDir;
  const root = dirname(dir);

  // Walk up until we can't go higher (root of filesystem)
  while (true) {
    const envPath = resolve(dir, '.env');
    if (existsSync(envPath)) {
      return envPath;
    }

    const parentDir = dirname(dir);
    if (parentDir === dir) {
      // Reached filesystem root
      break;
    }
    dir = parentDir;
  }

  return null;
}

/**
 * Get the monorepo root by searching upward for pnpm-workspace.yaml
 */
function findMonorepoRoot(startDir: string): string | null {
  let dir = startDir;

  while (true) {
    const workspaceFile = resolve(dir, 'pnpm-workspace.yaml');
    if (existsSync(workspaceFile)) {
      return dir;
    }

    const parentDir = dirname(dir);
    if (parentDir === dir) {
      break;
    }
    dir = parentDir;
  }

  return null;
}

// Determine starting directory
// Use the package's location rather than CWD to ensure consistent behavior
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// First try to find monorepo root, then look for .env there
const monorepoRoot = findMonorepoRoot(__dirname);
let envPath: string | null = null;

if (monorepoRoot) {
  const rootEnvPath = resolve(monorepoRoot, '.env');
  if (existsSync(rootEnvPath)) {
    envPath = rootEnvPath;
  }
}

// Fallback: search upward from CWD
if (!envPath) {
  envPath = findEnvFile(process.cwd());
}

// Load the .env file if found
if (envPath) {
  config({ path: envPath });
} else {
  // Only warn in development; in production, env vars should be set externally
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[@cook-mode/config] No .env file found. Environment variables must be set externally.'
    );
  }
}

/**
 * Track which env vars have been accessed for debugging
 */
const accessedVars = new Set<string>();

/**
 * Get an environment variable, throwing if required and not set.
 */
export function requireEnv(key: string): string {
  accessedVars.add(key);
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Make sure it's defined in your .env file or environment.`
    );
  }
  return value;
}

/**
 * Get an optional environment variable with a default value.
 */
export function optionalEnv(key: string, defaultValue: string): string {
  accessedVars.add(key);
  return process.env[key] || defaultValue;
}

/**
 * Get an optional environment variable that may be undefined.
 */
export function optionalEnvOrUndefined(key: string): string | undefined {
  accessedVars.add(key);
  return process.env[key];
}

/**
 * Parse an integer from an environment variable.
 */
export function requireEnvInt(key: string): number {
  const value = requireEnv(key);
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: ${value}`);
  }
  return parsed;
}

/**
 * Parse an optional integer from an environment variable.
 */
export function optionalEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: ${value}`);
  }
  return parsed;
}

/**
 * Check if running in production mode.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development mode.
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Get the path to the loaded .env file (for debugging).
 */
export function getEnvFilePath(): string | null {
  return envPath;
}
