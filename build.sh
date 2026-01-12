#!/bin/bash
# Optimized Docker build script

echo "🚀 Starting optimized Docker build..."

# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Stop existing containers
echo "📦 Stopping existing containers..."
docker compose down

# Build with BuildKit
echo "🔨 Building containers with BuildKit..."
docker compose build --parallel

# Start containers
echo "▶️  Starting containers..."
docker compose up -d

echo "✅ Build complete! Check status with: docker compose ps"
