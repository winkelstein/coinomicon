FROM node:18-alpine

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN yarn install --non-interactive --frozen-lockfile
RUN yarn compile