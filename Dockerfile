# ui

FROM node:22-alpine AS ui

COPY ui /app/ui
COPY api /app/api

WORKDIR /app/ui
RUN npm install
RUN npm run build

# api

FROM oven/bun:latest AS api

COPY --from=ui /app/api /app/api

WORKDIR /app/api
RUN bun install

# runtime

FROM oven/bun:latest AS runtime

WORKDIR /app
COPY --from=api /app/api .

EXPOSE 9002
ENTRYPOINT ["bun", "start"]
