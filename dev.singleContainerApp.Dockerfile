# Use an official Node runtime as a parent image
FROM node:22.14-alpine

# Install xdg-utils
RUN apk update && apk add --no-cache xdg-utils

# Create app directory
WORKDIR /usr/src/app

# Copy frontend and backend and upgrade types source
COPY ./frontend ./frontend
COPY ./backend/packages/Upgrade ./backend/packages/Upgrade
COPY ./backend/tsconfig.json ./backend
COPY ./types ./types

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true

# Install concurrently globally
RUN npm install -g concurrently

# Install frontend dependencies
RUN cd frontend && npm ci
# Install backend dependencies
RUN cd backend/packages/Upgrade && npm ci

# Expose any ports the frontend and backend use
EXPOSE 4200 3030

# Run frontend and backend with concurrently
CMD ["concurrently", "\"npm --prefix ./frontend run docker:local\"", "\"npm --prefix ./backend/packages/Upgrade run dev\""]
