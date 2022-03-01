FROM node:16.3.0-alpine

WORKDIR /usr/src/app

COPY ./../types ./types

WORKDIR /usr/src/app/types
RUN ["npm", "ci"]

WORKDIR /usr/src/app/frontend

EXPOSE 4200

CMD ["npm", "run", "docker:local"]