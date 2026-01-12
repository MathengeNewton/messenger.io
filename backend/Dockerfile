# Use Node.js 20 LTS as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files and install all dependencies (needed for build)
COPY package*.json ./
# Use BuildKit cache mount for npm cache (faster subsequent builds)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy the rest of the project files
COPY . .

# Build the NestJS app
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Expose the port your app runs on (default 4500, can be overridden via PORT env var)
EXPOSE 4500

# Health check (docker-compose.yml overrides this with the correct port)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4500/api/health || exit 1

# Command to run the app
CMD ["npm", "run", "start:prod"]