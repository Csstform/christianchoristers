FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV UPLOADS_DIR=/data/uploads
RUN mkdir -p /data/uploads \
  && npm run build \
  && chown -R node:node /app /data

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
