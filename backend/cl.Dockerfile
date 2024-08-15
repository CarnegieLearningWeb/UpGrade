ARG IMAGE_REPO

FROM ${IMAGE_REPO}node:18-alpine3.16 AS build
WORKDIR /usr/src/app
COPY . .
RUN npm ci --ignore-scripts --no-audit --strict-peer-deps
RUN cd ./types 
RUN npm ci --ignore-scripts --no-audit --strict-peer-deps
RUN npm run build
RUN cp -R . ../backend/packages/Upgrade/types
# ARG CODEARTIFACT_AUTH_TOKEN
# ARG CODEARTIFACT_REGISTRY="//cli-467155500999.d.codeartifact.us-east-1.amazonaws.com/npm/cli-npm-artifacts/"
# RUN npm config set '${CODEARTIFACT_REGISTRY}:_authToken=${CODEARTIFACT_AUTH_TOKEN}'
RUN cd ../backend/packages/Upgrade && npm ci
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