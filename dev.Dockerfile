# Use an official Node runtime as a parent image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

COPY ./types ./types

WORKDIR /usr/src/app/types
RUN ["npm", "ci"]

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true

WORKDIR /usr/src/app

# Install concurrently globally
RUN npm install -g concurrently

# Install frontend dependencies
COPY ./frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Install backend dependencies
COPY ./backend/packages/Upgrade/package*.json ./backend/packages/Upgrade/
RUN cd backend/packages/Upgrade && npm ci

# Copy frontend and backend source
COPY ./frontend ./frontend
COPY ./backend/packages/Upgrade ./backend/packages/Upgrade

# Expose any ports the frontend and backend use
EXPOSE 4200 3030

# Run frontend and backend with concurrently
CMD ["concurrently", "\"npm --prefix ./frontend run docker:local\"", "\"npm --prefix ./backend/packages/Upgrade run dev\""]