#!/usr/bin/env bash
# Copy certbot certs into the repo folder and reload nginx container
set -euo pipefail
DOMAIN="$1"
TARGET_DIR="/var/www/facturation_frontend/deploy/nginx/certs"

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 <domain>" >&2
  exit 2
fi

sudo mkdir -p "$TARGET_DIR"
sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$TARGET_DIR/"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$TARGET_DIR/"
sudo chown -R $(whoami):$(whoami) "$TARGET_DIR"

# reload nginx service inside docker-compose
cd /var/www/facturation_frontend
if docker compose ps nginx >/dev/null 2>&1; then
  docker compose exec -T nginx nginx -s reload || docker compose up -d --no-deps --build nginx
else
  docker compose up -d --no-deps --build nginx
fi
