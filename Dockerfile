# Multi-stage build: Frontend + Backend

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY package.json package-lock.json ./
COPY index.html vite.config.ts tsconfig*.json postcss.config.js tailwind.config.ts ./
COPY src ./src
COPY public ./public

# Install dependencies
RUN npm install

# Build frontend
RUN npm run build

# Stage 2: Build backend + serve frontend
FROM node:18-alpine

WORKDIR /app

# Copy backend files and package
COPY server/package*.json ./
COPY server/index.js ./
COPY server/promote-admin.js ./

# Install production dependencies only
RUN npm install --production

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "index.js"]
