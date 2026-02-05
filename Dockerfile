# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Add build timestamp for cache busting
ARG BUILD_DATE
ARG BUILD_VERSION=1.0.0
ENV BUILD_DATE=${BUILD_DATE}
ENV BUILD_VERSION=${BUILD_VERSION}

# Copy package files
COPY package*.json ./

# Install dependencies (no cache to ensure fresh install)
RUN npm ci --no-audit --prefer-offline

# Copy source code
COPY . .

# Clear any existing build artifacts
RUN rm -rf dist node_modules/.vite

# Build the app (skip TypeScript checking for faster deploy)
RUN npm run build:prod

# Production stage - Multi-service (nginx + Node.js API)
FROM node:20-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

# Create app directory
WORKDIR /app

# Copy built frontend from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy server code and dependencies
COPY server/ /app/server/
COPY --from=builder /app/node_modules /app/node_modules

# Create supervisor config
RUN mkdir -p /etc/supervisor.d
COPY <<EOF /etc/supervisor.d/services.ini
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:api]
command=node /app/server/index.js
directory=/app/server
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=PORT=3001,NODE_ENV=production
EOF

# Create log directory
RUN mkdir -p /var/log/supervisor

# Expose ports
EXPOSE 80 3001

# Start supervisor to run both nginx and Node.js
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/services.ini"]
