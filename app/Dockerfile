# ==========================================
# Stage 1: Build Assets & Frontend Bundles
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /home/node/app

RUN apk add --no-cache python3 make g++ bash

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/ .yarn/

RUN corepack enable && yarn install

COPY . .

RUN yarn build

# ==========================================
# Stage 2: Production Runtime
# ==========================================
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
