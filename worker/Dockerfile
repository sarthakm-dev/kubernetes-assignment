FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./


COPY worker/package.json ./worker/

RUN pnpm install --frozen-lockfile


COPY worker ./worker

WORKDIR /app/worker

EXPOSE 3000

CMD ["pnpm", "start"]
