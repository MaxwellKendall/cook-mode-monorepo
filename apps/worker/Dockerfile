# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# Copy package.json files for all required packages
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/redis/package.json packages/redis/
COPY packages/vector/package.json packages/vector/
COPY apps/worker/package.json apps/worker/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/config packages/config
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY packages/redis packages/redis
COPY packages/vector packages/vector
COPY apps/worker apps/worker

# Build packages and app
RUN pnpm --filter @cook-mode/config build && \
    pnpm --filter @cook-mode/shared build && \
    pnpm --filter @cook-mode/db build && \
    pnpm --filter @cook-mode/redis build && \
    pnpm --filter @cook-mode/vector build && \
    pnpm --filter @cook-mode/worker build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy package.json files
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/redis/package.json packages/redis/
COPY packages/vector/package.json packages/vector/
COPY apps/worker/package.json apps/worker/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built dist directories
COPY --from=builder /app/packages/config/dist packages/config/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/db/dist packages/db/dist
COPY --from=builder /app/packages/redis/dist packages/redis/dist
COPY --from=builder /app/packages/vector/dist packages/vector/dist
COPY --from=builder /app/apps/worker/dist apps/worker/dist

WORKDIR /app/apps/worker

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
