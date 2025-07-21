FROM node:20

WORKDIR /app

COPY package*.json ./


# If lockfile exists, use it; otherwise fallback to npm install
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
