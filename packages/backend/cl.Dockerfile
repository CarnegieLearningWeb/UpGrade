ARG IMAGE_REPO

FROM ${IMAGE_REPO}node:22.14-alpine3.21 AS build
WORKDIR /usr/src/app
COPY ./packages/backend ./packages/backend
COPY ./packages/frontend/package.json ./packages/frontend/package.json
COPY ./packages/types ./packages/types
COPY ./package.json ./package.json
COPY ./yarn.lock ./yarn.lock
COPY ./.yarnrc.yml ./.yarnrc.yml
RUN corepack enable
RUN ["yarn", "workspaces", "focus", "upgrade-backend", "upgrade_types"]

# ARG CODEARTIFACT_AUTH_TOKEN
# ARG CODEARTIFACT_REGISTRY="//cli-467155500999.d.codeartifact.us-east-1.amazonaws.com/npm/cli-npm-artifacts/"
# RUN npm config set '${CODEARTIFACT_REGISTRY}:_authToken=${CODEARTIFACT_AUTH_TOKEN}'

RUN ["yarn", "workspace", "upgrade_types", "build"]
RUN ["yarn", "workspace", "upgrade-backend", "build"]


FROM ${IMAGE_REPO}node:22.14-alpine3.21

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true
ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /usr/src/app

# Copy workspace structure for dependency resolution
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/yarn.lock ./yarn.lock
COPY --from=build /usr/src/app/.yarnrc.yml ./.yarnrc.yml
COPY --from=build /usr/src/app/packages/backend/package.json ./packages/backend/package.json
COPY --from=build /usr/src/app/packages/types/package.json ./packages/types/package.json
COPY --from=build /usr/src/app/packages/types/dist ./packages/types/dist

RUN corepack enable && \
    yarn workspaces focus upgrade-backend upgrade_types --production

# Copy compiled output and config
COPY --from=build /usr/src/app/packages/backend/dist ./packages/backend/dist
COPY --from=build /usr/src/app/packages/backend/src/config.json ./packages/backend/src/config.json
COPY --from=build /usr/src/app/packages/backend/src/public ./packages/backend/src/public
COPY --from=build /usr/src/app/packages/backend/.env ./packages/backend/.env
COPY --from=build /usr/src/app/packages/backend/src/api/controllers ./packages/backend/src/api/controllers

EXPOSE 3030
CMD ["yarn", "workspace", "upgrade-backend", "prod"]
