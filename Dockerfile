FROM node:18.16.0-alpine3.18

WORKDIR /app

COPY openmetadata-ui/src/main/resources/ui/package.json openmetadata-ui/src/main/resources/ui/yarn.lock ./

RUN yarn install --ignore-optional

COPY openmetadata-ui/src/main/resources/ui .

ENV DEV_SERVER_TARGET=http://host.docker.internal:8585/

EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/

CMD ["yarn", "start"]