# Stage 1: builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: runner
FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN addgroup -S app && adduser -S app -G app
USER app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
