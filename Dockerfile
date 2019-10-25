FROM node:10

WORKDIR /usr/src/app
COPY ./package*.json ./
COPY *.pem ./
RUN npm install
RUN npm install nodemon -g
COPY ./src ./src
CMD [ "npm", "run", "start:docker" ]
