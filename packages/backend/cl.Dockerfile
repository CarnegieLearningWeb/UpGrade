ARG IMAGE_REPO

FROM ${IMAGE_REPO}node:22.14-alpine3.21 AS build
WORKDIR /usr/src/app
COPY ./packages/backend ./packages/backend
COPY ./packages/frontend/package.json ./packages/frontend/package.json
COPY ./packages/types ./packages/types
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
RUN yarn

# ARG CODEARTIFACT_AUTH_TOKEN
# ARG CODEARTIFACT_REGISTRY="//cli-467155500999.d.codeartifact.us-east-1.amazonaws.com/npm/cli-npm-artifacts/"
# RUN npm config set '${CODEARTIFACT_REGISTRY}:_authToken=${CODEARTIFACT_AUTH_TOKEN}'

RUN ["yarn", "workspace", "upgrade-backend", "build"]

FROM ${IMAGE_REPO}node:22.14-alpine3.21

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true
ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/packages/backend ./packages/backend
COPY --from=build /usr/src/app/packages/types ./packages/types
EXPOSE 3030
CMD ["yarn", "workspace", "upgrade-backend", "production"]