# Multi-stage production build
FROM node:18-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma Client (build phase)
RUN npx prisma generate

RUN npm run build

# Runner stage
FROM node:18-slim AS runner

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

# Copy built code, prisma schemas, and full node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

# Execute migrations and run backend server
CMD npx prisma db push && node dist/index.js
