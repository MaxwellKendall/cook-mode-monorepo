# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# Copy package.json files for all required packages
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/redis/package.json packages/redis/
COPY apps/realtime/package.json apps/realtime/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/config packages/config
COPY packages/shared packages/shared
COPY packages/redis packages/redis
COPY apps/realtime apps/realtime

# Build packages and app
RUN pnpm --filter @cook-mode/config build && \
    pnpm --filter @cook-mode/shared build && \
    pnpm --filter @cook-mode/redis build && \
    pnpm --filter @cook-mode/realtime build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy package.json files
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY packages/redis/package.json packages/redis/
COPY apps/realtime/package.json apps/realtime/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built dist directories
COPY --from=builder /app/packages/config/dist packages/config/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/redis/dist packages/redis/dist
COPY --from=builder /app/apps/realtime/dist apps/realtime/dist

WORKDIR /app/apps/realtime

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
