FROM node:18-alpine

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .
RUN cd packages/Upgrade && npm ci --legacy-peer-deps
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN ["npm", "run", "build:upgrade"]

EXPOSE 3030
CMD ["npm", "run", "--silent", "production:upgrade"]
