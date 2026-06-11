FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY db/ ./db/
COPY drizzle/ ./drizzle/
COPY drizzle.config.js ./
COPY agent.js ./
COPY server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
