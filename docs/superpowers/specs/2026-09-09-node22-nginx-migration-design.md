# TechDoc Architecture Migration: Node:22-alpine & Nginx Static Host

- **Date:** 2026-09-09
- **Status:** Approved
- **Scope:** Container architecture refactoring, removing upstream HedgeDoc image dependency, separating static asset delivery (Nginx) and dynamic app logic (Node.js 22).

---

## 1. Problem Statement & Motivation
Currently, the TechDoc application runs on top of `quay.io/hedgedoc/hedgedoc:1.12.0` in a single container:
- Upstream files and cached templates conflict with local customizations and Rspack builds.
- Express serves both dynamic APIs, WebSockets, and static assets (bundles, fonts, uploads), which is inefficient and causes caching issues when assets are updated.
- Upstream base image limits control over Node.js version, security updates, and container build lifecycle.

---

## 2. Target Architecture
The application is decoupled into 3 services:

1. **Database Service (`database`)**:
   - `postgres:18.6-alpine` storing notes, users, sessions, revisions.
2. **App Service (`app`)**:
   - Native `node:22-alpine` multi-stage build.
   - Stage 1 (`builder`): Compiles all frontend assets via Rspack with devDependencies.
   - Stage 2 (`runner`): Clean production runtime with minimal production dependencies, running `app.js` (Express + Socket.IO) under unprivileged user `node`.
3. **Web Service (`web`)**:
   - `nginx:1.27-alpine` serving as the public-facing entry point on port `3000`.
   - Directly serves static files (`/build/`, `/css/`, `/js/`, `/fonts/`, `/banner/`, `/icons/`, `/uploads/`) with optimized Gzip compression and long-term immutable caching for hashed bundles.
   - Reverse proxies `/socket.io/` with WebSocket upgrade headers (`Upgrade`, `Connection "upgrade"`).
   - Reverse proxies dynamic requests (EJS rendered pages, authentication, REST API) to `app:3000`.

---

## 3. Detailed Component Specifications

### 3.1 Multi-stage Dockerfile (`app/Dockerfile`)
```dockerfile
# Stage 1: Build assets
FROM node:22-alpine AS builder
WORKDIR /home/node/app
RUN apk add --no-cache python3 make g++
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
RUN corepack enable && yarn install --immutable
COPY . .
RUN yarn build

# Stage 2: Production runtime
FROM node:22-alpine AS runner
WORKDIR /home/node/app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/
RUN corepack enable && yarn workspaces focus --production
COPY app.js ./
COPY lib/ ./lib/
COPY locales/ ./locales/
COPY bin/ ./bin/
COPY --from=builder /home/node/app/public/ ./public/

USER node
EXPOSE 3000
CMD ["node", "app.js"]
```

### 3.2 Nginx Configuration (`nginx/default.conf`)
- `upstream node_app`: Connects to `app:3000` with HTTP/1.1 keepalive connections.
- Static block `/build/`: `Cache-Control: public, max-age=31536000, immutable`.
- General assets block (`/css/`, `/js/`, `/fonts/`, `/banner/`, `/icons/`, `/uploads/`): `Cache-Control: public, max-age=604800`.
- WebSocket block `/socket.io/`: Configured for WebSocket upgrades with long timeouts.
- Dynamic fallback `/`: Proxies to `http://node_app`.
- Max upload body size: `50M`.

### 3.3 Docker Compose (`docker-compose.yml`)
- `database`: PostgreSQL on private Docker network.
- `app`: Built from `./app`, exposes port 3000 internally.
- `web`: Nginx mapping `3000:80`, mounting `./nginx/default.conf`, `./app/public`, `./data/uploads`, and shared volume `techdoc_static`.

---

## 4. Migration & Verification Plan
1. **Create Nginx configuration** directory and `default.conf`.
2. **Rewrite `app/Dockerfile`** using `node:22-alpine` multi-stage build.
3. **Update `docker-compose.yml`** to define `app` and `web` services.
4. **Build and start services**: `podman compose up -d --build`.
5. **Verify**:
   - Public access to `http://localhost:3000` returns the application via Nginx.
   - Direct static file requests (e.g., `http://localhost:3000/build/...`) return Nginx cache headers.
   - Realtime collaborative editing over Socket.IO works properly.
   - User authentication and note publishing views function without errors.
