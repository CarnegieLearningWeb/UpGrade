ARG IMAGE_REPO

FROM ${IMAGE_REPO}node:22.14-alpine3.21 AS build
WORKDIR /usr/src/app
COPY backend ./backend
COPY types ./types
WORKDIR /usr/src/app/types
RUN npm ci --no-audit


WORKDIR /usr/src/app/backend/packages/Upgrade/
RUN npm ci --no-audit
