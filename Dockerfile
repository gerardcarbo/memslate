FROM node:14.16-slim
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install
COPY . .
RUN node server/setup/setup.js
CMD [ "node", "bin/www.js" ]