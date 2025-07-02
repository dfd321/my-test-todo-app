# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Copy source code
COPY . .

# Create data directory for todos.json
RUN mkdir -p /app/data && chown -R nodeuser:nodejs /app/data

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/todos', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Copy source code
COPY --chown=nodeuser:nodejs . .

# Create data directory
RUN mkdir -p /app/data && chown -R nodeuser:nodejs /app/data

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/todos', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["npm", "start"]