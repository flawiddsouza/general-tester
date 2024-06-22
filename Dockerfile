# bun install

FROM node:22-bookworm-slim AS bun-install

WORKDIR /app/api

COPY api /app/api
COPY ui /app/ui

RUN apt-get update && apt-get install -y \
    curl \
    unzip

RUN curl -sLO https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip && \
    unzip bun-linux-x64.zip -d /root && \
    chmod +x /root/bun-linux-x64/bun && \
    rm bun-linux-x64.zip

ENV PATH=/root/bun-linux-x64:${PATH}

WORKDIR /app/api
RUN rm -rf node_modules && bun install

WORKDIR /app/ui
RUN rm -rf node_modules && bun install
RUN bun run build

# runtime

FROM oven/bun:latest AS runtime

WORKDIR /app/api
COPY --from=bun-install /app/ui /app/ui
COPY --from=bun-install /app/api .

EXPOSE 9002
ENTRYPOINT ["bun", "start"]
