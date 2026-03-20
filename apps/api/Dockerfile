FROM oven/bun:1.2.1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "./index.ts"]
