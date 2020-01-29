FROM alpine:3.8

RUN apk update

RUN apk add nodejs

RUN apk add yarn

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn

# Bundle app source
COPY . .

EXPOSE 3030
CMD ["npm", "run", "docker" ]
