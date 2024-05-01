FROM node:18-alpine as node
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
copy . ./
RUN npm install 
RUN npm install -g pm2
CMD ["pm2-runtime", "index.js"]