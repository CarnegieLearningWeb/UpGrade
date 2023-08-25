FROM node:18-alpine

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true

WORKDIR /usr/src/app

COPY ./../types ./types

WORKDIR /usr/src/app/types
RUN ["npm", "ci"]

WORKDIR /usr/src/app/backend/packages/Upgrade

EXPOSE 3030
CMD ["npm", "run", "dev"]
