FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY src/ ./src/
COPY drizzle.config.ts ./

# Expose backend port
EXPOSE 3000

# Start Elysia backend
CMD ["bun", "run", "src/index.ts"]
