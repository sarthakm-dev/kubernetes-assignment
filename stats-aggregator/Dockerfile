FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./


COPY stats-aggregator/package.json ./stats-aggregator/

RUN pnpm install --frozen-lockfile


COPY stats-aggregator ./stats-aggregator

WORKDIR /app/stats-aggregator

EXPOSE 3000

CMD ["pnpm", "start"]
