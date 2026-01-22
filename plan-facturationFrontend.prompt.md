## Plan: Prepare Next.js app for production with Docker

TL;DR — Harden and optimize the Next.js app, add a production Docker image and a reverse-proxy setup, secure secrets and TLS, and add CI/CD to build and publish images. This ensures reproducible deployments, proper caching, secure secrets, and easy rollbacks.

### Steps
1. Audit and set environment variables: document required `process.env.*` keys (see `env.d.ts`) and create secure storage for them (Docker secrets, environment file on server, or a secrets manager).
2. Harden Next config: update `next.config.ts` (`nextConfig`) to set `reactStrictMode`, `poweredByHeader: false`, `compress: true`, and enable production `images` and caching headers for `/assets` and `/_next/static`.
3. Create a production Docker image: add `Dockerfile` (multi-stage) to install deps, run `next build`, and run `next start` in `NODE_ENV=production`. Use an official Node LTS base or Bun image if you prefer Bun; document the chosen runtime.
4. Add a reverse proxy and TLS: create `docker-compose.yml` (or separate `nginx`/`traefik` service) to terminate TLS with Let's Encrypt (Certbot/Traefik ACME), forward to the Next app, and set HTTP->HTTPS redirects and HSTS.
5. Configure runtime secrets & env injection: store `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, backend API URLs (`NEXT_PUBLIC_BACKEND_API`, `NEXT_PUBLIC_ROOT_API_URL`, etc.) in environment-secure mechanism (Docker secrets, environment variables via systemd, or cloud secrets manager). Ensure no secret is exposed in `NEXT_PUBLIC_*`.
6. Add CI/CD pipeline: add a GitHub Actions workflow (or other CI) that lints, runs tests, builds the production Docker image, scans it, tags it, and pushes to a registry (GitHub Container Registry, Docker Hub). Optionally trigger a deploy on the server (SSH + docker-compose pull && docker-compose up -d).
7. Logging, monitoring, and health checks: add a simple health endpoint or configure container healthcheck and integrate logs (stdout to aggregator like Papertrail/Datadog) and metric monitoring (Prometheus exporters or lightweight uptime monitor).
8. Security & dependency management: run dependency audit/update routine, pin critical deps, ensure `NEXTAUTH_SECRET` and other sensitive vars are rotated, and enable image scanning in the CI pipeline.
9. Documentation & runbook: add `Dockerfile`, `docker-compose.yml`, a `README.prod.md` with build/deploy instructions and required env vars, and a rollback/restore procedure.

### Further Considerations
1. Runtime choice — Node vs Bun: Option A: use Node 20+ (broader compatibility). Option B: use Bun official image (faster installs) — choose consistently in CI and Dockerfile.  
2. Hosting scale — Single-server with Docker Compose / Nginx (simple), or Kubernetes with Ingress/Cert-manager (scalable). Pick based on expected traffic.  
3. Back-end & CORS — confirm backend service is available to the container network and that `NEXT_PUBLIC_*` URLs point to the production backend; consider using private (non-public) env vars for internal API endpoints.

Please review this draft plan and tell me which runtime you prefer (Node or Bun), whether you want an Nginx or Traefik reverse proxy, and which CI/CD provider you use (GitHub Actions, GitLab CI, etc.). I’ll then produce a detailed actionable checklist and example `Dockerfile`, `docker-compose.yml`, and CI workflow tailored to your choices.

