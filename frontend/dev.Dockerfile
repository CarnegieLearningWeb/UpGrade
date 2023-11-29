FROM node:18-alpine

WORKDIR /usr/src/app

COPY ./../types ./types

WORKDIR /usr/src/app/types
RUN ["npm", "ci"]

WORKDIR /usr/src/app/frontend

EXPOSE 4200
ENV NODE_OPTIONS=--max_old_space_size=4096
CMD ["npm", "run", "docker:local"]