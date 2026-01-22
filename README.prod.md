# Production deployment (Node + Nginx + Docker)

This document explains how to run the Next.js app in production using Docker and Nginx as a reverse proxy on a single server.

Prerequisites
- Docker and Docker Compose v2 installed on the server
- Git installed
- A domain name pointed to the server's public IP
- TLS certificates (place in `deploy/nginx/certs/` as `fullchain.pem` and `privkey.pem`) or obtain them via Certbot

Quick start
1. Copy `.env.example` to `.env` and update values.
2. Update `deploy/deploy.sh` APP_DIR to the checkout path on the server.
3. On the server:

```bash
# Clone repository
git clone <repo> /var/www/facturation_frontend
cd /var/www/facturation_frontend
cp .env.example .env
# Edit .env
# Place TLS certs in deploy/nginx/certs/ or configure Certbot
# Build and run
docker compose up -d --build
```

Notes
- The `docker-compose.yml` exposes ports 80/443. Nginx proxies traffic to the `web` service.
- For automatic certificate issuance, integrate Certbot on the host and mount certs into the container, or use an alternate `nginx` container with Certbot.
- `deploy/deploy.sh` is a simple server-side script you can trigger via a webhook or run manually.

Local CI / Server deploy
- Because you requested local (server-side) CI, we recommend configuring a small runner on the server that listens for webhooks from your Git provider. Options:
  - Use a lightweight service like `gitlab-runner` or `drone` if you prefer more advanced pipelines.
  - Use a webhook receiver that simply runs `deploy.sh` on push to `main`.

Security
- Keep `NEXTAUTH_SECRET` and other secrets out of commits. Use `.env` on the server, Docker secrets, or a secrets manager.
- Rotate secrets periodically.
