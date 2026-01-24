# Cook Mode Monorepo

Voice-powered cooking assistant with real-time recipe guidance.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [pnpm Basics](#pnpm-basics)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Services](#running-services)
- [Dependency Management](#dependency-management)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **pnpm 9+** - Install globally: `npm install -g pnpm`
- **Redis** - Local instance for job queues and pub/sub
- **Python 3.11+** - For the MCP recipe extraction service

---

## Project Structure

```
cook-mode-monorepo/
├── apps/                    # Deployable applications
│   ├── api/                 # REST API (Fastify) - port 3000
│   ├── realtime/            # WebSocket gateway - port 3001
│   ├── voice-bridge/        # OpenAI Realtime proxy - port 3002
│   ├── worker/              # BullMQ job processor (no port)
│   └── web/                 # React frontend - port 3003
├── packages/                # Shared internal packages
│   ├── shared/              # Types, schemas, utilities
│   ├── db/                  # Drizzle ORM, repositories
│   ├── redis/               # BullMQ queues, pub/sub
│   └── vector/              # Qdrant client, embeddings
├── services/                # External services
│   └── mcp/                 # Python recipe extraction - port 8000
├── .env                     # Environment variables (create from .env.example)
├── package.json             # Root package.json with workspace scripts
├── pnpm-workspace.yaml      # Defines workspace packages
└── tsconfig.base.json       # Shared TypeScript config
```

---

## pnpm Basics

pnpm is a fast, disk space efficient package manager. Key differences from npm:

### Installing pnpm

```bash
npm install -g pnpm
```

### Key Commands

| npm command | pnpm equivalent | Description |
|-------------|-----------------|-------------|
| `npm install` | `pnpm install` | Install all dependencies |
| `npm install pkg` | `pnpm add pkg` | Add a package |
| `npm install -D pkg` | `pnpm add -D pkg` | Add a dev dependency |
| `npm run script` | `pnpm script` | Run a script (no `run` needed) |

### Workspace Filtering

pnpm uses `--filter` to target specific packages in the monorepo:

```bash
# Run a script in a specific package
pnpm --filter @cook-mode/api dev

# Add a dependency to a specific package
pnpm --filter @cook-mode/api add fastify

# Run in multiple packages
pnpm --filter @cook-mode/api --filter @cook-mode/worker dev

# Run in all packages matching a pattern
pnpm --filter './apps/*' build
pnpm --filter './packages/*' build
```

### Workspace Dependencies

Packages reference each other using `workspace:*`:

```json
{
  "dependencies": {
    "@cook-mode/shared": "workspace:*",
    "@cook-mode/db": "workspace:*"
  }
}
```

This tells pnpm to use the local workspace version, not a published package.

---

## Installation

### 1. Clone and Install

```bash
cd cook-mode-monorepo

# Install all dependencies for all packages
pnpm install
```

This single command installs dependencies for:
- The root `package.json`
- All packages in `packages/`
- All apps in `apps/`

### 2. Build Packages

Packages must be built before apps can use them:

```bash
pnpm build:packages
```

This compiles TypeScript in all `packages/*` to their `dist/` folders.

### 3. Start Redis

```bash
# Option 1: Direct
redis-server

# Option 2: Docker
docker run -d -p 6379:6379 redis:alpine

# Option 3: Homebrew (macOS)
brew services start redis
```

---

## Environment Variables

Create a `.env` file in the root directory. All services read from this file.

### Required Variables

```bash
# ═══════════════════════════════════════════════════════════════
# DATABASE (PostgreSQL/Supabase)
# ═══════════════════════════════════════════════════════════════
DATABASE_URL=postgresql://user:password@host:port/database

# ═══════════════════════════════════════════════════════════════
# REDIS (Local or Cloud)
# ═══════════════════════════════════════════════════════════════
REDIS_URL=redis://localhost:6379/

# ═══════════════════════════════════════════════════════════════
# OPENAI (Required for voice and embeddings)
# ═══════════════════════════════════════════════════════════════
OPENAI_API_KEY=sk-proj-xxxx
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# ═══════════════════════════════════════════════════════════════
# QDRANT (Vector Database)
# ═══════════════════════════════════════════════════════════════
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your-api-key
```

### Optional Variables

```bash
# ═══════════════════════════════════════════════════════════════
# SERVICE PORTS (defaults shown)
# ═══════════════════════════════════════════════════════════════
API_PORT=3000
REALTIME_PORT=3001
VOICE_BRIDGE_PORT=3002

# ═══════════════════════════════════════════════════════════════
# WORKER
# ═══════════════════════════════════════════════════════════════
WORKER_CONCURRENCY=5

# ═══════════════════════════════════════════════════════════════
# MCP SERVICE (Python recipe extraction)
# ═══════════════════════════════════════════════════════════════
MCP_SERVICE_URL=http://localhost:8000

# ═══════════════════════════════════════════════════════════════
# STRIPE (Payments - optional for local dev)
# ═══════════════════════════════════════════════════════════════
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
STRIPE_PRICE_BASIC=price_xxxx
STRIPE_PRICE_PRO=price_xxxx

# ═══════════════════════════════════════════════════════════════
# FRONTEND (Vite env vars must start with VITE_)
# ═══════════════════════════════════════════════════════════════
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001/ws
VITE_VOICE_BRIDGE_URL=http://localhost:3002
```

### Which Services Need Which Variables

| Variable | api | realtime | worker | voice-bridge | web |
|----------|-----|----------|--------|--------------|-----|
| DATABASE_URL | ✅ | | ✅ | | |
| REDIS_URL | ✅ | ✅ | ✅ | | |
| OPENAI_API_KEY | ✅ | | ✅ | ✅ | |
| QDRANT_URL | ✅ | | ✅ | | |
| STRIPE_* | ✅ | | | | |
| VITE_* | | | | | ✅ |

---

## Running Services

### Starting a Single Service

**Important**: Always build packages first!

```bash
# Step 1: Build packages (only needed once, or after package changes)
pnpm build:packages

# Step 2: Start the service
pnpm --filter @cook-mode/api dev
```

### Service-Specific Commands

```bash
# API Server (REST endpoints)
pnpm --filter @cook-mode/api dev
# Runs on http://localhost:3000

# Realtime Gateway (WebSocket)
pnpm --filter @cook-mode/realtime dev
# Runs on ws://localhost:3001

# Worker (Background Jobs)
pnpm --filter @cook-mode/worker dev
# No port - processes BullMQ jobs

# Voice Bridge (OpenAI Realtime)
pnpm --filter @cook-mode/voice-bridge dev
# Runs on http://localhost:3002

# Web Frontend (React + Vite)
pnpm --filter @cook-mode/web dev
# Runs on http://localhost:3003
```

### Starting Multiple Services

```bash
# All apps (includes frontend)
pnpm dev:apps

# Backend only (no frontend)
pnpm dev:backend

# Custom combination
pnpm --filter @cook-mode/api --filter @cook-mode/worker dev --parallel
```

### Starting MCP Service (Python)

The MCP service runs separately:

```bash
cd ../voice-agent-service/services/mcp
pip install -r requirements.txt
python server.py
# Runs on http://localhost:8000
```

---

## Dependency Management

### Adding Dependencies

```bash
# Add to a specific package
pnpm --filter @cook-mode/api add fastify
pnpm --filter @cook-mode/api add -D @types/node

# Add to root (dev tools shared across all)
pnpm add -D -w typescript

# Add workspace package as dependency
pnpm --filter @cook-mode/api add @cook-mode/shared@workspace:*
```

### Updating Dependencies

```bash
# Update all packages
pnpm update

# Update a specific package
pnpm --filter @cook-mode/api update fastify

# Interactive update
pnpm update -i
```

### Viewing Dependencies

```bash
# List all dependencies
pnpm list

# List for a specific package
pnpm --filter @cook-mode/api list

# Why is a package installed?
pnpm why lodash
```

### Cleaning Up

```bash
# Remove all node_modules and dist folders
pnpm clean

# Fresh install
pnpm clean && pnpm install && pnpm build:packages
```

---

## Troubleshooting

### "Cannot find module '@cook-mode/shared'"

Packages need to be built before apps can import them:

```bash
pnpm build:packages
```

### "ENOENT: no such file or directory, open '.../dist/index.js'"

Same issue - build the packages:

```bash
pnpm build:packages
```

### Redis Connection Refused

Make sure Redis is running:

```bash
# Check if running
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

### TypeScript Errors in IDE

After pulling changes or modifying packages:

1. Rebuild packages: `pnpm build:packages`
2. Restart TypeScript server in your IDE (VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server")

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Fresh Start

When in doubt, clean and reinstall:

```bash
pnpm clean
pnpm install
pnpm build:packages
```

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│   API       │────▶│   Worker    │
│   (React)   │     │  (Fastify)  │     │  (BullMQ)   │
│   :3003     │     │   :3000     │     │             │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │  Realtime   │     │    MCP      │
                    │ (WebSocket) │     │  (Python)   │
                    │   :3001     │     │   :8000     │
                    └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │Voice Bridge │
                    │  (OpenAI)   │
                    │   :3002     │
                    └─────────────┘
```

**Data Flow:**
1. **Web** → **API**: REST calls for CRUD operations
2. **API** → **Worker**: Queues async jobs (recipe extraction)
3. **Worker** → **MCP**: Calls Python service for AI processing
4. **Realtime**: Pushes live updates via WebSocket
5. **Voice Bridge**: Proxies OpenAI Realtime API for voice chat
