# bun install

FROM node:22-alpine AS bun-install

COPY api /app/api
COPY ui /app/ui

WORKDIR /app/api
RUN npm install

WORKDIR /app/ui
RUN npm install
RUN npm run build

# runtime

FROM oven/bun:latest AS runtime

WORKDIR /app/api
COPY --from=bun-install /app/ui /app/ui
COPY --from=bun-install /app/api .

EXPOSE 9002
ENTRYPOINT ["bun", "start"]
