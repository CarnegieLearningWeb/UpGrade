# Use an official Node runtime as a parent image
FROM node:26.10-alpine

# Install xdg-utils
RUN apk update && apk add --no-cache xdg-utils

# Create app directory
WORKDIR /usr/src/app

# Copy frontend and backend and upgrade types source
COPY ./packages/frontend ./packages/frontend
COPY ./packages/backend ./packages/backend
COPY ./packages/backend/tsconfig.json ./backend
COPY ./packages/types ./packages/types
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true

# Install Yarn Classic and concurrently (used directly by CMD)
RUN npm install --global yarn@1.22.22 concurrently@8.2.1 && yarn install --frozen-lockfile

# Expose any ports the frontend and backend use
EXPOSE 4200 3030

# Run frontend and backend with concurrently
CMD ["concurrently", "\"yarn workspace upgrade-frontend docker:local\"", "\"yarn workspace upgrade-backend dev\""]
