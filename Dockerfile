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

# Cache bust for source files — ENV instruction consumes ARG so Docker actually busts cache
ARG CACHEBUST=1
ENV BUILD_CACHEBUST=${CACHEBUST}

# Copy source code
COPY . .

# Clear any existing build artifacts
RUN rm -rf dist node_modules/.vite

# Build the app — VITE_ keys are injected from build secrets at build time.
# Secrets are passed via `fly deploy --build-secret KEY=VALUE` (see scripts/deploy.sh).
# They are written to .env.production (which Vite reads natively) then built.
# The .env.production file is NOT copied to the final image (multi-stage build).
RUN --mount=type=secret,id=VITE_SUPABASE_URL \
    --mount=type=secret,id=VITE_SUPABASE_ANON_KEY \
    --mount=type=secret,id=VITE_RESEND_API_KEY \
    --mount=type=secret,id=VITE_OPENAI_API_KEY \
    --mount=type=secret,id=VITE_ENABLE_AI_ANALYSIS \
    --mount=type=secret,id=VITE_GOOGLE_MAPS_API_KEY \
    --mount=type=secret,id=VITE_NREL_API_KEY \
    --mount=type=secret,id=VITE_VISUAL_CROSSING_API_KEY \
    sh -c '\
      echo "Cache bust: ${CACHEBUST}"; \
      rm -f .env.production; \
      for KEY in VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY VITE_RESEND_API_KEY \
                 VITE_OPENAI_API_KEY VITE_ENABLE_AI_ANALYSIS VITE_GOOGLE_MAPS_API_KEY \
                 VITE_NREL_API_KEY VITE_VISUAL_CROSSING_API_KEY; do \
        VAL=$(cat "/run/secrets/$KEY" 2>/dev/null); \
        [ -n "$VAL" ] && printf "%s=%s\n" "$KEY" "$VAL" >> .env.production; \
      done; \
      echo "--- .env.production written ---"; \
      cat .env.production | sed "s/=.*/=<set>/"; \
      SUPA_VAL=$(grep "^VITE_SUPABASE_URL=" .env.production | cut -d= -f2-); \
      if [ -z "$SUPA_VAL" ]; then \
        echo "❌ BUILD ABORTED: VITE_SUPABASE_URL secret is missing."; \
        echo "   Pass it with: fly deploy --build-secret VITE_SUPABASE_URL=..."; \
        exit 1; \
      fi; \
      if echo "$SUPA_VAL" | grep -q "placeholder.supabase.co"; then \
        echo "❌ BUILD ABORTED: VITE_SUPABASE_URL contains placeholder URL."; \
        exit 1; \
      fi; \
      echo "✅ VITE_SUPABASE_URL verified: ${SUPA_VAL}"; \
      npm run build:prod; \
    '

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
