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

# Build the app (this will create fresh dist folder)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (matches fly.toml internal_port)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
