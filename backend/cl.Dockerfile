ARG IMAGE_REPO

FROM ${IMAGE_REPO}node:22.14-alpine AS build
WORKDIR /usr/src/app
COPY . .
RUN ls
RUN npm ci --no-audit
WORKDIR /usr/src/app/types
RUN npm ci --no-audit
RUN cp -R . ../backend/packages/Upgrade/types
# ARG CODEARTIFACT_AUTH_TOKEN
# ARG CODEARTIFACT_REGISTRY="//cli-467155500999.d.codeartifact.us-east-1.amazonaws.com/npm/cli-npm-artifacts/"
# RUN npm config set '${CODEARTIFACT_REGISTRY}:_authToken=${CODEARTIFACT_AUTH_TOKEN}'
WORKDIR /usr/src/app/backend/packages/Upgrade 
RUN npm ci --no-audit

WORKDIR /usr/src/app/backend/
RUN npm ci --no-audit
RUN ["npm", "run", "build:upgrade"]

FROM ${IMAGE_REPO}node:22.14-alpine

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NR_NATIVE_METRICS_NO_BUILD=true
ENV NODE_OPTIONS=--max_old_space_size=4096

WORKDIR /usr/src/app
COPY --from=build /usr/src/app/backend ./
EXPOSE 3030
CMD ["npm", "run", "--silent", "production:upgrade"]