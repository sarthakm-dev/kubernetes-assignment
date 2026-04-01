FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./
COPY api-gateway/package.json api-gateway/package.json

RUN pnpm install --frozen-lockfile

COPY api-gateway api-gateway

WORKDIR /app/api-gateway

EXPOSE 3000
CMD ["pnpm", "start"]
