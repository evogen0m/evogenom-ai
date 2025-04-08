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

# Build application
RUN pnpm build

FROM node:23 AS runner
RUN npm install -g pnpm

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000

# Start the application
CMD ["pnpm", "start:prod"] 