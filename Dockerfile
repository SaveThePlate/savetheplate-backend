###################
# BUILD FOR LOCAL DEVELOPMENT
###################
FROM node:lts-alpine AS development
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
# Install OpenSSL and other dependencies
RUN apk add --no-cache openssl libc6-compat
RUN npm install --legacy-peer-deps
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
# Install all dependencies (including devDependencies) needed for build
# Note: NODE_ENV is not set yet, so devDependencies will be installed
RUN npm install --legacy-peer-deps && npm cache clean --force
# Generate Prisma client using the installed prisma version to avoid version conflicts
RUN npx prisma generate
# Build the application
RUN npm run build
    # Set NODE_ENV=production and remove devDependencies after build to reduce image size
    ENV NODE_ENV=production
    RUN npm prune --production --legacy-peer-deps && npm cache clean --force
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
# Note: .env file should be provided at runtime via volume mount or environment variables
# Copy Prisma schema and generated client
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma
# Create store directory with proper permissions for file uploads
RUN mkdir -p /usr/src/app/store && chown -R node:node /usr/src/app/store
USER node
EXPOSE 3001
ENV PORT=3001
CMD [ "node", "dist/main.js" ]