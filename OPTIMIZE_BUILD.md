# Docker Build Optimization Guide

## Quick Fixes Applied

1. **Added .dockerignore files** - Reduces build context size
2. **Optimized npm install** - Added `--prefer-offline --no-audit` flags
3. **Better layer caching** - Package files copied separately

## To Speed Up Builds Further

### Option 1: Use BuildKit (Recommended)
```bash
DOCKER_BUILDKIT=1 docker compose build
```

### Option 2: Build with More Resources
```bash
# Increase Docker memory limit in Docker Desktop or daemon.json
# Or use buildx with more resources
docker buildx build --platform linux/amd64 --load .
```

### Option 3: Use npm ci with cache mount (Docker BuildKit)
Update Dockerfiles to use cache mounts:
```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit
```

### Option 4: Pre-build Dependencies
Create a base image with dependencies pre-installed:
```bash
docker build -t messenger-deps:latest -f Dockerfile.deps .
```

## Remove NVM (Optional)

If you want to remove NVM completely:
```bash
# Remove NVM
rm -rf ~/.nvm
# Remove from shell config
sed -i '/NVM/d' ~/.bashrc ~/.bash_profile ~/.zshrc
```

**Note**: NVM doesn't interfere with Docker builds, but removing it is fine if you only use Docker.

## Current Build Command

### Quick Build (Recommended)
```bash
# Use the optimized build script
./build.sh

# Or manually:
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose build --parallel
docker compose up -d
```

### Clean Build (First Time)
```bash
docker compose down
docker system prune -f
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
docker compose build --no-cache --parallel
docker compose up -d
```

## Remove NVM (Optional - Not Required)

NVM doesn't interfere with Docker, but if you want to remove it:
```bash
# Remove NVM directory
rm -rf ~/.nvm

# Remove from shell config files
sed -i '/NVM/d' ~/.bashrc ~/.bash_profile ~/.zshrc 2>/dev/null

# Reload shell
source ~/.bashrc
```

**Note**: Docker uses its own Node.js inside containers, so NVM won't affect builds.

