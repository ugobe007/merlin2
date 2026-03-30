# syntax=docker/dockerfile:1
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

# Cache bust for source files
ARG CACHEBUST=1

# Copy source code
COPY . .

# Clear any existing build artifacts
RUN rm -rf dist node_modules/.vite

# Build the app — all VITE_ keys are injected from Fly.io secrets at build time
# via Docker BuildKit secret mounts. They are never stored in image layers.
# Secrets are declared in fly.toml [build.secrets] and accessed here read-only.
RUN --mount=type=secret,id=VITE_SUPABASE_URL \
    --mount=type=secret,id=VITE_SUPABASE_ANON_KEY \
    --mount=type=secret,id=VITE_RESEND_API_KEY \
    --mount=type=secret,id=VITE_OPENAI_API_KEY \
    --mount=type=secret,id=VITE_ENABLE_AI_ANALYSIS \
    --mount=type=secret,id=VITE_GOOGLE_MAPS_API_KEY \
    --mount=type=secret,id=VITE_NREL_API_KEY \
    --mount=type=secret,id=VITE_VISUAL_CROSSING_API_KEY \
    VITE_SUPABASE_URL=$(cat /run/secrets/VITE_SUPABASE_URL 2>/dev/null || echo '') \
    VITE_SUPABASE_ANON_KEY=$(cat /run/secrets/VITE_SUPABASE_ANON_KEY 2>/dev/null || echo '') \
    VITE_RESEND_API_KEY=$(cat /run/secrets/VITE_RESEND_API_KEY 2>/dev/null || echo '') \
    VITE_OPENAI_API_KEY=$(cat /run/secrets/VITE_OPENAI_API_KEY 2>/dev/null || echo '') \
    VITE_ENABLE_AI_ANALYSIS=$(cat /run/secrets/VITE_ENABLE_AI_ANALYSIS 2>/dev/null || echo 'false') \
    VITE_GOOGLE_MAPS_API_KEY=$(cat /run/secrets/VITE_GOOGLE_MAPS_API_KEY 2>/dev/null || echo '') \
    VITE_NREL_API_KEY=$(cat /run/secrets/VITE_NREL_API_KEY 2>/dev/null || echo '') \
    VITE_VISUAL_CROSSING_API_KEY=$(cat /run/secrets/VITE_VISUAL_CROSSING_API_KEY 2>/dev/null || echo '') \
    npm run build:prod

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

# Copy server code
COPY server/ /app/server/

# Install server dependencies separately (express, nodemailer, dotenv are NOT in
# the root package.json — they live only in server/package.json)
RUN cd /app/server && npm ci --omit=dev --no-audit --prefer-offline

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
