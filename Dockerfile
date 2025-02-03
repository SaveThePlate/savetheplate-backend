###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:lts-alpine As development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN apk add --no-cache openssl1.1-compat

RUN npm i

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:lts-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN apk add --no-cache openssl1.1-compat

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

ENV NODE_ENV=production

RUN npx prisma generate

RUN npm run build

RUN npm i 

USER node

###################
# PRODUCTION
###################

FROM node:lts-alpine As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/.env.staging .env

CMD [ "node", "dist/src/main.js" ]
