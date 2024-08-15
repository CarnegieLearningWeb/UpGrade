ARG IMAGE_REPO

FROM ${IMAGE_REPO}node:18-alpine3.16 AS build
WORKDIR /usr/src/app
COPY ./backend .
RUN ls -al
RUN npm ci --ignore-scripts --no-audit --strict-peer-deps
# ARG CODEARTIFACT_AUTH_TOKEN
# ARG CODEARTIFACT_REGISTRY="//cli-467155500999.d.codeartifact.us-east-1.amazonaws.com/npm/cli-npm-artifacts/"
# RUN npm config set '${CODEARTIFACT_REGISTRY}:_authToken=${CODEARTIFACT_AUTH_TOKEN}'
RUN cd packages/Upgrade && npm ci
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN ["npm", "run", "build:upgrade"]

FROM ${IMAGE_REPO}node:18-alpine3.16

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true
ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/packages ./packages
EXPOSE 3030
CMD ["npm", "run", "--silent", "production:upgrade"]