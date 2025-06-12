# EasyMove Man and Van - Production Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install production dependencies
RUN apk add --no-cache curl postgresql-client

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S easymove -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=easymove:nodejs /app/dist ./dist
# COPY --from=builder --chown=easymove:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=easymove:nodejs /app/dist/public ./client/dist

# Copy additional configuration files
COPY --chown=easymove:nodejs drizzle.config.ts ./
COPY --chown=easymove:nodejs shared/ ./shared/

# Create necessary directories
RUN mkdir -p /app/logs && chown easymove:nodejs /app/logs

# Switch to non-root user
USER easymove

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "dist/server/index.js"]