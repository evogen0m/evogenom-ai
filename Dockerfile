FROM node:23 AS builder
# Install pnpm
RUN npm install -g pnpm
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY src ./src
COPY drizzle ./drizzle
COPY pem ./pem
COPY drizzle.config.ts tsconfig*.json nest-cli.json ./

# Capture git commit hash
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

# Add Sentry auth token
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

# Build application
RUN pnpm build

FROM node:23 AS runner
RUN npm install -g pnpm

WORKDIR /app

ENV NODE_ENV=production
# Pass SENTRY_RELEASE to the runner stage
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=${SENTRY_RELEASE}

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000

# Start the application
CMD ["pnpm", "start:prod"] 