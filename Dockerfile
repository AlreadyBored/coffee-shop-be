FROM node:22-alpine

EXPOSE 3000

ENV NODE_ENV development
ENV PORT 3000

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app

RUN npm install

COPY dist /app/dist

CMD [ "node", "/app/dist/main" ]
