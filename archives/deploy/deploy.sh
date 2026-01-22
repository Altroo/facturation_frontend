#!/usr/bin/env bash
# Simple deploy script for local server-based CI/CD
# Assumes: git pull on server, docker and docker-compose installed

set -euo pipefail

APP_DIR="/path/to/your/app"  # <-- EDIT THIS before use
BRANCH="main"
COMPOSE_FILE="docker-compose.yml"

echo "Deploying ${APP_DIR} (${BRANCH})"
cd "$APP_DIR"

# Ensure up-to-date code
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Build and recreate containers
docker compose -f $COMPOSE_FILE pull --ignore-pull-failures || true
docker compose -f $COMPOSE_FILE build --no-cache
docker compose -f $COMPOSE_FILE up -d --remove-orphans

# Optional: prune dangling images
docker image prune -f

echo "Deployment finished."
