# ----------- Build Stage -------------
  FROM node:20-alpine AS builder

  # Set working directory
  WORKDIR /app
  
  # Copy package files
  COPY package*.json ./
  COPY tsconfig*.json ./
  COPY vite.config.ts ./
  COPY tailwind.config.ts ./
  COPY postcss.config.js ./
  COPY components.json ./
  
  # Install full dependencies (including devDependencies)
  RUN npm ci
  
  # Copy source code
  COPY client/ ./client/
  COPY server/ ./server/
  COPY shared/ ./shared/
  
  # Build frontend and backend
  RUN npm run build
  
  # ----------- Production Stage -------------
  FROM node:20-alpine AS production
  
  # Install system packages
  RUN apk add --no-cache curl postgresql-client
  
  # Create app user
  RUN addgroup -g 1001 -S nodejs && adduser -S easymove -u 1001
  
  # Set working directory
  WORKDIR /app
  
  # Copy package files and install only production dependencies
  COPY package*.json ./
  RUN npm ci --only=production && npm cache clean --force
  
  # Copy built backend and frontend
  COPY --from=builder --chown=easymove:nodejs /app/dist ./dist
  COPY --from=builder --chown=easymove:nodejs /app/dist/public ./client/dist
  
  # Copy shared config files and assets
  COPY --from=builder --chown=easymove:nodejs /app/drizzle.config.ts ./
  COPY --from=builder --chown=easymove:nodejs /app/shared ./shared
  
  # Create logs directory
  RUN mkdir -p /app/logs && chown easymove:nodejs /app/logs
  
  # Use non-root user
  USER easymove
  
  # Expose backend port
  EXPOSE 5000
  
  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1
  
  # Start the backend
  CMD ["node", "dist/index.js"]
  