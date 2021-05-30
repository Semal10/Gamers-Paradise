FROM node:alpine

RUN apk update && apk add bash && apk add curl && apk add openssh && apk add python

WORKDIR /client

COPY ./package*.json ./

RUN npm install

COPY . .

CMD ["npm", "start"]
