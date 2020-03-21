FROM node:10

WORKDIR /usr/src/app
COPY ./package.json ./
COPY yarn.lock ./
RUN yarn install --modules-folder ../node_modules/ --network-timeout 200000
RUN yarn global add nodemon --network-timeout 200000
COPY ./src ./src
#COPY *.pem .
CMD [ "npm", "run", "start:docker" ]