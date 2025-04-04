FROM node:23 as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY src ./src
COPY drizzle ./drizzle
COPY  tsconfig.json drizzle.config.ts nest-cli.json ./

# Build application
RUN pnpm build

FROM node:23 as runner
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