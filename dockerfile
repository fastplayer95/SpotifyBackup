FROM node:16-alpine
WORKDIR /app
ADD . /app
RUN yarn && yarn build

CMD ["node", "/app/dist/index.js"]

