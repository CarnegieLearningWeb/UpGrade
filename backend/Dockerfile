FROM node:12.7.0-alpine
RUN apk add g++ make python

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .
RUN cd packages/Upgrade && npm ci

RUN ["npm", "run", "build:upgrade"]

EXPOSE 3030
CMD ["npm", "run", "--silent", "production:upgrade"]
