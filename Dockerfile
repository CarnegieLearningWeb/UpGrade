FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn

# Bundle app source
COPY . .

EXPOSE 3030
CMD ["npm", "run", "docker" ]
