# Stage 1: Dependency builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production runtime stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
