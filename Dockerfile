###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM node:lts-alpine AS development
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl libc6-compat
RUN npm i --legacy-peer-deps
COPY --chown=node:node . .
USER node

###################
# BUILD FOR PRODUCTION
###################
FROM node:lts-alpine AS build
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl libc6-compat
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .
ENV NODE_ENV=production
# Generate Prisma client with correct binary targets
RUN npx prisma generate
RUN npm run build
# Install production dependencies only
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force
USER node

###################
# PRODUCTION
###################
FROM node:lts-alpine AS production
# Install runtime dependencies
RUN apk add --no-cache openssl libc6-compat
WORKDIR /usr/src/app
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/.env.staging .env
# Copy Prisma schema and generated client
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma
# Create store directory with proper permissions for file uploads
RUN mkdir -p /usr/src/app/store && chown -R node:node /usr/src/app/store
USER node
CMD [ "node", "dist/src/main.js" ]
