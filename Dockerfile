FROM node:23

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

# Expose the port the app runs on
EXPOSE 8000

# Start the application
CMD ["pnpm", "start:prod"] 