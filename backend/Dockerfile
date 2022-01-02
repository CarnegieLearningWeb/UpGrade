FROM node:12.7.0-alpine

ENV NEW_RELIC_NO_CONFIG_FILE=true

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .
RUN cd packages/Upgrade && yarn

RUN ["npm", "run", "build:upgrade"]

EXPOSE 3030
CMD ["npm", "run", "--silent", "production:upgrade"]
