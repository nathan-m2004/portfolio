FROM node:24 AS base
WORKDIR /portfolio
COPY package*.json .

FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000 24678
CMD ["npm", "run", "dev"]

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim AS production
WORKDIR /portfolio
USER node
COPY --from=build --chown=node:node /portfolio/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]