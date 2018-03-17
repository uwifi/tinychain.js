FROM node:9.8.0
WORKDIR /usr/src/tinychain
COPY package.json ./
RUN npm install
COPY tinychain.js ./

CMD ["npm", "start"]
