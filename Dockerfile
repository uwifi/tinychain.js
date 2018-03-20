FROM node:9.8.0
WORKDIR /usr/src/tinychain
COPY package*.json ./
RUN npm install --production
COPY tinychain.js ./
COPY worker.js ./

CMD ["npm", "start"]
